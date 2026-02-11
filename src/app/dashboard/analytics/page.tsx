'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { fetchWithAuth } from '@/lib/api'
import {
  Users, TrendingUp, TrendingDown, DollarSign, BookOpen, Download, Loader2,
  BarChart3, ShoppingBag, Trophy, Dumbbell, Scale,
  Activity, Flag
} from 'lucide-react'
import { toast } from 'sonner'

/* ═══════════ TYPES ═══════════ */
type BizMetrics = {
  totalClients: number; activeClients: number; totalRevenue: number
  avgCompletion: number; clientGrowthPct: number; revenueGrowthPct: number
  clientsThisMonth: number; revenueThisMonth: number; paidOrdersCount: number
}
type ChartPoint = { month: string; value: number }
type CourseSale = { slug: string; title: string; titleRu: string; count: number; revenue: number }
type TopClient = { id: string; name: string; completionPct: number }
type RecentOrder = { id: string; clientName: string; courseTitle: string; courseTitleRu: string; amount: number; paidAt: string | null }
type BizData = { metrics: BizMetrics; clientGrowth: ChartPoint[]; revenueByMonth: ChartPoint[]; courseSales: CourseSale[]; topClients: TopClient[]; recentOrders: RecentOrder[] }

type TrainingMetrics = {
  activePrograms: number; totalWorkoutsCompleted: number; workoutsLast30d: number
  avgCompliancePct: number; totalCheckins: number; newCheckins: number; flaggedCheckins: number
}
type ClientCompliance = {
  id: string; name: string; programName: string; programNameRu: string
  totalScheduled: number; completed: number; compliancePct: number
  avgRpe: number | null; avgDuration: number | null; lastWorkout: string | null
}
type CheckinCompliance = {
  id: string; name: string; totalCheckins: number; checkins30d: number
  latestWeight: number | null; weightChange: number | null
  lastCheckinDate: string | null; flagged: number; reviewedPct: number
}
type TrainingData = {
  metrics: TrainingMetrics; clientCompliance: ClientCompliance[]
  checkinCompliance: CheckinCompliance[]; workoutsPerWeek: { week: string; count: number }[]
  dayOfWeekCounts: number[]; moodCounts: Record<string, number>
}

/* ═══════════ SIMPLE BAR CHART ═══════════ */
function BarChart({ data, color = 'bg-teal-500', formatValue }: {
  data: { label: string; value: number }[]; color?: string; formatValue?: (v: number) => string
}) {
  const maxVal = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((item) => (
        <div key={item.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-zinc-500">{formatValue ? formatValue(item.value) : item.value}</span>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-t-lg relative" style={{ height: '100%' }}>
            <div className={`absolute bottom-0 left-0 right-0 ${color} rounded-t-lg transition-all duration-500`}
              style={{ height: `${(item.value / maxVal) * 100}%`, minHeight: item.value > 0 ? '4px' : '0' }} />
          </div>
          <span className="text-[10px] text-zinc-400">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ═══════════ COMPLIANCE BAR ═══════════ */
function ComplianceBar({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  const h = size === 'sm' ? 'h-1.5' : 'h-2'
  return (
    <div className={`flex-1 ${h} bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden`}>
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
    </div>
  )
}

/* ═══════════ MAIN PAGE ═══════════ */
export default function AnalyticsPage() {
  const { locale } = useTranslation()
  const ru = locale === 'ru'
  const [tab, setTab] = useState<'business' | 'training'>('training')
  const [bizData, setBizData] = useState<BizData | null>(null)
  const [trainingData, setTrainingData] = useState<TrainingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [bizRes, trainRes] = await Promise.all([
          fetchWithAuth('/api/analytics'),
          fetchWithAuth('/api/analytics/training'),
        ])
        if (bizRes.ok) setBizData(await bizRes.json())
        if (trainRes.ok) setTrainingData(await trainRes.json())
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const fmtMoney = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const fmtPct = (v: number) => `${v > 0 ? '+' : ''}${v}%`

  /* ── CSV Export ── */
  const handleExportCSV = () => {
    if (!bizData && !trainingData) return
    const lines: string[] = []

    if (bizData) {
      const m = bizData.metrics
      lines.push('=== BUSINESS METRICS ===')
      lines.push(`Total Clients,${m.totalClients}`)
      lines.push(`Active Clients,${m.activeClients}`)
      lines.push(`Total Revenue,$${(m.totalRevenue / 100).toFixed(2)}`)
      lines.push(`Avg Completion,${m.avgCompletion}%`)
      lines.push('')
    }

    if (trainingData) {
      const m = trainingData.metrics
      lines.push('=== TRAINING METRICS ===')
      lines.push(`Active Programs,${m.activePrograms}`)
      lines.push(`Total Workouts,${m.totalWorkoutsCompleted}`)
      lines.push(`Avg Compliance,${m.avgCompliancePct}%`)
      lines.push(`Total Checkins,${m.totalCheckins}`)
      lines.push('')

      lines.push('=== WORKOUT COMPLIANCE ===')
      lines.push('Client,Program,Scheduled,Completed,Compliance %,Avg RPE,Avg Duration')
      trainingData.clientCompliance.forEach(c =>
        lines.push(`"${c.name}","${c.programName}",${c.totalScheduled},${c.completed},${c.compliancePct}%,${c.avgRpe || ''},${c.avgDuration || ''}`)
      )
      lines.push('')

      lines.push('=== CHECKIN COMPLIANCE ===')
      lines.push('Client,Total,Last 30d,Weight,Change,Flagged,Reviewed %')
      trainingData.checkinCompliance.forEach(c =>
        lines.push(`"${c.name}",${c.totalCheckins},${c.checkins30d},${c.latestWeight || ''},${c.weightChange || ''},${c.flagged},${c.reviewedPct}%`)
      )
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `qbody-analytics-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
    toast.success(ru ? 'CSV экспортирован!' : 'CSV exported!')
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
  }

  const dayLabels = ru ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const moodEmojis: Record<string, string> = { great: '🔥', good: '💪', ok: '😐', tired: '😴', bad: '😩' }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{ru ? 'Аналитика' : 'Analytics'}</h1>
          <p className="text-zinc-500 mt-1">{ru ? 'Обзор ключевых показателей' : 'Key metrics overview'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />{ru ? 'Экспорт CSV' : 'Export CSV'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 w-fit">
        {([
          { key: 'training' as const, label: ru ? 'Тренировки' : 'Training', icon: Dumbbell },
          { key: 'business' as const, label: ru ? 'Бизнес' : 'Business', icon: DollarSign },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* ═══════════ TRAINING TAB ═══════════ */}
      {tab === 'training' && trainingData && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Dumbbell, value: String(trainingData.metrics.totalWorkoutsCompleted), label: ru ? 'Тренировок' : 'Workouts Done', sub: `${trainingData.metrics.workoutsLast30d} ${ru ? 'за 30д' : 'last 30d'}`, color: 'bg-teal-500/10 text-teal-500' },
              { icon: Activity, value: `${trainingData.metrics.avgCompliancePct}%`, label: ru ? 'Средний комплаенс' : 'Avg Compliance', sub: `${trainingData.metrics.activePrograms} ${ru ? 'программ' : 'programs'}`, color: 'bg-blue-500/10 text-blue-500' },
              { icon: Scale, value: String(trainingData.metrics.totalCheckins), label: ru ? 'Чекинов' : 'Check-ins', sub: `${trainingData.metrics.newCheckins} ${ru ? 'новых' : 'new'}`, color: 'bg-orange-500/10 text-orange-500' },
              { icon: Flag, value: String(trainingData.metrics.flaggedCheckins), label: ru ? 'Флагов' : 'Flagged', sub: ru ? 'требуют внимания' : 'need attention', color: trainingData.metrics.flaggedCheckins > 0 ? 'bg-red-500/10 text-red-500' : 'bg-zinc-500/10 text-zinc-500' },
            ].map((m) => {
              const Icon = m.icon
              return (
                <Card key={m.label}><CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${m.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{m.value}</div>
                  <p className="text-sm text-zinc-500 mt-0.5">{m.label}</p>
                  <p className="text-xs text-zinc-400 mt-1">{m.sub}</p>
                </CardContent></Card>
              )
            })}
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Workouts per week */}
            <Card>
              <CardHeader><CardTitle className="text-base">{ru ? 'Тренировок за неделю' : 'Workouts per Week'}</CardTitle></CardHeader>
              <CardContent>
                <BarChart data={trainingData.workoutsPerWeek.map(w => ({ label: w.week, value: w.count }))} color="bg-teal-500" />
              </CardContent>
            </Card>

            {/* Day of week + Mood */}
            <Card>
              <CardHeader><CardTitle className="text-base">{ru ? 'Популярные дни и настроение' : 'Popular Days & Mood'}</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-xs text-zinc-500 mb-2">{ru ? 'По дням недели' : 'By day of week'}</p>
                  <div className="flex gap-2">
                    {trainingData.dayOfWeekCounts.map((count, i) => {
                      const max = Math.max(...trainingData.dayOfWeekCounts, 1)
                      return (
                        <div key={i} className="flex-1 text-center">
                          <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg relative mb-1">
                            <div className="absolute bottom-0 left-0 right-0 bg-blue-400 dark:bg-blue-500 rounded-lg transition-all"
                              style={{ height: `${(count / max) * 100}%`, minHeight: count > 0 ? '4px' : '0' }} />
                          </div>
                          <span className="text-[10px] text-zinc-400">{dayLabels[i]}</span>
                          <p className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400">{count}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-2">{ru ? 'Настроение' : 'Mood'}</p>
                  <div className="flex gap-3">
                    {Object.entries(trainingData.moodCounts).map(([mood, count]) => (
                      <div key={mood} className="flex-1 text-center bg-zinc-50 dark:bg-zinc-800/50 rounded-xl py-2">
                        <span className="text-lg">{moodEmojis[mood]}</span>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workout compliance table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-teal-500" />
                {ru ? 'Комплаенс тренировок' : 'Workout Compliance'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trainingData.clientCompliance.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">{ru ? 'Нет активных программ' : 'No active programs'}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500">{ru ? 'Клиент' : 'Client'}</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500 hidden sm:table-cell">{ru ? 'Программа' : 'Program'}</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-zinc-500">{ru ? 'Комплаенс' : 'Compliance'}</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-zinc-500 hidden md:table-cell">RPE</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-zinc-500 hidden md:table-cell">{ru ? 'Длит.' : 'Dur.'}</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-zinc-500">{ru ? 'Послед.' : 'Last'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainingData.clientCompliance.map(c => (
                        <tr key={c.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="py-3 px-3">
                            <Link href={`/dashboard/clients/${c.id}`} className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-teal-500">{c.name}</Link>
                          </td>
                          <td className="py-3 px-3 hidden sm:table-cell">
                            <span className="text-xs text-zinc-500 truncate max-w-[150px] block">{ru ? c.programNameRu : c.programName}</span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2 justify-center">
                              <ComplianceBar value={c.compliancePct} size="sm" />
                              <span className={`text-xs font-bold min-w-[36px] text-right ${c.compliancePct >= 80 ? 'text-green-600' : c.compliancePct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {c.compliancePct}%
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-400 text-center mt-0.5">{c.completed}/{c.totalScheduled}</p>
                          </td>
                          <td className="py-3 px-3 text-center hidden md:table-cell">
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">{c.avgRpe ? `${c.avgRpe}/10` : '—'}</span>
                          </td>
                          <td className="py-3 px-3 text-center hidden md:table-cell">
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">{c.avgDuration ? `${c.avgDuration}m` : '—'}</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="text-xs text-zinc-400">
                              {c.lastWorkout ? new Date(c.lastWorkout).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' }) : '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Checkin compliance table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-500" />
                {ru ? 'Комплаенс чекинов' : 'Check-in Compliance'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trainingData.checkinCompliance.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">{ru ? 'Нет данных' : 'No data'}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500">{ru ? 'Клиент' : 'Client'}</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-zinc-500">{ru ? 'Всего' : 'Total'}</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-zinc-500">30d</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-zinc-500">{ru ? 'Вес' : 'Weight'}</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-zinc-500 hidden sm:table-cell">{ru ? 'Изм.' : 'Change'}</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-zinc-500 hidden md:table-cell">{ru ? 'Просм.' : 'Rev.'}</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-zinc-500">{ru ? 'Послед.' : 'Last'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainingData.checkinCompliance.map(c => (
                        <tr key={c.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <Link href={`/dashboard/clients/${c.id}`} className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-teal-500">{c.name}</Link>
                              {c.flagged > 0 && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">⚑ {c.flagged}</Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center text-sm text-zinc-600 dark:text-zinc-400">{c.totalCheckins}</td>
                          <td className="py-3 px-3 text-center">
                            <Badge variant={c.checkins30d >= 4 ? 'success' : c.checkins30d >= 2 ? 'warning' : 'secondary'} className="text-xs">
                              {c.checkins30d}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-center text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {c.latestWeight ? `${c.latestWeight}kg` : '—'}
                          </td>
                          <td className="py-3 px-3 text-center hidden sm:table-cell">
                            {c.weightChange !== null ? (
                              <span className={`text-xs font-medium flex items-center justify-center gap-0.5 ${c.weightChange < 0 ? 'text-green-600' : c.weightChange > 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                                {c.weightChange < 0 ? <TrendingDown className="w-3 h-3" /> : c.weightChange > 0 ? <TrendingUp className="w-3 h-3" /> : null}
                                {c.weightChange > 0 ? '+' : ''}{c.weightChange}kg
                              </span>
                            ) : <span className="text-xs text-zinc-400">—</span>}
                          </td>
                          <td className="py-3 px-3 text-center hidden md:table-cell">
                            <span className="text-xs text-zinc-500">{c.reviewedPct}%</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="text-xs text-zinc-400">
                              {c.lastCheckinDate ? new Date(c.lastCheckinDate).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' }) : '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════ BUSINESS TAB ═══════════ */}
      {tab === 'business' && bizData && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: ru ? 'Всего клиентов' : 'Total Clients', value: String(bizData.metrics.totalClients), change: fmtPct(bizData.metrics.clientGrowthPct), positive: bizData.metrics.clientGrowthPct >= 0, icon: Users, sub: `+${bizData.metrics.clientsThisMonth} ${ru ? 'за месяц' : 'this month'}` },
              { label: ru ? 'Активные' : 'Active', value: String(bizData.metrics.activeClients), change: bizData.metrics.totalClients > 0 ? `${Math.round((bizData.metrics.activeClients / bizData.metrics.totalClients) * 100)}%` : '0%', positive: true, icon: TrendingUp, sub: ru ? 'с курсами' : 'with courses' },
              { label: ru ? 'Выручка' : 'Revenue', value: fmtMoney(bizData.metrics.totalRevenue), change: fmtPct(bizData.metrics.revenueGrowthPct), positive: bizData.metrics.revenueGrowthPct >= 0, icon: DollarSign, sub: `${bizData.metrics.paidOrdersCount} ${ru ? 'продаж' : 'sales'}` },
              { label: ru ? 'Прохождение' : 'Completion', value: `${bizData.metrics.avgCompletion}%`, change: '', positive: true, icon: BookOpen, sub: ru ? 'уроков' : 'lessons' },
            ].map((m) => {
              const Icon = m.icon
              return (
                <Card key={m.label}><CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center"><Icon className="w-5 h-5 text-teal-500" /></div>
                    {m.change && <Badge className={`text-xs ${m.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} border-0`}>{m.change}</Badge>}
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{m.value}</div>
                  <p className="text-sm text-zinc-500 mt-0.5">{m.label}</p>
                  <p className="text-xs text-zinc-400 mt-1">{m.sub}</p>
                </CardContent></Card>
              )
            })}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">{ru ? 'Рост клиентов' : 'Client Growth'}</CardTitle></CardHeader>
              <CardContent>
                <BarChart data={bizData.clientGrowth.map(d => ({ label: d.month, value: d.value }))} color="bg-teal-500" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">{ru ? 'Выручка' : 'Revenue'}</CardTitle></CardHeader>
              <CardContent>
                <BarChart data={bizData.revenueByMonth.map(d => ({ label: d.month, value: d.value }))} color="bg-green-500" formatValue={(v) => v > 0 ? `$${(v / 100).toFixed(0)}` : '0'} />
              </CardContent>
            </Card>
          </div>

          {/* Bottom row */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-teal-500" />{ru ? 'Продажи курсов' : 'Course Sales'}</CardTitle></CardHeader>
              <CardContent>
                {bizData.courseSales.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400">{ru ? 'Нет продаж' : 'No sales'}</div>
                ) : (
                  <div className="space-y-3">
                    {bizData.courseSales.map((c, i) => (
                      <div key={c.slug} className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-teal-500/10 text-teal-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{ru ? c.titleRu : c.title}</p>
                          <p className="text-xs text-zinc-500">{c.count} {ru ? 'продаж' : 'sales'}</p>
                        </div>
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{fmtMoney(c.revenue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" />{ru ? 'Прогресс' : 'Progress'}</CardTitle></CardHeader>
              <CardContent>
                {bizData.topClients.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400">{ru ? 'Нет данных' : 'No data'}</div>
                ) : (
                  <div className="space-y-3">
                    {bizData.topClients.map(c => (
                      <div key={c.id} className="flex items-center gap-3">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400 w-24 truncate">{c.name}</span>
                        <ComplianceBar value={c.completionPct} />
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 w-10 text-right">{c.completionPct}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-500" />{ru ? 'Последние продажи' : 'Recent Sales'}</CardTitle></CardHeader>
              <CardContent>
                {bizData.recentOrders.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400">{ru ? 'Нет продаж' : 'No sales'}</div>
                ) : (
                  <div className="space-y-3">
                    {bizData.recentOrders.map(o => (
                      <div key={o.id} className="flex items-center gap-3 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{o.clientName}</p>
                          <p className="text-xs text-zinc-500 truncate">{ru ? o.courseTitleRu : o.courseTitle}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">{fmtMoney(o.amount)}</p>
                          {o.paidAt && <p className="text-xs text-zinc-400">{new Date(o.paidAt).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' })}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* No data fallback */}
      {tab === 'training' && !trainingData && (
        <div className="text-center py-20">
          <Dumbbell className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500">{ru ? 'Нет данных о тренировках' : 'No training data available'}</p>
        </div>
      )}
      {tab === 'business' && !bizData && (
        <div className="text-center py-20">
          <BarChart3 className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500">{ru ? 'Нет бизнес-данных' : 'No business data available'}</p>
        </div>
      )}
    </div>
  )
}
