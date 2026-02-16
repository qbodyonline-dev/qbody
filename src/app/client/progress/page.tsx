'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { fetchWithAuth } from '@/lib/api'
import {
  BookOpen, Trophy, Heart, Baby,
  Loader2, CheckCircle2, Play, BarChart3, Dumbbell, Scale,
  TrendingUp, TrendingDown
} from 'lucide-react'

const coursesMeta: Record<string, { icon: any; color: string }> = {
  'breast-augmentation-recovery': { icon: Heart, color: 'from-pink-500 to-rose-500' },
  'cesarean-recovery': { icon: Baby, color: 'from-purple-500 to-violet-500' },
}

type CourseProgress = {
  course_slug: string; course_title: string; course_title_secondary: string
  granted_at: string; is_active: boolean
  total_lessons: number; completed_lessons: number; progress_percent: number
}

type CheckinEntry = {
  checkin_date: string; weight: number | null; weight_change: number | null
}

export default function ProgressPage() {
  const { t, locale, langConfig } = useTranslation()
  const { user } = useAuth()
  const ru = locale === langConfig.secondaryLanguage

  const [courses, setCourses] = useState<CourseProgress[]>([])
  const [program, setProgram] = useState<any>(null)
  const [checkins, setCheckins] = useState<CheckinEntry[]>([])
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      try {
        // Courses
        const progressRes = await fetchWithAuth('/api/progress')
        if (progressRes.ok) {
          const pd = await progressRes.json()
          setCourses(pd.courses || [])
        }

        // Training
        const trainingRes = await fetchWithAuth('/api/client/training')
        if (trainingRes.ok) {
          const td = await trainingRes.json()
          if (td.program) setProgram(td.program)
          setRecentLogs(td.recent_logs || [])
        }

        // Checkins
        const checkinRes = await fetchWithAuth('/api/checkins')
        if (checkinRes.ok) {
          const cd = await checkinRes.json()
          setCheckins(cd.checkins || cd || [])
        }
      } catch (err) {
        console.error('Failed to load progress:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const completedLessons = courses.reduce((s, c) => s + c.completed_lessons, 0)
  const totalLessons = courses.reduce((s, c) => s + c.total_lessons, 0)
  const overallCourseProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  const completedWorkouts = recentLogs.filter((l: any) => l.status === 'completed').length
  const programProgress = program ? Math.round((program.current_week / program.duration_weeks) * 100) : 0

  // Weight trend
  const weights = checkins.filter(c => c.weight).map(c => ({ date: c.checkin_date, weight: c.weight! })).reverse()
  const firstWeight = weights.length > 0 ? weights[0].weight : null
  const lastWeight = weights.length > 0 ? weights[weights.length - 1].weight : null
  const weightDiff = firstWeight && lastWeight ? lastWeight - firstWeight : null

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t('client.progress.title')}</h1>
        <p className="text-zinc-500 mt-1">{t('client.progress.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Dumbbell, value: completedWorkouts > 0 ? String(completedWorkouts) : '—', label: ru ? 'Тренировок' : 'Workouts', color: 'bg-teal-500/10 text-teal-500' },
          { icon: Scale, value: checkins.length > 0 ? String(checkins.length) : '—', label: ru ? 'Чекинов' : 'Check-ins', color: 'bg-blue-500/10 text-blue-500' },
          { icon: BarChart3, value: `${overallCourseProgress}%`, label: ru ? 'Прогресс курсов' : 'Course Progress', color: 'bg-orange-500/10 text-orange-500' },
          { icon: Trophy, value: completedLessons > 0 ? String(completedLessons) : '—', label: ru ? 'Уроков' : 'Lessons Done', color: 'bg-purple-500/10 text-purple-500' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}><CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0`}><Icon className="w-5 h-5" /></div>
                <div>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{stat.value}</p>
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                </div>
              </div>
            </CardContent></Card>
          )
        })}
      </div>

      {/* Program progress */}
      {program && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">{ru ? 'Программа' : 'Program'}</p>
                <h3 className="text-lg font-bold">{ru ? program.name_secondary || program.name : program.name}</h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{ru ? 'Нед.' : 'Wk'} {program.current_week}</p>
                <p className="text-xs text-white/70">{ru ? 'из' : 'of'} {program.duration_weeks}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${programProgress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>{new Date(program.start_date).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                <span>{programProgress}%</span>
                <span>{new Date(program.end_date).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Weight trend */}
      {weights.length >= 2 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-500" />{ru ? 'Динамика веса' : 'Weight Trend'}
              </h3>
              {weightDiff !== null && (
                <Badge variant={weightDiff < 0 ? 'success' : weightDiff > 0 ? 'destructive' : 'secondary'}>
                  {weightDiff > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg
                </Badge>
              )}
            </div>
            {/* Simple visual weight chart */}
            <div className="flex items-end gap-1 h-24">
              {weights.slice(-14).map((w, i) => {
                const min = Math.min(...weights.slice(-14).map(x => x.weight))
                const max = Math.max(...weights.slice(-14).map(x => x.weight))
                const range = max - min || 1
                const height = ((w.weight - min) / range) * 80 + 20
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-gradient-to-t from-blue-400 to-blue-300 dark:from-blue-600 dark:to-blue-500 transition-all"
                      style={{ height: `${height}%` }}
                      title={`${w.date}: ${w.weight} kg`} />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              <span>{weights.slice(-14)[0]?.weight} kg</span>
              <span>{weights.slice(-14).at(-1)?.weight} kg</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course progress */}
      {courses.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{t('client.courses.title')}</h2>
          <div className="space-y-3">
            {courses.map((course) => {
              const meta = coursesMeta[course.course_slug] || { icon: BookOpen, color: 'from-teal-500 to-emerald-500' }
              const Icon = meta.icon

              return (
                <Card key={course.course_slug} className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white/80" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {ru ? course.course_title_secondary : course.course_title}
                          </h3>
                          {course.progress_percent === 100 && (
                            <Badge variant="success" className="flex-shrink-0 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-0.5" />{ru ? 'Готово' : 'Done'}</Badge>
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-zinc-500 mb-1">
                            <span>{course.completed_lessons}/{course.total_lessons}</span>
                            <span>{course.progress_percent}%</span>
                          </div>
                          <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${course.progress_percent === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-teal-400 to-teal-600'}`}
                              style={{ width: `${course.progress_percent}%` }} />
                          </div>
                        </div>
                      </div>
                      <Link href={`/client/courses/${course.course_slug}`} className="flex-shrink-0">
                        <Button variant="ghost" size="sm"><Play className="w-4 h-4" /></Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!program && courses.length === 0 && checkins.length === 0 && (
        <Card className="p-12 text-center">
          <Trophy className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-600 dark:text-zinc-400 mb-2">{t('client.progress.noProgress')}</h3>
          <p className="text-zinc-400 mb-6">{t('client.progress.purchaseToContinue')}</p>
          <Link href="/#courses"><Button variant="gradient">{t('client.courses.browseCourses')}</Button></Link>
        </Card>
      )}
    </div>
  )
}
