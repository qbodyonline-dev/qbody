'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { fetchWithAuth } from '@/lib/api'
import DynamicFormRenderer from '@/components/ui/dynamic-form-renderer'
import type { FormField } from '@/lib/form-types'
import { compressImage } from '@/lib/compress-image'
import { Loader2, ClipboardList, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'

/* Default fields — used when no template exists in DB */
const defaultOnboardingFields: FormField[] = [
  { id: 'o1', type: 'text', labelEn: 'Full name', labelRu: 'ФИО', required: true, dbField: 'full_name' },
  { id: 'o2', type: 'date', labelEn: 'Date of birth', labelRu: 'Дата рождения', required: true, dbField: 'date_of_birth' },
  { id: 'o3', type: 'number', labelEn: 'Height (cm)', labelRu: 'Рост (см)', required: true, dbField: 'height' },
  { id: 'o4', type: 'number', labelEn: 'Current weight (kg)', labelRu: 'Текущий вес (кг)', required: true, dbField: 'current_weight' },
  { id: 'o5', type: 'number', labelEn: 'Target weight (kg)', labelRu: 'Желаемый вес (кг)', required: false, dbField: 'target_weight' },
  { id: 'o6', type: 'select', labelEn: 'Fitness goal', labelRu: 'Цель', required: true, dbField: 'primary_goal', options: [
    { en: 'Weight loss', ru: 'Похудение' }, { en: 'Muscle gain', ru: 'Набор массы' }, { en: 'Recovery', ru: 'Восстановление' }, { en: 'General fitness', ru: 'Общий тонус' }, { en: 'Postnatal', ru: 'Послеродовое' }
  ]},
  { id: 'o7', type: 'select', labelEn: 'Training experience', labelRu: 'Опыт тренировок', required: true, dbField: 'training_experience', options: [
    { en: 'None', ru: 'Нет' }, { en: 'Beginner (< 1 year)', ru: 'Новичок (< 1 года)' }, { en: '1-3 years', ru: '1-3 года' }, { en: '3+ years', ru: '3+ лет' }
  ]},
  { id: 'o8', type: 'select', labelEn: 'Training location', labelRu: 'Где тренируетесь', required: true, dbField: 'training_location', options: [
    { en: 'Gym', ru: 'Зал' }, { en: 'Home', ru: 'Дома' }, { en: 'Both', ru: 'Зал и дома' }, { en: 'Outdoor', ru: 'На улице' }
  ]},
  { id: 'o9', type: 'textarea', labelEn: 'Health conditions / injuries', labelRu: 'Заболевания / травмы', required: false, dbField: 'medical_conditions' },
  { id: 'o10', type: 'textarea', labelEn: 'Medications', labelRu: 'Лекарства', required: false, dbField: 'medications' },
  { id: 'o11', type: 'select', labelEn: 'Activity level', labelRu: 'Уровень активности', required: true, dbField: 'activity_level', options: [
    { en: 'Sedentary', ru: 'Сидячий' }, { en: 'Light', ru: 'Лёгкий' }, { en: 'Moderate', ru: 'Средний' }, { en: 'Active', ru: 'Активный' }, { en: 'Very active', ru: 'Очень активный' }
  ]},
  { id: 'o12', type: 'textarea', labelEn: 'Additional notes', labelRu: 'Дополнительно', required: false, dbField: 'notes' },
]

export default function OnboardingPage() {
  const { locale } = useTranslation()
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const ru = locale === 'ru'

  const [fields, setFields] = useState<FormField[]>(defaultOnboardingFields)
  const [values, setValues] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(0)
  const [completed, setCompleted] = useState(false)

  // Split fields into steps of 4
  const FIELDS_PER_STEP = 4
  const steps = []
  for (let i = 0; i < fields.length; i += FIELDS_PER_STEP) {
    steps.push(fields.slice(i, i + FIELDS_PER_STEP))
  }
  const totalSteps = steps.length
  const currentFields = steps[step] || []
  const isLastStep = step === totalSteps - 1

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth('/api/onboarding')
        if (res.ok) {
          const data = await res.json()
          if (data.completed) {
            // Already completed — redirect to home
            router.replace('/client/home')
            return
          }
          if (data.template?.fields?.length > 0) {
            setFields(data.template.fields)
          }
          // Pre-fill from existing questionnaire or profile
          const existing: Record<string, any> = {}
          if (data.questionnaire) {
            Object.entries(data.questionnaire).forEach(([k, v]) => {
              if (v !== null && k !== 'id' && k !== 'client_id' && k !== 'created_at' && k !== 'updated_at' && k !== 'filled_at' && k !== 'custom_data') {
                existing[k] = v
              }
            })
            if (data.questionnaire.custom_data) {
              Object.assign(existing, data.questionnaire.custom_data)
            }
          }
          // Pre-fill name from profile
          if (profile?.full_name && !existing.full_name) {
            existing.full_name = profile.full_name
          }
          setValues(existing)
        }
      } catch { /* use defaults */ }
      finally { setLoading(false) }
    }
    if (!authLoading && user) load()
  }, [authLoading, user, profile, router])

  /* ─── Upload ─── */
  const uploadImage = async (file: File): Promise<string> => {
    let toUpload = file
    try { toUpload = await compressImage(file) } catch { /* use original */ }
    const fd = new FormData()
    fd.append('file', toUpload)
    const res = await fetchWithAuth('/api/upload', { method: 'POST', body: fd, headers: {} })
    if (!res.ok) throw new Error('Upload failed')
    const { url } = await res.json()
    return url
  }

  /* ─── Navigate steps ─── */
  const goNext = () => {
    // Validate required fields for current step
    for (const f of currentFields) {
      const key = f.dbField || f.id
      if (f.required && !values[key]) {
        toast.error(ru ? `Заполните: ${f.labelRu}` : `Required: ${f.labelEn}`)
        return
      }
    }
    if (isLastStep) {
      handleSubmit()
    } else {
      setStep(s => Math.min(s + 1, totalSteps - 1))
    }
  }

  const goBack = () => setStep(s => Math.max(s - 1, 0))

  /* ─── Submit ─── */
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
      // Redirect after animation
      setTimeout(() => router.push('/client/home'), 2000)
    } catch {
      toast.error(ru ? 'Ошибка сохранения' : 'Failed to save')
    } finally { setSaving(false) }
  }

  /* ═══════════ RENDER ═══════════ */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-white">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">{ru ? 'Отлично!' : 'Great!'}</h1>
          <p className="text-zinc-500">{ru ? 'Ваша анкета заполнена. Переходим в личный кабинет...' : 'Your questionnaire is complete. Redirecting...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-zinc-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-1">{ru ? 'Расскажите о себе' : 'Tell us about yourself'}</h1>
          <p className="text-zinc-500 text-sm">{ru ? 'Это поможет подобрать программу' : 'This helps us personalize your program'}</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-zinc-200">
              <div className={`h-full rounded-full transition-all duration-500 ${i <= step ? 'bg-teal-500' : 'bg-transparent'}`}
                style={{ width: i < step ? '100%' : i === step ? '50%' : '0%' }} />
            </div>
          ))}
          <span className="text-xs text-zinc-400 ml-2">{step + 1}/{totalSteps}</span>
        </div>

        {/* Form card */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <DynamicFormRenderer
              fields={currentFields}
              values={values}
              onChange={setValues}
              ru={ru}
              uploadImage={uploadImage}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={goBack} disabled={step === 0} className="px-6">
            <ChevronLeft className="w-4 h-4 mr-1" />{ru ? 'Назад' : 'Back'}
          </Button>
          <Button variant="gradient" onClick={goNext} disabled={saving} className="px-6">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isLastStep ? (ru ? 'Завершить' : 'Complete') : (ru ? 'Далее' : 'Next')}
            {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>

        {/* Skip link */}
        <div className="text-center mt-4">
          <button onClick={() => router.push('/client/home')} className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
            {ru ? 'Пропустить и заполнить позже' : 'Skip and fill later'}
          </button>
        </div>
      </div>
    </div>
  )
}
