import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'
import { assignedCourseIds } from '@/lib/visibility'

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

const COURSE_SELECT = `
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
  is_private,
  course_modules (
    id,
    is_published,
    course_lessons (count)
  )
`

function shape(course: any) {
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
    is_private: !!course.is_private,
    lessons_count: lessonsCount,
  }
}

// GET all published courses — public (no auth required).
// A signed-in client additionally gets the private courses assigned to them.
export async function GET(request: Request) {
  try {
    const supabase = getPublicSupabase()

    const { data, error } = await supabase
      .from('courses')
      .select(COURSE_SELECT)
      // Private courses never show up in the catalog — they are appended
      // below for the client they were personally assigned to.
      .eq('is_published', true)
      .eq('is_private', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    const courses = (data || []).map(shape)

    // ─── Private courses assigned to this client ───
    const auth = await authenticateRequest(request)
    if (auth.success) {
      const ids = await assignedCourseIds(auth.data.user.id)
      if (ids.size > 0) {
        const service = createServerClient()
        const { data: personal } = await service
          .from('courses')
          .select(COURSE_SELECT)
          .eq('is_published', true)
          .eq('is_private', true)
          .in('id', Array.from(ids))
          .order('created_at', { ascending: false })

        courses.push(...(personal || []).map(shape))
      }
    }

    return NextResponse.json(courses)
  } catch (err: any) {
    console.error('GET /api/public/courses error:', err)
    return NextResponse.json({ error: 'Failed to load courses' }, { status: 500 })
  }
}
