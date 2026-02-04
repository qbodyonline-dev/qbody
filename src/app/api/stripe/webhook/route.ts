import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

// Disable body parsing — Stripe needs raw body for signature verification
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServerClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.payment_status === 'paid') {
        const courseSlug = session.metadata?.course_slug
        const userId = session.metadata?.user_id

        if (courseSlug && userId) {
          // Update order status to paid
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'paid',
              stripe_payment_intent_id: session.payment_intent as string,
              paid_at: new Date().toISOString(),
            })
            .eq('stripe_session_id', session.id)

          if (updateError) {
            console.error('Error updating order:', updateError)
          }

          // Grant access: insert into course_access
          const { error: accessError } = await supabase
            .from('course_access')
            .upsert({
              user_id: userId,
              course_slug: courseSlug,
              granted_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,course_slug',
            })

          if (accessError) {
            console.error('Error granting course access:', accessError)
          }

          console.log(`✅ Payment completed: ${userId} → ${courseSlug}`)
        }
      }
      break
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session

      await supabase
        .from('orders')
        .update({ status: 'expired' })
        .eq('stripe_session_id', session.id)

      break
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = charge.payment_intent as string

      if (paymentIntentId) {
        // Mark order as refunded
        const { data: order } = await supabase
          .from('orders')
          .select('user_id, course_slug')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .single()

        await supabase
          .from('orders')
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent_id', paymentIntentId)

        // Revoke course access
        if (order) {
          await supabase
            .from('course_access')
            .delete()
            .eq('user_id', order.user_id)
            .eq('course_slug', order.course_slug)
        }

        console.log(`🔄 Refund processed: ${paymentIntentId}`)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
