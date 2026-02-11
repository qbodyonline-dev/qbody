'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { getDashboardStats, getClients, getCourses } from '@/lib/api'
import { 
  Users, BookOpen, TrendingUp, ClipboardCheck, ArrowRight, ArrowUpRight, 
  CheckCircle2, MessageSquare, CreditCard, 
  Dumbbell, UserPlus, Calendar, ChevronRight, Flame, Check, Loader2
} from 'lucide-react'

export default function DashboardPage() {
  const { t, locale } = useTranslation()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ activeClients: 0, totalClients: 0, publishedCourses: 0, totalCourses: 0, totalRevenue: 0, paidOrders: 0 })
  const [clients, setClients] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [s, c] = await Promise.all([
          getDashboardStats(),
          getClients(),
        ])
        const co = getCourses()
        setStats(s)
        setClients(c)
        setCourses(co)
      } catch (e) {
        console.error('Dashboard load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const ru = locale === 'ru'

  const statCards = [
    { key: 'activeClients', value: stats.activeClients, icon: Users, color: 'bg-teal-500' },
    { key: 'publishedCourses', value: stats.publishedCourses, icon: BookOpen, color: 'bg-green-500' },
    { key: 'totalClients', value: stats.totalClients, icon: TrendingUp, color: 'bg-purple-500' },
    { key: 'totalCourses', value: stats.totalCourses, icon: ClipboardCheck, color: 'bg-orange-500' },
  ]

  const statLabels: Record<string, string> = {
    activeClients: ru ? 'Активные клиенты' : 'Active Clients',
    publishedCourses: ru ? 'Опубл. курсы' : 'Published Courses',
    totalClients: ru ? 'Всего клиентов' : 'Total Clients',
    totalCourses: ru ? 'Всего курсов' : 'Total Courses',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {ru ? `Привет, ${profile?.full_name || 'Admin'}!` : `Welcome, ${profile?.full_name || 'Admin'}!`}
          </h1>
          <p className="text-zinc-500 mt-1">
            {ru ? 'Вот что происходит сегодня' : "Here's what's happening today"}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/courses"><Button variant="outline"><BookOpen className="w-4 h-4 mr-2" />{ru ? 'Курсы' : 'Courses'}</Button></Link>
          <Link href="/dashboard/clients"><Button variant="gradient"><UserPlus className="w-4 h-4 mr-2" />{ru ? 'Клиенты' : 'Clients'}</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.key}><CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">{statLabels[stat.key]}</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center`}><Icon className="w-6 h-6 text-white" /></div>
              </div>
            </CardContent></Card>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">{ru ? 'Клиенты' : 'Clients'}</CardTitle>
            <Link href="/dashboard/clients"><Button variant="ghost" size="sm">{ru ? 'Все' : 'All'}<ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
                <p className="text-zinc-500">{ru ? 'Клиентов пока нет' : 'No clients yet'}</p>
                <p className="text-sm text-zinc-400 mt-1">{ru ? 'Они появятся после регистрации' : 'They will appear after registration'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clients.slice(0, 5).map((client: any) => {
                  const initials = client.full_name
                    ? client.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                    : client.email?.slice(0, 2).toUpperCase() || 'U'
                  return (
                    <div key={client.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                      <Avatar src={client.avatar_url || undefined} fallback={initials} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{client.full_name || client.email}</p>
                        <p className="text-sm text-zinc-500 truncate">{client.email}</p>
                      </div>
                      <Badge variant="success">{ru ? 'Активен' : 'Active'}</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">{ru ? 'Курсы' : 'Courses'}</CardTitle>
            <Link href="/dashboard/courses"><Button variant="ghost" size="sm">{ru ? 'Все' : 'All'}<ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
                <p className="text-zinc-500">{ru ? 'Курсов пока нет' : 'No courses yet'}</p>
                <Link href="/dashboard/courses?new=1"><Button variant="outline" size="sm" className="mt-3">{ru ? 'Создать курс' : 'Create Course'}</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((course: any) => (
                  <div key={course.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{course.title}</p>
                      <div className="flex items-center gap-3 text-sm text-zinc-500">
                        <span>${course.price}</span>
                        {course.duration_weeks && <span>{course.duration_weeks} {ru ? 'нед.' : 'weeks'}</span>}
                      </div>
                    </div>
                    <Badge variant={course.is_published ? 'success' : 'secondary'}>
                      {course.is_published ? (ru ? 'Опубл.' : 'Live') : (ru ? 'Черновик' : 'Draft')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader><CardTitle className="text-lg">{ru ? 'Быстрые действия' : 'Quick Actions'}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/dashboard/courses?new=1">
              <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors text-center cursor-pointer">
                <BookOpen className="w-8 h-8 mx-auto text-teal-600 mb-2" />
                <p className="text-sm font-medium text-teal-700 dark:text-teal-400">{ru ? 'Новый курс' : 'New Course'}</p>
              </div>
            </Link>
            <Link href="/dashboard/exercises">
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-center cursor-pointer">
                <Dumbbell className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <p className="text-sm font-medium text-purple-700 dark:text-purple-400">{ru ? 'Упражнения' : 'Exercises'}</p>
              </div>
            </Link>
            <Link href="/dashboard/settings">
              <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors text-center cursor-pointer">
                <CreditCard className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                <p className="text-sm font-medium text-orange-700 dark:text-orange-400">{ru ? 'Настройки' : 'Settings'}</p>
              </div>
            </Link>
            <Link href="/dashboard/messages">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-center cursor-pointer">
                <MessageSquare className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">{ru ? 'Сообщения' : 'Messages'}</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
