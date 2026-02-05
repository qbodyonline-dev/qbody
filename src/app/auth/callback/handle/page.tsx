'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Verifying...')

  useEffect(() => {
    const handleAuth = async () => {
      const supabase = createClient()
      
      // Small delay to let Supabase process any tokens
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // First, check if user is already authenticated (Supabase may have auto-processed tokens)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setStatus('Authenticated, redirecting...')
        
        // Check if this is a recovery flow
        if (user.recovery_sent_at) {
          const recoveryTime = new Date(user.recovery_sent_at).getTime()
          const now = Date.now()
          // If recovery was requested in the last hour, redirect to reset password
          if (now - recoveryTime < 60 * 60 * 1000) {
            router.push('/auth/reset-password')
            return
          }
        }
        
        router.push('/dashboard')
        return
      }
      
      // Check for tokens in hash (older flow)
      const hash = window.location.hash
      if (hash && hash.length > 1) {
        setStatus('Processing tokens...')
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const tokenType = params.get('type')
        const errorParam = params.get('error')
        const errorDescription = params.get('error_description')
        
        if (errorParam) {
          console.error('Auth error:', errorParam, errorDescription)
          if (errorParam === 'access_denied' || errorDescription?.includes('expired')) {
            router.push('/auth/login?error=auth_callback_error#error=access_denied&error_code=otp_expired')
          } else {
            router.push('/auth/login?error=auth_callback_error')
          }
          return
        }
        
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          
          if (error) {
            console.error('Set session error:', error)
            router.push('/auth/login?error=auth_callback_error')
            return
          }
          
          // If this is a recovery token, redirect to reset password
          if (tokenType === 'recovery') {
            router.push('/auth/reset-password')
            return
          }
          
          router.push('/dashboard')
          return
        }
      }
      
      // Try code exchange if we have a code (PKCE flow)
      const code = searchParams.get('code')
      if (code) {
        setStatus('Exchanging code...')
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error) {
          const { data: { user: newUser } } = await supabase.auth.getUser()
          if (newUser?.recovery_sent_at) {
            router.push('/auth/reset-password')
            return
          }
          router.push('/dashboard')
          return
        }
        
        // Code exchange failed, but check if we're authenticated anyway
        const { data: { user: fallbackUser } } = await supabase.auth.getUser()
        if (fallbackUser) {
          if (fallbackUser.recovery_sent_at) {
            router.push('/auth/reset-password')
            return
          }
          router.push('/dashboard')
          return
        }
        
        console.error('Code exchange error:', error)
      }
      
      // No valid auth data found
      router.push('/auth/login?error=auth_callback_error')
    }
    
    handleAuth()
  }, [router, searchParams])

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-zinc-600">{status}</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
            <p className="text-zinc-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
