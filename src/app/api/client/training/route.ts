import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'

// GET — get client's active program with full schedule
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const userId = auth.data.user.id

  try {
    const supabase = createServerClient()

    // 1. Get active client_program
    const { data: cp, error: cpErr } = await supabase
      .from('client_programs')
      .select(`
        id, start_date, end_date, status,
        training_programs (
          id, name, name_secondary, description, description_secondary,
          goal, difficulty, duration_weeks
        )
      `)
      .eq('client_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (cpErr) {
      console.error('Client program query error:', cpErr)
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }

    if (!cp) {
      return NextResponse.json({ program: null, schedule: [], today_workout: null })
    }

    const program = cp.training_programs as any
    const programId = program.id

    // 2. Get all program days with workouts + exercises
    const { data: days, error: daysErr } = await supabase
      .from('program_days')
      .select(`
        id, week_number, day_of_week, is_rest_day, notes,
        workouts (
          id, name, name_secondary, type, difficulty, estimated_duration,
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
    const currentDayOfWeek = today.getDay() // 0=Sun, 1=Mon...

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

    return NextResponse.json({
      program: {
        ...program,
        client_program_id: cp.id,
        start_date: cp.start_date,
        end_date: cp.end_date,
        status: cp.status,
        current_week: Math.min(currentWeek, program.duration_weeks),
        current_day_of_week: currentDayOfWeek,
      },
      schedule,
      today_workout: todayWorkout,
      recent_logs: logs || [],
    })
  } catch (err: any) {
    console.error('GET /api/client/training error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
