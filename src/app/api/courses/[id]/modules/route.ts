import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// POST create module
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    
    const { data, error } = await supabase
      .from('course_modules')
      .insert({
        course_id: params.id,
        title: body.title || 'New Module',
        title_ru: body.title_ru || 'Новый модуль',
        description: body.description || null,
        description_ru: body.description_ru || null,
        sort_order: nextOrder,
        is_published: body.is_published ?? true,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('POST /api/courses/[id]/modules error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
