import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        course_slug,
        amount,
        currency,
        status,
        stripe_session_id,
        stripe_customer_id,
        stripe_payment_intent_id,
        created_at,
        paid_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Fetch user emails for each order
    const userIds = Array.from(new Set(orders.map(o => o.user_id)))
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    const enrichedOrders = orders.map(order => ({
      ...order,
      user_email: profileMap.get(order.user_id)?.email || 'Unknown',
      user_name: profileMap.get(order.user_id)?.full_name || 'Unknown',
    }))

    return NextResponse.json({ orders: enrichedOrders })
  } catch (error: any) {
    console.error('Orders API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
