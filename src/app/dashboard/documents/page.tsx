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
  FileText, Plus, Edit, Trash2, Loader2, Upload, Copy,
  Settings, Eye, EyeOff, Link as LinkIcon, Check,
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

  const [editorOpen, setEditorOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<Doc | null>(null)
  const [pendingFile, setPendingFile] = useState<{ path: string; name: string; size: number; mime: string } | null>(null)
  const [form, setForm] = useState<Form>({ ...EMPTY_FORM })
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

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

                      <div className="flex items-center gap-2 mt-3">
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

          {/* Preview image URL */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {ru ? 'URL обложки (необязательно)' : 'Cover image URL (optional)'}
            </label>
            <Input
              value={form.preview_url}
              onChange={(e) => setForm({ ...form, preview_url: e.target.value })}
              placeholder="https://..."
            />
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
    </div>
  )
}
