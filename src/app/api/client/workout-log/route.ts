import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'
import { isProgramAccessible } from '@/lib/subscription'

// POST — start a new workout session
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const userId = auth.data.user.id

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { workout_id, client_program_id, scheduled_date } = body

    if (!workout_id) {
      return NextResponse.json({ error: 'workout_id required' }, { status: 400 })
    }

    // Check subscription access if linked to a program (admin bypasses)
    const isAdmin = auth.data.profile.role === 'admin'
    if (client_program_id && !isAdmin) {
      const { data: cp } = await supabase
        .from('client_programs')
        .select('status, end_date')
        .eq('id', client_program_id)
        .eq('client_id', userId)
        .single()

      if (cp) {
        const access = isProgramAccessible(cp.status, cp.end_date)
        if (!access.allowed) {
          return NextResponse.json(
            { error: access.reason || 'Program access expired. Please renew to continue training.' },
            { status: 403 }
          )
        }
      }
    }

    // Create workout log
    const { data: log, error: logErr } = await supabase
      .from('workout_logs')
      .insert({
        client_id: userId,
        workout_id,
        client_program_id: client_program_id || null,
        scheduled_date: scheduled_date || new Date().toISOString().split('T')[0],
        started_at: new Date().toISOString(),
        status: 'in_progress',
      })
      .select()
      .single()

    if (logErr) {
      console.error('Create workout log error:', logErr)
      return NextResponse.json({ error: 'Failed to create log' }, { status: 500 })
    }

    // Get workout exercises to pre-populate exercise logs
    const { data: wExercises } = await supabase
      .from('workout_exercises')
      .select('id, exercise_id, section, position, sets, reps, weight')
      .eq('workout_id', workout_id)
      .order('position', { ascending: true })

    if (wExercises && wExercises.length > 0) {
      const exerciseLogs: any[] = []
      for (const we of wExercises) {
        const numSets = we.sets || 3
        const repsPlanned = parseInt(we.reps) || null
        const weightPlanned = we.weight ? parseFloat(we.weight) : null

        for (let s = 1; s <= numSets; s++) {
          exerciseLogs.push({
            workout_log_id: log.id,
            exercise_id: we.exercise_id,
            set_number: s,
            reps_planned: repsPlanned,
            weight_planned: weightPlanned,
            completed: false,
          })
        }
      }

      const { error: elErr } = await supabase
        .from('exercise_logs')
        .insert(exerciseLogs)

      if (elErr) {
        console.error('Create exercise logs error:', elErr)
        // Non-critical, continue
      }
    }

    return NextResponse.json(log, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/client/workout-log error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// GET — list workout logs for current user
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const userId = auth.data.user.id
  const isAdmin = ['admin', 'trainer'].includes(auth.data.profile.role)
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')

  try {
    const supabase = createServerClient()
    let query = supabase
      .from('workout_logs')
      .select('*, workouts(id, name, name_secondary, type)')
      .order('started_at', { ascending: false })
      .limit(50)

    if (isAdmin && clientId) {
      query = query.eq('client_id', clientId)
    } else {
      query = query.eq('client_id', userId)
    }

    const { data, error } = await query
    if (error) {
      console.error('List workout logs error:', error)
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err: any) {
    console.error('GET /api/client/workout-log error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
