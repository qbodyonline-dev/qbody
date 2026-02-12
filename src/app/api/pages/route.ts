import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/api-auth'

function getPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch: (url: any, opts: any = {}) => fetch(url, { ...opts, cache: 'no-store' as RequestCache }) } }
  )
}

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch: (url: any, opts: any = {}) => fetch(url, { ...opts, cache: 'no-store' as RequestCache }) } }
  )
}

// GET — list all pages (public reads published, admin reads all)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const adminMode = searchParams.get('admin') === '1'

    if (adminMode) {
      const auth = await requireAdmin(request)
      if (!auth.success) {
        return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
      }
      const supabase = getAdminSupabase()
      const { data, error } = await supabase
        .from('site_pages')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('GET site_pages error:', error)
        return NextResponse.json({ error: 'Failed to load pages' }, { status: 500 })
      }
      return NextResponse.json(data || [])
    }

    // Public — only published
    const supabase = getPublicSupabase()
    const { data, error } = await supabase
      .from('site_pages')
      .select('id, slug, title, title_ru, is_homepage, sort_order')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('GET site_pages public error:', error)
      return NextResponse.json({ error: 'Failed to load pages' }, { status: 500 })
    }
    return NextResponse.json(data || [])
  } catch (err: any) {
    console.error('GET /api/pages error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create new page (admin only)
export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = getAdminSupabase()
    const body = await request.json()
    const { title, titleRu, slug: rawSlug } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Generate slug from title if not provided
    const slug = (rawSlug || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50)

    if (!slug) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }

    // Prevent conflict with existing routes
    const reserved = ['api', 'auth', 'client', 'dashboard', 'courses', 'programs', 'privacy', 'terms', 'cookies', 'test-api', 'sitemap', 'login', 'register', 'admin']
    if (reserved.includes(slug)) {
      return NextResponse.json({ error: `Slug "${slug}" is reserved` }, { status: 400 })
    }

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('site_pages')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Page with this slug already exists' }, { status: 409 })
    }

    // Get max sort_order
    const { data: maxOrder } = await supabase
      .from('site_pages')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrder?.sort_order ?? -1) + 1

    const { data, error } = await supabase
      .from('site_pages')
      .insert({
        slug,
        title: title.trim().slice(0, 200),
        title_ru: (titleRu || title).trim().slice(0, 200),
        is_published: false,
        is_homepage: false,
        sort_order: nextOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Create page error:', error)
      return NextResponse.json({ error: 'Failed to create page: ' + error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/pages error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH — update page (admin only)
export async function PATCH(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = getAdminSupabase()
    const body = await request.json()
    const { id, title, titleRu, is_published, sort_order } = body

    if (!id) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 })
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (title !== undefined) updates.title = String(title).trim().slice(0, 200)
    if (titleRu !== undefined) updates.title_ru = String(titleRu).trim().slice(0, 200)
    if (is_published !== undefined) updates.is_published = Boolean(is_published)
    if (sort_order !== undefined) updates.sort_order = Number(sort_order)

    const { data, error } = await supabase
      .from('site_pages')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update page error:', error)
      return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('PATCH /api/pages error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — delete page + its blocks (admin only, cannot delete homepage)
export async function DELETE(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = getAdminSupabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 })
    }

    // Check if homepage
    const { data: page } = await supabase
      .from('site_pages')
      .select('slug, is_homepage')
      .eq('id', id)
      .single()

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    if (page.is_homepage) {
      return NextResponse.json({ error: 'Cannot delete homepage' }, { status: 400 })
    }

    // Delete blocks for this page
    await supabase
      .from('page_blocks')
      .delete()
      .eq('page_slug', page.slug)

    // Delete the page
    const { error } = await supabase
      .from('site_pages')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete page error:', error)
      return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/pages error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
