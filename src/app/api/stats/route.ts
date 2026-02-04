import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
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
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
