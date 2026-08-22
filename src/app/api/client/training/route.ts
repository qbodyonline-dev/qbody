import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'
import { autoExpirePrograms, isProgramAccessible, daysRemaining } from '@/lib/subscription'
import { findCatchupWorkout, addDaysStr, localDateStr } from '@/lib/catchup'

export const dynamic = 'force-dynamic'

// GET — get client's active program with full schedule
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const userId = auth.data.user.id

  try {
    const supabase = createServerClient()

    // Auto-expire overdue programs for this client
    await autoExpirePrograms(supabase, userId)

    // 1. Get client_program — by ID or active
    const { searchParams } = new URL(request.url)
    const requestedProgramId = searchParams.get('program_id')

    let cpQuery = supabase
      .from('client_programs')
      .select(`
        id, start_date, end_date, status,
        training_programs (
          id, name, name_secondary, description, description_secondary,
          goal, difficulty, duration_weeks
        )
      `)
      .eq('client_id', userId)

    if (requestedProgramId) {
      cpQuery = cpQuery.eq('id', requestedProgramId)
    } else {
      cpQuery = cpQuery.eq('status', 'active')
    }

    const { data: cp, error: cpErr } = await cpQuery.maybeSingle()

    if (cpErr) {
      console.error('Client program query error:', cpErr)
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }

    if (!cp) {
      return NextResponse.json({ program: null, schedule: [], today_workout: null })
    }

    const program = cp.training_programs as any
    const programId = program.id

    // Subscription access check (admin bypasses)
    const isAdmin = auth.data.profile.role === 'admin'
    const access = isProgramAccessible(cp.status, cp.end_date)
    if (!access.allowed && !isAdmin) {
      return NextResponse.json({
        program: {
          ...program,
          client_program_id: cp.id,
          start_date: cp.start_date,
          end_date: cp.end_date,
          status: cp.status,
          days_remaining: daysRemaining(cp.end_date),
          access_blocked: true,
          access_reason: access.reason,
        },
        schedule: [],
        today_workout: null,
        recent_logs: [],
      })
    }

    // 2. Get all program days with workouts + exercises
    const { data: days, error: daysErr } = await supabase
      .from('program_days')
      .select(`
        id, week_number, day_of_week, is_rest_day, notes,
        workouts (
          id, name, name_secondary, type, difficulty, estimated_duration, image_url,
          workout_exercises (
            id, section, position, sets, reps, weight, rest_seconds, notes,
            exercises (
              id, name, name_secondary, muscle_groups, equipment, category,
              video_url
            )
          )
        )
      `)
      .eq('program_id', programId)
      .order('week_number', { ascending: true })
      .order('day_of_week', { ascending: true })

    if (daysErr) {
      console.error('Program days query error:', daysErr)
      return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
    }

    // Sort exercises within each workout by section then position
    const sectionOrder: Record<string, number> = { warmup: 0, main: 1, cooldown: 2 }
    const schedule = (days || []).map((day: any) => {
      if (day.workouts && day.workouts.workout_exercises) {
        day.workouts.workout_exercises.sort((a: any, b: any) => {
          const sa = sectionOrder[a.section] ?? 1
          const sb = sectionOrder[b.section] ?? 1
          if (sa !== sb) return sa - sb
          return a.position - b.position
        })
      }
      return day
    })

    // 3. Calculate today's workout
    const startDate = new Date(cp.start_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    startDate.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const currentWeek = Math.floor(diffDays / 7) + 1
    const currentDayOfWeek = today.getDay() || 7 // Convert JS 0=Sun to DB 7=Sun; 1-6 stays Mon-Sat

    let todayWorkout = null
    if (diffDays >= 0 && currentWeek <= program.duration_weeks) {
      todayWorkout = schedule.find(
        (d: any) => d.week_number === currentWeek && d.day_of_week === currentDayOfWeek
      ) || null
    }

    // 4. Get recent workout logs for this client
    const { data: logs } = await supabase
      .from('workout_logs')
      .select('id, workout_id, started_at, completed_at, status')
      .eq('client_id', userId)
      .order('started_at', { ascending: false })
      .limit(20)

    // Workout missed earlier this program week, offered only on a free / rest day.
    const catchupWorkout = findCatchupWorkout({
      weekDays: schedule.filter((d: any) => d.week_number === currentWeek),
      weekStart: addDaysStr(String(cp.start_date).slice(0, 10), (currentWeek - 1) * 7),
      todayStr: localDateStr(today),
      logs: logs || [],
      clientProgramId: cp.id,
      todayIsFree: !todayWorkout || (todayWorkout as any).is_rest_day === true || !(todayWorkout as any).workouts,
    })

    return NextResponse.json({
      program: {
        ...program,
        client_program_id: cp.id,
        start_date: cp.start_date,
        end_date: cp.end_date,
        status: cp.status,
        current_week: Math.min(currentWeek, program.duration_weeks),
        current_day_of_week: currentDayOfWeek,
        days_remaining: daysRemaining(cp.end_date),
        access_blocked: false,
      },
      schedule,
      today_workout: todayWorkout,
      catchup_workout: catchupWorkout,
      recent_logs: logs || [],
    })
  } catch (err: any) {
    console.error('GET /api/client/training error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
