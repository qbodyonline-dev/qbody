'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Segmented } from '@/components/ui/segmented'
import { Loader2, Search, Users, Check, Gift, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuth } from '@/lib/api'

type Mode = 'free' | 'paid'

type Client = {
  id: string
  full_name: string | null
  email: string | null
  avatar_url?: string | null
}

type AssignedClient = {
  user_id: string | null
  mode: Mode
  assigned: boolean
  has_access: boolean
}

type Props = {
  isOpen: boolean
  onClose: () => void
  /** What is being handed out */
  kind: 'course' | 'program'
  itemId: string | null
  itemTitle: string
  /** Hidden items are reachable only through this list */
  isPrivate: boolean
  ru: boolean
  /** Called after a successful save so the parent can refresh counters */
  onSaved?: () => void
}

/**
 * Assign a course / training program to one or several clients, free or paid.
 *
 * courses  -> /api/courses/[id]/access
 * programs -> /api/programs/[id]/assign
 *
 * "Free" grants access immediately. "Paid" only makes the item visible to that
 * client — they buy it themselves and the Stripe webhook grants access.
 * For a private (hidden) item this list is the only way anybody can see it.
 */
export function AccessManager({ isOpen, onClose, kind, itemId, itemTitle, isPrivate, ru, onSaved }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [assigned, setAssigned] = useState<Map<string, AssignedClient>>(new Map())
  const [initial, setInitial] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [newMode, setNewMode] = useState<Mode>('free')
  const [search, setSearch] = useState('')

  const baseUrl = itemId
    ? (kind === 'course' ? `/api/courses/${itemId}/access` : `/api/programs/${itemId}/assign`)
    : null

  const loadAccess = async () => {
    if (!baseUrl) return
    const res = await fetchWithAuth(baseUrl)
    if (!res.ok) return
    const data = await res.json()
    const map = new Map<string, AssignedClient>()
    for (const c of data.clients || []) {
      if (c.user_id) map.set(c.user_id, c)
    }
    // Only real assignments are pre-ticked. A client who simply bought the item
    // shows up with a badge but stays unticked, so saving this dialog can never
    // revoke a purchase it did not create.
    const assignedIds = new Set(
      Array.from(map.values())
        .filter(c => c.assigned && c.user_id)
        .map(c => c.user_id as string)
    )
    setAssigned(map)
    setInitial(assignedIds)
    setSelected(new Set(assignedIds))
  }

  useEffect(() => {
    if (!isOpen || !baseUrl) return

    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const clientsRes = await fetchWithAuth('/api/clients')
        if (cancelled) return
        if (clientsRes.ok) {
          const data = await clientsRes.json()
          setClients(Array.isArray(data) ? data : [])
        }
        await loadAccess()
      } catch {
        if (!cancelled) toast.error(ru ? 'Не удалось загрузить список' : 'Failed to load the list')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, baseUrl, ru])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c =>
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    )
  }, [clients, search])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  /** Flip an already-assigned client between free and paid right away. */
  const switchMode = async (clientId: string, mode: Mode) => {
    if (!baseUrl) return
    setSaving(true)
    try {
      const res = await fetchWithAuth(baseUrl, {
        method: 'PATCH',
        body: JSON.stringify({ client_id: clientId, mode }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || (ru ? 'Не удалось изменить' : 'Failed to update'))
      }
      await loadAccess()
      onSaved?.()
      toast.success(mode === 'free'
        ? (ru ? 'Выдано бесплатно' : 'Granted for free')
        : (ru ? 'Клиент оплачивает сам' : 'Client pays for it'))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toGrant = Array.from(selected).filter(id => !initial.has(id))
  const toRevoke = Array.from(initial).filter(id => !selected.has(id))
  const dirty = toGrant.length > 0 || toRevoke.length > 0

  const save = async () => {
    if (!baseUrl || !dirty) { onClose(); return }
    setSaving(true)
    try {
      if (toGrant.length > 0) {
        const res = await fetchWithAuth(baseUrl, {
          method: 'POST',
          body: JSON.stringify({ client_ids: toGrant, mode: newMode }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || (ru ? 'Не удалось назначить' : 'Failed to assign'))
        }
      }

      for (const clientId of toRevoke) {
        const res = await fetchWithAuth(`${baseUrl}?client_id=${clientId}`, { method: 'DELETE' })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || (ru ? 'Не удалось снять доступ' : 'Failed to revoke access'))
        }
      }

      toast.success(ru ? 'Доступ обновлён' : 'Access updated')
      await loadAccess()
      onSaved?.()
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ru ? 'Доступ клиентов' : 'Client access'}
      size="lg"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-zinc-500">{itemTitle}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {isPrivate
              ? (ru
                ? 'Скрытый материал: его видят только отмеченные клиенты. В общем каталоге и по прямой ссылке он недоступен.'
                : 'Hidden item: only the clients you tick can see it. It stays out of the catalog and its direct link leads nowhere for anyone else.')
              : (ru
                ? 'Материал открыт всем. Здесь можно выдать его конкретным клиентам напрямую.'
                : 'This item is public. Here you can hand it to specific clients directly.')}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            {ru ? 'Как выдать отмеченным клиентам' : 'How to hand it to the ticked clients'}
          </p>
          <Segmented<Mode>
            value={newMode}
            onChange={setNewMode}
            options={[
              {
                value: 'free',
                label: ru ? 'Бесплатно' : 'Free',
                hint: ru ? 'Доступ открывается сразу' : 'Access opens immediately',
                icon: Gift,
              },
              {
                value: 'paid',
                label: ru ? 'Платно' : 'Paid',
                hint: ru ? 'Клиент видит и покупает сам' : 'The client sees it and buys it',
                icon: CreditCard,
              },
            ]}
          />
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={ru ? 'Поиск по имени или email' : 'Search by name or email'}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-zinc-500">
            <Users className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
            <p className="text-sm">{ru ? 'Клиенты не найдены' : 'No clients found'}</p>
          </div>
        ) : (
          <div className="max-h-[40vh] overflow-y-auto -mx-1 px-1 space-y-1">
            {filtered.map((c) => {
              const checked = selected.has(c.id)
              const current = assigned.get(c.id)
              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                    checked
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                      : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <label className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded accent-teal-500"
                      checked={checked}
                      onChange={() => toggle(c.id)}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {c.full_name || (ru ? 'Без имени' : 'No name')}
                      </span>
                      <span className="block text-xs text-zinc-500 truncate">{c.email}</span>
                    </span>
                  </label>

                  {current?.has_access && (
                    <Badge variant="secondary" className="shrink-0">
                      <Check className="w-3 h-3 mr-1" />
                      {current.assigned ? (ru ? 'есть доступ' : 'has access') : (ru ? 'купил сам' : 'bought it')}
                    </Badge>
                  )}

                  {current?.assigned && (
                    <div className="flex shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                      {(['free', 'paid'] as Mode[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          disabled={saving || current.mode === m}
                          onClick={() => switchMode(c.id, m)}
                          className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                            current.mode === m
                              ? 'bg-teal-500 text-white'
                              : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {m === 'free' ? (ru ? 'бесплатно' : 'free') : (ru ? 'платно' : 'paid')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-zinc-500">
            {ru ? 'Выбрано' : 'Selected'}: {selected.size}
            {dirty && (
              <span className="ml-2 text-teal-600">
                (+{toGrant.length} / −{toRevoke.length})
              </span>
            )}
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>{ru ? 'Отмена' : 'Cancel'}</Button>
            <Button type="button" variant="gradient" onClick={save} disabled={saving || loading || !dirty}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {ru ? 'Сохранить' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
