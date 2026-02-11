'use client'
import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { Mail, Lock, User, ArrowLeft, CheckCircle2, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { useRecaptcha } from '@/lib/recaptcha'

export default function RegisterPage() {
  return <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" /></div>}><RegisterContent /></Suspense>
}

function RegisterContent() {
  const { t, locale } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get('course')
  const [isLoading, setIsLoading] = useState(false)
  const [consent, setConsent] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })

  const ru = locale === 'ru'

  // Redirect already logged-in users
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const { createClient } = await import('@/lib/supabase')
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
          window.location.href = profile?.role === 'client' ? '/client/home' : '/dashboard'
        }
      } catch {}
    }
    checkAuth()
  }, [])
  const { execute: executeRecaptcha } = useRecaptcha()

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) return ru ? 'Пароль минимум 8 символов' : 'Password must be at least 8 characters'
    if (pw.length > 128) return ru ? 'Пароль слишком длинный' : 'Password is too long'
    if (!/[A-Z]/.test(pw)) return ru ? 'Пароль должен содержать хотя бы 1 заглавную букву' : 'Password must contain at least 1 uppercase letter'
    if (!/[0-9]/.test(pw)) return ru ? 'Пароль должен содержать хотя бы 1 цифру' : 'Password must contain at least 1 number'
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw)) return ru ? 'Пароль должен содержать хотя бы 1 спец. символ (!@#$%...)' : 'Password must contain at least 1 special character (!@#$%...)'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!consent) {
      toast.error(ru ? 'Необходимо согласиться с обработкой данных' : 'You must agree to the data processing policy')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(ru ? 'Пароли не совпадают' : 'Passwords do not match')
      return
    }

    const pwError = validatePassword(formData.password)
    if (pwError) { toast.error(pwError); return }

    if (!formData.phone.trim()) {
      toast.error(ru ? 'Укажите номер телефона' : 'Phone number is required')
      return
    }

    setIsLoading(true)
    try {
      // Get reCAPTCHA token
      const captchaToken = await executeRecaptcha('register')

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          courseSlug: courseId || undefined,
          captchaToken,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Registration failed')
        setIsLoading(false)
        return
      }
      toast.success(ru ? 'Регистрация успешна! Добро пожаловать!' : 'Registration successful! Welcome aboard!')
      router.push('/auth/login')
    } catch {
      toast.error(ru ? 'Что-то пошло не так' : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4 py-12">
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" />{t('common.back')}</Link>
      <div className="absolute top-6 right-6"><LanguageSwitcher /></div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center"><span className="text-white font-bold text-xl">Q</span></div>
          </Link>
          <CardTitle className="text-2xl">{t('auth.register.title')}</CardTitle>
          <CardDescription>{courseId ? t('auth.register.subtitleCourse') : t('auth.register.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {courseId && (
            <div className="mb-6 p-4 bg-teal-500/10 rounded-xl border border-teal-500/20">
              <div className="flex items-center gap-2 text-teal-600 font-medium"><CheckCircle2 className="w-5 h-5" />{t('auth.register.selectedCourse')}</div>
              <p className="text-sm text-zinc-600 mt-1">{t('auth.register.afterRegister')}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t('common.name')} type="text" name="name" autoComplete="name" placeholder={ru ? 'Ваше имя' : 'Your name'} icon={<User className="w-5 h-5" />} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <Input label={t('common.email')} type="email" name="email" autoComplete="email" placeholder="your@email.com" icon={<Mail className="w-5 h-5" />} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            <Input label={ru ? 'Телефон' : 'Phone'} type="tel" name="phone" autoComplete="tel" placeholder="+1 (555) 123-4567" icon={<Phone className="w-5 h-5" />} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
            <div>
              <Input label={t('common.password')} type="password" name="new-password" autoComplete="new-password" placeholder={ru ? 'Минимум 8 символов' : 'Min 8 characters'} icon={<Lock className="w-5 h-5" />} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
              <p className="text-xs text-zinc-400 mt-1">{ru ? 'Минимум 8 символов, 1 заглавная, 1 цифра, 1 спец. символ' : 'Min 8 chars, 1 uppercase, 1 number, 1 special character'}</p>
            </div>
            <Input label={t('common.confirmPassword')} type="password" name="confirm-password" autoComplete="new-password" placeholder={ru ? 'Повторите пароль' : 'Repeat password'} icon={<Lock className="w-5 h-5" />} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />

            <label className="flex items-start gap-3 cursor-pointer py-1">
              <input type="checkbox" className="mt-0.5 w-5 h-5 rounded border-zinc-300 accent-teal-500 flex-shrink-0" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span className="text-sm text-zinc-600">
                {ru
                  ? <>Я даю согласие на сбор и обработку моих персональных данных в соответствии с <Link href="/privacy" className="text-teal-500 hover:underline">Политикой конфиденциальности</Link></>
                  : <>I consent to the collection and processing of my personal data in accordance with the <Link href="/privacy" className="text-teal-500 hover:underline">Privacy Policy</Link></>
                }
              </span>
            </label>

            <p className="text-xs text-zinc-500">{t('auth.register.terms')} <Link href="/terms" className="text-teal-500 hover:underline">{t('auth.register.termsLink')}</Link> {t('common.and')} <Link href="/privacy" className="text-teal-500 hover:underline">{t('auth.register.privacyLink')}</Link></p>
            <Button type="submit" className="w-full" variant="gradient" size="lg" isLoading={isLoading}>{courseId ? t('auth.register.buttonCourse') : t('auth.register.button')}</Button>
            <p className="text-[11px] text-zinc-400 mt-3 text-center">
              {ru ? 'Этот сайт защищён reCAPTCHA. ' : 'Protected by reCAPTCHA. '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="underline">Privacy</a>{' · '}
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener" className="underline">Terms</a>
            </p>
          </form>
          <div className="mt-6 text-center"><p className="text-zinc-500 text-sm">{t('auth.register.hasAccount')}{' '}<Link href="/auth/login" className="text-teal-500 hover:text-teal-600 font-medium transition-colors">{t('auth.register.login')}</Link></p></div>
        </CardContent>
      </Card>
    </div>
  )
}
