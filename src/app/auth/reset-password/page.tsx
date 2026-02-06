'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { Lock, ArrowLeft, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const { locale } = useTranslation()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [sessionError, setSessionError] = useState(false)

  const ru = locale === 'ru'

  // Check for valid session on mount
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      
      // Small delay to ensure session is set
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setSessionError(true)
      }
      
      setIsVerifying(false)
    }
    
    checkSession()
  }, [])

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

    if (!/[A-Z]/.test(password)) {
      toast.error(ru ? 'Пароль должен содержать хотя бы 1 заглавную букву' : 'Password must contain at least 1 uppercase letter')
      return
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
      toast.error(ru ? 'Пароль должен содержать хотя бы 1 спец. символ (!@#$%...)' : 'Password must contain at least 1 special character (!@#$%...)')
      return
    }

    setIsLoading(true)
    
    try {
      const supabase = createClient()
      
      // Get current user before updating
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase.auth.updateUser({ password })
      
      if (error) {
        toast.error(error.message)
        setIsLoading(false)
        return
      }
      
      // Send password reset success email notification
      if (user?.id) {
        fetch('/api/auth/password-reset-success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        }).catch(() => {}) // non-blocking
      }
      
      // Sign out after password change so user logs in with new password
      await supabase.auth.signOut()
      
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
          {isVerifying ? (
            <div className="text-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
              <p className="text-zinc-500">
                {ru ? 'Проверка ссылки...' : 'Verifying link...'}
              </p>
            </div>
          ) : sessionError ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                {ru ? 'Ссылка недействительна' : 'Invalid or expired link'}
              </h3>
              <p className="text-zinc-500 mb-6">
                {ru ? 'Ссылка для сброса пароля истекла или уже была использована.' : 'The password reset link has expired or has already been used.'}
              </p>
              <Link href="/auth/forgot-password">
                <Button variant="outline" className="w-full">
                  {ru ? 'Запросить новую ссылку' : 'Request new link'}
                </Button>
              </Link>
            </div>
          ) : isSuccess ? (
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
              <div>
                <Input
                  label={ru ? 'Новый пароль' : 'New password'}
                  type="password"
                  placeholder="••••••••"
                  icon={<Lock className="w-5 h-5" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-zinc-400 mt-1">{ru ? 'Минимум 6 символов, 1 заглавная буква, 1 спец. символ' : 'Min 6 chars, 1 uppercase letter, 1 special character'}</p>
              </div>
              
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
