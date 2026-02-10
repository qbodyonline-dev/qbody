/**
 * Security Configuration & Helpers
 * Centralized security settings for the QBody application
 */

// ─── File Upload Security ───

/** Allowed MIME types for file uploads */
export const ALLOWED_UPLOAD_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  document: ['application/pdf'],
}

/** All allowed types flattened */
export const ALL_ALLOWED_TYPES = Object.values(ALLOWED_UPLOAD_TYPES).flat()

/** Max file size in bytes (50 MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024

/** Max image file size (10 MB) */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024

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

// ─── Rate Limiting (Simple in-memory) ───

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    rateLimitStore.forEach((entry, key) => {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key)
      }
    })
  }, 5 * 60 * 1000)
}

/**
 * Simple rate limiter
 * @param key - Unique key (e.g., IP + route)
 * @param maxRequests - Max requests per window
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
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

/** Sanitize string input — strip HTML tags and limit length */
export function sanitizeString(input: string, maxLength = 10000): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript\s*:/gi, '') // Remove javascript: protocol
    .replace(/data\s*:\s*text\/html/gi, '') // Remove data:text/html
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
