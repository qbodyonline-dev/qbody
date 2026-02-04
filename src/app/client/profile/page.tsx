'use client'
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { useTranslation, useLocale } from '@/lib/i18n'
import { User, Mail, Phone, Lock } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const [profile, setProfile] = useState({ name: 'Anna Kovaleva', email: 'anna@example.com', phone: '+1 234 567 890' })

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(locale === 'ru' ? 'Профиль обновлён!' : 'Profile updated!')
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{t('client.profile.title')}</h1>
        <p className="text-zinc-600 mt-1">{t('client.profile.subtitle')}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('client.profile.personalInfo')}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Avatar fallback="AK" size="lg" />
            <div>
              <p className="font-semibold text-zinc-900">{profile.name}</p>
              <p className="text-sm text-zinc-500">{profile.email}</p>
            </div>
          </div>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input label={t('client.profile.name')} icon={<User className="w-4 h-4" />} value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} />
            <Input label={t('client.profile.email')} type="email" icon={<Mail className="w-4 h-4" />} value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} />
            <Input label={t('client.profile.phone')} icon={<Phone className="w-4 h-4" />} value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} />
            <Button type="submit" variant="gradient">{t('client.profile.updateProfile')}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t('client.profile.security')}</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4">
            <Input label={t('client.profile.currentPassword')} type="password" icon={<Lock className="w-4 h-4" />} />
            <Input label={t('client.profile.newPassword')} type="password" icon={<Lock className="w-4 h-4" />} />
            <Input label={t('client.profile.confirmPassword')} type="password" icon={<Lock className="w-4 h-4" />} />
            <Button type="submit" variant="outline">{t('client.profile.updatePassword')}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t('client.profile.preferences')}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="font-medium text-zinc-900">{t('client.profile.language')}</p></div>
              <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
                <button className={`px-3 py-1.5 rounded-md text-sm font-medium ${locale === 'en' ? 'bg-white shadow-sm' : ''}`}>🇺🇸 EN</button>
                <button className={`px-3 py-1.5 rounded-md text-sm font-medium ${locale === 'ru' ? 'bg-white shadow-sm' : ''}`}>🇷🇺 RU</button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
