import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { revalidatePath } from 'next/cache'

const CACHE_SETTINGS_KEY = 'cache_settings'

interface CacheSettings {
  enabled: boolean
  pageTTL: number       // seconds — public page cache
  apiTTL: number        // seconds — public API cache
  staticTTL: number     // seconds — static assets cache
  lastPurge: string | null
  purgeCount: number
}

const DEFAULT_SETTINGS: CacheSettings = {
  enabled: true,
  pageTTL: 300,      // 5 min
  apiTTL: 120,       // 2 min
  staticTTL: 31536000, // 1 year (immutable hashed files)
  lastPurge: null,
  purgeCount: 0,
}

// GET — read cache settings
export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', CACHE_SETTINGS_KEY)
      .single()

    const settings = data?.value
      ? { ...DEFAULT_SETTINGS, ...(data.value as object) }
      : DEFAULT_SETTINGS

    return NextResponse.json(settings)
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS)
  }
}

// PATCH — update cache settings
export async function PATCH(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Load current
    const { data: existing } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', CACHE_SETTINGS_KEY)
      .single()

    const current = existing?.value
      ? { ...DEFAULT_SETTINGS, ...(existing.value as object) }
      : { ...DEFAULT_SETTINGS }

    // Merge updates with validation
    const updated: CacheSettings = {
      enabled: typeof body.enabled === 'boolean' ? body.enabled : current.enabled,
      pageTTL: clampTTL(body.pageTTL, current.pageTTL, 0, 86400),
      apiTTL: clampTTL(body.apiTTL, current.apiTTL, 0, 3600),
      staticTTL: current.staticTTL, // Don't allow changing static TTL
      lastPurge: current.lastPurge,
      purgeCount: current.purgeCount,
    }

    await supabase
      .from('site_settings')
      .upsert({
        key: CACHE_SETTINGS_KEY,
        value: updated,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })

    return NextResponse.json({ success: true, settings: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — purge cache
export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { target } = body // 'all' | 'pages' | 'api' | 'specific'

    const purged: string[] = []

    // Revalidate paths based on target
    if (target === 'all' || target === 'pages') {
      try { revalidatePath('/'); purged.push('/') } catch {}
      try { revalidatePath('/programs'); purged.push('/programs') } catch {}
      try { revalidatePath('/privacy'); purged.push('/privacy') } catch {}
      try { revalidatePath('/terms'); purged.push('/terms') } catch {}
      try { revalidatePath('/cookies'); purged.push('/cookies') } catch {}
    }

    if (target === 'all' || target === 'api') {
      try { revalidatePath('/api/page-blocks'); purged.push('/api/page-blocks') } catch {}
      try { revalidatePath('/api/settings'); purged.push('/api/settings') } catch {}
    }

    if (target === 'specific' && body.paths) {
      for (const p of (body.paths as string[]).slice(0, 20)) {
        const cleanPath = p.replace(/[^a-zA-Z0-9/_-]/g, '').slice(0, 200)
        if (cleanPath) {
          try { revalidatePath(cleanPath); purged.push(cleanPath) } catch {}
        }
      }
    }

    // Update purge stats
    const { data: existing } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', CACHE_SETTINGS_KEY)
      .single()

    const current = existing?.value
      ? { ...DEFAULT_SETTINGS, ...(existing.value as object) }
      : { ...DEFAULT_SETTINGS }

    const updatedSettings = {
      ...current,
      lastPurge: new Date().toISOString(),
      purgeCount: (current.purgeCount || 0) + 1,
    }

    await supabase
      .from('site_settings')
      .upsert({
        key: CACHE_SETTINGS_KEY,
        value: updatedSettings,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })

    return NextResponse.json({
      success: true,
      purged,
      timestamp: updatedSettings.lastPurge,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function clampTTL(newVal: any, currentVal: number, min: number, max: number): number {
  if (typeof newVal !== 'number') return currentVal
  return Math.max(min, Math.min(max, Math.round(newVal)))
}
