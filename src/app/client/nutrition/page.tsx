'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { fetchWithAuth } from '@/lib/api'
import {
  Flame, Beef, Wheat, Droplets, Loader2, Check,
  Star, MessageSquare, ChevronLeft, ChevronRight, Droplet,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type NutritionTarget = {
  calories: number
  protein: number
  carbs: number
  fat: number
  notes: string | null
}

type NutritionLog = {
  id: string
  log_date: string
  calories_hit: boolean
  protein_hit: boolean
  carbs_hit: boolean
  fat_hit: boolean
  water_liters: number | null
  rating: number | null
  notes: string | null
}

export default function ClientNutritionPage() {
  const { locale } = useTranslation()
  const { session } = useAuth()
  const ru = locale === 'ru'

  const [target, setTarget] = useState<NutritionTarget | null>(null)
  const [logs, setLogs] = useState<NutritionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Today's form
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [form, setForm] = useState({
    calories_hit: false,
    protein_hit: false,
    carbs_hit: false,
    fat_hit: false,
    water_liters: '',
    rating: 0,
    notes: '',
  })

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetchWithAuth('/api/nutrition/logs?days=30')
      if (res.ok) {
        const data = await res.json()
        setTarget(data.target)
        setLogs(data.logs || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (session) load() }, [session, load])

  // When date changes, load that day's log into form
  useEffect(() => {
    const dayLog = logs.find(l => l.log_date === selectedDate)
    if (dayLog) {
      setForm({
        calories_hit: dayLog.calories_hit,
        protein_hit: dayLog.protein_hit,
        carbs_hit: dayLog.carbs_hit,
        fat_hit: dayLog.fat_hit,
        water_liters: dayLog.water_liters ? String(dayLog.water_liters) : '',
        rating: dayLog.rating || 0,
        notes: dayLog.notes || '',
      })
    } else {
      setForm({ calories_hit: false, protein_hit: false, carbs_hit: false, fat_hit: false, water_liters: '', rating: 0, notes: '' })
    }
  }, [selectedDate, logs])

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: any = {
        log_date: selectedDate,
        calories_hit: form.calories_hit,
        protein_hit: form.protein_hit,
        carbs_hit: form.carbs_hit,
        fat_hit: form.fat_hit,
        water_liters: form.water_liters ? parseFloat(form.water_liters) : null,
        rating: form.rating > 0 ? form.rating : null,
        notes: form.notes || null,
      }

      const res = await fetchWithAuth('/api/nutrition/logs', {
        method: 'POST',
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(ru ? 'Сохранено!' : 'Saved!')
        load()
      } else {
        toast.error(ru ? 'Ошибка сохранения' : 'Failed to save')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const shiftDate = (delta: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + delta)
    if (d <= new Date()) {
      setSelectedDate(d.toISOString().split('T')[0])
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString(ru ? 'ru-RU' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // 7-day streak
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  if (!target) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <Flame className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-zinc-800 mb-2">
          {ru ? 'Цели питания не установлены' : 'No nutrition targets set'}
        </h2>
        <p className="text-zinc-500">
          {ru ? 'Ваш тренер ещё не установил цели КБЖУ. Свяжитесь с тренером.' : 'Your trainer has not set nutrition targets yet. Contact your trainer.'}
        </p>
      </div>
    )
  }

  const macroItems = [
    { key: 'calories_hit' as const, icon: Flame, label: ru ? 'Калории' : 'Calories', value: `${target.calories} kcal`, color: 'orange' },
    { key: 'protein_hit' as const, icon: Beef, label: ru ? 'Белок' : 'Protein', value: `${target.protein}g`, color: 'red' },
    { key: 'carbs_hit' as const, icon: Wheat, label: ru ? 'Углеводы' : 'Carbs', value: `${target.carbs}g`, color: 'amber' },
    { key: 'fat_hit' as const, icon: Droplets, label: ru ? 'Жиры' : 'Fat', value: `${target.fat}g`, color: 'blue' },
  ]

  const hitCount = [form.calories_hit, form.protein_hit, form.carbs_hit, form.fat_hit].filter(Boolean).length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{ru ? 'Питание' : 'Nutrition'}</h1>
        <p className="text-zinc-500 mt-1">
          {ru ? 'Отмечайте соблюдение целей КБЖУ каждый день' : 'Track your daily KBJU compliance'}
        </p>
      </div>

      {/* 7-day streak */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium text-zinc-600 mb-3">{ru ? 'Последние 7 дней' : 'Last 7 days'}</p>
          <div className="flex justify-between gap-1">
            {last7.map(date => {
              const log = logs.find(l => l.log_date === date)
              const allHit = log && log.calories_hit && log.protein_hit && log.carbs_hit && log.fat_hit
              const partial = log && (log.calories_hit || log.protein_hit || log.carbs_hit || log.fat_hit)
              const isToday = date === today
              const isSelected = date === selectedDate

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all flex-1',
                    isSelected ? 'bg-teal-50 ring-2 ring-teal-500' : 'hover:bg-zinc-50',
                  )}
                >
                  <span className="text-[10px] text-zinc-400">
                    {new Date(date + 'T12:00:00').toLocaleDateString(ru ? 'ru' : 'en', { weekday: 'short' })}
                  </span>
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    allHit ? 'bg-teal-500 text-white' :
                    partial ? 'bg-amber-100 text-amber-600' :
                    log ? 'bg-zinc-100 text-zinc-400' :
                    isToday ? 'bg-zinc-200 text-zinc-600' : 'bg-zinc-50 text-zinc-300',
                  )}>
                    {allHit ? <Check className="w-4 h-4" /> : new Date(date + 'T12:00:00').getDate()}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Date selector */}
      <div className="flex items-center justify-between">
        <button onClick={() => shiftDate(-1)} className="p-2 rounded-lg hover:bg-zinc-100">
          <ChevronLeft className="w-5 h-5 text-zinc-600" />
        </button>
        <span className="font-semibold text-zinc-800">
          {selectedDate === today ? (ru ? 'Сегодня' : 'Today') : formatDate(selectedDate)}
        </span>
        <button
          onClick={() => shiftDate(1)}
          disabled={selectedDate >= today}
          className={cn('p-2 rounded-lg', selectedDate >= today ? 'opacity-30' : 'hover:bg-zinc-100')}
        >
          <ChevronRight className="w-5 h-5 text-zinc-600" />
        </button>
      </div>

      {/* Macro toggles */}
      <div className="grid grid-cols-2 gap-3">
        {macroItems.map(item => {
          const Icon = item.icon
          const isHit = form[item.key]
          return (
            <button
              key={item.key}
              onClick={() => setForm(f => ({ ...f, [item.key]: !f[item.key] }))}
              className={cn(
                'relative rounded-2xl border-2 p-4 text-left transition-all',
                isHit
                  ? 'border-teal-500 bg-teal-50 shadow-sm'
                  : 'border-zinc-200 bg-white hover:border-zinc-300',
              )}
            >
              {isHit && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              <Icon className={cn('w-6 h-6 mb-2', isHit ? 'text-teal-600' : 'text-zinc-400')} />
              <p className={cn('text-sm font-semibold', isHit ? 'text-teal-700' : 'text-zinc-700')}>{item.label}</p>
              <p className={cn('text-xs mt-0.5', isHit ? 'text-teal-500' : 'text-zinc-400')}>
                {ru ? 'цель' : 'target'}: {item.value}
              </p>
            </button>
          )
        })}
      </div>

      {/* Score */}
      <div className="text-center">
        <span className={cn(
          'inline-block px-4 py-1.5 rounded-full text-sm font-semibold',
          hitCount === 4 ? 'bg-teal-100 text-teal-700' :
          hitCount >= 2 ? 'bg-amber-100 text-amber-700' :
          'bg-zinc-100 text-zinc-500',
        )}>
          {hitCount}/4 {ru ? 'выполнено' : 'completed'}
        </span>
      </div>

      {/* Water & Rating */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Water */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
              <Droplet className="w-4 h-4 text-blue-500" />
              {ru ? 'Вода (л)' : 'Water (L)'}
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              placeholder="2.0"
              value={form.water_liters}
              onChange={e => setForm(f => ({ ...f, water_liters: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
              <Star className="w-4 h-4 text-amber-500" />
              {ru ? 'Оценка дня' : 'Day rating'}
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setForm(f => ({ ...f, rating: f.rating === n ? 0 : n }))}
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all',
                    form.rating >= n ? 'bg-amber-100 text-amber-600 ring-1 ring-amber-300' : 'bg-zinc-50 text-zinc-300 hover:bg-zinc-100',
                  )}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
              <MessageSquare className="w-4 h-4 text-zinc-400" />
              {ru ? 'Заметки' : 'Notes'}
            </label>
            <textarea
              rows={2}
              placeholder={ru ? 'Как прошёл день...' : 'How was your day...'}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>
        </CardContent>
      </Card>

      {/* Trainer notes */}
      {target.notes && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-zinc-700 mb-1">{ru ? 'Рекомендации тренера' : 'Trainer notes'}</p>
            <p className="text-sm text-zinc-500 whitespace-pre-line">{target.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Save button */}
      <Button
        variant="gradient"
        className="w-full h-12 text-base"
        disabled={saving}
        onClick={handleSave}
      >
        {saving && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
        {saving ? (ru ? 'Сохранение...' : 'Saving...') : (ru ? 'Сохранить' : 'Save')}
      </Button>
    </div>
  )
}
