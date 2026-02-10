import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/api-auth'
import { sanitizeString, sanitizeHTMLContent } from '@/lib/security'

/** Public-safe Supabase client (anon key, respects RLS) */
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

/** Admin Supabase client (service_role, bypasses RLS) */
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (url: any, options: any = {}) => fetch(url, { ...options, cache: 'no-store' as RequestCache }),
      },
    }
  )
}

// GET - load page blocks — public (uses anon key, respects RLS)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pageSlug = searchParams.get('page') || 'home'

    // ✅ VALIDATION: Sanitize pageSlug — alphanumeric, hyphens, underscores only
    const cleanSlug = pageSlug.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50)
    if (!cleanSlug) {
      return NextResponse.json({ blocks: [], pageSlug: 'home', error: 'Invalid page slug' })
    }

    // ✅ SECURITY: Use anon key for public reads (respects RLS)
    const supabase = getPublicSupabase()

    const { data, error } = await supabase
      .from('page_blocks')
      .select('*')
      .eq('page_slug', cleanSlug)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('GET page_blocks error:', error)
      return NextResponse.json({ blocks: [], pageSlug: cleanSlug, error: 'Failed to load blocks' })
    }

    const blocks = (data || []).map(row => ({
      id: row.block_id,
      type: row.type,
      label: row.label,
      labelRu: row.label_ru || row.label,
      visible: row.visible,
      contentEn: row.content_en || '',
      contentRu: row.content_ru || '',
      style: row.style || {},
      data: row.data || undefined,
      items: row.items || undefined,
    }))

    return NextResponse.json({ blocks, pageSlug: cleanSlug })
  } catch (err: any) {
    console.error('GET /api/page-blocks error:', err)
    return NextResponse.json({ blocks: [], error: 'Internal server error' }, { status: 500 })
  }
}

// POST - save all page blocks — admin only
export async function POST(request: Request) {
  // ✅ AUTH: Only admin can modify page content
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    // ✅ SECURITY: Use service_role for admin writes
    const supabase = getAdminSupabase()
    const body = await request.json()
    const { pageSlug = 'home', blocks } = body

    if (!Array.isArray(blocks)) {
      return NextResponse.json({ error: 'blocks must be an array' }, { status: 400 })
    }

    // ✅ VALIDATION: Limit number of blocks
    if (blocks.length > 50) {
      return NextResponse.json({ error: 'Too many blocks (max 50)' }, { status: 400 })
    }

    // ✅ VALIDATION: Sanitize pageSlug
    const cleanSlug = (pageSlug as string).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || 'home'

    // Delete existing blocks
    const { error: deleteError } = await supabase
      .from('page_blocks')
      .delete()
      .eq('page_slug', cleanSlug)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Delete failed: ' + deleteError.message }, { status: 500 })
    }

    // Insert new blocks with sanitized content
    const rows = blocks.map((block: any, index: number) => ({
      page_slug: cleanSlug,
      block_id: sanitizeString(block.id || `block_${index}`, 100),
      type: sanitizeString(block.type || 'custom', 50),
      label: sanitizeString(block.label || '', 200),
      label_ru: sanitizeString(block.labelRu || block.label || '', 200),
      visible: block.visible ?? true,
      // ✅ XSS PROTECTION: Sanitize HTML content on server before saving to DB
      content_en: sanitizeHTMLContent(block.contentEn || ''),
      content_ru: sanitizeHTMLContent(block.contentRu || ''),
      style: block.style || {},
      data: block.data || null,
      items: block.items || null,
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

    return NextResponse.json({ success: true, count: rows.length })
  } catch (err: any) {
    console.error('POST /api/page-blocks error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
