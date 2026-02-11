// Shared in-memory cache for page blocks
// Importable from any API route without Next.js route export restrictions

export const pageBlocksCache = new Map<string, { data: any; ts: number }>()
export const PAGE_CACHE_TTL = 10 * 1000 // 10 seconds (short for fast CMS updates)

export function clearPageCache(slug?: string) {
  if (slug) {
    pageBlocksCache.delete(`blocks:${slug}`)
  } else {
    pageBlocksCache.clear()
  }
}
