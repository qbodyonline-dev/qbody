import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { isValidUUID, sanitizeString } from '@/lib/security'

// POST create module — admin only
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // ✅ AUTH: Only admin/trainer can create modules
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  // ✅ VALIDATION: Check UUID format
  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Get max sort_order
    const { data: existing } = await supabase
      .from('course_modules')
      .select('sort_order')
      .eq('course_id', params.id)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

    const insertPayload = {
      course_id: params.id,
      title: sanitizeString(body.title || 'New Module', 500),
      title_secondary: sanitizeString(body.title_secondary || '', 500) || null,
      description: sanitizeString(body.description || '', 5000) || null,
      description_secondary: sanitizeString(body.description_secondary || '', 5000) || null,
      sort_order: nextOrder,
      is_published: body.is_published ?? true,
    }

    // Try full insert first
    const { data, error } = await supabase
      .from('course_modules')
      .insert(insertPayload)
      .select()
      .single()

    if (!error) {
      return NextResponse.json(data)
    }

    // If integer overflow (code 22003), use insert+update workaround
    if (error.code === '22003') {
      console.warn('course_modules full insert overflow, using insert+update workaround')

      const { data: minData, error: minErr } = await supabase
        .from('course_modules')
        .insert({ course_id: params.id, title: insertPayload.title })
        .select('id')
        .single()

      if (minErr) {
        console.error('Minimal module insert also failed:', minErr)
        return NextResponse.json({ error: 'Failed to create module', detail: minErr.message }, { status: 500 })
      }

      // Update with remaining fields
      const { title: _t, course_id: _c, ...updateFields } = insertPayload
      const { data: updated, error: upErr } = await supabase
        .from('course_modules')
        .update(updateFields)
        .eq('id', minData.id)
        .select()
        .single()

      if (upErr) {
        console.error('Module update after minimal insert failed:', upErr)
        const { data: fallback } = await supabase
          .from('course_modules')
          .select()
          .eq('id', minData.id)
          .single()
        return NextResponse.json(fallback || minData)
      }

      return NextResponse.json(updated)
    }

    // Other error
    console.error('POST /api/courses/[id]/modules error:', error)
    return NextResponse.json({ error: 'Failed to create module', detail: error.message, code: error.code }, { status: 500 })
  } catch (err: any) {
    console.error('POST /api/courses/[id]/modules error:', err)
    return NextResponse.json({ error: 'Failed to create module', detail: err?.message }, { status: 500 })
  }
}
