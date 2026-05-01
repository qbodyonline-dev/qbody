/**
 * Server-side reader for `site_settings`.
 * Used by app/layout.tsx (generateMetadata), app/manifest.ts, app/sitemap.ts, etc.
 *
 * Reads settings via service-role Supabase client and caches in-process for 60s
 * so SSR pages don't hit the DB on every render.
 */
import { createClient } from '@supabase/supabase-js'

export interface GeneralSettings {
  siteName?: string
  tagline?: string
  taglineRu?: string
  email?: string
  phone?: string
  defaultLanguage?: string
}

export interface BrandingSettings {
  primaryColor?: string
  logoUrl?: string
  heroImageUrl?: string
}

export interface SocialSettings {
  instagram?: string
  telegram?: string
  whatsapp?: string
}

export interface SeoSettings {
  seoTitle?: string
  seoTitleRu?: string
  seoDescription?: string
  seoDescriptionRu?: string
  seoKeywords?: string
  seoKeywordsRu?: string
  ogImageUrl?: string
  canonicalUrl?: string
  googleVerification?: string
  yandexVerification?: string
  enableIndexing?: boolean
  enableSitemap?: boolean
  gaTrackingId?: string
  gtmId?: string
}

export interface AppSettings {
  appName?: string
  appColor?: string
  appBackgroundUrl?: string
  appLoadingUrl?: string
  appIconUrl?: string
}

export interface SiteSettings {
  general: GeneralSettings
  branding: BrandingSettings
  social: SocialSettings
  seo: SeoSettings
  app: AppSettings
}

const EMPTY: SiteSettings = {
  general: {},
  branding: {},
  social: {},
  seo: {},
  app: {},
}

// Module-level memo cache (60s) — Next.js may instantiate this per-route on Vercel,
// so this is a best-effort cache, not a guaranteed singleton.
let cache: { value: SiteSettings; expires: number } | null = null
const TTL_MS = 60_000

export async function getSiteSettings(): Promise<SiteSettings> {
  if (cache && cache.expires > Date.now()) return cache.value

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) return EMPTY

    const supabase = createClient(url, anon, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (u: any, o: any = {}) => fetch(u, { ...o, cache: 'no-store' as RequestCache }),
      },
    })

    const { data, error } = await supabase.from('site_settings').select('key,value')
    if (error || !data) {
      cache = { value: EMPTY, expires: Date.now() + 5_000 }
      return EMPTY
    }

    const map: Record<string, any> = {}
    for (const row of data as Array<{ key: string; value: any }>) {
      map[row.key] = row.value || {}
    }

    const value: SiteSettings = {
      general: (map.general || {}) as GeneralSettings,
      branding: (map.branding || {}) as BrandingSettings,
      social: (map.social || {}) as SocialSettings,
      seo: (map.seo || {}) as SeoSettings,
      app: (map.app || {}) as AppSettings,
    }

    cache = { value, expires: Date.now() + TTL_MS }
    return value
  } catch {
    return EMPTY
  }
}

/** Force re-fetch on next call. Call from PUT/POST/PATCH /api/settings. */
export function invalidateSiteSettingsCache() {
  cache = null
}
