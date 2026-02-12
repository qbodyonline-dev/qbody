'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useTranslation } from '@/lib/i18n'
import { fetchWithAuth } from '@/lib/api'
import {
  Users, TrendingUp, TrendingDown, DollarSign, BookOpen, Download, Loader2,
  BarChart3, ShoppingBag, Trophy, Dumbbell, Scale, Search, ChevronRight,
  Activity, Flag, ArrowLeft, AlertTriangle, Minus
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

/* Merged client view for the list */
type ClientSummary = {
  id: string; name: string
  compliancePct: number | null; programName: string; programNameRu: string
  totalScheduled: number; completed: number; avgRpe: number | null; avgDuration: number | null; lastWorkout: string | null
  totalCheckins: number; checkins30d: number; latestWeight: number | null; weightChange: number | null
  lastCheckinDate: string | null; flaggedCheckins: number; reviewedPct: number
  alert: string | null; alertType: 'warning' | 'danger' | null
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

/* ═══════════ STAT CARD ═══════════ */
function StatCard({ icon: Icon, value, label, sub, color }: { icon: any; value: string; label: string; sub: string; color: string }) {
  return (
    <Card><CardContent className="p-4">
      <div className={`w-9 h-9 rounded-xl mb-2 flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{value}</div>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>
    </CardContent></Card>
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
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

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
  const dayLabels = ru ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const moodEmojis: Record<string, string> = { great: '🔥', good: '💪', ok: '😐', tired: '😴', bad: '😩' }

  const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'

  const daysSince = (iso: string | null) => {
    if (!iso) return 999
    return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
  }

  const formatShortDate = (iso: string | null) => {
    if (!iso) return '—'
    const d = new Date(iso)
    const days = daysSince(iso)
    if (days === 0) return ru ? 'Сегодня' : 'Today'
    if (days === 1) return ru ? 'Вчера' : 'Yesterday'
    if (days < 7) return `${days}${ru ? 'д назад' : 'd ago'}`
    return d.toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })
  }

  /* ═══ Build merged client summaries ═══ */
  const clientSummaries: ClientSummary[] = React.useMemo(() => {
    if (!trainingData) return []
    const map = new Map<string, ClientSummary>()

    for (const c of trainingData.clientCompliance) {
      map.set(c.id, {
        id: c.id, name: c.name,
        compliancePct: c.compliancePct, programName: c.programName, programNameRu: c.programNameRu,
        totalScheduled: c.totalScheduled, completed: c.completed, avgRpe: c.avgRpe, avgDuration: c.avgDuration, lastWorkout: c.lastWorkout,
        totalCheckins: 0, checkins30d: 0, latestWeight: null, weightChange: null,
        lastCheckinDate: null, flaggedCheckins: 0, reviewedPct: 0,
        alert: null, alertType: null,
      })
    }
    for (const c of trainingData.checkinCompliance) {
      const existing = map.get(c.id)
      if (existing) {
        existing.totalCheckins = c.totalCheckins; existing.checkins30d = c.checkins30d
        existing.latestWeight = c.latestWeight; existing.weightChange = c.weightChange
        existing.lastCheckinDate = c.lastCheckinDate; existing.flaggedCheckins = c.flagged; existing.reviewedPct = c.reviewedPct
      } else {
        map.set(c.id, {
          id: c.id, name: c.name,
          compliancePct: null, programName: '', programNameRu: '',
          totalScheduled: 0, completed: 0, avgRpe: null, avgDuration: null, lastWorkout: null,
          totalCheckins: c.totalCheckins, checkins30d: c.checkins30d,
          latestWeight: c.latestWeight, weightChange: c.weightChange,
          lastCheckinDate: c.lastCheckinDate, flaggedCheckins: c.flagged, reviewedPct: c.reviewedPct,
          alert: null, alertType: null,
        })
      }
    }

    // Generate alerts
    const arr = Array.from(map.values())
    for (const c of arr) {
      const inactiveDays = daysSince(c.lastWorkout)
      if (c.compliancePct !== null && c.compliancePct < 40) {
        c.alert = ru ? `Комплаенс ${c.compliancePct}%` : `Compliance ${c.compliancePct}%`
        c.alertType = 'danger'
      } else if (inactiveDays > 7 && c.compliancePct !== null) {
        c.alert = ru ? `Нет тренировок ${inactiveDays}д` : `No workouts ${inactiveDays}d`
        c.alertType = inactiveDays > 14 ? 'danger' : 'warning'
      } else if (c.flaggedCheckins > 0) {
        c.alert = ru ? `${c.flaggedCheckins} чек-ин(ов) ⚑` : `${c.flaggedCheckins} flagged check-in(s)`
        c.alertType = 'warning'
      }
    }

    // Sort: alerts first, then by compliance desc
    arr.sort((a, b) => {
      const aScore = a.alertType === 'danger' ? 2 : a.alertType === 'warning' ? 1 : 0
      const bScore = b.alertType === 'danger' ? 2 : b.alertType === 'warning' ? 1 : 0
      if (aScore !== bScore) return bScore - aScore
      return (b.compliancePct ?? -1) - (a.compliancePct ?? -1)
    })
    return arr
  }, [trainingData, ru])

  const alertClients = clientSummaries.filter(c => c.alertType)
  const filteredClients = clientSummaries.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )
  const selectedClient = selectedClientId ? clientSummaries.find(c => c.id === selectedClientId) : null

  /* ── CSV Export ── */
  const handleExportCSV = () => {
    if (!bizData && !trainingData) return
    const lines: string[] = []
    if (bizData) {
      const m = bizData.metrics
      lines.push('=== BUSINESS METRICS ===')
      lines.push(`Total Clients,${m.totalClients}`, `Active Clients,${m.activeClients}`, `Total Revenue,$${(m.totalRevenue / 100).toFixed(2)}`, '')
    }
    if (trainingData) {
      const m = trainingData.metrics
      lines.push('=== TRAINING METRICS ===')
      lines.push(`Active Programs,${m.activePrograms}`, `Total Workouts,${m.totalWorkoutsCompleted}`, `Avg Compliance,${m.avgCompliancePct}%`, '')
      lines.push('=== CLIENT DETAIL ===')
      lines.push('Client,Program,Compliance %,Workouts,RPE,Weight,Weight Change,Checkins 30d,Flagged')
      for (const c of clientSummaries) {
        lines.push(`"${c.name}","${c.programName}",${c.compliancePct ?? ''},${c.completed}/${c.totalScheduled},${c.avgRpe || ''},${c.latestWeight || ''},${c.weightChange || ''},${c.checkins30d},${c.flaggedCheckins}`)
      }
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `qbody-analytics-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
    toast.success(ru ? 'CSV экспортирован!' : 'CSV exported!')
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>

  /* ═══════════════════════════════════════════
     TRAINING TAB — CLIENT DETAIL VIEW
     ═══════════════════════════════════════════ */
  if (tab === 'training' && selectedClient) {
    const c = selectedClient
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedClientId(null)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><ArrowLeft className="w-5 h-5 text-zinc-500" /></button>
          <Avatar fallback={getInitials(c.name)} size="md" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{c.name}</h1>
            {c.programName && <p className="text-sm text-zinc-500">{ru ? c.programNameRu : c.programName}</p>}
          </div>
          <Link href={`/dashboard/clients/${c.id}`}>
            <Button variant="outline" size="sm">{ru ? 'Профиль' : 'Profile'}</Button>
          </Link>

        </div>

        {/* Alert */}
        {c.alert && (
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${c.alertType === 'danger' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}`}>
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${c.alertType === 'danger' ? 'text-red-500' : 'text-amber-500'}`} />
            <span className={`text-sm font-medium ${c.alertType === 'danger' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>{c.alert}</span>
          </div>
        )}

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Activity} value={c.compliancePct !== null ? `${c.compliancePct}%` : '—'} label={ru ? 'Комплаенс' : 'Compliance'} sub={`${c.completed}/${c.totalScheduled}`} color={c.compliancePct !== null && c.compliancePct >= 80 ? 'bg-green-500/10 text-green-500' : c.compliancePct !== null && c.compliancePct >= 50 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'} />
          <StatCard icon={Scale} value={c.latestWeight ? `${c.latestWeight}kg` : '—'} label={ru ? 'Текущий вес' : 'Current Weight'} sub={c.weightChange !== null ? `${c.weightChange > 0 ? '+' : ''}${c.weightChange}kg` : (ru ? 'нет данных' : 'no data')} color="bg-blue-500/10 text-blue-500" />
          <StatCard icon={Dumbbell} value={c.avgRpe ? `${c.avgRpe}/10` : '—'} label={ru ? 'Средний RPE' : 'Avg RPE'} sub={c.avgDuration ? `~${c.avgDuration}${ru ? 'мин' : 'min'}` : '—'} color="bg-teal-500/10 text-teal-500" />
          <StatCard icon={Flag} value={String(c.totalCheckins)} label={ru ? 'Чек-инов' : 'Check-ins'} sub={`${c.checkins30d} ${ru ? 'за 30д' : 'last 30d'}${c.flaggedCheckins > 0 ? ` · ${c.flaggedCheckins}⚑` : ''}`} color={c.flaggedCheckins > 0 ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'} />
        </div>

        {/* Compliance progress */}
        {c.compliancePct !== null && (
          <Card><CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{ru ? 'Прогресс тренировок' : 'Workout Progress'}</h3>
              <span className="text-xs text-zinc-400">{formatShortDate(c.lastWorkout)} {ru ? '— последняя' : '— last workout'}</span>
            </div>
            <div className="flex items-center gap-3">
              <ComplianceBar value={c.compliancePct} />
              <span className={`text-lg font-bold min-w-[50px] text-right ${c.compliancePct >= 80 ? 'text-green-600' : c.compliancePct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {c.compliancePct}%
              </span>
            </div>
            <div className="flex justify-between mt-2 text-xs text-zinc-400">
              <span>{c.completed} {ru ? 'выполнено' : 'completed'}</span>
              <span>{c.totalScheduled} {ru ? 'запланировано' : 'scheduled'}</span>
            </div>
          </CardContent></Card>
        )}

        {/* Weight trend + Activity summary */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card><CardContent className="p-5">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">{ru ? 'Вес' : 'Weight'}</h3>
            {c.latestWeight ? (
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{c.latestWeight}<span className="text-lg text-zinc-400 ml-1">kg</span></div>
                {c.weightChange !== null && (
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${c.weightChange < 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : c.weightChange > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                    {c.weightChange < 0 ? <TrendingDown className="w-4 h-4" /> : c.weightChange > 0 ? <TrendingUp className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                    <span className="text-sm font-bold">{c.weightChange > 0 ? '+' : ''}{c.weightChange}kg</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-zinc-400 text-sm">{ru ? 'Нет данных о весе' : 'No weight data'}</p>
            )}
            {c.lastCheckinDate && (
              <p className="text-xs text-zinc-400 mt-2">{ru ? 'Последний чек-ин' : 'Last check-in'}: {formatShortDate(c.lastCheckinDate)}</p>
            )}
          </CardContent></Card>

          <Card><CardContent className="p-5">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">{ru ? 'Активность' : 'Activity'}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">{ru ? 'Дней без тренировки' : 'Days since workout'}</span>
                <span className={`text-sm font-bold ${daysSince(c.lastWorkout) > 7 ? 'text-red-500' : daysSince(c.lastWorkout) > 3 ? 'text-amber-500' : 'text-green-500'}`}>
                  {c.lastWorkout ? daysSince(c.lastWorkout) : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">{ru ? 'Чек-ины за 30 дней' : 'Check-ins last 30d'}</span>
                <Badge variant={c.checkins30d >= 4 ? 'success' : c.checkins30d >= 2 ? 'warning' : 'secondary'}>{c.checkins30d}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">{ru ? 'Обработано' : 'Reviewed'}</span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{c.reviewedPct}%</span>
              </div>
              {c.avgRpe && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500">{ru ? 'Средний RPE' : 'Avg RPE'}</span>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{c.avgRpe}/10</span>
                </div>
              )}
            </div>
          </CardContent></Card>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 flex-wrap">
          <Link href={`/dashboard/clients/${c.id}`}><Button variant="outline" size="sm"><Users className="w-4 h-4 mr-1.5" />{ru ? 'Профиль клиента' : 'Client Profile'}</Button></Link>
          <Link href={`/dashboard/checkins`}><Button variant="outline" size="sm"><Scale className="w-4 h-4 mr-1.5" />{ru ? 'Чек-ины' : 'Check-ins'}</Button></Link>
        </div>
      </div>
    )
  }

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
          <button key={t.key} onClick={() => { setTab(t.key); setSelectedClientId(null) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* ═══════════ TRAINING TAB — OVERVIEW ═══════════ */}
      {tab === 'training' && trainingData && !selectedClient && (
        <div className="space-y-6">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={Dumbbell} value={String(trainingData.metrics.totalWorkoutsCompleted)} label={ru ? 'Тренировок' : 'Workouts Done'} sub={`${trainingData.metrics.workoutsLast30d} ${ru ? 'за 30д' : 'last 30d'}`} color="bg-teal-500/10 text-teal-500" />
            <StatCard icon={Activity} value={`${trainingData.metrics.avgCompliancePct}%`} label={ru ? 'Ср. комплаенс' : 'Avg Compliance'} sub={`${trainingData.metrics.activePrograms} ${ru ? 'программ' : 'programs'}`} color="bg-blue-500/10 text-blue-500" />
            <StatCard icon={Scale} value={String(trainingData.metrics.totalCheckins)} label={ru ? 'Чек-инов' : 'Check-ins'} sub={`${trainingData.metrics.newCheckins} ${ru ? 'новых' : 'new'}`} color="bg-orange-500/10 text-orange-500" />
            <StatCard icon={Users} value={String(clientSummaries.length)} label={ru ? 'Клиентов' : 'Clients'} sub={`${alertClients.length} ${ru ? 'требуют внимания' : 'need attention'}`} color={alertClients.length > 0 ? 'bg-red-500/10 text-red-500' : 'bg-zinc-500/10 text-zinc-500'} />
          </div>

          {/* Alerts */}
          {alertClients.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" />{ru ? 'Требуют внимания' : 'Need Attention'} <Badge variant="destructive" className="ml-1">{alertClients.length}</Badge></CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {alertClients.slice(0, 5).map(c => (
                  <button key={c.id} onClick={() => setSelectedClientId(c.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:shadow-sm ${c.alertType === 'danger' ? 'bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 border border-red-100 dark:border-red-900/30' : 'bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30'}`}>
                    <Avatar fallback={getInitials(c.name)} size="sm" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{c.name}</span>
                      <p className={`text-xs ${c.alertType === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>{c.alert}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300 flex-shrink-0" />
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Workouts per week chart */}
          <Card>
            <CardHeader><CardTitle className="text-base">{ru ? 'Тренировок за неделю' : 'Workouts per Week'}</CardTitle></CardHeader>
            <CardContent>
              <BarChart data={trainingData.workoutsPerWeek.map(w => ({ label: w.week, value: w.count }))} color="bg-teal-500" />
            </CardContent>
          </Card>

          {/* Client list */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2"><Users className="w-5 h-5 text-teal-500" />{ru ? 'Клиенты' : 'Clients'}</CardTitle>
                <div className="relative w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder={ru ? 'Поиск...' : 'Search...'} className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs outline-none focus:ring-1 focus:ring-teal-500/30" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredClients.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">{ru ? 'Нет клиентов' : 'No clients'}</div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredClients.map(c => (
                    <button key={c.id} onClick={() => setSelectedClientId(c.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left group">
                      <Avatar fallback={getInitials(c.name)} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{c.name}</span>
                          {c.alertType === 'danger' && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                          {c.alertType === 'warning' && <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />}
                        </div>
                        {c.programName && <p className="text-[11px] text-zinc-400 truncate">{ru ? c.programNameRu : c.programName}</p>}
                      </div>
                      {/* Compliance mini */}
                      {c.compliancePct !== null && (
                        <div className="hidden sm:flex items-center gap-1.5 w-24">
                          <ComplianceBar value={c.compliancePct} size="sm" />
                          <span className={`text-[11px] font-bold min-w-[30px] text-right ${c.compliancePct >= 80 ? 'text-green-600' : c.compliancePct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {c.compliancePct}%
                          </span>
                        </div>
                      )}
                      {/* Weight */}
                      <div className="hidden md:block text-right w-20">
                        {c.latestWeight ? (
                          <>
                            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{c.latestWeight}kg</p>
                            {c.weightChange !== null && (
                              <p className={`text-[10px] ${c.weightChange < 0 ? 'text-green-600' : c.weightChange > 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                                {c.weightChange > 0 ? '+' : ''}{c.weightChange}kg
                              </p>
                            )}
                          </>
                        ) : <span className="text-xs text-zinc-400">—</span>}
                      </div>
                      {/* Last activity */}
                      <span className="text-[11px] text-zinc-400 w-16 text-right hidden lg:block">{formatShortDate(c.lastWorkout || c.lastCheckinDate)}</span>
                      <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-teal-500 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════ BUSINESS TAB ═══════════ */}
      {tab === 'business' && bizData && (
        <div className="space-y-6">
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

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">{ru ? 'Рост клиентов' : 'Client Growth'}</CardTitle></CardHeader>
              <CardContent><BarChart data={bizData.clientGrowth.map(d => ({ label: d.month, value: d.value }))} color="bg-teal-500" /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">{ru ? 'Выручка' : 'Revenue'}</CardTitle></CardHeader>
              <CardContent><BarChart data={bizData.revenueByMonth.map(d => ({ label: d.month, value: d.value }))} color="bg-green-500" formatValue={(v) => v > 0 ? `$${(v / 100).toFixed(0)}` : '0'} /></CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-teal-500" />{ru ? 'Продажи курсов' : 'Course Sales'}</CardTitle></CardHeader>
              <CardContent>
                {bizData.courseSales.length === 0 ? <div className="text-center py-8 text-zinc-400">{ru ? 'Нет продаж' : 'No sales'}</div> : (
                  <div className="space-y-3">{bizData.courseSales.map((c, i) => (
                    <div key={c.slug} className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-teal-500/10 text-teal-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{ru ? c.titleRu : c.title}</p><p className="text-xs text-zinc-500">{c.count} {ru ? 'продаж' : 'sales'}</p></div>
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{fmtMoney(c.revenue)}</span>
                    </div>
                  ))}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" />{ru ? 'Прогресс' : 'Progress'}</CardTitle></CardHeader>
              <CardContent>
                {bizData.topClients.length === 0 ? <div className="text-center py-8 text-zinc-400">{ru ? 'Нет данных' : 'No data'}</div> : (
                  <div className="space-y-3">{bizData.topClients.map(c => (
                    <div key={c.id} className="flex items-center gap-3">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400 w-24 truncate">{c.name}</span>
                      <ComplianceBar value={c.completionPct} />
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 w-10 text-right">{c.completionPct}%</span>
                    </div>
                  ))}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-500" />{ru ? 'Последние продажи' : 'Recent Sales'}</CardTitle></CardHeader>
              <CardContent>
                {bizData.recentOrders.length === 0 ? <div className="text-center py-8 text-zinc-400">{ru ? 'Нет продаж' : 'No sales'}</div> : (
                  <div className="space-y-3">{bizData.recentOrders.map(o => (
                    <div key={o.id} className="flex items-center gap-3 text-sm">
                      <div className="flex-1 min-w-0"><p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{o.clientName}</p><p className="text-xs text-zinc-500 truncate">{ru ? o.courseTitleRu : o.courseTitle}</p></div>
                      <div className="text-right flex-shrink-0"><p className="font-bold text-zinc-900 dark:text-zinc-100">{fmtMoney(o.amount)}</p>{o.paidAt && <p className="text-xs text-zinc-400">{new Date(o.paidAt).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' })}</p>}</div>
                    </div>
                  ))}</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === 'training' && !trainingData && (
        <div className="text-center py-20"><Dumbbell className="w-12 h-12 text-zinc-300 mx-auto mb-4" /><p className="text-zinc-500">{ru ? 'Нет данных о тренировках' : 'No training data available'}</p></div>
      )}
      {tab === 'business' && !bizData && (
        <div className="text-center py-20"><BarChart3 className="w-12 h-12 text-zinc-300 mx-auto mb-4" /><p className="text-zinc-500">{ru ? 'Нет бизнес-данных' : 'No business data available'}</p></div>
      )}
    </div>
  )
}
