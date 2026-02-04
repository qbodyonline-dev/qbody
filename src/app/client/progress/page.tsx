'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { BookOpen, Clock, Trophy, ShoppingBag, Heart, Baby, Calendar, ArrowRight, Loader2 } from 'lucide-react'

const coursesMeta: Record<string, { title: string; titleRu: string; icon: any; color: string; lessons: number }> = {
  'breast-augmentation-recovery': { title: 'Breast Augmentation Recovery', titleRu: 'Восстановление после увеличения груди', icon: Heart, color: 'from-pink-500 to-rose-500', lessons: 18 },
  'cesarean-recovery': { title: 'C-Section Recovery', titleRu: 'Восстановление после кесарева сечения', icon: Baby, color: 'from-purple-500 to-violet-500', lessons: 24 },
}

export default function ProgressPage() {
  const { t, locale } = useTranslation()
  const { user } = useAuth()
  const [courses, setCourses] = useState<{ course_slug: string; granted_at: string }[]>([])
  const [orders, setOrders] = useState<{ course_slug: string; amount: number; status: string; paid_at: string | null }[]>([])
  const [loading, setLoading] = useState(true)

  const ru = locale === 'ru'

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    const load = async () => {
      const { data: accessData } = await supabase
        .from('course_access')
        .select('course_slug, granted_at')
        .eq('user_id', user.id)

      const { data: ordersData } = await supabase
        .from('orders')
        .select('course_slug, amount, status, paid_at')
        .eq('user_id', user.id)
        .eq('status', 'paid')

      setCourses(accessData || [])
      setOrders(ordersData || [])
      setLoading(false)
    }

    load()
  }, [user])

  const totalSpent = orders.reduce((s, o) => s + o.amount, 0)

  // Calculate member since
  const memberSince = courses.length > 0
    ? new Date(courses.reduce((min, c) => c.granted_at < min ? c.granted_at : min, courses[0].granted_at))
        .toLocaleDateString(ru ? 'ru-RU' : 'en-US', { month: 'long', year: 'numeric' })
    : '—'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  const stats = [
    { icon: BookOpen, value: String(courses.length), label: ru ? 'Курсов' : 'Courses', color: 'bg-teal-500/10 text-teal-500' },
    { icon: ShoppingBag, value: `$${(totalSpent / 100).toFixed(0)}`, label: ru ? 'Инвестировано' : 'Invested', color: 'bg-green-500/10 text-green-500' },
    { icon: Trophy, value: String(orders.length), label: ru ? 'Покупок' : 'Purchases', color: 'bg-orange-500/10 text-orange-500' },
    { icon: Calendar, value: memberSince, label: ru ? 'Участник с' : 'Member since', color: 'bg-purple-500/10 text-purple-500' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{t('client.progress.title')}</h1>
        <p className="text-zinc-600 mt-1">{t('client.progress.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="p-6 text-center">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-2xl font-bold text-zinc-900">{stat.value}</div>
                <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Course list */}
      {courses.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">{ru ? 'Мои курсы' : 'My Courses'}</h2>
          <div className="space-y-4">
            {courses.map((access) => {
              const meta = coursesMeta[access.course_slug]
              if (!meta) return null
              const Icon = meta.icon
              const purchaseDate = new Date(access.granted_at).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })

              return (
                <Card key={access.course_slug} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-7 h-7 text-white/80" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-zinc-900">{ru ? meta.titleRu : meta.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-zinc-500 mt-1">
                          <span>{meta.lessons} {ru ? 'уроков' : 'lessons'}</span>
                          <span>{ru ? 'Куплен' : 'Purchased'}: {purchaseDate}</span>
                        </div>
                      </div>
                      <Link href={`/client/courses/${access.course_slug}`}>
                        <Button variant="outline" size="sm">
                          {ru ? 'Открыть' : 'Open'}
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      ) : (
        <Card className="p-12 text-center">
          <Trophy className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-900 mb-2">{ru ? 'Прогресс появится здесь' : 'Progress will appear here'}</h3>
          <p className="text-zinc-500 mb-6">{ru ? 'Купите курс, чтобы начать отслеживать прогресс' : 'Purchase a course to start tracking your progress'}</p>
          <Link href="/#courses"><Button variant="gradient">{ru ? 'Посмотреть курсы' : 'Browse Courses'}</Button></Link>
        </Card>
      )}
    </div>
  )
}
