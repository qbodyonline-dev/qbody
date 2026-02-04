'use client'
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { BookOpen, Clock, Trophy, TrendingUp, Calendar } from 'lucide-react'

export default function ProgressPage() {
  const { t } = useTranslation()

  const stats = [
    { icon: BookOpen, value: '8', label: t('client.progress.totalLessons'), color: 'bg-teal-500/10 text-teal-500' },
    { icon: Clock, value: '2.5', label: t('client.progress.totalTime'), unit: t('client.progress.hours'), color: 'bg-blue-500/10 text-blue-500' },
    { icon: Trophy, value: '7', label: t('client.progress.streak'), unit: t('client.progress.days'), color: 'bg-orange-500/10 text-orange-500' },
    { icon: TrendingUp, value: '1', label: t('client.progress.coursesStarted'), color: 'bg-purple-500/10 text-purple-500' },
  ]

  const weeklyData = [
    { day: 'Mon', lessons: 2 },
    { day: 'Tue', lessons: 1 },
    { day: 'Wed', lessons: 0 },
    { day: 'Thu', lessons: 2 },
    { day: 'Fri', lessons: 1 },
    { day: 'Sat', lessons: 1 },
    { day: 'Sun', lessons: 1 },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{t('client.progress.title')}</h1>
        <p className="text-zinc-600 mt-1">{t('client.progress.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="p-6 text-center">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold text-zinc-900">{stat.value}{stat.unit && <span className="text-lg text-zinc-500 ml-1">{stat.unit}</span>}</div>
                <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-6">{t('client.progress.weeklyActivity')}</h2>
          <div className="flex items-end justify-between gap-2 h-40">
            {weeklyData.map((day) => (
              <div key={day.day} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-zinc-100 rounded-t-lg relative" style={{ height: '120px' }}>
                  <div 
                    className="absolute bottom-0 w-full bg-teal-500 rounded-t-lg transition-all"
                    style={{ height: `${(day.lessons / 3) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-500 mt-2">{day.day}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-zinc-500 text-center mt-4">{t('client.progress.lessonsPerWeek')}</p>
        </CardContent>
      </Card>
    </div>
  )
}
