import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/** ✅ SECURITY: Use anon key for public reads (respects RLS) */
function getPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (url: any, options: any = {}) => fetch(url, { ...options, cache: 'no-store' as RequestCache }),
      },
    }
  )
}

// GET public course by slug
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    // ✅ VALIDATION: Sanitize slug
    const slug = params.slug?.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 200)
    if (!slug) {
      return NextResponse.json({ error: 'Invalid course slug' }, { status: 400 })
    }

    const supabase = getPublicSupabase()
    
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
          course_lessons (
            id,
            title,
            title_ru,
            type,
            duration_minutes,
            is_free,
            is_published,
            sort_order
          )
        )
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .single()
    
    if (error || !data) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    
    // Sort and filter modules and lessons
    if (data.course_modules) {
      data.course_modules.sort((a: any, b: any) => a.sort_order - b.sort_order)
      data.course_modules.forEach((m: any) => {
        if (m.course_lessons) {
          m.course_lessons = m.course_lessons.filter((l: any) => l.is_published)
          m.course_lessons.sort((a: any, b: any) => a.sort_order - b.sort_order)
        }
      })
      data.course_modules = data.course_modules.filter((m: any) => m.is_published)
    }
    
    const totalLessons = data.course_modules?.reduce((sum: number, m: any) => 
      sum + (m.course_lessons?.length || 0), 0) || 0
    const totalMinutes = data.course_modules?.reduce((sum: number, m: any) => 
      sum + (m.course_lessons?.reduce((s: number, l: any) => s + l.duration_minutes, 0) || 0), 0) || 0
    
    return NextResponse.json({
      ...data,
      lessons_count: totalLessons,
      total_hours: Math.round(totalMinutes / 60 * 10) / 10,
    })
  } catch (err: any) {
    console.error('GET /api/public/courses/[slug] error:', err)
    // ✅ SECURITY: Don't expose internal error details
    return NextResponse.json({ error: 'Failed to load course' }, { status: 500 })
  }
}
