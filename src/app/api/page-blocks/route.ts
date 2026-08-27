import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/api-auth'
import { sanitizeString, sanitizeHTMLContent } from '@/lib/security'
import { pageBlocksCache, getPageCacheTTL, isCacheEnabled } from '@/lib/cache'
import { renderProgramsAutoHTML } from '@/app/dashboard/page-editor/programs/renderer'
import { defaultProgramAutoData } from '@/app/dashboard/page-editor/programs/defaults'
import type { ProgramAutoData } from '@/app/dashboard/page-editor/programs/types'

export const dynamic = 'force-dynamic'

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

    // ✅ VALIDATION: Sanitize pageSlug
    const cleanSlug = pageSlug.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50)
    if (!cleanSlug) {
      return NextResponse.json({ blocks: [], pageSlug: 'home', error: 'Invalid page slug' })
    }

    // ✅ CACHE: Check in-memory cache first
    const cacheKey = `blocks:${cleanSlug}`
    const pageTTL = getPageCacheTTL()
    const cached = pageBlocksCache.get(cacheKey)
    if (isCacheEnabled() && pageTTL > 0 && cached && Date.now() - cached.ts < pageTTL) {
      return NextResponse.json(cached.data, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
    }

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

    let blocks = (data || []).map(row => ({
      id: row.block_id,
      type: row.type,
      label: row.label,
      labelRu: row.label_secondary || row.label,
      visible: row.visible,
      contentEn: row.content_en || '',
      contentRu: row.content_secondary || '',
      style: row.style || {},
      data: row.data || undefined,
      items: row.items || undefined,
    }))

    // ─── Auto programs block ───
    // Its HTML is rebuilt from the live catalogue on every read (the copy saved
    // in the row is only the editor's snapshot), so a new program appears — and
    // a hidden one disappears — without re-saving the page.
    if (blocks.some((b: any) => b.type === 'programsauto')) {
      const admin = getAdminSupabase()
      const { data: programs } = await admin
        .from('training_programs')
        .select('id, slug, name, name_secondary, description, description_secondary, hero_image_url, duration_weeks, goal, difficulty, price, original_price, features, features_secondary, includes, includes_secondary, created_at, program_days(is_rest_day, workout_id)')
        .eq('is_active', true)
        .eq('is_private', false)

      blocks = blocks.map((b: any) => {
        if (b.type !== 'programsauto') return b
        const cfg = (b.data as ProgramAutoData) || defaultProgramAutoData()
        return {
          ...b,
          contentEn: renderProgramsAutoHTML((programs as any) || [], cfg, 'en'),
          contentRu: renderProgramsAutoHTML((programs as any) || [], cfg, 'ru'),
        }
      })
    }

    const responseData = { blocks, pageSlug: cleanSlug }

    // ✅ CACHE: Store in memory
    pageBlocksCache.set(cacheKey, { data: responseData, ts: Date.now() })

    return NextResponse.json(responseData, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    })
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
      label_secondary: sanitizeString(block.labelRu || block.label || '', 200),
      visible: block.visible ?? true,
      // ✅ XSS PROTECTION: Sanitize HTML content on server before saving to DB
      content_en: sanitizeHTMLContent(block.contentEn || ''),
      content_secondary: sanitizeHTMLContent(block.contentRu || ''),
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

    // ✅ CACHE: Invalidate page blocks cache after save
    pageBlocksCache.delete(`blocks:${cleanSlug}`)

    return NextResponse.json({ success: true, count: rows.length })
  } catch (err: any) {
    console.error('POST /api/page-blocks error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
