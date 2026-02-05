import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  
  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if this is a password recovery flow by checking the type parameter
      // or just redirect to reset-password for all recovery flows
      const type = requestUrl.searchParams.get('type')
      
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin))
      }
      
      // Also check user's recovery_sent_at
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.recovery_sent_at) {
        const recoveryTime = new Date(user.recovery_sent_at).getTime()
        const now = Date.now()
        // If recovery was requested in the last hour, redirect to reset password
        if (now - recoveryTime < 60 * 60 * 1000) {
          return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin))
        }
      }
      
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
    
    console.error('Callback error:', error)
  }

  // If there's an error, redirect to login with error
  return NextResponse.redirect(new URL('/auth/login?error=auth_callback_error', requestUrl.origin))
}
