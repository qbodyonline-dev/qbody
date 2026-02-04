'use client'
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import {
  Save, Upload, Camera, User, Mail, Phone, Globe, Instagram,
  Send, MessageSquare, Clock, Calendar, MapPin, Award, Link as LinkIcon
} from 'lucide-react'
import { toast } from 'sonner'

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const weekDaysRu = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function TrainerProfilePage() {
  const { locale } = useTranslation()
  const ru = locale === 'ru'
  const [isSaving, setIsSaving] = useState(false)

  const [profile, setProfile] = useState({
    firstName: 'Aleksandra',
    lastName: 'Khavanskaia',
    email: 'info@qbody.app',
    phone: '+1 234 567 890',
    bioEn: 'Certified personal trainer with 17 years of experience. NASM CPT, CES, PBC, CAPT certified. Active NPC USA athlete and silver medalist at Olympia Amateur.',
    bioRu: 'Сертифицированный персональный тренер с 17-летним опытом. Сертификаты NASM CPT, CES, PBC, CAPT. Действующая спортсменка NPC USA, серебряный призёр Olympia Amateur.',
    specialtyEn: 'Weight loss, muscle gain, post-surgery recovery, adaptive training',
    specialtyRu: 'Похудение, набор массы, восстановление после операций, адаптивный тренинг',
    location: 'Las Vegas, NV, USA',
    website: 'https://qbody.app',
    instagram: '@qbody_fitness',
    telegram: '@qbody_coach',
    whatsapp: '+1234567890',
  })

  const [schedule, setSchedule] = useState([
    { day: 0, active: true, from: '09:00', to: '18:00' },
    { day: 1, active: true, from: '09:00', to: '18:00' },
    { day: 2, active: true, from: '09:00', to: '18:00' },
    { day: 3, active: true, from: '09:00', to: '18:00' },
    { day: 4, active: true, from: '09:00', to: '17:00' },
    { day: 5, active: false, from: '10:00', to: '14:00' },
    { day: 6, active: false, from: '', to: '' },
  ])

  const u = (key: string, val: string) => setProfile({ ...profile, [key]: val })
  const handleSave = async () => { setIsSaving(true); await new Promise(r => setTimeout(r, 800)); toast.success(ru ? 'Профиль сохранён!' : 'Profile saved!'); setIsSaving(false) }

  const days = ru ? weekDaysRu : weekDays

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{ru ? 'Профиль тренера' : 'Trainer Profile'}</h1>
          <p className="text-zinc-500 mt-1">{ru ? 'Ваши данные и график работы' : 'Your info and work schedule'}</p>
        </div>
        <Button variant="gradient" onClick={handleSave} disabled={isSaving}><Save className="w-4 h-4 mr-2" />{isSaving ? '...' : ru ? 'Сохранить' : 'Save'}</Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — Avatar & Quick Info */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-zinc-100 mx-auto border-4 border-white shadow-lg">
                  <img src="/images/hero-alexandra.jpg" alt="" className="w-full h-full object-cover" />
                </div>
                <button className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-lg hover:bg-teal-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-xl font-bold text-zinc-900">{profile.firstName} {profile.lastName}</h2>
              <p className="text-sm text-zinc-500 mt-1">{profile.email}</p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                <Badge variant="outline" className="text-xs">NASM CPT</Badge>
                <Badge variant="outline" className="text-xs">CES</Badge>
                <Badge variant="outline" className="text-xs">PBC</Badge>
                <Badge variant="outline" className="text-xs">CAPT</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">{ru ? 'Статистика' : 'Stats'}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: ru ? 'Активных клиентов' : 'Active clients', value: '24' },
                { label: ru ? 'Лет опыта' : 'Years experience', value: '17+' },
                { label: ru ? 'Рейтинг' : 'Rating', value: '4.9 ⭐' },
                { label: ru ? 'Сертификатов' : 'Certificates', value: '12' },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500">{s.label}</span>
                  <span className="text-sm font-bold text-zinc-900">{s.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right — Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader><CardTitle>{ru ? 'Личные данные' : 'Personal Info'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label={ru ? 'Имя' : 'First name'} value={profile.firstName} onChange={e => u('firstName', e.target.value)} />
                <Input label={ru ? 'Фамилия' : 'Last name'} value={profile.lastName} onChange={e => u('lastName', e.target.value)} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Email" type="email" value={profile.email} onChange={e => u('email', e.target.value)} />
                <Input label={ru ? 'Телефон' : 'Phone'} value={profile.phone} onChange={e => u('phone', e.target.value)} />
              </div>
              <Input label={ru ? 'Местоположение' : 'Location'} value={profile.location} onChange={e => u('location', e.target.value)} />
              <Input label={ru ? 'Сайт' : 'Website'} value={profile.website} onChange={e => u('website', e.target.value)} />
            </CardContent>
          </Card>

          {/* Bio */}
          <Card>
            <CardHeader><CardTitle>{ru ? 'О себе' : 'Bio'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1.5 block">EN</label>
                <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm" rows={3} value={profile.bioEn} onChange={e => u('bioEn', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1.5 block">RU</label>
                <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm" rows={3} value={profile.bioRu} onChange={e => u('bioRu', e.target.value)} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">{ru ? 'Специализация (EN)' : 'Specialty (EN)'}</label>
                  <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm" rows={2} value={profile.specialtyEn} onChange={e => u('specialtyEn', e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">{ru ? 'Специализация (RU)' : 'Specialty (RU)'}</label>
                  <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm" rows={2} value={profile.specialtyRu} onChange={e => u('specialtyRu', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social */}
          <Card>
            <CardHeader><CardTitle>{ru ? 'Соцсети' : 'Social Media'}</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-4">
              <Input label="Instagram" value={profile.instagram} onChange={e => u('instagram', e.target.value)} />
              <Input label="Telegram" value={profile.telegram} onChange={e => u('telegram', e.target.value)} />
              <Input label="WhatsApp" value={profile.whatsapp} onChange={e => u('whatsapp', e.target.value)} />
            </CardContent>
          </Card>

          {/* Work Schedule */}
          <Card>
            <CardHeader><CardTitle>{ru ? 'График работы' : 'Work Schedule'}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schedule.map((s, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10">
                      <span className={`text-sm font-medium ${s.active ? 'text-zinc-900' : 'text-zinc-400'}`}>{days[i]}</span>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${s.active ? 'bg-teal-500' : 'bg-zinc-300'}`}
                      onClick={() => { const n = [...schedule]; n[i] = { ...n[i], active: !n[i].active }; setSchedule(n) }}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${s.active ? 'translate-x-4' : ''}`} />
                    </div>
                    {s.active ? (
                      <>
                        <input type="time" className="h-10 px-3 rounded-lg border border-zinc-200 text-sm" value={s.from}
                          onChange={e => { const n = [...schedule]; n[i] = { ...n[i], from: e.target.value }; setSchedule(n) }} />
                        <span className="text-zinc-400">—</span>
                        <input type="time" className="h-10 px-3 rounded-lg border border-zinc-200 text-sm" value={s.to}
                          onChange={e => { const n = [...schedule]; n[i] = { ...n[i], to: e.target.value }; setSchedule(n) }} />
                      </>
                    ) : (
                      <span className="text-sm text-zinc-400">{ru ? 'Выходной' : 'Day off'}</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
