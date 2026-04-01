import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'
import { isValidUUID, checkRateLimit } from '@/lib/security'

// GET - Get user's progress for all courses or specific course
export async function GET(request: NextRequest) {
  // ✅ AUTH: Centralized authentication
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const courseSlug = searchParams.get('course_slug')
    const userId = searchParams.get('user_id')

    // ✅ AUTHORIZATION: Only admin can view other users' progress
    let targetUserId = auth.data.user.id
    if (userId) {
      if (!isValidUUID(userId)) {
        return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
      }
      if (auth.data.profile.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      targetUserId = userId
    }

    // ✅ VALIDATION: Sanitize courseSlug
    const cleanSlug = courseSlug ? courseSlug.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 200) : null

    // Get course access
    let accessQuery = supabase
      .from('course_access')
      .select('course_slug, granted_at, is_active')
      .eq('user_id', targetUserId)
    
    if (cleanSlug) {
      accessQuery = accessQuery.eq('course_slug', cleanSlug)
    }
    
    const { data: accessData } = await accessQuery

    if (!accessData || accessData.length === 0) {
      return NextResponse.json({ courses: [] })
    }

    // Get courses info
    const courseSlugs = accessData.map(a => a.course_slug)
    const { data: courses } = await supabase
      .from('courses')
      .select('id, slug, title, title_secondary')
      .in('slug', courseSlugs)

    // Get all modules and lessons for these courses
    const courseIds = courses?.map(c => c.id) || []
    const { data: modules } = await supabase
      .from('course_modules')
      .select(`
        id,
        course_id,
        title,
        title_secondary,
        sort_order,
        course_lessons (
          id,
          title,
          title_secondary,
          type,
          duration_minutes,
          video_url,
          content,
          content_secondary,
          sort_order,
          is_published
        )
      `)
      .in('course_id', courseIds)
      .eq('is_published', true)
      .order('sort_order')

    // Get user's lesson progress
    const allLessonIds = modules?.flatMap(m => 
      m.course_lessons?.map((l: any) => l.id) || []
    ) || []

    const { data: progressData } = await supabase
      .from('course_lesson_progress')
      .select('lesson_id, completed, watched_seconds, last_watched_at')
      .eq('client_id', targetUserId)
      .in('lesson_id', allLessonIds)

    const progressMap = new Map(progressData?.map(p => [p.lesson_id, p]) || [])

    const courseMap = new Map(courses?.map(c => [c.slug, c]) || [])
    
    const fallbackTitles: Record<string, { title: string; title_secondary: string }> = {
      'breast-augmentation-recovery': { 
        title: 'Breast Augmentation Recovery', 
        title_secondary: 'Восстановление после увеличения груди' 
      },
      'cesarean-recovery': { 
        title: 'C-Section Recovery', 
        title_secondary: 'Восстановление после кесарева сечения' 
      },
    }
    
    const result = accessData.map(access => {
      const course = courseMap.get(access.course_slug)
      const fallback = fallbackTitles[access.course_slug]
      
      const courseTitle = course?.title || fallback?.title || access.course_slug
      const courseTitleSecondary = course?.title_secondary || fallback?.title_secondary || access.course_slug

      const courseModules = course ? (modules
        ?.filter(m => m.course_id === course.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(m => ({
          id: m.id,
          title: m.title,
          title_secondary: m.title_secondary,
          lessons: (m.course_lessons || [])
            .filter((l: any) => l.is_published)
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((l: any) => {
              const progress = progressMap.get(l.id)
              return {
                id: l.id,
                title: l.title,
                title_secondary: l.title_secondary,
                // ✅ FIX: include type, video_url and content blocks in response
                type: l.type || 'video',
                duration_minutes: l.duration_minutes,
                video_url: l.video_url || null,
                content: l.content || [],
                content_secondary: l.content_secondary || [],
                completed: progress?.completed || false,
                watched_seconds: progress?.watched_seconds || 0,
                last_watched_at: progress?.last_watched_at || null,
              }
            })
        })) || []) : []

      const totalLessons = courseModules.reduce((sum, m) => sum + m.lessons.length, 0)
      const completedLessons = courseModules.reduce(
        (sum, m) => sum + m.lessons.filter(l => l.completed).length, 0
      )

      return {
        course_slug: access.course_slug,
        course_id: course?.id || null,
        course_title: courseTitle,
        course_title_secondary: courseTitleSecondary,
        granted_at: access.granted_at,
        is_active: access.is_active !== false,
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        progress_percent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        modules: courseModules,
      }
    })

    return NextResponse.json({ courses: result })
  } catch (err: any) {
    console.error('GET /api/progress error:', err)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}

// POST - Save lesson progress
export async function POST(request: NextRequest) {
  // ✅ AUTH: Centralized authentication
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  // ✅ RATE LIMIT: Max 60 progress updates per minute
  const rateCheck = await checkRateLimit(`progress:${auth.data.user.id}`, 60, 60 * 1000)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { lesson_id, completed, watched_seconds } = body

    // ✅ VALIDATION: Check lesson_id format
    if (!lesson_id || !isValidUUID(lesson_id)) {
      return NextResponse.json({ error: 'Valid lesson_id is required' }, { status: 400 })
    }

    // ✅ VALIDATION: Sanitize watched_seconds
    const cleanWatchedSeconds = typeof watched_seconds === 'number' 
      ? Math.max(0, Math.min(watched_seconds, 86400)) // Max 24 hours 
      : 0

    // Upsert progress
    const { data, error } = await supabase
      .from('course_lesson_progress')
      .upsert({
        client_id: auth.data.user.id,
        lesson_id,
        completed: completed ?? false,
        watched_seconds: cleanWatchedSeconds,
        last_watched_at: new Date().toISOString(),
      }, {
        onConflict: 'client_id,lesson_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving progress:', error)
      return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('POST /api/progress error:', err)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}
