import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET single lesson
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('course_lessons')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('GET /api/lessons/[id] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH update lesson
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
    if (body.type !== undefined) updateData.type = body.type
    if (body.duration_minutes !== undefined) updateData.duration_minutes = body.duration_minutes
    if (body.video_url !== undefined) updateData.video_url = body.video_url
    if (body.content !== undefined) updateData.content = body.content
    if (body.content_ru !== undefined) updateData.content_ru = body.content_ru
    if (body.is_free !== undefined) updateData.is_free = body.is_free
    if (body.is_published !== undefined) updateData.is_published = body.is_published
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order
    
    const { data, error } = await supabase
      .from('course_lessons')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('PATCH /api/lessons/[id] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE lesson
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('course_lessons')
      .delete()
      .eq('id', params.id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/lessons/[id] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
