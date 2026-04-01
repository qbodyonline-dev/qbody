'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import {
  Bell, BellOff, CheckCircle2, Clock, AlertTriangle,
  Loader2, Trash2, Eye, EyeOff,
  CalendarX, User
} from 'lucide-react'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: string
  client_id: string
  title: string
  message: string | null
  is_read: boolean
  metadata: Record<string, any>
  created_at: string
  profiles?: {
    id: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
  }
}

export default function AlertsPage() {
  const { locale } = useTranslation()
  const { session } = useAuth()
  const ru = locale === 'ru'

  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const headers = useCallback(() => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  }), [session?.access_token])

  const fetchNotifications = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (filter === 'unread') params.set('unread', '1')

      const res = await fetch(`/api/trainer-notifications?${params}`, {
        headers: headers(),
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setTotal(data.total || 0)
        setUnreadCount(data.unread || 0)
      } else {
        toast.error(ru ? 'Ошибка загрузки оповещений' : 'Failed to load alerts')
      }
    } catch (err) {
      console.error('Fetch notifications error:', err)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, filter, headers, ru])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/trainer-notifications', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ mark_all_read: true }),
      })
      if (res.ok) {
        toast.success(ru ? 'Все отмечены как прочитанные' : 'All marked as read')
        fetchNotifications()
      }
    } catch {
      toast.error(ru ? 'Ошибка' : 'Failed')
    }
  }

  const markRead = async (ids: string[]) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => ids.includes(n.id) ? { ...n, is_read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - ids.length))

    try {
      const res = await fetch('/api/trainer-notifications', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // Revert optimistic update
      setNotifications(prev =>
        prev.map(n => ids.includes(n.id) ? { ...n, is_read: false } : n)
      )
      setUnreadCount(prev => prev + ids.length)
      toast.error(ru ? 'Ошибка' : 'Failed to mark as read')
    }
  }

  const deleteOld = async () => {
    try {
      const res = await fetch('/api/trainer-notifications', {
        method: 'DELETE',
        headers: headers(),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(ru ? `Удалено: ${data.deleted}` : `Deleted: ${data.deleted}`)
        fetchNotifications()
      }
    } catch {
      toast.error(ru ? 'Ошибка' : 'Failed')
    }
  }

  const deleteNotification = async (id: string) => {
    // Optimistic UI
    const prev = notifications
    setNotifications(ns => ns.filter(n => n.id !== id))
    setTotal(t => Math.max(0, t - 1))
    const wasUnread = prev.find(n => n.id === id && !n.is_read)
    if (wasUnread) setUnreadCount(c => Math.max(0, c - 1))

    try {
      const res = await fetch('/api/trainer-notifications', {
        method: 'DELETE',
        headers: headers(),
        body: JSON.stringify({ ids: [id] }),
      })
      if (!res.ok) throw new Error()
      toast.success(ru ? 'Оповещение удалено' : 'Alert deleted')
    } catch {
      // Revert
      setNotifications(prev)
      setTotal(t => t + 1)
      if (wasUnread) setUnreadCount(c => c + 1)
      toast.error(ru ? 'Ошибка удаления' : 'Delete failed')
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return ru ? 'Только что' : 'Just now'
    if (diffHours < 24) return ru ? `${diffHours}ч назад` : `${diffHours}h ago`
    if (diffDays < 7) return ru ? `${diffDays}д назад` : `${diffDays}d ago`

    return d.toLocaleDateString(ru ? 'ru-RU' : 'en-US', {
      day: 'numeric', month: 'short',
    })
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'missed_checkin': return <CalendarX className="w-5 h-5 text-amber-500" />
      default: return <Bell className="w-5 h-5 text-blue-500" />
    }
  }

  const typeLabel = (type: string) => {
    switch (type) {
      case 'missed_checkin': return ru ? 'Пропущен чек-ин' : 'Missed check-in'
      default: return type
    }
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {ru ? 'Оповещения' : 'Alerts'}
          </h1>
          <p className="text-zinc-500 mt-1">
            {ru
              ? `${unreadCount} непрочитанных из ${total}`
              : `${unreadCount} unread of ${total}`}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {ru ? 'Прочитать все' : 'Mark all read'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={deleteOld}>
            <Trash2 className="w-4 h-4 mr-2" />
            {ru ? 'Очистить старые' : 'Clear old'}
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          <Bell className="w-4 h-4" />
          {ru ? 'Все' : 'All'}
          <span className="text-xs opacity-60">({total})</span>
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            filter === 'unread'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          <EyeOff className="w-4 h-4" />
          {ru ? 'Непрочитанные' : 'Unread'}
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications list */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BellOff className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
            <p className="text-zinc-500 font-medium">
              {filter === 'unread'
                ? (ru ? 'Нет непрочитанных оповещений' : 'No unread alerts')
                : (ru ? 'Нет оповещений' : 'No alerts yet')}
            </p>
            <p className="text-zinc-400 text-sm mt-1">
              {ru
                ? 'Оповещения появятся когда клиенты пропустят чек-ин'
                : 'Alerts will appear when clients miss check-ins'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const profile = notif.profiles
            const initials = profile?.full_name
              ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              : '??'

            return (
              <Card
                key={notif.id}
                className={`transition-all ${
                  !notif.is_read
                    ? 'border-l-4 border-l-amber-400 bg-amber-50/50 dark:bg-amber-900/10'
                    : 'opacity-75'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Client avatar */}
                    <div className="flex-shrink-0 mt-0.5">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <Avatar fallback={initials} size="sm" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {typeIcon(notif.type)}
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 border-amber-200 text-amber-600"
                        >
                          {typeLabel(notif.type)}
                        </Badge>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                        )}
                        <span className="text-xs text-zinc-400 ml-auto flex-shrink-0">
                          {formatDate(notif.created_at)}
                        </span>
                      </div>

                      <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                        {notif.title}
                      </p>

                      {notif.message && (
                        <p className="text-xs text-zinc-500 mt-1">{notif.message}</p>
                      )}

                      {/* Metadata chips */}
                      {notif.metadata && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {notif.metadata.days_since && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-[11px] font-medium">
                              <Clock className="w-3 h-3" />
                              {notif.metadata.days_since} {ru ? 'дней' : 'days'}
                            </span>
                          )}
                          {notif.metadata.last_checkin && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-md text-[11px]">
                              {ru ? 'Последний:' : 'Last:'} {notif.metadata.last_checkin}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        {profile && (
                          <Link href={`/dashboard/clients/${profile.id}`}>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              <User className="w-3 h-3 mr-1" />
                              {ru ? 'Профиль' : 'Profile'}
                            </Button>
                          </Link>
                        )}
                        {profile && (
                          <Link href={`/dashboard/checkins?client_id=${profile.id}`}>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              <CalendarX className="w-3 h-3 mr-1" />
                              {ru ? 'Чек-ины' : 'Check-ins'}
                            </Button>
                          </Link>
                        )}
                        {!notif.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs ml-auto"
                            onClick={() => markRead([notif.id])}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {ru ? 'Прочитано' : 'Mark read'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 ${notif.is_read ? 'ml-auto' : ''}`}
                          onClick={() => deleteNotification(notif.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          {ru ? 'Удалить' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Info card */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-100 dark:border-amber-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                {ru ? 'Как работают оповещения' : 'How alerts work'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {ru
                  ? 'Система ежедневно в 9:00 UTC проверяет клиентов с активными программами. Если чек-ин не сдан более 7 дней (настраивается), создаётся оповещение и отправляется email-дайджест. Частоту чек-инов можно изменить в настройках (ключ checkin_frequency_days).'
                  : 'The system checks daily at 9:00 UTC for clients with active programs. If a check-in is overdue by more than 7 days (configurable), an alert is created and an email digest is sent. Check-in frequency can be changed in settings (key: checkin_frequency_days).'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
