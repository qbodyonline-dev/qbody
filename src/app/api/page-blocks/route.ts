import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET - load page blocks
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pageSlug = searchParams.get('page') || 'home'
    
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('page_blocks')
      .select('*')
      .eq('page_slug', pageSlug)
      .order('sort_order', { ascending: true })
    
    if (error) throw error
    
    // Transform to frontend format
    const blocks = (data || []).map(row => ({
      id: row.block_id,
      type: row.type,
      label: row.label,
      labelRu: row.label_ru || row.label,
      visible: row.visible,
      contentEn: row.content_en || '',
      contentRu: row.content_ru || '',
      style: row.style || {},
    }))
    
    return NextResponse.json({ blocks, pageSlug })
  } catch (err: any) {
    console.error('GET /api/page-blocks error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST - save all page blocks (replace all)
export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { pageSlug = 'home', blocks } = body
    
    if (!Array.isArray(blocks)) {
      return NextResponse.json({ error: 'blocks must be an array' }, { status: 400 })
    }
    
    // Delete existing blocks for this page
    await supabase
      .from('page_blocks')
      .delete()
      .eq('page_slug', pageSlug)
    
    // Insert new blocks
    const rows = blocks.map((block: any, index: number) => ({
      page_slug: pageSlug,
      block_id: block.id,
      type: block.type || 'custom',
      label: block.label,
      label_ru: block.labelRu || block.label,
      visible: block.visible ?? true,
      content_en: block.contentEn || '',
      content_ru: block.contentRu || '',
      style: block.style || {},
      sort_order: index,
    }))
    
    if (rows.length > 0) {
      const { error } = await supabase
        .from('page_blocks')
        .insert(rows)
      
      if (error) throw error
    }
    
    return NextResponse.json({ success: true, count: rows.length })
  } catch (err: any) {
    console.error('POST /api/page-blocks error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
