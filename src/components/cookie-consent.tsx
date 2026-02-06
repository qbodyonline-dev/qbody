'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { Cookie, X } from 'lucide-react'

export function CookieConsent() {
  const { locale } = useTranslation()
  const [visible, setVisible] = useState(false)
  const ru = locale === 'ru'

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Small delay so it doesn't flash on load
      const timer = setTimeout(() => setVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-4xl mx-auto bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-700 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
            <Cookie className="w-5 h-5 text-teal-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-300">
              {ru
                ? 'Мы используем файлы cookie для обеспечения работы сайта, аутентификации и улучшения вашего опыта. Продолжая использовать сайт, вы соглашаетесь с нашей '
                : 'We use cookies to ensure the website works properly, for authentication, and to improve your experience. By continuing to use the site, you agree to our '}
              <Link href="/cookies" className="text-teal-400 hover:text-teal-300 underline underline-offset-2">
                {ru ? 'Политикой Cookie' : 'Cookie Policy'}
              </Link>
              {ru ? ' и ' : ' and '}
              <Link href="/privacy" className="text-teal-400 hover:text-teal-300 underline underline-offset-2">
                {ru ? 'Политикой конфиденциальности' : 'Privacy Policy'}
              </Link>.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={decline}
              className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-white border border-zinc-600 hover:border-zinc-500 rounded-xl transition-colors"
            >
              {ru ? 'Отклонить' : 'Decline'}
            </button>
            <button
              onClick={accept}
              className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-xl transition-colors"
            >
              {ru ? 'Принять' : 'Accept'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
