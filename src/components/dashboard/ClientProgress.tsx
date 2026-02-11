'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fetchWithAuth } from '@/lib/api'
import {
  Dumbbell, Scale, Loader2, TrendingUp, TrendingDown,
  Clock, Activity, CheckCircle2, XCircle, BarChart3, Moon, Zap, Brain
} from 'lucide-react'

type ProgressData = {
  program: { name_en: string; name_ru: string; duration_weeks: number; start_date: string; end_date: string } | null
  training: {
    totalWorkouts: number; completed: number; skipped: number; compliancePct: number
    avgRpe: number | null; avgDuration: number | null
    workoutsPerWeek: { week: string; completed: number; missed: number }[]
    recentLogs: any[]
  }
  checkins: {
    total: number
    weightChart: { date: string; weight: number }[]
    waistChart: { date: string; waist: number }[]
    checkinsByWeek: { week: string; count: number }[]
    wellnessAvg: { sleep: number | null; energy: number | null; stress: number | null }
  }
}

export default function ClientProgress({ clientId, ru }: { clientId: string; ru: boolean }) {
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`/api/clients/${clientId}/progress`)
      if (res.ok) setData(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [clientId])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <Card><CardContent className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-teal-500" /></CardContent></Card>
  if (!data) return null

  const { training: t, checkins: c } = data
  const weights = c.weightChart
  const firstWeight = weights.length > 0 ? weights[0].weight : null
  const lastWeight = weights.length > 0 ? weights[weights.length - 1].weight : null
  const weightDiff = firstWeight && lastWeight ? Math.round((lastWeight - firstWeight) * 10) / 10 : null

  const compColor = t.compliancePct >= 80 ? 'text-green-600' : t.compliancePct >= 50 ? 'text-yellow-600' : 'text-red-600'
  const compBg = t.compliancePct >= 80 ? 'bg-green-500' : t.compliancePct >= 50 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="space-y-4">
      {/* Training summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><Dumbbell className="w-5 h-5 text-teal-500" />{ru ? 'Тренировки' : 'Training'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: ru ? 'Комплаенс' : 'Compliance', value: `${t.compliancePct}%`, icon: Activity, color: compColor },
              { label: ru ? 'Выполнено' : 'Completed', value: `${t.completed}/${t.totalWorkouts}`, icon: CheckCircle2, color: 'text-green-600' },
              { label: ru ? 'Ср. RPE' : 'Avg RPE', value: t.avgRpe ? `${t.avgRpe}/10` : '—', icon: BarChart3, color: 'text-blue-600' },
              { label: ru ? 'Ср. длит.' : 'Avg Dur.', value: t.avgDuration ? `${t.avgDuration}m` : '—', icon: Clock, color: 'text-purple-600' },
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 text-center">
                  <Icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-zinc-500">{s.label}</p>
                </div>
              )
            })}
          </div>

          {/* Compliance bar */}
          <div>
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>{ru ? 'Комплаенс тренировок' : 'Workout Compliance'}</span>
              <span className={`font-bold ${compColor}`}>{t.compliancePct}%</span>
            </div>
            <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div className={`h-full ${compBg} rounded-full transition-all`} style={{ width: `${t.compliancePct}%` }} />
            </div>
          </div>

          {/* Workouts per week mini chart */}
          {t.workoutsPerWeek.some(w => w.completed > 0) && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">{ru ? 'Тренировок за неделю (8 нед.)' : 'Workouts per week (8 wk)'}</p>
              <div className="flex items-end gap-1.5 h-16">
                {t.workoutsPerWeek.map((w, i) => {
                  const max = Math.max(...t.workoutsPerWeek.map(x => x.completed + x.missed), 1)
                  const h = ((w.completed) / max) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-t relative" style={{ height: '100%' }}>
                        <div className="absolute bottom-0 left-0 right-0 bg-teal-400 dark:bg-teal-500 rounded-t"
                          style={{ height: `${h}%`, minHeight: w.completed > 0 ? '3px' : '0' }} />
                      </div>
                      <span className="text-[8px] text-zinc-400 mt-0.5">{w.completed}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recent logs */}
          {t.recentLogs.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">{ru ? 'Последние' : 'Recent'}</p>
              <div className="space-y-1.5">
                {t.recentLogs.slice(0, 5).map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-2">
                      {l.status === 'completed'
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        : l.status === 'skipped' ? <XCircle className="w-3.5 h-3.5 text-red-400" />
                        : <Clock className="w-3.5 h-3.5 text-orange-400" />
                      }
                      <span className="text-xs text-zinc-700 dark:text-zinc-300">
                        {l.workouts ? (ru ? l.workouts.name_ru || l.workouts.name_en : l.workouts.name_en) : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {l.duration_minutes && <span className="text-[10px] text-zinc-400">{l.duration_minutes}m</span>}
                      <span className="text-[10px] text-zinc-400">
                        {l.started_at ? new Date(l.started_at).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' }) : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {t.totalWorkouts === 0 && (
            <div className="text-center py-6 text-zinc-400 text-sm">{ru ? 'Нет данных о тренировках' : 'No workout data yet'}</div>
          )}
        </CardContent>
      </Card>

      {/* Weight chart */}
      {weights.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Scale className="w-4 h-4 text-blue-500" />{ru ? 'Динамика веса' : 'Weight Trend'}</CardTitle>
              {weightDiff !== null && (
                <Badge variant={weightDiff < 0 ? 'success' : weightDiff > 0 ? 'destructive' : 'secondary'} className="text-xs">
                  {weightDiff < 0 ? <TrendingDown className="w-3 h-3 mr-0.5" /> : <TrendingUp className="w-3 h-3 mr-0.5" />}
                  {weightDiff > 0 ? '+' : ''}{weightDiff} kg
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-0.5 h-20">
              {weights.slice(-20).map((w, i) => {
                const min = Math.min(...weights.slice(-20).map(x => x.weight))
                const max = Math.max(...weights.slice(-20).map(x => x.weight))
                const range = max - min || 1
                const height = ((w.weight - min) / range) * 80 + 20
                return (
                  <div key={i} className="flex-1">
                    <div className="w-full rounded-t bg-gradient-to-t from-blue-400 to-blue-300 dark:from-blue-600 dark:to-blue-500"
                      style={{ height: `${height}%` }} title={`${w.date}: ${w.weight}kg`} />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              <span>{weights[0]?.weight} kg ({weights[0]?.date})</span>
              <span>{lastWeight} kg</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wellness averages */}
      {(c.wellnessAvg.sleep || c.wellnessAvg.energy || c.wellnessAvg.stress) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{ru ? 'Среднее самочувствие (5 чекинов)' : 'Avg Wellness (last 5)'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: ru ? 'Сон' : 'Sleep', val: c.wellnessAvg.sleep, icon: Moon, emoji: '🌙' },
                { label: ru ? 'Энергия' : 'Energy', val: c.wellnessAvg.energy, icon: Zap, emoji: '⚡' },
                { label: ru ? 'Стресс' : 'Stress', val: c.wellnessAvg.stress, icon: Brain, emoji: '🧠' },
              ].filter(w => w.val !== null).map(w => (
                <div key={w.label} className="flex items-center gap-3">
                  <span className="text-sm w-5 text-center">{w.emoji}</span>
                  <span className="text-xs text-zinc-500 w-16">{w.label}</span>
                  <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600"
                      style={{ width: `${((w.val || 0) / 10) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 w-10 text-right">{w.val}/10</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
