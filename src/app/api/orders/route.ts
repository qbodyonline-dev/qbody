import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  // ✅ AUTH: Only admin/trainer can view all orders
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()

    // ✅ Bug 5: Added program_id to query for resolving program names
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id, user_id, course_slug, program_id, amount, currency, status,
        stripe_session_id, stripe_customer_id, stripe_payment_intent_id,
        created_at, paid_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Batch fetch user profiles (already optimized — not N+1)
    const userIds = Array.from(new Set(orders.map(o => o.user_id)))
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .in('id', userIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // ✅ Bug 6: Batch fetch program names for program:* slugs
    const programIds = orders
      .filter(o => o.program_id)
      .map(o => o.program_id)
    const uniqueProgramIds = Array.from(new Set(programIds))

    let programMap = new Map<string, string>()
    if (uniqueProgramIds.length > 0) {
      const { data: programs } = await supabase
        .from('training_programs')
        .select('id, name')
        .in('id', uniqueProgramIds)
      programMap = new Map(programs?.map(p => [p.id, p.name]) || [])
    }

    const enrichedOrders = orders.map(order => ({
      ...order,
      user_email: profileMap.get(order.user_id)?.email || 'Unknown',
      user_name: profileMap.get(order.user_id)?.full_name || 'Unknown',
      user_avatar_url: profileMap.get(order.user_id)?.avatar_url || null,
      // ✅ Bug 6: Resolved program name
      program_name: order.program_id ? programMap.get(order.program_id) || null : null,
    }))

    return NextResponse.json({ orders: enrichedOrders })
  } catch (error: any) {
    console.error('Orders API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
