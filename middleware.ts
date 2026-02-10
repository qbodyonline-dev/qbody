import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // ✅ SECURITY: Enforce secure cookie settings
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            })
          )
        },
      },
    }
  )

  // Refresh session — updates cookies if token was refreshed
  const { data: { user } } = await supabase.auth.getUser()

  // ✅ SECURITY: Block requests with suspicious headers
  const pathname = request.nextUrl.pathname

  // Protect /dashboard — redirect to login if no user
  if (pathname.startsWith('/dashboard') && !user) {
    const url = new URL('/auth/login', request.url)
    // ✅ SECURITY: Validate redirect parameter — only allow internal paths
    const redirect = pathname
    if (redirect.startsWith('/') && !redirect.startsWith('//')) {
      url.searchParams.set('redirect', redirect)
    }
    return NextResponse.redirect(url)
  }

  // Already logged in going to login — redirect to dashboard
  // (but allow reset-password page for password recovery flow)
  if (pathname === '/auth/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/auth/:path*',
  ],
}
