'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/lib/i18n'
import { Save, Globe, Palette, FileText, Instagram, Upload, Eye, Image, Edit, Languages, Search, AlertCircle, CheckCircle2, X, Loader2, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuth, fetchWithAuthUpload } from '@/lib/api'
import LanguageSettingsTab from './LanguageSettingsTab'

const tabs = [
  { id: 'general', icon: Globe },
  { id: 'seo', icon: Search },
  { id: 'branding', icon: Palette },
  { id: 'content', icon: FileText },
  { id: 'social', icon: Instagram },
  { id: 'translations', icon: Languages },
  { id: 'app', icon: Smartphone },
]

export default function SettingsPage() {
  const { t, locale } = useTranslation()
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingOg, setUploadingOg] = useState(false)
  const [uploadingAppBg, setUploadingAppBg] = useState(false)
  const [uploadingAppLoading, setUploadingAppLoading] = useState(false)
  const [uploadingAppIcon, setUploadingAppIcon] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const heroInputRef = useRef<HTMLInputElement>(null)
  const ogInputRef = useRef<HTMLInputElement>(null)
  const appBgInputRef = useRef<HTMLInputElement>(null)
  const appLoadingInputRef = useRef<HTMLInputElement>(null)
  const appIconInputRef = useRef<HTMLInputElement>(null)
  
  const [settings, setSettings] = useState({
    // General
    siteName: '',
    tagline: '',
    taglineRu: '',
    email: '',
    phone: '',
    // Branding
    primaryColor: '#14b8a6',
    logoUrl: '',
    heroImageUrl: '',
    // Social
    instagram: '',
    telegram: '',
    whatsapp: '',
    // SEO
    seoTitle: '',
    seoTitleRu: '',
    seoDescription: '',
    seoDescriptionRu: '',
    seoKeywords: '',
    seoKeywordsRu: '',
    ogImageUrl: '',
    canonicalUrl: '',
    googleVerification: '',
    yandexVerification: '',
    enableIndexing: true,
    enableSitemap: true,
    gaTrackingId: '',
    gtmId: '',
    // App
    appName: '',
    appColor: '',
    appBackgroundUrl: '',
    appLoadingUrl: '',
    appIconUrl: '',
  })

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings')
        if (!res.ok) throw new Error('Failed to load settings')
        const data = await res.json()
        
        // Merge loaded settings with defaults
        setSettings(prev => ({
          ...prev,
          // General — use ?? (not ||) so empty strings "" are preserved
          siteName: data.general?.siteName ?? prev.siteName,
          tagline: data.general?.tagline ?? prev.tagline,
          taglineRu: data.general?.taglineRu ?? prev.taglineRu,
          email: data.general?.email ?? prev.email,
          phone: data.general?.phone ?? prev.phone,
          // Branding
          primaryColor: data.branding?.primaryColor ?? prev.primaryColor,
          logoUrl: data.branding?.logoUrl ?? prev.logoUrl,
          heroImageUrl: data.branding?.heroImageUrl ?? prev.heroImageUrl,
          // Social
          instagram: data.social?.instagram ?? prev.instagram,
          telegram: data.social?.telegram ?? prev.telegram,
          whatsapp: data.social?.whatsapp ?? prev.whatsapp,
          // SEO
          seoTitle: data.seo?.seoTitle ?? prev.seoTitle,
          seoTitleRu: data.seo?.seoTitleRu ?? prev.seoTitleRu,
          seoDescription: data.seo?.seoDescription ?? prev.seoDescription,
          seoDescriptionRu: data.seo?.seoDescriptionRu ?? prev.seoDescriptionRu,
          seoKeywords: data.seo?.seoKeywords ?? prev.seoKeywords,
          seoKeywordsRu: data.seo?.seoKeywordsRu ?? prev.seoKeywordsRu,
          ogImageUrl: data.seo?.ogImageUrl ?? prev.ogImageUrl,
          canonicalUrl: data.seo?.canonicalUrl ?? prev.canonicalUrl,
          googleVerification: data.seo?.googleVerification ?? prev.googleVerification,
          yandexVerification: data.seo?.yandexVerification ?? prev.yandexVerification,
          enableIndexing: data.seo?.enableIndexing ?? prev.enableIndexing,
          enableSitemap: data.seo?.enableSitemap ?? prev.enableSitemap,
          gaTrackingId: data.seo?.gaTrackingId ?? prev.gaTrackingId,
          gtmId: data.seo?.gtmId ?? prev.gtmId,
          // App — используем ?? чтобы пустая строка "" (удалённый фон) не откатывалась к prev
          appName: data.app?.appName ?? prev.appName,
          appColor: data.app?.appColor ?? prev.appColor,
          appBackgroundUrl: data.app?.appBackgroundUrl ?? prev.appBackgroundUrl,
          appLoadingUrl: data.app?.appLoadingUrl ?? prev.appLoadingUrl,
          appIconUrl: data.app?.appIconUrl ?? prev.appIconUrl,
        }))
      } catch (err) {
        console.error('Failed to load settings:', err)
        toast.error(locale === 'ru' ? 'Ошибка загрузки настроек' : 'Failed to load settings')
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [locale])

  // Upload file helper
  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    
    try {
      const res = await fetchWithAuthUpload('/api/upload', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      return data.url
    } catch (err) {
      console.error('Upload error:', err)
      toast.error(locale === 'ru' ? 'Ошибка загрузки файла' : 'File upload failed')
      return null
    }
  }

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingLogo(true)
    const url = await uploadFile(file, 'branding')
    if (url) {
      setSettings(prev => ({ ...prev, logoUrl: url }))
      toast.success(locale === 'ru' ? 'Лого загружено' : 'Logo uploaded')
    }
    setUploadingLogo(false)
    e.target.value = ''
  }

  // Handle hero image upload
  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingHero(true)
    const url = await uploadFile(file, 'branding')
    if (url) {
      setSettings(prev => ({ ...prev, heroImageUrl: url }))
      toast.success(locale === 'ru' ? 'Изображение загружено' : 'Image uploaded')
    }
    setUploadingHero(false)
    e.target.value = ''
  }

  // Handle OG image upload
  const handleOgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingOg(true)
    const url = await uploadFile(file, 'seo')
    if (url) {
      setSettings(prev => ({ ...prev, ogImageUrl: url }))
      toast.success(locale === 'ru' ? 'OG Image загружено' : 'OG Image uploaded')
    }
    setUploadingOg(false)
    e.target.value = ''
  }

  // Handle app background upload
  const handleAppBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAppBg(true)
    const url = await uploadFile(file, 'app')
    if (url) {
      setSettings(prev => ({ ...prev, appBackgroundUrl: url }))
      toast.success(locale === 'ru' ? 'Фон загружен' : 'Background uploaded')
    }
    setUploadingAppBg(false)
    e.target.value = ''
  }

  // Handle app loading image upload
  const handleAppLoadingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAppLoading(true)
    const url = await uploadFile(file, 'app')
    if (url) {
      setSettings(prev => ({ ...prev, appLoadingUrl: url }))
      toast.success(locale === 'ru' ? 'Изображение загрузки загружено' : 'Loading image uploaded')
    }
    setUploadingAppLoading(false)
    e.target.value = ''
  }

  // Handle app icon upload
  const handleAppIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAppIcon(true)
    const url = await uploadFile(file, 'app')
    if (url) {
      setSettings(prev => ({ ...prev, appIconUrl: url }))
      toast.success(locale === 'ru' ? 'Иконка загружена' : 'Icon uploaded')
    }
    setUploadingAppIcon(false)
    e.target.value = ''
  }

  // Save all settings
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const settingsToSave = {
        general: {
          siteName: settings.siteName,
          tagline: settings.tagline,
          taglineRu: settings.taglineRu,
          email: settings.email,
          phone: settings.phone,
        },
        branding: {
          primaryColor: settings.primaryColor,
          logoUrl: settings.logoUrl,
          heroImageUrl: settings.heroImageUrl,
        },
        social: {
          instagram: settings.instagram,
          telegram: settings.telegram,
          whatsapp: settings.whatsapp,
        },
        seo: {
          seoTitle: settings.seoTitle,
          seoTitleRu: settings.seoTitleRu,
          seoDescription: settings.seoDescription,
          seoDescriptionRu: settings.seoDescriptionRu,
          seoKeywords: settings.seoKeywords,
          seoKeywordsRu: settings.seoKeywordsRu,
          ogImageUrl: settings.ogImageUrl,
          canonicalUrl: settings.canonicalUrl,
          googleVerification: settings.googleVerification,
          yandexVerification: settings.yandexVerification,
          enableIndexing: settings.enableIndexing,
          enableSitemap: settings.enableSitemap,
          gaTrackingId: settings.gaTrackingId,
          gtmId: settings.gtmId,
        },
        app: {
          appName: settings.appName,
          appColor: settings.appColor,
          appBackgroundUrl: settings.appBackgroundUrl,
          appLoadingUrl: settings.appLoadingUrl,
          appIconUrl: settings.appIconUrl,
        },
      }

      const res = await fetchWithAuth('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings: settingsToSave })
      })

      if (!res.ok) throw new Error('Failed to save settings')

      // Check for partial failures (HTTP 207 Multi-Status)
      const resData = await res.json()
      if (resData.success === false && resData.errors?.length > 0) {
        const failedKeys = resData.errors.map((e: any) => e.key).join(', ')
        toast.warning(
          locale === 'ru'
            ? `Часть настроек не сохранена: ${failedKeys}`
            : `Some settings failed to save: ${failedKeys}`
        )
        return
      }

      toast.success(locale === 'ru' ? 'Настройки сохранены' : 'Settings saved')
    } catch (err) {
      console.error('Failed to save settings:', err)
      toast.error(locale === 'ru' ? 'Ошибка сохранения настроек' : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  // SEO Score (computed before render for dynamic color)
  const seoScore = Math.round(
    ((settings.seoTitle.length > 0 && settings.seoTitle.length <= 60 ? 1 : 0) +
    (settings.seoDescription.length > 0 && settings.seoDescription.length <= 155 ? 1 : 0) +
    (settings.ogImageUrl ? 1 : 0) +
    (settings.canonicalUrl ? 1 : 0) +
    (settings.googleVerification ? 1 : 0) +
    (settings.gaTrackingId ? 1 : 0) +
    (settings.enableSitemap ? 1 : 0) +
    (settings.enableIndexing ? 1 : 0)) / 8 * 100
  )
  const seoScoreGradient = seoScore >= 70
    ? 'from-green-400 to-emerald-500'
    : seoScore >= 40
      ? 'from-amber-400 to-orange-500'
      : 'from-red-400 to-rose-500'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hidden file inputs */}
      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
      <input type="file" ref={heroInputRef} className="hidden" accept="image/*" onChange={handleHeroUpload} />
      <input type="file" ref={ogInputRef} className="hidden" accept="image/*" onChange={handleOgUpload} />
      <input type="file" ref={appBgInputRef} className="hidden" accept="image/*" onChange={handleAppBgUpload} />
      <input type="file" ref={appLoadingInputRef} className="hidden" accept="image/*" onChange={handleAppLoadingUpload} />
      <input type="file" ref={appIconInputRef} className="hidden" accept="image/*" onChange={handleAppIconUpload} />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-zinc-900">{t('settings.title')}</h1><p className="text-zinc-500 mt-1">{t('settings.subtitle')}</p></div>
        <div className="flex gap-3">
          <a href="/" target="_blank"><Button variant="outline"><Eye className="w-4 h-4 mr-2" />{t('settings.viewSite')}</Button></a>
          <Button variant="gradient" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isSaving ? (locale === 'ru' ? 'Сохранение...' : 'Saving...') : t('settings.save')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <Card><CardContent className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === tab.id ? 'bg-teal-500 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                    <Icon className="w-5 h-5" /><span className="font-medium">{t(`settings.tabs.${tab.id}`)}</span>
                  </button>
                )
              })}
            </nav>
          </CardContent></Card>
        </div>

        <div className="flex-1 space-y-6">
          {activeTab === 'general' && (
            <Card>
              <CardHeader><CardTitle>{t('settings.general.title')}</CardTitle><CardDescription>{t('settings.general.subtitle')}</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <Input label={t('settings.general.siteName')} value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} />
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <Input label={`${t('settings.general.tagline')} (EN)`} value={settings.tagline} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} />
                  <Input label={`${t('settings.general.tagline')} (RU)`} value={settings.taglineRu} onChange={(e) => setSettings({ ...settings, taglineRu: e.target.value })} />
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <Input label={t('settings.general.email')} type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
                  <Input label={t('settings.general.phone')} value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'seo' && (
            <>
              {/* SEO Score Card */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${seoScoreGradient} flex items-center justify-center text-white`}>
                      <span className="text-2xl font-bold">{seoScore}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-zinc-900 text-lg">{locale === 'ru' ? 'SEO-оценка' : 'SEO Score'}</h3>
                      <p className="text-sm text-zinc-500">{locale === 'ru' ? 'Оценка на основе заполненных полей' : 'Score based on filled fields'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Meta Title & Description */}
              <Card>
                <CardHeader>
                  <CardTitle>{locale === 'ru' ? 'Meta заголовок и описание' : 'Meta Title & Description'}</CardTitle>
                  <CardDescription>{locale === 'ru' ? 'Определяют отображение в результатах поиска Google/Yandex' : 'Controls how your site appears in Google/Yandex search results'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Input label={`${locale === 'ru' ? 'SEO заголовок' : 'SEO Title'} (EN)`} value={settings.seoTitle} onChange={e => setSettings({ ...settings, seoTitle: e.target.value })} />
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className={`h-1.5 rounded-full flex-1 ${settings.seoTitle.length <= 60 ? 'bg-green-400' : settings.seoTitle.length <= 70 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ maxWidth: `${Math.min(settings.seoTitle.length / 70 * 100, 100)}%` }} />
                      <span className={`text-xs font-mono ${settings.seoTitle.length > 60 ? 'text-amber-600' : 'text-zinc-400'}`}>{settings.seoTitle.length}/60</span>
                    </div>
                  </div>
                  <div>
                    <Input label={`${locale === 'ru' ? 'SEO заголовок' : 'SEO Title'} (RU)`} value={settings.seoTitleRu} onChange={e => setSettings({ ...settings, seoTitleRu: e.target.value })} />
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className={`h-1.5 rounded-full flex-1 ${settings.seoTitleRu.length <= 60 ? 'bg-green-400' : 'bg-amber-400'}`} style={{ maxWidth: `${Math.min(settings.seoTitleRu.length / 70 * 100, 100)}%` }} />
                      <span className="text-xs font-mono text-zinc-400">{settings.seoTitleRu.length}/60</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">{locale === 'ru' ? 'Meta описание' : 'Meta Description'} (EN)</label>
                    <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm" rows={3} value={settings.seoDescription} onChange={e => setSettings({ ...settings, seoDescription: e.target.value })} />
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className={`h-1.5 rounded-full flex-1 ${settings.seoDescription.length <= 155 ? 'bg-green-400' : 'bg-amber-400'}`} style={{ maxWidth: `${Math.min(settings.seoDescription.length / 160 * 100, 100)}%` }} />
                      <span className="text-xs font-mono text-zinc-400">{settings.seoDescription.length}/155</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">{locale === 'ru' ? 'Meta описание' : 'Meta Description'} (RU)</label>
                    <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm" rows={3} value={settings.seoDescriptionRu} onChange={e => setSettings({ ...settings, seoDescriptionRu: e.target.value })} />
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className={`h-1.5 rounded-full flex-1 ${settings.seoDescriptionRu.length <= 155 ? 'bg-green-400' : 'bg-amber-400'}`} style={{ maxWidth: `${Math.min(settings.seoDescriptionRu.length / 160 * 100, 100)}%` }} />
                      <span className="text-xs font-mono text-zinc-400">{settings.seoDescriptionRu.length}/155</span>
                    </div>
                  </div>

                  {/* SERP Preview — EN */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-3">{locale === 'ru' ? 'Предпросмотр в Google' : 'Google Search Preview'} (EN)</label>
                    <div className="p-4 bg-white rounded-xl border border-zinc-200 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <div className="w-5 h-5 rounded bg-teal-500 flex items-center justify-center text-white text-[10px] font-bold">Q</div>
                        {settings.canonicalUrl || 'https://yoursite.com'} <span className="text-zinc-300">›</span>
                      </div>
                      <h3 className="text-[#1a0dab] text-lg font-medium hover:underline cursor-pointer leading-tight">{(settings.seoTitle || 'Your SEO Title').slice(0, 60)}{settings.seoTitle.length > 60 ? '...' : ''}</h3>
                      <p className="text-sm text-zinc-600 leading-relaxed">{(settings.seoDescription || 'Your meta description will appear here...').slice(0, 155)}{settings.seoDescription.length > 155 ? '...' : ''}</p>
                    </div>
                  </div>

                  {/* SERP Preview — RU */}
                  {(settings.seoTitleRu || settings.seoDescriptionRu) && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-3">{locale === 'ru' ? 'Предпросмотр в Google' : 'Google Search Preview'} (RU)</label>
                      <div className="p-4 bg-white rounded-xl border border-zinc-200 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <div className="w-5 h-5 rounded bg-teal-500 flex items-center justify-center text-white text-[10px] font-bold">Q</div>
                          {settings.canonicalUrl || 'https://yoursite.com'} <span className="text-zinc-300">›</span>
                        </div>
                        <h3 className="text-[#1a0dab] text-lg font-medium hover:underline cursor-pointer leading-tight">{(settings.seoTitleRu || 'Ваш SEO-заголовок').slice(0, 60)}{settings.seoTitleRu.length > 60 ? '...' : ''}</h3>
                        <p className="text-sm text-zinc-600 leading-relaxed">{(settings.seoDescriptionRu || 'Ваше мета-описание...').slice(0, 155)}{settings.seoDescriptionRu.length > 155 ? '...' : ''}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Keywords */}
              <Card>
                <CardHeader>
                  <CardTitle>{locale === 'ru' ? 'Ключевые слова' : 'Keywords'}</CardTitle>
                  <CardDescription>{locale === 'ru' ? 'Разделяйте запятыми. Используйте для meta keywords' : 'Comma-separated. Used for meta keywords tag'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Keywords (EN)</label>
                    <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm" rows={2} value={settings.seoKeywords} onChange={e => setSettings({ ...settings, seoKeywords: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Keywords (RU)</label>
                    <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm" rows={2} value={settings.seoKeywordsRu} onChange={e => setSettings({ ...settings, seoKeywordsRu: e.target.value })} />
                  </div>
                </CardContent>
              </Card>

              {/* Open Graph / Social Sharing */}
              <Card>
                <CardHeader>
                  <CardTitle>{locale === 'ru' ? 'Изображение для соцсетей (OG Image)' : 'Social Sharing Image (OG Image)'}</CardTitle>
                  <CardDescription>{locale === 'ru' ? 'Рекомендуемый размер: 1200×630px. Отображается при шаринге в Facebook, Telegram, Twitter' : 'Recommended size: 1200×630px. Shown when sharing on Facebook, Telegram, Twitter'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-zinc-300 rounded-xl overflow-hidden">
                    <div className="aspect-[1200/630] bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center relative">
                      {settings.ogImageUrl ? (
                        <>
                          <img src={settings.ogImageUrl} alt="OG Image" className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              onClick={() => ogInputRef.current?.click()}
                              className="p-1.5 bg-zinc-800/70 text-white rounded-full hover:bg-zinc-900/80"
                              disabled={uploadingOg}
                            >
                              {uploadingOg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setSettings({ ...settings, ogImageUrl: '' })}
                              className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <Image className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
                          <p className="text-zinc-400 text-sm">1200 × 630px</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3"
                            onClick={() => ogInputRef.current?.click()}
                            disabled={uploadingOg}
                          >
                            {uploadingOg ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                            {locale === 'ru' ? 'Загрузить OG Image' : 'Upload OG Image'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <Input label="OG Image URL" value={settings.ogImageUrl} onChange={e => setSettings({ ...settings, ogImageUrl: e.target.value })} placeholder="https://..." />
                </CardContent>
              </Card>

              {/* Canonical & Indexing */}
              <Card>
                <CardHeader>
                  <CardTitle>{locale === 'ru' ? 'Индексация и каноникал' : 'Indexing & Canonical'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input label="Canonical URL" value={settings.canonicalUrl} onChange={e => setSettings({ ...settings, canonicalUrl: e.target.value })} placeholder="https://yoursite.com" />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${settings.enableIndexing ? 'bg-teal-500' : 'bg-zinc-300'}`}
                        onClick={() => setSettings({ ...settings, enableIndexing: !settings.enableIndexing })}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.enableIndexing ? 'translate-x-4' : ''}`} />
                      </div>
                      <span className="text-sm text-zinc-700">{locale === 'ru' ? 'Разрешить индексацию (robots: index, follow)' : 'Allow indexing (robots: index, follow)'}</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${settings.enableSitemap ? 'bg-teal-500' : 'bg-zinc-300'}`}
                        onClick={() => setSettings({ ...settings, enableSitemap: !settings.enableSitemap })}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.enableSitemap ? 'translate-x-4' : ''}`} />
                      </div>
                      <span className="text-sm text-zinc-700">{locale === 'ru' ? 'Генерировать sitemap.xml автоматически' : 'Auto-generate sitemap.xml'}</span>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Verification & Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>{locale === 'ru' ? 'Верификация и аналитика' : 'Verification & Analytics'}</CardTitle>
                  <CardDescription>{locale === 'ru' ? 'Подтвердите владение сайтом для Google Search Console и Яндекс.Вебмастер' : 'Verify site ownership for Google Search Console and Yandex Webmaster'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input label="Google Search Console Verification" value={settings.googleVerification} onChange={e => setSettings({ ...settings, googleVerification: e.target.value })} placeholder="google-site-verification=..." />
                  <Input label="Yandex Webmaster Verification" value={settings.yandexVerification} onChange={e => setSettings({ ...settings, yandexVerification: e.target.value })} placeholder="yandex-verification=..." />
                  <div className="border-t border-zinc-100 pt-4 space-y-4">
                    <Input label="Google Analytics (GA4)" value={settings.gaTrackingId} onChange={e => setSettings({ ...settings, gaTrackingId: e.target.value })} placeholder="G-XXXXXXXXXX" />
                    <Input label="Google Tag Manager" value={settings.gtmId} onChange={e => setSettings({ ...settings, gtmId: e.target.value })} placeholder="GTM-XXXXXXX" />
                  </div>
                </CardContent>
              </Card>

              {/* SEO Checklist */}
              <Card>
                <CardHeader><CardTitle>{locale === 'ru' ? 'SEO чек-лист' : 'SEO Checklist'}</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { ok: settings.seoTitle.length > 0 && settings.seoTitle.length <= 60, en: 'Meta title is set (under 60 characters)', ru: 'Meta title установлен (до 60 символов)' },
                      { ok: settings.seoDescription.length > 0 && settings.seoDescription.length <= 155, en: 'Meta description is set (under 155 characters)', ru: 'Meta description установлен (до 155 символов)' },
                      { ok: !!settings.ogImageUrl, en: 'Open Graph image is configured', ru: 'OG Image настроен' },
                      { ok: settings.enableSitemap, en: 'Sitemap.xml is auto-generated', ru: 'Sitemap.xml генерируется автоматически' },
                      { ok: settings.enableIndexing, en: 'Indexing is enabled', ru: 'Индексация включена' },
                      { ok: !!settings.canonicalUrl, en: 'Canonical URL is set', ru: 'Canonical URL установлен' },
                      { ok: !!settings.googleVerification, en: 'Google Search Console verified', ru: 'Google Search Console подтверждён' },
                      { ok: !!settings.gaTrackingId, en: 'Google Analytics connected', ru: 'Google Analytics подключен' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {item.ok ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />}
                        <span className={`text-sm ${item.ok ? 'text-zinc-700' : 'text-amber-700'}`}>{locale === 'ru' ? item.ru : item.en}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'branding' && (
            <>
              <Card>
                <CardHeader><CardTitle>{t('settings.branding.logo')}</CardTitle><CardDescription>{t('settings.branding.logoHelp')}</CardDescription></CardHeader>
                <CardContent>
                  <div className="flex items-start gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center overflow-hidden relative">
                      {settings.logoUrl ? (
                        <>
                          <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setSettings({ ...settings, logoUrl: '' })}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <span className="text-white font-bold text-3xl">Q</span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                      >
                        {uploadingLogo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        {t('settings.branding.uploadLogo')}
                      </Button>
                      {settings.logoUrl && (
                        <p className="text-xs text-zinc-500 truncate max-w-xs">{settings.logoUrl}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><CardTitle>{t('settings.branding.colors')}</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-zinc-700">{t('settings.branding.primaryColor')}</label>
                    <input 
                      type="color" 
                      value={settings.primaryColor} 
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} 
                      className="w-12 h-12 rounded-xl border-2 border-zinc-200 cursor-pointer" 
                    />
                    <Input 
                      value={settings.primaryColor} 
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} 
                      className="w-32" 
                    />
                    <div 
                      className="w-12 h-12 rounded-xl border-2 border-zinc-200" 
                      style={{ backgroundColor: settings.primaryColor }}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><CardTitle>{t('settings.branding.heroImage')}</CardTitle></CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-zinc-300 rounded-2xl overflow-hidden">
                    {settings.heroImageUrl ? (
                      <div className="relative aspect-video">
                        <img src={settings.heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            onClick={() => heroInputRef.current?.click()}
                            className="p-1.5 bg-zinc-800/70 text-white rounded-full hover:bg-zinc-900/80"
                            disabled={uploadingHero}
                          >
                            {uploadingHero ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setSettings({ ...settings, heroImageUrl: '' })}
                            className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Image className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                        <p className="text-zinc-500 mb-4">{t('settings.branding.dragDrop')}</p>
                        <Button 
                          variant="outline"
                          onClick={() => heroInputRef.current?.click()}
                          disabled={uploadingHero}
                        >
                          {uploadingHero ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                          {t('settings.branding.uploadImage')}
                        </Button>
                      </div>
                    )}
                  </div>
                  {settings.heroImageUrl && (
                    <p className="text-xs text-zinc-500 mt-2 truncate">{settings.heroImageUrl}</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'content' && (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">{locale === 'ru' ? 'Управление контентом перенесено' : 'Content management moved'}</h3>
                <p className="text-zinc-500 mb-6">{locale === 'ru' ? 'Используйте Редактор страницы для управления всеми блоками лендинга' : 'Use Page Editor to manage all landing page blocks'}</p>
                <a href="/dashboard/page-editor"><Button variant="gradient"><Edit className="w-4 h-4 mr-2" />{locale === 'ru' ? 'Открыть редактор страницы' : 'Open Page Editor'}</Button></a>
              </CardContent>
            </Card>
          )}

          {activeTab === 'social' && (
            <Card>
              <CardHeader><CardTitle>{t('settings.social.title')}</CardTitle><CardDescription>{t('settings.social.subtitle')}</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <Input label={t('settings.social.instagram')} icon={<Instagram className="w-4 h-4" />} value={settings.instagram} onChange={(e) => setSettings({ ...settings, instagram: e.target.value })} placeholder="https://instagram.com/..." />
                <Input label={t('settings.social.telegram')} value={settings.telegram} onChange={(e) => setSettings({ ...settings, telegram: e.target.value })} placeholder="https://t.me/..." />
                <Input label={t('settings.social.whatsapp')} value={settings.whatsapp} onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })} placeholder="https://wa.me/..." />
              </CardContent>
            </Card>
          )}

          {activeTab === 'translations' && (
            <LanguageSettingsTab locale={locale} />
          )}

          {activeTab === 'app' && (
            <>
              {/* App Name */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.app.appName')}</CardTitle>
                  <CardDescription>{t('settings.app.appNameHelp')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    label={t('settings.app.appName')}
                    value={settings.appName}
                    onChange={(e) => setSettings(prev => ({ ...prev, appName: e.target.value }))}
                    placeholder={locale === 'ru' ? 'Моё приложение' : 'My App'}
                  />
                </CardContent>
              </Card>

              {/* App Color */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.app.appColor')}</CardTitle>
                  <CardDescription>{t('settings.app.appColorHelp')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={settings.appColor || '#000000'}
                      onChange={(e) => setSettings(prev => ({ ...prev, appColor: e.target.value }))}
                      className="w-12 h-12 rounded-xl border-2 border-zinc-200 cursor-pointer"
                    />
                    <Input
                      value={settings.appColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, appColor: e.target.value }))}
                      placeholder="#000000"
                      className="w-32"
                    />
                    {settings.appColor && (
                      <button
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, appColor: '' }))}
                        className="text-sm text-zinc-500 hover:text-zinc-800 underline"
                      >
                        {t('settings.app.resetColor')}
                      </button>
                    )}
                    {settings.appColor && (
                      <div
                        className="w-12 h-12 rounded-xl border-2 border-zinc-200"
                        style={{ backgroundColor: settings.appColor }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Background Image */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.app.backgroundImage')}</CardTitle>
                  <CardDescription>{t('settings.app.backgroundImageHelp')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-zinc-300 rounded-2xl overflow-hidden">
                    {settings.appBackgroundUrl ? (
                      <div className="relative aspect-[9/16] max-h-80">
                        <img src={settings.appBackgroundUrl} alt="App Background" className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            onClick={() => appBgInputRef.current?.click()}
                            className="p-1.5 bg-zinc-800/70 text-white rounded-full hover:bg-zinc-900/80"
                            disabled={uploadingAppBg}
                          >
                            {uploadingAppBg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setSettings(prev => ({ ...prev, appBackgroundUrl: '' }))}
                            className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Image className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                        <p className="text-zinc-500 text-sm mb-4">1080 × 1920px</p>
                        <Button
                          variant="outline"
                          onClick={() => appBgInputRef.current?.click()}
                          disabled={uploadingAppBg}
                        >
                          {uploadingAppBg ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                          {t('settings.app.uploadImage')}
                        </Button>
                      </div>
                    )}
                  </div>
                  {settings.appBackgroundUrl && (
                    <p className="text-xs text-zinc-500 mt-2 truncate">{settings.appBackgroundUrl}</p>
                  )}
                </CardContent>
              </Card>

              {/* Loading Image */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.app.loadingImage')}</CardTitle>
                  <CardDescription>{t('settings.app.loadingImageHelp')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-6">
                    <div className="w-32 h-32 rounded-2xl bg-zinc-100 flex items-center justify-center overflow-hidden relative border-2 border-dashed border-zinc-300">
                      {settings.appLoadingUrl ? (
                        <>
                          <img src={settings.appLoadingUrl} alt="Loading" className="w-full h-full object-contain" />
                          <button
                            onClick={() => setSettings(prev => ({ ...prev, appLoadingUrl: '' }))}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <Image className="w-8 h-8 text-zinc-400" />
                      )}
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm text-zinc-500">512 × 512px</p>
                      <Button
                        variant="outline"
                        onClick={() => appLoadingInputRef.current?.click()}
                        disabled={uploadingAppLoading}
                      >
                        {uploadingAppLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        {t('settings.app.uploadImage')}
                      </Button>
                      {settings.appLoadingUrl && (
                        <p className="text-xs text-zinc-500 truncate max-w-xs">{settings.appLoadingUrl}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* App Icon */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.app.appIcon')}</CardTitle>
                  <CardDescription>{t('settings.app.appIconHelp')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-zinc-100 flex items-center justify-center overflow-hidden relative border-2 border-dashed border-zinc-300">
                      {settings.appIconUrl ? (
                        <>
                          <img src={settings.appIconUrl} alt="App Icon" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setSettings(prev => ({ ...prev, appIconUrl: '' }))}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <Smartphone className="w-8 h-8 text-zinc-400" />
                      )}
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm text-zinc-500">1024 × 1024px PNG</p>
                      <Button
                        variant="outline"
                        onClick={() => appIconInputRef.current?.click()}
                        disabled={uploadingAppIcon}
                      >
                        {uploadingAppIcon ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        {t('settings.app.uploadImage')}
                      </Button>
                      {settings.appIconUrl && (
                        <p className="text-xs text-zinc-500 truncate max-w-xs">{settings.appIconUrl}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
