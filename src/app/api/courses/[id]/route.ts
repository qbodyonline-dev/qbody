import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { isValidUUID } from '@/lib/security'

export const dynamic = 'force-dynamic'

// GET single course — admin only (public access through /api/public/courses/[slug])
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    if (!isValidUUID(params.id)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('courses')
      .select(`*, course_modules (*, course_lessons (*))`)
      .eq('id', params.id)
      .single()
    
    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    
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

// PATCH update course — admin only
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    if (!isValidUUID(params.id)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const supabase = createServerClient()
    const body = await request.json()
    
    const updateData: any = {}
    
    // Basic fields
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
    
    // Page builder fields
    if (body.hero_video_url !== undefined) updateData.hero_video_url = body.hero_video_url || null
    if (body.hero_image_url !== undefined) updateData.hero_image_url = body.hero_image_url || null
    if (body.hero_bg_color !== undefined) updateData.hero_bg_color = body.hero_bg_color || null
    if (body.hero_bg_image_url !== undefined) updateData.hero_bg_image_url = body.hero_bg_image_url || null
    if (body.rating !== undefined) updateData.rating = parseFloat(body.rating) || null
    if (body.reviews_count !== undefined) updateData.reviews_count = parseInt(body.reviews_count) || 0
    if (body.features !== undefined) updateData.features = body.features
    if (body.features_ru !== undefined) updateData.features_ru = body.features_ru
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.tags_ru !== undefined) updateData.tags_ru = body.tags_ru
    if (body.instructor_name !== undefined) updateData.instructor_name = body.instructor_name || null
    if (body.instructor_title !== undefined) updateData.instructor_title = body.instructor_title || null
    if (body.instructor_title_ru !== undefined) updateData.instructor_title_ru = body.instructor_title_ru || null
    if (body.instructor_bio !== undefined) updateData.instructor_bio = body.instructor_bio || null
    if (body.instructor_bio_ru !== undefined) updateData.instructor_bio_ru = body.instructor_bio_ru || null
    if (body.instructor_image_url !== undefined) updateData.instructor_image_url = body.instructor_image_url || null
    if (body.cta_title !== undefined) updateData.cta_title = body.cta_title || null
    if (body.cta_title_ru !== undefined) updateData.cta_title_ru = body.cta_title_ru || null
    if (body.cta_subtitle !== undefined) updateData.cta_subtitle = body.cta_subtitle || null
    if (body.cta_subtitle_ru !== undefined) updateData.cta_subtitle_ru = body.cta_subtitle_ru || null
    if (body.cta_button_text !== undefined) updateData.cta_button_text = body.cta_button_text || null
    if (body.cta_button_text_ru !== undefined) updateData.cta_button_text_ru = body.cta_button_text_ru || null
    if (body.guarantee_text !== undefined) updateData.guarantee_text = body.guarantee_text || null
    if (body.guarantee_text_ru !== undefined) updateData.guarantee_text_ru = body.guarantee_text_ru || null
    if (body.includes !== undefined) updateData.includes = body.includes
    if (body.includes_ru !== undefined) updateData.includes_ru = body.includes_ru
    
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

// DELETE course — admin only
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    if (!isValidUUID(params.id)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

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
