import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

// POST create lesson — admin only
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })

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
    
    const { data, error } = await supabase
      .from('course_lessons')
      .insert({
        module_id: params.id,
        title: body.title || 'New Lesson',
        title_ru: body.title_ru || 'Новый урок',
        type: body.type || 'video',
        duration_minutes: body.duration_minutes || 10,
        video_url: body.video_url || null,
        content: body.content || [],
        content_ru: body.content_ru || [],
        is_free: body.is_free || false,
        is_published: body.is_published ?? true,
        sort_order: nextOrder,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('POST /api/modules/[id]/lessons error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
