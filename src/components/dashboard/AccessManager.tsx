'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Users, Check } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuth } from '@/lib/api'

type Client = {
  id: string
  full_name: string | null
  email: string | null
  avatar_url?: string | null
}

type AssignedClient = {
  user_id: string | null
  full_name: string | null
  email: string | null
  status?: string
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
 * Assign a course / training program to one or several clients.
 *
 * courses  -> POST/DELETE /api/courses/[id]/access
 * programs -> POST/DELETE /api/programs/[id]/assign
 *
 * For a private (hidden) item this list is the only way anybody can see it.
 */
export function AccessManager({ isOpen, onClose, kind, itemId, itemTitle, isPrivate, ru, onSaved }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [assigned, setAssigned] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  const baseUrl = itemId
    ? (kind === 'course' ? `/api/courses/${itemId}/access` : `/api/programs/${itemId}/assign`)
    : null

  useEffect(() => {
    if (!isOpen || !baseUrl) return

    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [clientsRes, accessRes] = await Promise.all([
          fetchWithAuth('/api/clients'),
          fetchWithAuth(baseUrl),
        ])

        if (cancelled) return

        if (clientsRes.ok) {
          const data = await clientsRes.json()
          setClients(Array.isArray(data) ? data : [])
        }

        if (accessRes.ok) {
          const data = await accessRes.json()
          const ids = new Set<string>(
            (data.clients || [])
              .map((c: AssignedClient) => c.user_id)
              .filter((id: string | null): id is string => !!id)
          )
          setAssigned(ids)
          setSelected(new Set(ids))
        }
      } catch {
        if (!cancelled) toast.error(ru ? 'Не удалось загрузить список' : 'Failed to load the list')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
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

  const toGrant = Array.from(selected).filter(id => !assigned.has(id))
  const toRevoke = Array.from(assigned).filter(id => !selected.has(id))
  const dirty = toGrant.length > 0 || toRevoke.length > 0

  const save = async () => {
    if (!baseUrl || !dirty) { onClose(); return }
    setSaving(true)
    try {
      if (toGrant.length > 0) {
        const res = await fetchWithAuth(baseUrl, {
          method: 'POST',
          body: JSON.stringify({ client_ids: toGrant }),
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
      setAssigned(new Set(selected))
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
          <p className="text-sm text-zinc-500">
            {itemTitle}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {isPrivate
              ? (ru
                ? 'Скрытый материал: его видят только отмеченные клиенты. В общем каталоге и по прямой ссылке он недоступен.'
                : 'Hidden item: only the clients you tick can see it. It stays out of the catalog and its direct link leads nowhere for anyone else.')
              : (ru
                ? 'Материал открыт всем. Отмеченным клиентам он будет выдан без оплаты.'
                : 'This item is public. Ticked clients get it without paying.')}
          </p>
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
          <div className="max-h-[45vh] overflow-y-auto -mx-1 px-1 space-y-1">
            {filtered.map((c) => {
              const checked = selected.has(c.id)
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition-colors ${
                    checked
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                      : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-teal-500"
                    checked={checked}
                    onChange={() => toggle(c.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {c.full_name || (ru ? 'Без имени' : 'No name')}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">{c.email}</p>
                  </div>
                  {assigned.has(c.id) && (
                    <Badge variant="secondary" className="shrink-0">
                      <Check className="w-3 h-3 mr-1" />{ru ? 'назначен' : 'assigned'}
                    </Badge>
                  )}
                </label>
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
