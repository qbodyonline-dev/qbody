import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { isValidUUID, sanitizeString } from '@/lib/security'

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
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
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
    
    // ✅ SANITIZE: Clean all text input fields
    const s = (v: string, len = 1000) => sanitizeString(v, len)
    const updateData: any = {}
    
    // Basic fields
    if (body.title !== undefined) updateData.title = s(body.title, 500)
    if (body.title_ru !== undefined) updateData.title_ru = s(body.title_ru, 500)
    if (body.slug !== undefined) updateData.slug = (body.slug || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 200)
    if (body.description !== undefined) updateData.description = s(body.description, 5000)
    if (body.description_ru !== undefined) updateData.description_ru = s(body.description_ru, 5000)
    if (body.price !== undefined) updateData.price = Math.round(Math.max(0, Number(body.price) || 0) * 100)
    if (body.original_price !== undefined) updateData.original_price = body.original_price ? Math.round(Math.max(0, Number(body.original_price)) * 100) : null
    if (body.duration_weeks !== undefined) updateData.duration_weeks = Math.max(1, Math.min(Number(body.duration_weeks) || 8, 104))
    if (body.image_url !== undefined) updateData.image_url = body.image_url || null
    if (body.is_published !== undefined) updateData.is_published = !!body.is_published
    
    // Page builder fields
    if (body.hero_video_url !== undefined) updateData.hero_video_url = body.hero_video_url || null
    if (body.hero_image_url !== undefined) updateData.hero_image_url = body.hero_image_url || null
    if (body.hero_bg_color !== undefined) updateData.hero_bg_color = (body.hero_bg_color || '').replace(/[^a-zA-Z0-9#(),. ]/g, '').slice(0, 50) || null
    if (body.hero_bg_image_url !== undefined) updateData.hero_bg_image_url = body.hero_bg_image_url || null
    if (body.rating !== undefined) updateData.rating = Math.max(0, Math.min(parseFloat(body.rating) || 0, 5))
    if (body.reviews_count !== undefined) updateData.reviews_count = Math.max(0, parseInt(body.reviews_count) || 0)
    if (body.features !== undefined) updateData.features = body.features
    if (body.features_ru !== undefined) updateData.features_ru = body.features_ru
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.tags_ru !== undefined) updateData.tags_ru = body.tags_ru
    if (body.instructor_name !== undefined) updateData.instructor_name = s(body.instructor_name || '', 200) || null
    if (body.instructor_title !== undefined) updateData.instructor_title = s(body.instructor_title || '', 200) || null
    if (body.instructor_title_ru !== undefined) updateData.instructor_title_ru = s(body.instructor_title_ru || '', 200) || null
    if (body.instructor_bio !== undefined) updateData.instructor_bio = s(body.instructor_bio || '', 5000) || null
    if (body.instructor_bio_ru !== undefined) updateData.instructor_bio_ru = s(body.instructor_bio_ru || '', 5000) || null
    if (body.instructor_image_url !== undefined) updateData.instructor_image_url = body.instructor_image_url || null
    if (body.cta_title !== undefined) updateData.cta_title = s(body.cta_title || '', 500) || null
    if (body.cta_title_ru !== undefined) updateData.cta_title_ru = s(body.cta_title_ru || '', 500) || null
    if (body.cta_subtitle !== undefined) updateData.cta_subtitle = s(body.cta_subtitle || '', 1000) || null
    if (body.cta_subtitle_ru !== undefined) updateData.cta_subtitle_ru = s(body.cta_subtitle_ru || '', 1000) || null
    if (body.cta_button_text !== undefined) updateData.cta_button_text = s(body.cta_button_text || '', 100) || null
    if (body.cta_button_text_ru !== undefined) updateData.cta_button_text_ru = s(body.cta_button_text_ru || '', 100) || null
    if (body.guarantee_text !== undefined) updateData.guarantee_text = s(body.guarantee_text || '', 2000) || null
    if (body.guarantee_text_ru !== undefined) updateData.guarantee_text_ru = s(body.guarantee_text_ru || '', 2000) || null
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
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
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
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}
