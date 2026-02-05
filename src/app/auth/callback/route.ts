import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  
  if (code) {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if this is a password recovery flow
      const { data: { user } } = await supabase.auth.getUser()
      
      // If user came from password reset email, redirect to reset password page
      if (user?.recovery_sent_at) {
        return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin))
      }
      
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // If there's an error, redirect to login with error
  return NextResponse.redirect(new URL('/auth/login?error=auth_callback_error', requestUrl.origin))
}
