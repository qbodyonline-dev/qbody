'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { fetchWithAuth } from '@/lib/api'
import { Edit, Flame, Beef, Wheat, Droplets, Loader2, Plus, Search, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

type ClientNutrition = {
  id: string
  name: string
  email: string
  avatar_url: string | null
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  notes: string | null
  has_target: boolean
  logged_days_7d: number
  compliance_7d: number
}

export default function NutritionPage() {
  const { t, locale } = useTranslation()
  const [clients, setClients] = useState<ClientNutrition[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientNutrition | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ calories: '', protein: '', carbs: '', fat: '', notes: '' })

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetchWithAuth('/api/nutrition/targets')
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
      }
    } catch (err) {
      console.error('Load nutrition error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openEdit = (client: ClientNutrition) => {
    setEditingClient(client)
    setForm({
      calories: String(client.calories || ''),
      protein: String(client.protein || ''),
      carbs: String(client.carbs || ''),
      fat: String(client.fat || ''),
      notes: client.notes || '',
    })
    setIsEditOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient) return

    setSaving(true)
    try {
      const res = await fetchWithAuth('/api/nutrition/targets', {
        method: 'POST',
        body: JSON.stringify({
          client_id: editingClient.id,
          calories: parseInt(form.calories) || 0,
          protein: parseInt(form.protein) || 0,
          carbs: parseInt(form.carbs) || 0,
          fat: parseInt(form.fat) || 0,
          notes: form.notes || null,
        }),
      })

      if (res.ok) {
        toast.success(locale === 'ru' ? 'Цели КБЖУ сохранены' : 'Nutrition targets saved')
        setIsEditOpen(false)
        load()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to save')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const withTargets = clients.filter(c => c.has_target)
  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  // Summary stats (only clients with targets)
  const avg = (field: 'calories' | 'protein' | 'carbs' | 'fat') => {
    const vals = withTargets.map(c => c[field]).filter((v): v is number => v != null)
    return vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0
  }
  const avgCompliance = withTargets.length > 0
    ? Math.round(withTargets.reduce((s, c) => s + c.compliance_7d, 0) / withTargets.length)
    : 0

  const summaryStats = [
    { icon: Flame, label: locale === 'ru' ? 'Калории (ср.)' : 'Calories (avg)', value: `${avg('calories')}`, color: 'text-orange-500 bg-orange-50' },
    { icon: Beef, label: locale === 'ru' ? 'Белок (ср.)' : 'Protein (avg)', value: `${avg('protein')}g`, color: 'text-red-500 bg-red-50' },
    { icon: Wheat, label: locale === 'ru' ? 'Углеводы (ср.)' : 'Carbs (avg)', value: `${avg('carbs')}g`, color: 'text-amber-500 bg-amber-50' },
    { icon: CheckCircle2, label: locale === 'ru' ? 'Соблюдение (7д)' : 'Compliance (7d)', value: `${avgCompliance}%`, color: 'text-teal-500 bg-teal-50' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {locale === 'ru' ? 'Питание' : 'Nutrition'}
        </h1>
        <p className="text-zinc-500 mt-1">
          {locale === 'ru'
            ? `${withTargets.length} из ${clients.length} клиентов с целями КБЖУ`
            : `${withTargets.length} of ${clients.length} clients with targets set`}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stat.value}</p>
                  <p className="text-sm text-zinc-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder={locale === 'ru' ? 'Поиск клиента...' : 'Search client...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />
      </div>

      {/* Clients table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                    {locale === 'ru' ? 'Клиент' : 'Client'}
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                    {locale === 'ru' ? 'Калории' : 'Calories'}
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                    {locale === 'ru' ? 'Белок' : 'Protein'}
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                    {locale === 'ru' ? 'Углеводы' : 'Carbs'}
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                    {locale === 'ru' ? 'Жиры' : 'Fat'}
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                    {locale === 'ru' ? '7д лог' : '7d log'}
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                    {locale === 'ru' ? 'Соблюдение' : 'Compliance'}
                  </th>
                  <th className="text-right py-4 px-6"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => {
                  const initials = client.name
                    .split(' ')
                    .map(w => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)

                  return (
                    <tr key={client.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Avatar fallback={initials} src={client.avatar_url || undefined} size="sm" />
                          <div>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{client.name}</span>
                            <p className="text-xs text-zinc-400">{client.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-zinc-900 dark:text-zinc-100">
                        {client.calories ?? <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="py-4 px-6 text-zinc-700 dark:text-zinc-300">
                        {client.protein ? `${client.protein}g` : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="py-4 px-6 text-zinc-700 dark:text-zinc-300">
                        {client.carbs ? `${client.carbs}g` : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="py-4 px-6 text-zinc-700 dark:text-zinc-300">
                        {client.fat ? `${client.fat}g` : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-zinc-500">
                          {client.logged_days_7d}/7
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {client.has_target ? (
                          <Badge variant={client.compliance_7d >= 80 ? 'success' : client.compliance_7d >= 50 ? 'warning' : 'destructive'}>
                            {client.compliance_7d}%
                          </Badge>
                        ) : (
                          <span className="text-xs text-zinc-400">{locale === 'ru' ? 'нет целей' : 'no targets'}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(client)}>
                          {client.has_target ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-400">
                      {locale === 'ru' ? 'Нет клиентов' : 'No clients found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit/Set targets modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`${editingClient?.has_target
          ? (locale === 'ru' ? 'Редактировать цели' : 'Edit Targets')
          : (locale === 'ru' ? 'Установить цели' : 'Set Targets')
        } — ${editingClient?.name || ''}`}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label={locale === 'ru' ? 'Калории (ккал)' : 'Calories (kcal)'}
            type="number"
            icon={<Flame className="w-4 h-4" />}
            value={form.calories}
            onChange={(e) => setForm({ ...form, calories: e.target.value })}
            required
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label={locale === 'ru' ? 'Белок (г)' : 'Protein (g)'}
              type="number"
              value={form.protein}
              onChange={(e) => setForm({ ...form, protein: e.target.value })}
              required
            />
            <Input
              label={locale === 'ru' ? 'Углеводы (г)' : 'Carbs (g)'}
              type="number"
              value={form.carbs}
              onChange={(e) => setForm({ ...form, carbs: e.target.value })}
              required
            />
            <Input
              label={locale === 'ru' ? 'Жиры (г)' : 'Fat (g)'}
              type="number"
              value={form.fat}
              onChange={(e) => setForm({ ...form, fat: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              {locale === 'ru' ? 'Заметки' : 'Notes'}
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 resize-none h-24 text-sm"
              placeholder={locale === 'ru' ? 'Рекомендации по питанию...' : 'Nutrition recommendations...'}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Quick calculator hint */}
          {form.protein && form.carbs && form.fat && (
            <div className="text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
              {locale === 'ru' ? 'Расчёт' : 'Calculated'}:{' '}
              {(parseInt(form.protein || '0') * 4) + (parseInt(form.carbs || '0') * 4) + (parseInt(form.fat || '0') * 9)} kcal{' '}
              {locale === 'ru' ? 'из макросов' : 'from macros'}
              {form.calories && ` (${locale === 'ru' ? 'цель' : 'target'}: ${form.calories})`}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
              {locale === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
            <Button type="submit" variant="gradient" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {locale === 'ru' ? 'Сохранить' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
