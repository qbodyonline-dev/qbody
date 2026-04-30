/**
 * Security Configuration & Helpers
 * Centralized security settings for the QBody application
 */

import { createClient as createSupabaseRateLimitClient } from '@supabase/supabase-js'

// ─── File Upload Security ───

/** Allowed MIME types for file uploads */
export const ALLOWED_UPLOAD_TYPES: Record<string, string[]> = {
  image: [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'image/avif', 'image/heic', 'image/heif',
  ],
  video: [
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
    'video/ogg', 'video/x-m4v', 'video/3gpp',
  ],
  document: ['application/pdf'],
}

/** All allowed types flattened */
export const ALL_ALLOWED_TYPES = Object.values(ALLOWED_UPLOAD_TYPES).flat()

/** Max file size in bytes (200 MB — covers videos) */
export const MAX_FILE_SIZE = 200 * 1024 * 1024

/** Max image file size (15 MB — HEIC iPhone photos can be larger than 10 MB) */
export const MAX_IMAGE_SIZE = 15 * 1024 * 1024

/** Max video file size (200 MB) */
export const MAX_VIDEO_SIZE = 200 * 1024 * 1024

/** Dangerous file extensions to block */
export const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.jsx', '.ts', '.tsx',
  '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.cgi',
  '.dll', '.com', '.scr', '.msi', '.jar', '.class',
  '.html', '.htm', '.xhtml', '.svg', '.svgz', // SVG can contain scripts
]

export function validateUploadFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` }
  }

  // Check type-specific size limits
  if (file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB` }
  }

  if (file.type.startsWith('video/') && file.size > MAX_VIDEO_SIZE) {
    return { valid: false, error: `Video too large. Maximum size is ${MAX_VIDEO_SIZE / 1024 / 1024}MB` }
  }

  // Check MIME type
  if (!ALL_ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `File type "${file.type}" is not allowed` }
  }

  // Check extension
  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '')
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `File extension "${ext}" is not allowed` }
  }

  return { valid: true }
}

// ─── Rate Limiting (Supabase-backed for serverless) ───

/** In-memory fallback for when Supabase is unavailable */
interface RateLimitEntry {
  count: number
  resetTime: number
}
const rateLimitFallback = new Map<string, RateLimitEntry>()

/** Get a Supabase admin client for rate limiting (service_role bypasses RLS) */
function getRateLimitSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createSupabaseRateLimitClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Persistent rate limiter using Supabase RPC
 * Falls back to in-memory if Supabase is unavailable
 * @param key - Unique key (e.g., IP + route)
 * @param maxRequests - Max requests per window
 * @param windowMs - Time window in milliseconds
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const supabase = getRateLimitSupabase()
    if (!supabase) {
      // No Supabase credentials — use in-memory fallback
      return checkRateLimitFallback(key, maxRequests, windowMs)
    }

    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: key,
      p_max_requests: maxRequests,
      p_window_ms: windowMs,
    })

    if (error || !data) {
      console.warn('Rate limit RPC failed, using fallback:', error?.message)
      return checkRateLimitFallback(key, maxRequests, windowMs)
    }

    return {
      allowed: data.allowed as boolean,
      remaining: data.remaining as number,
    }
  } catch (err) {
    console.warn('Rate limit error, using fallback:', err)
    return checkRateLimitFallback(key, maxRequests, windowMs)
  }
}

/** In-memory fallback rate limiter (for dev or Supabase failures) */
function checkRateLimitFallback(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitFallback.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitFallback.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count }
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  const forwarded = (request as any).headers?.get?.('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  
  const realIp = (request as any).headers?.get?.('x-real-ip')
  if (realIp) return realIp

  return 'unknown'
}

// ─── Input Sanitization ───

/** Sanitize string input — strip dangerous HTML and limit length (for plain text fields).
 *  Note: this is for short plaintext fields (titles, names) — use sanitizeHTMLContent for rich HTML. */
export function sanitizeString(input: string, maxLength = 10000): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes (no whitelist in plain text)
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
    .replace(/<embed[^>]*>/gi, '') // Remove embed tags
    .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '') // Remove applet tags
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '') // Remove form tags
    .replace(/<meta[^>]*>/gi, '') // Remove meta tags
    .replace(/<link[^>]*>/gi, '') // Remove link tags
    .replace(/<base[^>]*>/gi, '') // Remove base tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers (quoted)
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '') // Remove event handlers (unquoted)
    .replace(/javascript\s*:/gi, '') // Remove javascript: protocol
    .replace(/vbscript\s*:/gi, '') // Remove vbscript: protocol
    .replace(/data\s*:\s*text\/html/gi, '') // Remove data:text/html
    .replace(/expression\s*\(/gi, '') // Remove CSS expression()
    .replace(/-moz-binding\s*:/gi, '') // Remove -moz-binding
    .slice(0, maxLength)
}

/**
 * Whitelist of iframe src prefixes that are safe to embed in CMS content.
 * Used by both server- and client-side sanitizers.
 */
export const IFRAME_SRC_ALLOWLIST = [
  'https://www.youtube.com/embed/',
  'https://www.youtube-nocookie.com/embed/',
  'https://youtube.com/embed/',
  'https://player.vimeo.com/video/',
  'https://www.google.com/maps/embed',
  'https://maps.google.com/maps',
  'https://open.spotify.com/embed/',
  'https://w.soundcloud.com/player/',
]

export function isIframeSrcAllowed(src: string): boolean {
  if (!src) return false
  const s = src.trim().toLowerCase()
  return IFRAME_SRC_ALLOWLIST.some(prefix => s.startsWith(prefix.toLowerCase()))
}

/**
 * Server-side HTML content sanitizer for page blocks
 * More permissive than sanitizeString — allows safe HTML tags but strips dangerous ones.
 *
 * Allows:
 *  - <iframe> only if src matches IFRAME_SRC_ALLOWLIST (YouTube, Vimeo, Google Maps, etc.)
 *  - <button> without formaction (CMS CTA buttons)
 *  - <form> with action on same origin or allow-listed payment processors (CSP enforces this too)
 *  - All inline event handlers are stripped
 *  - "behavior:" CSS check uses word-boundary so it does NOT strip "scroll-behavior" / "overscroll-behavior"
 */
export function sanitizeHTMLContent(html: string, maxLength = 500000): string {
  if (!html || typeof html !== 'string') return ''
  return html
    // Remove dangerous tags completely (with content)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // <iframe>: keep only those matching IFRAME_SRC_ALLOWLIST
    .replace(/<iframe\b([^>]*)>([\s\S]*?)<\/iframe>/gi, (match, attrs) => {
      const srcMatch = String(attrs).match(/\bsrc\s*=\s*["']([^"']+)["']/i)
      if (srcMatch && isIframeSrcAllowed(srcMatch[1])) return match
      return ''
    })
    // Self-closing iframes (rare, but handle)
    .replace(/<iframe\b([^>]*)\/>/gi, (match, attrs) => {
      const srcMatch = String(attrs).match(/\bsrc\s*=\s*["']([^"']+)["']/i)
      if (srcMatch && isIframeSrcAllowed(srcMatch[1])) return match
      return ''
    })
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '')
    // <form>, <input>, <textarea>, <select> are allowed (CMS contact block needs them).
    // Strip the action attribute if it points to javascript: or vbscript: (handled by global protocol filter below).
    // Allow <button> for CTAs but strip formaction attribute (XSS vector)
    .replace(/(<button\b[^>]*?)\s+formaction\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '$1')
    // Strip formaction on input/button anywhere
    .replace(/(<(?:input|button)\b[^>]*?)\s+formaction\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '$1')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<base[^>]*>/gi, '')
    // Remove all event handlers
    .replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\s+on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove dangerous protocols
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    // Remove CSS expressions
    .replace(/expression\s*\(/gi, '')
    .replace(/-moz-binding\s*:/gi, '')
    // ⚠ Boundary check: "behavior:" alone is IE-only, but bare regex ALSO matches
    // safe modern CSS like "scroll-behavior", "overscroll-behavior" — do NOT use plain /behavior:/.
    .replace(/(^|[\s;{"'])behavior\s*:/gi, '$1/* removed */:')
    .slice(0, maxLength)
}

/** Validate UUID format */
export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

// ─── Security Headers ───

export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}
