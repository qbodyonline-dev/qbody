'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { BookOpen, Clock, CheckCircle2, ArrowRight, Trophy, Target, ShoppingBag, Heart, Baby, Loader2 } from 'lucide-react'

const coursesMeta: Record<string, { title: string; titleRu: string; icon: any; color: string; lessons: number }> = {
  'breast-augmentation-recovery': { title: 'Breast Augmentation Recovery', titleRu: 'Восстановление после увеличения груди', icon: Heart, color: 'from-pink-500 to-rose-500', lessons: 18 },
  'cesarean-recovery': { title: 'C-Section Recovery', titleRu: 'Восстановление после кесарева сечения', icon: Baby, color: 'from-purple-500 to-violet-500', lessons: 24 },
}

type CourseAccess = {
  course_slug: string
  granted_at: string
}

type Order = {
  course_slug: string
  status: string
  amount: number
  paid_at: string | null
}

export default function ClientHomePage() {
  const { t, locale } = useTranslation()
  const { user, profile } = useAuth()
  const [courses, setCourses] = useState<CourseAccess[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const ru = locale === 'ru'

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    const load = async () => {
      // Fetch course access
      const { data: accessData } = await supabase
        .from('course_access')
        .select('course_slug, granted_at')
        .eq('user_id', user.id)

      // Fetch orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('course_slug, status, amount, paid_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setCourses((accessData || []) as CourseAccess[])
      setOrders((ordersData || []) as Order[])
      setLoading(false)
    }

    load()
  }, [user])

  const paidOrders = orders.filter(o => o.status === 'paid')
  const totalSpent = paidOrders.reduce((s, o) => s + o.amount, 0)
  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || ''

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">
            {ru ? `Привет, ${firstName}` : `Welcome, ${firstName}`} 👋
          </h1>
          <p className="text-zinc-600 mt-1">
            {courses.length > 0
              ? (ru ? 'Продолжайте свой путь к восстановлению' : 'Continue your recovery journey')
              : (ru ? 'Начните свой путь к восстановлению' : 'Start your recovery journey')
            }
          </p>
        </div>
        <Link href="/client/courses">
          <Button variant="outline">{t('client.home.allCourses')}<ArrowRight className="w-4 h-4 ml-2" /></Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, value: String(courses.length), label: ru ? 'Активных курсов' : 'Active Courses', color: 'bg-teal-500/10 text-teal-500' },
          { icon: ShoppingBag, value: String(paidOrders.length), label: ru ? 'Покупок' : 'Purchases', color: 'bg-green-500/10 text-green-500' },
          { icon: Clock, value: totalSpent > 0 ? `$${(totalSpent / 100).toFixed(0)}` : '$0', label: ru ? 'Потрачено' : 'Total Spent', color: 'bg-orange-500/10 text-orange-500' },
          { icon: Trophy, value: courses.length > 0 ? (ru ? 'Да' : 'Active') : '—', label: ru ? 'Статус' : 'Status', color: 'bg-purple-500/10 text-purple-500' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}><CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}><Icon className="w-5 h-5" /></div>
                <div><p className="text-2xl font-bold text-zinc-900">{stat.value}</p><p className="text-xs text-zinc-500">{stat.label}</p></div>
              </div>
            </CardContent></Card>
          )
        })}
      </div>

      {/* My courses */}
      {courses.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">{ru ? 'Мои курсы' : 'My Courses'}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {courses.map((access) => {
              const meta = coursesMeta[access.course_slug]
              if (!meta) return null
              const Icon = meta.icon
              return (
                <Card key={access.course_slug} className="overflow-hidden card-hover">
                  <div className={`h-40 bg-gradient-to-br ${meta.color} flex items-center justify-center relative`}>
                    <Icon className="w-16 h-16 text-white/50" />
                    <Badge className="absolute top-4 left-4 bg-white/90 text-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />{ru ? 'Куплен' : 'Purchased'}
                    </Badge>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">{ru ? meta.titleRu : meta.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
                      <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{meta.lessons} {ru ? 'уроков' : 'lessons'}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{ru ? 'Доступ навсегда' : 'Lifetime access'}</span>
                    </div>
                    <Link href={`/client/courses/${access.course_slug}`}>
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
      ) : (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-900 mb-2">{ru ? 'У вас пока нет курсов' : 'No courses yet'}</h3>
          <p className="text-zinc-500 mb-6">{ru ? 'Приобретите свой первый курс и начните восстановление' : 'Purchase your first course to start your recovery'}</p>
          <Link href="/#courses"><Button variant="gradient">{ru ? 'Посмотреть курсы' : 'Browse Courses'}</Button></Link>
        </Card>
      )}

      {/* Recent orders */}
      {orders.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">{ru ? 'История покупок' : 'Purchase History'}</h2>
          <Card><CardContent className="p-0">
            <div className="divide-y divide-zinc-200">
              {orders.slice(0, 5).map((order, i) => {
                const meta = coursesMeta[order.course_slug]
                return (
                  <div key={i} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status === 'paid' ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                        <CheckCircle2 className={`w-4 h-4 ${order.status === 'paid' ? 'text-green-500' : 'text-orange-500'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 text-sm">{meta ? (ru ? meta.titleRu : meta.title) : order.course_slug}</p>
                        <p className="text-xs text-zinc-500">
                          {order.paid_at ? new Date(order.paid_at).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-zinc-900">${(order.amount / 100).toFixed(0)}</p>
                      <Badge variant={order.status === 'paid' ? 'success' : 'warning'} className="text-xs">
                        {order.status === 'paid' ? (ru ? 'Оплачен' : 'Paid') : (ru ? 'Ожидает' : 'Pending')}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent></Card>
        </section>
      )}
    </div>
  )
}
