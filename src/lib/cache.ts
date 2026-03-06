// Shared in-memory cache for page blocks and images
// Importable from any API route without Next.js route export restrictions

export const pageBlocksCache = new Map<string, { data: any; ts: number }>()
export const imageCache = new Map<string, { buffer: Uint8Array; etag: string; ts: number }>()

// Default TTLs (overridden by DB settings when loaded)
let _pageCacheTTL = 60 * 1000     // 60s default (in ms)
let _imgCacheTTL = 10 * 60 * 1000 // 10 min in-memory default (in ms)
let _cacheEnabled = true

export function getPageCacheTTL(): number { return _cacheEnabled ? _pageCacheTTL : 0 }
export function getImgCacheTTL(): number { return _cacheEnabled ? _imgCacheTTL : 0 }
export function isCacheEnabled(): boolean { return _cacheEnabled }

/** Update cache TTL settings from DB values (seconds → ms) */
export function updateCacheSettings(settings: {
  enabled?: boolean
  pageCacheTTL?: number
  imgCacheTTL?: number
}) {
  if (typeof settings.enabled === 'boolean') _cacheEnabled = settings.enabled
  if (typeof settings.pageCacheTTL === 'number' && settings.pageCacheTTL >= 0) {
    _pageCacheTTL = settings.pageCacheTTL * 1000
  }
  if (typeof settings.imgCacheTTL === 'number' && settings.imgCacheTTL >= 0) {
    _imgCacheTTL = settings.imgCacheTTL * 1000
  }
}

// Keep backward compat export
export const PAGE_CACHE_TTL = 60 * 1000

export function clearPageCache(slug?: string) {
  if (slug) {
    pageBlocksCache.delete(`blocks:${slug}`)
  } else {
    pageBlocksCache.clear()
  }
}

export function clearImageCache() {
  imageCache.clear()
}

export function clearAllCaches() {
  pageBlocksCache.clear()
  imageCache.clear()
}
