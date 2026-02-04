import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET single course with modules and lessons
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        course_modules (
          *,
          course_lessons (*)
        )
      `)
      .eq('id', params.id)
      .single()
    
    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    
    // Sort modules and lessons by sort_order
    if (data.course_modules) {
      data.course_modules.sort((a: any, b: any) => a.sort_order - b.sort_order)
      data.course_modules.forEach((m: any) => {
        if (m.course_lessons) {
          m.course_lessons.sort((a: any, b: any) => a.sort_order - b.sort_order)
        }
      })
    }
    
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('GET /api/courses/[id] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH update course
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
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.description !== undefined) updateData.description = body.description
    if (body.description_ru !== undefined) updateData.description_ru = body.description_ru
    if (body.price !== undefined) updateData.price = Math.round(body.price * 100)
    if (body.original_price !== undefined) updateData.original_price = body.original_price ? Math.round(body.original_price * 100) : null
    if (body.duration_weeks !== undefined) updateData.duration_weeks = body.duration_weeks
    if (body.image_url !== undefined) updateData.image_url = body.image_url
    if (body.is_published !== undefined) updateData.is_published = body.is_published
    
    const { data, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('PATCH /api/courses/[id] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE course
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', params.id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/courses/[id] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
