'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import {
  Database, Trash2, RefreshCw, Save, Loader2,
  Image, FileText, Globe, Zap, Clock, HardDrive,
  ToggleLeft, ToggleRight, AlertTriangle, CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

interface CacheSettings {
  enabled: boolean
  pageCacheTTL: number
  imgCacheTTL: number
  apiCacheTTL: number
}

interface CacheStatus {
  pageBlocksCacheEntries: number
  imageCacheEntries: number
  serverTime: string
}

export default function SiteCachePage() {
  const { locale } = useTranslation()
  const { session } = useAuth()
  const ru = locale === 'ru'

  const [settings, setSettings] = useState<CacheSettings>({
    enabled: true,
    pageCacheTTL: 60,
    imgCacheTTL: 2592000,
    apiCacheTTL: 30,
  })
  const [status, setStatus] = useState<CacheStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [purging, setPurging] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    if (!session?.access_token) return
    try {
      const res = await fetch('/api/cache', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
        setStatus(data.status)
      } else if (res.status === 403) {
        // ✅ Bug 7: Показываем ошибку доступа (тренеры больше не имеют доступа)
        toast.error(ru ? 'Нет доступа. Только администратор.' : 'Access denied. Admin only.')
      } else {
        toast.error(ru ? 'Ошибка загрузки статуса кеша' : 'Failed to load cache status')
      }
    } catch (err) {
      // ✅ Bug 7: Уведомление об ошибках сети
      console.error('Failed to fetch cache status:', err)
      toast.error(ru ? 'Ошибка сети. Проверьте подключение.' : 'Network error. Check your connection.')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, ru])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleSave = async () => {
    if (!session?.access_token) return
    setSaving(true)
    try {
      const res = await fetch('/api/cache', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'update_settings', settings }),
      })
      if (res.ok) {
        toast.success(ru ? 'Настройки кеша сохранены' : 'Cache settings saved')
        // ✅ Bug 5 fix: Перезагружаем статус после сохранения (обновляет карточки)
        await fetchStatus()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || (ru ? 'Ошибка сохранения' : 'Failed to save'))
      }
    } catch {
      // ✅ Bug 7: Уведомление об ошибке сети
      toast.error(ru ? 'Ошибка сети. Проверьте подключение.' : 'Network error. Check your connection.')
    } finally {
      setSaving(false)
    }
  }

  const handlePurge = async (action: string, label: string) => {
    if (!session?.access_token) return
    setPurging(action)
    try {
      const res = await fetch('/api/cache', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        toast.success(ru ? `${label}: кеш очищен` : `${label}: cache purged`)
        await fetchStatus()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || (ru ? 'Ошибка очистки' : 'Purge failed'))
      }
    } catch {
      // ✅ Bug 7: Уведомление об ошибке сети
      toast.error(ru ? 'Ошибка сети. Проверьте подключение.' : 'Network error. Check your connection.')
    } finally {
      setPurging(null)
    }
  }

  const formatTTL = (seconds: number) => {
    if (seconds >= 86400) return `${Math.round(seconds / 86400)}d`
    if (seconds >= 3600) return `${Math.round(seconds / 3600)}h`
    if (seconds >= 60) return `${Math.round(seconds / 60)}m`
    return `${seconds}s`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {ru ? 'Кеш сайта' : 'Site Cache'}
          </h1>
          <p className="text-zinc-500 mt-1">
            {ru ? 'Управление кешированием для ускорения загрузки' : 'Manage caching for faster page loads'}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {ru ? 'Сохранить' : 'Save'}
        </Button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {settings.enabled ? (ru ? 'ВКЛ' : 'ON') : (ru ? 'ВЫКЛ' : 'OFF')}
              </div>
              <div className="text-xs text-zinc-500">{ru ? 'Статус' : 'Status'}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {status?.pageBlocksCacheEntries || 0}
              </div>
              <div className="text-xs text-zinc-500">{ru ? 'Страниц' : 'Pages'}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Image className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {status?.imageCacheEntries || 0}
              </div>
              <div className="text-xs text-zinc-500">{ru ? 'Фото' : 'Images'}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatTTL(settings.pageCacheTTL)}
              </div>
              <div className="text-xs text-zinc-500">{ru ? 'Кеш стр.' : 'Page TTL'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main toggle */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                settings.enabled ? 'bg-teal-100 dark:bg-teal-900/30' : 'bg-zinc-100 dark:bg-zinc-800'
              }`}>
                <Database className={`w-6 h-6 ${settings.enabled ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {ru ? 'Кеширование сайта' : 'Site Caching'}
                </h3>
                <p className="text-sm text-zinc-500">
                  {ru ? 'Кеширует страницы, изображения и API-ответы для ускорения' : 'Cache pages, images, and API responses for speed'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
              className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 ${
                settings.enabled ? 'bg-teal-500' : 'bg-zinc-300 dark:bg-zinc-600'
              }`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${
                settings.enabled ? 'translate-x-6' : ''
              }`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* TTL Settings */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {ru ? 'Время жизни кеша (TTL)' : 'Cache TTL Settings'}
          </h3>

          {/* Page blocks cache */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{ru ? 'Блоки страниц' : 'Page Blocks'}</p>
                <p className="text-xs text-zinc-400">{ru ? 'Контент из Page Editor' : 'Content from Page Editor'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={settings.pageCacheTTL}
                onChange={e => setSettings({ ...settings, pageCacheTTL: parseInt(e.target.value) })}
                className="h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm bg-white dark:bg-zinc-800"
              >
                <option value="0">{ru ? 'Без кеша' : 'No cache'}</option>
                <option value="30">30s</option>
                <option value="60">1 min</option>
                <option value="300">5 min</option>
                <option value="600">10 min</option>
                <option value="1800">30 min</option>
              </select>
            </div>
          </div>

          {/* API cache */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{ru ? 'API настроек' : 'Settings API'}</p>
                <p className="text-xs text-zinc-400">{ru ? 'Настройки сайта (CDN)' : 'Site settings (CDN level)'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={settings.apiCacheTTL}
                onChange={e => setSettings({ ...settings, apiCacheTTL: parseInt(e.target.value) })}
                className="h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm bg-white dark:bg-zinc-800"
              >
                <option value="0">{ru ? 'Без кеша' : 'No cache'}</option>
                <option value="10">10s</option>
                <option value="30">30s</option>
                <option value="60">1 min</option>
                <option value="300">5 min</option>
              </select>
            </div>
          </div>

          {/* Image cache */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image className="w-5 h-5 text-purple-500" />
              <div>
                <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{ru ? 'Изображения' : 'Images'}</p>
                <p className="text-xs text-zinc-400">{ru ? 'Оптимизированные через /api/img' : 'Optimized via /api/img proxy'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={settings.imgCacheTTL}
                onChange={e => setSettings({ ...settings, imgCacheTTL: parseInt(e.target.value) })}
                className="h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm bg-white dark:bg-zinc-800"
              >
                <option value="86400">1 {ru ? 'день' : 'day'}</option>
                <option value="604800">7 {ru ? 'дней' : 'days'}</option>
                <option value="2592000">30 {ru ? 'дней' : 'days'}</option>
                <option value="31536000">1 {ru ? 'год' : 'year'}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purge actions */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {ru ? 'Очистка кеша' : 'Purge Cache'}
          </h3>

          <div className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={() => handlePurge('purge_pages', ru ? 'Страницы' : 'Pages')}
              disabled={!!purging}
              className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                {purging === 'purge_pages' 
                  ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  : <FileText className="w-5 h-5 text-blue-500" />
                }
              </div>
              <div>
                <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{ru ? 'Очистить кеш страниц' : 'Purge Page Cache'}</p>
                <p className="text-xs text-zinc-400">{ru ? 'Блоки страниц будут загружены заново' : 'Page blocks will reload from DB'}</p>
              </div>
            </button>

            <button
              onClick={() => handlePurge('purge_all', ru ? 'Всё' : 'All')}
              disabled={!!purging}
              className="flex items-center gap-3 p-4 rounded-xl border border-red-200 dark:border-red-900/50 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                {purging === 'purge_all'
                  ? <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                  : <Trash2 className="w-5 h-5 text-red-500" />
                }
              </div>
              <div>
                <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{ru ? 'Очистить весь кеш' : 'Purge All Cache'}</p>
                <p className="text-xs text-zinc-400">{ru ? 'Страницы + сервер кеш' : 'Pages + server cache'}</p>
              </div>
            </button>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {ru 
                  ? 'Кеш изображений на CDN (Vercel Edge) нельзя очистить вручную — он обновится автоматически через заданный TTL. Для немедленного обновления изображения — перезалейте его через Page Editor.'
                  : 'Image CDN cache (Vercel Edge) cannot be purged manually — it refreshes after the set TTL. To immediately update an image, re-upload it via Page Editor.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-950/20 dark:to-teal-950/20 border-blue-100 dark:border-blue-800/30">
        <CardContent className="p-6">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            {ru ? 'Как работает кеширование' : 'How Caching Works'}
          </h3>
          <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
              <p>{ru ? 'Изображения проходят через /api/img прокси: конвертируются в WebP, ресайзятся под нужный размер и кешируются на CDN на 30 дней.' : 'Images go through /api/img proxy: converted to WebP, resized to needed dimensions, cached on CDN for 30 days.'}</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
              <p>{ru ? 'Блоки страниц кешируются в памяти сервера. При сохранении в Page Editor кеш автоматически сбрасывается.' : 'Page blocks are cached in server memory. When saved in Page Editor, cache is auto-invalidated.'}</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
              <p>{ru ? 'Статические файлы (JS, CSS) кешируются навсегда (immutable) — Vercel автоматически обновляет их хеши при деплое.' : 'Static files (JS, CSS) are cached forever (immutable) — Vercel automatically updates their hashes on deploy.'}</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
              <p>{ru ? 'Полифилы устаревшего JS удалены — browserslist настроен на современные браузеры (Chrome 90+, Safari 15+).' : 'Legacy JS polyfills removed — browserslist targets modern browsers (Chrome 90+, Safari 15+).'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
