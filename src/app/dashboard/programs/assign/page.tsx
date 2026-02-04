'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useTranslation } from '@/lib/i18n'
import {
  ArrowLeft, Save, Calendar, Target, Dumbbell, Clock, Check,
  ChevronRight, AlertCircle, User
} from 'lucide-react'
import { toast } from 'sonner'

const mockClients = [
  { id: '1', name: 'Anna K.', initials: 'AK', goal: 'Weight Loss', plan: 'Premium', currentProgram: null },
  { id: '2', name: 'Maria S.', initials: 'MS', goal: 'Muscle Gain', plan: 'Basic', currentProgram: 'Beginner 8w' },
  { id: '3', name: 'Elena P.', initials: 'EP', goal: 'Recovery', plan: 'VIP', currentProgram: null },
  { id: '4', name: 'Olga V.', initials: 'OV', goal: 'General', plan: 'Premium', currentProgram: 'Weight Loss 8w' },
]

const mockPrograms = [
  { id: 'p1', name: '8 Weeks: Weight Loss', nameRu: '8 недель: Похудение', weeks: 8, workoutsPerWeek: 4, color: 'from-pink-500 to-rose-500' },
  { id: 'p2', name: '8 Weeks: Muscle Gain', nameRu: '8 недель: Набор массы', weeks: 8, workoutsPerWeek: 5, color: 'from-blue-500 to-indigo-500' },
  { id: 'p3', name: '8 Weeks: Beginner', nameRu: '8 недель: Новичок', weeks: 8, workoutsPerWeek: 3, color: 'from-green-500 to-emerald-500' },
  { id: 'p4', name: 'Recovery: Post-Surgery', nameRu: 'Восстановление: После операции', weeks: 12, workoutsPerWeek: 3, color: 'from-purple-500 to-violet-500' },
]

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const weekDaysRu = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function AssignProgramPage() {
  const { locale } = useTranslation()
  const ru = locale === 'ru'
  
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('')
  const [schedule, setSchedule] = useState<boolean[]>([true, false, true, false, true, false, false])
  const [notes, setNotes] = useState('')
  const [adaptations, setAdaptations] = useState('')

  const client = mockClients.find(c => c.id === selectedClient)
  const program = mockPrograms.find(p => p.id === selectedProgram)
  const days = ru ? weekDaysRu : weekDays
  const activeDays = schedule.filter(Boolean).length

  const handleAssign = () => {
    toast.success(ru ? `Программа назначена для ${client?.name}!` : `Program assigned to ${client?.name}!`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/programs"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{ru ? 'Назначить программу' : 'Assign Program'}</h1>
          <p className="text-zinc-500 mt-1">{ru ? 'Привяжите программу к клиенту с расписанием' : 'Link a program to a client with schedule'}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left — select client + program */}
        <div className="space-y-6">
          {/* Client selection */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">{ru ? '1. Выберите клиента' : '1. Select client'}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {mockClients.map(c => (
                <button key={c.id} onClick={() => setSelectedClient(c.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${selectedClient === c.id ? 'bg-teal-50 border-2 border-teal-500' : 'border border-zinc-200 hover:border-zinc-300'}`}>
                  <Avatar fallback={c.initials} size="sm" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-zinc-400">{c.goal} • {c.plan}</p>
                  </div>
                  {c.currentProgram && <Badge variant="outline" className="text-[10px]">{c.currentProgram}</Badge>}
                  {selectedClient === c.id && <Check className="w-5 h-5 text-teal-500" />}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Program selection */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">{ru ? '2. Выберите программу' : '2. Select program'}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {mockPrograms.map(p => (
                <button key={p.id} onClick={() => setSelectedProgram(p.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${selectedProgram === p.id ? 'bg-teal-50 border-2 border-teal-500' : 'border border-zinc-200 hover:border-zinc-300'}`}>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center`}>
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{ru ? p.nameRu : p.name}</p>
                    <p className="text-xs text-zinc-400">{p.weeks} {ru ? 'недель' : 'weeks'} • {p.workoutsPerWeek}x/{ru ? 'нед' : 'wk'}</p>
                  </div>
                  {selectedProgram === p.id && <Check className="w-5 h-5 text-teal-500" />}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right — schedule + settings */}
        <div className="space-y-6">
          {/* Schedule */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">{ru ? '3. Расписание' : '3. Schedule'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label={ru ? 'Дата старта' : 'Start date'} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-3 block">{ru ? 'Тренировочные дни' : 'Training days'} ({activeDays}/7)</label>
                <div className="flex gap-2">
                  {days.map((d, i) => (
                    <button key={d} onClick={() => { const s = [...schedule]; s[i] = !s[i]; setSchedule(s) }}
                      className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${schedule[i] ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-zinc-200 text-zinc-400'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {program && startDate && (
                <div className="p-4 bg-zinc-50 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">{ru ? 'Окончание' : 'End date'}</span>
                    <span className="font-medium">{new Date(new Date(startDate).getTime() + program.weeks * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">{ru ? 'Всего тренировок' : 'Total workouts'}</span>
                    <span className="font-medium">{program.weeks * activeDays}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">{ru ? 'Длительность' : 'Duration'}</span>
                    <span className="font-medium">{program.weeks} {ru ? 'недель' : 'weeks'}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Adaptations */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">{ru ? '4. Адаптации' : '4. Adaptations'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1.5 block">{ru ? 'Индивидуальные адаптации' : 'Individual adaptations'}</label>
                <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm" rows={3} value={adaptations} onChange={e => setAdaptations(e.target.value)}
                  placeholder={ru ? 'Исключить определённые упражнения, уменьшить нагрузку...' : 'Exclude specific exercises, reduce intensity...'} />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1.5 block">{ru ? 'Заметки' : 'Notes'}</label>
                <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              {client?.currentProgram && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">{ru ? 'У клиента уже есть программа' : 'Client already has a program'}</p>
                    <p className="text-xs text-amber-600">{client.currentProgram} — {ru ? 'будет заменена' : 'will be replaced'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="gradient" className="w-full" size="lg" onClick={handleAssign}
            disabled={!selectedClient || !selectedProgram || !startDate}>
            <Save className="w-4 h-4 mr-2" />{ru ? 'Назначить программу' : 'Assign Program'}
          </Button>
        </div>
      </div>
    </div>
  )
}
