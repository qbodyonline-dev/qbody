import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

// GET — list programs with schedule and client count
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    let query = supabase
      .from('training_programs')
      .select(`
        *,
        program_days (
          id, week_number, day_of_week, workout_id, is_rest_day, notes, notes_ru,
          workouts:workout_id ( id, name, name_ru, type, difficulty, estimated_duration )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,name_ru.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Programs query error:', error)
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
    }

    // Get client counts per program
    const { data: clientCounts } = await supabase
      .from('client_programs')
      .select('program_id')
      .in('status', ['active', 'paused'])

    const countMap: Record<string, number> = {}
    for (const cp of clientCounts || []) {
      countMap[cp.program_id] = (countMap[cp.program_id] || 0) + 1
    }

    const programs = (data || []).map((p: any) => ({
      ...p,
      clients_count: countMap[p.id] || 0,
      program_days: (p.program_days || []).sort((a: any, b: any) =>
        a.week_number !== b.week_number ? a.week_number - b.week_number : a.day_of_week - b.day_of_week
      ),
    }))

    return NextResponse.json({ programs, total: count || 0 })
  } catch (err: any) {
    console.error('GET /api/programs error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST — create program with schedule
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { name, name_ru, slug, description, description_ru, duration_weeks, goal, difficulty, days } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Auto-generate slug if not provided
    const programSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)

    // Create program
    const { data: program, error: pError } = await supabase
      .from('training_programs')
      .insert({
        name,
        name_ru: name_ru || null,
        slug: programSlug,
        description: description || null,
        description_ru: description_ru || null,
        duration_weeks: duration_weeks || 8,
        goal: goal || 'general',
        difficulty: difficulty || 'intermediate',
        created_by: auth.data.user.id,
      })
      .select()
      .single()

    if (pError || !program) {
      console.error('Create program error:', pError)
      return NextResponse.json({ error: 'Failed to create program' }, { status: 500 })
    }

    // Insert days if provided
    if (days && Array.isArray(days) && days.length > 0) {
      const rows = days
        .filter((d: any) => d.workout_id || d.is_rest_day)
        .map((d: any) => ({
          program_id: program.id,
          week_number: d.week_number,
          day_of_week: d.day_of_week,
          workout_id: d.is_rest_day ? null : (d.workout_id || null),
          is_rest_day: d.is_rest_day || false,
          notes: d.notes || null,
          notes_ru: d.notes_ru || null,
        }))

      if (rows.length > 0) {
        const { error: dError } = await supabase
          .from('program_days')
          .insert(rows)

        if (dError) {
          console.error('Insert program days error:', dError)
        }
      }
    }

    // Re-fetch with days
    const { data: full } = await supabase
      .from('training_programs')
      .select(`*, program_days ( *, workouts:workout_id ( id, name, name_ru, type, difficulty, estimated_duration ) )`)
      .eq('id', program.id)
      .single()

    return NextResponse.json(full || program, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/programs error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
