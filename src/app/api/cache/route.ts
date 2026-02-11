import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { createServerClient } from '@/lib/supabase-server'

// ═══════════ In-memory page-blocks cache ═══════════
// This is the shared cache that page-blocks GET can use
export const pageBlocksCache = new Map<string, { data: any; ts: number }>()
export const PAGE_CACHE_TTL = 60 * 1000 // 60 seconds

// GET — Cache status
export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    
    // Load cache settings from DB
    const { data: settingsRow } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'cache_settings')
      .single()

    const settings = settingsRow?.value || {
      enabled: true,
      pageCacheTTL: 60,
      imgCacheTTL: 2592000,
      apiCacheTTL: 30,
    }

    return NextResponse.json({
      settings,
      status: {
        pageBlocksCacheEntries: pageBlocksCache.size,
        serverTime: new Date().toISOString(),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — Purge cache or update settings
export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const body = await request.json()
    const { action, settings } = body

    if (action === 'purge_all' || action === 'purge_pages') {
      // Clear in-memory page blocks cache
      pageBlocksCache.clear()
    }

    if (action === 'update_settings' && settings) {
      const supabase = createServerClient()
      await supabase
        .from('site_settings')
        .upsert({
          key: 'cache_settings',
          value: settings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' })
      
      return NextResponse.json({ success: true, message: 'Cache settings updated' })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cache purged: ${action}`,
      cleared: {
        pageBlocksCache: pageBlocksCache.size === 0,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
