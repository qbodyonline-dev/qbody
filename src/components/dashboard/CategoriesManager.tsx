'use client'

import React, { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchWithAuth } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'
import { Loader2, Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { toast } from 'sonner'

export type Category = {
  id: string
  slug: string
  name_en: string
  name_ru: string
  display_order: number
}

type Kind = 'muscle-groups' | 'equipment-types'

interface CategoriesManagerProps {
  isOpen: boolean
  onClose: () => void
  onChanged: () => void
}

export default function CategoriesManager({ isOpen, onClose, onChanged }: CategoriesManagerProps) {
  const { locale } = useTranslation()
  const ru = locale === 'ru'
  const [tab, setTab] = useState<Kind>('muscle-groups')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ru ? 'Управление категориями' : 'Manage Categories'}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setTab('muscle-groups')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              tab === 'muscle-groups'
                ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {ru ? 'Группы мышц' : 'Muscle Groups'}
          </button>
          <button
            type="button"
            onClick={() => setTab('equipment-types')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              tab === 'equipment-types'
                ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {ru ? 'Инвентарь' : 'Equipment'}
          </button>
        </div>

        <CategoryList key={tab} kind={tab} ru={ru} onChanged={onChanged} />
      </div>
    </Modal>
  )
}

function CategoryList({ kind, ru, onChanged }: { kind: Kind; ru: boolean; onChanged: () => void }) {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ name_en: string; name_ru: string }>({ name_en: '', name_ru: '' })

  // New-item form
  const [showAdd, setShowAdd] = useState(false)
  const [newForm, setNewForm] = useState<{ slug: string; name_en: string; name_ru: string }>({
    slug: '', name_en: '', name_ru: '',
  })
  const [creating, setCreating] = useState(false)

  const reload = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth(`/api/${kind}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      toast.error(ru ? 'Ошибка загрузки' : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind])

  const startEdit = (item: Category) => {
    setEditingId(item.id)
    setEditForm({ name_en: item.name_en, name_ru: item.name_ru })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ name_en: '', name_ru: '' })
  }

  const saveEdit = async (item: Category) => {
    if (!editForm.name_en.trim() || !editForm.name_ru.trim()) {
      toast.error(ru ? 'Названия обязательны' : 'Names are required')
      return
    }
    setBusyId(item.id)
    try {
      const res = await fetchWithAuth(`/api/${kind}/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(ru ? 'Сохранено' : 'Saved')
      setEditingId(null)
      await reload()
      onChanged()
    } catch {
      toast.error(ru ? 'Ошибка сохранения' : 'Save failed')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (item: Category) => {
    const message = ru
      ? `Удалить "${item.name_ru}"? Все упражнения будут отвязаны от этой категории.`
      : `Delete "${item.name_en}"? Exercises referencing it will be unlinked.`
    if (!window.confirm(message)) return
    setBusyId(item.id)
    try {
      const res = await fetchWithAuth(`/api/${kind}/${item.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success(ru ? 'Удалено' : 'Deleted')
      await reload()
      onChanged()
    } catch {
      toast.error(ru ? 'Ошибка удаления' : 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  const create = async () => {
    if (!newForm.slug.trim() || !newForm.name_en.trim() || !newForm.name_ru.trim()) {
      toast.error(ru ? 'Все поля обязательны' : 'All fields are required')
      return
    }
    setCreating(true)
    try {
      const res = await fetchWithAuth(`/api/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed')
      }
      toast.success(ru ? 'Создано' : 'Created')
      setShowAdd(false)
      setNewForm({ slug: '', name_en: '', name_ru: '' })
      await reload()
      onChanged()
    } catch (e: any) {
      toast.error(e.message || (ru ? 'Ошибка создания' : 'Create failed'))
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {!showAdd && (
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {ru ? 'Добавить' : 'Add'}
          </Button>
        )}
      </div>

      {showAdd && (
        <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/10 p-3 space-y-2">
          <div className="grid sm:grid-cols-3 gap-2">
            <Input
              placeholder={ru ? 'slug (англ., без пробелов)' : 'slug (lowercase, no spaces)'}
              value={newForm.slug}
              onChange={e => setNewForm({ ...newForm, slug: e.target.value })}
            />
            <Input
              placeholder="Name (EN)"
              value={newForm.name_en}
              onChange={e => setNewForm({ ...newForm, name_en: e.target.value })}
            />
            <Input
              placeholder="Название (RU)"
              value={newForm.name_ru}
              onChange={e => setNewForm({ ...newForm, name_ru: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAdd(false)
                setNewForm({ slug: '', name_en: '', name_ru: '' })
              }}
            >
              {ru ? 'Отмена' : 'Cancel'}
            </Button>
            <Button variant="default" size="sm" onClick={create} disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {ru ? 'Создать' : 'Create'}
            </Button>
          </div>
          <p className="text-xs text-zinc-500">
            {ru
              ? 'slug — внутренний идентификатор, не меняется после создания. Используйте латиницу: chest, dumbbells и т. п.'
              : 'slug is an internal id — cannot be changed after creation. Use lowercase ASCII: chest, dumbbells, etc.'}
          </p>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 text-sm">
          {ru ? 'Категорий нет' : 'No categories yet'}
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          {items.map(item => {
            const isEditing = editingId === item.id
            const isBusy = busyId === item.id
            return (
              <li key={item.id} className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <div className="font-mono text-xs text-zinc-400 w-24 flex-shrink-0 truncate">{item.slug}</div>

                {isEditing ? (
                  <div className="flex-1 grid sm:grid-cols-2 gap-2">
                    <Input
                      value={editForm.name_en}
                      onChange={e => setEditForm({ ...editForm, name_en: e.target.value })}
                      placeholder="Name (EN)"
                    />
                    <Input
                      value={editForm.name_ru}
                      onChange={e => setEditForm({ ...editForm, name_ru: e.target.value })}
                      placeholder="Название (RU)"
                    />
                  </div>
                ) : (
                  <div className="flex-1 min-w-0 grid sm:grid-cols-2 gap-2 text-sm">
                    <div className="text-zinc-700 dark:text-zinc-300 truncate">{item.name_en}</div>
                    <div className="text-zinc-700 dark:text-zinc-300 truncate">{item.name_ru}</div>
                  </div>
                )}

                <div className="flex items-center gap-1 flex-shrink-0">
                  {isEditing ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => saveEdit(item)} disabled={isBusy}>
                        {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-green-600" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={isBusy}>
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(item)} disabled={isBusy}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(item)} disabled={isBusy}>
                        {isBusy ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4 text-red-500" />}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
