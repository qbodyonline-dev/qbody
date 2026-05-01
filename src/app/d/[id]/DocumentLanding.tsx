'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import { fetchWithAuth } from '@/lib/api'
import { Download, Lock, FileText, Loader2, CheckCircle2 } from 'lucide-react'

interface DocumentLandingProps {
  doc: {
    id: string
    title: string
    title_secondary: string | null
    description: string | null
    description_secondary: string | null
    preview_url: string | null
    is_paid: boolean
    price: number
    original_price: number | null
    file_name: string
    file_size: number
    mime_type: string
  }
  canDownload: boolean
  isAuthenticated: boolean
  paidJustNow: boolean
  canceled: boolean
}

function formatFileSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DocumentLanding({
  doc,
  canDownload,
  isAuthenticated,
  paidJustNow,
  canceled,
}: DocumentLandingProps) {
  const router = useRouter()
  const { locale } = useTranslation()
  const ru = locale === 'ru'
  const [downloading, setDownloading] = useState(false)
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const refreshTriedRef = useRef(false)

  const title = (ru && doc.title_secondary) ? doc.title_secondary : doc.title
  const description = (ru && doc.description_secondary) ? doc.description_secondary : doc.description

  // After Stripe success redirect, the webhook may not have processed yet (1-3s race).
  // If we land on ?paid=1 but server still says canDownload=false, refresh once after a short delay.
  useEffect(() => {
    if (paidJustNow && !canDownload && !refreshTriedRef.current) {
      refreshTriedRef.current = true
      const t = setTimeout(() => {
        router.refresh()
      }, 2500)
      return () => clearTimeout(t)
    }
  }, [paidJustNow, canDownload, router])

  async function handleDownload() {
    setDownloading(true)
    setError(null)
    try {
      const res = await fetchWithAuth(`/api/documents/${doc.id}/download`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to get download link')
      }
      // Trigger browser download
      const link = document.createElement('a')
      link.href = data.url
      link.download = doc.file_name
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e: any) {
      setError(e.message || 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  async function handleBuy() {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/d/${doc.id}`)}`)
      return
    }
    setBuying(true)
    setError(null)
    try {
      const res = await fetchWithAuth('/api/stripe/document-checkout', {
        method: 'POST',
        body: JSON.stringify({ documentId: doc.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Checkout failed')
      }
      window.location.href = data.url
    } catch (e: any) {
      setError(e.message || 'Failed to start checkout')
      setBuying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {paidJustNow && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm text-emerald-800 dark:text-emerald-200">
              {ru ? 'Оплата получена. Документ готов к скачиванию.' : 'Payment received. Your document is ready.'}
            </span>
          </div>
        )}

        {canceled && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <span className="text-sm text-amber-800 dark:text-amber-200">
              {ru ? 'Оплата отменена. Вы можете попробовать снова.' : 'Checkout was canceled. You can try again.'}
            </span>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {doc.preview_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.preview_url}
              alt={title}
              className="w-full h-64 object-cover"
            />
          )}

          <div className="p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                <FileText className="w-7 h-7 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                  {title}
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {doc.file_name}
                  {doc.file_size > 0 && ` · ${formatFileSize(doc.file_size)}`}
                </p>
              </div>
            </div>

            {description && (
              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap mb-6">
                {description}
              </p>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {canDownload ? (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {ru ? 'Подготовка...' : 'Preparing...'}
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    {ru ? 'Скачать' : 'Download'}
                  </>
                )}
              </button>
            ) : paidJustNow ? (
              <div className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                <Loader2 className="w-5 h-5 animate-spin" />
                {ru ? 'Обрабатываем платёж…' : 'Processing payment…'}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                    ${Number(doc.price).toFixed(2)}
                  </span>
                  {doc.original_price && Number(doc.original_price) > Number(doc.price) && (
                    <span className="text-lg text-zinc-400 dark:text-zinc-500 line-through">
                      ${Number(doc.original_price).toFixed(2)}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleBuy}
                  disabled={buying}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {buying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {ru ? 'Загрузка...' : 'Loading...'}
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      {isAuthenticated
                        ? (ru ? 'Купить и скачать' : 'Buy & Download')
                        : (ru ? 'Войти и купить' : 'Sign in to buy')}
                    </>
                  )}
                </button>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                  {ru
                    ? 'Безопасная оплата через Stripe. Документ придёт на email.'
                    : 'Secure payment via Stripe. Document will be emailed to you.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
