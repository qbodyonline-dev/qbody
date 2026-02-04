'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useTranslation } from '@/lib/i18n'
import { 
  Users, DollarSign, TrendingUp, ClipboardCheck, ArrowRight, ArrowUpRight, 
  AlertCircle, Clock, CheckCircle2, Eye, MessageSquare, CreditCard, 
  Dumbbell, UserPlus, Calendar, ChevronRight, Flame, Check
} from 'lucide-react'

const stats = [
  { key: 'activeClients', value: '24', change: '+3', icon: Users, color: 'bg-teal-500' },
  { key: 'monthlyRevenue', value: '$2,450', change: '+12%', icon: DollarSign, color: 'bg-green-500' },
  { key: 'compliance', value: '87%', change: '+5%', icon: TrendingUp, color: 'bg-purple-500' },
  { key: 'pendingReview', value: '8', change: '-2', icon: ClipboardCheck, color: 'bg-orange-500' },
]

type Task = {
  id: string
  type: 'reviewCheckin' | 'unansweredMessage' | 'expiringSubscription' | 'inactiveClient' | 'missedWorkout' | 'newClient'
  client: string
  initials: string
  detail: string
  detailRu: string
  time: string
  timeRu: string
  urgent: boolean
  href: string
  actionKey: 'review' | 'reply' | 'remind' | 'assign' | 'view'
}

const tasks: Task[] = [
  { id: '1', type: 'reviewCheckin', client: 'Olga V.', initials: 'OV', detail: 'Weight: 68.5kg (−0.3)', detailRu: 'Вес: 68.5кг (−0.3)', time: '30 min ago', timeRu: '30 мин назад', urgent: true, href: '/dashboard/checkins/1', actionKey: 'review' },
  { id: '2', type: 'reviewCheckin', client: 'Svetlana M.', initials: 'SM', detail: 'Weight: 72.1kg (−0.5)', detailRu: 'Вес: 72.1кг (−0.5)', time: '2h ago', timeRu: '2ч назад', urgent: true, href: '/dashboard/checkins/2', actionKey: 'review' },
  { id: '3', type: 'unansweredMessage', client: 'Anna K.', initials: 'AK', detail: 'Question about nutrition', detailRu: 'Вопрос по питанию', time: '3h ago', timeRu: '3ч назад', urgent: true, href: '/dashboard/messages', actionKey: 'reply' },
  { id: '4', type: 'expiringSubscription', client: 'Elena P.', initials: 'EP', detail: 'Premium — expires in 3 days', detailRu: 'Премиум — истекает через 3 дня', time: '3 days', timeRu: '3 дня', urgent: false, href: '/dashboard/clients/3', actionKey: 'remind' },
  { id: '5', type: 'inactiveClient', client: 'Irina K.', initials: 'IK', detail: 'No activity for 5 days', detailRu: 'Нет активности 5 дней', time: '5 days', timeRu: '5 дней', urgent: false, href: '/dashboard/clients/1', actionKey: 'remind' },
  { id: '6', type: 'missedWorkout', client: 'Maria S.', initials: 'MS', detail: 'Skipped "Lower Body" workout', detailRu: 'Пропустила тренировку «Низ тела»', time: 'Yesterday', timeRu: 'Вчера', urgent: false, href: '/dashboard/clients/2', actionKey: 'remind' },
]

const topClients = [
  { id: 1, name: 'Anna K.', progress: 92, initials: 'AK' },
  { id: 2, name: 'Maria S.', progress: 88, initials: 'MS' },
  { id: 3, name: 'Elena P.', progress: 85, initials: 'EP' },
]

const todaySchedule = [
  { id: '1', time: '09:00', client: 'Anna K.', type: 'session', typeRu: 'Сессия' },
  { id: '2', time: '11:00', client: 'Olga V.', type: 'session', typeRu: 'Сессия' },
  { id: '3', time: '14:00', client: 'Maria S.', type: 'checkin', typeRu: 'Дедлайн чек-ина' },
  { id: '4', time: '17:00', client: 'Elena P.', type: 'session', typeRu: 'Сессия' },
]

const taskIcons: Record<string, any> = {
  reviewCheckin: ClipboardCheck,
  unansweredMessage: MessageSquare,
  expiringSubscription: CreditCard,
  inactiveClient: Clock,
  missedWorkout: Dumbbell,
  newClient: UserPlus,
}

const taskColors: Record<string, string> = {
  reviewCheckin: 'bg-blue-100 text-blue-600',
  unansweredMessage: 'bg-purple-100 text-purple-600',
  expiringSubscription: 'bg-orange-100 text-orange-600',
  inactiveClient: 'bg-zinc-100 text-zinc-600',
  missedWorkout: 'bg-red-100 text-red-600',
  newClient: 'bg-green-100 text-green-600',
}

export default function DashboardPage() {
  const { t, locale } = useTranslation()
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())

  const toggleTask = (id: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const pendingTasks = tasks.filter(task => !completedTasks.has(task.id))
  const urgentCount = pendingTasks.filter(t => t.urgent).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{t('dashboard.title')}</h1>
          <p className="text-zinc-500 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/calendar"><Button variant="outline"><Calendar className="w-4 h-4 mr-2" />{t('dashboard.schedule')}</Button></Link>
          <Link href="/dashboard/clients"><Button variant="gradient"><UserPlus className="w-4 h-4 mr-2" />{t('dashboard.addClient')}</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.key}><CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">{t(`dashboard.stats.${stat.key}`)}</p>
                  <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-green-500"><ArrowUpRight className="w-4 h-4" />{stat.change}</div>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center`}><Icon className="w-6 h-6 text-white" /></div>
              </div>
            </CardContent></Card>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Task Inbox — 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">{t('dashboard.tasksToday')}</CardTitle>
              {urgentCount > 0 && <Badge variant="destructive" className="animate-pulse">{urgentCount} {locale === 'ru' ? 'срочных' : 'urgent'}</Badge>}
            </div>
            <p className="text-sm text-zinc-500">{pendingTasks.length} {locale === 'ru' ? 'задач' : 'tasks'}</p>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8 text-green-500" /></div>
                <p className="text-zinc-500">{t('dashboard.noTasks')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const isDone = completedTasks.has(task.id)
                  const Icon = taskIcons[task.type]
                  const colorClass = taskColors[task.type]
                  return (
                    <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${isDone ? 'opacity-40 bg-zinc-50' : task.urgent ? 'bg-red-50/50 border border-red-100 hover:border-red-200' : 'bg-zinc-50 hover:bg-zinc-100'}`}>
                      {/* Complete checkbox */}
                      <button onClick={() => toggleTask(task.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isDone ? 'bg-green-500 border-green-500' : 'border-zinc-300 hover:border-teal-500'}`}>
                        {isDone && <Check className="w-4 h-4 text-white" />}
                      </button>

                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium text-zinc-900 ${isDone ? 'line-through' : ''}`}>{t(`dashboard.taskTypes.${task.type}`)}</span>
                          {task.urgent && !isDone && <Flame className="w-4 h-4 text-red-500" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Avatar fallback={task.initials} size="xs" />
                          <span className="text-sm text-zinc-600">{task.client}</span>
                          <span className="text-xs text-zinc-400">•</span>
                          <span className="text-xs text-zinc-400 truncate">{locale === 'ru' ? task.detailRu : task.detail}</span>
                        </div>
                      </div>

                      {/* Time + Action */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-zinc-400 hidden sm:block">{locale === 'ru' ? task.timeRu : task.time}</span>
                        {!isDone && (
                          <Link href={task.href}>
                            <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                              {t(`dashboard.taskActions.${task.actionKey}`)}<ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right sidebar — Schedule + Top Compliance */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{t('dashboard.schedule')}</CardTitle>
              <Link href="/dashboard/calendar"><Button variant="ghost" size="sm">{t('common.viewAll')}<ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-0">
                {todaySchedule.map((event, i) => (
                  <div key={event.id} className="flex gap-3 pb-4 relative">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${event.type === 'checkin' ? 'bg-orange-400' : 'bg-teal-400'}`} />
                      {i < todaySchedule.length - 1 && <div className="w-px flex-1 bg-zinc-200 mt-1" />}
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-900 text-sm">{event.time}</span>
                        <Badge variant={event.type === 'checkin' ? 'warning' : 'secondary'} className="text-xs">
                          {locale === 'ru' ? event.typeRu : event.type === 'checkin' ? t('calendar.eventTypes.checkin') : t('calendar.eventTypes.session')}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-500 mt-0.5">{event.client}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Compliance */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-lg">{t('dashboard.topCompliance')}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topClients.map((client, index) => (
                  <div key={client.id} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-400 w-4">{index + 1}</span>
                    <Avatar fallback={client.initials} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 truncate">{client.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-zinc-200 rounded-full"><div className="h-full bg-teal-500 rounded-full" style={{ width: `${client.progress}%` }} /></div>
                        <span className="text-xs font-medium text-teal-500">{client.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Check-ins */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">{t('dashboard.recentCheckins')}</CardTitle>
          <Link href="/dashboard/checkins"><Button variant="ghost" size="sm">{t('dashboard.allCheckins')}<ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-zinc-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500">{t('dashboard.client')}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500">{t('common.time')}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500">{t('dashboard.weight')}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500">{t('dashboard.change')}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500">{t('common.status')}</th>
                <th className="text-right py-3 px-4"></th>
              </tr></thead>
              <tbody>
                {[
                  { id: 1, client: 'Olga V.', initials: 'OV', time: `${t('dashboard.timeAgo.today')}, 10:30`, weight: 68.5, weightChange: -0.3, status: 'new' },
                  { id: 2, client: 'Svetlana M.', initials: 'SM', time: `${t('dashboard.timeAgo.yesterday')}, 18:45`, weight: 72.1, weightChange: -0.5, status: 'new' },
                  { id: 3, client: 'Irina K.', initials: 'IK', time: `${t('dashboard.timeAgo.yesterday')}, 14:20`, weight: 65.0, weightChange: 0, status: 'processed' },
                ].map((c) => (
                  <tr key={c.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="py-3 px-4"><div className="flex items-center gap-3"><Avatar fallback={c.initials} size="sm" /><span className="font-medium text-zinc-900">{c.client}</span></div></td>
                    <td className="py-3 px-4 text-sm text-zinc-500">{c.time}</td>
                    <td className="py-3 px-4 font-medium text-zinc-900">{c.weight} kg</td>
                    <td className="py-3 px-4"><span className={`text-sm font-medium ${c.weightChange < 0 ? 'text-green-500' : c.weightChange > 0 ? 'text-red-500' : 'text-zinc-500'}`}>{c.weightChange > 0 ? '+' : ''}{c.weightChange} kg</span></td>
                    <td className="py-3 px-4">{c.status === 'new' ? <Badge>{t('dashboard.new')}</Badge> : <Badge variant="secondary"><CheckCircle2 className="w-3 h-3 mr-1" />{t('dashboard.processed')}</Badge>}</td>
                    <td className="py-3 px-4 text-right"><Link href={`/dashboard/checkins/${c.id}`}><Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
