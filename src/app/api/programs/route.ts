import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { sanitizeString } from '@/lib/security'

export const dynamic = 'force-dynamic'

const GOALS = ['weight_loss', 'muscle_gain', 'endurance', 'recovery', 'general', 'beginner', 'home']
const DIFFS = ['beginner', 'intermediate', 'advanced']

function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null
  try {
    const parsed = new URL(trimmed)
    if (!['http:', 'https:'].includes(parsed.protocol)) return null
    return trimmed.slice(0, 2000)
  } catch {
    if (trimmed.startsWith('/')) return trimmed.slice(0, 2000)
    return null
  }
}

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
          id, week_number, day_of_week, workout_id, is_rest_day, notes, notes_secondary,
          workouts:workout_id ( id, name, name_secondary, type, difficulty, estimated_duration )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      const safe = search.replace(/[%_\\()]/g, '')
      if (safe) query = query.or(`name.ilike.%${safe}%,name_secondary.ilike.%${safe}%`)
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
    const { name, name_secondary, slug, description, description_secondary, full_description, full_description_secondary, hero_image_url, duration_weeks, goal, difficulty, days } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const s = (v: string, len = 1000) => sanitizeString(v, len)

    // Auto-generate slug if not provided
    const programSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
    const safeGoal = GOALS.includes(goal) ? goal : 'general'
    const safeDiff = DIFFS.includes(difficulty) ? difficulty : 'intermediate'

    // Create program
    const { data: program, error: pError } = await supabase
      .from('training_programs')
      .insert({
        name: s(name, 500),
        name_secondary: name_secondary ? s(name_secondary, 500) : null,
        slug: programSlug,
        description: description ? s(description, 5000) : null,
        description_secondary: description_secondary ? s(description_secondary, 5000) : null,
        full_description: full_description || null,
        full_description_secondary: full_description_secondary || null,
        hero_image_url: sanitizeUrl(hero_image_url),
        duration_weeks: Math.max(1, Math.min(Number(duration_weeks) || 8, 52)),
        goal: safeGoal,
        difficulty: safeDiff,
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
          notes_secondary: d.notes_secondary || null,
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
      .select(`*, program_days ( *, workouts:workout_id ( id, name, name_secondary, type, difficulty, estimated_duration ) )`)
      .eq('id', program.id)
      .single()

    return NextResponse.json(full || program, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/programs error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
