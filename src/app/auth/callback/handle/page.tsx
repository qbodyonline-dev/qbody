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
      
      // Check for code in URL params (PKCE flow)
      const code = searchParams.get('code')
      const type = searchParams.get('type')
      
      if (code) {
        setStatus('Exchanging code...')
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
          console.error('Code exchange error:', error)
          router.push('/auth/login?error=auth_callback_error')
          return
        }
        
        // Check if this is recovery flow
        if (type === 'recovery') {
          router.push('/auth/reset-password')
          return
        }
        
        // Check user recovery status
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.recovery_sent_at) {
          router.push('/auth/reset-password')
          return
        }
        
        router.push('/dashboard')
        return
      }
      
      // Check for tokens in hash (older flow)
      const hash = window.location.hash
      if (hash) {
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
          
          // Check user recovery status
          const { data: { user } } = await supabase.auth.getUser()
          if (user?.recovery_sent_at) {
            router.push('/auth/reset-password')
            return
          }
          
          router.push('/dashboard')
          return
        }
      }
      
      // Check if already authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
        return
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
