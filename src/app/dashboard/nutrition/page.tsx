'use client'
import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { Edit, Flame, Beef, Wheat, Droplets } from 'lucide-react'
import { toast } from 'sonner'

const initialClients = [
  { id: '1', name: 'Anna K.', initials: 'AK', calories: 1800, protein: 120, carbs: 180, fat: 60, compliance: 85 },
  { id: '2', name: 'Maria S.', initials: 'MS', calories: 2000, protein: 140, carbs: 200, fat: 70, compliance: 78 },
  { id: '3', name: 'Elena P.', initials: 'EP', calories: 1600, protein: 100, carbs: 160, fat: 55, compliance: 92 },
]

export default function NutritionPage() {
  const { t } = useTranslation()
  const [clients, setClients] = useState(initialClients)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)
  const [form, setForm] = useState({ calories: '', protein: '', carbs: '', fat: '' })

  const openEdit = (client: any) => {
    setEditingClient(client)
    setForm({ 
      calories: String(client.calories), 
      protein: String(client.protein), 
      carbs: String(client.carbs), 
      fat: String(client.fat) 
    })
    setIsEditOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient) return
    setClients(clients.map(c => c.id === editingClient.id ? {
      ...c,
      calories: parseInt(form.calories) || c.calories,
      protein: parseInt(form.protein) || c.protein,
      carbs: parseInt(form.carbs) || c.carbs,
      fat: parseInt(form.fat) || c.fat,
    } : c))
    setIsEditOpen(false)
    toast.success(t('settings.saved'))
  }

  const summaryStats = [
    { icon: Flame, label: t('nutrition.table.calories'), value: `${Math.round(clients.reduce((s, c) => s + c.calories, 0) / clients.length)}`, color: 'text-orange-500 bg-orange-50' },
    { icon: Beef, label: t('nutrition.table.protein'), value: `${Math.round(clients.reduce((s, c) => s + c.protein, 0) / clients.length)}g`, color: 'text-red-500 bg-red-50' },
    { icon: Wheat, label: t('nutrition.table.carbs'), value: `${Math.round(clients.reduce((s, c) => s + c.carbs, 0) / clients.length)}g`, color: 'text-amber-500 bg-amber-50' },
    { icon: Droplets, label: t('nutrition.table.fat'), value: `${Math.round(clients.reduce((s, c) => s + c.fat, 0) / clients.length)}g`, color: 'text-blue-500 bg-blue-50' },
  ]

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-zinc-900">{t('nutrition.title')}</h1><p className="text-zinc-500 mt-1">{t('nutrition.subtitle')}</p></div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}><CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color}`}><Icon className="w-6 h-6" /></div>
              <div><p className="text-2xl font-bold text-zinc-900">{stat.value}</p><p className="text-sm text-zinc-500">{stat.label} (avg)</p></div>
            </CardContent></Card>
          )
        })}
      </div>

      <Card><CardContent className="p-0">
        <table className="w-full">
          <thead><tr className="border-b border-zinc-200 bg-zinc-50">
            <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600">{t('nutrition.table.client')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600">{t('nutrition.table.calories')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600">{t('nutrition.table.protein')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600">{t('nutrition.table.carbs')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600">{t('nutrition.table.fat')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600">{t('nutrition.table.compliance')}</th>
            <th className="text-right py-4 px-6"></th>
          </tr></thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="py-4 px-6"><div className="flex items-center gap-3"><Avatar fallback={client.initials} size="sm" /><span className="font-medium">{client.name}</span></div></td>
                <td className="py-4 px-6 font-medium">{client.calories}</td>
                <td className="py-4 px-6">{client.protein}g</td>
                <td className="py-4 px-6">{client.carbs}g</td>
                <td className="py-4 px-6">{client.fat}g</td>
                <td className="py-4 px-6"><Badge variant={client.compliance >= 80 ? 'success' : 'warning'}>{client.compliance}%</Badge></td>
                <td className="py-4 px-6 text-right"><Button variant="ghost" size="sm" onClick={() => openEdit(client)}><Edit className="w-4 h-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`${t('nutrition.modal.title')} — ${editingClient?.name || ''}`} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label={t('nutrition.modal.calories')} type="number" icon={<Flame className="w-4 h-4" />} value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
          <div className="grid grid-cols-3 gap-4">
            <Input label={t('nutrition.modal.protein')} type="number" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} />
            <Input label={t('nutrition.modal.carbs')} type="number" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} />
            <Input label={t('nutrition.modal.fat')} type="number" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">{t('nutrition.modal.notes')}</label>
            <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 resize-none h-24" placeholder="..." />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="gradient">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
