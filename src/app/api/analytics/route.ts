import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()

    // ── Parallel data fetch ──
    const [
      { data: profiles, count: totalClients },
      { data: orders },
      { data: accessData },
      { data: courses },
      { data: lessonProgress },
      { data: lessons },
    ] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, created_at', { count: 'exact' }).eq('role', 'client'),
      supabase.from('orders').select('id, user_id, course_slug, amount, status, paid_at, created_at').order('created_at', { ascending: false }),
      supabase.from('course_access').select('user_id, course_slug, granted_at, is_active'),
      supabase.from('courses').select('id, slug, title, title_secondary'),
      supabase.from('course_lesson_progress').select('client_id, lesson_id, completed'),
      supabase.from('course_lessons').select('id, module_id, is_published').eq('is_published', true),
    ])

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const lastMonthEnd = thisMonthStart

    // ── Metrics ──
    const paidOrders = (orders || []).filter(o => o.status === 'paid')
    const totalRevenue = paidOrders.reduce((s, o) => s + o.amount, 0)

    const activeClientIds = new Set((accessData || []).filter(a => a.is_active !== false).map(a => a.user_id))
    const activeClients = activeClientIds.size

    // New clients this month vs last month
    const clientsThisMonth = (profiles || []).filter(p => p.created_at >= thisMonthStart).length
    const clientsLastMonth = (profiles || []).filter(p => p.created_at >= lastMonthStart && p.created_at < lastMonthEnd).length
    const clientGrowthPct = clientsLastMonth > 0 ? Math.round(((clientsThisMonth - clientsLastMonth) / clientsLastMonth) * 100) : clientsThisMonth > 0 ? 100 : 0

    // Revenue this month vs last month
    const revenueThisMonth = paidOrders.filter(o => o.paid_at && o.paid_at >= thisMonthStart).reduce((s, o) => s + o.amount, 0)
    const revenueLastMonth = paidOrders.filter(o => o.paid_at && o.paid_at >= lastMonthStart && o.paid_at < lastMonthEnd).reduce((s, o) => s + o.amount, 0)
    const revenueGrowthPct = revenueLastMonth > 0 ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100) : revenueThisMonth > 0 ? 100 : 0

    // Average completion %
    const publishedLessonIds = new Set((lessons || []).map(l => l.id))
    const completedLessons = (lessonProgress || []).filter(p => p.completed && publishedLessonIds.has(p.lesson_id))
    const totalPublishedLessons = publishedLessonIds.size

    // Per-client completion
    const clientLessonCounts = new Map<string, { completed: number; total: number }>()
    for (const uid of Array.from(activeClientIds)) {
      const userCompleted = completedLessons.filter(p => p.client_id === uid).length
      clientLessonCounts.set(uid, { completed: userCompleted, total: totalPublishedLessons })
    }
    const completionValues = Array.from(clientLessonCounts.values()).filter(v => v.total > 0)
    const avgCompletion = completionValues.length > 0
      ? Math.round(completionValues.reduce((s, v) => s + (v.completed / v.total) * 100, 0) / completionValues.length)
      : 0

    // ── Client growth by month (last 6 months) ──
    const clientGrowth: { month: string; value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const count = (profiles || []).filter(p => new Date(p.created_at) < monthEnd).length
      clientGrowth.push({
        month: d.toLocaleString('en', { month: 'short' }),
        value: count,
      })
    }

    // ── Revenue by month (last 6 months) ──
    const revenueByMonth: { month: string; value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthRevenue = paidOrders
        .filter(o => o.paid_at && new Date(o.paid_at) >= d && new Date(o.paid_at) < monthEnd)
        .reduce((s, o) => s + o.amount, 0)
      revenueByMonth.push({
        month: d.toLocaleString('en', { month: 'short' }),
        value: monthRevenue,
      })
    }

    // ── Course sales breakdown ──
    const courseMap = new Map((courses || []).map(c => [c.slug, c]))
    const salesBySlug = new Map<string, { count: number; revenue: number }>()
    for (const o of paidOrders) {
      const existing = salesBySlug.get(o.course_slug) || { count: 0, revenue: 0 }
      existing.count++
      existing.revenue += o.amount
      salesBySlug.set(o.course_slug, existing)
    }
    const courseSales = Array.from(salesBySlug.entries()).map(([slug, data]) => {
      const course = courseMap.get(slug)
      return {
        slug,
        title: course?.title || slug,
        titleSecondary: course?.title_secondary || slug,
        count: data.count,
        revenue: data.revenue,
      }
    }).sort((a, b) => b.revenue - a.revenue)

    // ── Top clients by completion ──
    const profileMap = new Map((profiles || []).map(p => [p.id, p]))
    const topClients = Array.from(clientLessonCounts.entries())
      .filter(([, v]) => v.total > 0)
      .map(([uid, v]) => {
        const p = profileMap.get(uid)
        return {
          id: uid,
          name: p?.full_name || p?.email || 'Unknown',
          completionPct: Math.round((v.completed / v.total) * 100),
        }
      })
      .sort((a, b) => b.completionPct - a.completionPct)
      .slice(0, 10)

    // ── Recent orders (last 10) ──
    const recentOrders = paidOrders.slice(0, 10).map(o => {
      const p = profileMap.get(o.user_id)
      const c = courseMap.get(o.course_slug)
      return {
        id: o.id,
        clientName: p?.full_name || p?.email || 'Unknown',
        courseTitle: c?.title || o.course_slug,
        courseTitleSecondary: c?.title_secondary || o.course_slug,
        amount: o.amount,
        paidAt: o.paid_at,
      }
    })

    return NextResponse.json({
      metrics: {
        totalClients: totalClients || 0,
        activeClients,
        totalRevenue,
        avgCompletion,
        clientGrowthPct,
        revenueGrowthPct,
        clientsThisMonth,
        revenueThisMonth,
        paidOrdersCount: paidOrders.length,
      },
      clientGrowth,
      revenueByMonth,
      courseSales,
      topClients,
      recentOrders,
    })
  } catch (err: any) {
    console.error('GET /api/analytics error:', err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
