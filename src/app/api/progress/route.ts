import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET - Get user's progress for all courses or specific course
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const courseSlug = searchParams.get('course_slug')
    const userId = searchParams.get('user_id') // For admin to view client's progress

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin is viewing client's progress
    let targetUserId = user.id
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      targetUserId = userId
    }

    // Get course access
    let accessQuery = supabase
      .from('course_access')
      .select('course_slug, granted_at, is_active')
      .eq('user_id', targetUserId)
    
    if (courseSlug) {
      accessQuery = accessQuery.eq('course_slug', courseSlug)
    }
    
    const { data: accessData } = await accessQuery

    if (!accessData || accessData.length === 0) {
      return NextResponse.json({ courses: [] })
    }

    // Get courses info
    const courseSlugs = accessData.map(a => a.course_slug)
    const { data: courses } = await supabase
      .from('courses')
      .select('id, slug, title, title_ru')
      .in('slug', courseSlugs)

    // Get all modules and lessons for these courses
    const courseIds = courses?.map(c => c.id) || []
    const { data: modules } = await supabase
      .from('course_modules')
      .select(`
        id,
        course_id,
        title,
        title_ru,
        sort_order,
        course_lessons (
          id,
          title,
          title_ru,
          duration_minutes,
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
      .from('lesson_progress')
      .select('lesson_id, completed, watched_seconds, last_watched_at')
      .eq('client_id', targetUserId)
      .in('lesson_id', allLessonIds)

    const progressMap = new Map(progressData?.map(p => [p.lesson_id, p]) || [])

    // Build response with course -> modules -> lessons structure
    const courseMap = new Map(courses?.map(c => [c.slug, c]) || [])
    
    // Fallback course titles for known courses
    const fallbackTitles: Record<string, { title: string; title_ru: string }> = {
      'breast-augmentation-recovery': { 
        title: 'Breast Augmentation Recovery', 
        title_ru: 'Восстановление после увеличения груди' 
      },
      'cesarean-recovery': { 
        title: 'C-Section Recovery', 
        title_ru: 'Восстановление после кесарева сечения' 
      },
    }
    
    const result = accessData.map(access => {
      const course = courseMap.get(access.course_slug)
      const fallback = fallbackTitles[access.course_slug]
      
      // Get course title from DB or fallback
      const courseTitle = course?.title || fallback?.title || access.course_slug
      const courseTitleRu = course?.title_ru || fallback?.title_ru || access.course_slug

      const courseModules = course ? (modules
        ?.filter(m => m.course_id === course.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(m => ({
          id: m.id,
          title: m.title,
          title_ru: m.title_ru,
          lessons: (m.course_lessons || [])
            .filter((l: any) => l.is_published)
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((l: any) => {
              const progress = progressMap.get(l.id)
              return {
                id: l.id,
                title: l.title,
                title_ru: l.title_ru,
                duration_minutes: l.duration_minutes,
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
        course_title_ru: courseTitleRu,
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
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST - Save lesson progress
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { lesson_id, completed, watched_seconds } = body

    if (!lesson_id) {
      return NextResponse.json({ error: 'lesson_id is required' }, { status: 400 })
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Upsert progress
    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert({
        client_id: user.id,
        lesson_id,
        completed: completed ?? false,
        watched_seconds: watched_seconds ?? 0,
        last_watched_at: new Date().toISOString(),
      }, {
        onConflict: 'client_id,lesson_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving progress:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('POST /api/progress error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
