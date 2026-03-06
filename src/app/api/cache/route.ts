import { NextResponse } from 'next/server'
import { requireAdminOnly } from '@/lib/api-auth'
import { createServerClient } from '@/lib/supabase-server'
import {
  pageBlocksCache,
  imageCache,
  clearPageCache,
  clearAllCaches,
  updateCacheSettings,
} from '@/lib/cache'

// ✅ Validate and sanitize cache settings from DB
function validateSettings(raw: any): {
  enabled: boolean
  pageCacheTTL: number
  imgCacheTTL: number
  apiCacheTTL: number
} {
  return {
    enabled: typeof raw?.enabled === 'boolean' ? raw.enabled : true,
    pageCacheTTL: typeof raw?.pageCacheTTL === 'number' && raw.pageCacheTTL >= 0 ? raw.pageCacheTTL : 60,
    imgCacheTTL: typeof raw?.imgCacheTTL === 'number' && raw.imgCacheTTL >= 0 ? raw.imgCacheTTL : 2592000,
    apiCacheTTL: typeof raw?.apiCacheTTL === 'number' && raw.apiCacheTTL >= 0 ? raw.apiCacheTTL : 30,
  }
}

// GET — Cache status (admin only)
export async function GET(request: Request) {
  // ✅ Bug 4 fix: Only admin (not trainers) can manage cache
  const auth = await requireAdminOnly(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()

    const { data: settingsRow } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'cache_settings')
      .single()

    // ✅ Bug 3 fix: Validate types from DB (prevents crashes from corrupted data)
    const settings = validateSettings(settingsRow?.value)

    // ✅ Bug 6 fix: Apply DB settings to in-memory cache module (supports TTL=0 / disabled)
    updateCacheSettings({
      enabled: settings.enabled,
      pageCacheTTL: settings.pageCacheTTL,
      imgCacheTTL: settings.imgCacheTTL,
    })

    return NextResponse.json({
      settings,
      status: {
        pageBlocksCacheEntries: pageBlocksCache.size,
        imageCacheEntries: imageCache.size,
        serverTime: new Date().toISOString(),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — Purge cache or update settings (admin only)
export async function POST(request: Request) {
  // ✅ Bug 4 fix: Only admin (not trainers) can manage cache
  const auth = await requireAdminOnly(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const body = await request.json()
    const { action, settings } = body

    // ✅ Bug 2 fix: purge_all clears BOTH page blocks AND image cache
    if (action === 'purge_all') {
      clearAllCaches()
    } else if (action === 'purge_pages') {
      clearPageCache()
    }

    if (action === 'update_settings' && settings) {
      // ✅ Bug 3 fix: Validate before saving to DB
      const validated = validateSettings(settings)

      const supabase = createServerClient()
      const { error: upsertError } = await supabase
        .from('site_settings')
        .upsert({
          key: 'cache_settings',
          value: validated,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' })

      if (upsertError) {
        return NextResponse.json({ error: 'Failed to save: ' + upsertError.message }, { status: 500 })
      }

      // ✅ Bug 6 fix: Apply new settings to in-memory cache module immediately
      updateCacheSettings({
        enabled: validated.enabled,
        pageCacheTTL: validated.pageCacheTTL,
        imgCacheTTL: validated.imgCacheTTL,
      })

      return NextResponse.json({ success: true, message: 'Cache settings updated' })
    }

    return NextResponse.json({
      success: true,
      message: `Cache purged: ${action}`,
      cleared: {
        pageBlocksCache: pageBlocksCache.size === 0,
        imageCache: imageCache.size === 0,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
