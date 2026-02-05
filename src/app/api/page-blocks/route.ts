import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client - works without service role key
function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  // Try service role key first, fall back to anon key
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// GET - load page blocks
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pageSlug = searchParams.get('page') || 'home'
    
    const supabase = getSupabase()
    
    const { data, error } = await supabase
      .from('page_blocks')
      .select('*')
      .eq('page_slug', pageSlug)
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('GET page_blocks error:', error)
      return NextResponse.json({ blocks: [], pageSlug, error: error.message })
    }
    
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
    return NextResponse.json({ blocks: [], error: err.message }, { status: 500 })
  }
}

// POST - save all page blocks (replace all)
export async function POST(request: Request) {
  try {
    const supabase = getSupabase()
    const body = await request.json()
    const { pageSlug = 'home', blocks } = body
    
    console.log('POST page-blocks:', { pageSlug, blocksCount: blocks?.length })
    
    if (!Array.isArray(blocks)) {
      return NextResponse.json({ error: 'blocks must be an array' }, { status: 400 })
    }
    
    // Delete existing blocks for this page
    const { error: deleteError } = await supabase
      .from('page_blocks')
      .delete()
      .eq('page_slug', pageSlug)
    
    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Delete failed: ' + deleteError.message }, { status: 500 })
    }
    
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
      const { error: insertError } = await supabase
        .from('page_blocks')
        .insert(rows)
      
      if (insertError) {
        console.error('Insert error:', insertError)
        return NextResponse.json({ error: 'Insert failed: ' + insertError.message }, { status: 500 })
      }
    }
    
    console.log('Saved', rows.length, 'blocks')
    return NextResponse.json({ success: true, count: rows.length })
  } catch (err: any) {
    console.error('POST /api/page-blocks error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
