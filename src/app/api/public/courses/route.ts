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

// GET all published courses — public (no auth required)
export async function GET() {
  try {
    const supabase = getPublicSupabase()

    const { data, error } = await supabase
      .from('courses')
      .select(`
        id,
        slug,
        title,
        title_secondary,
        description,
        description_secondary,
        price,
        original_price,
        duration_weeks,
        image_url,
        tags,
        tags_secondary,
        course_modules (
          id,
          is_published,
          course_lessons (count)
        )
      `)
      .eq('is_published', true)
      // Private courses never show up in the catalog — they are visible only
      // to the clients they were assigned to (see /api/progress + [slug] route).
      .eq('is_private', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    const courses = (data || []).map((course: any) => {
      const publishedModules = (course.course_modules || []).filter((m: any) => m.is_published)
      const lessonsCount = publishedModules.reduce(
        (sum: number, m: any) => sum + (m.course_lessons?.[0]?.count || 0),
        0
      )
      return {
        id: course.id,
        slug: course.slug,
        title: course.title,
        title_secondary: course.title_secondary,
        description: course.description,
        description_secondary: course.description_secondary,
        price: course.price,
        original_price: course.original_price,
        duration_weeks: course.duration_weeks,
        image_url: course.image_url,
        tags: course.tags,
        tags_secondary: course.tags_secondary,
        lessons_count: lessonsCount,
      }
    })

    return NextResponse.json(courses)
  } catch (err: any) {
    console.error('GET /api/public/courses error:', err)
    return NextResponse.json({ error: 'Failed to load courses' }, { status: 500 })
  }
}
