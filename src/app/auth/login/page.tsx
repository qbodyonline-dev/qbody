'use client'
import React, { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { Mail, Lock, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useRecaptcha } from '@/lib/recaptcha'

function LoginForm() {
  const { t, locale } = useTranslation()
  const searchParams = useSearchParams()
  const { signIn, user, isClient, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })

  const ru = locale === 'ru'

  // Redirect already logged-in users
  useEffect(() => {
    if (!authLoading && user) {
      window.location.href = isClient ? '/client/home' : '/dashboard'
    }
  }, [authLoading, user, isClient])

  // Handle auth callback errors
  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'auth_callback_error') {
      // Check hash for more details
      const hash = window.location.hash
      if (hash.includes('otp_expired')) {
        toast.error(ru 
          ? 'Ссылка для сброса пароля истекла. Запросите новую.' 
          : 'Password reset link has expired. Please request a new one.'
        )
      } else if (hash.includes('access_denied')) {
        toast.error(ru 
          ? 'Ссылка недействительна. Запросите новую.' 
          : 'Link is invalid. Please request a new one.'
        )
      } else {
        toast.error(ru 
          ? 'Ошибка авторизации. Попробуйте снова.' 
          : 'Authentication error. Please try again.'
        )
      }
      // Clean URL
      window.history.replaceState({}, '', '/auth/login')
    }
  }, [searchParams, ru])

  const { execute: executeRecaptcha } = useRecaptcha()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Verify reCAPTCHA
      const captchaToken = await executeRecaptcha('login')
      const captchaRes = await fetch('/api/auth/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken }),
      })
      if (!captchaRes.ok) {
        toast.error(ru ? 'Проверка reCAPTCHA не пройдена' : 'reCAPTCHA verification failed')
        setIsLoading(false)
        return
      }

      const { error } = await signIn(formData.email, formData.password)
      console.log('[LOGIN] signIn returned, error:', error)
      
      if (error) {
        toast.error(error)
        setIsLoading(false)
        return
      }
      
      console.log('[LOGIN] Success, redirecting...')
      toast.success('Login successful!')
      
      // Fetch profile to determine role
      const supabase = (await import('@/lib/supabase')).createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        const role = profile?.role || 'client'
        const defaultRedirect = role === 'admin' || role === 'trainer' ? '/dashboard' : '/client/home'
        const redirect = searchParams.get('redirect') || defaultRedirect
        window.location.href = redirect
      } else {
        window.location.href = searchParams.get('redirect') || '/client/home'
      }
    } catch (err) {
      console.error('[LOGIN] Exception:', err)
      toast.error('Something went wrong')
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Link href="/" className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">Q</span>
          </div>
        </Link>
        <CardTitle className="text-2xl">{t('auth.login.title')}</CardTitle>
        <CardDescription>{t('auth.login.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('common.email')} type="email" name="email" autoComplete="email" placeholder="your@email.com" icon={<Mail className="w-5 h-5" />} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          <Input label={t('common.password')} type="password" name="password" autoComplete="current-password" placeholder="••••••••" icon={<Lock className="w-5 h-5" />} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
          <div className="flex justify-end">
            <Link href="/auth/forgot-password" className="text-sm text-teal-500 hover:text-teal-600 transition-colors">{t('auth.login.forgotPassword')}</Link>
          </div>
          <Button type="submit" className="w-full" variant="gradient" size="lg" isLoading={isLoading}>{t('auth.login.button')}</Button>
          <p className="text-[11px] text-zinc-400 mt-3 text-center">
            {ru ? 'Этот сайт защищён reCAPTCHA. ' : 'Protected by reCAPTCHA. '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="underline">Privacy</a>{' · '}
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener" className="underline">Terms</a>
          </p>
        </form>
        <div className="mt-6 text-center">
          <p className="text-zinc-500 text-sm">{t('auth.login.noAccount')}{' '}<Link href="/auth/register" className="text-teal-500 hover:text-teal-600 font-medium transition-colors">{t('auth.login.register')}</Link></p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />{t('common.back')}
      </Link>
      <div className="absolute top-6 right-6"><LanguageSwitcher /></div>
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardContent className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </CardContent>
        </Card>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
