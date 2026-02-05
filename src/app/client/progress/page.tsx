'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { BookOpen, Clock, Trophy, ShoppingBag, Heart, Baby, Calendar, ArrowRight, Loader2, CheckCircle2, Play, BarChart3 } from 'lucide-react'

const coursesMeta: Record<string, { icon: any; color: string }> = {
  'breast-augmentation-recovery': { icon: Heart, color: 'from-pink-500 to-rose-500' },
  'cesarean-recovery': { icon: Baby, color: 'from-purple-500 to-violet-500' },
}

type CourseProgress = {
  course_slug: string
  course_title: string
  course_title_ru: string
  granted_at: string
  is_active: boolean
  total_lessons: number
  completed_lessons: number
  progress_percent: number
}

export default function ProgressPage() {
  const { t, locale } = useTranslation()
  const { user } = useAuth()
  const [courses, setCourses] = useState<CourseProgress[]>([])
  const [orders, setOrders] = useState<{ course_slug: string; amount: number; status: string; paid_at: string | null }[]>([])
  const [loading, setLoading] = useState(true)

  const ru = locale === 'ru'

  useEffect(() => {
    if (!user) return

    const load = async () => {
      try {
        // Load courses with progress
        const progressRes = await fetch('/api/progress')
        if (progressRes.ok) {
          const progressData = await progressRes.json()
          setCourses(progressData.courses || [])
        }

        // Load orders
        const supabase = createClient()
        const { data: ordersData } = await supabase
          .from('orders')
          .select('course_slug, amount, status, paid_at')
          .eq('user_id', user.id)
          .eq('status', 'paid')

        setOrders((ordersData || []) as { course_slug: string; amount: number; status: string; paid_at: string | null }[])
      } catch (err) {
        console.error('Failed to load progress:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  const totalSpent = orders.reduce((s, o) => s + o.amount, 0)
  const totalLessons = courses.reduce((s, c) => s + c.total_lessons, 0)
  const completedLessons = courses.reduce((s, c) => s + c.completed_lessons, 0)
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  // Calculate member since
  const memberSince = courses.length > 0
    ? new Date(courses.reduce((min, c) => c.granted_at < min ? c.granted_at : min, courses[0].granted_at))
        .toLocaleDateString(ru ? 'ru-RU' : 'en-US', { month: 'long', year: 'numeric' })
    : '—'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  const stats = [
    { icon: BookOpen, value: String(courses.length), label: ru ? 'Курсов' : 'Courses', color: 'bg-teal-500/10 text-teal-500' },
    { icon: BarChart3, value: `${overallProgress}%`, label: ru ? 'Прогресс' : 'Progress', color: 'bg-blue-500/10 text-blue-500' },
    { icon: Trophy, value: String(completedLessons), label: ru ? 'Уроков пройдено' : 'Lessons Done', color: 'bg-orange-500/10 text-orange-500' },
    { icon: Calendar, value: memberSince, label: ru ? 'Участник с' : 'Member since', color: 'bg-purple-500/10 text-purple-500' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">{t('client.progress.title')}</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">{t('client.progress.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="p-6 text-center">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stat.value}</div>
                <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Course list */}
      {courses.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{ru ? 'Мои курсы' : 'My Courses'}</h2>
          <div className="space-y-4">
            {courses.map((course) => {
              const meta = coursesMeta[course.course_slug] || { icon: BookOpen, color: 'from-teal-500 to-emerald-500' }
              const Icon = meta.icon
              const purchaseDate = new Date(course.granted_at).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })

              return (
                <Card key={course.course_slug} className="card-hover overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Course info */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-7 h-7 text-white/80" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                                {ru ? course.course_title_ru : course.course_title}
                              </h3>
                              {course.progress_percent === 100 && (
                                <Badge variant="success" className="flex-shrink-0">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  {ru ? 'Завершён' : 'Complete'}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 mt-1">
                              <span>{course.total_lessons} {ru ? 'уроков' : 'lessons'}</span>
                              <span>•</span>
                              <span>{ru ? 'Куплен' : 'Purchased'}: {purchaseDate}</span>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="mt-4">
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-zinc-500">{ru ? 'Прогресс' : 'Progress'}</span>
                                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                  {course.completed_lessons}/{course.total_lessons} ({course.progress_percent}%)
                                </span>
                              </div>
                              <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    course.progress_percent === 100 
                                      ? 'bg-green-500' 
                                      : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                                  }`}
                                  style={{ width: `${course.progress_percent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action */}
                      <div className="flex sm:flex-col items-center justify-end gap-2 p-4 sm:p-6 border-t sm:border-t-0 sm:border-l border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                        <Link href={`/client/courses/${course.course_slug}`}>
                          <Button variant={course.progress_percent < 100 ? 'gradient' : 'outline'} size="sm">
                            {course.progress_percent === 0 ? (
                              <>
                                <Play className="w-4 h-4 mr-1" />
                                {ru ? 'Начать' : 'Start'}
                              </>
                            ) : course.progress_percent < 100 ? (
                              <>
                                <Play className="w-4 h-4 mr-1" />
                                {ru ? 'Продолжить' : 'Continue'}
                              </>
                            ) : (
                              <>
                                {ru ? 'Открыть' : 'Open'}
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </>
                            )}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      ) : (
        <Card className="p-12 text-center">
          <Trophy className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            {ru ? 'Прогресс появится здесь' : 'Progress will appear here'}
          </h3>
          <p className="text-zinc-500 mb-6">
            {ru ? 'Купите курс, чтобы начать отслеживать прогресс' : 'Purchase a course to start tracking your progress'}
          </p>
          <Link href="/#courses">
            <Button variant="gradient">{ru ? 'Посмотреть курсы' : 'Browse Courses'}</Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
