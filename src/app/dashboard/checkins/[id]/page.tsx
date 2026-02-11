'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useTranslation } from '@/lib/i18n'
import { fetchWithAuth } from '@/lib/api'
import {
  ArrowLeft, CheckCircle2, TrendingDown, TrendingUp, Minus,
  Image as ImageIcon, Moon, Zap, Brain, Send, Loader2,
  Flag, AlertTriangle, Heart, Utensils, Dumbbell, X
} from 'lucide-react'
import { toast } from 'sonner'

type CheckinDetail = {
  id: string
  client_id: string
  checkin_date: string
  weight: number | null
  body_fat_pct: number | null
  waist: number | null
  hips: number | null
  chest: number | null
  thigh: number | null
  arm: number | null
  sleep_hours: number | null
  sleep_quality: number | null
  stress_level: number | null
  energy_level: number | null
  appetite: number | null
  soreness: number | null
  cycle_day: number | null
  cycle_notes: string | null
  comment: string | null
  status: string
  flagged: boolean
  flag_reason: string | null
  created_at: string
  profiles: { id: string; full_name: string | null; email: string; avatar_url: string | null; phone: string | null } | null
  checkin_photos: { id: string; photo_url: string; photo_type: string }[]
  checkin_responses: {
    id: string; message: string; attachment_url: string | null; created_at: string
    profiles: { id: string; full_name: string | null; avatar_url: string | null } | null
  }[]
  previous: {
    weight: number | null; waist: number | null; hips: number | null
    chest: number | null; thigh: number | null; arm: number | null
    body_fat_pct: number | null; checkin_date: string
  } | null
}

export default function CheckinDetailPage() {
  const { t, locale } = useTranslation()
  const ru = locale === 'ru'
  const params = useParams()
  const router = useRouter()
  const checkinId = params.id as string

  const [checkin, setCheckin] = useState<CheckinDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [response, setResponse] = useState('')
  const [sending, setSending] = useState(false)
  const [flagging, setFlagging] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const fetchCheckin = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth(`/api/checkins/${checkinId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCheckin(data)
    } catch {
      toast.error(ru ? 'Ошибка загрузки' : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [checkinId, ru])

  useEffect(() => { fetchCheckin() }, [fetchCheckin])

  /* ─── Actions ─── */
  const handleSendResponse = async () => {
    if (!response.trim()) return
    setSending(true)
    try {
      const res = await fetchWithAuth(`/api/checkins/${checkinId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ message: response.trim() }),
      })
      if (!res.ok) throw new Error()
      toast.success(ru ? 'Ответ отправлен' : 'Response sent')
      setResponse('')
      fetchCheckin() // Refresh to show response + updated status
    } catch {
      toast.error(ru ? 'Ошибка' : 'Failed')
    } finally {
      setSending(false)
    }
  }

  const handleMarkReviewed = async () => {
    try {
      await fetchWithAuth(`/api/checkins/${checkinId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'reviewed' }),
      })
      toast.success(ru ? 'Отмечено как обработанное' : 'Marked as reviewed')
      fetchCheckin()
    } catch {
      toast.error(ru ? 'Ошибка' : 'Failed')
    }
  }

  const handleToggleFlag = async () => {
    if (!checkin) return
    setFlagging(true)
    try {
      await fetchWithAuth(`/api/checkins/${checkinId}`, {
        method: 'PUT',
        body: JSON.stringify({
          flagged: !checkin.flagged,
          status: !checkin.flagged ? 'flagged' : 'reviewed',
          flag_reason: !checkin.flagged ? (ru ? 'Требует внимания' : 'Needs attention') : null,
        }),
      })
      toast.success(checkin.flagged ? (ru ? 'Флаг снят' : 'Flag removed') : (ru ? 'Отмечено' : 'Flagged'))
      fetchCheckin()
    } catch {
      toast.error(ru ? 'Ошибка' : 'Failed')
    } finally {
      setFlagging(false)
    }
  }

  /* ─── Helpers ─── */
  const diff = (current: number | null, prev: number | null) => {
    if (current === null || prev === null) return null
    return +(current - prev).toFixed(1)
  }

  const DiffBadge = ({ val, inverse }: { val: number | null; inverse?: boolean }) => {
    if (val === null || val === 0) return null
    const good = inverse ? val > 0 : val < 0
    return (
      <span className={`text-xs font-medium ml-1 ${good ? 'text-green-600' : 'text-orange-500'}`}>
        {val > 0 ? '+' : ''}{val}
      </span>
    )
  }

  const WellnessBar = ({ value, max, label, icon }: { value: number | null; max: number; label: string; icon: React.ReactNode }) => {
    if (value === null) return null
    const pct = (value / max) * 100
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">{icon}{label}</span>
          <span className="text-sm font-medium">{value}/{max}</span>
        </div>
        <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    )
  }

  const getInitials = (name: string | null) => {
    if (!name) return '??'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  const photoTypeLabels: Record<string, string> = ru
    ? { front: 'Спереди', side: 'Сбоку', back: 'Сзади', other: 'Другое' }
    : { front: 'Front', side: 'Side', back: 'Back', other: 'Other' }

  /* ─── Loading / Not Found ─── */
  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
  }

  if (!checkin) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-zinc-500 mb-4">{ru ? 'Чек-ин не найден' : 'Check-in not found'}</p>
        <Link href="/dashboard/checkins"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />{ru ? 'Назад' : 'Back'}</Button></Link>
      </div>
    )
  }

  const prev = checkin.previous
  const client = checkin.profiles
  const clientName = client?.full_name || client?.email || '—'

  /* ═══════════ RENDER ═══════════ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/checkins">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{ru ? 'Чек-ин' : 'Check-in'}</h1>
              {checkin.flagged ? (
                <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />{ru ? 'Внимание' : 'Flagged'}</Badge>
              ) : checkin.status === 'new' ? (
                <Badge>{ru ? 'Новый' : 'New'}</Badge>
              ) : (
                <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" />{ru ? 'Обработано' : 'Reviewed'}</Badge>
              )}
            </div>
            <p className="text-zinc-500 mt-1">
              {new Date(checkin.checkin_date).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleToggleFlag} disabled={flagging}>
            <Flag className={`w-4 h-4 mr-1 ${checkin.flagged ? 'text-red-500 fill-red-500' : ''}`} />
            {checkin.flagged ? (ru ? 'Снять флаг' : 'Unflag') : (ru ? 'Флаг' : 'Flag')}
          </Button>
          {checkin.status === 'new' && (
            <Button variant="outline" size="sm" onClick={handleMarkReviewed}>
              <CheckCircle2 className="w-4 h-4 mr-1" />{ru ? 'Обработано' : 'Mark Reviewed'}
            </Button>
          )}
        </div>
      </div>

      {/* Client Info */}
      <Card><CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar src={client?.avatar_url || undefined} fallback={getInitials(client?.full_name ?? null)} size="lg" />
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{clientName}</p>
              <p className="text-sm text-zinc-500">{client?.email}</p>
            </div>
          </div>
          <Link href={`/dashboard/clients/${checkin.client_id}`}>
            <Button variant="outline" size="sm">{ru ? 'Профиль' : 'View Profile'}</Button>
          </Link>
        </div>
      </CardContent></Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ═══ MAIN CONTENT ═══ */}
        <div className="lg:col-span-2 space-y-6">

          {/* Measurements */}
          <Card>
            <CardHeader><CardTitle>{ru ? 'Замеры' : 'Measurements'}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: ru ? 'Вес' : 'Weight', val: checkin.weight, prevVal: prev?.weight, unit: 'kg', big: true },
                  { label: ru ? 'Талия' : 'Waist', val: checkin.waist, prevVal: prev?.waist, unit: 'cm' },
                  { label: ru ? 'Бёдра' : 'Hips', val: checkin.hips, prevVal: prev?.hips, unit: 'cm' },
                  { label: ru ? 'Грудь' : 'Chest', val: checkin.chest, prevVal: prev?.chest, unit: 'cm' },
                  { label: ru ? 'Бедро' : 'Thigh', val: checkin.thigh, prevVal: prev?.thigh, unit: 'cm' },
                  { label: ru ? 'Рука' : 'Arm', val: checkin.arm, prevVal: prev?.arm, unit: 'cm' },
                  { label: ru ? '% жира' : 'Body Fat', val: checkin.body_fat_pct, prevVal: prev?.body_fat_pct, unit: '%' },
                ].filter(m => m.val !== null).map((m, i) => (
                  <div key={i} className={`p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-center ${m.big ? 'col-span-2 sm:col-span-1' : ''}`}>
                    <p className="text-xs text-zinc-500 mb-1">{m.label}</p>
                    <p className={`font-bold text-zinc-900 dark:text-zinc-100 ${m.big ? 'text-2xl' : 'text-xl'}`}>
                      {m.val} <span className="text-sm font-normal text-zinc-400">{m.unit}</span>
                    </p>
                    <DiffBadge val={diff(m.val ?? null, m.prevVal ?? null)} />
                  </div>
                ))}
                {checkin.weight === null && checkin.waist === null && (
                  <div className="col-span-full text-center text-zinc-400 py-4">{ru ? 'Нет замеров' : 'No measurements'}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          {checkin.checkin_photos.length > 0 && (
            <Card>
              <CardHeader><CardTitle>{ru ? 'Фото' : 'Photos'} ({checkin.checkin_photos.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {checkin.checkin_photos.map(photo => (
                    <div key={photo.id} className="relative group cursor-pointer" onClick={() => setLightboxUrl(photo.photo_url)}>
                      <img src={photo.photo_url} alt={photo.photo_type} className="w-full aspect-[3/4] object-cover rounded-xl" />
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary" className="text-xs bg-black/50 text-white border-0">
                          {photoTypeLabels[photo.photo_type] || photo.photo_type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {checkin.checkin_photos.length === 0 && (
            <Card><CardContent className="py-8 text-center text-zinc-400">
              <ImageIcon className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
              {ru ? 'Фото не прикреплены' : 'No photos attached'}
            </CardContent></Card>
          )}

          {/* Client Comment */}
          {checkin.comment && (
            <Card>
              <CardHeader><CardTitle>{ru ? 'Комментарий клиента' : 'Client Notes'}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl italic leading-relaxed">"{checkin.comment}"</p>
              </CardContent>
            </Card>
          )}

          {/* Cycle */}
          {(checkin.cycle_day || checkin.cycle_notes) && (
            <Card>
              <CardHeader><CardTitle>{ru ? 'Цикл' : 'Cycle'}</CardTitle></CardHeader>
              <CardContent>
                {checkin.cycle_day && <p className="text-sm text-zinc-600 dark:text-zinc-400">{ru ? 'День цикла' : 'Cycle day'}: <span className="font-medium">{checkin.cycle_day}</span></p>}
                {checkin.cycle_notes && <p className="text-sm text-zinc-500 mt-1">{checkin.cycle_notes}</p>}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ═══ SIDEBAR ═══ */}
        <div className="space-y-6">

          {/* Wellness */}
          <Card>
            <CardHeader><CardTitle>{ru ? 'Самочувствие' : 'Wellness'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <WellnessBar value={checkin.sleep_quality} max={10} label={ru ? 'Качество сна' : 'Sleep Quality'} icon={<Moon className="w-4 h-4" />} />
              {checkin.sleep_hours !== null && (
                <p className="text-sm text-zinc-500 -mt-2 pl-6">{checkin.sleep_hours} {ru ? 'ч' : 'h'}</p>
              )}
              <WellnessBar value={checkin.energy_level} max={10} label={ru ? 'Энергия' : 'Energy'} icon={<Zap className="w-4 h-4" />} />
              <WellnessBar value={checkin.stress_level} max={10} label={ru ? 'Стресс' : 'Stress'} icon={<Brain className="w-4 h-4" />} />
              <WellnessBar value={checkin.appetite} max={10} label={ru ? 'Аппетит' : 'Appetite'} icon={<Utensils className="w-4 h-4" />} />
              <WellnessBar value={checkin.soreness} max={10} label={ru ? 'Крепатура' : 'Soreness'} icon={<Dumbbell className="w-4 h-4" />} />

              {checkin.sleep_quality === null && checkin.energy_level === null && checkin.stress_level === null && (
                <p className="text-center text-zinc-400 text-sm">{ru ? 'Нет данных' : 'No data'}</p>
              )}
            </CardContent>
          </Card>

          {/* Previous Responses */}
          {checkin.checkin_responses.length > 0 && (
            <Card>
              <CardHeader><CardTitle>{ru ? 'Ответы' : 'Responses'} ({checkin.checkin_responses.length})</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {checkin.checkin_responses.map(r => (
                  <div key={r.id} className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar src={r.profiles?.avatar_url || undefined} fallback={getInitials(r.profiles?.full_name ?? null)} size="xs" />
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{r.profiles?.full_name || 'Trainer'}</span>
                      <span className="text-xs text-zinc-400 ml-auto">
                        {new Date(r.created_at).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{r.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Write Response */}
          <Card>
            <CardHeader><CardTitle>{ru ? 'Ответить' : 'Respond'}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="w-full h-28 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 resize-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm"
                placeholder={ru ? 'Написать ответ клиенту...' : 'Write a response to the client...'}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
              />
              <Button variant="gradient" className="w-full" onClick={handleSendResponse} disabled={sending || !response.trim()}>
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {ru ? 'Отправить' : 'Send Response'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══ LIGHTBOX ═══ */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-zinc-300" onClick={() => setLightboxUrl(null)}>
            <X className="w-8 h-8" />
          </button>
          <img src={lightboxUrl} alt="Photo" className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" />
        </div>
      )}
    </div>
  )
}
