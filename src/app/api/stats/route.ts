import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

export async function GET(request: Request) {
  // ✅ AUTH: Only admin/trainer can view stats
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()

    const [
      { count: totalClients },
      { data: accessData },
      { data: orders },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
      supabase.from('course_access').select('user_id'),
      supabase.from('orders').select('status, amount').eq('status', 'paid'),
    ])

    const activeClientIds = new Set((accessData || []).map((c: any) => c.user_id))

    return NextResponse.json({
      totalClients: totalClients || 0,
      activeClients: activeClientIds.size,
      publishedCourses: 2,
      totalCourses: 2,
      totalRevenue: (orders || []).reduce((s: number, o: any) => s + o.amount, 0),
      paidOrders: (orders || []).length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
