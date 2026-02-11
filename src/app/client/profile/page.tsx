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
import ClientQuestionnaire from '@/components/dashboard/ClientQuestionnaire'

export default function ProfilePage() {
  const { t, locale } = useTranslation()
  const { user, profile, signOut } = useAuth()
  const ru = locale === 'ru'
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
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

      {/* Client Questionnaire */}
      {user && <ClientQuestionnaire clientId={user.id} ru={ru} />}

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
