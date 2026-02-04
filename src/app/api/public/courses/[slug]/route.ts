import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET public course by slug
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
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
      .eq('slug', params.slug)
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
    
    // Calculate totals
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
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
