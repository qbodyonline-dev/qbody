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

    const [
      { data: clientPrograms },
      { data: workoutLogs },
      { data: checkins },
      { data: programDays },
      { data: profiles },
    ] = await Promise.all([
      supabase.from('client_programs').select('id, client_id, program_id, start_date, end_date, status, training_programs(id, name, name_ru, duration_weeks)').eq('status', 'active'),
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
      programName: string; programNameRu: string
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

      const avgRpe = clientLogs.length > 0
        ? Math.round(clientLogs.filter(l => l.rpe).reduce((s, l) => s + (l.rpe || 0), 0) / clientLogs.filter(l => l.rpe).length * 10) / 10
        : null

      const avgDuration = clientLogs.length > 0
        ? Math.round(clientLogs.filter(l => l.duration_minutes).reduce((s, l) => s + (l.duration_minutes || 0), 0) / clientLogs.filter(l => l.duration_minutes).length)
        : null

      const lastLog = clientLogs[0]

      clientCompliance.push({
        id: cp.client_id,
        name: profile.full_name || profile.email || 'Unknown',
        programName: program.name || '',
        programNameRu: program.name_ru || program.name || '',
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
    })
  } catch (err: any) {
    console.error('GET /api/analytics/training error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
