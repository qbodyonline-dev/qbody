import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { sendCourseAccessGranted, sendCourseAccessRevoked } from '@/lib/email'
import { COURSES, CourseSlug } from '@/lib/stripe'
import { requireAdmin } from '@/lib/api-auth'
import { isValidUUID } from '@/lib/security'

// GET - Get client's course access with progress — admin only
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }
  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const userId = params.id

    // Get course access
    const { data: accessData, error: accessError } = await supabase
      .from('course_access')
      .select('*')
      .eq('user_id', userId)

    if (accessError) {
      console.error('Error fetching course access:', accessError)
      return NextResponse.json({ error: 'Failed to fetch course access' }, { status: 500 })
    }

    // Get all courses for reference
    const { data: courses } = await supabase
      .from('courses')
      .select('id, slug, title, title_ru')

    // Get lesson progress for this user from course_lesson_progress table
    const { data: progressData } = await supabase
      .from('course_lesson_progress')
      .select('lesson_id, completed')
      .eq('client_id', userId)

    // Get all lessons grouped by course
    const { data: modulesData } = await supabase
      .from('course_modules')
      .select(`
        id,
        course_id,
        course_lessons (id)
      `)

    // Build course -> lessons map
    const courseLessonsMap: Record<string, string[]> = {}
    modulesData?.forEach((module: any) => {
      const courseId = module.course_id
      if (!courseLessonsMap[courseId]) {
        courseLessonsMap[courseId] = []
      }
      module.course_lessons?.forEach((lesson: any) => {
        courseLessonsMap[courseId].push(lesson.id)
      })
    })

    // Build progress map
    const completedLessons = new Set(
      progressData?.filter(p => p.completed).map(p => p.lesson_id) || []
    )

    // Build slug -> course map
    const courseBySlug = new Map(courses?.map(c => [c.slug, c]) || [])

    // Enrich access data with progress
    const enrichedAccess = accessData?.map(access => {
      const course = courseBySlug.get(access.course_slug)
      const courseId = course?.id
      const totalLessons = courseId ? courseLessonsMap[courseId]?.length || 0 : 0
      const completedCount = courseId 
        ? courseLessonsMap[courseId]?.filter(lessonId => completedLessons.has(lessonId)).length || 0
        : 0

      return {
        ...access,
        course_title: course?.title || access.course_slug,
        course_title_ru: course?.title_ru || access.course_slug,
        total_lessons: totalLessons,
        completed_lessons: completedCount,
        progress_percent: totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0,
      }
    })

    return NextResponse.json({ courses: enrichedAccess || [] })
  } catch (err: any) {
    console.error('GET /api/clients/[id]/courses error:', err)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

// POST - Grant course access to client — admin only
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const userId = params.id

    if (!isValidUUID(userId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
    }

    const body = await request.json()
    const { course_slug } = body

    if (!course_slug) {
      return NextResponse.json({ error: 'course_slug is required' }, { status: 400 })
    }

    // Check if access already exists
    const { data: existing } = await supabase
      .from('course_access')
      .select('id')
      .eq('user_id', userId)
      .eq('course_slug', course_slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Access already exists' }, { status: 400 })
    }

    // Grant access
    const { data, error } = await supabase
      .from('course_access')
      .insert({
        user_id: userId,
        course_slug,
        granted_at: new Date().toISOString(),
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error granting course access:', error)
      return NextResponse.json({ error: 'Failed to grant access' }, { status: 500 })
    }

    // Get user profile for email notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single()

    // Get course name
    const course = COURSES[course_slug as CourseSlug]
    const courseName = course?.name || course_slug

    // Send email notification
    if (profile?.email) {
      await sendCourseAccessGranted(
        profile.email,
        profile.full_name || 'User',
        {
          courseName,
          courseSlug: course_slug,
        }
      )
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('POST /api/clients/[id]/courses error:', err)
    return NextResponse.json({ error: 'Failed to grant access' }, { status: 500 })
  }
}

// PATCH - Update course access — admin only
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const userId = params.id

    if (!isValidUUID(userId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
    }

    const body = await request.json()
    const { course_slug, is_active } = body

    if (!course_slug) {
      return NextResponse.json({ error: 'course_slug is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('course_access')
      .update({ is_active })
      .eq('user_id', userId)
      .eq('course_slug', course_slug)

    if (error) {
      console.error('Error updating course access:', error)
      return NextResponse.json({ error: 'Failed to update access' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('PATCH /api/clients/[id]/courses error:', err)
    return NextResponse.json({ error: 'Failed to update access' }, { status: 500 })
  }
}

// DELETE - Revoke course access — admin only
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const userId = params.id

    if (!isValidUUID(userId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const courseSlug = searchParams.get('course_slug')

    if (!courseSlug) {
      return NextResponse.json({ error: 'course_slug is required' }, { status: 400 })
    }

    // Get user profile before deletion for email notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single()

    const { error } = await supabase
      .from('course_access')
      .delete()
      .eq('user_id', userId)
      .eq('course_slug', courseSlug)

    if (error) {
      console.error('Error revoking course access:', error)
      return NextResponse.json({ error: 'Failed to revoke access' }, { status: 500 })
    }

    // Get course name
    const course = COURSES[courseSlug as CourseSlug]
    const courseName = course?.name || courseSlug

    // Send email notification
    if (profile?.email) {
      await sendCourseAccessRevoked(
        profile.email,
        profile.full_name || 'User',
        {
          courseName,
        }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/clients/[id]/courses error:', err)
    return NextResponse.json({ error: 'Failed to revoke access' }, { status: 500 })
  }
}
