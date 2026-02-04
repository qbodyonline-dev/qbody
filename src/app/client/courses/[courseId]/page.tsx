'use client'
import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { Play, CheckCircle2, Lock, Clock, ArrowLeft, BookOpen } from 'lucide-react'

const courseData = {
  'breast-augmentation-recovery': {
    title: 'Breast Augmentation Recovery', titleRu: 'Восстановление после увеличения груди',
    lessons: [
      { id: 1, title: 'Introduction', titleRu: 'Введение', duration: '10 min', completed: true },
      { id: 2, title: 'First Week Recovery', titleRu: 'Восстановление в первую неделю', duration: '15 min', completed: true },
      { id: 3, title: 'Gentle Movements', titleRu: 'Мягкие движения', duration: '20 min', completed: true },
      { id: 4, title: 'Breathing Exercises', titleRu: 'Дыхательные упражнения', duration: '12 min', completed: true },
      { id: 5, title: 'Posture Work', titleRu: 'Работа с осанкой', duration: '18 min', completed: true },
      { id: 6, title: 'Light Stretching', titleRu: 'Лёгкая растяжка', duration: '15 min', completed: true },
      { id: 7, title: 'Core Activation', titleRu: 'Активация кора', duration: '20 min', completed: true },
      { id: 8, title: 'Upper Body Mobility', titleRu: 'Мобильность верха тела', duration: '18 min', completed: true },
      { id: 9, title: 'Back Strengthening', titleRu: 'Укрепление спины', duration: '15 min', completed: false },
      { id: 10, title: 'Full Body Integration', titleRu: 'Интеграция всего тела', duration: '25 min', completed: false },
    ]
  }
}

export default function CoursePage() {
  const { t, locale } = useTranslation()
  const params = useParams()
  const courseId = params.courseId as string
  const course = courseData[courseId as keyof typeof courseData]
  
  if (!course) return <div>Course not found</div>

  const completedCount = course.lessons.filter(l => l.completed).length
  const progress = Math.round((completedCount / course.lessons.length) * 100)
  const nextLesson = course.lessons.find(l => !l.completed)

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/client/courses"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />{t('common.back')}</Button></Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-2">{locale === 'ru' ? course.titleRu : course.title}</h1>
            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{course.lessons.length} {t('client.course.lessons')}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />~3h {t('client.course.duration')}</span>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">{t('client.course.lessonList')}</h2>
              <div className="space-y-2">
                {course.lessons.map((lesson, index) => (
                  <div key={lesson.id} className={`flex items-center justify-between p-4 rounded-xl ${lesson.completed ? 'bg-green-50' : nextLesson?.id === lesson.id ? 'bg-teal-50 ring-2 ring-teal-500' : 'bg-zinc-50'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${lesson.completed ? 'bg-green-500 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                        {lesson.completed ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">{locale === 'ru' ? lesson.titleRu : lesson.title}</p>
                        <p className="text-sm text-zinc-500">{lesson.duration}</p>
                      </div>
                    </div>
                    <Link href={`/client/courses/${courseId}/${lesson.id}`}>
                      <Button variant={nextLesson?.id === lesson.id ? 'gradient' : 'ghost'} size="sm">
                        <Play className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">{t('client.course.yourProgress')}</h3>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-teal-500">{progress}%</div>
                <div className="text-sm text-zinc-500">{t('client.course.completed')}</div>
              </div>
              <div className="h-3 bg-zinc-200 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-sm text-zinc-500 text-center">{completedCount} / {course.lessons.length} {t('client.course.lessons')}</p>
              {nextLesson && (
                <Link href={`/client/courses/${courseId}/${nextLesson.id}`}>
                  <Button variant="gradient" className="w-full mt-4">
                    <Play className="w-4 h-4 mr-2" />
                    {t('client.course.continueWatching')}
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
