'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useTranslation } from '@/lib/i18n'
import { fetchWithAuth } from '@/lib/api'
import {
  Eye, CheckCircle2, Loader2, AlertTriangle,
  TrendingDown, TrendingUp, Minus, Camera, ClipboardList,
  ArrowLeft, ChevronRight, Users, Search
} from 'lucide-react'
import { toast } from 'sonner'

type Checkin = {
  id: string
  client_id: string
  checkin_date: string
  weight: number | null
  waist: number | null
  hips: number | null
  status: 'new' | 'reviewed' | 'flagged'
  flagged: boolean
  comment: string | null
  sleep_quality: number | null
  energy_level: number | null
  stress_level: number | null
  created_at: string
  profiles: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null
  checkin_photos: { id: string; photo_url: string; photo_type: string }[]
  checkin_responses: { id: string }[]
  previous_weight: number | null
  weight_change: number | null
  photos_count: number
  has_response: boolean
}

type ClientGroup = {
  clientId: string
  name: string
  email: string
  avatarUrl: string | null
  totalCheckins: number
  newCount: number
  flaggedCount: number
  lastCheckinDate: string
  lastStatus: string
}

export default function CheckinsPage() {
  const { locale } = useTranslation()
  const ru = locale === 'ru'

  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<ClientGroup | null>(null)
  const [search, setSearch] = useState('')
  const [clientFilter, setClientFilter] = useState('all') // for client detail view

  const fetchCheckins = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/checkins?limit=500')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCheckins(data.checkins || [])
      setTotal(data.total || 0)
    } catch {
      toast.error(ru ? 'Ошибка загрузки' : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [ru])

  useEffect(() => { fetchCheckins() }, [fetchCheckins])

  // Group checkins by client
  const clientGroups: ClientGroup[] = React.useMemo(() => {
    const map = new Map<string, ClientGroup>()
    for (const ci of checkins) {
      const cid = ci.client_id
      if (!map.has(cid)) {
        map.set(cid, {
          clientId: cid,
          name: ci.profiles?.full_name || ci.profiles?.email || '—',
          email: ci.profiles?.email || '',
          avatarUrl: ci.profiles?.avatar_url || null,
          totalCheckins: 0,
          newCount: 0,
          flaggedCount: 0,
          lastCheckinDate: ci.created_at,
          lastStatus: ci.status,
        })
      }
      const g = map.get(cid)!
      g.totalCheckins++
      if (ci.status === 'new') g.newCount++
      if (ci.flagged) g.flaggedCount++
      // checkins are ordered desc, first one is latest
      if (new Date(ci.created_at) > new Date(g.lastCheckinDate)) {
        g.lastCheckinDate = ci.created_at
        g.lastStatus = ci.status
      }
    }
    const arr = Array.from(map.values())
    // Sort: clients with new checkins first, then by last date
    arr.sort((a, b) => {
      if (a.newCount > 0 && b.newCount === 0) return -1
      if (b.newCount > 0 && a.newCount === 0) return 1
      return new Date(b.lastCheckinDate).getTime() - new Date(a.lastCheckinDate).getTime()
    })
    return arr
  }, [checkins])

  // Filter by search
  const filteredClients = clientGroups.filter(g =>
    !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.email.toLowerCase().includes(search.toLowerCase())
  )

  // Client's checkins
  const clientCheckins = selectedClient
    ? checkins
        .filter(ci => ci.client_id === selectedClient.clientId)
        .filter(ci => clientFilter === 'all' || (clientFilter === 'flagged' ? ci.flagged : ci.status === clientFilter))
    : []

  const totalNew = clientGroups.reduce((sum, g) => sum + g.newCount, 0)

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const today = new Date()
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === today.toDateString())
      return `${ru ? 'Сегодня' : 'Today'}, ${d.toLocaleTimeString(ru ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`
    if (d.toDateString() === yesterday.toDateString())
      return `${ru ? 'Вчера' : 'Yesterday'}, ${d.toLocaleTimeString(ru ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`
    return d.toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatShortDate = (iso: string) => {
    const d = new Date(iso)
    const today = new Date()
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return ru ? 'Сегодня' : 'Today'
    if (d.toDateString() === yesterday.toDateString()) return ru ? 'Вчера' : 'Yesterday'
    return d.toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })
  }

  const getInitials = (name: string | null) => {
    if (!name) return '??'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  const WeightChangeIcon = ({ change }: { change: number | null }) => {
    if (change === null || change === 0) return <Minus className="w-3 h-3 text-zinc-400" />
    if (change < 0) return <TrendingDown className="w-3 h-3 text-green-500" />
    return <TrendingUp className="w-3 h-3 text-orange-500" />
  }

  // ═══════ LOADING ═══════
  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
  }

  // ═══════ CLIENT DETAIL VIEW ═══════
  if (selectedClient) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedClient(null); setClientFilter('all') }}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <ArrowLeft className="w-5 h-5 text-zinc-500" />
            </button>
            <Avatar src={selectedClient.avatarUrl || undefined} fallback={getInitials(selectedClient.name)} size="md" />
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{selectedClient.name}</h1>
              <p className="text-sm text-zinc-500">
                {selectedClient.totalCheckins} {ru ? 'чек-инов' : 'check-ins'}
                {selectedClient.newCount > 0 && <span className="ml-2 text-teal-600 font-medium">· {selectedClient.newCount} {ru ? 'новых' : 'new'}</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {[
              { key: 'all', label: ru ? 'Все' : 'All' },
              { key: 'new', label: ru ? 'Новые' : 'New' },
              { key: 'reviewed', label: ru ? 'Обработано' : 'Reviewed' },
              { key: 'flagged', label: ru ? 'Внимание' : 'Flagged' },
            ].map(f => (
              <Button key={f.key} variant={clientFilter === f.key ? 'default' : 'outline'} size="sm" onClick={() => setClientFilter(f.key)}>
                {f.key === 'flagged' && <AlertTriangle className="w-3 h-3 mr-1" />}
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Empty */}
        {clientCheckins.length === 0 && (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-400">{ru ? 'Нет чек-инов с этим фильтром' : 'No check-ins with this filter'}</p>
          </div>
        )}

        {/* Table */}
        {clientCheckins.length > 0 && (
          <Card><CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 uppercase">{ru ? 'Дата' : 'Date'}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 uppercase">{ru ? 'Вес' : 'Weight'}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 uppercase">{ru ? 'Изм.' : 'Change'}</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-zinc-500 uppercase">{ru ? 'Фото' : 'Photos'}</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-zinc-500 uppercase">{ru ? 'Самочувствие' : 'Wellness'}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 uppercase">{ru ? 'Статус' : 'Status'}</th>
                    <th className="text-right py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {clientCheckins.map((ci) => (
                    <tr key={ci.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-300 whitespace-nowrap">{formatDate(ci.created_at)}</td>
                      <td className="py-3 px-4 font-medium text-sm">{ci.weight ? `${ci.weight} kg` : '—'}</td>
                      <td className="py-3 px-4">
                        {ci.weight_change !== null ? (
                          <span className={`text-sm font-medium inline-flex items-center gap-1 ${ci.weight_change < 0 ? 'text-green-600' : ci.weight_change > 0 ? 'text-orange-500' : 'text-zinc-400'}`}>
                            <WeightChangeIcon change={ci.weight_change} />
                            {ci.weight_change > 0 ? '+' : ''}{ci.weight_change} kg
                          </span>
                        ) : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {ci.photos_count > 0
                          ? <Badge variant="secondary" className="text-xs"><Camera className="w-3 h-3 mr-1" />{ci.photos_count}</Badge>
                          : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs">
                          {ci.sleep_quality && <span title={ru ? 'Сон' : 'Sleep'}>😴{ci.sleep_quality}</span>}
                          {ci.energy_level && <span title={ru ? 'Энергия' : 'Energy'}>⚡{ci.energy_level}</span>}
                          {ci.stress_level && <span title={ru ? 'Стресс' : 'Stress'}>🧠{ci.stress_level}</span>}
                          {!ci.sleep_quality && !ci.energy_level && !ci.stress_level && <span className="text-zinc-300">—</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {ci.flagged ? (
                          <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />{ru ? 'Внимание' : 'Flagged'}</Badge>
                        ) : ci.status === 'new' ? (
                          <Badge>{ru ? 'Новый' : 'New'}</Badge>
                        ) : (
                          <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" />{ru ? 'Готово' : 'Reviewed'}</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/dashboard/checkins/${ci.id}`}>
                          <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        )}
      </div>
    )
  }

  // ═══════ CLIENTS LIST VIEW ═══════
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-teal-500" />
            {ru ? 'Чек-ины' : 'Check-ins'}
          </h1>
          <p className="text-zinc-500 mt-1">
            {clientGroups.length} {ru ? 'клиентов' : 'clients'} · {total} {ru ? 'чек-инов' : 'check-ins'}
            {totalNew > 0 && <span className="ml-2 text-teal-600 font-medium">· {totalNew} {ru ? 'новых' : 'new'}</span>}
          </p>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={ru ? 'Поиск клиента...' : 'Search client...'}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
          />
        </div>
      </div>

      {/* Empty */}
      {checkins.length === 0 && (
        <div className="text-center py-16">
          <ClipboardList className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-600 mb-2">{ru ? 'Нет чек-инов' : 'No check-ins yet'}</h3>
          <p className="text-zinc-400">{ru ? 'Чек-ины клиентов появятся здесь' : 'Client check-ins will appear here'}</p>
        </div>
      )}

      {/* Client list */}
      {filteredClients.length > 0 && (
        <div className="space-y-2">
          {filteredClients.map(g => (
            <button
              key={g.clientId}
              onClick={() => setSelectedClient(g)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3.5 flex items-center gap-4 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-sm transition-all text-left group"
            >
              {/* Avatar */}
              <Avatar src={g.avatarUrl || undefined} fallback={getInitials(g.name)} size="sm" />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{g.name}</span>
                  {g.newCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-teal-500 text-white text-[11px] font-bold">
                      {g.newCount}
                    </span>
                  )}
                  {g.flaggedCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold">
                      <AlertTriangle className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {g.totalCheckins} {ru ? 'чек-инов' : 'check-ins'}
                </p>
              </div>

              {/* Last date */}
              <div className="text-right flex-shrink-0 hidden sm:block">
                <p className="text-xs text-zinc-500">{formatShortDate(g.lastCheckinDate)}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {g.lastStatus === 'new' ? (ru ? 'Новый' : 'New')
                    : g.lastStatus === 'reviewed' ? (ru ? 'Обработан' : 'Reviewed')
                    : (ru ? 'Внимание' : 'Flagged')}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* No search results */}
      {checkins.length > 0 && filteredClients.length === 0 && search && (
        <div className="text-center py-12">
          <Users className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400">{ru ? 'Клиент не найден' : 'Client not found'}</p>
        </div>
      )}
    </div>
  )
}
