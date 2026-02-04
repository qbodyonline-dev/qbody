'use client'
import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { Play, BookOpen, Clock, Heart, Baby, ArrowRight } from 'lucide-react'

const courses = [
  { id: 'breast-augmentation-recovery', title: 'Breast Augmentation Recovery', titleRu: 'Восстановление после увеличения груди', icon: Heart, color: 'from-pink-500 to-rose-500', progress: 45, lessons: 18, purchased: true },
  { id: 'cesarean-recovery', title: 'C-Section Recovery', titleRu: 'Восстановление после кесарева', icon: Baby, color: 'from-purple-500 to-violet-500', progress: 0, lessons: 24, purchased: false },
]

export default function CoursesPage() {
  const { t, locale } = useTranslation()
  const purchasedCourses = courses.filter(c => c.purchased)
  const availableCourses = courses.filter(c => !c.purchased)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{t('client.courses.title')}</h1>
        <p className="text-zinc-600 mt-1">{t('client.courses.subtitle')}</p>
      </div>

      {purchasedCourses.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {purchasedCourses.map((course) => {
            const Icon = course.icon
            return (
              <Card key={course.id} className="overflow-hidden card-hover">
                <div className={`h-40 bg-gradient-to-br ${course.color} flex items-center justify-center relative`}>
                  <Icon className="w-16 h-16 text-white/50" />
                  <Badge className="absolute top-4 left-4 bg-white/90 text-zinc-900">{course.progress}% {t('client.courses.progress')}</Badge>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">{locale === 'ru' ? course.titleRu : course.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
                    <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{course.lessons} {t('client.courses.lessons')}</span>
                  </div>
                  <div className="h-2 bg-zinc-200 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${course.progress}%` }} />
                  </div>
                  <Link href={`/client/courses/${course.id}`}>
                    <Button variant="gradient" className="w-full">
                      {course.progress > 0 ? t('client.courses.continue') : t('client.courses.start')}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-900 mb-2">{t('client.courses.noCourses')}</h3>
          <Link href="/#courses"><Button variant="gradient">{t('client.courses.browseCourses')}</Button></Link>
        </Card>
      )}

      {availableCourses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Available Courses</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {availableCourses.map((course) => {
              const Icon = course.icon
              return (
                <Card key={course.id} className="overflow-hidden opacity-75">
                  <div className={`h-32 bg-gradient-to-br ${course.color} flex items-center justify-center`}>
                    <Icon className="w-12 h-12 text-white/50" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-zinc-900 mb-2">{locale === 'ru' ? course.titleRu : course.title}</h3>
                    <Link href={`/courses/${course.id}`}><Button variant="outline" className="w-full">View Course</Button></Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
