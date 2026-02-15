'use client'
import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import type { LanguageOption } from '@/lib/languages'

export interface LanguageConfig {
  primaryLanguage: string
  secondaryLanguage: string | null
  isBilingual: boolean
  primaryLanguageInfo: LanguageOption | null
  secondaryLanguageInfo: LanguageOption | null
}

interface LanguageConfigContextType extends LanguageConfig {
  /** "Name (EN)" */
  pl: (label: string) => string
  /** "Name (RU)" — returns empty string if monolingual (use with isBilingual check) */
  sl: (label: string) => string
  /** Primary language code uppercase: "EN" */
  pCode: string
  /** Secondary language code uppercase: "RU" | "" */
  sCode: string
  loading: boolean
}

const defaults: LanguageConfigContextType = {
  primaryLanguage: 'en',
  secondaryLanguage: 'ru',
  isBilingual: true,
  primaryLanguageInfo: null,
  secondaryLanguageInfo: null,
  pl: (l: string) => `${l} (EN)`,
  sl: (l: string) => `${l} (RU)`,
  pCode: 'EN',
  sCode: 'RU',
  loading: true,
}

const LanguageConfigContext = createContext<LanguageConfigContextType>(defaults)

let _cachedConfig: LanguageConfig | null = null

export function LanguageConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<LanguageConfig>(
    _cachedConfig || {
      primaryLanguage: 'en',
      secondaryLanguage: 'ru',
      isBilingual: true,
      primaryLanguageInfo: null,
      secondaryLanguageInfo: null,
    }
  )
  const [loading, setLoading] = useState(!_cachedConfig)

  useEffect(() => {
    if (_cachedConfig) return
    fetch('/api/languages')
      .then(r => r.json())
      .then(data => {
        const c: LanguageConfig = {
          primaryLanguage: data.primaryLanguage || 'en',
          secondaryLanguage: data.secondaryLanguage ?? null,
          isBilingual: data.isBilingual ?? true,
          primaryLanguageInfo: data.primaryLanguageInfo || null,
          secondaryLanguageInfo: data.secondaryLanguageInfo || null,
        }
        _cachedConfig = c
        setConfig(c)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const pCode = config.primaryLanguage.toUpperCase()
  const sCode = config.secondaryLanguage?.toUpperCase() || ''

  const value: LanguageConfigContextType = {
    ...config,
    loading,
    pCode,
    sCode,
    pl: (label: string) => config.isBilingual ? `${label} (${pCode})` : label,
    sl: (label: string) => `${label} (${sCode})`,
  }

  return (
    <LanguageConfigContext.Provider value={value}>
      {children}
    </LanguageConfigContext.Provider>
  )
}

export function useLanguageConfig() {
  return useContext(LanguageConfigContext)
}
