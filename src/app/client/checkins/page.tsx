'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { fetchWithAuth } from '@/lib/api'
import DynamicFormRenderer from '@/components/ui/dynamic-form-renderer'
import type { FormField } from '@/lib/form-types'
import { compressImage } from '@/lib/compress-image'
import {
  Scale, Plus, Loader2, Calendar, TrendingUp, TrendingDown,
  MessageCircle, CheckCircle2, AlertTriangle, ChevronDown, Send
} from 'lucide-react'
import { toast } from 'sonner'

/* ═══════════ TYPES ═══════════ */
type Checkin = {
  id: string
  checkin_date: string
  weight: number | null
  waist: number | null
  hips: number | null
  chest: number | null
  thigh: number | null
  arm: number | null
  body_fat_pct: number | null
  sleep_quality: number | null
  sleep_hours: number | null
  energy_level: number | null
  stress_level: number | null
  appetite: number | null
  soreness: number | null
  comment: string | null
  cycle_day: number | null
  cycle_notes: string | null
  status: string
  flagged: boolean
  flag_reason: string | null
  weight_change: number | null
  photos_count: number
  has_response: boolean
  checkin_responses: any[]
  custom_data?: Record<string, any>
  created_at: string
}

/* ═══════════ Fallback fields if no template in DB ═══════════ */
const defaultCheckinFields: FormField[] = [
  { id: 'f1', type: 'number', labelEn: 'Weight (kg)', labelRu: 'Вес (кг)', required: true, dbField: 'weight' },
  { id: 'f2', type: 'number', labelEn: 'Waist (cm)', labelRu: 'Талия (см)', required: false, dbField: 'waist' },
  { id: 'f3', type: 'number', labelEn: 'Hips (cm)', labelRu: 'Бёдра (см)', required: false, dbField: 'hips' },
  { id: 'f4', type: 'number', labelEn: 'Chest (cm)', labelRu: 'Грудь (см)', required: false, dbField: 'chest' },
  { id: 'f5', type: 'number', labelEn: 'Thigh (cm)', labelRu: 'Бедро (см)', required: false, dbField: 'thigh' },
  { id: 'f6', type: 'number', labelEn: 'Arm (cm)', labelRu: 'Рука (см)', required: false, dbField: 'arm' },
  { id: 'f7', type: 'number', labelEn: 'Body fat %', labelRu: '% жира', required: false, dbField: 'body_fat_pct' },
  { id: 'f8', type: 'scale', labelEn: 'Sleep quality', labelRu: 'Качество сна', required: false, min: 1, max: 10, dbField: 'sleep_quality' },
  { id: 'f9', type: 'number', labelEn: 'Sleep hours', labelRu: 'Часов сна', required: false, dbField: 'sleep_hours' },
  { id: 'f10', type: 'scale', labelEn: 'Energy level', labelRu: 'Энергия', required: false, min: 1, max: 10, dbField: 'energy_level' },
  { id: 'f11', type: 'scale', labelEn: 'Stress level', labelRu: 'Стресс', required: false, min: 1, max: 10, dbField: 'stress_level' },
  { id: 'f12', type: 'scale', labelEn: 'Appetite', labelRu: 'Аппетит', required: false, min: 1, max: 10, dbField: 'appetite' },
  { id: 'f13', type: 'scale', labelEn: 'Soreness', labelRu: 'Болезненность', required: false, min: 1, max: 10, dbField: 'soreness' },
  { id: 'f14', type: 'number', labelEn: 'Cycle day', labelRu: 'День цикла', required: false, dbField: 'cycle_day' },
  { id: 'f15', type: 'textarea', labelEn: 'Cycle notes', labelRu: 'Заметки по циклу', required: false, dbField: 'cycle_notes' },
  { id: 'f16', type: 'textarea', labelEn: 'Comment', labelRu: 'Комментарий', required: false, dbField: 'comment' },
]

export default function ClientCheckinsPage() {
  const { locale, langConfig } = useTranslation()
  const { user } = useAuth()
  const ru = locale === langConfig.secondaryLanguage

  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedCheckin, setSelectedCheckin] = useState<Checkin | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [responses, setResponses] = useState<any[]>([])

  // Dynamic form
  const [templateFields, setTemplateFields] = useState<FormField[]>(defaultCheckinFields)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [templateLoading, setTemplateLoading] = useState(true)

  /* ─── Load template from DB ─── */
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const res = await fetchWithAuth('/api/form-templates?type=checkin')
        if (res.ok) {
          const data = await res.json()
          const active = data.find((t: any) => t.active)
          if (active && active.fields?.length > 0) {
            setTemplateFields(active.fields)
          }
        }
      } catch { /* use defaults */ }
      finally { setTemplateLoading(false) }
    }
    loadTemplate()
  }, [])

  /* ─── Fetch checkins ─── */
  const fetchCheckins = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/checkins')
      if (res.ok) {
        const data = await res.json()
        setCheckins(data.checkins || data || [])
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (user) fetchCheckins()
  }, [user, fetchCheckins])

  /* ─── Image upload helper ─── */
  const uploadImage = async (file: File): Promise<string> => {
    let toUpload = file
    if (typeof compressImage === 'function') {
      try { toUpload = await compressImage(file) } catch { /* use original */ }
    }
    const fd = new FormData()
    fd.append('file', toUpload)
    const res = await fetchWithAuth('/api/upload', { method: 'POST', body: fd, headers: {} })
    if (!res.ok) throw new Error('Upload failed')
    const { url } = await res.json()
    return url
  }

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    // Check required fields
    const missing = templateFields.filter(f => f.required && !formValues[f.dbField || f.id])
    if (missing.length > 0) {
      const label = ru ? missing[0].labelRu : missing[0].labelEn
      toast.error(ru ? `Заполните: ${label}` : `Required: ${label}`)
      return
    }
    setSaving(true)
    try {
      // Collect photo URLs from photo fields
      const photos: string[] = []
      const values: Record<string, any> = {}
      for (const [key, val] of Object.entries(formValues)) {
        const field = templateFields.find(f => (f.dbField || f.id) === key)
        if (field?.type === 'photo' && val) {
          photos.push(val)
        } else {
          values[key] = val
        }
      }

      const payload: any = {
        checkin_date: new Date().toISOString().split('T')[0],
        values,
        photos: photos.map(url => ({ photo_url: url, photo_type: 'progress' })),
      }

      const res = await fetchWithAuth('/api/checkins', { method: 'POST', body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      toast.success(ru ? 'Чекин отправлен!' : 'Check-in submitted!')
      setIsNewOpen(false)
      setFormValues({})
      fetchCheckins()
    } catch {
      toast.error(ru ? 'Ошибка отправки' : 'Failed to submit')
    } finally { setSaving(false) }
  }

  /* ─── Open detail ─── */
  const openDetail = (c: Checkin) => {
    setSelectedCheckin(c)
    setIsDetailOpen(true)
    setResponses(c.checkin_responses || [])
  }

  const diff = (change: number | null) => {
    if (change === null || change === 0) return null
    return (
      <span className={`text-xs flex items-center gap-0.5 ${change > 0 ? 'text-red-500' : 'text-green-500'}`}>
        {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {change > 0 ? '+' : ''}{change.toFixed(1)}
      </span>
    )
  }

  /* ═══════════ RENDER ═══════════ */
  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{ru ? 'Мои чекины' : 'My Check-ins'}</h1>
          <p className="text-zinc-500 text-sm mt-1">{ru ? 'Отслеживайте свой прогресс' : 'Track your progress'}</p>
        </div>
        <Button variant="gradient" onClick={() => { setFormValues({}); setIsNewOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" />{ru ? 'Новый чекин' : 'New Check-in'}
        </Button>
      </div>

      {/* Stats from latest checkin */}
      {checkins.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: ru ? 'Текущий вес' : 'Current Weight', value: checkins[0].weight ? `${checkins[0].weight} kg` : '—', change: checkins[0].weight_change, icon: Scale },
            { label: ru ? 'Чекинов' : 'Check-ins', value: String(checkins.length), change: null, icon: Calendar },
            { label: ru ? 'Статус' : 'Status', value: checkins[0].status === 'reviewed' ? (ru ? 'Просмотрен' : 'Reviewed') : (ru ? 'Новый' : 'New'), change: null, icon: CheckCircle2 },
            { label: ru ? 'Ответ' : 'Response', value: checkins[0].has_response ? (ru ? 'Да' : 'Yes') : (ru ? 'Нет' : 'No'), change: null, icon: MessageCircle },
          ].map((s, i) => {
            const Icon = s.icon
            return (
              <Card key={i}><CardContent className="p-4">
                <Icon className="w-5 h-5 text-teal-500 mb-2" />
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  {s.value}
                  {s.change !== null && diff(s.change)}
                </p>
                <p className="text-xs text-zinc-500">{s.label}</p>
              </CardContent></Card>
            )
          })}
        </div>
      )}

      {/* History */}
      {checkins.length > 0 ? (
        <Card>
          <CardHeader><CardTitle className="text-base">{ru ? 'История' : 'History'}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {checkins.map(c => (
                <button key={c.id} onClick={() => openDetail(c)}
                  className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      c.status === 'reviewed' ? 'bg-green-100 dark:bg-green-500/20' :
                      c.flagged ? 'bg-red-100 dark:bg-red-500/20' : 'bg-teal-100 dark:bg-teal-500/20'
                    }`}>
                      {c.flagged ? <AlertTriangle className="w-5 h-5 text-red-500" /> :
                       c.status === 'reviewed' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                       <Scale className="w-5 h-5 text-teal-500" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                        {new Date(c.checkin_date).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      <div className="flex gap-3 text-xs text-zinc-500">
                        {c.weight && <span>{c.weight} kg</span>}
                        {c.weight_change !== null && c.weight_change !== 0 && (
                          <span className={c.weight_change! < 0 ? 'text-green-500' : 'text-red-500'}>
                            {c.weight_change! > 0 ? '+' : ''}{c.weight_change!.toFixed(1)} kg
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.has_response && <Badge variant="secondary" className="text-xs"><MessageCircle className="w-3 h-3 mr-1" />{ru ? 'Ответ' : 'Reply'}</Badge>}
                    <Badge variant={c.status === 'reviewed' ? 'success' : c.flagged ? 'destructive' : 'secondary'}>
                      {c.status === 'reviewed' ? '✓' : c.flagged ? '⚑' : (ru ? 'Новый' : 'New')}
                    </Badge>
                    <ChevronDown className="w-4 h-4 text-zinc-300 -rotate-90" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <Scale className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-600 dark:text-zinc-400 mb-2">{ru ? 'Нет чекинов' : 'No check-ins yet'}</h3>
          <p className="text-zinc-400 text-sm mb-4">{ru ? 'Отправьте первый чекин' : 'Submit your first check-in'}</p>
          <Button variant="gradient" onClick={() => { setFormValues({}); setIsNewOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" />{ru ? 'Первый чекин' : 'First Check-in'}
          </Button>
        </Card>
      )}

      {/* ═══ New Check-in Modal — Dynamic Form ═══ */}
      <Modal isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title={ru ? 'Новый чекин' : 'New Check-in'} size="lg">
        {templateLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
        ) : (
          <>
            <DynamicFormRenderer
              fields={templateFields}
              values={formValues}
              onChange={setFormValues}
              ru={ru}
              uploadImage={uploadImage}
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4">
              <Button variant="outline" onClick={() => setIsNewOpen(false)}>{ru ? 'Отмена' : 'Cancel'}</Button>
              <Button variant="gradient" onClick={handleSubmit} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {ru ? 'Отправить' : 'Submit'}
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* ═══ Detail Modal ═══ */}
      <Modal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setResponses([]) }}
        title={selectedCheckin ? new Date(selectedCheckin.checkin_date).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }) : ''} size="lg">
        {selectedCheckin && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge variant={selectedCheckin.status === 'reviewed' ? 'success' : selectedCheckin.flagged ? 'destructive' : 'secondary'}>
                {selectedCheckin.status === 'reviewed' ? (ru ? 'Просмотрен' : 'Reviewed') : selectedCheckin.flagged ? (ru ? 'Отмечен' : 'Flagged') : (ru ? 'Новый' : 'New')}
              </Badge>
              {selectedCheckin.flag_reason && <span className="text-xs text-red-500">{selectedCheckin.flag_reason}</span>}
            </div>

            {/* Measurements */}
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase mb-2">{ru ? 'Замеры' : 'Measurements'}</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {[
                  { label: ru ? 'Вес' : 'Weight', val: selectedCheckin.weight, unit: 'kg' },
                  { label: ru ? 'Талия' : 'Waist', val: selectedCheckin.waist, unit: 'cm' },
                  { label: ru ? 'Бёдра' : 'Hips', val: selectedCheckin.hips, unit: 'cm' },
                  { label: ru ? 'Грудь' : 'Chest', val: selectedCheckin.chest, unit: 'cm' },
                  { label: ru ? 'Бедро' : 'Thigh', val: selectedCheckin.thigh, unit: 'cm' },
                  { label: ru ? 'Рука' : 'Arm', val: selectedCheckin.arm, unit: 'cm' },
                  { label: ru ? '% жира' : 'Fat %', val: selectedCheckin.body_fat_pct, unit: '%' },
                ].filter(m => m.val !== null).map((m, i) => (
                  <div key={i} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{m.val}</p>
                    <p className="text-[10px] text-zinc-400">{m.label} ({m.unit})</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Wellness */}
            {(selectedCheckin.sleep_quality || selectedCheckin.energy_level) && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase mb-2">{ru ? 'Самочувствие' : 'Wellness'}</p>
                <div className="space-y-2">
                  {[
                    { label: ru ? 'Сон' : 'Sleep', val: selectedCheckin.sleep_quality, emoji: '🌙', extra: selectedCheckin.sleep_hours ? `${selectedCheckin.sleep_hours}h` : null },
                    { label: ru ? 'Энергия' : 'Energy', val: selectedCheckin.energy_level, emoji: '⚡' },
                    { label: ru ? 'Стресс' : 'Stress', val: selectedCheckin.stress_level, emoji: '🧠' },
                    { label: ru ? 'Аппетит' : 'Appetite', val: selectedCheckin.appetite, emoji: '🍴' },
                    { label: ru ? 'Мышцы' : 'Soreness', val: selectedCheckin.soreness, emoji: '💪' },
                  ].filter(w => w.val !== null).map((w, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm w-6 text-center">{w.emoji}</span>
                      <span className="text-xs text-zinc-500 w-20">{w.label}</span>
                      <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all"
                          style={{ width: `${((w.val || 0) / 10) * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 w-8 text-right">
                        {w.val}/10{w.extra ? ` (${w.extra})` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedCheckin.comment && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase mb-1">{ru ? 'Комментарий' : 'Notes'}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg">{selectedCheckin.comment}</p>
              </div>
            )}

            {/* Custom data */}
            {selectedCheckin.custom_data && Object.keys(selectedCheckin.custom_data).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase mb-2">{ru ? 'Дополнительно' : 'Additional'}</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(selectedCheckin.custom_data).map(([k, v]) => (
                    <div key={k} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-2.5">
                      <p className="text-[10px] text-zinc-400">{k}</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trainer responses */}
            {responses.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase mb-2">{ru ? 'Ответы тренера' : 'Trainer Responses'}</p>
                <div className="space-y-2">
                  {responses.map((r: any) => (
                    <div key={r.id} className="bg-teal-50 dark:bg-teal-500/10 rounded-lg p-3 border-l-3 border-teal-500">
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">{r.message}</p>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        {r.profiles?.full_name || (ru ? 'Тренер' : 'Trainer')} • {new Date(r.created_at).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="outline" onClick={() => { setIsDetailOpen(false); setResponses([]) }}>{ru ? 'Закрыть' : 'Close'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
