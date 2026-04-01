import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

// GET — single workout with exercises
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises (
          id, exercise_id, section, position, sets, reps, weight, tempo, rest_seconds, notes, notes_secondary, superset_group,
          exercises:exercise_id ( id, name, name_secondary, muscle_groups, equipment, video_url, thumbnail_url )
        )
      `)
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    // Sort exercises
    const sectionOrder: Record<string, number> = { warmup: 0, main: 1, cooldown: 2 }
    data.workout_exercises = (data.workout_exercises || []).sort((a: any, b: any) => {
      const secDiff = (sectionOrder[a.section] ?? 1) - (sectionOrder[b.section] ?? 1)
      return secDiff !== 0 ? secDiff : (a.position || 0) - (b.position || 0)
    })

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('GET /api/workouts/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT — update workout + replace exercises
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { name, name_secondary, description, description_secondary, type, difficulty, estimated_duration, exercises } = body

    // Update workout fields
    const updates: Record<string, any> = {}
    if (name !== undefined) updates.name = name
    if (name_secondary !== undefined) updates.name_secondary = name_secondary || null
    if (description !== undefined) updates.description = description || null
    if (description_secondary !== undefined) updates.description_secondary = description_secondary || null
    if (type !== undefined) updates.type = type
    if (difficulty !== undefined) updates.difficulty = difficulty
    if (estimated_duration !== undefined) updates.estimated_duration = estimated_duration

    if (Object.keys(updates).length > 0) {
      const { error: uError } = await supabase
        .from('workouts')
        .update(updates)
        .eq('id', params.id)

      if (uError) {
        console.error('Update workout error:', uError)
        return NextResponse.json({ error: 'Failed to update workout' }, { status: 500 })
      }
    }

    // Replace exercises if provided (delete all + re-insert with backup)
    if (exercises !== undefined && Array.isArray(exercises)) {
      // Backup existing exercises before deleting
      const { data: backup } = await supabase
        .from('workout_exercises')
        .select('workout_id, exercise_id, section, position, sets, reps, weight, tempo, rest_seconds, notes, notes_secondary, superset_group')
        .eq('workout_id', params.id)

      // Delete existing
      const { error: delError } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('workout_id', params.id)

      if (delError) {
        console.error('Delete workout exercises error:', delError)
        return NextResponse.json({ error: 'Failed to update workout exercises' }, { status: 500 })
      }

      // Insert new
      if (exercises.length > 0) {
        const rows = exercises.map((ex: any, idx: number) => ({
          workout_id: params.id,
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

        const { error: insError } = await supabase
          .from('workout_exercises')
          .insert(rows)

        if (insError) {
          console.error('Insert workout exercises error:', insError)
          // Restore backup on insert failure
          if (backup && backup.length > 0) {
            await supabase.from('workout_exercises').insert(backup)
          }
          return NextResponse.json({ error: 'Failed to save workout exercises' }, { status: 500 })
        }
      }
    }

    // Re-fetch
    const { data: full } = await supabase
      .from('workouts')
      .select(`*, workout_exercises ( *, exercises:exercise_id ( id, name, name_secondary, muscle_groups, equipment, video_url ) )`)
      .eq('id', params.id)
      .single()

    return NextResponse.json(full)
  } catch (err: any) {
    console.error('PUT /api/workouts/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE — delete workout (cascade deletes workout_exercises)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()

    // Check if workout is used in any program schedules
    const { count } = await supabase
      .from('program_days')
      .select('id', { count: 'exact', head: true })
      .eq('workout_id', params.id)

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete: used in ${count} program(s)` },
        { status: 409 }
      )
    }

    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Delete workout error:', error)
      return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/workouts/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
