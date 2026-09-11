import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { isValidUUID } from '@/lib/security'

export const dynamic = 'force-dynamic'

/**
 * Landing template config for a course — admin only.
 *
 * The config lives in site_settings under `course_landing_{course.id}`
 * (id-based on purpose: slug renames must not detach the landing, and the
 * /api/settings key sanitizer strips ':'). The public course API reads the
 * same row; this route is the dashboard's read/write pair for it.
 */

const KEY = (courseId: string) => `course_landing_${courseId}`
const MAX_DATA_BYTES = 200_000

// GET — config + the course shaped the way the landing template consumes it
// (for the editor's live preview, including unpublished courses)
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

    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        id, slug, title, title_secondary, price, is_published, is_private,
        hero_video_url, instructor_image_url,
        course_modules (
          id, title, title_secondary, sort_order, is_published,
          course_lessons ( id, title, title_secondary, sort_order, is_published )
        )
      `)
      .eq('id', params.id)
      .maybeSingle()

    if (error || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Mirror the public API's shaping so the preview matches production
    const modules = (course.course_modules || [])
      .filter((m: any) => m.is_published)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((m: any) => ({
        ...m,
        course_lessons: (m.course_lessons || [])
          .filter((l: any) => l.is_published)
          .sort((a: any, b: any) => a.sort_order - b.sort_order),
      }))

    const { data: row } = await supabase
      .from('site_settings')
      .select('value, updated_at')
      .eq('key', KEY(course.id))
      .maybeSingle()

    const value = (row?.value as any) || {}

    return NextResponse.json({
      enabled: !!value.enabled,
      data: value.data || {},
      // Редактор возвращает это в PUT как baseUpdatedAt — защита от затирания
      // правок, сохранённых из другой вкладки/сессии
      updatedAt: (row as any)?.updated_at ?? null,
      course: { ...course, course_modules: modules },
    })
  } catch (err: any) {
    console.error('GET /api/courses/[id]/landing error:', err)
    return NextResponse.json({ error: 'Failed to load landing config' }, { status: 500 })
  }
}

// PUT — save config: { enabled: boolean, data: object }
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }
  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()

    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('id', params.id)
      .maybeSingle()

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const body = await request.json()
    const enabled = !!body.enabled
    const data = body.data

    if (data !== undefined && data !== null && (typeof data !== 'object' || Array.isArray(data))) {
      return NextResponse.json({ error: 'data must be an object' }, { status: 400 })
    }
    if (data && Buffer.byteLength(JSON.stringify(data), 'utf8') > MAX_DATA_BYTES) {
      return NextResponse.json({ error: 'Landing data is too large' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('site_settings')
      .select('value, updated_at')
      .eq('key', KEY(course.id))
      .maybeSingle()

    // Оптимистичная блокировка: редактор присылает updated_at, с которым он
    // загрузился; расхождение = конфиг уже сохранили из другой вкладки/сессии
    if (body.baseUpdatedAt !== undefined && ((existing as any)?.updated_at ?? null) !== body.baseUpdatedAt) {
      return NextResponse.json({ error: 'Landing was modified elsewhere', conflict: true }, { status: 409 })
    }

    // data не прислали — переключаем только флаг, контент не трогаем
    const nextData = data === undefined || data === null
      ? (((existing?.value as any) || {}).data || {})
      : data

    const { data: saved, error } = await supabase
      .from('site_settings')
      .upsert(
        { key: KEY(course.id), value: { enabled, data: nextData }, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
      .select('updated_at')
      .single()

    if (error) {
      console.error('Save landing config error:', error)
      return NextResponse.json({ error: 'Failed to save landing config' }, { status: 500 })
    }

    return NextResponse.json({ success: true, enabled, updatedAt: (saved as any)?.updated_at ?? null })
  } catch (err: any) {
    console.error('PUT /api/courses/[id]/landing error:', err)
    return NextResponse.json({ error: 'Failed to save landing config' }, { status: 500 })
  }
}
