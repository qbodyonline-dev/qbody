import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin, authenticateRequest } from '@/lib/api-auth'

// GET — list all muscle groups (any authenticated user)
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('muscle_groups')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name_en', { ascending: true })

    if (error) {
      console.error('muscle_groups query error:', error)
      return NextResponse.json({ error: 'Failed to fetch muscle groups' }, { status: 500 })
    }

    return NextResponse.json({ items: data || [] })
  } catch (err: any) {
    console.error('GET /api/muscle-groups error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST — create new muscle group (admin)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { slug, name_en, name_ru, display_order } = body

    if (!slug || !name_en || !name_ru) {
      return NextResponse.json({ error: 'slug, name_en and name_ru are required' }, { status: 400 })
    }

    const cleanSlug = String(slug).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (!cleanSlug) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('muscle_groups')
      .insert({
        slug: cleanSlug,
        name_en: String(name_en).trim(),
        name_ru: String(name_ru).trim(),
        display_order: typeof display_order === 'number' ? display_order : 999,
      })
      .select()
      .single()

    if (error) {
      console.error('muscle_groups insert error:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create muscle group' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/muscle-groups error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
