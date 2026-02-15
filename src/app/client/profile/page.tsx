'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { User, Mail, Phone, Lock, Save, Loader2, Camera, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '@/lib/api'

/* ── Label maps ── */
const goalLabels: Record<string, { en: string; ru: string }> = {
  weight_loss: { en: 'Lose Weight', ru: 'Похудеть' },
  toning: { en: 'Stay in Shape', ru: 'Поддержка формы' },
  muscle_gain: { en: 'Build Muscle', ru: 'Нарастить мышцы' },
  general_health: { en: 'Improve Nutrition', ru: 'Наладить питание' },
  recovery: { en: 'Recovery', ru: 'Восстановление' },
  postnatal: { en: 'Postnatal', ru: 'Послеродовое' },
}
const levelLabels: Record<string, { en: string; ru: string }> = {
  none: { en: 'No activity', ru: 'Нет нагрузки' },
  beginner: { en: '1-3x / week', ru: '1-3 раза / нед.' },
  intermediate: { en: '3+ / week', ru: '3+ / нед.' },
  advanced: { en: 'Professional', ru: 'Профессионал' },
}
const locationLabels: Record<string, { en: string; ru: string }> = {
  gym: { en: 'Gym', ru: 'Зал' },
  home: { en: 'Home', ru: 'Дома' },
  both: { en: 'Gym & Home', ru: 'Зал и дома' },
  outdoor: { en: 'Outdoor', ru: 'Улица' },
}

export default function ProfilePage() {
  const { t, locale } = useTranslation()
  const { user, profile, signOut } = useAuth()
  const ru = locale === 'ru'
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [fitnessData, setFitnessData] = useState<any>(null)
  const [loadingFitness, setLoadingFitness] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [changingPassword, setChangingPassword] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.full_name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
      })
      setAvatarUrl(profile.avatar_url || null)
    } else if (user) {
      setForm(f => ({ ...f, email: user.email || '' }))
    }
  }, [profile, user])

  // Load full profile with fitness data
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth('/api/client/profile')
        if (res.ok) {
          const data = await res.json()
          setFitnessData(data.profile)
        }
      } catch { /* ignore */ }
      finally { setLoadingFitness(false) }
    }
    if (user) load()
  }, [user])

  const initials = form.name
    ? form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : form.email?.slice(0, 2).toUpperCase() || 'U'

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('client.profile.onlyImages'))
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('client.profile.maxFileSize'))
      return
    }

    setUploadingPhoto(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'avatars')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Upload failed')
      }

      const data = await res.json()
      const newAvatarUrl = data.url

      // Update profile with new avatar URL
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id)

      if (error) throw error

      setAvatarUrl(newAvatarUrl)
      toast.success(t('client.profile.photoUpdated'))
    } catch (err) {
      console.error('Photo upload error:', err)
      toast.error(t('client.profile.photoUploadError'))
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemovePhoto = async () => {
    if (!user) return
    setUploadingPhoto(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id)

      if (error) throw error

      setAvatarUrl(null)
      toast.success(t('client.profile.photoRemoved'))
    } catch (err) {
      console.error('Remove photo error:', err)
      toast.error(t('client.profile.updateError'))
    } finally {
      setUploadingPhoto(false)
    }
  }

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

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== 'DELETE') return
    setDeleting(true)

    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      if (!res.ok) {
        throw new Error('Delete failed')
      }

      toast.success(t('client.profile.accountDeleted'))
      await signOut()
      router.push('/')
    } catch (err) {
      console.error('Delete account error:', err)
      toast.error(t('client.profile.deleteFailed'))
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{t('client.profile.title')}</h1>
        <p className="text-zinc-600 mt-1">{t('client.profile.subtitle')}</p>
      </div>

      {/* Personal Info Card */}
      <Card>
        <CardHeader><CardTitle>{t('client.profile.personalInfo')}</CardTitle></CardHeader>
        <CardContent>
          {/* Avatar Section */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative group">
              <Avatar src={avatarUrl || undefined} fallback={initials} size="xl" />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-zinc-900">{form.name || t('client.profile.notSet')}</p>
              <p className="text-sm text-zinc-500">{form.email}</p>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="text-xs"
                >
                  <Camera className="w-3 h-3 mr-1" />
                  {t('client.profile.changePhoto')}
                </Button>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePhoto}
                    disabled={uploadingPhoto}
                    className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    {t('client.profile.removePhoto')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Form */}
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

      {/* Fitness Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{ru ? 'Фитнес-профиль' : 'Fitness Profile'}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push('/client/onboarding?edit=true')}>
              {ru ? 'Редактировать' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingFitness ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-teal-500" /></div>
          ) : fitnessData ? (
            <div className="space-y-6">
              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: ru ? 'Вес' : 'Weight', value: fitnessData.current_weight ? `${fitnessData.current_weight} ${ru ? 'кг' : 'kg'}` : '—', icon: '⚖️' },
                  { label: ru ? 'Рост' : 'Height', value: fitnessData.height ? `${fitnessData.height} ${ru ? 'см' : 'cm'}` : '—', icon: '📏' },
                  { label: ru ? 'Цель' : 'Target', value: fitnessData.target_weight ? `${fitnessData.target_weight} ${ru ? 'кг' : 'kg'}` : '—', icon: '🎯' },
                  { label: ru ? 'Пол' : 'Gender', value: fitnessData.gender === 'male' ? (ru ? 'Мужской' : 'Male') : fitnessData.gender === 'female' ? (ru ? 'Женский' : 'Female') : '—', icon: '👤' },
                ].map((s, i) => (
                  <div key={i} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
                    <span className="text-xl">{s.icon}</span>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">{s.value}</p>
                    <p className="text-[11px] text-zinc-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Details */}
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: ru ? 'Дата рождения' : 'Date of birth', value: fitnessData.date_of_birth ? new Date(fitnessData.date_of_birth).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : null },
                  { label: ru ? 'Цель' : 'Goal', value: fitnessData.primary_goal ? (goalLabels[fitnessData.primary_goal]?.[ru ? 'ru' : 'en'] || fitnessData.primary_goal) : null },
                  { label: ru ? 'Уровень' : 'Level', value: fitnessData.training_experience ? (levelLabels[fitnessData.training_experience]?.[ru ? 'ru' : 'en'] || fitnessData.training_experience) : null },
                  { label: ru ? 'Место' : 'Location', value: fitnessData.training_location ? (locationLabels[fitnessData.training_location]?.[ru ? 'ru' : 'en'] || fitnessData.training_location) : null },
                  { label: ru ? 'Активность' : 'Activity', value: fitnessData.activity_level },
                  { label: ru ? 'Здоровье' : 'Health', value: fitnessData.medical_conditions },
                ].filter(d => d.value).map((d, i) => (
                  <div key={i}>
                    <p className="text-xs text-zinc-400 mb-0.5">{d.label}</p>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{d.value}</p>
                  </div>
                ))}
              </div>

              {/* Starting photo */}
              {fitnessData.photo_front && (
                <div>
                  <p className="text-xs text-zinc-400 mb-2">{ru ? 'Фото до' : 'Starting photo'}</p>
                  <img src={fitnessData.photo_front} alt="" className="w-32 h-40 object-cover rounded-xl" />
                </div>
              )}

              {/* Empty state */}
              {!fitnessData.current_weight && !fitnessData.primary_goal && (
                <div className="text-center py-6">
                  <p className="text-zinc-400 text-sm mb-3">{ru ? 'Заполните анкету для персонализации' : 'Complete your profile for personalized experience'}</p>
                  <Button variant="gradient" size="sm" onClick={() => router.push('/client/onboarding?edit=true')}>
                    {ru ? 'Заполнить анкету' : 'Fill Questionnaire'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-zinc-400 text-sm mb-3">{ru ? 'Заполните анкету' : 'Complete your profile'}</p>
              <Button variant="gradient" size="sm" onClick={() => router.push('/client/onboarding?edit=true')}>
                {ru ? 'Заполнить' : 'Fill out'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Card */}
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

      {/* Danger Zone Card */}
      <Card className="border-red-200 bg-red-50/30">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {t('client.profile.dangerZone')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 mb-4">
            {t('client.profile.deleteWarning')}
          </p>
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(true)}
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t('client.profile.deleteAccount')}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteConfirmText('')
        }}
        title={t('client.profile.deleteConfirmTitle')}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-100">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              {t('client.profile.deleteConfirmMessage')}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              {t('client.profile.typeDelete')}
            </label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
              placeholder="DELETE"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setDeleteConfirmText('')
              }}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE' || deleting}
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {t('client.profile.deleteAccount')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
