'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useTranslation } from '@/lib/i18n'
import { 
  ChevronLeft, ChevronRight, Plus, Clock, Users, ClipboardCheck, 
  CreditCard, Dumbbell, Calendar as CalendarIcon
} from 'lucide-react'

type CalendarEvent = {
  id: string
  time: string
  title: string
  titleRu: string
  client: string
  initials: string
  type: 'session' | 'checkin' | 'subscription' | 'workout' | 'reminder'
  color: string
}

// Generate week data dynamically
function getWeekDates(offset: number = 0): Date[] {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const eventsByDay: Record<number, CalendarEvent[]> = {
  0: [ // Monday
    { id: 'm1', time: '09:00', title: 'Session — Anna K.', titleRu: 'Сессия — Анна К.', client: 'Anna K.', initials: 'AK', type: 'session', color: 'bg-teal-500' },
    { id: 'm2', time: '11:00', title: 'Session — Olga V.', titleRu: 'Сессия — Ольга В.', client: 'Olga V.', initials: 'OV', type: 'session', color: 'bg-teal-500' },
    { id: 'm3', time: '17:00', title: 'Session — Elena P.', titleRu: 'Сессия — Елена П.', client: 'Elena P.', initials: 'EP', type: 'session', color: 'bg-teal-500' },
  ],
  1: [ // Tuesday
    { id: 't1', time: '10:00', title: 'Check-in due — Maria S.', titleRu: 'Дедлайн чек-ина — Мария С.', client: 'Maria S.', initials: 'MS', type: 'checkin', color: 'bg-orange-500' },
    { id: 't2', time: '14:00', title: 'Session — Svetlana M.', titleRu: 'Сессия — Светлана М.', client: 'Svetlana M.', initials: 'SM', type: 'session', color: 'bg-teal-500' },
  ],
  2: [ // Wednesday
    { id: 'w1', time: '09:00', title: 'Session — Anna K.', titleRu: 'Сессия — Анна К.', client: 'Anna K.', initials: 'AK', type: 'session', color: 'bg-teal-500' },
    { id: 'w2', time: '12:00', title: 'Session — Irina K.', titleRu: 'Сессия — Ирина К.', client: 'Irina K.', initials: 'IK', type: 'session', color: 'bg-teal-500' },
    { id: 'w3', time: '15:00', title: 'Workout review', titleRu: 'Проверка тренировки', client: 'Olga V.', initials: 'OV', type: 'workout', color: 'bg-purple-500' },
  ],
  3: [ // Thursday
    { id: 'th1', time: '09:00', title: 'Session — Elena P.', titleRu: 'Сессия — Елена П.', client: 'Elena P.', initials: 'EP', type: 'session', color: 'bg-teal-500' },
    { id: 'th2', time: '16:00', title: 'Subscription renewal — Elena P.', titleRu: 'Продление подписки — Елена П.', client: 'Elena P.', initials: 'EP', type: 'subscription', color: 'bg-green-500' },
  ],
  4: [ // Friday
    { id: 'f1', time: '10:00', title: 'Check-in due — Anna K.', titleRu: 'Дедлайн чек-ина — Анна К.', client: 'Anna K.', initials: 'AK', type: 'checkin', color: 'bg-orange-500' },
    { id: 'f2', time: '10:00', title: 'Check-in due — Olga V.', titleRu: 'Дедлайн чек-ина — Ольга В.', client: 'Olga V.', initials: 'OV', type: 'checkin', color: 'bg-orange-500' },
    { id: 'f3', time: '14:00', title: 'Session — Maria S.', titleRu: 'Сессия — Мария С.', client: 'Maria S.', initials: 'MS', type: 'session', color: 'bg-teal-500' },
  ],
  5: [], // Saturday
  6: [], // Sunday
}

const typeIcons: Record<string, any> = {
  session: Users,
  checkin: ClipboardCheck,
  subscription: CreditCard,
  workout: Dumbbell,
  reminder: CalendarIcon,
}

export default function CalendarPage() {
  const { t, locale } = useTranslation()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const weekDates = getWeekDates(weekOffset)
  const today = new Date()
  const isToday = (d: Date) => d.toDateString() === today.toDateString()

  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

  const formatMonth = (d: Date) => d.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { month: 'long', year: 'numeric' })
  const formatDay = (d: Date) => d.getDate()

  // Show events for selected day or today
  const activeDayIndex = selectedDay !== null ? selectedDay : weekDates.findIndex(isToday)
  const activeEvents = eventsByDay[activeDayIndex >= 0 ? activeDayIndex : 0] || []
  const activeDateStr = weekDates[activeDayIndex >= 0 ? activeDayIndex : 0]?.toLocaleDateString(
    locale === 'ru' ? 'ru-RU' : 'en-US', 
    { weekday: 'long', day: 'numeric', month: 'long' }
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{t('calendar.title')}</h1>
          <p className="text-zinc-500 mt-1">{t('calendar.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>{t('calendar.today')}</Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset(weekOffset - 1)}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset(weekOffset + 1)}><ChevronRight className="w-4 h-4" /></Button>
          <span className="px-4 py-2 text-sm font-medium text-zinc-700 capitalize">{formatMonth(weekDates[3])}</span>
        </div>
      </div>

      {/* Week grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-zinc-200">
            {weekDates.map((date, i) => {
              const dayEvents = eventsByDay[i] || []
              const active = i === (selectedDay !== null ? selectedDay : weekDates.findIndex(isToday))
              return (
                <button key={i} onClick={() => setSelectedDay(i)}
                  className={`p-4 text-center border-r border-zinc-100 last:border-r-0 transition-all hover:bg-zinc-50 ${active ? 'bg-teal-50' : ''}`}>
                  <p className="text-xs font-medium text-zinc-500 uppercase mb-1">{t(`calendar.days.${dayKeys[i]}`)}</p>
                  <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center text-lg font-bold mb-2 ${
                    isToday(date) ? 'bg-teal-500 text-white' : active ? 'bg-teal-100 text-teal-700' : 'text-zinc-900'
                  }`}>
                    {formatDay(date)}
                  </div>
                  {/* Event dots */}
                  <div className="flex items-center justify-center gap-1 h-3">
                    {dayEvents.slice(0, 4).map((ev) => (
                      <div key={ev.id} className={`w-2 h-2 rounded-full ${ev.color}`} />
                    ))}
                    {dayEvents.length > 4 && <span className="text-xs text-zinc-400">+{dayEvents.length - 4}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day detail */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="capitalize">{activeDateStr}</CardTitle>
                <p className="text-sm text-zinc-500 mt-1">{activeEvents.length} {locale === 'ru' ? 'событий' : 'events'}</p>
              </div>
              <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" />{t('calendar.addEvent')}</Button>
            </CardHeader>
            <CardContent>
              {activeEvents.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                  <p className="text-zinc-500">{t('calendar.noEvents')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeEvents.map((event) => {
                    const Icon = typeIcons[event.type]
                    return (
                      <div key={event.id} className="flex items-center gap-4 p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors group">
                        {/* Time */}
                        <div className="w-14 text-center flex-shrink-0">
                          <span className="text-lg font-bold text-zinc-900">{event.time}</span>
                        </div>
                        {/* Color bar */}
                        <div className={`w-1 h-12 rounded-full ${event.color}`} />
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-zinc-900">{locale === 'ru' ? event.titleRu : event.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              <Icon className="w-3 h-3 mr-1" />
                              {t(`calendar.eventTypes.${event.type}`)}
                            </Badge>
                          </div>
                        </div>
                        {/* Avatar */}
                        <Avatar fallback={event.initials} size="sm" />
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Week summary */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">{locale === 'ru' ? 'Итого за неделю' : 'Week Summary'}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { icon: Users, label: locale === 'ru' ? 'Сессий' : 'Sessions', count: Object.values(eventsByDay).flat().filter(e => e.type === 'session').length, color: 'text-teal-500 bg-teal-50' },
                { icon: ClipboardCheck, label: locale === 'ru' ? 'Дедлайнов чек-инов' : 'Check-in deadlines', count: Object.values(eventsByDay).flat().filter(e => e.type === 'checkin').length, color: 'text-orange-500 bg-orange-50' },
                { icon: CreditCard, label: locale === 'ru' ? 'Продлений' : 'Renewals', count: Object.values(eventsByDay).flat().filter(e => e.type === 'subscription').length, color: 'text-green-500 bg-green-50' },
                { icon: Dumbbell, label: locale === 'ru' ? 'Тренировок' : 'Workouts', count: Object.values(eventsByDay).flat().filter(e => e.type === 'workout').length, color: 'text-purple-500 bg-purple-50' },
              ].map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}><Icon className="w-5 h-5" /></div>
                    <div className="flex-1"><p className="text-sm text-zinc-600">{stat.label}</p></div>
                    <span className="text-xl font-bold text-zinc-900">{stat.count}</span>
                  </div>
                )
              })}
            </div>

            {/* Client load per day mini bar chart */}
            <div className="mt-6 pt-6 border-t border-zinc-100">
              <p className="text-sm font-medium text-zinc-700 mb-3">{locale === 'ru' ? 'Нагрузка по дням' : 'Daily load'}</p>
              <div className="flex items-end gap-2 h-20">
                {weekDates.map((_, i) => {
                  const count = (eventsByDay[i] || []).length
                  const maxCount = Math.max(...Object.values(eventsByDay).map(e => e.length), 1)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-zinc-400">{count || ''}</span>
                      <div className="w-full bg-zinc-100 rounded-t-md" style={{ height: '48px', position: 'relative' }}>
                        <div 
                          className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-all ${isToday(weekDates[i]) ? 'bg-teal-500' : 'bg-teal-300'}`}
                          style={{ height: `${count > 0 ? (count / maxCount) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500">{t(`calendar.days.${dayKeys[i]}`)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
