'use client'
import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
import { getCourse } from '@/lib/api'
import { ArrowLeft, Construction, BookOpen, Video, FileText } from 'lucide-react'

export default function CourseLessonsPage({ params }: { params: { slug: string } }) {
  const { locale } = useTranslation()
  const ru = locale === 'ru'
  const course = getCourse(params.slug)

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-zinc-500 mb-4">{ru ? 'Курс не найден' : 'Course not found'}</p>
        <Link href="/dashboard/courses">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />{ru ? 'Назад' : 'Back'}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/courses">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {ru ? course.titleRu : course.title}
          </h1>
          <p className="text-zinc-500 mt-1">{ru ? 'Управление уроками' : 'Manage Lessons'}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-5 text-center">
          <BookOpen className="w-8 h-8 text-teal-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{course.lessons}</div>
          <div className="text-sm text-zinc-500">{ru ? 'Уроков' : 'Lessons'}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5 text-center">
          <Video className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{course.duration_weeks}</div>
          <div className="text-sm text-zinc-500">{ru ? 'Недель' : 'Weeks'}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5 text-center">
          <FileText className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">${course.price}</div>
          <div className="text-sm text-zinc-500">{ru ? 'Цена' : 'Price'}</div>
        </CardContent></Card>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardContent className="py-16 text-center">
          <Construction className="w-16 h-16 mx-auto text-orange-400 mb-4" />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            {ru ? 'Редактор уроков в разработке' : 'Lesson Editor Coming Soon'}
          </h3>
          <p className="text-zinc-500 max-w-md mx-auto mb-6">
            {ru 
              ? 'Функционал управления уроками, модулями и контентом курсов будет доступен в следующем обновлении.'
              : 'Lesson management, modules, and course content features will be available in the next update.'
            }
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/dashboard/courses">
              <Button variant="outline">{ru ? 'Назад к курсам' : 'Back to Courses'}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
