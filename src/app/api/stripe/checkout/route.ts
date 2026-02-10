import { NextRequest, NextResponse } from 'next/server'
import { stripe, COURSES, CourseSlug } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  try {
    // ✅ AUTH: Verify user identity server-side instead of trusting client
    const auth = await authenticateRequest(request)
    if (!auth.success) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { courseSlug } = body as { courseSlug: string }

    // ✅ Use server-verified user data, not client-provided
    const userId = auth.data.user.id
    const userEmail = auth.data.user.email

    // Validate course
    if (!courseSlug || !(courseSlug in COURSES)) {
      return NextResponse.json({ error: 'Invalid course' }, { status: 400 })
    }

    const course = COURSES[courseSlug as CourseSlug]
    const supabase = createServerClient()

    // Check if user already purchased this course
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', userId)
      .eq('course_slug', courseSlug)
      .eq('status', 'paid')
      .single()

    if (existingOrder) {
      return NextResponse.json({ error: 'Course already purchased' }, { status: 400 })
    }

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 })
    let customerId: string

    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qbody.vercel.app'

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: course.currency,
            product_data: {
              name: course.name,
              description: `QBody Course: ${course.name}`,
            },
            unit_amount: course.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        course_slug: courseSlug,
        user_id: userId,
        user_email: userEmail,
      },
      success_url: `${appUrl}/client/courses?payment=success&course=${courseSlug}`,
      cancel_url: `${appUrl}/courses/${courseSlug}?payment=canceled`,
    })

    // Create pending order in database
    await supabase.from('orders').insert({
      user_id: userId,
      course_slug: courseSlug,
      stripe_session_id: session.id,
      stripe_customer_id: customerId,
      amount: course.price,
      currency: course.currency,
      status: 'pending',
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    // ✅ SECURITY: Don't expose Stripe internal error details
    return NextResponse.json(
      { error: 'Payment processing failed. Please try again.' },
      { status: 500 }
    )
  }
}
