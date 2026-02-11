import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

// GET — training progress for a specific client (admin view)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const clientId = params.id

  try {
    const supabase = createServerClient()

    const [
      { data: workoutLogs },
      { data: checkins },
      { data: clientProgram },
    ] = await Promise.all([
      supabase.from('workout_logs')
        .select('id, workout_id, scheduled_date, started_at, completed_at, duration_minutes, status, rpe, mood, comment, workouts(name, name_ru, type)')
        .eq('client_id', clientId)
        .order('started_at', { ascending: false })
        .limit(100),
      supabase.from('checkins')
        .select('id, checkin_date, weight, waist, hips, body_fat_pct, sleep_quality, energy_level, stress_level, status, flagged')
        .eq('client_id', clientId)
        .order('checkin_date', { ascending: true }),
      supabase.from('client_programs')
        .select('id, start_date, end_date, status, training_programs(name, name_ru, duration_weeks)')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .maybeSingle(),
    ])

    // Weight chart data
    const weightChart = (checkins || [])
      .filter(c => c.weight)
      .map(c => ({ date: c.checkin_date, weight: c.weight }))

    // Waist chart data
    const waistChart = (checkins || [])
      .filter(c => c.waist)
      .map(c => ({ date: c.checkin_date, waist: c.waist }))

    // Workout history summary
    const logs = workoutLogs || []
    const completed = logs.filter(l => l.status === 'completed')
    const skipped = logs.filter(l => l.status === 'skipped')
    const totalScheduled = logs.length
    const compliancePct = totalScheduled > 0 ? Math.round((completed.length / totalScheduled) * 100) : 0

    const avgRpe = completed.filter(l => l.rpe).length > 0
      ? Math.round(completed.filter(l => l.rpe).reduce((s, l) => s + (l.rpe || 0), 0) / completed.filter(l => l.rpe).length * 10) / 10
      : null

    const avgDuration = completed.filter(l => l.duration_minutes).length > 0
      ? Math.round(completed.filter(l => l.duration_minutes).reduce((s, l) => s + (l.duration_minutes || 0), 0) / completed.filter(l => l.duration_minutes).length)
      : null

    // Workouts per week (last 8 weeks)
    const now = new Date()
    const workoutsPerWeek: { week: string; completed: number; missed: number }[] = []
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      const weekCompleted = completed.filter(l => {
        const d = new Date(l.started_at)
        return d >= weekStart && d < weekEnd
      }).length
      const weekSkipped = logs.filter(l => {
        const d = l.scheduled_date ? new Date(l.scheduled_date) : null
        return d && d >= weekStart && d < weekEnd && l.status === 'skipped'
      }).length
      workoutsPerWeek.push({
        week: weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        completed: weekCompleted,
        missed: weekSkipped,
      })
    }

    // Checkin frequency (last 8 weeks)
    const checkinsByWeek: { week: string; count: number }[] = []
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      const count = (checkins || []).filter(c => {
        const d = new Date(c.checkin_date)
        return d >= weekStart && d < weekEnd
      }).length
      checkinsByWeek.push({
        week: weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        count,
      })
    }

    // Wellness averages (last 5 checkins)
    const recentCheckins = [...(checkins || [])].reverse().slice(0, 5)
    const wellnessAvg = {
      sleep: recentCheckins.filter(c => c.sleep_quality).length > 0
        ? Math.round(recentCheckins.filter(c => c.sleep_quality).reduce((s, c) => s + c.sleep_quality, 0) / recentCheckins.filter(c => c.sleep_quality).length * 10) / 10
        : null,
      energy: recentCheckins.filter(c => c.energy_level).length > 0
        ? Math.round(recentCheckins.filter(c => c.energy_level).reduce((s, c) => s + c.energy_level, 0) / recentCheckins.filter(c => c.energy_level).length * 10) / 10
        : null,
      stress: recentCheckins.filter(c => c.stress_level).length > 0
        ? Math.round(recentCheckins.filter(c => c.stress_level).reduce((s, c) => s + c.stress_level, 0) / recentCheckins.filter(c => c.stress_level).length * 10) / 10
        : null,
    }

    return NextResponse.json({
      program: clientProgram ? {
        name: (clientProgram.training_programs as any)?.name,
        name_ru: (clientProgram.training_programs as any)?.name_ru,
        duration_weeks: (clientProgram.training_programs as any)?.duration_weeks,
        start_date: clientProgram.start_date,
        end_date: clientProgram.end_date,
      } : null,
      training: {
        totalWorkouts: totalScheduled,
        completed: completed.length,
        skipped: skipped.length,
        compliancePct,
        avgRpe,
        avgDuration,
        workoutsPerWeek,
        recentLogs: logs.slice(0, 10),
      },
      checkins: {
        total: (checkins || []).length,
        weightChart,
        waistChart,
        checkinsByWeek,
        wellnessAvg,
      },
    })
  } catch (err: any) {
    console.error('GET /api/clients/[id]/progress error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
