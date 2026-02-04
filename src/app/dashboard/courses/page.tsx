'use client'
import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { Plus, Edit, Eye, Heart, Baby, BookOpen, Users, DollarSign } from 'lucide-react'

export default function CoursesAdminPage() {
  const { t, locale } = useTranslation()

  const courses = [
    { 
      id: '1', slug: 'breast-augmentation-recovery', icon: Heart, color: 'from-pink-500 to-rose-500',
      title: 'Breast Augmentation Recovery', titleRu: 'Восстановление после маммопластики',
      lessons: 18, price: 99, students: 45, revenue: 4455, active: true
    },
    { 
      id: '2', slug: 'cesarean-recovery', icon: Baby, color: 'from-purple-500 to-violet-500',
      title: 'C-Section Recovery', titleRu: 'Восстановление после кесарева',
      lessons: 24, price: 99, students: 62, revenue: 6138, active: true
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{t('sidebar.coursesList')}</h1>
          <p className="text-zinc-500 mt-1">{t('settings.courses.subtitle')}</p>
        </div>
        <Link href="/dashboard/courses/new">
          <Button variant="gradient"><Plus className="w-4 h-4 mr-2" />{t('settings.courses.addCourse')}</Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {courses.map((course) => {
          const Icon = course.icon
          return (
            <Card key={course.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  <div className={`lg:w-48 h-32 lg:h-auto bg-gradient-to-br ${course.color} flex items-center justify-center`}>
                    <Icon className="w-12 h-12 text-white" />
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900">{locale === 'ru' ? course.titleRu : course.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500">
                          <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{course.lessons} {t('settings.courses.lessons')}</span>
                          <span className="flex items-center gap-1"><Users className="w-4 h-4" />{course.students} {t('clients.title').toLowerCase()}</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />${course.revenue}</span>
                        </div>
                      </div>
                      <Badge variant="success">{t('settings.courses.active')}</Badge>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-1" />{t('settings.courses.editCourse')}</Button>
                      <Button variant="outline" size="sm"><BookOpen className="w-4 h-4 mr-1" />{t('settings.courses.manageLessons')}</Button>
                      <Link href={`/courses/${course.slug}`} target="_blank">
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4 mr-1" />{t('settings.viewSite')}</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
