'use client'
import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/lib/i18n'
import {
  ArrowLeft, Check, User, Camera, Loader2, AlertCircle, X, Upload
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function OnboardClientPage() {
  const { locale } = useTranslation()
  const { session } = useAuth()
  const router = useRouter()
  const ru = locale === 'ru'
  const [submitting, setSubmitting] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: 'female',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const u = (key: string, val: string) => {
    setData(prev => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!data.email.trim()) {
      errs.email = ru ? 'Email обязателен' : 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      errs.email = ru ? 'Некорректный email' : 'Invalid email'
    }
    if (!data.firstName.trim()) {
      errs.firstName = ru ? 'Имя обязательно' : 'First name is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(ru ? 'Выберите изображение' : 'Please select an image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(ru ? 'Максимум 5 МБ' : 'Max 5 MB')
      return
    }
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile || !session?.access_token) return null
    try {
      setUploadingAvatar(true)
      const formData = new FormData()
      formData.append('file', avatarFile)
      formData.append('folder', 'avatars')
      formData.append('fileName', `${userId}-avatar`)

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const result = await res.json()
      return result.url || null
    } catch (err) {
      console.error('Avatar upload error:', err)
      return null
    } finally {
      setUploadingAvatar(false)
    }
  }

  const submit = async () => {
    if (!validate()) return
    if (!session?.access_token) {
      toast.error(ru ? 'Нет авторизации' : 'Not authorized')
      return
    }

    setSubmitting(true)
    try {
      // 1. Create client account
      const res = await fetch('/api/clients/onboard', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          // Send empty strings for fields we removed
          conditions: '', surgeries: '', medications: '', allergies: '', injuries: '',
          goal: '', experience: '', daysPerWeek: '', equipment: '', motivation: '',
          weight: '', height: '', chest: '', waist: '', hips: '', arm: '', thigh: '',
          plan: '', program: '', startDate: '', notes: '',
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to create client')

      const userId = result.client.id

      // 2. Upload avatar if selected
      if (avatarFile) {
        const avatarUrl = await uploadAvatar(userId)
        if (avatarUrl) {
          // Update profile with avatar
          await fetch('/api/clients/update-avatar', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, avatarUrl }),
          }).catch(() => {}) // Non-critical
        }
      }

      toast.success(ru ? 'Клиент создан!' : 'Client created!')
      router.push(`/dashboard/clients/${userId}`)
    } catch (err: any) {
      const msg = err.message || ''
      if (msg.includes('already exists') || msg.includes('already')) {
        toast.error(ru ? 'Пользователь с таким email уже существует' : 'A user with this email already exists')
      } else {
        toast.error(ru ? `Ошибка: ${msg}` : `Error: ${msg}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{ru ? 'Новый клиент' : 'New Client'}</h1>
          <p className="text-zinc-500 mt-1">{ru ? 'Создание аккаунта клиента' : 'Create a client account'}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Section title */}
          <div className="flex items-center gap-3 pb-2 border-b border-zinc-100">
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <User className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900">
              {ru ? 'Личные данные' : 'Personal Information'}
            </h2>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-2xl border-2 border-dashed border-zinc-300 flex items-center justify-center cursor-pointer hover:border-teal-500 transition-colors overflow-hidden bg-zinc-50"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-7 h-7 text-zinc-300" />
                )}
              </div>
              {avatarPreview && (
                <button
                  onClick={removeAvatar}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-700">{ru ? 'Фото клиента' : 'Client photo'}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{ru ? 'JPG, PNG до 5 МБ' : 'JPG, PNG up to 5 MB'}</p>
              <button
                onClick={() => fileRef.current?.click()}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium mt-1 flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                {avatarPreview ? (ru ? 'Заменить' : 'Replace') : (ru ? 'Загрузить' : 'Upload')}
              </button>
            </div>
          </div>

          {/* Name */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1.5 block">
                {ru ? 'Имя' : 'First name'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.firstName}
                onChange={e => u('firstName', e.target.value)}
                placeholder={ru ? 'Александра' : 'Alexandra'}
                className={`w-full h-11 px-4 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${
                  errors.firstName ? 'border-red-400 bg-red-50' : 'border-zinc-200 focus:border-teal-500'
                }`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{errors.firstName}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1.5 block">
                {ru ? 'Фамилия' : 'Last name'}
              </label>
              <input
                type="text"
                value={data.lastName}
                onChange={e => u('lastName', e.target.value)}
                placeholder={ru ? 'Иванова' : 'Smith'}
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1.5 block">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={data.email}
              onChange={e => u('email', e.target.value)}
              placeholder="client@example.com"
              className={`w-full h-11 px-4 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${
                errors.email ? 'border-red-400 bg-red-50' : 'border-zinc-200 focus:border-teal-500'
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.email}
              </p>
            )}
            <p className="text-xs text-zinc-400 mt-1">
              {ru ? 'На этот email будет создан аккаунт с временным паролем' : 'An account with a temporary password will be created'}
            </p>
          </div>

          {/* Phone + Birth date */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1.5 block">
                {ru ? 'Телефон' : 'Phone'}
              </label>
              <input
                type="tel"
                value={data.phone}
                onChange={e => u('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1.5 block">
                {ru ? 'Дата рождения' : 'Date of birth'}
              </label>
              <input
                type="date"
                value={data.birthDate}
                onChange={e => u('birthDate', e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-2 block">
              {ru ? 'Пол' : 'Gender'}
            </label>
            <div className="flex gap-3">
              {([
                { v: 'female', en: 'Female', ru: 'Женский' },
                { v: 'male', en: 'Male', ru: 'Мужской' },
              ] as const).map(g => (
                <button
                  key={g.v}
                  type="button"
                  onClick={() => u('gender', g.v)}
                  className={`flex-1 h-11 rounded-xl border text-sm font-medium transition-all ${
                    data.gender === g.v
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
                  }`}
                >
                  {ru ? g.ru : g.en}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-between items-center">
        <Link href="/dashboard/clients">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />{ru ? 'Отмена' : 'Cancel'}
          </Button>
        </Link>
        <Button variant="gradient" onClick={submit} disabled={submitting}>
          {submitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{ru ? 'Создание...' : 'Creating...'}</>
          ) : (
            <><Check className="w-4 h-4 mr-2" />{ru ? 'Создать клиента' : 'Create Client'}</>
          )}
        </Button>
      </div>
    </div>
  )
}
