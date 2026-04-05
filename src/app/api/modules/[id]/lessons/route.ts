import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { isValidUUID, sanitizeString } from '@/lib/security'

// POST create lesson — admin only
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })

  // ✅ VALIDATION: Check UUID format
  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid module ID' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Get max sort_order
    const { data: existing } = await supabase
      .from('course_lessons')
      .select('sort_order')
      .eq('module_id', params.id)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

    const allowedTypes = ['video', 'text', 'task', 'quiz', 'assignment']
    const lessonType = allowedTypes.includes(body.type) ? body.type : 'video'

    const insertPayload = {
      module_id: params.id,
      title: sanitizeString(body.title || 'New Lesson', 500),
      title_secondary: sanitizeString(body.title_secondary || '', 500) || null,
      type: lessonType,
      duration_minutes: body.duration_minutes || 10,
      video_url: body.video_url || null,
      content: body.content || [],
      content_secondary: body.content_secondary || [],
      is_free: body.is_free || false,
      is_published: body.is_published ?? true,
      sort_order: nextOrder,
    }

    // Try full insert first
    const { data, error } = await supabase
      .from('course_lessons')
      .insert(insertPayload)
      .select()
      .single()

    if (!error) {
      return NextResponse.json(data)
    }

    // If integer overflow (code 22003), use insert+update workaround
    if (error.code === '22003') {
      console.warn('course_lessons full insert overflow, using insert+update workaround')

      const { data: minData, error: minErr } = await supabase
        .from('course_lessons')
        .insert({ module_id: params.id, title: insertPayload.title })
        .select('id')
        .single()

      if (minErr) {
        console.error('Minimal lesson insert also failed:', minErr)
        return NextResponse.json({ error: 'Failed to create lesson', detail: minErr.message }, { status: 500 })
      }

      // Update with remaining fields
      const { title: _t, module_id: _m, ...updateFields } = insertPayload
      const { data: updated, error: upErr } = await supabase
        .from('course_lessons')
        .update(updateFields)
        .eq('id', minData.id)
        .select()
        .single()

      if (upErr) {
        console.error('Lesson update after minimal insert failed:', upErr)
        // Return what we have
        const { data: fallback } = await supabase
          .from('course_lessons')
          .select()
          .eq('id', minData.id)
          .single()
        return NextResponse.json(fallback || minData)
      }

      return NextResponse.json(updated)
    }

    // Other error
    console.error('POST /api/modules/[id]/lessons supabase error:', error)
    return NextResponse.json({ error: 'Failed to create lesson', detail: error.message, code: error.code }, { status: 500 })
  } catch (err: any) {
    console.error('POST /api/modules/[id]/lessons error:', err)
    return NextResponse.json({ error: 'Failed to create lesson', detail: err?.message }, { status: 500 })
  }
}
