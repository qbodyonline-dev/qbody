'use client'

import React from 'react'
import { useLocale, type Locale } from '@/lib/i18n'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'buttons'
  className?: string
}

export function LanguageSwitcher({ variant = 'buttons', className }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale()
  const [isOpen, setIsOpen] = React.useState(false)

  const languages: { code: Locale; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  ]

  if (variant === 'buttons') {
    return (
      <div className={cn('flex items-center gap-1 bg-zinc-100 rounded-lg p-1', className)}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              locale === lang.code
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            )}
          >
            {lang.flag} {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-600 hover:bg-zinc-100 transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{locale.toUpperCase()}</span>
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-zinc-200 py-2 z-50">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLocale(lang.code)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-50 transition-colors',
                  locale === lang.code ? 'text-teal-600 bg-teal-50' : 'text-zinc-700'
                )}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
