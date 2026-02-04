'use client'
import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { Play, BookOpen, Clock, CheckCircle2, ArrowRight, Trophy, Target } from 'lucide-react'

const userCourses = [
  { id: 'breast-augmentation-recovery', title: 'Breast Augmentation Recovery', titleRu: 'Восстановление после увеличения груди', progress: 45, totalLessons: 18, completedLessons: 8, nextLesson: { id: 9, title: 'Back strengthening exercises', titleRu: 'Упражнения для укрепления спины', duration: '15 min' } },
]
const recentActivity = [
  { id: 1, title: 'Lesson 8: Breathing exercises', titleRu: 'Урок 8: Дыхательные упражнения', date: 'Yesterday', dateRu: 'Вчера', status: 'completed' },
  { id: 2, title: 'Lesson 7: Gentle stretching', titleRu: 'Урок 7: Мягкая растяжка', date: '2 days ago', dateRu: '2 дня назад', status: 'completed' },
]

export default function ClientHomePage() {
  const { t, locale } = useTranslation()
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{t('client.home.welcome')} 👋</h1>
          <p className="text-zinc-600 mt-1">{t('client.home.subtitle')}</p>
        </div>
        <Link href="/client/courses"><Button variant="outline">{t('client.home.allCourses')}<ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, value: '1', label: t('client.home.stats.activeCourses'), color: 'bg-teal-500/10 text-teal-500' },
          { icon: CheckCircle2, value: '8', label: t('client.home.stats.lessonsCompleted'), color: 'bg-green-500/10 text-green-500' },
          { icon: Clock, value: '2.5h', label: t('client.home.stats.learningTime'), color: 'bg-orange-500/10 text-orange-500' },
          { icon: Trophy, value: '45%', label: t('client.home.stats.overallProgress'), color: 'bg-purple-500/10 text-purple-500' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}><CardContent className="p-4"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}><Icon className="w-5 h-5" /></div><div><p className="text-2xl font-bold text-zinc-900">{stat.value}</p><p className="text-xs text-zinc-500">{stat.label}</p></div></div></CardContent></Card>
          )
        })}
      </div>

      {userCourses.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">{t('client.home.continueLearning')}</h2>
          {userCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              <div className="grid md:grid-cols-[300px,1fr] gap-6">
                <div className="relative h-48 md:h-full bg-gradient-to-br from-teal-500/20 to-teal-600/10">
                  <div className="absolute inset-0 flex items-center justify-center"><Target className="w-16 h-16 text-teal-500/50" /></div>
                  <Badge className="absolute top-4 left-4 bg-white/90 text-zinc-900">{course.progress}% {t('client.home.progress')}</Badge>
                </div>
                <div className="p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">{locale === 'ru' ? course.titleRu : course.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4"><span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{course.completedLessons} {t('client.home.lessonsOf')} {course.totalLessons} {t('client.home.lessons')}</span></div>
                    <div className="mb-4"><div className="h-2 bg-zinc-200 rounded-full overflow-hidden"><div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${course.progress}%` }} /></div></div>
                    <div className="p-4 bg-zinc-50 rounded-xl">
                      <p className="text-xs text-zinc-500 mb-1">{t('client.home.nextLesson')}</p>
                      <div className="flex items-center justify-between">
                        <div><p className="font-medium text-zinc-900">{locale === 'ru' ? course.nextLesson.titleRu : course.nextLesson.title}</p><p className="text-sm text-zinc-500">{course.nextLesson.duration}</p></div>
                        <Link href={`/client/courses/${course.id}/${course.nextLesson.id}`}><Button variant="gradient" size="sm"><Play className="w-4 h-4 mr-2" />{t('client.home.watch')}</Button></Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">{t('client.home.recentActivity')}</h2>
        <Card><CardContent className="p-0">
          <div className="divide-y divide-zinc-200">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500/10"><CheckCircle2 className="w-4 h-4 text-green-500" /></div>
                  <div><p className="font-medium text-zinc-900 text-sm">{locale === 'ru' ? activity.titleRu : activity.title}</p><p className="text-xs text-zinc-500">{locale === 'ru' ? activity.dateRu : activity.date}</p></div>
                </div>
                <Badge variant="success" className="text-xs">{t('client.home.completed')}</Badge>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </section>
    </div>
  )
}
