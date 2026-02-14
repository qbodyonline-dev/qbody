import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

// GET — single program with days + clients
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
      .from('training_programs')
      .select(`
        *,
        program_days (
          id, week_number, day_of_week, workout_id, is_rest_day, notes, notes_ru,
          workouts:workout_id ( id, name, name_ru, type, difficulty, estimated_duration )
        )
      `)
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Get assigned clients
    const { data: clients } = await supabase
      .from('client_programs')
      .select(`
        id, status, start_date, end_date, current_week, created_at,
        profiles:client_id ( id, full_name, email, avatar_url )
      `)
      .eq('program_id', params.id)
      .in('status', ['active', 'paused', 'completed'])
      .order('created_at', { ascending: false })

    // Sort days
    data.program_days = (data.program_days || []).sort((a: any, b: any) =>
      a.week_number !== b.week_number ? a.week_number - b.week_number : a.day_of_week - b.day_of_week
    )

    return NextResponse.json({ ...data, assigned_clients: clients || [] })
  } catch (err: any) {
    console.error('GET /api/programs/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT — update program + replace days
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
    const { name, name_ru, slug, description, description_ru, duration_weeks, goal, difficulty, is_active, days } = body

    // Update program fields
    const updates: Record<string, any> = {}
    if (name !== undefined) updates.name = name
    if (name_ru !== undefined) updates.name_ru = name_ru || null
    if (slug !== undefined) updates.slug = slug || null
    if (description !== undefined) updates.description = description || null
    if (description_ru !== undefined) updates.description_ru = description_ru || null
    if (duration_weeks !== undefined) updates.duration_weeks = duration_weeks
    if (goal !== undefined) updates.goal = goal
    if (difficulty !== undefined) updates.difficulty = difficulty
    if (is_active !== undefined) updates.is_active = is_active

    if (Object.keys(updates).length > 0) {
      const { error: uError } = await supabase
        .from('training_programs')
        .update(updates)
        .eq('id', params.id)

      if (uError) {
        console.error('Update program error:', uError)
        return NextResponse.json({ error: 'Failed to update program' }, { status: 500 })
      }
    }

    // Replace days if provided
    if (days !== undefined && Array.isArray(days)) {
      // Delete existing days
      await supabase.from('program_days').delete().eq('program_id', params.id)

      // Insert new days
      if (days.length > 0) {
        const rows = days
          .filter((d: any) => d.workout_id || d.is_rest_day)
          .map((d: any) => ({
            program_id: params.id,
            week_number: d.week_number,
            day_of_week: d.day_of_week,
            workout_id: d.is_rest_day ? null : (d.workout_id || null),
            is_rest_day: d.is_rest_day || false,
            notes: d.notes || null,
            notes_ru: d.notes_ru || null,
          }))

        if (rows.length > 0) {
          const { error: insError } = await supabase.from('program_days').insert(rows)
          if (insError) console.error('Insert program days error:', insError)
        }
      }
    }

    // Re-fetch
    const { data: full } = await supabase
      .from('training_programs')
      .select(`*, program_days ( *, workouts:workout_id ( id, name, name_ru, type, difficulty, estimated_duration ) )`)
      .eq('id', params.id)
      .single()

    return NextResponse.json(full)
  } catch (err: any) {
    console.error('PUT /api/programs/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE — delete program (cascade deletes program_days)
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

    // Check for active client assignments
    const { data: activeClients } = await supabase
      .from('client_programs')
      .select('id')
      .eq('program_id', params.id)
      .eq('status', 'active')

    if (activeClients && activeClients.length > 0) {
      return NextResponse.json({
        error: `Cannot delete: ${activeClients.length} active client(s) assigned`
      }, { status: 409 })
    }

    const { error } = await supabase
      .from('training_programs')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Delete program error:', error)
      return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/programs/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
