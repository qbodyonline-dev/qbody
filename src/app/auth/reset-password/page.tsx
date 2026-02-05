'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const { t, locale } = useTranslation()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const ru = locale === 'ru'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error(ru ? 'Пароли не совпадают' : 'Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error(ru ? 'Пароль должен быть минимум 6 символов' : 'Password must be at least 6 characters')
      return
    }

    setIsLoading(true)
    
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      
      if (error) {
        toast.error(error.message)
        setIsLoading(false)
        return
      }
      
      setIsSuccess(true)
      toast.success(ru ? 'Пароль успешно изменён!' : 'Password updated successfully!')
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch {
      toast.error(ru ? 'Что-то пошло не так' : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <Link href="/auth/login" className="absolute top-6 left-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        {ru ? 'Вернуться к входу' : 'Back to login'}
      </Link>
      
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">Q</span>
            </div>
          </Link>
          <CardTitle className="text-2xl">
            {ru ? 'Новый пароль' : 'Set new password'}
          </CardTitle>
          <CardDescription>
            {ru ? 'Введите новый пароль для вашего аккаунта' : 'Enter a new password for your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                {ru ? 'Пароль изменён!' : 'Password updated!'}
              </h3>
              <p className="text-zinc-500 mb-6">
                {ru ? 'Перенаправляем на страницу входа...' : 'Redirecting to login...'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={ru ? 'Новый пароль' : 'New password'}
                type="password"
                placeholder="••••••••"
                icon={<Lock className="w-5 h-5" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              
              <Input
                label={ru ? 'Подтвердите пароль' : 'Confirm password'}
                type="password"
                placeholder="••••••••"
                icon={<Lock className="w-5 h-5" />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                variant="gradient" 
                size="lg"
                isLoading={isLoading}
              >
                {ru ? 'Сохранить пароль' : 'Update password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
