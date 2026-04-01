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

    const [
      { data: clientPrograms },
      { data: workoutLogs },
      { data: checkins },
      { data: programDays },
      { data: profiles },
    ] = await Promise.all([
      supabase.from('client_programs').select('id, client_id, program_id, start_date, end_date, status, training_programs(id, name, name_secondary, duration_weeks)').eq('status', 'active'),
      supabase.from('workout_logs').select('id, client_id, workout_id, scheduled_date, started_at, completed_at, duration_minutes, status, rpe, mood').order('started_at', { ascending: false }),
      supabase.from('checkins').select('id, client_id, checkin_date, weight, status, flagged, created_at').order('checkin_date', { ascending: false }),
      supabase.from('program_days').select('id, program_id, week_number, day_of_week, workout_id, is_rest_day'),
      supabase.from('profiles').select('id, full_name, email').eq('role', 'client'),
    ])

    const profileMap = new Map((profiles || []).map(p => [p.id, p]))
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // ═══ Training compliance per client ═══
    const clientCompliance: {
      id: string; name: string
      programName: string; programNameSecondary: string
      totalScheduled: number; completed: number; compliancePct: number
      avgRpe: number | null; avgDuration: number | null
      lastWorkout: string | null
    }[] = []

    for (const cp of (clientPrograms || [])) {
      const program = cp.training_programs as any
      if (!program) continue

      const profile = profileMap.get(cp.client_id)
      if (!profile) continue

      // Count scheduled training days (non-rest) for weeks elapsed
      const startDate = new Date(cp.start_date)
      const weeksElapsed = Math.min(
        Math.ceil((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)),
        program.duration_weeks
      )

      const programSchedule = (programDays || []).filter(pd => pd.program_id === program.id && !pd.is_rest_day && pd.workout_id)
      const workoutsPerWeek = programSchedule.length / (program.duration_weeks || 1)
      const totalScheduled = Math.round(workoutsPerWeek * weeksElapsed)

      // Count completed workouts
      const clientLogs = (workoutLogs || []).filter(
        wl => wl.client_id === cp.client_id && wl.status === 'completed'
          && wl.started_at >= cp.start_date
          && (!cp.end_date || wl.started_at <= cp.end_date)
      )

      const withRpe = clientLogs.filter(l => l.rpe)
      const avgRpe = withRpe.length > 0
        ? Math.round(withRpe.reduce((s, l) => s + (l.rpe || 0), 0) / withRpe.length * 10) / 10
        : null

      const withDuration = clientLogs.filter(l => l.duration_minutes)
      const avgDuration = withDuration.length > 0
        ? Math.round(withDuration.reduce((s, l) => s + (l.duration_minutes || 0), 0) / withDuration.length)
        : null

      const lastLog = clientLogs[0]

      clientCompliance.push({
        id: cp.client_id,
        name: profile.full_name || profile.email || 'Unknown',
        programName: program.name || '',
        programNameSecondary: program.name_secondary || program.name || '',
        totalScheduled: Math.max(totalScheduled, 1),
        completed: clientLogs.length,
        compliancePct: totalScheduled > 0 ? Math.min(Math.round((clientLogs.length / totalScheduled) * 100), 100) : 0,
        avgRpe,
        avgDuration,
        lastWorkout: lastLog?.started_at || null,
      })
    }

    clientCompliance.sort((a, b) => b.compliancePct - a.compliancePct)

    // ═══ Checkin compliance per client ═══
    const checkinCompliance: {
      id: string; name: string
      totalCheckins: number; checkins30d: number
      latestWeight: number | null; weightChange: number | null
      lastCheckinDate: string | null; flagged: number
      reviewedPct: number
    }[] = []

    const clientIds = new Set([
      ...(clientPrograms || []).map(cp => cp.client_id),
      ...(checkins || []).map(c => c.client_id),
    ])

    for (const clientId of Array.from(clientIds)) {
      const profile = profileMap.get(clientId)
      if (!profile) continue

      const clientCheckins = (checkins || []).filter(c => c.client_id === clientId)
      const recent = clientCheckins.filter(c => c.created_at >= thirtyDaysAgo)
      const reviewed = clientCheckins.filter(c => c.status === 'reviewed').length
      const flagged = clientCheckins.filter(c => c.flagged).length

      // Weight trend
      const withWeight = clientCheckins.filter(c => c.weight).sort((a, b) => a.checkin_date.localeCompare(b.checkin_date))
      const latestWeight = withWeight.length > 0 ? withWeight[withWeight.length - 1].weight : null
      const firstWeight = withWeight.length > 1 ? withWeight[0].weight : null
      const weightChange = latestWeight && firstWeight ? Math.round((latestWeight - firstWeight) * 10) / 10 : null

      checkinCompliance.push({
        id: clientId,
        name: profile.full_name || profile.email || 'Unknown',
        totalCheckins: clientCheckins.length,
        checkins30d: recent.length,
        latestWeight,
        weightChange,
        lastCheckinDate: clientCheckins[0]?.checkin_date || null,
        flagged,
        reviewedPct: clientCheckins.length > 0 ? Math.round((reviewed / clientCheckins.length) * 100) : 0,
      })
    }

    checkinCompliance.sort((a, b) => b.checkins30d - a.checkins30d)

    // ═══ Aggregate metrics ═══
    const allLogs = workoutLogs || []
    const completedLogs = allLogs.filter(l => l.status === 'completed')
    const recentCompletedLogs = completedLogs.filter(l => l.started_at >= thirtyDaysAgo)

    const avgComplianceAll = clientCompliance.length > 0
      ? Math.round(clientCompliance.reduce((s, c) => s + c.compliancePct, 0) / clientCompliance.length)
      : 0

    const totalCheckins = (checkins || []).length
    const newCheckins = (checkins || []).filter(c => c.status === 'new').length
    const flaggedCheckins = (checkins || []).filter(c => c.flagged).length

    // ═══ Workouts by day of week (last 30 days) ═══
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]
    for (const l of recentCompletedLogs) {
      const day = new Date(l.started_at).getDay()
      dayOfWeekCounts[day]++
    }

    // ═══ Mood distribution ═══
    const moodCounts: Record<string, number> = { great: 0, good: 0, ok: 0, tired: 0, bad: 0 }
    for (const l of completedLogs) {
      if (l.mood && l.mood in moodCounts) moodCounts[l.mood]++
    }

    // ═══ Workouts per week (last 8 weeks) ═══
    const workoutsPerWeek: { week: string; count: number }[] = []
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      const count = completedLogs.filter(l => {
        const d = new Date(l.started_at)
        return d >= weekStart && d < weekEnd
      }).length
      workoutsPerWeek.push({
        week: weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        count,
      })
    }

    // ═══ Compliance distribution ═══
    const complianceDistribution = {
      high: clientCompliance.filter(c => c.compliancePct >= 80).length,
      medium: clientCompliance.filter(c => c.compliancePct >= 50 && c.compliancePct < 80).length,
      low: clientCompliance.filter(c => c.compliancePct < 50).length,
    }

    // ═══ Compliance trend — last 8 weeks ═══
    const complianceTrend: { week: string; avgCompliance: number; clientCount: number }[] = []
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      const weekStartStr = weekStart.toISOString()
      const weekEndStr = weekEnd.toISOString()

      // For each client with active program, count completed in this week vs scheduled per week
      let totalPct = 0
      let clientCount = 0
      for (const cp of (clientPrograms || [])) {
        const program = cp.training_programs as any
        if (!program) continue
        const cpStart = new Date(cp.start_date)
        if (cpStart > weekEnd) continue // program hadn't started yet

        const schedule = (programDays || []).filter(pd => pd.program_id === program.id && !pd.is_rest_day && pd.workout_id)
        const expectedPerWeek = schedule.length / Math.max(program.duration_weeks || 1, 1)

        const weekCompleted = completedLogs.filter(l =>
          l.client_id === cp.client_id && l.started_at >= weekStartStr && l.started_at < weekEndStr
        ).length

        if (expectedPerWeek > 0) {
          totalPct += Math.min((weekCompleted / expectedPerWeek) * 100, 100)
          clientCount++
        }
      }

      complianceTrend.push({
        week: weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        avgCompliance: clientCount > 0 ? Math.round(totalPct / clientCount) : 0,
        clientCount,
      })
    }

    // ═══ Retention & renewal metrics ═══
    const { data: allClientPrograms } = await supabase
      .from('client_programs')
      .select('client_id, status, start_date, end_date')

    const allCp = allClientPrograms || []
    const uniqueClientsEver = new Set(allCp.map(cp => cp.client_id))
    const activeClientSet = new Set((clientPrograms || []).map(cp => cp.client_id))
    const completedPrograms = allCp.filter(cp => cp.status === 'completed')
    const renewed = new Set<string>()

    // A client "renewed" if they have >1 program (completed + active, or multiple completed)
    const programCountByClient = new Map<string, number>()
    for (const cp of allCp) {
      programCountByClient.set(cp.client_id, (programCountByClient.get(cp.client_id) || 0) + 1)
    }
    for (const [cid, count] of Array.from(programCountByClient.entries())) {
      if (count > 1) renewed.add(cid)
    }

    // Churned = had a completed/cancelled program, no active program now
    const completedOrCancelledClients = new Set(
      allCp.filter(cp => cp.status === 'completed' || cp.status === 'cancelled').map(cp => cp.client_id)
    )
    const churned = new Set(
      Array.from(completedOrCancelledClients).filter(cid => !activeClientSet.has(cid))
    )

    const retentionMetrics = {
      totalEverActive: uniqueClientsEver.size,
      currentlyActive: activeClientSet.size,
      churned: churned.size,
      retentionPct: uniqueClientsEver.size > 0
        ? Math.round(((uniqueClientsEver.size - churned.size) / uniqueClientsEver.size) * 100)
        : 100,
      renewed: renewed.size,
      completedPrograms: completedPrograms.length,
      renewalPct: completedOrCancelledClients.size > 0
        ? Math.round((renewed.size / completedOrCancelledClients.size) * 100)
        : 0,
    }

    // ═══ Checkin regularity ═══
    const checkinRegularity: {
      id: string; name: string
      expectedPerMonth: number; actualPerMonth: number; regularityPct: number
    }[] = []

    for (const cp of (clientPrograms || [])) {
      const profile = profileMap.get(cp.client_id)
      if (!profile) continue
      if (checkinRegularity.some(cr => cr.id === cp.client_id)) continue

      const cpStart = new Date(cp.start_date)
      const monthsActive = Math.max(1, Math.ceil((now.getTime() - cpStart.getTime()) / (30 * 24 * 60 * 60 * 1000)))
      const clientCi = (checkins || []).filter(c => c.client_id === cp.client_id)
      const actualPerMonth = Math.round((clientCi.length / monthsActive) * 10) / 10
      const expectedPerMonth = 4 // ~1 per week

      checkinRegularity.push({
        id: cp.client_id,
        name: profile.full_name || profile.email || 'Unknown',
        expectedPerMonth,
        actualPerMonth,
        regularityPct: Math.min(Math.round((actualPerMonth / expectedPerMonth) * 100), 100),
      })
    }
    checkinRegularity.sort((a, b) => a.regularityPct - b.regularityPct)

    return NextResponse.json({
      metrics: {
        activePrograms: (clientPrograms || []).length,
        totalWorkoutsCompleted: completedLogs.length,
        workoutsLast30d: recentCompletedLogs.length,
        avgCompliancePct: avgComplianceAll,
        totalCheckins,
        newCheckins,
        flaggedCheckins,
      },
      clientCompliance,
      checkinCompliance: checkinCompliance.filter(c => c.totalCheckins > 0 || clientCompliance.some(cc => cc.id === c.id)),
      workoutsPerWeek,
      dayOfWeekCounts,
      moodCounts,
      complianceDistribution,
      complianceTrend,
      retentionMetrics,
      checkinRegularity,
    })
  } catch (err: any) {
    console.error('GET /api/analytics/training error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
