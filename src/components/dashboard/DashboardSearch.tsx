'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, X, LayoutDashboard, Users, Video, ListVideo,
  Target, Layers, Dumbbell, MessageSquare, CreditCard,
  Settings, FileText, FormInput, BellRing, BarChart3,
  User, ArrowRight, Loader2, Database
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'

interface SearchResult {
  id: string
  type: 'page' | 'client'
  title: string
  subtitle?: string
  href: string
  icon: any
}

const PAGE_ITEMS = [
  { id: 'overview', titleEn: 'Overview', titleRu: 'Обзор', href: '/dashboard', icon: LayoutDashboard, keywords: 'home main dashboard главная' },
  { id: 'clients', titleEn: 'Clients', titleRu: 'Клиенты', href: '/dashboard/clients', icon: Users, keywords: 'users people люди пользователи' },
  { id: 'courses', titleEn: 'All Courses', titleRu: 'Все курсы', href: '/dashboard/courses', icon: ListVideo, keywords: 'lessons уроки программы video' },
  { id: 'programs', titleEn: 'Programs', titleRu: 'Программы', href: '/dashboard/programs', icon: Layers, keywords: 'training тренировки plan план' },
  { id: 'exercises', titleEn: 'Exercises', titleRu: 'Упражнения', href: '/dashboard/exercises', icon: Dumbbell, keywords: 'workout тренировка' },
  { id: 'messages', titleEn: 'Messages', titleRu: 'Сообщения', href: '/dashboard/messages', icon: MessageSquare, keywords: 'chat чат общение' },
  { id: 'payments', titleEn: 'Payments', titleRu: 'Платежи', href: '/dashboard/payments', icon: CreditCard, keywords: 'money деньги orders заказы stripe' },
  { id: 'analytics', titleEn: 'Analytics', titleRu: 'Аналитика', href: '/dashboard/analytics', icon: BarChart3, keywords: 'stats statistics статистика отчёт report' },
  { id: 'page-editor', titleEn: 'Page Editor', titleRu: 'Редактор страницы', href: '/dashboard/page-editor', icon: FileText, keywords: 'landing edit редактор' },
  { id: 'form-builder', titleEn: 'Form Builder', titleRu: 'Конструктор форм', href: '/dashboard/form-builder', icon: FormInput, keywords: 'questionnaire анкета опрос' },
  { id: 'notifications', titleEn: 'Notifications', titleRu: 'Уведомления', href: '/dashboard/notifications', icon: BellRing, keywords: 'email alerts оповещения' },
  { id: 'cache', titleEn: 'Site Cache', titleRu: 'Кэш сайта', href: '/dashboard/cache', icon: Database, keywords: 'cache кэш CDN purge очистка performance speed скорость TTL' },
  { id: 'settings', titleEn: 'Settings', titleRu: 'Настройки', href: '/dashboard/settings', icon: Settings, keywords: 'config конфигурация profile профиль' },
]

interface ClientCache {
  data: { id: string; full_name: string; email: string }[]
  ts: number
}

let clientCache: ClientCache | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 min

export function DashboardSearch() {
  const { locale } = useTranslation()
  const { session } = useAuth()
  const router = useRouter()
  const ru = locale === 'ru'

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [loadingClients, setLoadingClients] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const fetchClients = useCallback(async (): Promise<{ id: string; full_name: string; email: string }[]> => {
    if (clientCache && Date.now() - clientCache.ts < CACHE_TTL) {
      return clientCache.data
    }
    if (!session?.access_token) return []
    try {
      setLoadingClients(true)
      const res = await fetch('/api/clients', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) return []
      const data = await res.json()
      const slim = (data || []).map((c: any) => ({
        id: c.id,
        full_name: c.full_name || '',
        email: c.email || '',
      }))
      clientCache = { data: slim, ts: Date.now() }
      return slim
    } catch {
      return []
    } finally {
      setLoadingClients(false)
    }
  }, [session?.access_token])

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim().toLowerCase()
    if (!trimmed) {
      setResults([])
      return
    }

    const matched: SearchResult[] = []

    // 1. Pages
    for (const p of PAGE_ITEMS) {
      const title = ru ? p.titleRu : p.titleEn
      const hay = `${p.titleEn} ${p.titleRu} ${p.keywords}`.toLowerCase()
      if (hay.includes(trimmed)) {
        matched.push({
          id: `page-${p.id}`,
          type: 'page',
          title,
          subtitle: ru ? 'Страница' : 'Page',
          href: p.href,
          icon: p.icon,
        })
      }
    }

    // 2. Clients (from cache or fetch)
    const clients = await fetchClients()
    for (const c of clients) {
      const hay = `${c.full_name} ${c.email}`.toLowerCase()
      if (hay.includes(trimmed)) {
        matched.push({
          id: `client-${c.id}`,
          type: 'client',
          title: c.full_name || c.email,
          subtitle: c.email,
          href: `/dashboard/clients/${c.id}`,
          icon: User,
        })
      }
      if (matched.filter(m => m.type === 'client').length >= 5) break
    }

    setResults(matched)
    setActiveIdx(0)
  }, [ru, fetchClients])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(query), 150)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, doSearch])

  const navigate = (href: string) => {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      navigate(results[activeIdx].href)
    }
  }

  const showDropdown = open && query.trim().length > 0

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md hidden sm:block">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { if (query.trim()) setOpen(true) }}
          onKeyDown={handleKeyDown}
          placeholder={ru ? 'Поиск страниц и клиентов... ⌘K' : 'Search pages & clients... ⌘K'}
          className="w-full h-10 pl-10 pr-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50 max-h-[360px] overflow-y-auto">
          {loadingClients && results.length === 0 && (
            <div className="flex items-center justify-center gap-2 p-4 text-sm text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              {ru ? 'Загрузка...' : 'Loading...'}
            </div>
          )}

          {!loadingClients && results.length === 0 && (
            <div className="p-4 text-sm text-zinc-400 text-center">
              {ru ? 'Ничего не найдено' : 'No results found'}
            </div>
          )}

          {results.length > 0 && (
            <div className="py-1">
              {/* Pages section */}
              {results.some(r => r.type === 'page') && (
                <div className="px-3 pt-2 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    {ru ? 'Страницы' : 'Pages'}
                  </span>
                </div>
              )}
              {results.filter(r => r.type === 'page').map((r, i) => {
                const globalIdx = results.indexOf(r)
                const Icon = r.icon
                return (
                  <button
                    key={r.id}
                    onClick={() => navigate(r.href)}
                    onMouseEnter={() => setActiveIdx(globalIdx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      activeIdx === globalIdx
                        ? 'bg-teal-50 dark:bg-teal-900/20'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      activeIdx === globalIdx
                        ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{r.title}</p>
                    </div>
                    {activeIdx === globalIdx && (
                      <ArrowRight className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    )}
                  </button>
                )
              })}

              {/* Clients section */}
              {results.some(r => r.type === 'client') && (
                <div className="px-3 pt-3 pb-1 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    {ru ? 'Клиенты' : 'Clients'}
                  </span>
                </div>
              )}
              {results.filter(r => r.type === 'client').map((r) => {
                const globalIdx = results.indexOf(r)
                const Icon = r.icon
                return (
                  <button
                    key={r.id}
                    onClick={() => navigate(r.href)}
                    onMouseEnter={() => setActiveIdx(globalIdx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      activeIdx === globalIdx
                        ? 'bg-teal-50 dark:bg-teal-900/20'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      activeIdx === globalIdx
                        ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{r.title}</p>
                      {r.subtitle && r.subtitle !== r.title && (
                        <p className="text-xs text-zinc-400 truncate">{r.subtitle}</p>
                      )}
                    </div>
                    {activeIdx === globalIdx && (
                      <ArrowRight className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Keyboard hint */}
          <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3 text-[10px] text-zinc-400">
            <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">↑↓</kbd> {ru ? 'навигация' : 'navigate'}</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">↵</kbd> {ru ? 'открыть' : 'open'}</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">esc</kbd> {ru ? 'закрыть' : 'close'}</span>
          </div>
        </div>
      )}
    </div>
  )
}
