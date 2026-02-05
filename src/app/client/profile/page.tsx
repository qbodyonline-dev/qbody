'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { useTranslation, useLocale } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { User, Mail, Phone, Lock, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { user, profile } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.full_name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
      })
    } else if (user) {
      setForm(f => ({ ...f, email: user.email || '' }))
    }
  }, [profile, user])

  const initials = form.name
    ? form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : form.email?.slice(0, 2).toUpperCase() || 'U'

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.name,
        phone: form.phone,
      })
      .eq('id', user.id)

    if (error) {
      toast.error(t('client.profile.updateError'))
    } else {
      toast.success(t('client.profile.updateSuccess'))
    }
    setSaving(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) {
      toast.error(t('client.profile.passwordMismatch'))
      return
    }
    if (passwords.new.length < 6) {
      toast.error(t('client.profile.passwordTooShort'))
      return
    }

    setChangingPassword(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: passwords.new })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t('client.profile.passwordChanged'))
      setPasswords({ current: '', new: '', confirm: '' })
    }
    setChangingPassword(false)
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
            <Avatar fallback={initials} size="lg" />
            <div>
              <p className="font-semibold text-zinc-900">{form.name || t('client.profile.notSet')}</p>
              <p className="text-sm text-zinc-500">{form.email}</p>
            </div>
          </div>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label={t('client.profile.name')}
              icon={<User className="w-4 h-4" />}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label={t('client.profile.email')}
              type="email"
              icon={<Mail className="w-4 h-4" />}
              value={form.email}
              disabled
            />
            <Input
              label={t('client.profile.phone')}
              icon={<Phone className="w-4 h-4" />}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 234 567 890"
            />
            <Button type="submit" variant="gradient" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {t('client.profile.updateProfile')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t('client.profile.security')}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label={t('client.profile.newPassword')}
              type="password"
              icon={<Lock className="w-4 h-4" />}
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              placeholder={t('client.profile.minCharacters')}
            />
            <Input
              label={t('client.profile.confirmPassword')}
              type="password"
              icon={<Lock className="w-4 h-4" />}
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              placeholder={t('client.profile.repeatPassword')}
            />
            <Button type="submit" variant="outline" disabled={changingPassword}>
              {changingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
              {t('client.profile.updatePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
