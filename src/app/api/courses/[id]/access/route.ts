import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { isValidUUID } from '@/lib/security'
import { sendCourseAccessGranted, sendCourseAccessRevoked } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * Per-course access management — admin only.
 *
 * Used by the dashboard to hand a (usually private) course to one or several
 * clients at once.  Access itself lives in `course_access`, keyed by slug —
 * the same table a Stripe purchase writes to.
 */

async function getCourse(supabase: any, id: string) {
  const { data } = await supabase
    .from('courses')
    .select('id, slug, title, title_secondary, is_private, is_published')
    .eq('id', id)
    .maybeSingle()
  return data
}

// GET — clients who currently have access to this course
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }
  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const course = await getCourse(supabase, params.id)
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const { data: access } = await supabase
      .from('course_access')
      .select('id, user_id, granted_at, is_active')
      .eq('course_slug', course.slug)
      .order('granted_at', { ascending: false })

    const userIds = (access || []).map((a: any) => a.user_id)
    let profiles: any[] = []
    if (userIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds)
      profiles = data || []
    }
    const byId = new Map(profiles.map((p: any) => [p.id, p]))

    return NextResponse.json({
      course_slug: course.slug,
      is_private: !!course.is_private,
      clients: (access || []).map((a: any) => ({
        user_id: a.user_id,
        granted_at: a.granted_at,
        is_active: a.is_active,
        full_name: byId.get(a.user_id)?.full_name || null,
        email: byId.get(a.user_id)?.email || null,
        avatar_url: byId.get(a.user_id)?.avatar_url || null,
      })),
    })
  } catch (err: any) {
    console.error('GET /api/courses/[id]/access error:', err)
    return NextResponse.json({ error: 'Failed to load access list' }, { status: 500 })
  }
}

// POST — grant access to one or several clients: { client_ids: string[] }
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }
  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const raw = Array.isArray(body.client_ids) ? body.client_ids : [body.client_id]
    const clientIds: string[] = Array.from(new Set(raw.filter((id: any) => typeof id === 'string' && isValidUUID(id))))

    if (clientIds.length === 0) {
      return NextResponse.json({ error: 'client_ids is required' }, { status: 400 })
    }

    const course = await getCourse(supabase, params.id)
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Skip clients who already have a row — re-activate theirs instead
    const { data: existing } = await supabase
      .from('course_access')
      .select('user_id')
      .eq('course_slug', course.slug)
      .in('user_id', clientIds)

    const existingIds = new Set((existing || []).map((e: any) => e.user_id))
    const toInsert = clientIds.filter(id => !existingIds.has(id))
    const toReactivate = clientIds.filter(id => existingIds.has(id))

    if (toInsert.length > 0) {
      const { error } = await supabase.from('course_access').insert(
        toInsert.map(userId => ({
          user_id: userId,
          course_slug: course.slug,
          granted_at: new Date().toISOString(),
          is_active: true,
        }))
      )
      if (error) {
        console.error('Grant course access error:', error)
        return NextResponse.json({ error: 'Failed to grant access' }, { status: 500 })
      }
    }

    if (toReactivate.length > 0) {
      await supabase
        .from('course_access')
        .update({ is_active: true })
        .eq('course_slug', course.slug)
        .in('user_id', toReactivate)
    }

    // Notify the newly granted clients
    if (toInsert.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', toInsert)

      for (const profile of profiles || []) {
        if (!profile.email) continue
        try {
          await sendCourseAccessGranted(profile.email, profile.full_name || 'User', {
            courseName: course.title || course.slug,
            courseSlug: course.slug,
          })
        } catch (e) {
          console.error('Course access email failed for', profile.email, e)
        }
      }
    }

    return NextResponse.json({ success: true, granted: clientIds.length }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/courses/[id]/access error:', err)
    return NextResponse.json({ error: 'Failed to grant access' }, { status: 500 })
  }
}

// DELETE — revoke access: ?client_id=<uuid>
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }
  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    if (!clientId || !isValidUUID(clientId)) {
      return NextResponse.json({ error: 'Valid client_id query param is required' }, { status: 400 })
    }

    const course = await getCourse(supabase, params.id)
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('course_access')
      .delete()
      .eq('course_slug', course.slug)
      .eq('user_id', clientId)

    if (error) {
      console.error('Revoke course access error:', error)
      return NextResponse.json({ error: 'Failed to revoke access' }, { status: 500 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', clientId)
      .maybeSingle()

    if (profile?.email) {
      try {
        await sendCourseAccessRevoked(profile.email, profile.full_name || 'User', {
          courseName: course.title || course.slug,
        })
      } catch (e) {
        console.error('Course revoke email failed for', profile.email, e)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/courses/[id]/access error:', err)
    return NextResponse.json({ error: 'Failed to revoke access' }, { status: 500 })
  }
}
