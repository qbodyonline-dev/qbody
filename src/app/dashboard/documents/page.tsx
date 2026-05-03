'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { fetchWithAuth } from '@/lib/api'
import {
  FileText, Plus, Trash2, Loader2, Copy,
  Settings, Eye, Link as LinkIcon, Check, Upload, X,
  Send, Search, Gift, DollarSign,
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguageConfig } from '@/lib/useLanguageConfig'

type Doc = {
  id: string
  title: string
  title_secondary: string | null
  description: string | null
  description_secondary: string | null
  file_path: string
  file_name: string
  file_size: number
  mime_type: string
  preview_url: string | null
  is_paid: boolean
  is_active: boolean
  price: number
  original_price: number | null
  download_count: number
  created_at: string
}

type Form = {
  title: string
  title_secondary: string
  description: string
  description_secondary: string
  preview_url: string
  is_paid: boolean
  price: string
  original_price: string
  is_active: boolean
}

const EMPTY_FORM: Form = {
  title: '', title_secondary: '', description: '', description_secondary: '',
  preview_url: '', is_paid: false, price: '', original_price: '', is_active: true,
}

function formatFileSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DocumentsAdminPage() {
  const { locale } = useTranslation()
  const ru = locale === 'ru'
  const lang = useLanguageConfig()

  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)

  const [editorOpen, setEditorOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<Doc | null>(null)
  const [pendingFile, setPendingFile] = useState<{ path: string; name: string; size: number; mime: string } | null>(null)
  const [form, setForm] = useState<Form>({ ...EMPTY_FORM })
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // ── Send-to-client state ──
  type Client = { id: string; full_name: string | null; email: string | null; avatar_url?: string | null }
  const [sendOpen, setSendOpen] = useState(false)
  const [sendingDoc, setSendingDoc] = useState<Doc | null>(null)
  const [sendMode, setSendMode] = useState<'gift' | 'offer'>('gift')
  const [sendMessage, setSendMessage] = useState('')
  const [sendSearch, setSendSearch] = useState('')
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // ─── Fetch ───
  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/documents')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setDocs(data.documents || [])
    } catch (err) {
      console.error(err)
      toast.error(ru ? 'Ошибка загрузки' : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [ru])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  // ─── Upload (then open editor) ───
  async function handleFilePick() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    try {
      // Step 1: get signed upload URL
      const urlRes = await fetchWithAuth('/api/documents/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || 'application/pdf',
          fileSize: file.size,
        }),
      })
      const urlData = await urlRes.json()
      if (!urlRes.ok) throw new Error(urlData.error || 'Failed to get upload URL')

      // Step 2: upload to Supabase
      const upRes = await fetch(urlData.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/pdf' },
        body: file,
      })
      if (!upRes.ok) {
        const text = await upRes.text().catch(() => '')
        throw new Error(`Upload failed: ${upRes.status} ${text}`)
      }

      // Open editor for metadata
      setPendingFile({
        path: urlData.path,
        name: file.name,
        size: file.size,
        mime: file.type || 'application/pdf',
      })
      setEditingDoc(null)
      setForm({ ...EMPTY_FORM, title: file.name.replace(/\.[^.]+$/, '') })
      setEditorOpen(true)
      toast.success(ru ? 'Файл загружен. Заполните настройки.' : 'File uploaded. Fill in settings.')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || (ru ? 'Ошибка загрузки файла' : 'Upload failed'))
    } finally {
      setUploading(false)
    }
  }

  // ─── Upload cover image ───
  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error(ru ? 'Файл должен быть изображением' : 'File must be an image')
      return
    }

    setCoverUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'documents/covers')
      const res = await fetchWithAuth('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setForm((prev) => ({ ...prev, preview_url: data.url }))
      toast.success(ru ? 'Обложка загружена' : 'Cover uploaded')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || (ru ? 'Не удалось загрузить' : 'Upload failed'))
    } finally {
      setCoverUploading(false)
    }
  }

  // ─── Open editor for existing ───
  function openEdit(doc: Doc) {
    setEditingDoc(doc)
    setPendingFile(null)
    setForm({
      title: doc.title || '',
      title_secondary: doc.title_secondary || '',
      description: doc.description || '',
      description_secondary: doc.description_secondary || '',
      preview_url: doc.preview_url || '',
      is_paid: doc.is_paid,
      price: doc.price ? String(doc.price) : '',
      original_price: doc.original_price ? String(doc.original_price) : '',
      is_active: doc.is_active,
    })
    setEditorOpen(true)
  }

  // ─── Save (create or update) ───
  async function handleSave() {
    if (!form.title.trim()) {
      toast.error(ru ? 'Введите название' : 'Title is required')
      return
    }
    if (form.is_paid && (!form.price || Number(form.price) <= 0)) {
      toast.error(ru ? 'Укажите цену' : 'Price required for paid documents')
      return
    }

    setSaving(true)
    try {
      const payload: any = {
        title: form.title.trim(),
        title_secondary: form.title_secondary.trim() || null,
        description: form.description || null,
        description_secondary: form.description_secondary || null,
        preview_url: form.preview_url || null,
        is_paid: form.is_paid,
        price: form.is_paid ? Number(form.price) : 0,
        original_price: form.is_paid && form.original_price ? Number(form.original_price) : null,
        is_active: form.is_active,
      }

      if (editingDoc) {
        // Update existing
        const res = await fetchWithAuth(`/api/documents/${editingDoc.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Save failed')
        }
      } else {
        // Create new — needs file
        if (!pendingFile) {
          toast.error(ru ? 'Загрузите файл' : 'Upload a file first')
          setSaving(false)
          return
        }
        const res = await fetchWithAuth('/api/documents', {
          method: 'POST',
          body: JSON.stringify({
            ...payload,
            file_path: pendingFile.path,
            file_name: pendingFile.name,
            file_size: pendingFile.size,
            mime_type: pendingFile.mime,
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Save failed')
        }
      }

      setEditorOpen(false)
      setEditingDoc(null)
      setPendingFile(null)
      await fetchDocs()
      toast.success(ru ? 'Сохранено' : 'Saved')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || (ru ? 'Ошибка сохранения' : 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  // ─── Send to client ───
  function openSendModal(doc: Doc) {
    setSendingDoc(doc)
    setSendMode(doc.is_paid ? 'gift' : 'gift') // дефолт всегда gift
    setSendMessage('')
    setSendSearch('')
    setSelectedClientIds([])
    setSendOpen(true)
    // Подгружаем клиентов
    if (clients.length === 0) {
      setClientsLoading(true)
      fetchWithAuth('/api/clients')
        .then(r => r.ok ? r.json() : [])
        .then((data: any[]) => {
          setClients((data || []).map((c: any) => ({
            id: c.id,
            full_name: c.full_name,
            email: c.email,
            avatar_url: c.avatar_url,
          })))
        })
        .catch(err => {
          console.error(err)
          toast.error(ru ? 'Не удалось загрузить клиентов' : 'Failed to load clients')
        })
        .finally(() => setClientsLoading(false))
    }
  }

  function toggleClient(id: string) {
    setSelectedClientIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSend() {
    if (!sendingDoc) return
    if (selectedClientIds.length === 0) {
      toast.error(ru ? 'Выберите хотя бы одного клиента' : 'Select at least one client')
      return
    }
    setSending(true)
    try {
      const res = await fetchWithAuth(`/api/documents/${sendingDoc.id}/send`, {
        method: 'POST',
        body: JSON.stringify({
          user_ids: selectedClientIds,
          mode: sendMode,
          message: sendMessage.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')

      const sent = data.sent ?? 0
      const failed = data.failed ?? 0
      if (failed > 0) {
        toast.warning(ru
          ? `Отправлено: ${sent}, ошибок: ${failed}`
          : `Sent: ${sent}, failed: ${failed}`)
      } else {
        toast.success(ru
          ? `Отправлено ${sent} ${sendMode === 'gift' ? 'подарок(ов)' : 'предложение(й)'}`
          : `Sent to ${sent} ${sendMode === 'gift' ? 'gift(s)' : 'offer(s)'}`)
      }
      setSendOpen(false)
      setSendingDoc(null)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || (ru ? 'Ошибка отправки' : 'Send failed'))
    } finally {
      setSending(false)
    }
  }

  const filteredClients = clients.filter(c => {
    if (!sendSearch.trim()) return true
    const q = sendSearch.toLowerCase()
    return (c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
  })

  // ─── Delete ───
  async function handleDelete() {
    if (!editingDoc) return
    setSaving(true)
    try {
      const res = await fetchWithAuth(`/api/documents/${editingDoc.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Delete failed')
      }
      setDeleteOpen(false)
      setEditingDoc(null)
      await fetchDocs()
      toast.success(ru ? 'Удалено' : 'Deleted')
    } catch (err: any) {
      toast.error(err.message || (ru ? 'Ошибка' : 'Delete failed'))
    } finally {
      setSaving(false)
    }
  }

  // ─── Copy link ───
  function copyLink(id: string) {
    const url = `${window.location.origin}/d/${id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id)
      toast.success(ru ? 'Ссылка скопирована' : 'Link copied')
      setTimeout(() => setCopiedId(null), 2000)
    }).catch(() => {
      toast.error(ru ? 'Не удалось скопировать' : 'Copy failed')
    })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.epub,.txt,.jpg,.jpeg,.png,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {ru ? 'Документы' : 'Documents'}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {ru
              ? 'Загружайте PDF и другие файлы. Получите ссылку — вставляйте куда угодно.'
              : 'Upload PDFs and other files. Get a link — paste it anywhere.'}
          </p>
        </div>
        <Button onClick={handleFilePick} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          {ru ? 'Загрузить документ' : 'Upload Document'}
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      ) : docs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400">
              {ru ? 'Документов пока нет' : 'No documents yet'}
            </p>
            <Button onClick={handleFilePick} className="mt-4" disabled={uploading}>
              <Plus className="w-4 h-4 mr-2" />
              {ru ? 'Загрузить первый документ' : 'Upload first document'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {docs.map((doc) => {
            const link = typeof window !== 'undefined' ? `${window.location.origin}/d/${doc.id}` : `/d/${doc.id}`
            return (
              <Card key={doc.id} className={!doc.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {doc.title}
                          </h3>
                          {doc.title_secondary && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                              {doc.title_secondary}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {doc.is_paid ? (
                            <Badge variant="default" className="bg-teal-500">
                              ${Number(doc.price).toFixed(2)}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              {ru ? 'Бесплатно' : 'Free'}
                            </Badge>
                          )}
                          {!doc.is_active && (
                            <Badge variant="outline">
                              {ru ? 'Скрыт' : 'Hidden'}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-2 flex-wrap">
                        <span>{doc.file_name}</span>
                        {doc.file_size > 0 && <span>· {formatFileSize(doc.file_size)}</span>}
                        <span>· {ru ? 'Скачиваний' : 'Downloads'}: {doc.download_count}</span>
                      </div>

                      {/* Link row */}
                      <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                        <LinkIcon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                        <code className="text-xs text-zinc-700 dark:text-zinc-300 truncate flex-1">
                          {link}
                        </code>
                        <button
                          onClick={() => copyLink(doc.id)}
                          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          title={ru ? 'Скопировать' : 'Copy'}
                          type="button"
                        >
                          {copiedId === doc.id
                            ? <Check className="w-4 h-4 text-emerald-500" />
                            : <Copy className="w-4 h-4 text-zinc-500" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Button
                          size="sm"
                          onClick={() => openSendModal(doc)}
                          disabled={!doc.is_active}
                          className="bg-teal-500 hover:bg-teal-600 text-white"
                          title={!doc.is_active ? (ru ? 'Активируйте документ' : 'Activate first') : undefined}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          {ru ? 'Отправить клиенту' : 'Send to client'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(doc)}>
                          <Settings className="w-4 h-4 mr-1" />
                          {ru ? 'Настройки' : 'Settings'}
                        </Button>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {ru ? 'Просмотр' : 'Preview'}
                        </a>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setEditingDoc(doc); setDeleteOpen(true) }}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Editor Modal */}
      <Modal
        isOpen={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingDoc(null); setPendingFile(null) }}
        title={editingDoc ? (ru ? 'Настройки документа' : 'Document Settings') : (ru ? 'Новый документ' : 'New Document')}
        size="lg"
      >
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {ru ? 'Название' : 'Title'} {lang.isBilingual && `(${lang.pCode})`} *
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={ru ? 'Например: Гайд по питанию' : 'e.g.: Nutrition Guide'}
            />
          </div>
          {lang.isBilingual && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {ru ? 'Название' : 'Title'} ({lang.sCode})
              </label>
              <Input
                value={form.title_secondary}
                onChange={(e) => setForm({ ...form, title_secondary: e.target.value })}
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {ru ? 'Описание' : 'Description'} {lang.isBilingual && `(${lang.pCode})`}
            </label>
            <textarea
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          {lang.isBilingual && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {ru ? 'Описание' : 'Description'} ({lang.sCode})
              </label>
              <textarea
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                rows={3}
                value={form.description_secondary}
                onChange={(e) => setForm({ ...form, description_secondary: e.target.value })}
              />
            </div>
          )}

          {/* Preview image (URL or upload) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {ru ? 'Обложка (необязательно)' : 'Cover image (optional)'}
            </label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif"
              className="hidden"
              onChange={handleCoverChange}
            />
            <div className="flex items-start gap-3">
              {/* Preview thumb */}
              {form.preview_url && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.preview_url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, preview_url: '' })}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center"
                    title={ru ? 'Удалить' : 'Remove'}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {/* URL input + upload button */}
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={form.preview_url}
                    onChange={(e) => setForm({ ...form, preview_url: e.target.value })}
                    placeholder="https://..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={coverUploading}
                    title={ru ? 'Загрузить с компьютера' : 'Upload from computer'}
                  >
                    {coverUploading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Upload className="w-4 h-4" />}
                    <span className="ml-2 hidden sm:inline">
                      {ru ? 'Загрузить' : 'Upload'}
                    </span>
                  </Button>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {ru
                    ? 'Вставьте URL изображения или загрузите файл (JPG, PNG, WebP, до 15 МБ)'
                    : 'Paste image URL or upload a file (JPG, PNG, WebP, up to 15 MB)'}
                </p>
              </div>
            </div>
          </div>

          {/* Paid toggle */}
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium">{ru ? 'Платный' : 'Paid'}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {ru ? 'Клиент должен оплатить, чтобы скачать' : 'Customer must pay to download'}
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.is_paid}
                onChange={(e) => setForm({ ...form, is_paid: e.target.checked })}
                className="w-5 h-5"
              />
            </label>
          </div>

          {/* Price (if paid) */}
          {form.is_paid && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {ru ? 'Цена (USD)' : 'Price (USD)'} *
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="9.99"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {ru ? 'Старая цена (опц.)' : 'Original price (opt.)'}
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.original_price}
                  onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                  placeholder="19.99"
                />
              </div>
            </div>
          )}

          {/* Active toggle */}
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium">{ru ? 'Активен' : 'Active'}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {ru ? 'Если выключено, ссылка не работает' : 'If disabled, the link does not work'}
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-5 h-5"
              />
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setEditorOpen(false); setEditingDoc(null); setPendingFile(null) }}>
              {ru ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {ru ? 'Сохранить' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setEditingDoc(null) }}
        title={ru ? 'Удалить документ?' : 'Delete document?'}
        size="sm"
      >
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            {ru
              ? 'Это действие необратимо. Файл будет удалён, ссылка перестанет работать.'
              : 'This cannot be undone. The file will be deleted and the link will stop working.'}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setEditingDoc(null) }}>
              {ru ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleDelete} disabled={saving} className="bg-red-500 hover:bg-red-600 text-white">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {ru ? 'Удалить' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Send-to-client Modal */}
      <Modal
        isOpen={sendOpen}
        onClose={() => { setSendOpen(false); setSendingDoc(null) }}
        title={ru ? 'Отправить клиенту' : 'Send to client'}
        size="lg"
      >
        {sendingDoc && (
          <div className="space-y-4">
            {/* Document info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
              <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{sendingDoc.title}</p>
                <p className="text-xs text-zinc-500 truncate">
                  {sendingDoc.is_paid
                    ? `$${Number(sendingDoc.price).toFixed(2)}`
                    : (ru ? 'Бесплатный' : 'Free')}
                </p>
              </div>
            </div>

            {/* Mode selector — only meaningful for paid docs */}
            {sendingDoc.is_paid && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {ru ? 'Способ отправки' : 'Send mode'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSendMode('gift')}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      sendMode === 'gift'
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Gift className="w-4 h-4 text-teal-500" />
                      <span className="font-medium text-sm">
                        {ru ? 'Подарок' : 'Gift'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {ru ? 'Доступ открывается сразу, без оплаты' : 'Instant access, no payment'}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendMode('offer')}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      sendMode === 'offer'
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-teal-500" />
                      <span className="font-medium text-sm">
                        {ru ? 'С оплатой' : 'Paid offer'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {ru
                        ? `Клиент должен оплатить $${Number(sendingDoc.price).toFixed(2)}`
                        : `Client pays $${Number(sendingDoc.price).toFixed(2)}`}
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {ru ? 'Сообщение (необязательно)' : 'Message (optional)'}
              </label>
              <textarea
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                rows={3}
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
                placeholder={ru
                  ? 'Привет! Я подготовил для тебя…'
                  : 'Hi! I prepared this for you…'}
              />
              <p className="text-xs text-zinc-500 mt-1">
                {ru
                  ? 'Ссылка на документ добавится автоматически'
                  : 'Document link will be added automatically'}
              </p>
            </div>

            {/* Client picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  {ru ? 'Получатели' : 'Recipients'}{' '}
                  <span className="text-zinc-500 font-normal">
                    ({selectedClientIds.length})
                  </span>
                </label>
                {selectedClientIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedClientIds([])}
                    className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  >
                    {ru ? 'Очистить' : 'Clear'}
                  </button>
                )}
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  value={sendSearch}
                  onChange={(e) => setSendSearch(e.target.value)}
                  placeholder={ru ? 'Поиск по имени или email…' : 'Search by name or email…'}
                  className="pl-9"
                />
              </div>
              <div className="max-h-60 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                {clientsLoading ? (
                  <div className="p-4 text-center text-zinc-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="p-4 text-center text-sm text-zinc-500">
                    {ru ? 'Клиенты не найдены' : 'No clients found'}
                  </div>
                ) : (
                  filteredClients.map(c => {
                    const checked = selectedClientIds.includes(c.id)
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                          checked ? 'bg-teal-50 dark:bg-teal-900/10' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleClient(c.id)}
                          className="w-4 h-4"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {c.full_name || c.email || 'Unknown'}
                          </p>
                          {c.full_name && c.email && (
                            <p className="text-xs text-zinc-500 truncate">{c.email}</p>
                          )}
                        </div>
                      </label>
                    )
                  })
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="outline"
                onClick={() => { setSendOpen(false); setSendingDoc(null) }}
                disabled={sending}
              >
                {ru ? 'Отмена' : 'Cancel'}
              </Button>
              <Button onClick={handleSend} disabled={sending || selectedClientIds.length === 0}>
                {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Send className="w-4 h-4 mr-1" />
                {ru
                  ? `Отправить (${selectedClientIds.length})`
                  : `Send (${selectedClientIds.length})`}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
