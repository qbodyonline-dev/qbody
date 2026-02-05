import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET all pages or specific page by slug
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    
    const supabase = createServerClient()
    
    if (slug) {
      // Get specific page
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_slug', slug)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      
      return NextResponse.json(data || null)
    } else {
      // Get all pages
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return NextResponse.json(data || [])
    }
  } catch (err: any) {
    console.error('GET /api/pages error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST create new page
export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('page_content')
      .insert({
        page_slug: body.page_slug,
        blocks: body.blocks || [],
        is_published: body.is_published ?? true,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('POST /api/pages error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PUT update page by slug
export async function PUT(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    
    if (!body.page_slug) {
      return NextResponse.json({ error: 'page_slug is required' }, { status: 400 })
    }
    
    // First try to update
    const { data: existingData, error: selectError } = await supabase
      .from('page_content')
      .select('id')
      .eq('page_slug', body.page_slug)
      .single()
    
    if (selectError && selectError.code === 'PGRST116') {
      // Page doesn't exist, create it
      const { data, error } = await supabase
        .from('page_content')
        .insert({
          page_slug: body.page_slug,
          blocks: body.blocks || [],
          is_published: body.is_published ?? true,
        })
        .select()
        .single()
      
      if (error) throw error
      return NextResponse.json(data)
    }
    
    if (selectError) throw selectError
    
    // Update existing page
    const { data, error } = await supabase
      .from('page_content')
      .update({
        blocks: body.blocks,
        is_published: body.is_published,
      })
      .eq('page_slug', body.page_slug)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('PUT /api/pages error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE page by slug
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    
    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 })
    }
    
    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('page_content')
      .delete()
      .eq('page_slug', slug)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/pages error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
