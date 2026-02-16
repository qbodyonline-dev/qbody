'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Plus, Trash2, Eye, EyeOff, ExternalLink, Home, Loader2, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/lib/i18n'
import { fetchWithAuth } from '@/lib/api'
import { useLanguageConfig } from '@/lib/useLanguageConfig'

interface SitePage {
  id: string
  slug: string
  title: string
  title_secondary: string
  is_published: boolean
  is_homepage: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export default function PagesPage() {
  const { locale } = useTranslation()
  const ru = locale === 'ru'
  const lang = useLanguageConfig()
  const [pages, setPages] = useState<SitePage[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newTitleSecondary, setNewTitleSecondary] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const fetchPages = async () => {
    try {
      const res = await fetchWithAuth('/api/pages?admin=1')
      if (res.ok) {
        const data = await res.json()
        setPages(data)
      }
    } catch (err) {
      console.error('Failed to load pages:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPages() }, [])

  const createPage = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    setError('')
    try {
      const res = await fetchWithAuth('/api/pages', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle.trim(), titleSecondary: newTitleSecondary.trim() || newTitle.trim() })
      })
      if (res.ok) {
        setNewTitle('')
        setNewTitleSecondary('')
        setShowForm(false)
        await fetchPages()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create page')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setCreating(false)
    }
  }

  const togglePublish = async (page: SitePage) => {
    try {
      await fetchWithAuth('/api/pages', {
        method: 'PATCH',
        body: JSON.stringify({ id: page.id, is_published: !page.is_published })
      })
      await fetchPages()
    } catch (err) {
      console.error('Toggle publish error:', err)
    }
  }

  const deletePage = async (page: SitePage) => {
    if (page.is_homepage) return
    const msg = ru
      ? `Удалить страницу "${page.title}"? Все блоки будут удалены.`
      : `Delete page "${page.title}"? All blocks will be deleted.`
    if (!confirm(msg)) return
    try {
      await fetchWithAuth(`/api/pages?id=${page.id}`, { method: 'DELETE' })
      await fetchPages()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <Globe className="w-7 h-7 text-teal-500" />
            {ru ? 'Страницы сайта' : 'Site Pages'}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {ru ? 'Управление страницами вашего сайта' : 'Manage your website pages'}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-teal-500 hover:bg-teal-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          {ru ? 'Новая страница' : 'New Page'}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
            {ru ? 'Создать страницу' : 'Create Page'}
          </h3>
          <div className={`grid grid-cols-1 ${lang.isBilingual ? 'sm:grid-cols-2' : ''} gap-3 mb-4`}>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">{lang.pl(ru ? 'Название' : 'Title')}</label>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder={ru ? 'Название' : 'Page title'}
                onKeyDown={e => e.key === 'Enter' && createPage()}
              />
            </div>
            {lang.isBilingual && <div>
              <label className="text-xs text-zinc-500 mb-1 block">{lang.sl(ru ? 'Название' : 'Title')}</label>
              <Input
                value={newTitleSecondary}
                onChange={e => setNewTitleSecondary(e.target.value)}
                placeholder={ru ? 'Название' : 'Page title'}
                onKeyDown={e => e.key === 'Enter' && createPage()}
              />
            </div>}
          </div>
          {newTitle.trim() && (
            <p className="text-xs text-zinc-400 mb-3">
              Slug: <span className="font-mono text-teal-500">/{newTitle.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}</span>
            </p>
          )}
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={createPage} disabled={creating || !newTitle.trim()} className="bg-teal-500 hover:bg-teal-600 text-white" size="sm">
              {creating && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              {ru ? 'Создать' : 'Create'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setError('') }}>
              {ru ? 'Отмена' : 'Cancel'}
            </Button>
          </div>
        </div>
      )}

      {/* Pages List */}
      <div className="space-y-2">
        {pages.map(page => (
          <div key={page.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-5 py-4 flex items-center gap-4 hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
            {/* Icon */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${page.is_homepage ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
              {page.is_homepage ? <Home className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {ru ? page.title_secondary : page.title}
                </h3>
                {page.is_homepage && (
                  <span className="text-[10px] bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded font-medium">
                    {ru ? 'Главная' : 'Home'}
                  </span>
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${page.is_published ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                  {page.is_published ? (ru ? 'Опубликована' : 'Published') : (ru ? 'Черновик' : 'Draft')}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">/{page.slug}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <Link href={`/dashboard/page-editor?page=${page.slug}`}>
                <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20">
                  <FileText className="w-4 h-4 mr-1" />
                  {ru ? 'Редактор' : 'Editor'}
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => togglePublish(page)}
                title={page.is_published ? (ru ? 'Снять с публикации' : 'Unpublish') : (ru ? 'Опубликовать' : 'Publish')}
                className="h-8 w-8">
                {page.is_published ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-zinc-400" />}
              </Button>
              {!page.is_homepage && (
                <Button variant="ghost" size="icon" onClick={() => deletePage(page)}
                  className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              {page.is_published && (
                <Link href={page.is_homepage ? '/' : `/${page.slug}`} target="_blank">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {pages.length === 0 && !loading && (
        <div className="text-center py-16 text-zinc-400">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{ru ? 'Нет страниц' : 'No pages yet'}</p>
        </div>
      )}
    </div>
  )
}
