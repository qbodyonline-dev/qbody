'use client'
import React, { useState, Suspense } from 'react'
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

function LoginForm() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    console.log('[LOGIN] Starting signIn...')
    
    try {
      const { error } = await signIn(formData.email, formData.password)
      console.log('[LOGIN] signIn returned, error:', error)
      
      if (error) {
        toast.error(error)
        setIsLoading(false)
        return
      }
      
      console.log('[LOGIN] Success, redirecting...')
      toast.success('Login successful!')
      const redirect = searchParams.get('redirect') || '/dashboard'
      window.location.href = redirect
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
          <Input label={t('common.email')} type="email" placeholder="your@email.com" icon={<Mail className="w-5 h-5" />} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          <Input label={t('common.password')} type="password" placeholder="••••••••" icon={<Lock className="w-5 h-5" />} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
          <div className="flex justify-end">
            <Link href="/auth/forgot-password" className="text-sm text-teal-500 hover:text-teal-600 transition-colors">{t('auth.login.forgotPassword')}</Link>
          </div>
          <Button type="submit" className="w-full" variant="gradient" size="lg" isLoading={isLoading}>{t('auth.login.button')}</Button>
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
