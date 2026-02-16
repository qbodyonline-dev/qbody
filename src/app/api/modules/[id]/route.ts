import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { isValidUUID, sanitizeString } from '@/lib/security'

// PATCH update module — admin only
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  if (!isValidUUID(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    const supabase = createServerClient()
    const body = await request.json()
    
    // ✅ SANITIZE: Clean input fields
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = sanitizeString(body.title, 500)
    if (body.title_secondary !== undefined) updateData.title_secondary = sanitizeString(body.title_secondary, 500)
    if (body.description !== undefined) updateData.description = sanitizeString(body.description, 5000)
    if (body.description_secondary !== undefined) updateData.description_secondary = sanitizeString(body.description_secondary, 5000)
    if (body.sort_order !== undefined) updateData.sort_order = Number(body.sort_order) || 0
    if (body.is_published !== undefined) updateData.is_published = !!body.is_published
    
    const { data, error } = await supabase
      .from('course_modules')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('PATCH /api/modules/[id] error:', err)
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 })
  }
}

// DELETE module — admin only
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  if (!isValidUUID(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('course_modules')
      .delete()
      .eq('id', params.id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/modules/[id] error:', err)
    return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 })
  }
}
