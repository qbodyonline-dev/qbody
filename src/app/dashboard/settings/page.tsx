'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/lib/i18n'
import { Save, Globe, Palette, FileText, Instagram, Upload, Eye, Image, Edit, Languages, Search, AlertCircle, CheckCircle2, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuth, fetchWithAuthUpload } from '@/lib/api'

const tabs = [
  { id: 'general', icon: Globe },
  { id: 'seo', icon: Search },
  { id: 'branding', icon: Palette },
  { id: 'content', icon: FileText },
  { id: 'social', icon: Instagram },
  { id: 'translations', icon: Languages },
]

export default function SettingsPage() {
  const { t, locale } = useTranslation()
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingOg, setUploadingOg] = useState(false)
  
  const logoInputRef = useRef<HTMLInputElement>(null)
  const heroInputRef = useRef<HTMLInputElement>(null)
  const ogInputRef = useRef<HTMLInputElement>(null)
  
  const [settings, setSettings] = useState({
    // General
    siteName: '',
    tagline: '',
    taglineRu: '',
    email: '',
    phone: '',
    defaultLanguage: 'en',
    // Branding
    primaryColor: '#14b8a6',
    logoUrl: '',
    heroImageUrl: '',
    // Social
    instagram: '',
    telegram: '',
    whatsapp: '',
    // Content (hero)
    heroTitle: '',
    heroTitleRu: '',
    heroSubtitle: '',
    heroSubtitleRu: '',
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
          // General
          siteName: data.general?.siteName || prev.siteName,
          tagline: data.general?.tagline || prev.tagline,
          taglineRu: data.general?.taglineRu || prev.taglineRu,
          email: data.general?.email || prev.email,
          phone: data.general?.phone || prev.phone,
          defaultLanguage: data.general?.defaultLanguage || prev.defaultLanguage,
          // Branding
          primaryColor: data.branding?.primaryColor || prev.primaryColor,
          logoUrl: data.branding?.logoUrl || prev.logoUrl,
          heroImageUrl: data.branding?.heroImageUrl || prev.heroImageUrl,
          // Social
          instagram: data.social?.instagram || prev.instagram,
          telegram: data.social?.telegram || prev.telegram,
          whatsapp: data.social?.whatsapp || prev.whatsapp,
          // Content
          heroTitle: data.content?.heroTitle || prev.heroTitle,
          heroTitleRu: data.content?.heroTitleRu || prev.heroTitleRu,
          heroSubtitle: data.content?.heroSubtitle || prev.heroSubtitle,
          heroSubtitleRu: data.content?.heroSubtitleRu || prev.heroSubtitleRu,
          // SEO
          seoTitle: data.seo?.seoTitle || prev.seoTitle,
          seoTitleRu: data.seo?.seoTitleRu || prev.seoTitleRu,
          seoDescription: data.seo?.seoDescription || prev.seoDescription,
          seoDescriptionRu: data.seo?.seoDescriptionRu || prev.seoDescriptionRu,
          seoKeywords: data.seo?.seoKeywords || prev.seoKeywords,
          seoKeywordsRu: data.seo?.seoKeywordsRu || prev.seoKeywordsRu,
          ogImageUrl: data.seo?.ogImageUrl || prev.ogImageUrl,
          canonicalUrl: data.seo?.canonicalUrl || prev.canonicalUrl,
          googleVerification: data.seo?.googleVerification || prev.googleVerification,
          yandexVerification: data.seo?.yandexVerification || prev.yandexVerification,
          enableIndexing: data.seo?.enableIndexing ?? prev.enableIndexing,
          enableSitemap: data.seo?.enableSitemap ?? prev.enableSitemap,
          gaTrackingId: data.seo?.gaTrackingId || prev.gaTrackingId,
          gtmId: data.seo?.gtmId || prev.gtmId,
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
          defaultLanguage: settings.defaultLanguage,
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
        content: {
          heroTitle: settings.heroTitle,
          heroTitleRu: settings.heroTitleRu,
          heroSubtitle: settings.heroSubtitle,
          heroSubtitleRu: settings.heroSubtitleRu,
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
      }

      const res = await fetchWithAuth('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings: settingsToSave })
      })
      
      if (!res.ok) throw new Error('Failed to save settings')
      
      toast.success(locale === 'ru' ? 'Настройки сохранены' : 'Settings saved')
    } catch (err) {
      console.error('Failed to save settings:', err)
      toast.error(locale === 'ru' ? 'Ошибка сохранения настроек' : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

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
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">{t('settings.general.defaultLanguage')}</label>
                    <select 
                      className="w-full h-12 px-4 rounded-xl border border-zinc-200"
                      value={settings.defaultLanguage}
                      onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                    >
                      <option value="en">English</option>
                      <option value="ru">Русский</option>
                    </select>
                  </div>
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
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white">
                      <span className="text-2xl font-bold">
                        {Math.round(
                          ((settings.seoTitle.length > 0 && settings.seoTitle.length <= 60 ? 1 : 0) +
                          (settings.seoDescription.length > 0 && settings.seoDescription.length <= 155 ? 1 : 0) +
                          (settings.ogImageUrl ? 1 : 0) +
                          (settings.canonicalUrl ? 1 : 0) +
                          (settings.googleVerification ? 1 : 0) +
                          (settings.gaTrackingId ? 1 : 0) +
                          (settings.enableSitemap ? 1 : 0) +
                          (settings.enableIndexing ? 1 : 0)) / 8 * 100
                        )}
                      </span>
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

                  {/* SERP Preview */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-3">{locale === 'ru' ? 'Предпросмотр в Google' : 'Google Search Preview'}</label>
                    <div className="p-4 bg-white rounded-xl border border-zinc-200 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <div className="w-5 h-5 rounded bg-teal-500 flex items-center justify-center text-white text-[10px] font-bold">Q</div>
                        {settings.canonicalUrl || 'https://yoursite.com'} <span className="text-zinc-300">›</span>
                      </div>
                      <h3 className="text-[#1a0dab] text-lg font-medium hover:underline cursor-pointer leading-tight">{(settings.seoTitle || 'Your SEO Title').slice(0, 60)}{settings.seoTitle.length > 60 ? '...' : ''}</h3>
                      <p className="text-sm text-zinc-600 leading-relaxed">{(settings.seoDescription || 'Your meta description will appear here...').slice(0, 155)}{settings.seoDescription.length > 155 ? '...' : ''}</p>
                    </div>
                  </div>
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
                          <button 
                            onClick={() => setSettings({ ...settings, ogImageUrl: '' })}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
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
                        <button 
                          onClick={() => setSettings({ ...settings, heroImageUrl: '' })}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
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
            <Card>
              <CardHeader><CardTitle>{t('settings.translations.title')}</CardTitle><CardDescription>{t('settings.translations.subtitle')}</CardDescription></CardHeader>
              <CardContent>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-700 mb-2">{t('settings.translations.selectLanguage')}</label>
                  <select className="w-full h-12 px-4 rounded-xl border border-zinc-200">
                    <option value="ru">Русский</option>
                    <option value="es">Español (coming soon)</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm font-medium text-zinc-500 pb-2 border-b">
                    <div>{t('settings.translations.key')}</div>
                    <div>{t('settings.translations.original')}</div>
                    <div>{t('settings.translations.translation')}</div>
                  </div>
                  {[
                    { key: 'hero.title', en: 'Transform your body', ru: 'Трансформируй своё тело' },
                    { key: 'hero.cta', en: 'Get Started', ru: 'Начать' },
                    { key: 'nav.programs', en: 'Programs', ru: 'Программы' },
                  ].map((item) => (
                    <div key={item.key} className="grid grid-cols-3 gap-4 items-center">
                      <code className="text-xs bg-zinc-100 px-2 py-1 rounded">{item.key}</code>
                      <span className="text-sm text-zinc-600">{item.en}</span>
                      <Input defaultValue={item.ru} className="h-10" />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-6 pt-4 border-t">
                  <Button variant="gradient">{t('settings.translations.saveAll')}</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
