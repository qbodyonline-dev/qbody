import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { imageCache, getImgCacheTTL, isCacheEnabled } from '@/lib/cache'

// Use shared imageCache from cache.ts so Purge All can clear it
const cache = imageCache
const MAX_CACHE = 50

// Allowed source hosts (prevent open proxy abuse)
const ALLOWED_HOSTS = ['crybeycjfpyyxjgszcpu.supabase.co']

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const src = searchParams.get('src')
  const w = parseInt(searchParams.get('w') || '0') || 0
  const h = parseInt(searchParams.get('h') || '0') || 0
  const q = Math.min(Math.max(parseInt(searchParams.get('q') || '80'), 10), 100)

  if (!src) {
    return NextResponse.json({ error: 'Missing src parameter' }, { status: 400 })
  }

  // Validate URL
  let url: URL
  try {
    url = new URL(src)
  } catch {
    return NextResponse.json({ error: 'Invalid src URL' }, { status: 400 })
  }

  if (!ALLOWED_HOSTS.includes(url.hostname)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 })
  }

  // Validate dimensions
  const width = Math.min(w, 2560) || undefined
  const height = Math.min(h, 2560) || undefined

  // Cache key
  const cacheKey = `${src}|${width || 0}|${height || 0}|${q}`

  // Check ETag / If-None-Match
  const ifNoneMatch = request.headers.get('if-none-match')

  // Check in-memory cache (respects dynamic TTL from admin settings)
  const imgTTL = getImgCacheTTL()
  const cached = cache.get(cacheKey)
  if (isCacheEnabled() && imgTTL > 0 && cached && Date.now() - cached.ts < imgTTL) {
    if (ifNoneMatch === cached.etag) {
      return new NextResponse(null, { status: 304 })
    }
    return new NextResponse(cached.buffer as any, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=2592000, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, max-age=2592000',
        'ETag': cached.etag,
        'Vary': 'Accept',
      },
    })
  }

  try {
    // Fetch original image
    const imgRes = await fetch(src, {
      headers: { 'Accept': 'image/*' },
    })

    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
    }

    const arrayBuffer = await imgRes.arrayBuffer()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inputBuffer: any = Buffer.from(arrayBuffer)

    // Optimize with Sharp
    let pipeline = sharp(inputBuffer).rotate()

    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    }

    const optimizedBuf = await pipeline.webp({ quality: q, effort: 4 }).toBuffer()
    const optimized = new Uint8Array(optimizedBuf)

    // Generate ETag
    const etag = `"img-${Buffer.from(cacheKey).toString('base64url').slice(0, 16)}-${optimized.length}"`

    // Store in memory cache (evict oldest if full)
    if (cache.size >= MAX_CACHE) {
      const oldest = Array.from(cache.entries()).sort((a, b) => a[1].ts - b[1].ts)[0]
      if (oldest) cache.delete(oldest[0])
    }
    cache.set(cacheKey, { buffer: optimized, etag, ts: Date.now() })

    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 })
    }

    return new NextResponse(optimized as any, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=2592000, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, max-age=2592000',
        'ETag': etag,
        'Vary': 'Accept',
        'X-Original-Size': String(inputBuffer.length),
        'X-Optimized-Size': String(optimized.length),
      },
    })
  } catch (err: any) {
    console.error('[Image Proxy] Error:', err.message)
    // Fallback: redirect to original
    return NextResponse.redirect(src, { status: 302 })
  }
}
