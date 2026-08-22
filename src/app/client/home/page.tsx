'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { fetchWithAuth } from '@/lib/api'
import {
  BookOpen, Clock, CheckCircle2, ArrowRight, Target,
  Heart, Baby, Loader2, Dumbbell, Scale, Calendar,
  Play, Moon, TrendingDown, TrendingUp, MessageCircle, History
} from 'lucide-react'

const coursesMeta: Record<string, { title: string; titleSecondary: string; icon: any; color: string; lessons: number }> = {
  'breast-augmentation-recovery': { title: 'Breast Augmentation Recovery', titleSecondary: 'Восстановление после увеличения груди', icon: Heart, color: 'from-pink-500 to-rose-500', lessons: 18 },
  'cesarean-recovery': { title: 'C-Section Recovery', titleSecondary: 'Восстановление после кесарева сечения', icon: Baby, color: 'from-purple-500 to-violet-500', lessons: 24 },
}

type CourseAccess = { course_slug: string; granted_at: string }
type Order = { course_slug: string; status: string; amount: number; paid_at: string | null }
type TodayWorkout = {
  is_rest_day: boolean
  day_of_week: number
  workouts: { id: string; name: string; name_secondary: string; type: string; duration_minutes: number | null; workout_exercises: any[] } | null
}
type CatchupWorkout = {
  missed_date: string
  day_of_week: number
  workout: { id: string; name: string | null; name_secondary: string | null; type: string | null; estimated_duration: number | null; exercise_count: number } | null
}
type ProgramInfo = {
  name: string; name_secondary: string; goal: string; duration_weeks: number
  current_week: number; start_date: string; end_date: string
}
type LatestCheckin = {
  id: string; checkin_date: string; weight: number | null
  weight_change: number | null; status: string; has_response: boolean
}

const DAY_FULL_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_FULL_RU = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']

export default function ClientHomePage() {
  const { t, locale, langConfig } = useTranslation()
  const { user, profile } = useAuth()
  const ru = locale === langConfig.secondaryLanguage

  const [courses, setCourses] = useState<CourseAccess[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [program, setProgram] = useState<ProgramInfo | null>(null)
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkout | null>(null)
  const [catchupWorkout, setCatchupWorkout] = useState<CatchupWorkout | null>(null)
  const [latestCheckin, setLatestCheckin] = useState<LatestCheckin | null>(null)
  const [checkinCount, setCheckinCount] = useState(0)
  const [loading, setLoading] = useState(true)

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

      // Fetch training data
      try {
        const trainingRes = await fetchWithAuth('/api/client/training')
        if (trainingRes.ok) {
          const tdata = await trainingRes.json()
          if (tdata.program) setProgram(tdata.program)
          if (tdata.today_workout) setTodayWorkout(tdata.today_workout)
          if (tdata.catchup_workout) setCatchupWorkout(tdata.catchup_workout)
        }
      } catch { /* ignore */ }

      // Fetch latest checkin
      try {
        const checkinRes = await fetchWithAuth('/api/checkins')
        if (checkinRes.ok) {
          const cdata = await checkinRes.json()
          const list = cdata.checkins || cdata || []
          setCheckinCount(list.length)
          if (list.length > 0) setLatestCheckin(list[0])
        }
      } catch { /* ignore */ }

      setLoading(false)
    }

    load()
  }, [user])

  const paidOrders = orders.filter(o => o.status === 'paid')
  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || ''
  const dayFull = ru ? DAY_FULL_RU : DAY_FULL_EN

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
  }

  const progressPercent = program ? Math.round((program.current_week / program.duration_weeks) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {t('client.home.welcomeUser').replace('{name}', firstName)} 👋
          </h1>
          <p className="text-zinc-500 mt-1">
            {program
              ? (ru ? `Неделя ${program.current_week} из ${program.duration_weeks}` : `Week ${program.current_week} of ${program.duration_weeks}`)
              : courses.length > 0 ? t('client.home.continueRecovery') : t('client.home.startRecovery')
            }
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Dumbbell, value: program ? `${ru ? 'Нед.' : 'Wk'} ${program.current_week}/${program.duration_weeks}` : '—', label: ru ? 'Программа' : 'Program', color: 'bg-teal-500/10 text-teal-500' },
          { icon: Scale, value: latestCheckin?.weight ? `${latestCheckin.weight} kg` : '—', label: ru ? 'Вес' : 'Weight', color: 'bg-blue-500/10 text-blue-500', sub: latestCheckin?.weight_change },
          { icon: Calendar, value: String(checkinCount), label: ru ? 'Чекинов' : 'Check-ins', color: 'bg-orange-500/10 text-orange-500' },
          { icon: BookOpen, value: String(courses.length), label: ru ? 'Курсов' : 'Courses', color: 'bg-purple-500/10 text-purple-500' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}><CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0`}><Icon className="w-5 h-5" /></div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">{stat.value}</p>
                    {(stat as any).sub != null && (stat as any).sub !== 0 && (
                      <span className={`text-xs flex items-center ${(stat as any).sub < 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {(stat as any).sub > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {(stat as any).sub > 0 ? '+' : ''}{((stat as any).sub).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                </div>
              </div>
            </CardContent></Card>
          )
        })}
      </div>

      {/* Today's workout card */}
      {program && todayWorkout && (
        <Card className="border-2 border-teal-200 dark:border-teal-800 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-teal-500/5 to-emerald-500/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-teal-500" />
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {ru ? 'Сегодня' : 'Today'} — {dayFull[todayWorkout.day_of_week % 7]}
                  </h3>
                </div>
                {todayWorkout.workouts && (
                  <Badge variant="outline">{todayWorkout.workouts.type}</Badge>
                )}
              </div>

              {todayWorkout.is_rest_day ? (
                <div className="flex items-center gap-3 py-4">
                  <Moon className="w-10 h-10 text-indigo-300" />
                  <div>
                    <p className="text-lg font-semibold text-zinc-600 dark:text-zinc-400">{ru ? 'День отдыха' : 'Rest Day'}</p>
                    <p className="text-sm text-zinc-400">{ru ? 'Восстанавливайтесь!' : 'Take it easy!'}</p>
                  </div>
                </div>
              ) : todayWorkout.workouts ? (
                <div>
                  <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {ru ? todayWorkout.workouts.name_secondary || todayWorkout.workouts.name : todayWorkout.workouts.name}
                  </h4>
                  <div className="flex gap-4 text-sm text-zinc-500 mt-1 mb-4">
                    {todayWorkout.workouts.duration_minutes && (
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{todayWorkout.workouts.duration_minutes} {ru ? 'мин' : 'min'}</span>
                    )}
                    <span>{todayWorkout.workouts.workout_exercises?.length || 0} {ru ? 'упражнений' : 'exercises'}</span>
                  </div>
                  <Link href="/client/training">
                    <Button variant="gradient" size="sm">
                      <Play className="w-4 h-4 mr-2" />{ru ? 'Открыть тренировку' : 'Open Workout'}
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-zinc-400 text-sm py-2">{ru ? 'Тренировка не запланирована' : 'No workout scheduled'}</p>
              )}
            </div>

            {/* Program progress mini bar */}
            <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                <span>{ru ? program.name_secondary || program.name : program.name}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missed earlier this week — the server only sends it on a free / rest day */}
      {program && catchupWorkout?.workout && (
        <Card className="border-2 border-amber-200 dark:border-amber-900/60 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {ru ? 'Пропущено на этой неделе' : 'Missed this week'}
              </h3>
              <Badge variant="outline" className="ml-auto">
                {dayFull[catchupWorkout.day_of_week % 7]}
              </Badge>
            </div>
            <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {ru ? catchupWorkout.workout.name_secondary || catchupWorkout.workout.name : catchupWorkout.workout.name}
            </h4>
            <div className="flex gap-4 text-sm text-zinc-500 mt-1 mb-4">
              {catchupWorkout.workout.estimated_duration && (
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{catchupWorkout.workout.estimated_duration} {ru ? 'мин' : 'min'}</span>
              )}
              <span>{catchupWorkout.workout.exercise_count} {ru ? 'упражнений' : 'exercises'}</span>
            </div>
            <Link href="/client/training">
              <Button variant="outline" size="sm">
                <Play className="w-4 h-4 mr-2" />{ru ? 'Наверстать тренировку' : 'Catch up on this workout'}
              </Button>
            </Link>
            <p className="text-xs text-zinc-400 mt-3">
              {ru
                ? 'Можно и не делать — на следующую неделю тренировка не переносится.'
                : 'Optional — it does not carry over into next week.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* No program placeholder */}
      {!program && (
        <Card className="p-8 text-center">
          <Dumbbell className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-zinc-600 dark:text-zinc-400 mb-1">{ru ? 'Программа не назначена' : 'No program assigned'}</h3>
          <p className="text-zinc-400 text-sm">{ru ? 'Ваш тренер назначит программу тренировок' : 'Your trainer will assign a training program'}</p>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Link href="/client/checkins">
          <Card className="card-hover h-full">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Scale className="w-6 h-6 text-blue-500" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{ru ? 'Новый чекин' : 'New Check-in'}</h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {latestCheckin
                    ? `${ru ? 'Последний:' : 'Last:'} ${new Date(latestCheckin.checkin_date).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}`
                    : (ru ? 'Отправьте первый чекин' : 'Submit your first check-in')
                  }
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-300 flex-shrink-0 ml-auto" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/client/training">
          <Card className="card-hover h-full">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                <Dumbbell className="w-6 h-6 text-teal-500" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{ru ? 'Расписание' : 'Schedule'}</h4>
                <p className="text-xs text-zinc-500 mt-0.5">{ru ? 'Смотреть программу' : 'View your program'}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-300 flex-shrink-0 ml-auto" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/client/messages">
          <Card className="card-hover h-full">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-purple-500" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{ru ? 'Сообщения' : 'Messages'}</h4>
                <p className="text-xs text-zinc-500 mt-0.5">{ru ? 'Связаться с тренером' : 'Contact your trainer'}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-300 flex-shrink-0 ml-auto" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* My courses */}
      {courses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('client.courses.title')}</h2>
            <Link href="/client/courses">
              <Button variant="ghost" size="sm">{ru ? 'Все' : 'All'}<ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {courses.map((access) => {
              const meta = coursesMeta[access.course_slug]
              if (!meta) return null
              const Icon = meta.icon
              return (
                <Link key={access.course_slug} href={`/client/courses/${access.course_slug}`}>
                  <Card className="overflow-hidden card-hover h-full">
                    <div className={`h-32 bg-gradient-to-br ${meta.color} flex items-center justify-center relative`}>
                      <Icon className="w-12 h-12 text-white/40" />
                      <Badge className="absolute top-3 left-3 bg-white/90 text-green-600 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />{t('client.home.purchased')}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{ru ? meta.titleSecondary : meta.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-2">
                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{meta.lessons} {t('client.courses.lessons')}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{t('client.home.lifetimeAccess')}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Latest checkin response */}
      {latestCheckin?.has_response && (
        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="p-4 flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-teal-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{ru ? 'Тренер ответил на ваш чекин' : 'Trainer responded to your check-in'}</p>
              <p className="text-xs text-zinc-500">{new Date(latestCheckin.checkin_date).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}</p>
            </div>
            <Link href="/client/checkins" className="ml-auto flex-shrink-0">
              <Button variant="outline" size="sm">{ru ? 'Читать' : 'Read'}</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
