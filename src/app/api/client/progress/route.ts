import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

// GET — client's own progress: weight chart, workout history, compliance, wellness
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const userId = auth.data.user.id

  try {
    const supabase = createServerClient()

    const [
      { data: workoutLogs },
      { data: checkins },
      { data: cp },
      { data: courseProgress },
      { data: courseAccess },
      { data: checkinPhotos },
    ] = await Promise.all([
      supabase.from('workout_logs')
        .select('id, workout_id, started_at, completed_at, duration_minutes, status, rpe, mood, workouts(name, name_secondary, type)')
        .eq('client_id', userId).order('started_at', { ascending: false }).limit(100),
      supabase.from('checkins')
        .select('id, checkin_date, weight, waist, hips, chest, arm, thigh, body_fat_pct, sleep_quality, energy_level, stress_level, appetite, soreness')
        .eq('client_id', userId).order('checkin_date', { ascending: true }),
      supabase.from('client_programs')
        .select('id, start_date, training_programs(name, name_secondary, duration_weeks)')
        .eq('client_id', userId).eq('status', 'active').maybeSingle(),
      supabase.from('course_lesson_progress')
        .select('lesson_id, completed').eq('client_id', userId),
      supabase.from('course_access')
        .select('course_slug').eq('user_id', userId),
      supabase.from('checkin_photos')
        .select('id, photo_url, photo_type, checkin_id, checkins!inner(checkin_date, client_id)')
        .eq('checkins.client_id', userId)
        .order('created_at', { ascending: true }),
    ])

    const now = new Date()
    const logs = workoutLogs || []
    const completed = logs.filter(l => l.status === 'completed')

    // ═══ Weight chart ═══
    const weightData = (checkins || [])
      .filter(c => c.weight)
      .map(c => ({ date: c.checkin_date, value: c.weight }))

    // ═══ Measurements chart ═══
    const measurementFields = ['waist', 'hips', 'chest', 'arm', 'thigh', 'body_fat_pct'] as const
    const measurements: Record<string, { date: string; value: number }[]> = {}
    for (const field of measurementFields) {
      const points = (checkins || [])
        .filter(c => c[field])
        .map(c => ({ date: c.checkin_date, value: c[field] }))
      if (points.length > 0) measurements[field] = points
    }

    // ═══ Workout compliance ═══
    const compliancePct = logs.length > 0 ? Math.round((completed.length / logs.length) * 100) : 0

    // Workouts per week (last 12 weeks)
    const workoutsPerWeek: { week: string; count: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      const count = completed.filter(l => {
        const d = new Date(l.started_at)
        return d >= weekStart && d < weekEnd
      }).length
      workoutsPerWeek.push({
        week: weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        count,
      })
    }

    // ═══ Wellness trends (last 10 checkins) ═══
    const recentCheckins = [...(checkins || [])].reverse().slice(0, 10)
    const wellnessTrend: {
      dates: string[]
      sleep: (number | null)[]
      energy: (number | null)[]
      stress: (number | null)[]
    } = {
      dates: recentCheckins.map(c => c.checkin_date),
      sleep: recentCheckins.map(c => c.sleep_quality),
      energy: recentCheckins.map(c => c.energy_level),
      stress: recentCheckins.map(c => c.stress_level),
    }

    // ═══ RPE trend ═══
    const rpeTrend = completed
      .filter(l => l.rpe)
      .slice(0, 20)
      .reverse()
      .map(l => ({
        date: new Date(l.started_at).toISOString().split('T')[0],
        rpe: l.rpe,
        workout: l.workouts ? (l.workouts as any).name : '',
      }))

    // ═══ Mood distribution ═══
    const moodCounts: Record<string, number> = { great: 0, good: 0, ok: 0, tired: 0, bad: 0 }
    for (const l of completed) {
      if (l.mood && l.mood in moodCounts) moodCounts[l.mood]++
    }

    // ═══ Program progress ═══
    let programProgress = null
    if (cp) {
      const prog = cp.training_programs as any
      const startDate = new Date(cp.start_date)
      startDate.setHours(0, 0, 0, 0)
      now.setHours(0, 0, 0, 0)
      const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const currentWeek = Math.min(Math.floor(diffDays / 7) + 1, prog.duration_weeks)

      programProgress = {
        name: prog.name,
        name_secondary: prog.name_secondary,
        current_week: currentWeek,
        total_weeks: prog.duration_weeks,
        percent: Math.round((currentWeek / prog.duration_weeks) * 100),
      }
    }

    // ═══ Course progress ═══
    const completedLessons = (courseProgress || []).filter(p => p.completed).length
    const totalLessons = (courseProgress || []).length

    // ═══ Personal records ═══
    const longestWorkout = completed.reduce((max, l) => Math.max(max, l.duration_minutes || 0), 0)
    const totalMinutes = completed.reduce((sum, l) => sum + (l.duration_minutes || 0), 0)
    const streakDays = calculateStreak(completed.map(l => l.started_at))

    // ═══ Progress photos (grouped by date) ═══
    const photosByDate: Record<string, { date: string; front?: string; side?: string; back?: string }> = {}
    for (const p of (checkinPhotos || [])) {
      const date = (p.checkins as any)?.checkin_date
      if (!date || !p.photo_url) continue
      if (!photosByDate[date]) photosByDate[date] = { date }
      const t = (p.photo_type || '').toLowerCase()
      if (t === 'front') photosByDate[date].front = p.photo_url
      else if (t === 'side') photosByDate[date].side = p.photo_url
      else if (t === 'back') photosByDate[date].back = p.photo_url
      else if (!photosByDate[date].front) photosByDate[date].front = p.photo_url
    }
    const progressPhotos = Object.values(photosByDate).sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      weight: { data: weightData, current: weightData.length > 0 ? weightData[weightData.length - 1].value : null },
      measurements,
      training: {
        total_workouts: logs.length,
        completed: completed.length,
        compliance_pct: compliancePct,
        workouts_per_week: workoutsPerWeek,
        avg_duration: completed.length > 0
          ? Math.round(completed.filter(l => l.duration_minutes).reduce((s, l) => s + (l.duration_minutes || 0), 0) / completed.filter(l => l.duration_minutes).length)
          : null,
        avg_rpe: completed.filter(l => l.rpe).length > 0
          ? Math.round(completed.filter(l => l.rpe).reduce((s, l) => s + (l.rpe || 0), 0) / completed.filter(l => l.rpe).length * 10) / 10
          : null,
        rpe_trend: rpeTrend,
        mood_distribution: moodCounts,
      },
      wellness: wellnessTrend,
      program: programProgress,
      courses: { completed_lessons: completedLessons, total_lessons: totalLessons },
      records: {
        longest_workout: longestWorkout || null,
        total_minutes: totalMinutes,
        current_streak: streakDays,
        total_checkins: (checkins || []).length,
      },
      photos: progressPhotos,
    })
  } catch (err: any) {
    console.error('GET /api/client/progress error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const sorted = dates
    .map(d => new Date(d).toISOString().split('T')[0])
    .sort()
    .reverse()

  const unique = Array.from(new Set(sorted))
  let streak = 0
  const today = new Date().toISOString().split('T')[0]

  for (let i = 0; i < unique.length; i++) {
    const expected = new Date()
    expected.setDate(expected.getDate() - i)
    const expectedStr = expected.toISOString().split('T')[0]
    if (unique[i] === expectedStr || (i === 0 && unique[i] === today)) {
      streak++
    } else {
      break
    }
  }
  return streak
}
