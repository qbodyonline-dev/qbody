import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { isValidUUID } from '@/lib/security'
import { sendCourseAccessGranted, sendCourseAccessRevoked } from '@/lib/email'
import type { AssignmentMode } from '@/lib/visibility'

export const dynamic = 'force-dynamic'

/**
 * Per-course access management — admin only.
 *
 * Hands a course to one or several clients, either for free (access right
 * away) or as a personal paid offer (the client sees it and buys it; the
 * Stripe webhook grants access as usual).
 *
 * client_assignments = who may see it and on what terms
 * course_access      = who actually has it
 */

function parseMode(value: any): AssignmentMode {
  return value === 'paid' ? 'paid' : 'free'
}

async function getCourse(supabase: any, id: string) {
  const { data } = await supabase
    .from('courses')
    .select('id, slug, title, title_secondary, is_private, is_published')
    .eq('id', id)
    .maybeSingle()
  return data
}

/** Has this client actually paid for the course? Then never strip it silently. */
async function hasPaidOrder(supabase: any, userId: string, courseSlug: string) {
  const { data } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', userId)
    .eq('course_slug', courseSlug)
    .eq('status', 'paid')
    .limit(1)
  return !!(data && data.length > 0)
}

// GET — who can see / has this course
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

    const [{ data: assignments }, { data: access }] = await Promise.all([
      supabase
        .from('client_assignments')
        .select('client_id, mode, created_at')
        .eq('course_id', course.id),
      supabase
        .from('course_access')
        .select('user_id, granted_at, is_active')
        .eq('course_slug', course.slug)
        .eq('is_active', true),
    ])

    const modeByClient = new Map<string, AssignmentMode>(
      (assignments || []).map((a: any) => [a.client_id, a.mode as AssignmentMode])
    )
    const accessSet = new Set((access || []).map((a: any) => a.user_id))

    const userIds = Array.from(new Set(
      Array.from(modeByClient.keys()).concat(Array.from(accessSet))
    ))
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
      clients: userIds.map((userId) => ({
        user_id: userId,
        full_name: byId.get(userId)?.full_name || null,
        email: byId.get(userId)?.email || null,
        avatar_url: byId.get(userId)?.avatar_url || null,
        mode: modeByClient.get(userId) || 'paid',
        assigned: modeByClient.has(userId),
        has_access: accessSet.has(userId),
      })),
    })
  } catch (err: any) {
    console.error('GET /api/courses/[id]/access error:', err)
    return NextResponse.json({ error: 'Failed to load access list' }, { status: 500 })
  }
}

// POST — assign to one or several clients: { client_ids: string[], mode: 'free' | 'paid' }
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
    const mode = parseMode(body.mode)
    const raw = Array.isArray(body.client_ids) ? body.client_ids : [body.client_id]
    const clientIds: string[] = Array.from(new Set(raw.filter((id: any) => typeof id === 'string' && isValidUUID(id))))

    if (clientIds.length === 0) {
      return NextResponse.json({ error: 'client_ids is required' }, { status: 400 })
    }

    const course = await getCourse(supabase, params.id)
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // The assignment itself — this is what makes a private course visible
    const { error: aError } = await supabase
      .from('client_assignments')
      .upsert(
        clientIds.map(clientId => ({
          client_id: clientId,
          course_id: course.id,
          mode,
          assigned_by: auth.data.user.id,
        })),
        { onConflict: 'client_id,course_id' }
      )

    if (aError) {
      console.error('Assign course error:', aError)
      return NextResponse.json({ error: 'Failed to assign course' }, { status: 500 })
    }

    // Paid offer: the client buys it themselves, the webhook grants access
    if (mode === 'paid') {
      return NextResponse.json({ success: true, assigned: clientIds.length, mode }, { status: 201 })
    }

    // Free: grant access straight away
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

    return NextResponse.json({ success: true, assigned: clientIds.length, mode }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/courses/[id]/access error:', err)
    return NextResponse.json({ error: 'Failed to assign course' }, { status: 500 })
  }
}

// PATCH — switch one client between free and paid: { client_id, mode }
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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
    const mode = parseMode(body.mode)
    const clientId = body.client_id

    if (!clientId || !isValidUUID(clientId)) {
      return NextResponse.json({ error: 'Valid client_id is required' }, { status: 400 })
    }

    const course = await getCourse(supabase, params.id)
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('client_assignments')
      .upsert(
        { client_id: clientId, course_id: course.id, mode, assigned_by: auth.data.user.id },
        { onConflict: 'client_id,course_id' }
      )

    if (error) {
      console.error('Update assignment mode error:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    if (mode === 'free') {
      await supabase
        .from('course_access')
        .upsert(
          { user_id: clientId, course_slug: course.slug, granted_at: new Date().toISOString(), is_active: true },
          { onConflict: 'user_id,course_slug' }
        )
    } else if (!(await hasPaidOrder(supabase, clientId, course.slug))) {
      // Switching to "client pays": take the free grant back, but never touch
      // access that was actually paid for.
      await supabase
        .from('course_access')
        .delete()
        .eq('course_slug', course.slug)
        .eq('user_id', clientId)
    }

    return NextResponse.json({ success: true, mode })
  } catch (err: any) {
    console.error('PATCH /api/courses/[id]/access error:', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// DELETE — take the course away from a client: ?client_id=<uuid>
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

    await supabase
      .from('client_assignments')
      .delete()
      .eq('course_id', course.id)
      .eq('client_id', clientId)

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
