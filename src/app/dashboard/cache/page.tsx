'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import {
  Database, Trash2, RefreshCw, Clock, Globe, Server,
  Shield, Zap, ToggleLeft, ToggleRight, Loader2,
  AlertCircle, CheckCircle2, FileText, Image as ImageIcon,
  Code, Info
} from 'lucide-react'
import { toast } from 'sonner'

interface CacheSettings {
  enabled: boolean
  pageTTL: number
  apiTTL: number
  staticTTL: number
  lastPurge: string | null
  purgeCount: number
}

export default function CachePage() {
  const { locale } = useTranslation()
  const { session } = useAuth()
  const ru = locale === 'ru'

  const [settings, setSettings] = useState<CacheSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [purging, setPurging] = useState<string | null>(null)

  const fetchSettings = async () => {
    if (!session?.access_token) return
    try {
      const res = await fetch('/api/cache', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        setSettings(await res.json())
      }
    } catch {
      // Use defaults
      setSettings({
        enabled: true, pageTTL: 300, apiTTL: 120,
        staticTTL: 31536000, lastPurge: null, purgeCount: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.access_token) fetchSettings()
  }, [session?.access_token])

  const saveSettings = async (patch: Partial<CacheSettings>) => {
    if (!session?.access_token || !settings) return
    setSaving(true)
    try {
      const res = await fetch('/api/cache', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patch),
      })
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
        toast.success(ru ? 'Настройки сохранены' : 'Settings saved')
      }
    } catch {
      toast.error(ru ? 'Ошибка сохранения' : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const purgeCache = async (target: string) => {
    if (!session?.access_token) return
    setPurging(target)
    try {
      const res = await fetch('/api/cache', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(
          ru
            ? `Кэш очищен! (${data.purged.length} путей)`
            : `Cache purged! (${data.purged.length} paths)`
        )
        fetchSettings() // Refresh stats
      }
    } catch {
      toast.error(ru ? 'Ошибка очистки' : 'Purge failed')
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

  const formatDate = (iso: string | null) => {
    if (!iso) return ru ? 'Никогда' : 'Never'
    return new Date(iso).toLocaleString(ru ? 'ru-RU' : 'en-US')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {ru ? 'Кэш сайта' : 'Site Cache'}
          </h1>
          <p className="text-zinc-500 mt-1">
            {ru ? 'Управление кэшированием для ускорения загрузки' : 'Manage caching to speed up page loads'}
          </p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.enabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
              {settings.enabled
                ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                : <AlertCircle className="w-5 h-5 text-zinc-400" />
              }
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {settings.enabled ? (ru ? 'Активен' : 'Active') : (ru ? 'Выключен' : 'Disabled')}
              </div>
              <div className="text-xs text-zinc-400">{ru ? 'Статус' : 'Status'}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatTTL(settings.pageTTL)}</div>
              <div className="text-xs text-zinc-400">{ru ? 'TTL страниц' : 'Page TTL'}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Server className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatTTL(settings.apiTTL)}</div>
              <div className="text-xs text-zinc-400">{ru ? 'TTL API' : 'API TTL'}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{settings.purgeCount}</div>
              <div className="text-xs text-zinc-400">{ru ? 'Очисток' : 'Purges'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Toggle */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {ru ? 'Кэширование' : 'Caching'}
                </h3>
                <p className="text-sm text-zinc-500">
                  {ru
                    ? 'Кэш ускоряет загрузку страниц для посетителей. CDN хранит копии страниц ближе к пользователю.'
                    : 'Cache speeds up page loads for visitors. CDN stores page copies closer to the user.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => saveSettings({ enabled: !settings.enabled })}
              disabled={saving}
              className="flex-shrink-0"
            >
              {settings.enabled
                ? <ToggleRight className="w-12 h-12 text-teal-500" />
                : <ToggleLeft className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
              }
            </button>
          </div>
        </CardContent>
      </Card>

      {/* TTL Controls */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                  {ru ? 'TTL страниц' : 'Page Cache TTL'}
                </h4>
                <p className="text-xs text-zinc-400">
                  {ru ? 'Время жизни кэша публичных страниц' : 'Public page cache lifetime'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min={0} max={3600} step={30}
                value={settings.pageTTL}
                onChange={e => setSettings({ ...settings, pageTTL: Number(e.target.value) })}
                className="w-full accent-teal-500"
              />
              <div className="flex justify-between text-xs text-zinc-400">
                <span>{ru ? 'Выкл' : 'Off'}</span>
                <span className="font-mono font-medium text-teal-600 dark:text-teal-400">{formatTTL(settings.pageTTL)}</span>
                <span>1h</span>
              </div>
            </div>
            <Button
              variant="outline" size="sm"
              onClick={() => saveSettings({ pageTTL: settings.pageTTL })}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
              {ru ? 'Применить' : 'Apply'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Server className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                  {ru ? 'TTL API' : 'API Cache TTL'}
                </h4>
                <p className="text-xs text-zinc-400">
                  {ru ? 'Время жизни кэша публичных API-ответов' : 'Public API response cache lifetime'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min={0} max={600} step={10}
                value={settings.apiTTL}
                onChange={e => setSettings({ ...settings, apiTTL: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-xs text-zinc-400">
                <span>{ru ? 'Выкл' : 'Off'}</span>
                <span className="font-mono font-medium text-purple-600 dark:text-purple-400">{formatTTL(settings.apiTTL)}</span>
                <span>10m</span>
              </div>
            </div>
            <Button
              variant="outline" size="sm"
              onClick={() => saveSettings({ apiTTL: settings.apiTTL })}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
              {ru ? 'Применить' : 'Apply'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Purge Actions */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                {ru ? 'Очистка кэша' : 'Purge Cache'}
              </h4>
              <p className="text-xs text-zinc-400">
                {ru ? 'Принудительно обновить кэшированные данные' : 'Force refresh cached data'}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <button
              onClick={() => purgeCache('all')}
              disabled={!!purging}
              className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                {purging === 'all'
                  ? <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                  : <RefreshCw className="w-5 h-5 text-red-500" />
                }
                <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{ru ? 'Очистить всё' : 'Purge All'}</span>
              </div>
              <p className="text-xs text-zinc-400">{ru ? 'Страницы + API' : 'Pages + API'}</p>
            </button>

            <button
              onClick={() => purgeCache('pages')}
              disabled={!!purging}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                {purging === 'pages'
                  ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  : <FileText className="w-5 h-5 text-blue-500" />
                }
                <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{ru ? 'Только страницы' : 'Pages Only'}</span>
              </div>
              <p className="text-xs text-zinc-400">{ru ? 'Главная, программы, политики' : 'Home, programs, policies'}</p>
            </button>

            <button
              onClick={() => purgeCache('api')}
              disabled={!!purging}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                {purging === 'api'
                  ? <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                  : <Code className="w-5 h-5 text-purple-500" />
                }
                <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{ru ? 'Только API' : 'API Only'}</span>
              </div>
              <p className="text-xs text-zinc-400">{ru ? 'page-blocks, settings' : 'page-blocks, settings'}</p>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400 pt-2">
            <Clock className="w-3.5 h-3.5" />
            {ru ? 'Последняя очистка:' : 'Last purge:'} {formatDate(settings.lastPurge)}
          </div>
        </CardContent>
      </Card>

      {/* Cache Policy Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-950/30 dark:to-teal-950/30 border-blue-100 dark:border-blue-900/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
              {ru ? 'Как работает кэширование' : 'How caching works'}
            </h4>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Globe className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{ru ? 'CDN (Vercel Edge)' : 'CDN (Vercel Edge)'}</span>
                  <p className="text-xs mt-0.5">{ru ? 'Страницы кэшируются на серверах близких к посетителям. Управляется через TTL страниц.' : 'Pages cached on servers close to visitors. Controlled by Page TTL.'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Server className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{ru ? 'API кэш' : 'API Cache'}</span>
                  <p className="text-xs mt-0.5">{ru ? 'Ответы публичных API (блоки страниц, настройки) кэшируются для снижения нагрузки на БД.' : 'Public API responses (page blocks, settings) cached to reduce DB load.'}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{ru ? 'Статические файлы' : 'Static Assets'}</span>
                  <p className="text-xs mt-0.5">{ru ? 'JS, CSS, шрифты — кэш на 1 год (immutable). Обновляются автоматически при деплое.' : 'JS, CSS, fonts — 1 year cache (immutable). Auto-updated on deploy.'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ImageIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{ru ? 'Изображения' : 'Images'}</span>
                  <p className="text-xs mt-0.5">{ru ? 'Автоматическая конвертация в WebP + сжатие при загрузке. Кэш на 24ч + stale-while-revalidate.' : 'Auto WebP conversion + compression on upload. 24h cache + stale-while-revalidate.'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Note */}
      <Card>
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {ru
                ? 'Защищённые страницы (дашборд, клиентская зона, API) никогда не кэшируются. Кэш применяется только к публичным страницам и API.'
                : 'Protected pages (dashboard, client area, API) are never cached. Cache applies only to public pages and API.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
