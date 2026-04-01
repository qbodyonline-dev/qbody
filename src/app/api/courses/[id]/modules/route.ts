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
    
    // Use timestamp for sort_order to avoid race conditions on concurrent inserts.
    // Admin UI sends explicit sort_order values when reordering via drag-drop.
    const nextOrder = Date.now()
    
    const { data, error } = await supabase
      .from('course_modules')
      .insert({
        course_id: params.id,
        title: sanitizeString(body.title || 'New Module', 500),
        title_secondary: sanitizeString(body.title_secondary || '', 500) || null,
        description: sanitizeString(body.description || '', 5000) || null,
        description_secondary: sanitizeString(body.description_secondary || '', 5000) || null,
        sort_order: nextOrder,
        is_published: body.is_published ?? true,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('POST /api/courses/[id]/modules error:', err)
    return NextResponse.json({ error: 'Failed to create module' }, { status: 500 })
  }
}
