'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useTranslation } from '@/lib/i18n'
import { 
  ArrowLeft, CheckCircle2, TrendingDown, TrendingUp, 
  Image as ImageIcon, Moon, Zap, Brain, Send
} from 'lucide-react'
import { toast } from 'sonner'

const checkinsData: Record<string, any> = {
  '1': {
    id: '1',
    client: { id: '1', name: 'Olga V.', initials: 'OV', email: 'olga@example.com' },
    date: '2024-02-01',
    time: '10:30',
    weight: 68.5,
    previousWeight: 68.8,
    measurements: { waist: 72, hips: 98, chest: 90 },
    photos: ['front', 'side', 'back'],
    wellness: { sleep: 4, energy: 3, stress: 2 },
    notes: 'Feeling good this week. Had some cravings but managed to stay on track. Exercise felt easier than last week.',
    status: 'new'
  },
  '2': {
    id: '2',
    client: { id: '2', name: 'Svetlana M.', initials: 'SM', email: 'svetlana@example.com' },
    date: '2024-02-01',
    time: '09:15',
    weight: 72.1,
    previousWeight: 72.6,
    measurements: { waist: 75, hips: 102, chest: 94 },
    photos: ['front', 'side'],
    wellness: { sleep: 3, energy: 4, stress: 3 },
    notes: 'Busy week at work. Missed one workout but did extra walking.',
    status: 'new'
  }
}

export default function CheckinDetailPage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const checkinId = params.id as string
  const checkin = checkinsData[checkinId]
  
  const [response, setResponse] = useState('')
  const [status, setStatus] = useState(checkin?.status || 'new')

  if (!checkin) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-zinc-500 mb-4">{t('checkinDetail.notFound')}</p>
        <Link href="/dashboard/checkins"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />{t('checkinDetail.backToCheckins')}</Button></Link>
      </div>
    )
  }

  const weightChange = checkin.weight - checkin.previousWeight

  const handleMarkProcessed = () => {
    setStatus('processed')
    toast.success(t('settings.saved'))
  }

  const handleSendResponse = () => {
    if (!response.trim()) {
      toast.error(t('messages.typeMessage'))
      return
    }
    toast.success(t('settings.saved'))
    setResponse('')
    setStatus('processed')
  }

  const renderWellnessBar = (value: number, label: string, icon: React.ReactNode) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-zinc-600">{icon}{label}</span>
        <span className="text-sm font-medium">{value}/5</span>
      </div>
      <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${value >= 4 ? 'bg-green-500' : value >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/checkins">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900">{t('checkinDetail.title')}</h1>
              <Badge variant={status === 'new' ? 'default' : 'success'}>
                {status === 'new' ? t('dashboard.new') : <><CheckCircle2 className="w-3 h-3 mr-1" />{t('dashboard.processed')}</>}
              </Badge>
            </div>
            <p className="text-zinc-500 mt-1">{checkin.date} at {checkin.time}</p>
          </div>
        </div>
        {status === 'new' && (
          <Button variant="outline" onClick={handleMarkProcessed}>
            <CheckCircle2 className="w-4 h-4 mr-2" />{t('checkins.detail.markProcessed')}
          </Button>
        )}
      </div>

      {/* Client Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar fallback={checkin.client.initials} size="lg" />
              <div>
                <p className="font-semibold text-zinc-900">{checkin.client.name}</p>
                <p className="text-sm text-zinc-500">{checkin.client.email}</p>
              </div>
            </div>
            <Link href={`/dashboard/clients/${checkin.client.id}`}>
              <Button variant="outline" size="sm">{t('checkinDetail.viewProfile')}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weight & Measurements */}
          <Card>
            <CardHeader><CardTitle>{t('checkins.detail.measurements')}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-zinc-50 rounded-xl text-center">
                  <p className="text-sm text-zinc-500 mb-1">{t('checkins.detail.weight')}</p>
                  <p className="text-2xl font-bold text-zinc-900">{checkin.weight} kg</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {weightChange < 0 ? (
                      <TrendingDown className="w-4 h-4 text-green-500" />
                    ) : weightChange > 0 ? (
                      <TrendingUp className="w-4 h-4 text-red-500" />
                    ) : null}
                    <span className={`text-sm font-medium ${weightChange < 0 ? 'text-green-500' : weightChange > 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                      {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-zinc-50 rounded-xl text-center">
                  <p className="text-sm text-zinc-500 mb-1">{t('checkins.detail.waist')}</p>
                  <p className="text-2xl font-bold text-zinc-900">{checkin.measurements.waist} cm</p>
                </div>
                <div className="p-4 bg-zinc-50 rounded-xl text-center">
                  <p className="text-sm text-zinc-500 mb-1">{t('checkins.detail.hips')}</p>
                  <p className="text-2xl font-bold text-zinc-900">{checkin.measurements.hips} cm</p>
                </div>
                <div className="p-4 bg-zinc-50 rounded-xl text-center">
                  <p className="text-sm text-zinc-500 mb-1">{t('checkins.detail.chest')}</p>
                  <p className="text-2xl font-bold text-zinc-900">{checkin.measurements.chest} cm</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader><CardTitle>{t('checkins.detail.photos')}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {checkin.photos.map((photo: string) => (
                  <div key={photo} className="aspect-[3/4] bg-zinc-100 rounded-xl flex flex-col items-center justify-center text-zinc-400">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-xs capitalize">{t(`checkins.detail.${photo}`)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Client Notes */}
          <Card>
            <CardHeader><CardTitle>{t('checkins.detail.notes')}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-zinc-600 bg-zinc-50 p-4 rounded-xl italic">"{checkin.notes}"</p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Wellness */}
          <Card>
            <CardHeader><CardTitle>{t('checkinDetail.wellness')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {renderWellnessBar(checkin.wellness.sleep, t('checkins.detail.sleep'), <Moon className="w-4 h-4" />)}
              {renderWellnessBar(checkin.wellness.energy, t('checkins.detail.energy'), <Zap className="w-4 h-4" />)}
              {renderWellnessBar(checkin.wellness.stress, t('checkins.detail.stress'), <Brain className="w-4 h-4" />)}
            </CardContent>
          </Card>

          {/* Response */}
          <Card>
            <CardHeader><CardTitle>{t('checkins.detail.response')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <textarea
                className="w-full h-32 p-3 rounded-xl border border-zinc-200 resize-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                placeholder={t('checkinDetail.responsePlaceholder')}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
              />
              <Button variant="gradient" className="w-full" onClick={handleSendResponse}>
                <Send className="w-4 h-4 mr-2" />{t('checkins.detail.sendResponse')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
