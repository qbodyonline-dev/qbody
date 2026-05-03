import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

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
      { data: documents },
      { data: docPurchases },
    ] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, created_at', { count: 'exact' }).eq('role', 'client'),
      supabase.from('orders').select('id, user_id, course_slug, amount, status, paid_at, created_at').order('created_at', { ascending: false }),
      supabase.from('course_access').select('user_id, course_slug, granted_at, is_active'),
      supabase.from('courses').select('id, slug, title, title_secondary'),
      supabase.from('course_lesson_progress').select('client_id, lesson_id, completed'),
      supabase.from('course_lessons').select('id, module_id, is_published').eq('is_published', true),
      supabase.from('documents').select('id, title, title_secondary, price'),
      supabase.from('document_purchases').select('id, user_id, document_id, amount_paid, status, stripe_session_id, created_at').order('created_at', { ascending: false }),
    ])

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const lastMonthEnd = thisMonthStart

    // ── Metrics ──
    // Course orders: amount хранится в ЦЕНТАХ
    const paidOrders = (orders || []).filter(o => o.status === 'paid')
    const courseRevenue = paidOrders.reduce((s, o) => s + o.amount, 0)

    // Document purchases: amount_paid хранится в ДОЛЛАРАХ → приводим к центам
    // Реальные продажи: status='paid' AND amount_paid > 0 (gifts имеют amount_paid=0)
    const allPaidDocPurchases = (docPurchases || []).filter(p => p.status === 'paid')
    const realDocSales = allPaidDocPurchases.filter(p => Number(p.amount_paid) > 0)
    const docGifts = allPaidDocPurchases.filter(p => Number(p.amount_paid) === 0)
    const documentRevenue = realDocSales.reduce((s, p) => s + Math.round(Number(p.amount_paid) * 100), 0)

    // Общая выручка = курсы + документы (всё в центах)
    const totalRevenue = courseRevenue + documentRevenue

    const activeClientIds = new Set((accessData || []).filter(a => a.is_active !== false).map(a => a.user_id))
    const activeClients = activeClientIds.size

    // New clients this month vs last month
    const clientsThisMonth = (profiles || []).filter(p => p.created_at >= thisMonthStart).length
    const clientsLastMonth = (profiles || []).filter(p => p.created_at >= lastMonthStart && p.created_at < lastMonthEnd).length
    const clientGrowthPct = clientsLastMonth > 0 ? Math.round(((clientsThisMonth - clientsLastMonth) / clientsLastMonth) * 100) : clientsThisMonth > 0 ? 100 : 0

    // Revenue this month vs last month (курсы + документы)
    const courseRevThisMonth = paidOrders.filter(o => o.paid_at && o.paid_at >= thisMonthStart).reduce((s, o) => s + o.amount, 0)
    const courseRevLastMonth = paidOrders.filter(o => o.paid_at && o.paid_at >= lastMonthStart && o.paid_at < lastMonthEnd).reduce((s, o) => s + o.amount, 0)
    const docRevThisMonth = realDocSales.filter(p => p.created_at >= thisMonthStart).reduce((s, p) => s + Math.round(Number(p.amount_paid) * 100), 0)
    const docRevLastMonth = realDocSales.filter(p => p.created_at >= lastMonthStart && p.created_at < lastMonthEnd).reduce((s, p) => s + Math.round(Number(p.amount_paid) * 100), 0)
    const revenueThisMonth = courseRevThisMonth + docRevThisMonth
    const revenueLastMonth = courseRevLastMonth + docRevLastMonth
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

    // ── Revenue by month (last 6 months) — курсы + документы ──
    const revenueByMonth: { month: string; value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const courseMonthRev = paidOrders
        .filter(o => o.paid_at && new Date(o.paid_at) >= d && new Date(o.paid_at) < monthEnd)
        .reduce((s, o) => s + o.amount, 0)
      const docMonthRev = realDocSales
        .filter(p => new Date(p.created_at) >= d && new Date(p.created_at) < monthEnd)
        .reduce((s, p) => s + Math.round(Number(p.amount_paid) * 100), 0)
      revenueByMonth.push({
        month: d.toLocaleString('en', { month: 'short' }),
        value: courseMonthRev + docMonthRev,
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

    // ── Document sales breakdown (per-document) ──
    const docMap = new Map((documents || []).map((d: any) => [d.id, d]))
    const docSalesById = new Map<string, { count: number; revenue: number; gifts: number }>()
    for (const p of allPaidDocPurchases) {
      const existing = docSalesById.get(p.document_id) || { count: 0, revenue: 0, gifts: 0 }
      const isGift = Number(p.amount_paid) === 0
      if (isGift) {
        existing.gifts++
      } else {
        existing.count++
        existing.revenue += Math.round(Number(p.amount_paid) * 100)
      }
      docSalesById.set(p.document_id, existing)
    }
    const documentSales = Array.from(docSalesById.entries()).map(([docId, data]) => {
      const d: any = docMap.get(docId)
      return {
        id: docId,
        title: d?.title || 'Unknown document',
        titleSecondary: d?.title_secondary || d?.title || 'Unknown document',
        count: data.count,           // только реальные продажи
        gifts: data.gifts,           // подарки отдельно
        revenue: data.revenue,       // в центах
      }
    }).sort((a, b) => b.revenue - a.revenue)

    // ── Recent orders (last 10) — объединённые курсы + документы ──
    const courseRecent = paidOrders.map(o => {
      const p = profileMap.get(o.user_id)
      const c = courseMap.get(o.course_slug)
      return {
        id: `course-${o.id}`,
        type: 'course' as const,
        clientName: p?.full_name || p?.email || 'Unknown',
        title: c?.title || o.course_slug,
        titleSecondary: c?.title_secondary || o.course_slug,
        // Совместимость со старым форматом UI:
        courseTitle: c?.title || o.course_slug,
        courseTitleSecondary: c?.title_secondary || o.course_slug,
        amount: o.amount,
        paidAt: o.paid_at,
        sortDate: o.paid_at || o.created_at,
      }
    })
    const docRecent = realDocSales.map((p: any) => {
      const prof = profileMap.get(p.user_id)
      const d: any = docMap.get(p.document_id)
      return {
        id: `doc-${p.id}`,
        type: 'document' as const,
        clientName: prof?.full_name || prof?.email || 'Unknown',
        title: d?.title || 'Document',
        titleSecondary: d?.title_secondary || d?.title || 'Document',
        // Совместимость:
        courseTitle: d?.title || 'Document',
        courseTitleSecondary: d?.title_secondary || d?.title || 'Document',
        amount: Math.round(Number(p.amount_paid) * 100), // центы
        paidAt: p.created_at,
        sortDate: p.created_at,
      }
    })
    const recentOrders = [...courseRecent, ...docRecent]
      .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
      .slice(0, 10)

    return NextResponse.json({
      metrics: {
        totalClients: totalClients || 0,
        activeClients,
        totalRevenue,                   // курсы + документы (центы)
        courseRevenue,                  // только курсы (центы)
        documentRevenue,                // только документы (центы)
        avgCompletion,
        clientGrowthPct,
        revenueGrowthPct,
        clientsThisMonth,
        revenueThisMonth,               // общая (центы)
        paidOrdersCount: paidOrders.length,
        documentSalesCount: realDocSales.length,
        documentGiftsCount: docGifts.length,
      },
      clientGrowth,
      revenueByMonth,
      courseSales,
      documentSales,
      topClients,
      recentOrders,
    })
  } catch (err: any) {
    console.error('GET /api/analytics error:', err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
