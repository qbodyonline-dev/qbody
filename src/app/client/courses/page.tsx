'use client'
import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { fetchWithAuth } from '@/lib/api'
import { BookOpen, Clock, Heart, Baby, ArrowRight, CheckCircle2, ShoppingBag, Loader2, Play } from 'lucide-react'
import { toast } from 'sonner'

// Icon/colour map for known courses — fallback to BookOpen/teal for new ones
const coursesMeta: Record<string, { icon: any; color: string }> = {
  'breast-augmentation-recovery': { icon: Heart, color: 'from-pink-500 to-rose-500' },
  'cesarean-recovery': { icon: Baby, color: 'from-purple-500 to-violet-500' },
}

function getCourseMeta(slug: string) {
  return coursesMeta[slug] || { icon: BookOpen, color: 'from-teal-500 to-emerald-500' }
}

// ✅ FIX: Available courses now come from the API, not a hardcoded static array
type PublicCourse = {
  id: string
  slug: string
  title: string
  title_secondary: string | null
  description: string | null
  price: number
  original_price: number | null
  duration_weeks: number
  lessons_count: number
}

type CourseProgress = {
  course_slug: string
  course_title: string
  course_title_secondary: string
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
  const { t, locale, langConfig } = useTranslation()
  const { user } = useAuth()
  const ru = locale === langConfig.secondaryLanguage
  const searchParams = useSearchParams()

  const [purchasedCourses, setPurchasedCourses] = useState<CourseProgress[]>([])
  const [allPublishedCourses, setAllPublishedCourses] = useState<PublicCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (searchParams.get('payment') === 'success' && searchParams.get('course')) {
      toast.success(t('client.courses.purchaseSuccess'))
    }
  }, [searchParams, t])

  useEffect(() => {
    if (!user) return

    const load = async () => {
      try {
        // Load purchased progress + all published courses in parallel
        const [progressRes, coursesRes] = await Promise.all([
          fetchWithAuth('/api/progress'),
          fetch('/api/public/courses'),
        ])

        if (progressRes.ok) {
          const data = await progressRes.json()
          setPurchasedCourses(data.courses || [])
        }

        if (coursesRes.ok) {
          const data = await coursesRes.json()
          setAllPublishedCourses(data || [])
        }
      } catch (err) {
        console.error('Failed to load courses:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  const purchasedSlugs = new Set(purchasedCourses.map(c => c.course_slug))
  // ✅ FIX: available courses are fetched from API and filtered dynamically
  const availableCourses = allPublishedCourses.filter(c => !purchasedSlugs.has(c.slug))

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
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{t('client.courses.title')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {purchasedCourses.map((course) => {
              const meta = getCourseMeta(course.course_slug)
              const Icon = meta.icon
              return (
                <Card key={course.course_slug} className="overflow-hidden card-hover">
                  <div className={`h-40 bg-gradient-to-br ${meta.color} flex items-center justify-center relative`}>
                    <Icon className="w-16 h-16 text-white/50" />
                    {course.progress_percent === 100 ? (
                      <Badge className="absolute top-4 left-4 bg-white/90 text-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />{t('client.courses.completed')}
                      </Badge>
                    ) : (
                      <Badge className="absolute top-4 left-4 bg-white/90 text-teal-600">
                        <BookOpen className="w-3 h-3 mr-1" />{course.progress_percent}% {t('client.course.completed')}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                      {ru ? course.course_title_secondary : course.course_title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {course.completed_lessons}/{course.total_lessons} {t('client.courses.lessons')}
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
                        {t('client.courses.contentComingSoon')}
                      </div>
                    )}
                    
                    <Link href={`/client/courses/${course.course_slug}`}>
                      <Button variant="gradient" className="w-full">
                        {course.total_lessons === 0 ? (
                          <>{t('client.courses.viewDetails')}<ArrowRight className="w-4 h-4 ml-2" /></>
                        ) : course.progress_percent === 0 ? (
                          <><Play className="w-4 h-4 mr-2" />{t('client.course.startCourse')}</>
                        ) : course.progress_percent < 100 ? (
                          <><Play className="w-4 h-4 mr-2" />{t('client.courses.continue')}</>
                        ) : (
                          <>{t('client.courses.openCourse')}<ArrowRight className="w-4 h-4 ml-2" /></>
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
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{t('client.courses.noCourses')}</h3>
          <p className="text-zinc-500 mb-6">{t('client.courses.chooseCourse')}</p>
        </Card>
      )}

      {/* ✅ FIX: Available courses loaded from API — all published courses shown dynamically */}
      {availableCourses.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{t('client.courses.availableCourses')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {availableCourses.map((course) => {
              const meta = getCourseMeta(course.slug)
              const Icon = meta.icon
              const price = course.price / 100
              const originalPrice = course.original_price ? course.original_price / 100 : null
              return (
                <Card key={course.slug} className="overflow-hidden card-hover">
                  <div className={`h-40 bg-gradient-to-br ${meta.color} flex items-center justify-center`}>
                    <Icon className="w-16 h-16 text-white/50" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                      {ru && course.title_secondary ? course.title_secondary : course.title}
                    </h3>
                    {(ru ? course.description : course.description) && (
                      <p className="text-sm text-zinc-500 mb-3 line-clamp-2">
                        {course.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
                      <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{course.lessons_count} {t('client.courses.lessons')}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{course.duration_weeks} {t('client.courses.weeks')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">${price}</span>
                        {originalPrice && (
                          <span className="text-sm text-zinc-400 line-through">${originalPrice}</span>
                        )}
                      </div>
                      <Link href={`/courses/${course.slug}`}>
                        <Button variant="gradient">
                          {t('client.courses.buyNow')}
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
