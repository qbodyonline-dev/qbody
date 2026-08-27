import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'

/**
 * POST /api/stripe/program-checkout
 * Creates a Stripe Checkout Session for a training program purchase.
 * Body: { programId: string }
 * Returns: { url: string }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.success) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const stripe = await getStripe()
    const body = await request.json()
    const { programId } = body as { programId: string }

    if (!programId) {
      return NextResponse.json({ error: 'programId is required' }, { status: 400 })
    }

    const userId = auth.data.user.id
    const userEmail = auth.data.user.email
    const supabase = createServerClient()

    // Look up program
    const { data: program, error: progError } = await supabase
      .from('training_programs')
      .select('id, name, name_secondary, price, original_price, is_private')
      .eq('id', programId)
      .maybeSingle()

    if (progError || !program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // A private program is not for sale — it is handed out by assignment only.
    if (program.is_private) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    if (!program.price || program.price <= 0) {
      return NextResponse.json({ error: 'Program has no price configured' }, { status: 400 })
    }

    // Check if user already has an active enrollment for this program
    const { data: existing } = await supabase
      .from('client_programs')
      .select('id')
      .eq('client_id', userId)
      .eq('program_id', programId)
      .eq('status', 'active')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'You already have an active enrollment for this program' }, { status: 400 })
    }

    // ✅ Bug 2 fix: Check for existing paid OR pending orders (prevents race condition / duplicate sessions)
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, status')
      .eq('user_id', userId)
      .eq('course_slug', `program:${programId}`)
      .in('status', ['paid', 'pending'])
      .maybeSingle()

    if (existingOrder) {
      if (existingOrder.status === 'paid') {
        return NextResponse.json({ error: 'Program already purchased' }, { status: 400 })
      }
      // Pending order exists — expire old one, create fresh session
      await supabase
        .from('orders')
        .update({ status: 'expired' })
        .eq('id', existingOrder.id)
    }

    // Find or create Stripe customer
    let customerId: string

    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 })
      if (customers.data.length > 0) {
        customerId = customers.data[0].id
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { supabase_user_id: userId },
        })
        customerId = customer.id
      }
    } else {
      const customer = await stripe.customers.create({
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qbody.vercel.app'
    const programName = program.name || 'Training Program'

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: programName,
              description: program.name_secondary
                ? `${programName} / ${program.name_secondary}`
                : `QBody Training Program`,
            },
            unit_amount: program.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'program',
        program_id: programId,
        course_slug: `program:${programId}`,
        user_id: userId,
        user_email: userEmail || '',
      },
      success_url: `${appUrl}/payment-success?type=program&id=${programId}`,
      cancel_url: `${appUrl}/payment-cancel`,
    })

    // Create pending order
    await supabase.from('orders').insert({
      user_id: userId,
      course_slug: `program:${programId}`,
      program_id: programId,
      stripe_session_id: session.id,
      stripe_customer_id: customerId,
      amount: program.price,
      currency: 'usd',
      status: 'pending',
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe program checkout error:', error)
    return NextResponse.json(
      { error: 'Payment processing failed. Please try again.' },
      { status: 500 }
    )
  }
}
