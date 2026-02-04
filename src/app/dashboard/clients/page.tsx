'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { Search, Plus, Eye, TrendingDown, TrendingUp, User, Mail, Phone, Target, Edit, Trash2, Download, Send, CheckSquare } from 'lucide-react'
import { toast } from 'sonner'

const initialClients = [
  { id: '1', name: 'Anna Kovaleva', email: 'anna@example.com', phone: '+1234567890', initials: 'AK', status: 'active', plan: 'Premium', startWeight: 72, currentWeight: 65.5, goal: 'weightLoss', compliance: 92 },
  { id: '2', name: 'Maria Sokolova', email: 'maria@example.com', phone: '+1234567891', initials: 'MS', status: 'active', plan: 'Basic', startWeight: 68, currentWeight: 64.2, goal: 'weightLoss', compliance: 78 },
  { id: '3', name: 'Elena Petrova', email: 'elena@example.com', phone: '+1234567892', initials: 'EP', status: 'expiring', plan: 'Premium', startWeight: 85, currentWeight: 77.8, goal: 'weightLoss', compliance: 85 },
  { id: '4', name: 'Olga Volkova', email: 'olga@example.com', phone: '+1234567893', initials: 'OV', status: 'active', plan: 'VIP', startWeight: 60, currentWeight: 58.1, goal: 'muscleGain', compliance: 95 },
  { id: '5', name: 'Svetlana Morozova', email: 'sveta@example.com', phone: '+1234567894', initials: 'SM', status: 'inactive', plan: 'Basic', startWeight: 75, currentWeight: 73.0, goal: 'weightLoss', compliance: 45 },
]

export default function ClientsPage() {
  const { t } = useTranslation()
  const [clients, setClients] = useState(initialClients)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', plan: 'Basic', goal: 'weightLoss', startWeight: '' })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const locale = require('@/lib/i18n').useTranslation().locale
  const ru = locale === 'ru'

  const toggleSelect = (id: string) => {
    const s = new Set(selectedIds)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelectedIds(s)
  }
  const toggleAll = () => setSelectedIds(selectedIds.size === filteredClients.length ? new Set() : new Set(filteredClients.map(c => c.id)))
  const bulkMessage = () => { toast.success(ru ? `Сообщение отправлено ${selectedIds.size} клиентам` : `Message sent to ${selectedIds.size} clients`); setSelectedIds(new Set()) }
  const bulkExport = () => { toast.success(ru ? `Экспорт ${selectedIds.size} клиентов` : `Exported ${selectedIds.size} clients`); setSelectedIds(new Set()) }
  const bulkDelete = () => { setClients(clients.filter(c => !selectedIds.has(c.id))); toast.success(ru ? `Удалено ${selectedIds.size} клиентов` : `Deleted ${selectedIds.size} clients`); setSelectedIds(new Set()) }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) || client.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const resetForm = () => setFormData({ name: '', email: '', phone: '', plan: 'Basic', goal: 'weightLoss', startWeight: '' })

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault()
    const newClient = {
      id: String(Date.now()),
      ...formData,
      initials: formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      status: 'active',
      startWeight: parseFloat(formData.startWeight) || 70,
      currentWeight: parseFloat(formData.startWeight) || 70,
      compliance: 0,
    }
    setClients([newClient, ...clients])
    setIsAddModalOpen(false)
    resetForm()
    toast.success(t('admin.clientAdded'))
  }

  const handleEditClient = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient) return
    setClients(clients.map(c => c.id === selectedClient.id ? { ...c, ...formData, initials: formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2), startWeight: parseFloat(formData.startWeight) || c.startWeight } : c))
    setIsEditModalOpen(false)
    setSelectedClient(null)
    resetForm()
    toast.success(t('admin.clientUpdated'))
  }

  const handleDeleteClient = () => {
    if (!selectedClient) return
    setClients(clients.filter(c => c.id !== selectedClient.id))
    setIsDeleteModalOpen(false)
    setSelectedClient(null)
    toast.success(t('admin.clientDeleted'))
  }

  const openEditModal = (client: any) => {
    setSelectedClient(client)
    setFormData({ name: client.name, email: client.email, phone: client.phone, plan: client.plan, goal: client.goal, startWeight: String(client.startWeight) })
    setIsEditModalOpen(true)
  }

  const ClientForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void, submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input label={t('clients.modal.name')} icon={<User className="w-4 h-4" />} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
      <Input label={t('clients.modal.email')} type="email" icon={<Mail className="w-4 h-4" />} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
      <Input label={t('clients.modal.phone')} icon={<Phone className="w-4 h-4" />} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">{t('clients.modal.plan')}</label>
          <select className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-white" value={formData.plan} onChange={(e) => setFormData({...formData, plan: e.target.value})}>
            <option value="Basic">{t('clients.plans.basic')}</option>
            <option value="Premium">{t('clients.plans.premium')}</option>
            <option value="VIP">{t('clients.plans.vip')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">{t('clients.modal.goal')}</label>
          <select className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-white" value={formData.goal} onChange={(e) => setFormData({...formData, goal: e.target.value})}>
            <option value="weightLoss">{t('clients.goals.weightLoss')}</option>
            <option value="muscleGain">{t('clients.goals.muscleGain')}</option>
            <option value="maintenance">{t('clients.goals.maintenance')}</option>
            <option value="recovery">{t('clients.goals.recovery')}</option>
          </select>
        </div>
      </div>
      <Input label={t('clients.modal.startWeight')} type="number" step="0.1" icon={<Target className="w-4 h-4" />} value={formData.startWeight} onChange={(e) => setFormData({...formData, startWeight: e.target.value})} placeholder="70" />
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>{t('common.cancel')}</Button>
        <Button type="submit" variant="gradient">{submitLabel}</Button>
      </div>
    </form>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-zinc-900">{t('clients.title')}</h1><p className="text-zinc-500 mt-1">{t('clients.subtitle')}</p></div>
        <div className="flex gap-3">
          <Link href="/dashboard/clients/onboard"><Button variant="outline"><User className="w-4 h-4 mr-2" />{ru ? 'Онбординг' : 'Onboard'}</Button></Link>
          <Button variant="gradient" onClick={() => { resetForm(); setIsAddModalOpen(true); }}><Plus className="w-4 h-4 mr-2" />{t('clients.addClient')}</Button>
        </div>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" /><Input placeholder={t('clients.searchPlaceholder')} className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'active', 'expiring', 'inactive'].map((status) => (
              <Button key={status} variant={statusFilter === status ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(status)}>{t(`clients.filters.${status}`)}</Button>
            ))}
          </div>
        </div>
      </CardContent></Card>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl border border-teal-200">
          <CheckSquare className="w-5 h-5 text-teal-600" />
          <span className="text-sm font-medium text-teal-800">{selectedIds.size} {ru ? 'выбрано' : 'selected'}</span>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={bulkMessage}><Send className="w-4 h-4 mr-1" />{ru ? 'Сообщение' : 'Message'}</Button>
          <Button size="sm" variant="outline" onClick={bulkExport}><Download className="w-4 h-4 mr-1" />{ru ? 'Экспорт' : 'Export'}</Button>
          <Button size="sm" variant="outline" onClick={bulkDelete} className="text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4 mr-1" />{ru ? 'Удалить' : 'Delete'}</Button>
        </div>
      )}

      <Card><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="py-4 px-3 w-10"><input type="checkbox" className="w-4 h-4 rounded border-zinc-300 accent-teal-500" checked={selectedIds.size === filteredClients.length && filteredClients.length > 0} onChange={toggleAll} /></th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600">{t('clients.table.client')}</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600">{t('clients.table.plan')}</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600">{t('clients.table.progress')}</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600">{t('clients.table.compliance')}</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600">{t('clients.table.status')}</th>
              <th className="text-right py-4 px-6 text-sm font-semibold text-zinc-600">{t('common.actions')}</th>
            </tr></thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-zinc-500">{t('common.noResults')}</td></tr>
              ) : filteredClients.map((client) => {
                const weightChange = client.startWeight - client.currentWeight
                return (
                  <tr key={client.id} className={`border-b border-zinc-100 hover:bg-zinc-50 ${selectedIds.has(client.id) ? 'bg-teal-50/50' : ''}`}>
                    <td className="py-4 px-3"><input type="checkbox" className="w-4 h-4 rounded border-zinc-300 accent-teal-500" checked={selectedIds.has(client.id)} onChange={() => toggleSelect(client.id)} /></td>
                    <td className="py-4 px-6"><div className="flex items-center gap-3"><Avatar fallback={client.initials} /><div><p className="font-medium text-zinc-900">{client.name}</p><p className="text-sm text-zinc-500">{client.email}</p></div></div></td>
                    <td className="py-4 px-6"><Badge variant="outline">{client.plan}</Badge></td>
                    <td className="py-4 px-6"><div className="flex items-center gap-2">{weightChange > 0 ? <TrendingDown className="w-4 h-4 text-green-500" /> : weightChange < 0 ? <TrendingUp className="w-4 h-4 text-red-500" /> : null}<span className="font-medium">{client.currentWeight} kg</span>{weightChange !== 0 && <span className={`text-sm ${weightChange > 0 ? 'text-green-500' : 'text-red-500'}`}>({weightChange > 0 ? '-' : '+'}{Math.abs(weightChange).toFixed(1)})</span>}</div></td>
                    <td className="py-4 px-6"><div className="flex items-center gap-2"><div className="w-20 h-2 bg-zinc-200 rounded-full"><div className={`h-full rounded-full ${client.compliance >= 80 ? 'bg-green-500' : client.compliance >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${client.compliance}%` }} /></div><span className="text-sm font-medium">{client.compliance}%</span></div></td>
                    <td className="py-4 px-6"><Badge variant={client.status === 'active' ? 'success' : client.status === 'expiring' ? 'warning' : 'secondary'}>{t(`clients.status.${client.status}`)}</Badge></td>
                    <td className="py-4 px-6"><div className="flex items-center justify-end gap-1">
                      <Link href={`/dashboard/clients/${client.id}`}><Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button></Link>
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(client)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedClient(client); setIsDeleteModalOpen(true); }} className="text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                    </div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent></Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('clients.modal.addTitle')} size="md">
        <ClientForm onSubmit={handleAddClient} submitLabel={t('common.add')} />
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedClient(null); }} title={t('clients.modal.editTitle')} size="md">
        <ClientForm onSubmit={handleEditClient} submitLabel={t('common.save')} />
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setSelectedClient(null); }} title={t('common.delete')} size="sm">
        <div className="space-y-4">
          <p className="text-zinc-600">{t('admin.deleteConfirm')} <strong>{selectedClient?.name}</strong>? {t('admin.deleteWarning')}</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDeleteClient} className="bg-red-500 hover:bg-red-600 text-white"><Trash2 className="w-4 h-4 mr-2" />{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
