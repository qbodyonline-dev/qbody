'use client'
import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
import { ArrowLeft, Construction, Mail } from 'lucide-react'

export default function NewCoursePage() {
  const { locale } = useTranslation()
  const ru = locale === 'ru'

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/courses">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {ru ? 'Создание курса' : 'Create Course'}
          </h1>
        </div>
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <Construction className="w-16 h-16 mx-auto text-orange-400 mb-4" />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            {ru ? 'Курсы управляются разработчиком' : 'Courses Managed by Developer'}
          </h3>
          <p className="text-zinc-500 max-w-md mx-auto mb-6">
            {ru 
              ? 'На данный момент добавление новых курсов выполняется через код. Для добавления нового курса свяжитесь с разработчиком.'
              : 'Currently, adding new courses is done through code. Contact the developer to add a new course.'
            }
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/dashboard/courses">
              <Button variant="outline">{ru ? 'Назад к курсам' : 'Back to Courses'}</Button>
            </Link>
            <a href="mailto:support@qbody.com">
              <Button variant="gradient">
                <Mail className="w-4 h-4 mr-2" />
                {ru ? 'Связаться' : 'Contact'}
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
