import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET all courses (admin)
export async function GET() {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        course_modules (
          id,
          title,
          title_ru,
          sort_order,
          is_published,
          course_lessons (count)
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Calculate lesson counts
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

// POST create new course
export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    
    // Generate slug from title if not provided
    const slug = body.slug || body.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    
    const { data, error } = await supabase
      .from('courses')
      .insert({
        slug,
        title: body.title,
        title_ru: body.title_ru || null,
        description: body.description || null,
        description_ru: body.description_ru || null,
        price: Math.round((body.price || 99) * 100), // convert to cents
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
