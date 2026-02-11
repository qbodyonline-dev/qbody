'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { fetchWithAuth } from '@/lib/api'
import { Users, TrendingUp, DollarSign, BookOpen, Download, Loader2, BarChart3, ShoppingBag, Trophy } from 'lucide-react'
import { toast } from 'sonner'

/* ═══════════ TYPES ═══════════ */
type Metrics = {
  totalClients: number
  activeClients: number
  totalRevenue: number
  avgCompletion: number
  clientGrowthPct: number
  revenueGrowthPct: number
  clientsThisMonth: number
  revenueThisMonth: number
  paidOrdersCount: number
}

type ChartPoint = { month: string; value: number }
type CourseSale = { slug: string; title: string; titleRu: string; count: number; revenue: number }
type TopClient = { id: string; name: string; completionPct: number }
type RecentOrder = { id: string; clientName: string; courseTitle: string; courseTitleRu: string; amount: number; paidAt: string | null }

type AnalyticsData = {
  metrics: Metrics
  clientGrowth: ChartPoint[]
  revenueByMonth: ChartPoint[]
  courseSales: CourseSale[]
  topClients: TopClient[]
  recentOrders: RecentOrder[]
}

/* ═══════════ BAR CHART ═══════════ */
function BarChart({ data, color = 'bg-teal-500', formatValue }: {
  data: { label: string; value: number }[]
  color?: string
  formatValue?: (v: number) => string
}) {
  const maxVal = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-3 h-48">
      {data.map((item) => (
        <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-zinc-600">{formatValue ? formatValue(item.value) : item.value}</span>
          <div className="w-full bg-zinc-100 rounded-t-lg relative" style={{ height: '100%' }}>
            <div
              className={`absolute bottom-0 left-0 right-0 ${color} rounded-t-lg transition-all duration-500`}
              style={{ height: `${(item.value / maxVal) * 100}%`, minHeight: item.value > 0 ? '4px' : '0' }}
            />
          </div>
          <span className="text-xs text-zinc-500">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ═══════════ HORIZONTAL BAR ═══════════ */
function HorizontalBar({ label, value, max, color = 'bg-teal-500' }: { label: string; value: number; max: number; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-600 w-28 truncate" title={label}>{label}</span>
      <div className="flex-1 h-6 bg-zinc-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
      </div>
      <span className="text-sm font-medium text-zinc-900 w-12 text-right">{value}%</span>
    </div>
  )
}

/* ═══════════ MAIN PAGE ═══════════ */
export default function AnalyticsPage() {
  const { t, locale } = useTranslation()
  const ru = locale === 'ru'
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth('/api/analytics')
        if (!res.ok) throw new Error('Failed')
        const json = await res.json()
        setData(json)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  /* ── CSV Export ── */
  const handleExportCSV = () => {
    if (!data) return

    const lines: string[] = []

    // Metrics section
    lines.push('=== METRICS ===')
    lines.push('Metric,Value')
    lines.push(`Total Clients,${data.metrics.totalClients}`)
    lines.push(`Active Clients,${data.metrics.activeClients}`)
    lines.push(`Total Revenue,$${(data.metrics.totalRevenue / 100).toFixed(2)}`)
    lines.push(`Avg Completion,${data.metrics.avgCompletion}%`)
    lines.push(`Paid Orders,${data.metrics.paidOrdersCount}`)
    lines.push('')

    // Client growth
    lines.push('=== CLIENT GROWTH (6 months) ===')
    lines.push('Month,Total Clients')
    data.clientGrowth.forEach(p => lines.push(`${p.month},${p.value}`))
    lines.push('')

    // Revenue by month
    lines.push('=== REVENUE BY MONTH ===')
    lines.push('Month,Revenue ($)')
    data.revenueByMonth.forEach(p => lines.push(`${p.month},${(p.value / 100).toFixed(2)}`))
    lines.push('')

    // Course sales
    lines.push('=== COURSE SALES ===')
    lines.push('Course,Sales Count,Revenue ($)')
    data.courseSales.forEach(c => lines.push(`"${c.title}",${c.count},${(c.revenue / 100).toFixed(2)}`))
    lines.push('')

    // Top clients
    lines.push('=== TOP CLIENTS BY COMPLETION ===')
    lines.push('Client,Completion %')
    data.topClients.forEach(c => lines.push(`"${c.name}",${c.completionPct}%`))
    lines.push('')

    // Recent orders
    lines.push('=== RECENT ORDERS ===')
    lines.push('Client,Course,Amount ($),Date')
    data.recentOrders.forEach(o => lines.push(`"${o.clientName}","${o.courseTitle}",${(o.amount / 100).toFixed(2)},${o.paidAt || ''}`))

    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qbody-analytics-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(ru ? 'CSV экспортирован!' : 'CSV exported!')
  }

  /* ── Loading / Error states ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <BarChart3 className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
        <p className="text-zinc-500">{ru ? 'Ошибка загрузки аналитики' : 'Failed to load analytics'}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
          {ru ? 'Попробовать снова' : 'Try again'}
        </Button>
      </div>
    )
  }

  const { metrics } = data
  const fmtMoney = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const fmtPct = (v: number) => `${v > 0 ? '+' : ''}${v}%`

  const metricCards = [
    {
      label: ru ? 'Всего клиентов' : 'Total Clients',
      value: String(metrics.totalClients),
      change: fmtPct(metrics.clientGrowthPct),
      positive: metrics.clientGrowthPct >= 0,
      icon: Users,
      sub: ru ? `+${metrics.clientsThisMonth} в этом месяце` : `+${metrics.clientsThisMonth} this month`,
    },
    {
      label: ru ? 'Активные клиенты' : 'Active Clients',
      value: String(metrics.activeClients),
      change: metrics.totalClients > 0 ? `${Math.round((metrics.activeClients / metrics.totalClients) * 100)}%` : '0%',
      positive: true,
      icon: TrendingUp,
      sub: ru ? 'с доступом к курсам' : 'with course access',
    },
    {
      label: ru ? 'Общая выручка' : 'Total Revenue',
      value: fmtMoney(metrics.totalRevenue),
      change: fmtPct(metrics.revenueGrowthPct),
      positive: metrics.revenueGrowthPct >= 0,
      icon: DollarSign,
      sub: `${metrics.paidOrdersCount} ${ru ? 'продаж' : 'sales'}`,
    },
    {
      label: ru ? 'Среднее прохождение' : 'Avg Completion',
      value: `${metrics.avgCompletion}%`,
      change: '',
      positive: true,
      icon: BookOpen,
      sub: ru ? 'завершённых уроков' : 'lessons completed',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{ru ? 'Аналитика' : 'Analytics'}</h1>
          <p className="text-zinc-500 mt-1">{ru ? 'Обзор ключевых показателей' : 'Key metrics overview'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!data}>
          <Download className="w-4 h-4 mr-2" />{ru ? 'Экспорт CSV' : 'Export CSV'}
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((m) => {
          const Icon = m.icon
          return (
            <Card key={m.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-teal-500" />
                  </div>
                  {m.change && (
                    <Badge className={`text-xs ${m.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} border-0`}>
                      {m.change}
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-bold text-zinc-900">{m.value}</div>
                <p className="text-sm text-zinc-500 mt-0.5">{m.label}</p>
                <p className="text-xs text-zinc-400 mt-1">{m.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{ru ? 'Рост клиентов' : 'Client Growth'}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.clientGrowth.every(d => d.value === 0) ? (
              <div className="text-center py-12 text-zinc-400">{ru ? 'Нет данных' : 'No data yet'}</div>
            ) : (
              <BarChart
                data={data.clientGrowth.map(d => ({ label: d.month, value: d.value }))}
                color="bg-teal-500"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{ru ? 'Выручка по месяцам' : 'Revenue by Month'}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.revenueByMonth.every(d => d.value === 0) ? (
              <div className="text-center py-12 text-zinc-400">{ru ? 'Нет продаж' : 'No sales yet'}</div>
            ) : (
              <BarChart
                data={data.revenueByMonth.map(d => ({ label: d.month, value: d.value }))}
                color="bg-green-500"
                formatValue={(v) => v > 0 ? `$${(v / 100).toFixed(0)}` : '0'}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Course Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-teal-500" />
              {ru ? 'Продажи курсов' : 'Course Sales'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.courseSales.length === 0 ? (
              <div className="text-center py-8 text-zinc-400">{ru ? 'Нет продаж' : 'No sales yet'}</div>
            ) : (
              <div className="space-y-4">
                {data.courseSales.map((course, i) => (
                  <div key={course.slug} className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-teal-500/10 text-teal-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{ru ? course.titleRu : course.title}</p>
                      <p className="text-xs text-zinc-500">{course.count} {ru ? 'продаж' : 'sales'}</p>
                    </div>
                    <span className="text-sm font-bold text-zinc-900">{fmtMoney(course.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Clients by Completion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              {ru ? 'Прогресс клиентов' : 'Client Progress'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topClients.length === 0 ? (
              <div className="text-center py-8 text-zinc-400">{ru ? 'Нет данных' : 'No data yet'}</div>
            ) : (
              <div className="space-y-3">
                {data.topClients.map((client) => (
                  <HorizontalBar
                    key={client.id}
                    label={client.name}
                    value={client.completionPct}
                    max={100}
                    color={client.completionPct >= 80 ? 'bg-green-500' : client.completionPct >= 50 ? 'bg-yellow-500' : 'bg-orange-500'}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              {ru ? 'Последние продажи' : 'Recent Sales'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentOrders.length === 0 ? (
              <div className="text-center py-8 text-zinc-400">{ru ? 'Нет продаж' : 'No sales yet'}</div>
            ) : (
              <div className="space-y-3">
                {data.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 truncate">{order.clientName}</p>
                      <p className="text-xs text-zinc-500 truncate">{ru ? order.courseTitleRu : order.courseTitle}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-zinc-900">{fmtMoney(order.amount)}</p>
                      {order.paidAt && (
                        <p className="text-xs text-zinc-400">
                          {new Date(order.paidAt).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
