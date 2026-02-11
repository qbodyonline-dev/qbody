'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import {
  ArrowLeft, ArrowRight, Check, User, Heart, Target, Ruler, CreditCard,
  Camera, Upload, ChevronRight, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

const steps = [
  { id: 'personal', icon: User },
  { id: 'health', icon: Heart },
  { id: 'goals', icon: Target },
  { id: 'measurements', icon: Ruler },
  { id: 'subscription', icon: CreditCard },
]

export default function OnboardClientPage() {
  const { locale } = useTranslation()
  const { session } = useAuth()
  const router = useRouter()
  const ru = locale === 'ru'
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const [data, setData] = useState({
    firstName: '', lastName: '', email: '', phone: '', birthDate: '', gender: 'female',
    conditions: '', surgeries: '', medications: '', allergies: '', injuries: '',
    goal: '', experience: '', daysPerWeek: '3', equipment: '', motivation: '',
    weight: '', height: '', chest: '', waist: '', hips: '', arm: '', thigh: '',
    plan: 'premium', program: 'weightLoss', startDate: '', notes: '',
  })

  const u = (key: string, val: string) => setData({ ...data, [key]: val })

  const stepLabels = ru
    ? ['Личные данные', 'Здоровье', 'Цели', 'Замеры', 'Подписка']
    : ['Personal Info', 'Health', 'Goals', 'Measurements', 'Subscription']

  const next = () => {
    // Validate email on step 0 before proceeding
    if (step === 0 && !data.email.includes('@')) {
      toast.error(ru ? 'Укажите корректный email' : 'Please enter a valid email')
      return
    }
    step < 4 && setStep(step + 1)
  }
  const prev = () => step > 0 && setStep(step - 1)

  const submit = async () => {
    if (!session?.access_token) {
      toast.error(ru ? 'Нет авторизации' : 'Not authorized')
      return
    }
    if (!data.email.includes('@')) {
      toast.error(ru ? 'Укажите корректный email' : 'Please enter a valid email')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/clients/onboard', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to create client')
      }

      toast.success(ru ? 'Клиент успешно создан!' : 'Client created successfully!')
      router.push(`/dashboard/clients/${result.client.id}`)
    } catch (err: any) {
      const msg = err.message || ''
      if (msg.includes('already exists')) {
        toast.error(ru ? 'Пользователь с таким email уже существует' : 'A user with this email already exists')
      } else {
        toast.error(ru ? `Ошибка: ${msg}` : `Error: ${msg}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{ru ? 'Новый клиент' : 'New Client'}</h1>
          <p className="text-zinc-500 mt-1">{ru ? 'Пошаговая регистрация' : 'Step-by-step registration'}</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between">
        {steps.map((s, i) => {
          const Icon = s.icon
          const done = i < step, active = i === step
          return (
            <React.Fragment key={s.id}>
              <button onClick={() => i <= step && setStep(i)} className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${done ? 'bg-teal-500 text-white' : active ? 'bg-teal-500 text-white ring-4 ring-teal-500/20' : 'bg-zinc-100 text-zinc-400'}`}>
                  {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-medium ${active ? 'text-teal-600' : 'text-zinc-400'}`}>{stepLabels[i]}</span>
              </button>
              {i < 4 && <div className={`flex-1 h-0.5 mx-2 rounded ${i < step ? 'bg-teal-500' : 'bg-zinc-200'}`} />}
            </React.Fragment>
          )
        })}
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Step 1: Personal */}
          {step === 0 && (<>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label={ru ? 'Имя' : 'First name'} value={data.firstName} onChange={e => u('firstName', e.target.value)} />
              <Input label={ru ? 'Фамилия' : 'Last name'} value={data.lastName} onChange={e => u('lastName', e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Email" type="email" value={data.email} onChange={e => u('email', e.target.value)} />
              <Input label={ru ? 'Телефон' : 'Phone'} value={data.phone} onChange={e => u('phone', e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label={ru ? 'Дата рождения' : 'Date of birth'} type="date" value={data.birthDate} onChange={e => u('birthDate', e.target.value)} />
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1.5 block">{ru ? 'Пол' : 'Gender'}</label>
                <div className="flex gap-3">
                  {(['female', 'male'] as const).map(g => (
                    <button key={g} onClick={() => u('gender', g)} className={`flex-1 h-11 rounded-xl border text-sm font-medium transition-all ${data.gender === g ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}>
                      {g === 'female' ? (ru ? 'Женский' : 'Female') : (ru ? 'Мужской' : 'Male')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>)}

          {/* Step 2: Health */}
          {step === 1 && (<>
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1.5 block">{ru ? 'Состояние здоровья / хронические заболевания' : 'Health conditions / chronic issues'}</label>
              <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm" rows={3} value={data.conditions} onChange={e => u('conditions', e.target.value)} placeholder={ru ? 'Перечислите если есть...' : 'List any if applicable...'} />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1.5 block">{ru ? 'Операции' : 'Surgeries'}</label>
              <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm" rows={2} value={data.surgeries} onChange={e => u('surgeries', e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1.5 block">{ru ? 'Лекарства' : 'Medications'}</label>
                <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm" rows={2} value={data.medications} onChange={e => u('medications', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1.5 block">{ru ? 'Травмы' : 'Injuries'}</label>
                <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm" rows={2} value={data.injuries} onChange={e => u('injuries', e.target.value)} />
              </div>
            </div>
            <Input label={ru ? 'Аллергии' : 'Allergies'} value={data.allergies} onChange={e => u('allergies', e.target.value)} />
          </>)}

          {/* Step 3: Goals */}
          {step === 2 && (<>
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-3 block">{ru ? 'Основная цель' : 'Primary goal'}</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: 'weightLoss', en: '🔥 Weight Loss', ru: '🔥 Похудение' },
                  { v: 'muscleGain', en: '💪 Muscle Gain', ru: '💪 Набор массы' },
                  { v: 'recovery', en: '🏥 Recovery', ru: '🏥 Восстановление' },
                  { v: 'generalFitness', en: '⚡ General Fitness', ru: '⚡ Общий тонус' },
                ].map(g => (
                  <button key={g.v} onClick={() => u('goal', g.v)} className={`p-4 rounded-xl border text-left transition-all ${data.goal === g.v ? 'border-teal-500 bg-teal-50' : 'border-zinc-200 hover:border-zinc-300'}`}>
                    <span className="text-sm font-medium">{ru ? g.ru : g.en}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-3 block">{ru ? 'Опыт тренировок' : 'Training experience'}</label>
              <div className="flex gap-3">
                {[
                  { v: 'beginner', en: 'Beginner', ru: 'Новичок' },
                  { v: 'intermediate', en: '1-3 years', ru: '1-3 года' },
                  { v: 'advanced', en: '3+ years', ru: '3+ лет' },
                ].map(e => (
                  <button key={e.v} onClick={() => u('experience', e.v)} className={`flex-1 p-3 rounded-xl border text-center text-sm font-medium transition-all ${data.experience === e.v ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-zinc-200 text-zinc-500'}`}>
                    {ru ? e.ru : e.en}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-3 block">{ru ? 'Дней в неделю' : 'Days per week'}</label>
                <div className="flex gap-2">
                  {['2', '3', '4', '5', '6'].map(d => (
                    <button key={d} onClick={() => u('daysPerWeek', d)} className={`w-12 h-12 rounded-xl border text-sm font-bold transition-all ${data.daysPerWeek === d ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-zinc-200 text-zinc-500'}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-3 block">{ru ? 'Оборудование' : 'Equipment'}</label>
                <select className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm" value={data.equipment} onChange={e => u('equipment', e.target.value)}>
                  <option value="">{ru ? '— выберите —' : '— select —'}</option>
                  <option value="fullGym">{ru ? 'Полный зал' : 'Full gym'}</option>
                  <option value="homeGym">{ru ? 'Домашний зал' : 'Home gym'}</option>
                  <option value="minimal">{ru ? 'Минимальное' : 'Minimal'}</option>
                  <option value="none">{ru ? 'Нет' : 'None'}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1.5 block">{ru ? 'Мотивация / пожелания' : 'Motivation / notes'}</label>
              <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm" rows={3} value={data.motivation} onChange={e => u('motivation', e.target.value)} />
            </div>
          </>)}

          {/* Step 4: Measurements */}
          {step === 3 && (<>
            <div className="grid grid-cols-2 gap-4">
              <Input label={ru ? 'Вес (кг)' : 'Weight (kg)'} type="number" value={data.weight} onChange={e => u('weight', e.target.value)} />
              <Input label={ru ? 'Рост (см)' : 'Height (cm)'} type="number" value={data.height} onChange={e => u('height', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Input label={ru ? 'Грудь (см)' : 'Chest (cm)'} type="number" value={data.chest} onChange={e => u('chest', e.target.value)} />
              <Input label={ru ? 'Талия (см)' : 'Waist (cm)'} type="number" value={data.waist} onChange={e => u('waist', e.target.value)} />
              <Input label={ru ? 'Бёдра (см)' : 'Hips (cm)'} type="number" value={data.hips} onChange={e => u('hips', e.target.value)} />
              <Input label={ru ? 'Рука (см)' : 'Arm (cm)'} type="number" value={data.arm} onChange={e => u('arm', e.target.value)} />
              <Input label={ru ? 'Бедро (см)' : 'Thigh (cm)'} type="number" value={data.thigh} onChange={e => u('thigh', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-3 block">{ru ? 'Фото до (фронт + бок)' : 'Starting photos (front + side)'}</label>
              <div className="grid grid-cols-2 gap-4">
                {['Front', 'Side'].map(side => (
                  <div key={side} className="border-2 border-dashed border-zinc-300 rounded-xl p-8 text-center hover:border-teal-500 transition-colors cursor-pointer">
                    <Camera className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-sm text-zinc-400">{side}</p>
                  </div>
                ))}
              </div>
            </div>
          </>)}

          {/* Step 5: Subscription */}
          {step === 4 && (<>
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-3 block">{ru ? 'Тарифный план' : 'Subscription plan'}</label>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { v: 'basic', en: 'Basic', ru: 'Базовый', price: '$49/mo', desc: ru ? 'Программа + питание' : 'Program + nutrition' },
                  { v: 'premium', en: 'Premium', ru: 'Премиум', price: '$99/mo', desc: ru ? '+ чаты + чекины' : '+ chats + check-ins' },
                  { v: 'vip', en: 'VIP', ru: 'VIP', price: '$199/mo', desc: ru ? '+ видеозвонки' : '+ video calls' },
                ].map(p => (
                  <button key={p.v} onClick={() => u('plan', p.v)} className={`p-4 rounded-xl border text-center transition-all ${data.plan === p.v ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/20' : 'border-zinc-200'}`}>
                    <div className="font-bold text-lg">{p.price}</div>
                    <div className="font-medium text-sm">{ru ? p.ru : p.en}</div>
                    <div className="text-xs text-zinc-500 mt-1">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-3 block">{ru ? 'Назначить программу' : 'Assign program'}</label>
              <select className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm" value={data.program} onChange={e => u('program', e.target.value)}>
                <option value="weightLoss">{ru ? '8 недель: Похудение' : '8 weeks: Weight Loss'}</option>
                <option value="muscleGain">{ru ? '8 недель: Набор массы' : '8 weeks: Muscle Gain'}</option>
                <option value="beginner">{ru ? '8 недель: Новичок' : '8 weeks: Beginner'}</option>
                <option value="recovery">{ru ? 'Восстановление' : 'Recovery'}</option>
              </select>
            </div>
            <Input label={ru ? 'Дата старта' : 'Start date'} type="date" value={data.startDate} onChange={e => u('startDate', e.target.value)} />
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1.5 block">{ru ? 'Заметки тренера' : 'Trainer notes'}</label>
              <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm" rows={3} value={data.notes} onChange={e => u('notes', e.target.value)} />
            </div>
          </>)}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={prev} disabled={step === 0}><ArrowLeft className="w-4 h-4 mr-2" />{ru ? 'Назад' : 'Back'}</Button>
        {step < 4 ? (
          <Button variant="gradient" onClick={next}>{ru ? 'Далее' : 'Next'}<ArrowRight className="w-4 h-4 ml-2" /></Button>
        ) : (
          <Button variant="gradient" onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            {submitting ? (ru ? 'Создание...' : 'Creating...') : (ru ? 'Создать клиента' : 'Create client')}
          </Button>
        )}
      </div>
    </div>
  )
}
