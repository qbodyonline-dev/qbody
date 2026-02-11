import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

/**
 * API Route Authentication & Authorization Helper
 * 
 * Verifies Bearer token from request headers and checks user role.
 * Uses service_role client to read profile, but authenticates the user
 * via their JWT token.
 * 
 * Fallback: cookie-based auth via @supabase/ssr (matches middleware format).
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
 * Create a Supabase SSR client that reads cookies from the request.
 * This matches the same format used by middleware.ts.
 */
function getSupabaseSSR(request: NextRequest | Request) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieHeader = (request as any).headers?.get?.('cookie') || ''
          if (!cookieHeader) return []
          return cookieHeader.split(';').map((c: string) => {
            const [name, ...rest] = c.trim().split('=')
            return { name: name?.trim() || '', value: rest.join('=').trim() }
          }).filter((c: any) => c.name)
        },
        setAll() {
          // No-op in API routes — we don't set cookies here
        },
      },
    }
  )
}

/**
 * Authenticate request and return user + profile.
 * Supports both:
 * - Bearer token in Authorization header (primary)
 * - Supabase session cookies via @supabase/ssr (fallback)
 */
export async function authenticateRequest(request: NextRequest | Request): Promise<AuthResponse> {
  const supabase = getSupabase()

  // ─── 1. Try Bearer token first ───
  const authHeader = (request as any).headers?.get?.('authorization') || ''
  
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    
    if (token && token !== 'undefined' && token !== 'null') {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      
      if (!authError && user) {
        // Fetch profile
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
      // Bearer token invalid/expired — fall through to cookie auth
    }
  }

  // ─── 2. Try cookie-based auth via @supabase/ssr ───
  try {
    const ssrClient = getSupabaseSSR(request)
    const { data: { user }, error } = await ssrClient.auth.getUser()
    
    if (!error && user) {
      // Fetch profile using service role client
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
  } catch (e) {
    // SSR auth failed — fall through
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
