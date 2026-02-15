'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Globe, Check, Loader2, AlertTriangle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuth } from '@/lib/api'
import type { LanguageOption } from '@/lib/languages'

interface LanguageConfig {
  primaryLanguage: string
  secondaryLanguage: string | null
  isBilingual: boolean
  primaryLanguageInfo: LanguageOption
  secondaryLanguageInfo: LanguageOption | null
  supportedLanguages: LanguageOption[]
}

export default function LanguageSettingsTab({ locale }: { locale: string }) {
  const [config, setConfig] = useState<LanguageConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [primaryLang, setPrimaryLang] = useState('en')
  const [secondaryLang, setSecondaryLang] = useState<string | null>('ru')
  const [hasChanges, setHasChanges] = useState(false)

  // Load current config
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/languages')
        if (!res.ok) throw new Error('Failed to load')
        const data: LanguageConfig = await res.json()
        setConfig(data)
        setPrimaryLang(data.primaryLanguage)
        setSecondaryLang(data.secondaryLanguage)
      } catch (err) {
        console.error('Failed to load language config:', err)
        toast.error(locale === 'ru' ? 'Ошибка загрузки языковых настроек' : 'Failed to load language settings')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [locale])

  // Track changes
  useEffect(() => {
    if (!config) return
    setHasChanges(
      primaryLang !== config.primaryLanguage ||
      secondaryLang !== config.secondaryLanguage
    )
  }, [primaryLang, secondaryLang, config])

  // Save
  const handleSave = async () => {
    if (primaryLang === secondaryLang) {
      toast.error(locale === 'ru'
        ? 'Основной и дополнительный языки должны отличаться'
        : 'Primary and secondary languages must be different')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetchWithAuth('/api/languages', {
        method: 'PUT',
        body: JSON.stringify({
          primaryLanguage: primaryLang,
          secondaryLanguage: secondaryLang,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }
      const data = await res.json()
      setConfig({
        ...config!,
        primaryLanguage: data.primaryLanguage,
        secondaryLanguage: data.secondaryLanguage,
        isBilingual: data.isBilingual,
        primaryLanguageInfo: data.primaryLanguageInfo,
        secondaryLanguageInfo: data.secondaryLanguageInfo,
      })
      setHasChanges(false)
      toast.success(locale === 'ru' ? 'Языковые настройки сохранены' : 'Language settings saved')
    } catch (err: any) {
      console.error('Failed to save language config:', err)
      toast.error(err.message || (locale === 'ru' ? 'Ошибка сохранения' : 'Failed to save'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </CardContent>
      </Card>
    )
  }

  if (!config) return null

  const languages = config.supportedLanguages
  const selectedPrimary = languages.find(l => l.code === primaryLang)
  const selectedSecondary = secondaryLang ? languages.find(l => l.code === secondaryLang) : null
  const isBilingual = secondaryLang !== null

  return (
    <div className="space-y-6">
      {/* Current status */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${isBilingual ? 'bg-gradient-to-br from-teal-400 to-teal-600' : 'bg-gradient-to-br from-zinc-400 to-zinc-600'}`}>
              <Globe className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-zinc-900 text-lg">
                {isBilingual
                  ? (locale === 'ru' ? 'Двуязычный сайт' : 'Bilingual Site')
                  : (locale === 'ru' ? 'Одноязычный сайт' : 'Monolingual Site')
                }
              </h3>
              <p className="text-sm text-zinc-500">
                {isBilingual
                  ? `${selectedPrimary?.flag} ${selectedPrimary?.name} + ${selectedSecondary?.flag} ${selectedSecondary?.name}`
                  : `${selectedPrimary?.flag} ${selectedPrimary?.name} ${locale === 'ru' ? 'только' : 'only'}`
                }
              </p>
            </div>
            {hasChanges && (
              <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                {locale === 'ru' ? 'Есть несохранённые изменения' : 'Unsaved changes'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Primary language */}
      <Card>
        <CardHeader>
          <CardTitle>{locale === 'ru' ? 'Основной язык' : 'Primary Language'}</CardTitle>
          <CardDescription>
            {locale === 'ru'
              ? 'Главный язык сайта и приложения. Все основные поля контента будут на этом языке.'
              : 'Main language for your site and app. All primary content fields will use this language.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setPrimaryLang(lang.code)
                  if (secondaryLang === lang.code) setSecondaryLang(null)
                }}
                className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  primaryLang === lang.code
                    ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/20'
                    : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-zinc-900 truncate">{lang.name}</div>
                  <div className="text-xs text-zinc-500 truncate">{lang.nativeName}</div>
                </div>
                {primaryLang === lang.code && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Secondary language */}
      <Card>
        <CardHeader>
          <CardTitle>{locale === 'ru' ? 'Дополнительный язык' : 'Secondary Language'}</CardTitle>
          <CardDescription>
            {locale === 'ru'
              ? 'Второй язык для билингвального контента. Выберите "Нет" для одноязычного сайта — все поля второго языка будут скрыты.'
              : 'Second language for bilingual content. Choose "None" for a monolingual site — all secondary language fields will be hidden.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* None option */}
            <button
              onClick={() => setSecondaryLang(null)}
              className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                secondaryLang === null
                  ? 'border-zinc-500 bg-zinc-50 ring-2 ring-zinc-500/20'
                  : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <span className="text-2xl">🚫</span>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-zinc-900">{locale === 'ru' ? 'Нет' : 'None'}</div>
                <div className="text-xs text-zinc-500">{locale === 'ru' ? 'Одноязычный' : 'Monolingual'}</div>
              </div>
              {secondaryLang === null && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-zinc-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>

            {/* Language options (exclude primary) */}
            {languages.filter(l => l.code !== primaryLang).map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSecondaryLang(lang.code)}
                className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  secondaryLang === lang.code
                    ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/20'
                    : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-zinc-900 truncate">{lang.name}</div>
                  <div className="text-xs text-zinc-500 truncate">{lang.nativeName}</div>
                </div>
                {secondaryLang === lang.code && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview of how fields will look */}
      <Card>
        <CardHeader>
          <CardTitle>{locale === 'ru' ? 'Предпросмотр полей' : 'Fields Preview'}</CardTitle>
          <CardDescription>
            {locale === 'ru'
              ? 'Так будут выглядеть поля ввода в админке для программ, упражнений и контента'
              : 'This is how input fields will look in the admin panel for programs, exercises, and content'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-lg">
            {/* Primary field */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                {locale === 'ru' ? 'Название' : 'Name'} ({primaryLang.toUpperCase()})
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                  {selectedPrimary?.flag} {locale === 'ru' ? 'основной' : 'primary'}
                </span>
              </label>
              <div className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center text-sm text-zinc-400">
                {locale === 'ru' ? 'Введите название...' : 'Enter name...'}
              </div>
            </div>

            {/* Secondary field (only if bilingual) */}
            {isBilingual && selectedSecondary && (
              <>
                <div className="flex items-center gap-2 text-zinc-400">
                  <ArrowRight className="w-4 h-4" />
                  <span className="text-xs">{locale === 'ru' ? 'перевод' : 'translation'}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                    {locale === 'ru' ? 'Название' : 'Name'} ({secondaryLang!.toUpperCase()})
                    <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                      {selectedSecondary.flag} {locale === 'ru' ? 'доп.' : 'secondary'}
                    </span>
                  </label>
                  <div className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center text-sm text-zinc-400">
                    {locale === 'ru' ? 'Введите перевод...' : 'Enter translation...'}
                  </div>
                </div>
              </>
            )}

            {!isBilingual && (
              <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-300">
                <span className="text-zinc-400 text-sm">
                  {locale === 'ru'
                    ? '✓ Одноязычный режим — поля второго языка не показываются'
                    : '✓ Monolingual mode — secondary language fields are hidden'
                  }
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          variant="gradient"
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="min-w-[200px]"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          {isSaving
            ? (locale === 'ru' ? 'Сохранение...' : 'Saving...')
            : (locale === 'ru' ? 'Сохранить языковые настройки' : 'Save Language Settings')
          }
        </Button>
      </div>
    </div>
  )
}
