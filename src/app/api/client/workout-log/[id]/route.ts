import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'

// DB columns use _ru suffix for these 4 exercise fields, frontend expects _secondary
function mapExercise(ex: any) {
  if (!ex) return ex
  const { instructions_ru, common_mistakes_ru, regressions_ru, progressions_ru, ...rest } = ex
  return {
    ...rest,
    instructions_secondary: instructions_ru ?? null,
    common_mistakes_secondary: common_mistakes_ru ?? null,
    regressions_secondary: regressions_ru ?? null,
    progressions_secondary: progressions_ru ?? null,
  }
}

// GET — get workout log with exercise logs
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const userId = auth.data.user.id
  const isAdmin = ['admin', 'trainer'].includes(auth.data.profile.role)

  try {
    const supabase = createServerClient()

    // Get workout log
    const { data: log, error: logErr } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (logErr || !log) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (!isAdmin && log.client_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get exercise logs with exercise details
    const { data: exerciseLogs } = await supabase
      .from('exercise_logs')
      .select(`*, exercises ( * )`)

      .eq('workout_log_id', params.id)
      .order('exercise_id', { ascending: true })
      .order('set_number', { ascending: true })

    // Get workout info
    const { data: workout } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises (
          id, exercise_id, section, position, sets, reps, weight, rest_seconds, notes,
          exercises ( * )
        )
      `)
      .eq('id', log.workout_id)
      .single()

    // Sort workout_exercises by section then position
    if (workout?.workout_exercises) {
      const sectionOrder: Record<string, number> = { warmup: 0, main: 1, cooldown: 2 }
      workout.workout_exercises.sort((a: any, b: any) => {
        const sa = sectionOrder[a.section] ?? 1
        const sb = sectionOrder[b.section] ?? 1
        if (sa !== sb) return sa - sb
        return a.position - b.position
      })
    }

    // Map exercise _ru → _secondary in nested exercise objects
    const mappedExerciseLogs = (exerciseLogs || []).map((el: any) => ({
      ...el,
      exercises: mapExercise(el.exercises),
    }))

    const mappedWorkout = workout ? {
      ...workout,
      workout_exercises: (workout.workout_exercises || []).map((we: any) => ({
        ...we,
        exercises: mapExercise(we.exercises),
      })),
    } : null

    return NextResponse.json({
      ...log,
      exercise_logs: mappedExerciseLogs,
      workout: mappedWorkout,
    })
  } catch (err: any) {
    console.error('GET /api/client/workout-log/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT — update workout log (complete sets, finish workout)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const userId = auth.data.user.id
  const isAdmin = ['admin', 'trainer'].includes(auth.data.profile.role)

  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Verify ownership
    const { data: log } = await supabase
      .from('workout_logs')
      .select('client_id, started_at')
      .eq('id', params.id)
      .single()

    if (!log) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!isAdmin && log.client_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Update exercise logs if provided
    if (body.exercise_logs && Array.isArray(body.exercise_logs)) {
      for (const el of body.exercise_logs) {
        if (!el.id) continue
        const update: any = {}
        if (el.reps_done !== undefined) update.reps_done = el.reps_done
        if (el.weight_done !== undefined) update.weight_done = el.weight_done
        if (el.completed !== undefined) update.completed = el.completed
        if (el.rpe !== undefined) update.rpe = el.rpe
        if (el.notes !== undefined) update.notes = el.notes
        if (el.duration_seconds !== undefined) update.duration_seconds = el.duration_seconds

        if (Object.keys(update).length > 0) {
          await supabase
            .from('exercise_logs')
            .update(update)
            .eq('id', el.id)
            // Scope to this log — otherwise any authenticated user could
            // update arbitrary exercise_logs rows by guessing ids
            .eq('workout_log_id', params.id)
        }
      }
    }

    // Update workout log fields
    const logUpdate: any = {}
    if (body.status) logUpdate.status = body.status
    if (body.rpe !== undefined) logUpdate.rpe = body.rpe
    if (body.mood) logUpdate.mood = body.mood
    if (body.comment !== undefined) logUpdate.comment = body.comment

    if (body.status === 'completed') {
      logUpdate.completed_at = new Date().toISOString()
      // Calculate duration
      if (log.started_at) {
        const dur = Math.round((Date.now() - new Date(log.started_at).getTime()) / 60000)
        logUpdate.duration_minutes = dur
      }
    }

    if (Object.keys(logUpdate).length > 0) {
      const { error: upErr } = await supabase
        .from('workout_logs')
        .update(logUpdate)
        .eq('id', params.id)

      if (upErr) {
        console.error('Update workout log error:', upErr)
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('PUT /api/client/workout-log/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
