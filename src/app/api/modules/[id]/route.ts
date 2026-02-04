import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// PATCH update module
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.title_ru !== undefined) updateData.title_ru = body.title_ru
    if (body.description !== undefined) updateData.description = body.description
    if (body.description_ru !== undefined) updateData.description_ru = body.description_ru
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order
    if (body.is_published !== undefined) updateData.is_published = body.is_published
    
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
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE module
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
