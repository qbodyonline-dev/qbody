import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { sanitizeString } from '@/lib/security'

// GET all courses — admin only (includes unpublished)
export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        course_modules (
          id, title, title_ru, sort_order, is_published,
          course_lessons (count)
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    const courses = (data || []).map((course: any) => ({
      ...course,
      modules_count: course.course_modules?.length || 0,
      lessons_count: course.course_modules?.reduce((sum: number, m: any) => 
        sum + (m.course_lessons?.[0]?.count || 0), 0) || 0,
    }))
    
    return NextResponse.json(courses)
  } catch (err: any) {
    console.error('GET /api/courses error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST create new course — admin only
export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    
    // ✅ SANITIZE: Clean input
    const title = sanitizeString(body.title || '', 500)
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const slug = body.slug || title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    
    const { data, error } = await supabase
      .from('courses')
      .insert({
        slug: slug.slice(0, 200),
        title,
        title_ru: sanitizeString(body.title_ru || '', 500) || null,
        description: sanitizeString(body.description || '', 5000) || null,
        description_ru: sanitizeString(body.description_ru || '', 5000) || null,
        price: Math.round((body.price || 99) * 100),
        original_price: body.original_price ? Math.round(body.original_price * 100) : null,
        duration_weeks: body.duration_weeks || 8,
        image_url: body.image_url || null,
        is_published: body.is_published || false,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('POST /api/courses error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
