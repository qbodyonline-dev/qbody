import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { sanitizeString } from '@/lib/security'

/** Public-safe Supabase client (anon key) */
function getPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (url: any, options: any = {}) => fetch(url, { ...options, cache: 'no-store' as RequestCache }),
      },
    }
  )
}

// GET all pages or specific page by slug — public (for rendering)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawSlug = searchParams.get('slug')
    // ✅ SANITIZE: Clean slug
    const slug = rawSlug ? rawSlug.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 200) : null
    
    const supabase = getPublicSupabase()
    
    if (slug) {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_slug', slug)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return NextResponse.json(data || null)
    } else {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return NextResponse.json(data || [])
    }
  } catch (err: any) {
    console.error('GET /api/pages error:', err)
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
  }
}

// POST create new page — admin only
export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    
    // ✅ SANITIZE: Clean slug
    const cleanSlug = (body.page_slug || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 200)
    if (!cleanSlug) {
      return NextResponse.json({ error: 'Valid page_slug is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('page_content')
      .insert({
        page_slug: cleanSlug,
        blocks: body.blocks || [],
        is_published: body.is_published ?? true,
      })
      .select()
      .single()
    
    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('POST /api/pages error:', err)
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 })
  }
}

// PUT update page — admin only
export async function PUT(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    
    // ✅ SANITIZE: Clean slug
    const cleanSlug = (body.page_slug || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 200)
    if (!cleanSlug) {
      return NextResponse.json({ error: 'Valid page_slug is required' }, { status: 400 })
    }
    
    const { data: existingData, error: selectError } = await supabase
      .from('page_content')
      .select('id')
      .eq('page_slug', cleanSlug)
      .single()
    
    if (selectError && selectError.code === 'PGRST116') {
      const { data, error } = await supabase
        .from('page_content')
        .insert({
          page_slug: cleanSlug,
          blocks: body.blocks || [],
          is_published: body.is_published ?? true,
        })
        .select()
        .single()
      
      if (error) throw error
      return NextResponse.json(data)
    }
    
    if (selectError) throw selectError
    
    const { data, error } = await supabase
      .from('page_content')
      .update({ blocks: body.blocks, is_published: body.is_published })
      .eq('page_slug', cleanSlug)
      .select()
      .single()
    
    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('PUT /api/pages error:', err)
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
  }
}

// DELETE page — admin only
export async function DELETE(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    
    // ✅ SANITIZE: Clean slug
    const cleanSlug = slug ? slug.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 200) : null
    if (!cleanSlug) {
      return NextResponse.json({ error: 'Valid slug is required' }, { status: 400 })
    }
    
    const supabase = createServerClient()
    const { error } = await supabase
      .from('page_content')
      .delete()
      .eq('page_slug', cleanSlug)
    
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/pages error:', err)
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 })
  }
}
