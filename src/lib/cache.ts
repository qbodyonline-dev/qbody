// Shared in-memory cache for page blocks
// Importable from any API route without Next.js route export restrictions

export const pageBlocksCache = new Map<string, { data: any; ts: number }>()
export const PAGE_CACHE_TTL = 60 * 1000 // 60 seconds

export function clearPageCache(slug?: string) {
  if (slug) {
    pageBlocksCache.delete(`blocks:${slug}`)
  } else {
    pageBlocksCache.clear()
  }
}
