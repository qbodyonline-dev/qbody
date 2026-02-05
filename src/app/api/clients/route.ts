import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createServerClient()

    // Get all client profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, avatar_url, created_at')
      .eq('role', 'client')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get course access
    const { data: accessData } = await supabase
      .from('course_access')
      .select('user_id, course_slug, granted_at')

    // Get orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select('user_id, course_slug, amount, status, paid_at')

    // Merge
    const clients = (profiles || []).map((p: any) => ({
      ...p,
      courses: (accessData || []).filter((a: any) => a.user_id === p.id),
      orders: (ordersData || []).filter((o: any) => o.user_id === p.id),
    }))

    return NextResponse.json(clients)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
