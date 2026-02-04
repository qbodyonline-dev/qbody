'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useTranslation } from '@/lib/i18n'
import { Eye, CheckCircle2, Image } from 'lucide-react'

const checkins = [
  { id: '1', client: 'Olga V.', initials: 'OV', date: '', weight: 68.5, change: -0.3, hasPhotos: true, status: 'new' },
  { id: '2', client: 'Svetlana M.', initials: 'SM', date: '', weight: 72.1, change: -0.5, hasPhotos: true, status: 'new' },
  { id: '3', client: 'Irina K.', initials: 'IK', date: '', weight: 65.0, change: 0, hasPhotos: false, status: 'processed' },
  { id: '4', client: 'Anna K.', initials: 'AK', date: '', weight: 64.8, change: -0.2, hasPhotos: true, status: 'processed' },
]

export default function CheckinsPage() {
  const { t, locale } = useTranslation()
  const today = t('dashboard.timeAgo.today')
  const yesterday = t('dashboard.timeAgo.yesterday')
  
  const localizedCheckins = checkins.map((c, i) => ({
    ...c,
    date: i < 2 ? `${today}, ${i === 0 ? '10:30' : '09:15'}` : `${yesterday}, ${i === 2 ? '14:20' : '16:00'}`,
  }))
  const [filter, setFilter] = useState('all')
  const filtered = localizedCheckins.filter(c => filter === 'all' || c.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-zinc-900">{t('checkins.title')}</h1><p className="text-zinc-500 mt-1">{t('checkins.subtitle')}</p></div>
        <div className="flex gap-2">
          {['all', 'new', 'processed'].map((f) => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>{t(`checkins.filters.${f}`)}</Button>
          ))}
        </div>
      </div>

      <Card><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600">{t('checkins.table.client')}</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600">{t('checkins.table.date')}</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600">{t('checkins.table.weight')}</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600">{t('checkins.table.change')}</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600">{t('checkins.table.photos')}</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600">{t('checkins.table.status')}</th>
              <th className="text-right py-4 px-6"></th>
            </tr></thead>
            <tbody>
              {filtered.map((checkin) => (
                <tr key={checkin.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="py-4 px-6"><div className="flex items-center gap-3"><Avatar fallback={checkin.initials} size="sm" /><span className="font-medium text-zinc-900">{checkin.client}</span></div></td>
                  <td className="py-4 px-6 text-sm text-zinc-500">{checkin.date}</td>
                  <td className="py-4 px-6 font-medium">{checkin.weight} kg</td>
                  <td className="py-4 px-6"><span className={`text-sm font-medium ${checkin.change < 0 ? 'text-green-500' : checkin.change > 0 ? 'text-red-500' : 'text-zinc-500'}`}>{checkin.change > 0 ? '+' : ''}{checkin.change} kg</span></td>
                  <td className="py-4 px-6">{checkin.hasPhotos ? <Badge variant="secondary"><Image className="w-3 h-3 mr-1" />3</Badge> : <span className="text-zinc-400">-</span>}</td>
                  <td className="py-4 px-6">{checkin.status === 'new' ? <Badge>{t('dashboard.new')}</Badge> : <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" />{t('dashboard.processed')}</Badge>}</td>
                  <td className="py-4 px-6 text-right"><Link href={`/dashboard/checkins/${checkin.id}`}><Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent></Card>
    </div>
  )
}
