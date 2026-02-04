'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { 
  ArrowLeft, Edit, Trash2, Mail, Phone, Target, Calendar, 
  TrendingDown, TrendingUp, Dumbbell, MessageSquare, ClipboardCheck,
  Plus, Save, CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

const clientsData: Record<string, any> = {
  '1': {
    id: '1', name: 'Anna Kovaleva', email: 'anna@example.com', phone: '+1 234 567 890',
    initials: 'AK', status: 'active', plan: 'Premium', goal: 'weightLoss',
    startWeight: 72, currentWeight: 65.5, goalWeight: 60,
    startDate: '2024-01-15', compliance: 92,
    notes: '',
    measurements: { waist: 72, hips: 98, chest: 92 },
    checkins: [
      { id: 1, date: '2025-02-01', weight: 65.5, change: -0.3 },
      { id: 2, date: '2025-01-25', weight: 65.8, change: -0.5 },
      { id: 3, date: '2025-01-18', weight: 66.3, change: -0.7 },
    ],
    workouts: [
      { id: 1, name: 'Full Body A', nameRu: 'Всё тело А', date: '2025-02-01', completed: true },
      { id: 2, name: 'Upper Body', nameRu: 'Верх тела', date: '2025-01-30', completed: true },
      { id: 3, name: 'Lower Body', nameRu: 'Низ тела', date: '2025-01-28', completed: false },
    ]
  },
  '2': {
    id: '2', name: 'Maria Sokolova', email: 'maria@example.com', phone: '+1 234 567 891',
    initials: 'MS', status: 'active', plan: 'Basic', goal: 'weightLoss',
    startWeight: 68, currentWeight: 64.2, goalWeight: 58,
    startDate: '2024-01-20', compliance: 78,
    notes: '',
    measurements: { waist: 70, hips: 95, chest: 88 },
    checkins: [
      { id: 1, date: '2025-01-28', weight: 64.2, change: -0.4 },
    ],
    workouts: [
      { id: 1, name: 'HIIT Cardio', nameRu: 'ВИИТ Кардио', date: '2025-01-29', completed: true },
    ]
  },
  '3': {
    id: '3', name: 'Elena Petrova', email: 'elena@example.com', phone: '+1 234 567 892',
    initials: 'EP', status: 'expiring', plan: 'Premium', goal: 'weightLoss',
    startWeight: 85, currentWeight: 77.8, goalWeight: 70,
    startDate: '2024-11-01', compliance: 85,
    notes: '',
    measurements: { waist: 80, hips: 105, chest: 98 },
    checkins: [],
    workouts: []
  }
}

export default function ClientDetailPage() {
  const { t, locale } = useTranslation()
  const params = useParams()
  const clientId = params.id as string
  const [client, setClient] = useState(clientsData[clientId])
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editForm, setEditForm] = useState(client || {})

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-zinc-500 mb-4">{t('admin.clientNotFound')}</p>
        <Link href="/dashboard/clients"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />{t('admin.backToClients')}</Button></Link>
      </div>
    )
  }

  const weightLost = client.startWeight - client.currentWeight
  const progressPercent = Math.min(100, Math.max(0, Math.round((weightLost / (client.startWeight - client.goalWeight)) * 100)))

  const handleSave = () => {
    setClient({ ...client, ...editForm })
    setIsEditModalOpen(false)
    toast.success(t('admin.clientUpdated'))
  }

  const handleDelete = () => {
    toast.success(t('admin.clientDeleted'))
    setIsDeleteModalOpen(false)
  }

  const tabs = [
    { id: 'overview', label: t('clients.detail.overview') },
    { id: 'workouts', label: t('clients.detail.workouts') },
    { id: 'checkins', label: t('clients.detail.checkins') },
    { id: 'nutrition', label: t('clients.detail.nutrition') },
    { id: 'messages', label: t('clients.detail.messages') },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <Avatar fallback={client.initials} size="lg" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900">{client.name}</h1>
              <Badge variant={client.status === 'active' ? 'success' : 'warning'}>{t(`clients.status.${client.status}`)}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-zinc-500">
              <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{client.email}</span>
              <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{client.phone}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}><Edit className="w-4 h-4 mr-2" />{t('common.edit')}</Button>
          <Button variant="outline" className="text-red-500 hover:bg-red-50" onClick={() => setIsDeleteModalOpen(true)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-sm text-zinc-500">{t('clients.detail.startWeight')}</p>
          <p className="text-2xl font-bold text-zinc-900">{client.startWeight} kg</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-sm text-zinc-500">{t('clients.detail.currentWeight')}</p>
          <p className="text-2xl font-bold text-zinc-900">{client.currentWeight} kg</p>
          <p className="text-xs text-green-500">-{weightLost.toFixed(1)} kg</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-sm text-zinc-500">{t('clients.detail.goalWeight')}</p>
          <p className="text-2xl font-bold text-zinc-900">{client.goalWeight} kg</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-sm text-zinc-500">{t('clients.table.compliance')}</p>
          <p className="text-2xl font-bold text-teal-500">{client.compliance}%</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-sm text-zinc-500">{t('clients.detail.memberSince')}</p>
          <p className="text-lg font-bold text-zinc-900">{new Date(client.startDate).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}</p>
        </CardContent></Card>
      </div>

      {/* Progress Bar */}
      <Card><CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-zinc-900">{t('admin.progressToGoal')}</h3>
          <span className="text-sm font-medium text-teal-500">{progressPercent}%</span>
        </div>
        <div className="w-full h-3 bg-zinc-200 rounded-full">
          <div className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-zinc-500">
          <span>{client.startWeight} kg</span>
          <span>{client.goalWeight} kg</span>
        </div>
      </CardContent></Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>{t('admin.measurements')}</CardTitle></CardHeader>
            <CardContent className="divide-y divide-zinc-100">
              <div className="flex justify-between py-2"><span className="text-zinc-500">{t('admin.waist')}</span><span className="font-medium">{client.measurements?.waist || '-'} cm</span></div>
              <div className="flex justify-between py-2"><span className="text-zinc-500">{t('admin.hips')}</span><span className="font-medium">{client.measurements?.hips || '-'} cm</span></div>
              <div className="flex justify-between py-2"><span className="text-zinc-500">{t('admin.chest')}</span><span className="font-medium">{client.measurements?.chest || '-'} cm</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('admin.notes')}</CardTitle></CardHeader>
            <CardContent>
              <textarea 
                className="w-full h-32 p-3 rounded-xl border border-zinc-200 resize-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                value={client.notes}
                onChange={(e) => setClient({ ...client, notes: e.target.value })}
                placeholder={t('admin.notesPlaceholder')}
              />
              <Button variant="outline" size="sm" className="mt-3" onClick={() => toast.success(t('admin.notesSaved'))}>
                <Save className="w-4 h-4 mr-2" />{t('admin.saveNotes')}
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>{t('admin.quickActions')}</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline"><Dumbbell className="w-4 h-4 mr-2" />{t('clients.detail.assignWorkout')}</Button>
              <Button variant="outline"><MessageSquare className="w-4 h-4 mr-2" />{t('clients.detail.sendMessage')}</Button>
              <Button variant="outline"><ClipboardCheck className="w-4 h-4 mr-2" />{t('admin.requestCheckin')}</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'workouts' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('admin.assignedWorkouts')}</CardTitle>
            <Button variant="gradient" size="sm"><Plus className="w-4 h-4 mr-2" />{t('admin.assignWorkout')}</Button>
          </CardHeader>
          <CardContent>
            {client.workouts.length > 0 ? (
              <div className="space-y-3">
                {client.workouts.map((workout: any) => (
                  <div key={workout.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${workout.completed ? 'bg-green-100 text-green-600' : 'bg-zinc-200 text-zinc-500'}`}>
                        <Dumbbell className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">{locale === 'ru' ? workout.nameRu : workout.name}</p>
                        <p className="text-sm text-zinc-500">{new Date(workout.date).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}</p>
                      </div>
                    </div>
                    <Badge variant={workout.completed ? 'success' : 'secondary'}>
                      {workout.completed ? t('admin.completed') : t('admin.pending')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">{t('admin.noWorkouts')}</div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'checkins' && (
        <Card>
          <CardHeader><CardTitle>{t('admin.checkinHistory')}</CardTitle></CardHeader>
          <CardContent>
            {client.checkins.length > 0 ? (
              <div className="space-y-3">
                {client.checkins.map((checkin: any) => (
                  <div key={checkin.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center"><Calendar className="w-5 h-5" /></div>
                      <div>
                        <p className="font-medium text-zinc-900">{checkin.weight} kg</p>
                        <p className="text-sm text-zinc-500">{new Date(checkin.date).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {checkin.change < 0 ? <TrendingDown className="w-4 h-4 text-green-500" /> : <TrendingUp className="w-4 h-4 text-red-500" />}
                      <span className={`font-medium ${checkin.change < 0 ? 'text-green-500' : 'text-red-500'}`}>{checkin.change > 0 ? '+' : ''}{checkin.change} kg</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">{t('admin.noCheckins')}</div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'nutrition' && (
        <Card>
          <CardHeader><CardTitle>{t('admin.nutritionPlan')}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center py-8 text-zinc-500">{t('admin.nutritionNotSet')}</div>
            <div className="text-center"><Button variant="outline"><Plus className="w-4 h-4 mr-2" />{t('admin.setNutritionTargets')}</Button></div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'messages' && (
        <Card>
          <CardHeader><CardTitle>{t('clients.detail.messages')}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center py-8 text-zinc-500">{t('admin.noMessages')}</div>
            <div className="text-center">
              <Link href={`/dashboard/messages`}><Button variant="outline"><MessageSquare className="w-4 h-4 mr-2" />{t('admin.openChat')}</Button></Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t('admin.editClient')} size="md">
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
          <Input label={t('admin.fullName')} value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <Input label={t('common.email')} type="email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          <Input label={t('common.phone')} value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('admin.currentWeightLabel')} type="number" step="0.1" value={editForm.currentWeight || ''} onChange={(e) => setEditForm({ ...editForm, currentWeight: parseFloat(e.target.value) })} />
            <Input label={t('admin.goalWeightLabel')} type="number" step="0.1" value={editForm.goalWeight || ''} onChange={(e) => setEditForm({ ...editForm, goalWeight: parseFloat(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">{t('admin.plan')}</label>
            <select className="w-full h-12 px-4 rounded-xl border border-zinc-200" value={editForm.plan || ''} onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}>
              <option value="Basic">{t('clients.plans.basic')}</option>
              <option value="Premium">{t('clients.plans.premium')}</option>
              <option value="VIP">{t('clients.plans.vip')}</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="gradient">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={t('admin.deleteClient')} size="sm">
        <div className="space-y-4">
          <p className="text-zinc-600">{t('admin.deleteConfirm')} <strong>{client.name}</strong>? {t('admin.deleteWarning')}</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white"><Trash2 className="w-4 h-4 mr-2" />{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
