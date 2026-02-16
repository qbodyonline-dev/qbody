import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin, authenticateRequest } from '@/lib/api-auth'

// GET — list exercises with optional filters
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || ''
    const muscle = searchParams.get('muscle') || ''
    const equipment = searchParams.get('equipment') || ''
    const category = searchParams.get('category') || ''
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('exercises')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`name.ilike.%${search}%,name_secondary.ilike.%${search}%`)
    }
    if (muscle) {
      query = query.contains('muscle_groups', [muscle])
    }
    if (equipment) {
      query = query.eq('equipment', equipment)
    }
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Exercises query error:', error)
      return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 })
    }

    return NextResponse.json({ exercises: data || [], total: count || 0 })
  } catch (err: any) {
    console.error('GET /api/exercises error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST — create new exercise
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()

    const {
      name, name_secondary, description, description_secondary,
      muscle_groups, equipment, category, difficulty,
      instructions, instructions_secondary,
      common_mistakes, common_mistakes_secondary,
      regressions, regressions_secondary,
      progressions, progressions_secondary,
      video_url, thumbnail_url
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('exercises')
      .insert({
        name,
        name_secondary: name_secondary || null,
        description: description || null,
        description_secondary: description_secondary || null,
        muscle_groups: muscle_groups || [],
        equipment: equipment || 'bodyweight',
        category: category || 'strength',
        difficulty: difficulty || 'intermediate',
        instructions: instructions || null,
        instructions_secondary: instructions_secondary || null,
        common_mistakes: common_mistakes || null,
        common_mistakes_secondary: common_mistakes_secondary || null,
        regressions: regressions || null,
        regressions_secondary: regressions_secondary || null,
        progressions: progressions || null,
        progressions_secondary: progressions_secondary || null,
        video_url: video_url || null,
        thumbnail_url: thumbnail_url || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Create exercise error:', error)
      return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/exercises error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
