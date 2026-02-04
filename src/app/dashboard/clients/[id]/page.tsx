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
  BookOpen, ShoppingBag, DollarSign, CheckCircle2, Clock, 
  Save, Loader2, Heart, Baby, Key
} from 'lucide-react'
import { toast } from 'sonner'

const coursesMeta: Record<string, { title: string; titleRu: string; icon: any; color: string }> = {
  'breast-augmentation-recovery': { title: 'Breast Augmentation Recovery', titleRu: 'Восстановление после увеличения груди', icon: Heart, color: 'from-pink-500 to-rose-500' },
  'cesarean-recovery': { title: 'C-Section Recovery', titleRu: 'Восстановление после кесарева сечения', icon: Baby, color: 'from-purple-500 to-violet-500' },
}

type Client = {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  role: string
  created_at: string
  courses: { course_slug: string; granted_at: string }[]
  orders: { id: string; course_slug: string; amount: number; status: string; paid_at: string | null; created_at: string }[]
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

  const ru = locale === 'ru'

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/clients/${clientId}`)
        if (!res.ok) {
          setClient(null)
        } else {
          const data = await res.json()
          setClient(data)
          setEditForm({ full_name: data.full_name || '', phone: data.phone || '' })
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
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' })
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
    if (newPassword.length < 6) {
      toast.error(ru ? 'Минимум 6 символов' : 'Minimum 6 characters')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <Avatar fallback={initials} size="lg" />
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
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-teal-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{client.courses.length}</p>
              <p className="text-sm text-zinc-500">{ru ? 'Курсов' : 'Courses'}</p>
            </div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{client.orders.filter(o => o.status === 'paid').length}</p>
              <p className="text-sm text-zinc-500">{ru ? 'Покупок' : 'Purchases'}</p>
            </div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">${(totalSpent / 100).toFixed(0)}</p>
              <p className="text-sm text-zinc-500">{ru ? 'Потрачено' : 'Spent'}</p>
            </div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{memberSince}</p>
              <p className="text-sm text-zinc-500">{ru ? 'Регистрация' : 'Registered'}</p>
            </div>
          </div>
        </CardContent></Card>
      </div>

      {/* Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {ru ? 'Купленные курсы' : 'Purchased Courses'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {client.courses.length > 0 ? (
            <div className="space-y-3">
              {client.courses.map((access) => {
                const meta = coursesMeta[access.course_slug]
                if (!meta) return null
                const Icon = meta.icon
                return (
                  <div key={access.course_slug} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white/80" />
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{ru ? meta.titleRu : meta.title}</p>
                        <p className="text-sm text-zinc-500">
                          {ru ? 'Доступ с' : 'Access since'}: {new Date(access.granted_at).toLocaleDateString(ru ? 'ru-RU' : 'en-US')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3 mr-1" />{ru ? 'Активен' : 'Active'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
              <p className="text-zinc-500">{ru ? 'Нет купленных курсов' : 'No courses purchased'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            {ru ? 'История заказов' : 'Order History'}
          </CardTitle>
        </CardHeader>
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
                  </tr>
                </thead>
                <tbody>
                  {client.orders.map((order) => {
                    const meta = coursesMeta[order.course_slug]
                    return (
                      <tr key={order.id} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
                          {meta ? (ru ? meta.titleRu : meta.title) : order.course_slug}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          ${(order.amount / 100).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={order.status === 'paid' ? 'success' : order.status === 'pending' ? 'warning' : 'secondary'}>
                            {order.status === 'paid' ? (ru ? 'Оплачен' : 'Paid') : order.status === 'pending' ? (ru ? 'Ожидает' : 'Pending') : order.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-500">
                          {new Date(order.paid_at || order.created_at).toLocaleDateString(ru ? 'ru-RU' : 'en-US')}
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

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={ru ? 'Редактировать профиль' : 'Edit Profile'} size="md">
        <div className="space-y-4">
          <Input
            label={ru ? 'Полное имя' : 'Full Name'}
            value={editForm.full_name}
            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
            placeholder="Anna Kovaleva"
          />
          <Input
            label="Email"
            type="email"
            value={client.email}
            disabled
          />
          <Input
            label={ru ? 'Телефон' : 'Phone'}
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            placeholder="+1 234 567 890"
          />
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
          <p className="text-sm text-zinc-500">
            {ru ? 'Установите новый пароль для клиента' : 'Set a new password for this client'}
          </p>
          <Input
            label={ru ? 'Новый пароль' : 'New Password'}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={ru ? 'Минимум 6 символов' : 'Min 6 characters'}
          />
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
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={saving}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              {ru ? 'Удалить' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
