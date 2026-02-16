'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { fetchWithAuth } from '@/lib/api'
import { Play, CheckCircle2, Clock, ArrowLeft, BookOpen, Loader2, ChevronDown, ChevronRight } from 'lucide-react'

type Lesson = {
  id: string
  title: string
  title_secondary: string
  duration_minutes: number
  completed: boolean
  watched_seconds: number
}

type Module = {
  id: string
  title: string
  title_secondary: string
  lessons: Lesson[]
}

type CourseProgress = {
  course_slug: string
  course_id: string
  course_title: string
  course_title_secondary: string
  total_lessons: number
  completed_lessons: number
  progress_percent: number
  modules: Module[]
}

export default function CoursePage() {
  const { t, locale } = useTranslation()
  const { user } = useAuth()
  const params = useParams()
  const courseSlug = params.courseId as string
  
  const [course, setCourse] = useState<CourseProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return

    const loadProgress = async () => {
      try {
        const res = await fetchWithAuth(`/api/progress?course_slug=${courseSlug}`)
        if (res.ok) {
          const data = await res.json()
          if (data.courses && data.courses.length > 0) {
            setCourse(data.courses[0])
            // Expand first incomplete module by default
            const firstIncompleteModule = data.courses[0].modules.find(
              (m: Module) => m.lessons.some(l => !l.completed)
            )
            if (firstIncompleteModule) {
              setExpandedModules(new Set([firstIncompleteModule.id]))
            } else if (data.courses[0].modules.length > 0) {
              setExpandedModules(new Set([data.courses[0].modules[0].id]))
            }
          }
        }
      } catch (err) {
        console.error('Failed to load progress:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [user, courseSlug])

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <BookOpen className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          {t('client.course.notFound')}
        </h2>
        <p className="text-zinc-500 mb-6">
          {t('client.course.noAccess')}
        </p>
        <Link href="/client/courses">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('client.course.backToCourses')}
          </Button>
        </Link>
      </div>
    )
  }

  // Course exists but has no modules yet
  if (course.modules.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/client/courses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />{t('common.back')}
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            {locale === 'ru' ? course.course_title_secondary : course.course_title}
          </h1>
        </div>

        <Card className="p-12 text-center">
          <Clock className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            {t('client.course.contentComingSoon')}
          </h3>
          <p className="text-zinc-500 mb-6">
            {t('client.course.lessonsBeingPrepared')}
          </p>
          <Link href="/client/courses">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('client.course.backToCourses')}
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  // Find next lesson to continue
  let nextLesson: { moduleId: string; lesson: Lesson } | null = null
  for (const module of course.modules) {
    const incomplete = module.lessons.find(l => !l.completed)
    if (incomplete) {
      nextLesson = { moduleId: module.id, lesson: incomplete }
      break
    }
  }

  // Calculate total duration
  const totalMinutes = course.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + (l.duration_minutes || 0), 0), 0
  )
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/client/courses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />{t('common.back')}
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              {locale === 'ru' ? course.course_title_secondary : course.course_title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {course.total_lessons} {t('client.courses.lessons')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {totalHours > 0 ? `${totalHours}h ` : ''}{remainingMinutes > 0 ? `${remainingMinutes}m` : ''}
              </span>
            </div>
          </div>

          {/* Modules */}
          <div className="space-y-4">
            {course.modules.map((module, moduleIndex) => {
              const isExpanded = expandedModules.has(module.id)
              const completedInModule = module.lessons.filter(l => l.completed).length
              const moduleProgress = module.lessons.length > 0 
                ? Math.round((completedInModule / module.lessons.length) * 100) 
                : 0

              return (
                <Card key={module.id}>
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-t-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-zinc-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-zinc-500" />
                      )}
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {locale === 'ru' ? module.title_secondary || module.title : module.title}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {completedInModule}/{module.lessons.length} {t('client.courses.lessons')} • {moduleProgress}%
                        </p>
                      </div>
                    </div>
                    {moduleProgress === 100 && (
                      <Badge variant="success">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {t('client.courses.completed')}
                      </Badge>
                    )}
                  </button>

                  {isExpanded && (
                    <CardContent className="pt-0 pb-4 px-4">
                      <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                        {module.lessons.map((lesson, lessonIndex) => {
                          const isNextLesson = nextLesson?.lesson.id === lesson.id
                          const globalLessonIndex = course.modules
                            .slice(0, moduleIndex)
                            .reduce((sum, m) => sum + m.lessons.length, 0) + lessonIndex + 1

                          return (
                            <div 
                              key={lesson.id} 
                              className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                                lesson.completed 
                                  ? 'bg-green-50 dark:bg-green-900/20' 
                                  : isNextLesson 
                                    ? 'bg-teal-50 dark:bg-teal-900/20 ring-2 ring-teal-500' 
                                    : 'bg-zinc-50 dark:bg-zinc-800/50'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                  lesson.completed 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                                }`}>
                                  {lesson.completed ? <CheckCircle2 className="w-4 h-4" /> : globalLessonIndex}
                                </div>
                                <div>
                                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {locale === 'ru' ? lesson.title_secondary || lesson.title : lesson.title}
                                  </p>
                                  <p className="text-sm text-zinc-500">
                                    {lesson.duration_minutes} {t('client.course.min')}
                                  </p>
                                </div>
                              </div>
                              <Link href={`/client/courses/${courseSlug}/${lesson.id}`}>
                                <Button 
                                  variant={isNextLesson ? 'gradient' : 'ghost'} 
                                  size="sm"
                                >
                                  <Play className="w-4 h-4" />
                                </Button>
                              </Link>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                {t('client.course.yourProgress')}
              </h3>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-teal-500">{course.progress_percent}%</div>
                <div className="text-sm text-zinc-500">{t('client.course.completed')}</div>
              </div>
              <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${course.progress_percent}%` }} 
                />
              </div>
              <p className="text-sm text-zinc-500 text-center">
                {course.completed_lessons} / {course.total_lessons} {t('client.courses.lessons')}
              </p>
              {nextLesson && (
                <Link href={`/client/courses/${courseSlug}/${nextLesson.lesson.id}`}>
                  <Button variant="gradient" className="w-full mt-4">
                    <Play className="w-4 h-4 mr-2" />
                    {t('client.course.continueWatching')}
                  </Button>
                </Link>
              )}
              {!nextLesson && course.progress_percent === 100 && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="font-medium text-green-700 dark:text-green-400">
                    {t('client.course.courseCompleted')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
