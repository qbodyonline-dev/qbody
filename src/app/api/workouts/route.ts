import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

// GET — list workouts with nested exercises
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''

    let query = supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises (
          id, exercise_id, section, position, sets, reps, weight, tempo, rest_seconds, notes, notes_secondary, superset_group,
          exercises:exercise_id ( id, name, name_secondary, muscle_groups, equipment, video_url, thumbnail_url )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,name_secondary.ilike.%${search}%`)
    }
    if (type) {
      query = query.eq('type', type)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Workouts query error:', error)
      return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 })
    }

    // Sort workout_exercises by section order then position
    const sectionOrder: Record<string, number> = { warmup: 0, main: 1, cooldown: 2 }
    const workouts = (data || []).map((w: any) => ({
      ...w,
      workout_exercises: (w.workout_exercises || []).sort((a: any, b: any) => {
        const secDiff = (sectionOrder[a.section] ?? 1) - (sectionOrder[b.section] ?? 1)
        return secDiff !== 0 ? secDiff : (a.position || 0) - (b.position || 0)
      })
    }))

    return NextResponse.json({ workouts, total: count || 0 })
  } catch (err: any) {
    console.error('GET /api/workouts error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST — create workout with exercises
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()

    const { name, name_secondary, description, description_secondary, type, difficulty, estimated_duration, exercises } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Create workout
    const { data: workout, error: wError } = await supabase
      .from('workouts')
      .insert({
        name,
        name_secondary: name_secondary || null,
        description: description || null,
        description_secondary: description_secondary || null,
        type: type || 'strength',
        difficulty: difficulty || 'intermediate',
        estimated_duration: estimated_duration || 45,
        created_by: auth.data.user.id,
      })
      .select()
      .single()

    if (wError || !workout) {
      console.error('Create workout error:', wError)
      return NextResponse.json({ error: 'Failed to create workout' }, { status: 500 })
    }

    // Insert exercises if provided
    if (exercises && Array.isArray(exercises) && exercises.length > 0) {
      const rows = exercises.map((ex: any, idx: number) => ({
        workout_id: workout.id,
        exercise_id: ex.exercise_id,
        section: ex.section || 'main',
        position: ex.position ?? idx,
        sets: ex.sets ?? 3,
        reps: ex.reps ?? '12',
        weight: ex.weight || null,
        tempo: ex.tempo || null,
        rest_seconds: ex.rest_seconds ?? 60,
        notes: ex.notes || null,
        notes_secondary: ex.notes_secondary || null,
        superset_group: ex.superset_group || null,
      }))

      const { error: exError } = await supabase
        .from('workout_exercises')
        .insert(rows)

      if (exError) {
        console.error('Insert workout exercises error:', exError)
        // Workout created but exercises failed — still return workout
      }
    }

    // Re-fetch with exercises
    const { data: full } = await supabase
      .from('workouts')
      .select(`*, workout_exercises ( *, exercises:exercise_id ( id, name, name_secondary, muscle_groups, equipment, video_url ) )`)
      .eq('id', workout.id)
      .single()

    return NextResponse.json(full || workout, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/workouts error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
