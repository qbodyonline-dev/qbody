'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { Mail, Lock, User, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function RegisterPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get('course')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) { toast.error('Passwords do not match'); return }
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success('Registration successful!')
    router.push(courseId ? `/checkout?course=${courseId}` : '/client/home')
    setIsLoading(false)
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
            <Input label={t('common.name')} type="text" placeholder="Your name" icon={<User className="w-5 h-5" />} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <Input label={t('common.email')} type="email" placeholder="your@email.com" icon={<Mail className="w-5 h-5" />} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            <Input label={t('common.password')} type="password" placeholder="Min 8 characters" icon={<Lock className="w-5 h-5" />} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
            <Input label={t('common.confirmPassword')} type="password" placeholder="Repeat password" icon={<Lock className="w-5 h-5" />} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
            <p className="text-xs text-zinc-500">{t('auth.register.terms')} <Link href="/terms" className="text-teal-500 hover:underline">{t('auth.register.termsLink')}</Link> {t('common.and')} <Link href="/privacy" className="text-teal-500 hover:underline">{t('auth.register.privacyLink')}</Link></p>
            <Button type="submit" className="w-full" variant="gradient" size="lg" isLoading={isLoading}>{courseId ? t('auth.register.buttonCourse') : t('auth.register.button')}</Button>
          </form>
          <div className="mt-6 text-center"><p className="text-zinc-500 text-sm">{t('auth.register.hasAccount')}{' '}<Link href="/auth/login" className="text-teal-500 hover:text-teal-600 font-medium transition-colors">{t('auth.register.login')}</Link></p></div>
        </CardContent>
      </Card>
    </div>
  )
}
