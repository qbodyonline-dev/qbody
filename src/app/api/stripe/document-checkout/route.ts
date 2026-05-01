import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'

/**
 * POST /api/stripe/document-checkout
 * Creates a Stripe Checkout Session for a document purchase.
 * Body: { documentId: string }
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
    const { documentId } = body as { documentId: string }

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }

    const userId = auth.data.user.id
    const userEmail = auth.data.user.email
    const supabase = createServerClient()

    // Look up document
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, title, title_secondary, price, is_paid, is_active')
      .eq('id', documentId)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (!doc.is_active) {
      return NextResponse.json({ error: 'Document is not available' }, { status: 400 })
    }

    if (!doc.is_paid || !doc.price || doc.price <= 0) {
      return NextResponse.json({ error: 'This document is free — no checkout required' }, { status: 400 })
    }

    // Already paid?
    const { data: existingPaid } = await supabase
      .from('document_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('document_id', documentId)
      .eq('status', 'paid')
      .maybeSingle()

    if (existingPaid) {
      return NextResponse.json({ error: 'You already own this document' }, { status: 400 })
    }

    // Cancel any prior pending purchase rows for this user/doc
    await supabase
      .from('document_purchases')
      .update({ status: 'failed' })
      .eq('user_id', userId)
      .eq('document_id', documentId)
      .eq('status', 'pending')

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
    // Stripe wants amount in cents
    const amountCents = Math.round(Number(doc.price) * 100)
    const docTitle = doc.title || 'Document'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: docTitle,
              description: doc.title_secondary
                ? `${docTitle} / ${doc.title_secondary}`
                : 'QBody Document',
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'document',
        document_id: documentId,
        user_id: userId,
        user_email: userEmail || '',
      },
      success_url: `${appUrl}/d/${documentId}?paid=1`,
      cancel_url: `${appUrl}/d/${documentId}?canceled=1`,
    })

    // Insert pending purchase row
    await supabase.from('document_purchases').insert({
      user_id: userId,
      document_id: documentId,
      stripe_session_id: session.id,
      amount_paid: doc.price,
      currency: 'usd',
      status: 'pending',
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe document checkout error:', error)
    return NextResponse.json(
      { error: 'Payment processing failed. Please try again.' },
      { status: 500 }
    )
  }
}
