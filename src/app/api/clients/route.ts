import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

export async function GET(request: Request) {
  // ✅ AUTH: Only admin/trainer can list all clients
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, avatar_url, created_at')
      .eq('role', 'client')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Clients query error:', error)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
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
    console.error('GET /api/clients error:', err)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}
