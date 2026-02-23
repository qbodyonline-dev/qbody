'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { 
  ArrowLeft, Edit, Trash2, Mail, Phone, Calendar, 
  BookOpen, ShoppingBag, DollarSign, CheckCircle2,
  Save, Loader2, Heart, Baby, Key, Plus, X, Play, Pause,
  Eye, BarChart3, CreditCard, ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuth } from '@/lib/api'
import ClientProgress from '@/components/dashboard/ClientProgress'

/* ── Fitness label maps ── */
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
  beginner: { en: '1-3x / week', ru: '1-3 р/нед' },
  intermediate: { en: '3+ / week', ru: '3+ / нед' },
  advanced: { en: 'Professional', ru: 'Профессионал' },
}
const locationLabels: Record<string, { en: string; ru: string }> = {
  gym: { en: 'Gym', ru: 'Зал' },
  home: { en: 'Home', ru: 'Дома' },
  both: { en: 'Gym & Home', ru: 'Зал и дома' },
  outdoor: { en: 'Outdoor', ru: 'Улица' },
}

const coursesMeta: Record<string, { title: string; titleSecondary: string; icon: any; color: string }> = {
  'breast-augmentation-recovery': { title: 'Breast Augmentation Recovery', titleSecondary: 'Восстановление после увеличения груди', icon: Heart, color: 'from-pink-500 to-rose-500' },
  'cesarean-recovery': { title: 'C-Section Recovery', titleSecondary: 'Восстановление после кесарева сечения', icon: Baby, color: 'from-purple-500 to-violet-500' },
}

type CourseAccess = {
  course_slug: string
  granted_at: string
  is_active?: boolean
  total_lessons?: number
  completed_lessons?: number
  progress_percent?: number
}

type Order = {
  id: string
  course_slug: string
  amount: number
  currency?: string
  status: string
  paid_at: string | null
  created_at: string
  stripe_session_id?: string
  stripe_customer_id?: string
  stripe_payment_intent_id?: string
}

type Client = {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  avatar_url: string | null
  role: string
  created_at: string
  onboarding_completed?: boolean
  gender?: string
  date_of_birth?: string
  height?: number
  current_weight?: number
  target_weight?: number
  primary_goal?: string
  training_experience?: string
  training_location?: string
  activity_level?: string
  medical_conditions?: string
  photo_front?: string
  courses: CourseAccess[]
  orders: Order[]
}

type AvailableCourse = {
  id: string
  slug: string
  title: string
  title_secondary: string
}

export default function ClientDetailPage() {
  const { t, locale } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', phone: '' })
  const [newPassword, setNewPassword] = useState('')
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false)
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [courseProgress, setCourseProgress] = useState<CourseAccess[]>([])
  const [removeCourseSlug, setRemoveCourseSlug] = useState<string | null>(null)

  const ru = locale === 'ru'

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth(`/api/clients/${clientId}`)
        if (!res.ok) {
          setClient(null)
        } else {
          const data = await res.json()
          setClient(data)
          setEditForm({ full_name: data.full_name || '', phone: data.phone || '' })
        }
        
        const coursesRes = await fetchWithAuth('/api/courses')
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json()
          setAvailableCourses(coursesData.map((c: any) => ({
            id: c.id,
            slug: c.slug,
            title: c.title,
            title_secondary: c.title_secondary,
          })))
        }
        
        const progressRes = await fetchWithAuth(`/api/clients/${clientId}/courses`)
        if (progressRes.ok) {
          const progressData = await progressRes.json()
          setCourseProgress(progressData.courses || [])
        }
      } catch {
        setClient(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clientId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-zinc-500 mb-4">{ru ? 'Клиент не найден' : 'Client not found'}</p>
        <Link href="/dashboard/clients">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />{ru ? 'Назад к клиентам' : 'Back to clients'}</Button>
        </Link>
      </div>
    )
  }

  const initials = client.full_name
    ? client.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : client.email?.slice(0, 2).toUpperCase() || 'U'

  const totalSpent = client.orders.filter(o => o.status === 'paid').reduce((s, o) => s + o.amount, 0)
  const memberSince = new Date(client.created_at).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetchWithAuth(`/api/clients/${clientId}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error('Failed to update')
      setClient({ ...client, full_name: editForm.full_name, phone: editForm.phone })
      setIsEditModalOpen(false)
      toast.success(ru ? 'Профиль обновлён!' : 'Profile updated!')
    } catch {
      toast.error(ru ? 'Ошибка обновления' : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const res = await fetchWithAuth(`/api/clients/${clientId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success(ru ? 'Клиент удалён' : 'Client deleted')
      router.push('/dashboard/clients')
    } catch {
      toast.error(ru ? 'Ошибка удаления' : 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      toast.error(ru ? 'Минимум 8 символов' : 'Minimum 8 characters')
      return
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast.error(ru ? 'Нужна заглавная буква' : 'Must contain an uppercase letter')
      return
    }
    if (!/[0-9]/.test(newPassword)) {
      toast.error(ru ? 'Нужна цифра' : 'Must contain a number')
      return
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(newPassword)) {
      toast.error(ru ? 'Нужен спецсимвол (!@#$...)' : 'Must contain a special character')
      return
    }
    setSaving(true)
    try {
      const res = await fetchWithAuth(`/api/clients/${clientId}/password`, {
        method: 'POST',
        body: JSON.stringify({ password: newPassword }),
      })
      if (!res.ok) throw new Error('Failed')
      setIsPasswordModalOpen(false)
      setNewPassword('')
      toast.success(ru ? 'Пароль изменён!' : 'Password changed!')
    } catch {
      toast.error(ru ? 'Ошибка смены пароля' : 'Password change failed')
    } finally {
      setSaving(false)
    }
  }

  const handleAddCourse = async () => {
    if (!selectedCourse) {
      toast.error(ru ? 'Выберите курс' : 'Select a course')
      return
    }
    setSaving(true)
    try {
      const res = await fetchWithAuth(`/api/clients/${clientId}/courses`, {
        method: 'POST',
        body: JSON.stringify({ course_slug: selectedCourse }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      const clientRes = await fetchWithAuth(`/api/clients/${clientId}`)
      if (clientRes.ok) {
        const data = await clientRes.json()
        setClient(data)
      }
      const progressRes = await fetchWithAuth(`/api/clients/${clientId}/courses`)
      if (progressRes.ok) {
        const progressData = await progressRes.json()
        setCourseProgress(progressData.courses || [])
      }
      setIsAddCourseModalOpen(false)
      setSelectedCourse('')
      toast.success(ru ? 'Курс добавлен!' : 'Course added!')
    } catch (e: any) {
      toast.error(e.message || (ru ? 'Ошибка добавления курса' : 'Failed to add course'))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleCourseStatus = async (courseSlug: string, isActive: boolean) => {
    setSaving(true)
    try {
      const res = await fetchWithAuth(`/api/clients/${clientId}/courses`, {
        method: 'PATCH',
        body: JSON.stringify({ course_slug: courseSlug, is_active: !isActive }),
      })
      if (!res.ok) throw new Error('Failed')
      setCourseProgress(prev => prev.map(c => 
        c.course_slug === courseSlug ? { ...c, is_active: !isActive } : c
      ))
      if (client) {
        setClient({
          ...client,
          courses: client.courses.map(c => 
            c.course_slug === courseSlug ? { ...c, is_active: !isActive } : c
          )
        })
      }
      toast.success(ru 
        ? (isActive ? 'Подписка приостановлена' : 'Подписка активирована') 
        : (isActive ? 'Subscription paused' : 'Subscription activated')
      )
    } catch {
      toast.error(ru ? 'Ошибка обновления' : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const confirmRemoveCourse = async () => {
    if (!removeCourseSlug) return
    const courseSlug = removeCourseSlug
    setRemoveCourseSlug(null)
    setSaving(true)
    try {
      const res = await fetchWithAuth(`/api/clients/${clientId}/courses?course_slug=${courseSlug}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed')
      setCourseProgress(prev => prev.filter(c => c.course_slug !== courseSlug))
      if (client) {
        setClient({
          ...client,
          courses: client.courses.filter(c => c.course_slug !== courseSlug)
        })
      }
      toast.success(ru ? 'Доступ удалён' : 'Access removed')
    } catch {
      toast.error(ru ? 'Ошибка удаления' : 'Remove failed')
    } finally {
      setSaving(false)
    }
  }

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order)
    setIsOrderDetailModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <Avatar src={client.avatar_url || undefined} fallback={initials} size="lg" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {client.full_name || (ru ? 'Без имени' : 'No name')}
              </h1>
              <Badge variant="success">{ru ? 'Активен' : 'Active'}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-zinc-500">
              <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{client.email}</span>
              {client.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{client.phone}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            <Edit className="w-4 h-4 mr-2" />{ru ? 'Редактировать' : 'Edit'}
          </Button>
          <Button variant="outline" onClick={() => setIsPasswordModalOpen(true)}>
            <Key className="w-4 h-4 mr-2" />{ru ? 'Пароль' : 'Password'}
          </Button>
          <Button variant="outline" className="text-red-500 hover:bg-red-50" onClick={() => setIsDeleteModalOpen(true)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center"><BookOpen className="w-6 h-6 text-teal-500" /></div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{client.courses.length}</p>
              <p className="text-sm text-zinc-500">{ru ? 'Курсов' : 'Courses'}</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center"><ShoppingBag className="w-6 h-6 text-green-500" /></div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{client.orders.filter(o => o.status === 'paid').length}</p>
              <p className="text-sm text-zinc-500">{ru ? 'Покупок' : 'Purchases'}</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center"><DollarSign className="w-6 h-6 text-orange-500" /></div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">${(totalSpent / 100).toFixed(0)}</p>
              <p className="text-sm text-zinc-500">{ru ? 'Потрачено' : 'Spent'}</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center"><Calendar className="w-6 h-6 text-purple-500" /></div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{memberSince}</p>
              <p className="text-sm text-zinc-500">{ru ? 'Регистрация' : 'Registered'}</p>
            </div>
          </div>
        </CardContent></Card>
      </div>

      {/* Fitness Profile */}
      {(client.current_weight || client.primary_goal || client.height) && (
        <Card>
          <CardHeader><CardTitle>{ru ? 'Фитнес-профиль' : 'Fitness Profile'}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: ru ? 'Вес' : 'Weight', value: client.current_weight ? `${client.current_weight} ${ru ? 'кг' : 'kg'}` : '\u2014', icon: '\u2696\uFE0F' },
                  { label: ru ? 'Рост' : 'Height', value: client.height ? `${client.height} ${ru ? 'см' : 'cm'}` : '\u2014', icon: '\uD83D\uDCCF' },
                  { label: ru ? 'Цель' : 'Target', value: client.target_weight ? `${client.target_weight} ${ru ? 'кг' : 'kg'}` : '\u2014', icon: '\uD83C\uDFAF' },
                  { label: ru ? 'Пол' : 'Gender', value: client.gender === 'male' ? (ru ? 'Муж.' : 'Male') : client.gender === 'female' ? (ru ? 'Жен.' : 'Female') : '\u2014', icon: '\uD83D\uDC64' },
                ].map((s, i) => (
                  <div key={i} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
                    <span className="text-xl">{s.icon}</span>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">{s.value}</p>
                    <p className="text-[11px] text-zinc-400">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: ru ? 'Дата рождения' : 'Date of birth', value: client.date_of_birth ? new Date(client.date_of_birth).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : null },
                  { label: ru ? 'Цель' : 'Goal', value: client.primary_goal ? (goalLabels[client.primary_goal]?.[ru ? 'ru' : 'en'] || client.primary_goal) : null },
                  { label: ru ? 'Уровень' : 'Level', value: client.training_experience ? (levelLabels[client.training_experience]?.[ru ? 'ru' : 'en'] || client.training_experience) : null },
                  { label: ru ? 'Место' : 'Location', value: client.training_location ? (locationLabels[client.training_location]?.[ru ? 'ru' : 'en'] || client.training_location) : null },
                  { label: ru ? 'Здоровье' : 'Health', value: client.medical_conditions },
                ].filter(d => d.value).map((d, i) => (
                  <div key={i}>
                    <p className="text-xs text-zinc-400 mb-0.5">{d.label}</p>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{d.value}</p>
                  </div>
                ))}
              </div>
              {client.photo_front && (
                <div>
                  <p className="text-xs text-zinc-400 mb-2">{ru ? 'Фото до' : 'Starting photo'}</p>
                  <img src={client.photo_front} alt="" className="w-32 h-40 object-cover rounded-xl" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Courses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" />{ru ? 'Доступ к курсам' : 'Course Access'}</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsAddCourseModalOpen(true)}><Plus className="w-4 h-4 mr-2" />{ru ? 'Добавить курс' : 'Add Course'}</Button>
        </CardHeader>
        <CardContent>
          {client.courses.length > 0 ? (
            <div className="space-y-3">
              {client.courses.map((access) => {
                const meta = coursesMeta[access.course_slug]
                const progress = courseProgress.find(p => p.course_slug === access.course_slug)
                const Icon = meta?.icon || BookOpen
                const isActive = access.is_active !== false
                return (
                  <div key={access.course_slug} className={`flex flex-col p-4 rounded-xl ${isActive ? 'bg-zinc-50 dark:bg-zinc-800/50' : 'bg-zinc-100 dark:bg-zinc-800/30 opacity-60'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta?.color || 'from-teal-500 to-emerald-500'} flex items-center justify-center`}><Icon className="w-6 h-6 text-white/80" /></div>
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{meta ? (ru ? meta.titleSecondary : meta.title) : access.course_slug}</p>
                          <p className="text-sm text-zinc-500">{ru ? 'Доступ с' : 'Access since'}: {new Date(access.granted_at).toLocaleDateString(ru ? 'ru-RU' : 'en-US')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={isActive ? 'success' : 'secondary'}>
                          {isActive ? (<><CheckCircle2 className="w-3 h-3 mr-1" />{ru ? 'Активен' : 'Active'}</>) : (<><Pause className="w-3 h-3 mr-1" />{ru ? 'Приостановлен' : 'Paused'}</>)}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleCourseStatus(access.course_slug, isActive)} disabled={saving} title={isActive ? (ru ? 'Приостановить' : 'Pause') : (ru ? 'Активировать' : 'Activate')}>
                          {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => setRemoveCourseSlug(access.course_slug)} disabled={saving} title={ru ? 'Удалить доступ' : 'Remove access'}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {progress && progress.total_lessons && progress.total_lessons > 0 && (
                      <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-zinc-500 flex items-center gap-1"><BarChart3 className="w-4 h-4" />{ru ? 'Прогресс' : 'Progress'}</span>
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{progress.completed_lessons}/{progress.total_lessons} {ru ? 'уроков' : 'lessons'} ({progress.progress_percent}%)</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-300" style={{ width: `${progress.progress_percent}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
              <p className="text-zinc-500 mb-4">{ru ? 'Нет доступа к курсам' : 'No course access'}</p>
              <Button variant="outline" onClick={() => setIsAddCourseModalOpen(true)}><Plus className="w-4 h-4 mr-2" />{ru ? 'Добавить курс' : 'Add Course'}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingBag className="w-5 h-5" />{ru ? 'История заказов' : 'Order History'}</CardTitle></CardHeader>
        <CardContent>
          {client.orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{ru ? 'Курс' : 'Course'}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{ru ? 'Сумма' : 'Amount'}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{ru ? 'Статус' : 'Status'}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{ru ? 'Дата' : 'Date'}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{ru ? 'Действия' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {client.orders.map((order) => {
                    const meta = coursesMeta[order.course_slug]
                    return (
                      <tr key={order.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">{meta ? (ru ? meta.titleSecondary : meta.title) : order.course_slug}</td>
                        <td className="py-3 px-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">${(order.amount / 100).toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={order.status === 'paid' ? 'success' : order.status === 'pending' ? 'warning' : 'secondary'}>
                            {order.status === 'paid' ? (ru ? 'Оплачен' : 'Paid') : order.status === 'pending' ? (ru ? 'Ожидает' : 'Pending') : order.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-500">{new Date(order.paid_at || order.created_at).toLocaleDateString(ru ? 'ru-RU' : 'en-US')}</td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm" onClick={() => openOrderDetail(order)} title={ru ? 'Подробности' : 'View details'}><Eye className="w-4 h-4" /></Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
              <p className="text-zinc-500">{ru ? 'Нет заказов' : 'No orders'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ClientProgress clientId={clientId} ru={ru} />

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={ru ? 'Редактировать профиль' : 'Edit Profile'} size="md">
        <div className="space-y-4">
          <Input label={ru ? 'Полное имя' : 'Full Name'} value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} placeholder="Anna Kovaleva" />
          <Input label="Email" type="email" value={client.email} disabled />
          <Input label={ru ? 'Телефон' : 'Phone'} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+1 234 567 890" />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>{ru ? 'Отмена' : 'Cancel'}</Button>
            <Button variant="gradient" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {ru ? 'Сохранить' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Password Modal */}
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title={ru ? 'Сменить пароль' : 'Change Password'} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">{ru ? 'Установите новый пароль для клиента' : 'Set a new password for this client'}</p>
          <Input label={ru ? 'Новый пароль' : 'New Password'} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={ru ? 'Мин. 8: A-Z, 0-9, спецсимвол' : 'Min 8: A-Z, 0-9, special char'} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>{ru ? 'Отмена' : 'Cancel'}</Button>
            <Button variant="gradient" onClick={handleResetPassword} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
              {ru ? 'Сменить' : 'Change'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={ru ? 'Удалить клиента' : 'Delete Client'} size="sm">
        <div className="space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400">
            {ru ? 'Вы уверены что хотите удалить' : 'Are you sure you want to delete'} <strong>{client.full_name || client.email}</strong>?
            {ru ? ' Это действие необратимо.' : ' This cannot be undone.'}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>{ru ? 'Отмена' : 'Cancel'}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving} className="bg-red-500 hover:bg-red-600 text-white">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              {ru ? 'Удалить' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Course Modal */}
      <Modal isOpen={isAddCourseModalOpen} onClose={() => setIsAddCourseModalOpen(false)} title={ru ? 'Добавить курс' : 'Add Course'} size="md">
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">{ru ? 'Выберите курс для предоставления доступа клиенту' : 'Select a course to grant access to this client'}</p>
          <div className="space-y-2">
            {availableCourses.filter(c => !client.courses.some(cc => cc.course_slug === c.slug)).length > 0 ? (
              availableCourses.filter(c => !client.courses.some(cc => cc.course_slug === c.slug)).map(course => {
                const meta = coursesMeta[course.slug]
                const Icon = meta?.icon || BookOpen
                return (
                  <div key={course.id} onClick={() => setSelectedCourse(course.slug)}
                    className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-colors ${selectedCourse === course.slug ? 'bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-500' : 'bg-zinc-50 dark:bg-zinc-800/50 border-2 border-transparent hover:border-zinc-300'}`}>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta?.color || 'from-teal-500 to-emerald-500'} flex items-center justify-center`}><Icon className="w-5 h-5 text-white/80" /></div>
                    <div><p className="font-semibold text-zinc-900 dark:text-zinc-100">{ru ? (course.title_secondary || course.title) : course.title}</p></div>
                    {selectedCourse === course.slug && <CheckCircle2 className="w-5 h-5 text-teal-500 ml-auto" />}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-300 mb-3" />
                <p className="text-zinc-500">{ru ? 'Клиент имеет доступ ко всем курсам' : 'Client has access to all courses'}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsAddCourseModalOpen(false)}>{ru ? 'Отмена' : 'Cancel'}</Button>
            <Button variant="gradient" onClick={handleAddCourse} disabled={saving || !selectedCourse}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              {ru ? 'Добавить' : 'Add'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Remove Course Confirm Modal */}
      <Modal isOpen={!!removeCourseSlug} onClose={() => setRemoveCourseSlug(null)} title={ru ? 'Удалить доступ' : 'Remove Access'} size="sm">
        <div className="space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400">
            {ru ? 'Удалить доступ к этому курсу?' : 'Remove access to this course?'}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setRemoveCourseSlug(null)}>{ru ? 'Отмена' : 'Cancel'}</Button>
            <Button variant="destructive" onClick={confirmRemoveCourse} disabled={saving} className="bg-red-500 hover:bg-red-600 text-white">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              {ru ? 'Удалить' : 'Remove'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Order Detail Modal */}
      <Modal isOpen={isOrderDetailModalOpen} onClose={() => { setIsOrderDetailModalOpen(false); setSelectedOrder(null) }} title={ru ? 'Детали заказа' : 'Order Details'} size="md">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-white/80" /></div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {coursesMeta[selectedOrder.course_slug] ? (ru ? coursesMeta[selectedOrder.course_slug].titleSecondary : coursesMeta[selectedOrder.course_slug].title) : selectedOrder.course_slug}
                  </p>
                  <Badge variant={selectedOrder.status === 'paid' ? 'success' : selectedOrder.status === 'pending' ? 'warning' : 'secondary'}>
                    {selectedOrder.status === 'paid' ? (ru ? 'Оплачен' : 'Paid') : selectedOrder.status === 'pending' ? (ru ? 'Ожидает' : 'Pending') : selectedOrder.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2"><CreditCard className="w-4 h-4" />{ru ? 'Платёжная информация' : 'Payment Information'}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500">{ru ? 'Сумма' : 'Amount'}</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">${(selectedOrder.amount / 100).toFixed(2)} {selectedOrder.currency?.toUpperCase() || 'USD'}</p>
                </div>
                <div>
                  <p className="text-zinc-500">{ru ? 'Дата создания' : 'Created'}</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{new Date(selectedOrder.created_at).toLocaleString(ru ? 'ru-RU' : 'en-US')}</p>
                </div>
                {selectedOrder.paid_at && (
                  <div>
                    <p className="text-zinc-500">{ru ? 'Дата оплаты' : 'Paid at'}</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{new Date(selectedOrder.paid_at).toLocaleString(ru ? 'ru-RU' : 'en-US')}</p>
                  </div>
                )}
                <div>
                  <p className="text-zinc-500">Order ID</p>
                  <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300">{selectedOrder.id}</p>
                </div>
              </div>
            </div>
            {(selectedOrder.stripe_session_id || selectedOrder.stripe_payment_intent_id || selectedOrder.stripe_customer_id) && (
              <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2"><ExternalLink className="w-4 h-4" />Stripe</h4>
                <div className="space-y-2 text-sm">
                  {selectedOrder.stripe_payment_intent_id && (
                    <div>
                      <p className="text-zinc-500">Payment Intent</p>
                      <a href={`https://dashboard.stripe.com/payments/${selectedOrder.stripe_payment_intent_id}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-teal-600 hover:underline flex items-center gap-1">
                        {selectedOrder.stripe_payment_intent_id}<ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {selectedOrder.stripe_customer_id && (
                    <div>
                      <p className="text-zinc-500">Customer</p>
                      <a href={`https://dashboard.stripe.com/customers/${selectedOrder.stripe_customer_id}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-teal-600 hover:underline flex items-center gap-1">
                        {selectedOrder.stripe_customer_id}<ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {selectedOrder.stripe_session_id && (
                    <div>
                      <p className="text-zinc-500">Session</p>
                      <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300 break-all">{selectedOrder.stripe_session_id}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => { setIsOrderDetailModalOpen(false); setSelectedOrder(null) }}>{ru ? 'Закрыть' : 'Close'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
