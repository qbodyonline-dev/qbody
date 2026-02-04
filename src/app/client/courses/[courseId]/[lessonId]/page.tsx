'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { Play, CheckCircle2, ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

export default function LessonPage() {
  const { t, locale } = useTranslation()
  const params = useParams()
  const courseId = params.courseId as string
  const lessonId = params.lessonId as string
  const [isCompleted, setIsCompleted] = useState(false)

  const lesson = {
    id: parseInt(lessonId),
    title: 'Back Strengthening Exercises',
    titleRu: 'Упражнения для укрепления спины',
    duration: '15 min',
    description: 'In this lesson, you will learn safe and effective exercises to strengthen your back muscles after surgery.',
    descriptionRu: 'В этом уроке вы узнаете безопасные и эффективные упражнения для укрепления мышц спины после операции.',
    videoUrl: '',
  }

  const handleComplete = () => {
    setIsCompleted(true)
    toast.success(locale === 'ru' ? 'Урок отмечен как пройденный!' : 'Lesson marked as complete!')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/client/courses/${courseId}`}><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />{t('client.lesson.backToCourse')}</Button></Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled><ArrowLeft className="w-4 h-4 mr-1" />{t('client.lesson.previousLesson')}</Button>
          <Button variant="outline" size="sm"><ArrowRight className="w-4 h-4 mr-1" />{t('client.lesson.nextLesson')}</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player Placeholder */}
          <div className="aspect-video bg-zinc-900 rounded-2xl flex items-center justify-center relative overflow-hidden">
            <div className="text-center">
              <Play className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <p className="text-white/50">Video Player</p>
              <p className="text-white/30 text-sm">Protected video content</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-4 mb-4">
              <Badge variant="secondary">{t('client.course.lessons')} {lesson.id}</Badge>
              <Badge variant="outline">{lesson.duration}</Badge>
              {isCompleted && <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" />{t('client.lesson.completed')}</Badge>}
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-4">{locale === 'ru' ? lesson.titleRu : lesson.title}</h1>
            <p className="text-zinc-600">{locale === 'ru' ? lesson.descriptionRu : lesson.description}</p>
          </div>

          {!isCompleted && (
            <Button variant="gradient" size="lg" onClick={handleComplete}>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {t('client.lesson.markComplete')}
            </Button>
          )}
        </div>

        <div>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-zinc-900 mb-4">{t('client.lesson.resources')}</h3>
              <div className="space-y-3">
                <div className="p-3 bg-zinc-50 rounded-xl">
                  <p className="font-medium text-zinc-900 text-sm">Exercise Guide PDF</p>
                  <p className="text-xs text-zinc-500">Download</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl">
                  <p className="font-medium text-zinc-900 text-sm">Workout Checklist</p>
                  <p className="text-xs text-zinc-500">Download</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
