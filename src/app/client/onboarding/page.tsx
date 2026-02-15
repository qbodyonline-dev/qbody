'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { fetchWithAuth } from '@/lib/api'
import { compressImage } from '@/lib/compress-image'
import { Loader2, CheckCircle2, ChevronLeft, ChevronRight, Camera, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

/* ═══════════════════════════════════════════
   STEP DEFINITIONS — each step is one screen
   ═══════════════════════════════════════════ */
type StepDef = {
  key: string
  titleEn: string
  titleRu: string
  subtitleEn?: string
  subtitleRu?: string
  dbField: string
  type: 'date' | 'gender' | 'weight' | 'height' | 'goal' | 'level' | 'location' | 'text' | 'photo'
  required?: boolean
  unit?: string
}

const STEPS: StepDef[] = [
  // Step 1: Date of birth + Gender (combined)
  {
    key: 'dob', titleEn: 'Personal Data', titleRu: 'Персональные данные',
    subtitleEn: 'Select your date of birth and gender', subtitleRu: 'Выберите дату рождения и пол',
    dbField: 'date_of_birth', type: 'date', required: true,
  },
  // Step 2: Current weight
  {
    key: 'weight', titleEn: 'Weight', titleRu: 'Вес',
    subtitleEn: 'Select your current weight', subtitleRu: 'Выберите ваш текущий вес',
    dbField: 'current_weight', type: 'weight', required: true, unit: 'kg',
  },
  // Step 3: Height
  {
    key: 'height', titleEn: 'Height', titleRu: 'Рост',
    subtitleEn: 'Select your height', subtitleRu: 'Выберите ваш рост',
    dbField: 'height', type: 'height', required: true, unit: 'cm',
  },
  // Step 4: Goal
  {
    key: 'goal', titleEn: 'Goal', titleRu: 'Цель',
    subtitleEn: 'Select your fitness goal', subtitleRu: 'Выберите вашу цель',
    dbField: 'primary_goal', type: 'goal', required: true,
  },
  // Step 5: Target weight
  {
    key: 'target_weight', titleEn: 'Target Weight', titleRu: 'Желаемый вес',
    subtitleEn: 'Select your target weight', subtitleRu: 'Выберите ваш желаемый вес',
    dbField: 'target_weight', type: 'weight', required: false, unit: 'kg',
  },
  // Step 6: Fitness level
  {
    key: 'level', titleEn: 'Fitness Level', titleRu: 'Уровень подготовки',
    subtitleEn: 'Select your current fitness level', subtitleRu: 'Выберите ваш уровень физической подготовки',
    dbField: 'training_experience', type: 'level', required: true,
  },
  // Step 7: Training location
  {
    key: 'location', titleEn: 'Training Location', titleRu: 'Место тренировок',
    subtitleEn: 'Where do you usually train?', subtitleRu: 'Где вы обычно тренируетесь?',
    dbField: 'training_location', type: 'location', required: true,
  },
  // Step 8: Health / injuries
  {
    key: 'health', titleEn: 'Health', titleRu: 'Здоровье',
    subtitleEn: 'Any conditions or injuries we should know about?', subtitleRu: 'Есть ли заболевания или травмы, о которых нам стоит знать?',
    dbField: 'medical_conditions', type: 'text', required: false,
  },
  // Step 9: Photo (optional)
  {
    key: 'photo', titleEn: 'Starting Photo', titleRu: 'Фото до',
    subtitleEn: 'Optional — take a photo to track progress', subtitleRu: 'По желанию — сделайте фото для отслеживания прогресса',
    dbField: 'photo_front', type: 'photo', required: false,
  },
]

/* ═══════════════════════════════
   MAIN ONBOARDING COMPONENT
   ═══════════════════════════════ */
export default function OnboardingPage() {
  const { locale } = useTranslation()
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const ru = locale === 'ru'

  const [step, setStep] = useState(0)
  const [values, setValues] = useState<Record<string, any>>({
    gender: 'female',
    current_weight: 60,
    height: 165,
    target_weight: 55,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')

  const totalSteps = STEPS.length
  const current = STEPS[step]

  // Check if onboarding already completed
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetchWithAuth('/api/onboarding')
        if (res.ok) {
          const data = await res.json()
          if (data.completed) {
            router.replace('/client/home')
            return
          }
          // Pre-fill existing data
          if (data.questionnaire) {
            const existing: Record<string, any> = {}
            Object.entries(data.questionnaire).forEach(([k, v]) => {
              if (v !== null && v !== undefined && k !== 'id' && k !== 'client_id' && k !== 'created_at') {
                existing[k] = v
              }
            })
            setValues(prev => ({ ...prev, ...existing }))
          }
          if (profile?.full_name) {
            setValues(prev => ({ ...prev, full_name: profile.full_name }))
          }
        }
      } catch { /* use defaults */ }
      finally { setLoading(false) }
    }
    if (!authLoading && user) check()
  }, [authLoading, user, profile, router])

  const set = (key: string, val: any) => setValues(prev => ({ ...prev, [key]: val }))

  /* Navigation */
  const goNext = () => {
    if (current.required) {
      const val = values[current.dbField]
      if (val === null || val === undefined || val === '') {
        toast.error(ru ? `Заполните: ${current.titleRu}` : `Required: ${current.titleEn}`)
        return
      }
    }
    if (step === totalSteps - 1) {
      handleSubmit()
    } else {
      setDirection('next')
      setStep(s => s + 1)
    }
  }

  const goBack = () => {
    if (step > 0) {
      setDirection('prev')
      setStep(s => s - 1)
    }
  }

  /* Submit */
  const handleSubmit = async () => {
    setSaving(true)
    try {
      const res = await fetchWithAuth('/api/onboarding', {
        method: 'POST',
        body: JSON.stringify({ values }),
      })
      if (!res.ok) throw new Error()
      setCompleted(true)
      toast.success(ru ? 'Анкета заполнена!' : 'Questionnaire completed!')
      setTimeout(() => router.push('/client/home'), 2000)
    } catch {
      toast.error(ru ? 'Ошибка сохранения' : 'Failed to save')
    } finally { setSaving(false) }
  }

  /* Upload */
  const uploadImage = async (file: File): Promise<string> => {
    let toUpload = file
    try { toUpload = await compressImage(file) } catch { /* use original */ }
    const fd = new FormData()
    fd.append('file', toUpload)
    const res = await fetchWithAuth('/api/upload', { method: 'POST', body: fd })
    if (!res.ok) throw new Error()
    const { url } = await res.json()
    return url
  }

  /* ═══ Loading ═══ */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  /* ═══ Completed ═══ */
  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="text-center">
          <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-teal-500" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">{ru ? 'Отлично!' : 'Great!'}</h1>
          <p className="text-zinc-500">{ru ? 'Переходим в личный кабинет...' : 'Redirecting to your dashboard...'}</p>
        </div>
      </div>
    )
  }

  /* ═══ Main render ═══ */
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <button onClick={goBack} disabled={step === 0}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${step === 0 ? 'text-zinc-200' : 'text-zinc-600 hover:bg-zinc-100'}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-zinc-900">
            {ru ? current.titleRu : current.titleEn}
          </h2>
          <div className="w-10" /> {/* spacer */}
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-teal-500' : 'bg-zinc-200'}`} />
          ))}
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-sm text-zinc-500 px-6 mt-4">
        {ru ? current.subtitleRu : current.subtitleEn}
      </p>

      {/* Content area — fills remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
        {current.type === 'date' && (
          <DateGenderStep
            dob={values.date_of_birth || ''}
            gender={values.gender || 'female'}
            onDobChange={v => set('date_of_birth', v)}
            onGenderChange={v => set('gender', v)}
            ru={ru}
          />
        )}
        {current.type === 'weight' && (
          <WeightPicker
            value={values[current.dbField] || 60}
            onChange={v => set(current.dbField, v)}
            ru={ru}
            label={ru ? current.titleRu : current.titleEn}
          />
        )}
        {current.type === 'height' && (
          <HeightPicker
            value={values.height || 165}
            onChange={v => set('height', v)}
            ru={ru}
          />
        )}
        {current.type === 'goal' && (
          <GoalPicker
            value={values.primary_goal || ''}
            onChange={v => set('primary_goal', v)}
            ru={ru}
          />
        )}
        {current.type === 'level' && (
          <LevelPicker
            value={values.training_experience || ''}
            onChange={v => set('training_experience', v)}
            ru={ru}
          />
        )}
        {current.type === 'location' && (
          <LocationPicker
            value={values.training_location || ''}
            onChange={v => set('training_location', v)}
            ru={ru}
          />
        )}
        {current.type === 'text' && (
          <TextStep
            value={values[current.dbField] || ''}
            onChange={v => set(current.dbField, v)}
            placeholder={ru ? 'Опишите...' : 'Describe...'}
          />
        )}
        {current.type === 'photo' && (
          <PhotoStep
            value={values.photo_front}
            onChange={v => set('photo_front', v)}
            uploadImage={uploadImage}
            ru={ru}
          />
        )}
      </div>

      {/* Bottom button */}
      <div className="flex-shrink-0 px-6 pb-8 pt-4">
        <button
          onClick={goNext}
          disabled={saving}
          className="w-full h-14 rounded-2xl bg-teal-500 text-white font-semibold text-base transition-all hover:bg-teal-600 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-5 h-5 animate-spin" />}
          {step === totalSteps - 1
            ? (ru ? 'Завершить' : 'Complete')
            : (ru ? 'Следующий шаг' : 'Next Step')
          }
        </button>
        {!current.required && (
          <button onClick={goNext} className="w-full mt-3 text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
            {ru ? 'Пропустить' : 'Skip'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   STEP COMPONENTS
   ═══════════════════════════════════════════════ */

/* ── Date of Birth + Gender ── */
function DateGenderStep({ dob, gender, onDobChange, onGenderChange, ru }: {
  dob: string; gender: string; onDobChange: (v: string) => void; onGenderChange: (v: string) => void; ru: boolean
}) {
  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Date */}
      <div>
        <label className="text-sm font-medium text-zinc-700 mb-2 block">{ru ? 'Дата рождения' : 'Date of Birth'}</label>
        <input
          type="date"
          value={dob}
          onChange={e => onDobChange(e.target.value)}
          className="w-full h-14 px-5 rounded-2xl border-2 border-zinc-200 text-base focus:border-teal-500 focus:outline-none transition-colors bg-white"
        />
      </div>

      {/* Gender */}
      <div>
        <label className="text-sm font-medium text-zinc-700 mb-3 block">{ru ? 'Пол' : 'Gender'}</label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'male', labelEn: 'Male', labelRu: 'Мужской', emoji: '👨' },
            { key: 'female', labelEn: 'Female', labelRu: 'Женский', emoji: '👩' },
          ].map(g => (
            <button
              key={g.key}
              onClick={() => onGenderChange(g.key)}
              className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                gender === g.key
                  ? 'border-teal-500 bg-teal-50 shadow-lg shadow-teal-500/10'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              }`}
            >
              {gender === g.key && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
              <span className="text-5xl">{g.emoji}</span>
              <span className={`font-medium text-sm ${gender === g.key ? 'text-teal-700' : 'text-zinc-600'}`}>
                {ru ? g.labelRu : g.labelEn}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Weight Picker (horizontal ruler) ── */
function WeightPicker({ value, onChange, ru, label }: {
  value: number; onChange: (v: number) => void; ru: boolean; label: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const min = 30, max = 200
  const TICK_W = 12

  // Scroll to value on mount
  useEffect(() => {
    if (scrollRef.current) {
      const center = (value - min) * TICK_W - scrollRef.current.clientWidth / 2
      scrollRef.current.scrollLeft = center
    }
  }, [])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const center = scrollRef.current.scrollLeft + scrollRef.current.clientWidth / 2
    const tick = Math.round(center / TICK_W) + min
    const clamped = Math.max(min, Math.min(max, tick))
    if (clamped !== value) onChange(clamped)
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-8">
      {/* Value display */}
      <div className="flex items-center gap-6">
        <button onClick={() => onChange(Math.max(min, value - 1))}
          className="w-12 h-12 rounded-full border-2 border-zinc-200 flex items-center justify-center text-zinc-400 hover:border-teal-500 hover:text-teal-500 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <p className="text-6xl font-bold text-zinc-900 tabular-nums">{value}</p>
          <p className="text-lg text-zinc-400 font-medium mt-1">{ru ? 'КГ' : 'KG'}</p>
        </div>
        <button onClick={() => onChange(Math.min(max, value + 1))}
          className="w-12 h-12 rounded-full border-2 border-zinc-200 flex items-center justify-center text-zinc-400 hover:border-teal-500 hover:text-teal-500 transition-colors">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Ruler */}
      <div className="w-full relative">
        {/* Center indicator */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-teal-500 z-10 -translate-x-px" />
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-x-auto scrollbar-hide py-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div style={{ width: `${(max - min) * TICK_W}px`, height: '60px' }} className="relative">
            {Array.from({ length: max - min + 1 }, (_, i) => {
              const v = min + i
              const isMajor = v % 5 === 0
              return (
                <div
                  key={v}
                  className="absolute bottom-0"
                  style={{ left: `${i * TICK_W}px` }}
                >
                  <div className={`w-px mx-auto ${isMajor ? 'h-10 bg-zinc-400' : 'h-5 bg-zinc-200'}`} />
                  {isMajor && <p className="text-[10px] text-zinc-400 text-center mt-1 -ml-3 w-6">{v}</p>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Height Picker (vertical ruler) ── */
function HeightPicker({ value, onChange, ru }: {
  value: number; onChange: (v: number) => void; ru: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const min = 100, max = 220
  const TICK_H = 12

  useEffect(() => {
    if (scrollRef.current) {
      const offset = (max - value) * TICK_H - scrollRef.current.clientHeight / 2
      scrollRef.current.scrollTop = offset
    }
  }, [])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const center = scrollRef.current.scrollTop + scrollRef.current.clientHeight / 2
    const tick = max - Math.round(center / TICK_H)
    const clamped = Math.max(min, Math.min(max, tick))
    if (clamped !== value) onChange(clamped)
  }

  return (
    <div className="flex items-center gap-8 w-full max-w-sm justify-center">
      {/* Value */}
      <div className="text-center">
        <p className="text-6xl font-bold text-zinc-900 tabular-nums">{value}</p>
        <p className="text-lg text-zinc-400 font-medium mt-1">{ru ? 'СМ' : 'CM'}</p>
      </div>

      {/* Vertical ruler */}
      <div className="relative h-[280px]">
        {/* Center indicator */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-teal-500 z-10 -translate-y-px" />
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div style={{ height: `${(max - min) * TICK_H}px` }} className="relative w-24">
            {Array.from({ length: max - min + 1 }, (_, i) => {
              const v = max - i
              const isMajor = v % 10 === 0
              return (
                <div
                  key={v}
                  className="absolute right-0 flex items-center"
                  style={{ top: `${i * TICK_H}px` }}
                >
                  {isMajor && <span className="text-[11px] text-zinc-400 mr-2">{v}</span>}
                  <div className={`h-px ${isMajor ? 'w-8 bg-zinc-400' : 'w-4 bg-zinc-200'}`} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Goal Picker ── */
function GoalPicker({ value, onChange, ru }: {
  value: string; onChange: (v: string) => void; ru: boolean
}) {
  const goals = [
    { key: 'weight_loss', labelEn: 'Lose Weight', labelRu: 'Похудеть', icon: '🔥' },
    { key: 'toning', labelEn: 'Stay in Shape', labelRu: 'Поддержка формы', icon: '💪' },
    { key: 'muscle_gain', labelEn: 'Build Muscle', labelRu: 'Нарастить мышцы', icon: '🏋️' },
    { key: 'general_health', labelEn: 'Improve Nutrition', labelRu: 'Наладить питание', icon: '🥗' },
    { key: 'recovery', labelEn: 'Recovery / Rehab', labelRu: 'Восстановление', icon: '🧘' },
    { key: 'postnatal', labelEn: 'Postnatal Recovery', labelRu: 'Послеродовое восстановление', icon: '👶' },
  ]

  return (
    <div className="w-full max-w-sm space-y-3">
      {goals.map(g => (
        <button
          key={g.key}
          onClick={() => onChange(g.key)}
          className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all text-left ${
            value === g.key
              ? 'border-teal-500 bg-teal-50 shadow-lg shadow-teal-500/10'
              : 'border-zinc-200 bg-white hover:border-zinc-300'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${value === g.key ? 'bg-teal-100' : 'bg-zinc-100'}`}>
            {g.icon}
          </div>
          <span className={`font-medium ${value === g.key ? 'text-teal-700' : 'text-zinc-700'}`}>
            {ru ? g.labelRu : g.labelEn}
          </span>
        </button>
      ))}
    </div>
  )
}

/* ── Fitness Level Picker ── */
function LevelPicker({ value, onChange, ru }: {
  value: string; onChange: (v: string) => void; ru: boolean
}) {
  const levels = [
    { key: 'none', num: 1, labelEn: 'No physical activity', labelRu: 'Отсутствует физическая нагрузка' },
    { key: 'beginner', num: 2, labelEn: 'Train 1-3 times a week', labelRu: 'Тренируюсь 1-3 раза в неделю' },
    { key: 'intermediate', num: 3, labelEn: 'Train 3+ times a week', labelRu: 'Тренируюсь 3+ раз в неделю' },
    { key: 'advanced', num: 4, labelEn: 'Professional level', labelRu: 'Профессиональный уровень' },
  ]

  return (
    <div className="w-full max-w-sm space-y-3">
      {levels.map(l => (
        <button
          key={l.key}
          onClick={() => onChange(l.key)}
          className={`w-full flex items-center gap-4 px-5 py-5 rounded-2xl border-2 transition-all text-left ${
            value === l.key
              ? 'border-teal-500 bg-teal-50 shadow-lg shadow-teal-500/10'
              : 'border-zinc-200 bg-white hover:border-zinc-300'
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
            value === l.key ? 'bg-teal-500 text-white' : 'bg-zinc-100 text-zinc-400'
          }`}>
            {l.num}
          </div>
          <span className={`font-medium text-sm ${value === l.key ? 'text-teal-700' : 'text-zinc-700'}`}>
            {ru ? l.labelRu : l.labelEn}
          </span>
        </button>
      ))}
    </div>
  )
}

/* ── Training Location Picker ── */
function LocationPicker({ value, onChange, ru }: {
  value: string; onChange: (v: string) => void; ru: boolean
}) {
  const locations = [
    { key: 'gym', labelEn: 'Gym', labelRu: 'Тренажёрный зал', icon: '🏋️' },
    { key: 'home', labelEn: 'Home', labelRu: 'Дома', icon: '🏠' },
    { key: 'both', labelEn: 'Gym & Home', labelRu: 'Зал и дома', icon: '🔄' },
    { key: 'outdoor', labelEn: 'Outdoor', labelRu: 'На улице', icon: '🌳' },
  ]

  return (
    <div className="w-full max-w-sm grid grid-cols-2 gap-4">
      {locations.map(l => (
        <button
          key={l.key}
          onClick={() => onChange(l.key)}
          className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
            value === l.key
              ? 'border-teal-500 bg-teal-50 shadow-lg shadow-teal-500/10'
              : 'border-zinc-200 bg-white hover:border-zinc-300'
          }`}
        >
          <span className="text-4xl">{l.icon}</span>
          <span className={`font-medium text-sm ${value === l.key ? 'text-teal-700' : 'text-zinc-600'}`}>
            {ru ? l.labelRu : l.labelEn}
          </span>
        </button>
      ))}
    </div>
  )
}

/* ── Text Step ── */
function TextStep({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div className="w-full max-w-sm">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        className="w-full px-5 py-4 rounded-2xl border-2 border-zinc-200 text-base resize-none focus:border-teal-500 focus:outline-none transition-colors"
      />
    </div>
  )
}

/* ── Photo Step ── */
function PhotoStep({ value, onChange, uploadImage, ru }: {
  value: string | null; onChange: (v: string | null) => void
  uploadImage: (f: File) => Promise<string>; ru: boolean
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      onChange(url)
    } catch {
      toast.error(ru ? 'Ошибка загрузки' : 'Upload failed')
    } finally { setUploading(false) }
  }

  if (value) {
    return (
      <div className="w-full max-w-sm flex flex-col items-center gap-4">
        <img src={value} alt="" className="w-48 h-64 object-cover rounded-2xl shadow-lg" />
        <button onClick={() => onChange(null)} className="text-sm text-red-500 hover:text-red-600">
          {ru ? 'Удалить и загрузить другое' : 'Remove and upload another'}
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full h-64 rounded-2xl border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center gap-4 hover:border-teal-400 transition-colors bg-zinc-50"
      >
        {uploading ? (
          <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
        ) : (
          <>
            <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center">
              <Camera className="w-8 h-8 text-teal-500" />
            </div>
            <div className="text-center">
              <p className="font-medium text-zinc-700">{ru ? 'Загрузить фото' : 'Upload Photo'}</p>
              <p className="text-xs text-zinc-400 mt-1">{ru ? 'Фронтальное фото в полный рост' : 'Full body front photo'}</p>
            </div>
          </>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  )
}
