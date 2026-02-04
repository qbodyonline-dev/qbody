'use client'
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
import { Users, TrendingUp, DollarSign, Clock, Download } from 'lucide-react'
import { toast } from 'sonner'

const metrics = [
  { key: 'totalClients', value: '45', icon: Users, change: '+12%' },
  { key: 'activeClients', value: '24', icon: TrendingUp, change: '+8%' },
  { key: 'totalRevenue', value: '$24.5k', icon: DollarSign, change: '+15%' },
  { key: 'avgCompliance', value: '87%', icon: Clock, change: '+5%' },
]

const clientGrowthData = [
  { month: 'Sep', value: 18 },
  { month: 'Oct', value: 22 },
  { month: 'Nov', value: 28 },
  { month: 'Dec', value: 32 },
  { month: 'Jan', value: 38 },
  { month: 'Feb', value: 45 },
]

const revenueData = [
  { month: 'Sep', value: 1200 },
  { month: 'Oct', value: 1650 },
  { month: 'Nov', value: 1900 },
  { month: 'Dec', value: 2100 },
  { month: 'Jan', value: 2300 },
  { month: 'Feb', value: 2450 },
]

const complianceData = [
  { name: 'Anna K.', value: 92 },
  { name: 'Elena P.', value: 85 },
  { name: 'Maria S.', value: 78 },
  { name: 'Olga V.', value: 75 },
  { name: 'Irina K.', value: 71 },
]

const popularWorkouts = [
  { name: 'Full Body', nameRu: 'Всё тело', count: 156 },
  { name: 'Upper Body', nameRu: 'Верх тела', count: 134 },
  { name: 'HIIT Cardio', nameRu: 'ВИИТ Кардио', count: 98 },
  { name: 'Core & Abs', nameRu: 'Пресс и кор', count: 87 },
  { name: 'Lower Body', nameRu: 'Низ тела', count: 76 },
]

function BarChart({ data, maxVal, color = 'bg-teal-500' }: { data: { label: string; value: number }[]; maxVal: number; color?: string }) {
  return (
    <div className="flex items-end gap-3 h-48">
      {data.map((item) => (
        <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-zinc-600">{item.value}</span>
          <div className="w-full bg-zinc-100 rounded-t-lg relative" style={{ height: '100%' }}>
            <div
              className={`absolute bottom-0 left-0 right-0 ${color} rounded-t-lg transition-all duration-500`}
              style={{ height: `${(item.value / maxVal) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function HorizontalBar({ label, value, max, color = 'bg-teal-500' }: { label: string; value: number; max: number; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-600 w-24 truncate">{label}</span>
      <div className="flex-1 h-6 bg-zinc-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="text-sm font-medium text-zinc-900 w-12 text-right">{value}%</span>
    </div>
  )
}

export default function AnalyticsPage() {
  const { t, locale } = useTranslation()
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-zinc-900">{t('analytics.title')}</h1><p className="text-zinc-500 mt-1">{t('analytics.subtitle')}</p></div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" onClick={() => toast.success(locale === 'ru' ? 'CSV экспортирован!' : 'CSV exported!')}><Download className="w-4 h-4 mr-2" />Export</Button>
          {['overview', 'clients', 'revenue'].map((tab) => (
            <Button key={tab} variant={activeTab === tab ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab(tab)}>{t(`analytics.tabs.${tab}`)}</Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <Card key={m.key}><CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center mx-auto mb-3"><Icon className="w-6 h-6 text-teal-500" /></div>
              <div className="text-3xl font-bold text-zinc-900">{m.value}</div>
              <p className="text-sm text-zinc-500">{t(`analytics.metrics.${m.key}`)}</p>
              <span className="text-xs text-green-500">{m.change}</span>
            </CardContent></Card>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{t('analytics.charts.clientGrowth')}</CardTitle></CardHeader>
          <CardContent>
            <BarChart 
              data={clientGrowthData.map(d => ({ label: d.month, value: d.value }))} 
              maxVal={50}
              color="bg-teal-500"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('analytics.charts.revenueOverTime')}</CardTitle></CardHeader>
          <CardContent>
            <BarChart 
              data={revenueData.map(d => ({ label: d.month, value: d.value }))} 
              maxVal={2800}
              color="bg-green-500"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{t('analytics.charts.complianceByClient')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {complianceData.map((client) => (
              <HorizontalBar key={client.name} label={client.name} value={client.value} max={100} 
                color={client.value >= 80 ? 'bg-green-500' : client.value >= 70 ? 'bg-yellow-500' : 'bg-red-500'} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('analytics.charts.popularWorkouts')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {popularWorkouts.map((w, i) => (
              <div key={w.name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="flex-1 text-sm font-medium text-zinc-900">{locale === 'ru' ? w.nameRu : w.name}</span>
                <div className="w-24 h-2 bg-zinc-100 rounded-full">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(w.count / 160) * 100}%` }} />
                </div>
                <span className="text-sm text-zinc-500 w-10 text-right">{w.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
