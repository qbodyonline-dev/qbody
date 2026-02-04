'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { BookOpen, Clock, Heart, Baby, ArrowRight, CheckCircle2, ShoppingBag, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const allCourses = [
  { id: 'breast-augmentation-recovery', title: 'Breast Augmentation Recovery', titleRu: 'Восстановление после увеличения груди', icon: Heart, color: 'from-pink-500 to-rose-500', lessons: 18, weeks: 6, price: 99 },
  { id: 'cesarean-recovery', title: 'C-Section Recovery', titleRu: 'Восстановление после кесарева сечения', icon: Baby, color: 'from-purple-500 to-violet-500', lessons: 24, weeks: 8, price: 99 },
]

export default function CoursesPage() {
  const { t, locale } = useTranslation()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [purchasedSlugs, setPurchasedSlugs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const ru = locale === 'ru'

  useEffect(() => {
    // Show success toast if redirected from Stripe
    const payment = searchParams.get('payment')
    const course = searchParams.get('course')
    if (payment === 'success' && course) {
      toast.success(ru ? `Курс "${allCourses.find(c => c.id === course)?.[ru ? 'titleRu' : 'title'] || course}" успешно оплачен!` : `Course purchased successfully!`)
    }
  }, [searchParams])

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    const load = async () => {
      const { data } = await supabase
        .from('course_access')
        .select('course_slug')
        .eq('user_id', user.id)

      setPurchasedSlugs((data || []).map(d => d.course_slug))
      setLoading(false)
    }

    load()
  }, [user])

  const purchased = allCourses.filter(c => purchasedSlugs.includes(c.id))
  const available = allCourses.filter(c => !purchasedSlugs.includes(c.id))

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
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{t('client.courses.title')}</h1>
        <p className="text-zinc-600 mt-1">{t('client.courses.subtitle')}</p>
      </div>

      {/* Purchased */}
      {purchased.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">{ru ? 'Мои курсы' : 'My Courses'}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {purchased.map((course) => {
              const Icon = course.icon
              return (
                <Card key={course.id} className="overflow-hidden card-hover">
                  <div className={`h-40 bg-gradient-to-br ${course.color} flex items-center justify-center relative`}>
                    <Icon className="w-16 h-16 text-white/50" />
                    <Badge className="absolute top-4 left-4 bg-white/90 text-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />{ru ? 'Куплен' : 'Purchased'}
                    </Badge>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">{ru ? course.titleRu : course.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
                      <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{course.lessons} {ru ? 'уроков' : 'lessons'}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{course.weeks} {ru ? 'недель' : 'weeks'}</span>
                    </div>
                    <Link href={`/client/courses/${course.id}`}>
                      <Button variant="gradient" className="w-full">
                        {ru ? 'Открыть курс' : 'Open Course'}
                        <ArrowRight className="w-4 h-4 ml-2" />
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
      {purchased.length === 0 && (
        <Card className="p-12 text-center">
          <ShoppingBag className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-900 mb-2">{ru ? 'У вас пока нет курсов' : 'No courses yet'}</h3>
          <p className="text-zinc-500 mb-6">{ru ? 'Выберите курс ниже и начните восстановление' : 'Choose a course below to start your recovery'}</p>
        </Card>
      )}

      {/* Available */}
      {available.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">{ru ? 'Доступные курсы' : 'Available Courses'}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {available.map((course) => {
              const Icon = course.icon
              return (
                <Card key={course.id} className="overflow-hidden card-hover">
                  <div className={`h-40 bg-gradient-to-br ${course.color} flex items-center justify-center`}>
                    <Icon className="w-16 h-16 text-white/50" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">{ru ? course.titleRu : course.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
                      <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{course.lessons} {ru ? 'уроков' : 'lessons'}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{course.weeks} {ru ? 'недель' : 'weeks'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-zinc-900">${course.price}</span>
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
