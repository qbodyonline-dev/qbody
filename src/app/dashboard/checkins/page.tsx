'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useTranslation } from '@/lib/i18n'
import { fetchWithAuth } from '@/lib/api'
import {
  Eye, CheckCircle2, Image, Loader2, AlertTriangle,
  TrendingDown, TrendingUp, Minus, Camera, ClipboardList
} from 'lucide-react'
import { toast } from 'sonner'

type Checkin = {
  id: string
  client_id: string
  checkin_date: string
  weight: number | null
  waist: number | null
  hips: number | null
  status: 'new' | 'reviewed' | 'flagged'
  flagged: boolean
  comment: string | null
  sleep_quality: number | null
  energy_level: number | null
  stress_level: number | null
  created_at: string
  profiles: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null
  checkin_photos: { id: string; photo_url: string; photo_type: string }[]
  checkin_responses: { id: string }[]
  previous_weight: number | null
  weight_change: number | null
  photos_count: number
  has_response: boolean
}

export default function CheckinsPage() {
  const { t, locale } = useTranslation()
  const ru = locale === 'ru'

  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchCheckins = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter && filter !== 'all') params.set('status', filter)
      const res = await fetchWithAuth(`/api/checkins?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCheckins(data.checkins || [])
      setTotal(data.total || 0)
    } catch {
      toast.error(ru ? 'Ошибка загрузки' : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [filter, ru])

  useEffect(() => { fetchCheckins() }, [fetchCheckins])

  const newCount = checkins.filter(c => c.status === 'new').length
  const flaggedCount = checkins.filter(c => c.flagged).length

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const today = new Date()
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)

    if (d.toDateString() === today.toDateString()) {
      return `${ru ? 'Сегодня' : 'Today'}, ${d.toLocaleTimeString(ru ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return `${ru ? 'Вчера' : 'Yesterday'}, ${d.toLocaleTimeString(ru ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`
    }
    return d.toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getInitials = (name: string | null) => {
    if (!name) return '??'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  const WeightChangeIcon = ({ change }: { change: number | null }) => {
    if (change === null || change === 0) return <Minus className="w-3 h-3 text-zinc-400" />
    if (change < 0) return <TrendingDown className="w-3 h-3 text-green-500" />
    return <TrendingUp className="w-3 h-3 text-orange-500" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{ru ? 'Чек-ины' : 'Check-ins'}</h1>
          <p className="text-zinc-500 mt-1">
            {total} {ru ? 'всего' : 'total'}
            {newCount > 0 && <span className="ml-2 text-teal-600 font-medium">· {newCount} {ru ? 'новых' : 'new'}</span>}
            {flaggedCount > 0 && <span className="ml-2 text-red-500 font-medium">· {flaggedCount} ⚑</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: ru ? 'Все' : 'All' },
            { key: 'new', label: ru ? 'Новые' : 'New' },
            { key: 'reviewed', label: ru ? 'Обработано' : 'Reviewed' },
            { key: 'flagged', label: ru ? 'Внимание' : 'Flagged' },
          ].map(f => (
            <Button key={f.key} variant={filter === f.key ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f.key)}>
              {f.key === 'new' && newCount > 0 && <span className="w-2 h-2 rounded-full bg-teal-400 mr-1.5" />}
              {f.key === 'flagged' && <AlertTriangle className="w-3 h-3 mr-1" />}
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>}

      {/* Empty */}
      {!loading && checkins.length === 0 && (
        <div className="text-center py-16">
          <ClipboardList className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-600 mb-2">{ru ? 'Нет чек-инов' : 'No check-ins yet'}</h3>
          <p className="text-zinc-400">{ru ? 'Чек-ины клиентов появятся здесь' : 'Client check-ins will appear here'}</p>
        </div>
      )}

      {/* Table */}
      {!loading && checkins.length > 0 && (
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 uppercase">{ru ? 'Клиент' : 'Client'}</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 uppercase">{ru ? 'Дата' : 'Date'}</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 uppercase">{ru ? 'Вес' : 'Weight'}</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 uppercase">{ru ? 'Изм.' : 'Change'}</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-zinc-500 uppercase">{ru ? 'Фото' : 'Photos'}</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-zinc-500 uppercase">{ru ? 'Самочувствие' : 'Wellness'}</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 uppercase">{ru ? 'Статус' : 'Status'}</th>
                  <th className="text-right py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {checkins.map((ci) => {
                  const name = ci.profiles?.full_name || ci.profiles?.email || '—'
                  return (
                    <tr key={ci.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      {/* Client */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={ci.profiles?.avatar_url || undefined} fallback={getInitials(ci.profiles?.full_name ?? null)} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate text-sm">{name}</p>
                          </div>
                        </div>
                      </td>
                      {/* Date */}
                      <td className="py-3 px-4 text-sm text-zinc-500 whitespace-nowrap">{formatDate(ci.created_at)}</td>
                      {/* Weight */}
                      <td className="py-3 px-4 font-medium text-sm">{ci.weight ? `${ci.weight} kg` : '—'}</td>
                      {/* Change */}
                      <td className="py-3 px-4">
                        {ci.weight_change !== null ? (
                          <span className={`text-sm font-medium inline-flex items-center gap-1 ${ci.weight_change < 0 ? 'text-green-600' : ci.weight_change > 0 ? 'text-orange-500' : 'text-zinc-400'}`}>
                            <WeightChangeIcon change={ci.weight_change} />
                            {ci.weight_change > 0 ? '+' : ''}{ci.weight_change} kg
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                      {/* Photos */}
                      <td className="py-3 px-4 text-center">
                        {ci.photos_count > 0 ? (
                          <Badge variant="secondary" className="text-xs"><Camera className="w-3 h-3 mr-1" />{ci.photos_count}</Badge>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                      {/* Wellness mini */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs">
                          {ci.sleep_quality && <span title={ru ? 'Сон' : 'Sleep'}>😴{ci.sleep_quality}</span>}
                          {ci.energy_level && <span title={ru ? 'Энергия' : 'Energy'}>⚡{ci.energy_level}</span>}
                          {ci.stress_level && <span title={ru ? 'Стресс' : 'Stress'}>🧠{ci.stress_level}</span>}
                          {!ci.sleep_quality && !ci.energy_level && !ci.stress_level && <span className="text-zinc-300">—</span>}
                        </div>
                      </td>
                      {/* Status */}
                      <td className="py-3 px-4">
                        {ci.flagged ? (
                          <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />{ru ? 'Внимание' : 'Flagged'}</Badge>
                        ) : ci.status === 'new' ? (
                          <Badge>{ru ? 'Новый' : 'New'}</Badge>
                        ) : (
                          <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" />{ru ? 'Готово' : 'Reviewed'}</Badge>
                        )}
                      </td>
                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <Link href={`/dashboard/checkins/${ci.id}`}>
                          <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      )}
    </div>
  )
}
