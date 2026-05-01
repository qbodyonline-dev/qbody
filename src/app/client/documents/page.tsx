'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { fetchWithAuth } from '@/lib/api'
import { FileText, Download, Loader2, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type Doc = {
  id: string
  title: string
  title_secondary: string | null
  description: string | null
  description_secondary: string | null
  preview_url: string | null
  file_name: string
  file_size: number
  mime_type: string
  is_paid: boolean
  price: number
  purchased_at?: string
  amount_paid?: number
}

function formatFileSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function ClientDocumentsPage() {
  const { locale } = useTranslation()
  const ru = locale === 'ru'
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth('/api/client/documents')
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        setDocs(data.documents || [])
      } catch (e) {
        console.error(e)
        toast.error(ru ? 'Ошибка загрузки' : 'Failed to load documents')
      } finally {
        setLoading(false)
      }
    })()
  }, [ru])

  async function handleDownload(doc: Doc) {
    setDownloadingId(doc.id)
    try {
      const res = await fetchWithAuth(`/api/documents/${doc.id}/download`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Failed')
      const link = document.createElement('a')
      link.href = data.url
      link.download = doc.file_name
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e: any) {
      toast.error(e.message || (ru ? 'Ошибка' : 'Download failed'))
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {ru ? 'Мои документы' : 'My Documents'}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {ru ? 'Все купленные и доступные документы' : 'All your purchased and available documents'}
        </p>
      </div>

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
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {docs.map((doc) => {
            const title = (ru && doc.title_secondary) ? doc.title_secondary : doc.title
            const description = (ru && doc.description_secondary) ? doc.description_secondary : doc.description

            return (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {title}
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {doc.file_name}
                            {doc.file_size > 0 && ` · ${formatFileSize(doc.file_size)}`}
                          </p>
                        </div>
                        {doc.purchased_at && (
                          <Badge variant="secondary" className="text-xs">
                            {ru ? 'Куплен' : 'Purchased'}
                          </Badge>
                        )}
                      </div>

                      {description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2">
                          {description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingId === doc.id}
                        >
                          {downloadingId === doc.id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 mr-1" />
                          )}
                          {ru ? 'Скачать' : 'Download'}
                        </Button>
                        <a
                          href={`/d/${doc.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          {ru ? 'Открыть страницу' : 'Open page'}
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
