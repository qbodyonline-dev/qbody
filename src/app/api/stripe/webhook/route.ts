import { NextRequest, NextResponse } from 'next/server'
import { stripe, COURSES, CourseSlug } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase-server'
import Stripe from 'stripe'
import {
  sendPaymentSuccessClient,
  sendPaymentSuccessAdmin,
  sendPaymentRefundedClient,
  sendPaymentRefundedAdmin,
} from '@/lib/email'

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
        const userEmail = session.metadata?.user_email

        if (courseSlug && userId) {
          // Update order status to paid
          const { data: orderData, error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'paid',
              stripe_payment_intent_id: session.payment_intent as string,
              paid_at: new Date().toISOString(),
            })
            .eq('stripe_session_id', session.id)
            .select()
            .single()

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

          // Get user profile for email
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', userId)
            .single()

          const clientName = profile?.full_name || 'Customer'
          const clientEmail = profile?.email || userEmail || ''
          const course = COURSES[courseSlug as CourseSlug]
          const courseName = course?.name || courseSlug

          // Send email notifications
          if (clientEmail) {
            // Send to client
            await sendPaymentSuccessClient(clientEmail, clientName, {
              courseName,
              courseSlug,
              amount: orderData?.amount || session.amount_total || 0,
              currency: orderData?.currency || 'usd',
              orderId: orderData?.id || session.id,
            })

            // Send to admin
            await sendPaymentSuccessAdmin({
              clientName,
              clientEmail,
              courseName,
              amount: orderData?.amount || session.amount_total || 0,
              currency: orderData?.currency || 'usd',
              orderId: orderData?.id || session.id,
            })
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
        // Mark order as refunded and get order details
        const { data: order } = await supabase
          .from('orders')
          .select('user_id, course_slug, amount, currency')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .single()

        await supabase
          .from('orders')
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent_id', paymentIntentId)

        // Revoke course access and send notifications
        if (order) {
          await supabase
            .from('course_access')
            .delete()
            .eq('user_id', order.user_id)
            .eq('course_slug', order.course_slug)

          // Get user profile for email
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', order.user_id)
            .single()

          const clientName = profile?.full_name || 'Customer'
          const clientEmail = profile?.email || ''
          const course = COURSES[order.course_slug as CourseSlug]
          const courseName = course?.name || order.course_slug

          // Send email notifications
          if (clientEmail) {
            // Send to client
            await sendPaymentRefundedClient(clientEmail, clientName, {
              courseName,
              amount: order.amount || charge.amount_refunded,
              currency: order.currency || charge.currency,
            })

            // Send to admin
            await sendPaymentRefundedAdmin({
              clientName,
              clientEmail,
              courseName,
              amount: order.amount || charge.amount_refunded,
              currency: order.currency || charge.currency,
            })
          }
        }

        console.log(`🔄 Refund processed: ${paymentIntentId}`)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
