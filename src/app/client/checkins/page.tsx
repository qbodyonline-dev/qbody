'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { fetchWithAuth } from '@/lib/api'
import {
  Scale, Plus, Loader2, Calendar, TrendingUp, TrendingDown,
  Moon, Zap, Brain, Apple, Dumbbell as MuscleIcon,
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
  created_at: string
}

type CheckinForm = {
  weight: string; waist: string; hips: string; chest: string
  thigh: string; arm: string; body_fat_pct: string
  sleep_quality: string; sleep_hours: string; energy_level: string
  stress_level: string; appetite: string; soreness: string
  comment: string; cycle_day: string; cycle_notes: string
}

const EMPTY_FORM: CheckinForm = {
  weight: '', waist: '', hips: '', chest: '',
  thigh: '', arm: '', body_fat_pct: '',
  sleep_quality: '', sleep_hours: '', energy_level: '',
  stress_level: '', appetite: '', soreness: '',
  comment: '', cycle_day: '', cycle_notes: '',
}

export default function ClientCheckinsPage() {
  const { locale } = useTranslation()
  const { user } = useAuth()
  const ru = locale === 'ru'

  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CheckinForm>({ ...EMPTY_FORM })
  const [selectedCheckin, setSelectedCheckin] = useState<Checkin | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [responses, setResponses] = useState<any[]>([])

  /* ─── Fetch ─── */
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

  /* ─── Submit new ─── */
  const handleSubmit = async () => {
    if (!form.weight) {
      toast.error(ru ? 'Укажите вес' : 'Weight is required')
      return
    }
    setSaving(true)
    try {
      const payload: any = { checkin_date: new Date().toISOString().split('T')[0] }
      const numFields = ['weight', 'waist', 'hips', 'chest', 'thigh', 'arm', 'body_fat_pct',
        'sleep_quality', 'sleep_hours', 'energy_level', 'stress_level', 'appetite', 'soreness', 'cycle_day']
      numFields.forEach(f => {
        const v = (form as any)[f]
        if (v) payload[f] = parseFloat(v)
      })
      if (form.comment) payload.comment = form.comment
      if (form.cycle_notes) payload.cycle_notes = form.cycle_notes

      const res = await fetchWithAuth('/api/checkins', { method: 'POST', body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      toast.success(ru ? 'Чекин отправлен!' : 'Check-in submitted!')
      setIsNewOpen(false)
      setForm({ ...EMPTY_FORM })
      fetchCheckins()
    } catch {
      toast.error(ru ? 'Ошибка отправки' : 'Failed to submit')
    } finally {
      setSaving(false)
    }
  }

  /* ─── Open detail ─── */
  const openDetail = async (c: Checkin) => {
    setSelectedCheckin(c)
    setIsDetailOpen(true)
    // Use joined responses from list data
    setResponses(c.checkin_responses || [])
  }

  /* ─── Helpers ─── */
  const WellnessSlider = ({ label, icon, value, onChange, max = 10 }: {
    label: string; icon: React.ReactNode; value: string; onChange: (v: string) => void; max?: number
  }) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-zinc-500 flex items-center gap-1">{icon} {label}</label>
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{value || '—'}/{max}</span>
      </div>
      <input type="range" min="1" max={max} value={value || '5'}
        onChange={e => onChange(e.target.value)}
        className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-500" />
    </div>
  )

  const diff = (val: number | null, change: number | null) => {
    if (val === null || change === null || change === 0) return null
    const positive = change > 0
    return (
      <span className={`text-xs flex items-center gap-0.5 ${positive ? 'text-red-500' : 'text-green-500'}`}>
        {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {positive ? '+' : ''}{change.toFixed(1)}
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
        <Button variant="gradient" onClick={() => setIsNewOpen(true)}>
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
                  {s.change !== null && diff(1, s.change)}
                </p>
                <p className="text-xs text-zinc-500">{s.label}</p>
              </CardContent></Card>
            )
          })}
        </div>
      )}

      {/* Checkin history */}
      {checkins.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ru ? 'История' : 'History'}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {checkins.map(c => (
                <button key={c.id} onClick={() => openDetail(c)}
                  className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      c.status === 'reviewed' ? 'bg-green-100 dark:bg-green-500/20' :
                      c.flagged ? 'bg-red-100 dark:bg-red-500/20' :
                      'bg-teal-100 dark:bg-teal-500/20'
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
                          <span className={c.weight_change < 0 ? 'text-green-500' : 'text-red-500'}>
                            {c.weight_change > 0 ? '+' : ''}{c.weight_change.toFixed(1)} kg
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.has_response && (
                      <Badge variant="secondary" className="text-xs">
                        <MessageCircle className="w-3 h-3 mr-1" />{ru ? 'Ответ' : 'Reply'}
                      </Badge>
                    )}
                    <Badge variant={c.status === 'reviewed' ? 'success' : c.flagged ? 'destructive' : 'secondary'}>
                      {c.status === 'reviewed' ? (ru ? '✓' : '✓') : c.flagged ? '⚑' : (ru ? 'Новый' : 'New')}
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
          <h3 className="text-xl font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
            {ru ? 'Нет чекинов' : 'No check-ins yet'}
          </h3>
          <p className="text-zinc-400 text-sm mb-4">
            {ru ? 'Отправьте первый чекин с вашими замерами' : 'Submit your first check-in with measurements'}
          </p>
          <Button variant="gradient" onClick={() => setIsNewOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />{ru ? 'Первый чекин' : 'First Check-in'}
          </Button>
        </Card>
      )}

      {/* ═══ New Check-in Modal ═══ */}
      <Modal isOpen={isNewOpen} onClose={() => setIsNewOpen(false)}
        title={ru ? 'Новый чекин' : 'New Check-in'} size="lg">
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

          {/* Measurements */}
          <div>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-1">
              <Scale className="w-4 h-4" />{ru ? 'Замеры' : 'Measurements'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input label={`${ru ? 'Вес' : 'Weight'} (kg) *`} type="number" step="0.1"
                value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
              <Input label={`${ru ? 'Талия' : 'Waist'} (cm)`} type="number" step="0.1"
                value={form.waist} onChange={e => setForm({ ...form, waist: e.target.value })} />
              <Input label={`${ru ? 'Бёдра' : 'Hips'} (cm)`} type="number" step="0.1"
                value={form.hips} onChange={e => setForm({ ...form, hips: e.target.value })} />
              <Input label={`${ru ? 'Грудь' : 'Chest'} (cm)`} type="number" step="0.1"
                value={form.chest} onChange={e => setForm({ ...form, chest: e.target.value })} />
              <Input label={`${ru ? 'Бедро' : 'Thigh'} (cm)`} type="number" step="0.1"
                value={form.thigh} onChange={e => setForm({ ...form, thigh: e.target.value })} />
              <Input label={`${ru ? 'Рука' : 'Arm'} (cm)`} type="number" step="0.1"
                value={form.arm} onChange={e => setForm({ ...form, arm: e.target.value })} />
              <Input label={`${ru ? '% жира' : 'Body Fat %'}`} type="number" step="0.1"
                value={form.body_fat_pct} onChange={e => setForm({ ...form, body_fat_pct: e.target.value })} />
            </div>
          </div>

          {/* Wellness */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
              {ru ? '🌟 Самочувствие' : '🌟 Wellness'}
            </p>
            <div className="space-y-4">
              <WellnessSlider label={ru ? 'Качество сна' : 'Sleep Quality'} icon={<Moon className="w-3.5 h-3.5" />}
                value={form.sleep_quality} onChange={v => setForm({ ...form, sleep_quality: v })} />
              <Input label={ru ? 'Часов сна' : 'Sleep Hours'} type="number" step="0.5"
                value={form.sleep_hours} onChange={e => setForm({ ...form, sleep_hours: e.target.value })} />
              <WellnessSlider label={ru ? 'Энергия' : 'Energy'} icon={<Zap className="w-3.5 h-3.5" />}
                value={form.energy_level} onChange={v => setForm({ ...form, energy_level: v })} />
              <WellnessSlider label={ru ? 'Стресс' : 'Stress'} icon={<Brain className="w-3.5 h-3.5" />}
                value={form.stress_level} onChange={v => setForm({ ...form, stress_level: v })} />
              <WellnessSlider label={ru ? 'Аппетит' : 'Appetite'} icon={<Apple className="w-3.5 h-3.5" />}
                value={form.appetite} onChange={v => setForm({ ...form, appetite: v })} />
              <WellnessSlider label={ru ? 'Болезненность мышц' : 'Soreness'} icon={<MuscleIcon className="w-3.5 h-3.5" />}
                value={form.soreness} onChange={v => setForm({ ...form, soreness: v })} />
            </div>
          </div>

          {/* Cycle */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
              {ru ? '📅 Цикл (опционально)' : '📅 Cycle (optional)'}
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label={ru ? 'День цикла' : 'Cycle Day'} type="number"
                value={form.cycle_day} onChange={e => setForm({ ...form, cycle_day: e.target.value })} />
              <Input label={ru ? 'Заметки по циклу' : 'Cycle Notes'}
                value={form.cycle_notes} onChange={e => setForm({ ...form, cycle_notes: e.target.value })} />
            </div>
          </div>

          {/* Notes */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <label className="block text-xs text-zinc-500 mb-1">{ru ? 'Комментарий' : 'Notes'}</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-sm resize-none"
              rows={3} placeholder={ru ? 'Как прошла неделя...' : 'How was your week...'}
              value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4">
          <Button variant="outline" onClick={() => setIsNewOpen(false)}>{ru ? 'Отмена' : 'Cancel'}</Button>
          <Button variant="gradient" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {ru ? 'Отправить' : 'Submit'}
          </Button>
        </div>
      </Modal>

      {/* ═══ Detail Modal ═══ */}
      <Modal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setResponses([]) }}
        title={selectedCheckin ? new Date(selectedCheckin.checkin_date).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
        size="lg">
        {selectedCheckin && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Status */}
            <div className="flex gap-2">
              <Badge variant={selectedCheckin.status === 'reviewed' ? 'success' : selectedCheckin.flagged ? 'destructive' : 'secondary'}>
                {selectedCheckin.status === 'reviewed' ? (ru ? 'Просмотрен' : 'Reviewed') :
                 selectedCheckin.flagged ? (ru ? 'Отмечен' : 'Flagged') : (ru ? 'Новый' : 'New')}
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
                <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg">
                  {selectedCheckin.comment}
                </p>
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
                        {r.responder_name || (ru ? 'Тренер' : 'Trainer')} • {new Date(r.created_at).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="outline" onClick={() => { setIsDetailOpen(false); setResponses([]) }}>
                {ru ? 'Закрыть' : 'Close'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
