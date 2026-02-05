'use client'
import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { BookOpen, Clock, Heart, Baby, ArrowRight, CheckCircle2, ShoppingBag, Loader2, Play } from 'lucide-react'
import { toast } from 'sonner'

const allCoursesStatic = [
  { id: 'breast-augmentation-recovery', title: 'Breast Augmentation Recovery', titleRu: 'Восстановление после увеличения груди', icon: Heart, color: 'from-pink-500 to-rose-500', lessons: 18, weeks: 6, price: 99 },
  { id: 'cesarean-recovery', title: 'C-Section Recovery', titleRu: 'Восстановление после кесарева сечения', icon: Baby, color: 'from-purple-500 to-violet-500', lessons: 24, weeks: 8, price: 99 },
]

const coursesMeta: Record<string, { icon: any; color: string }> = {
  'breast-augmentation-recovery': { icon: Heart, color: 'from-pink-500 to-rose-500' },
  'cesarean-recovery': { icon: Baby, color: 'from-purple-500 to-violet-500' },
}

type CourseProgress = {
  course_slug: string
  course_title: string
  course_title_ru: string
  total_lessons: number
  completed_lessons: number
  progress_percent: number
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>}>
      <CoursesContent />
    </Suspense>
  )
}

function CoursesContent() {
  const { t, locale } = useTranslation()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [purchasedCourses, setPurchasedCourses] = useState<CourseProgress[]>([])
  const [loading, setLoading] = useState(true)

  const ru = locale === 'ru'

  useEffect(() => {
    // Show success toast if redirected from Stripe
    const payment = searchParams.get('payment')
    const course = searchParams.get('course')
    if (payment === 'success' && course) {
      toast.success(ru ? `Курс успешно оплачен!` : `Course purchased successfully!`)
    }
  }, [searchParams, ru])

  useEffect(() => {
    if (!user) return

    const load = async () => {
      try {
        const res = await fetch('/api/progress')
        if (res.ok) {
          const data = await res.json()
          setPurchasedCourses(data.courses || [])
        }
      } catch (err) {
        console.error('Failed to load courses:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  const purchasedSlugs = purchasedCourses.map(c => c.course_slug)
  const available = allCoursesStatic.filter(c => !purchasedSlugs.includes(c.id))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">{t('client.courses.title')}</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">{t('client.courses.subtitle')}</p>
      </div>

      {/* Purchased */}
      {purchasedCourses.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{ru ? 'Мои курсы' : 'My Courses'}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {purchasedCourses.map((course) => {
              const meta = coursesMeta[course.course_slug] || { icon: BookOpen, color: 'from-teal-500 to-emerald-500' }
              const Icon = meta.icon
              return (
                <Card key={course.course_slug} className="overflow-hidden card-hover">
                  <div className={`h-40 bg-gradient-to-br ${meta.color} flex items-center justify-center relative`}>
                    <Icon className="w-16 h-16 text-white/50" />
                    {course.progress_percent === 100 ? (
                      <Badge className="absolute top-4 left-4 bg-white/90 text-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />{ru ? 'Завершён' : 'Complete'}
                      </Badge>
                    ) : (
                      <Badge className="absolute top-4 left-4 bg-white/90 text-teal-600">
                        <BookOpen className="w-3 h-3 mr-1" />{course.progress_percent}% {ru ? 'пройдено' : 'complete'}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                      {ru ? course.course_title_ru : course.course_title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {course.completed_lessons}/{course.total_lessons} {ru ? 'уроков' : 'lessons'}
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    {course.total_lessons > 0 ? (
                      <div className="mb-4">
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
                    ) : (
                      <div className="mb-4 text-sm text-amber-600 dark:text-amber-400">
                        {ru ? '⏳ Контент готовится...' : '⏳ Content coming soon...'}
                      </div>
                    )}
                    
                    <Link href={`/client/courses/${course.course_slug}`}>
                      <Button variant="gradient" className="w-full">
                        {course.total_lessons === 0 ? (
                          <>
                            {ru ? 'Подробнее' : 'View Details'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        ) : course.progress_percent === 0 ? (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            {ru ? 'Начать курс' : 'Start Course'}
                          </>
                        ) : course.progress_percent < 100 ? (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            {ru ? 'Продолжить' : 'Continue'}
                          </>
                        ) : (
                          <>
                            {ru ? 'Открыть курс' : 'Open Course'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* No courses */}
      {purchasedCourses.length === 0 && (
        <Card className="p-12 text-center">
          <ShoppingBag className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{ru ? 'У вас пока нет курсов' : 'No courses yet'}</h3>
          <p className="text-zinc-500 mb-6">{ru ? 'Выберите курс ниже и начните восстановление' : 'Choose a course below to start your recovery'}</p>
        </Card>
      )}

      {/* Available */}
      {available.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{ru ? 'Доступные курсы' : 'Available Courses'}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {available.map((course) => {
              const Icon = course.icon
              return (
                <Card key={course.id} className="overflow-hidden card-hover">
                  <div className={`h-40 bg-gradient-to-br ${course.color} flex items-center justify-center`}>
                    <Icon className="w-16 h-16 text-white/50" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{ru ? course.titleRu : course.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
                      <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{course.lessons} {ru ? 'уроков' : 'lessons'}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{course.weeks} {ru ? 'недель' : 'weeks'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">${course.price}</span>
                      <Link href={`/courses/${course.id}`}>
                        <Button variant="gradient">
                          {ru ? 'Купить' : 'Buy Now'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
