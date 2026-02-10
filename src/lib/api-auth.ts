import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API Route Authentication & Authorization Helper
 * 
 * Verifies Bearer token from request headers and checks user role.
 * Uses service_role client to read profile, but authenticates the user
 * via their JWT token.
 */

interface AuthResult {
  user: {
    id: string
    email: string
  }
  profile: {
    id: string
    email: string
    full_name: string | null
    role: 'admin' | 'trainer' | 'client'
  }
}

interface AuthError {
  error: string
  status: number
}

type AuthResponse = { success: true; data: AuthResult } | { success: false; error: AuthError }

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (url: any, options: any = {}) => fetch(url, { ...options, cache: 'no-store' as RequestCache }),
      },
    }
  )
}

/**
 * Authenticate request and return user + profile.
 * Supports both:
 * - Bearer token in Authorization header
 * - Supabase session cookies (from middleware)
 */
export async function authenticateRequest(request: NextRequest | Request): Promise<AuthResponse> {
  const supabase = getSupabase()

  // Try Bearer token first
  const authHeader = (request as any).headers?.get?.('authorization') || ''
  
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    
    if (!token || token === 'undefined' || token === 'null') {
      return { success: false, error: { error: 'Invalid token', status: 401 } }
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return { success: false, error: { error: 'Invalid or expired token', status: 401 } }
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, error: { error: 'Profile not found', status: 403 } }
    }

    return {
      success: true,
      data: {
        user: { id: user.id, email: user.email || '' },
        profile: profile as AuthResult['profile']
      }
    }
  }

  // Try cookie-based auth (for pages that use fetch without Bearer token)
  // Extract Supabase cookies from the request
  const cookieHeader = (request as any).headers?.get?.('cookie') || ''
  
  // Look for the Supabase auth token in cookies
  const cookies = parseCookies(cookieHeader)
  const supabaseAuthToken = findSupabaseToken(cookies)
  
  if (supabaseAuthToken) {
    const { data: { user }, error: authError } = await supabase.auth.getUser(supabaseAuthToken)
    
    if (!authError && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('id', user.id)
        .single()

      if (profile) {
        return {
          success: true,
          data: {
            user: { id: user.id, email: user.email || '' },
            profile: profile as AuthResult['profile']
          }
        }
      }
    }
  }

  return { success: false, error: { error: 'Authentication required', status: 401 } }
}

/**
 * Require specific roles. Returns error response if role doesn't match.
 */
export function requireRole(profile: AuthResult['profile'], allowedRoles: string[]): AuthError | null {
  if (!allowedRoles.includes(profile.role)) {
    return { error: 'Insufficient permissions', status: 403 }
  }
  return null
}

/**
 * Quick helper: authenticate + require admin/trainer role
 */
export async function requireAdmin(request: NextRequest | Request): Promise<
  { success: true; data: AuthResult } | { success: false; error: AuthError }
> {
  const auth = await authenticateRequest(request)
  if (!auth.success) return auth

  const roleError = requireRole(auth.data.profile, ['admin', 'trainer'])
  if (roleError) return { success: false, error: roleError }

  return auth
}

/**
 * Quick helper: authenticate + require admin-only role
 */
export async function requireAdminOnly(request: NextRequest | Request): Promise<
  { success: true; data: AuthResult } | { success: false; error: AuthError }
> {
  const auth = await authenticateRequest(request)
  if (!auth.success) return auth

  const roleError = requireRole(auth.data.profile, ['admin'])
  if (roleError) return { success: false, error: roleError }

  return auth
}

// ─── Cookie parsing helpers ───

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!cookieHeader) return cookies
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=')
    if (name) {
      cookies[name.trim()] = rest.join('=').trim()
    }
  })
  
  return cookies
}

function findSupabaseToken(cookies: Record<string, string>): string | null {
  // Supabase stores tokens in cookies with various naming patterns
  // Common patterns: sb-<project-ref>-auth-token, sb-access-token
  for (const [key, value] of Object.entries(cookies)) {
    if (key.includes('sb-') && key.includes('auth-token')) {
      try {
        // Supabase stores a JSON object with access_token
        const parsed = JSON.parse(decodeURIComponent(value))
        if (parsed?.access_token) return parsed.access_token
        // Sometimes split across base and .0, .1 chunks
      } catch {
        // Might be chunked — try combining
      }
    }
  }
  
  // Try chunked cookies (sb-xxx-auth-token.0, sb-xxx-auth-token.1, etc.)
  const authCookieBase = Object.keys(cookies).find(k => k.includes('sb-') && k.includes('auth-token') && !k.includes('.'))
  if (authCookieBase) {
    let combined = cookies[authCookieBase] || ''
    let i = 0
    while (cookies[`${authCookieBase}.${i}`]) {
      combined += cookies[`${authCookieBase}.${i}`]
      i++
    }
    try {
      const parsed = JSON.parse(decodeURIComponent(combined))
      if (parsed?.access_token) return parsed.access_token
    } catch {
      // Not valid JSON
    }
  }

  return null
}
