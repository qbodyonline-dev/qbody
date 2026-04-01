// Shared in-memory cache for page blocks and images
// Importable from any API route without Next.js route export restrictions

export const pageBlocksCache = new Map<string, { data: any; ts: number }>()
export const imageCache = new Map<string, { buffer: Uint8Array; etag: string; ts: number }>()

// Maximum image cache entries to prevent unbounded memory growth
const MAX_IMAGE_CACHE_ENTRIES = 200

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

/**
 * Evict expired and oldest entries from imageCache to prevent unbounded growth.
 * Call before adding new entries.
 */
export function evictImageCache() {
  const now = Date.now()
  const ttl = getImgCacheTTL()

  // First pass: remove expired entries
  if (ttl > 0) {
    const entries = Array.from(imageCache.entries())
    for (const [key, val] of entries) {
      if (now - val.ts > ttl) imageCache.delete(key)
    }
  }

  // Second pass: if still over limit, remove oldest entries (LRU)
  if (imageCache.size >= MAX_IMAGE_CACHE_ENTRIES) {
    const sorted = Array.from(imageCache.entries()).sort((a, b) => a[1].ts - b[1].ts)
    const toRemove = sorted.slice(0, Math.floor(MAX_IMAGE_CACHE_ENTRIES / 4))
    for (const [key] of toRemove) {
      imageCache.delete(key)
    }
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
