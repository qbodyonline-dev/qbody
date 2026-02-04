'use client'
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { Save, Globe, Palette, FileText, BookOpen, CreditCard, Instagram, Upload, Eye, Image, Plus, Edit, Languages, Search, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

const tabs = [
  { id: 'general', icon: Globe },
  { id: 'seo', icon: Search },
  { id: 'branding', icon: Palette },
  { id: 'content', icon: FileText },
  { id: 'courses', icon: BookOpen },
  { id: 'pricing', icon: CreditCard },
  { id: 'social', icon: Instagram },
  { id: 'translations', icon: Languages },
]

export default function SettingsPage() {
  const { t, locale } = useTranslation()
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    siteName: 'Qbody by Khavanskaia',
    tagline: 'Professional fitness programs',
    taglineRu: 'Профессиональные фитнес программы',
    email: 'info@qbody.app',
    phone: '+1 234 567 890',
    primaryColor: '#14b8a6',
    instagram: 'https://instagram.com/',
    telegram: 'https://t.me/',
    whatsapp: 'https://wa.me/',
    heroTitle: 'Transform your body with QBody',
    heroTitleRu: 'Трансформируй своё тело с QBody',
    heroSubtitle: 'Professional training programs and personal coaching',
    heroSubtitleRu: 'Профессиональные программы тренировок и персональное сопровождение',
    // SEO settings
    seoTitle: 'Qbody by Khavanskaia — Personal Fitness Training & Recovery Programs',
    seoTitleRu: 'Qbody от Хаванской — Персональные фитнес-тренировки и программы восстановления',
    seoDescription: 'Professional personal training, weight loss programs, and post-surgery recovery courses by NASM-certified trainer Aleksandra Khavanskaia. 17+ years experience, 1000+ clients.',
    seoDescriptionRu: 'Профессиональные персональные тренировки, программы похудения и восстановления после операций от NASM-сертифицированного тренера Александры Хаванской. 17+ лет опыта, 1000+ клиентов.',
    seoKeywords: 'personal trainer, fitness programs, weight loss, post surgery recovery, NASM certified, Las Vegas trainer, online coaching',
    seoKeywordsRu: 'персональный тренер, фитнес программы, похудение, восстановление после операций, онлайн тренировки, Лас Вегас',
    ogImageUrl: '/images/og-cover.jpg',
    canonicalUrl: 'https://qbody.app',
    googleVerification: '',
    yandexVerification: '',
    enableIndexing: true,
    enableSitemap: true,
    gaTrackingId: '',
    gtmId: '',
  })

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success(t('settings.saved'))
    setIsSaving(false)
  }

  const courses = [
    { id: '1', title: 'Breast Augmentation Recovery', titleRu: 'Восстановление после увеличения груди', lessons: 18, price: 99, active: true },
    { id: '2', title: 'C-Section Recovery', titleRu: 'Восстановление после кесарева', lessons: 24, price: 99, active: true },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-zinc-900">{t('settings.title')}</h1><p className="text-zinc-500 mt-1">{t('settings.subtitle')}</p></div>
        <div className="flex gap-3">
          <a href="/" target="_blank"><Button variant="outline"><Eye className="w-4 h-4 mr-2" />{t('settings.viewSite')}</Button></a>
          <Button variant="gradient" onClick={handleSave} disabled={isSaving}><Save className="w-4 h-4 mr-2" />{isSaving ? t('settings.saving') : t('settings.save')}</Button>
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
                  <div><label className="block text-sm font-medium text-zinc-700 mb-2">{t('settings.general.defaultLanguage')}</label><select className="w-full h-12 px-4 rounded-xl border border-zinc-200"><option value="en">English</option><option value="ru">Русский</option></select></div>
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
                      <span className="text-2xl font-bold">92</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-zinc-900 text-lg">{locale === 'ru' ? 'SEO-оценка' : 'SEO Score'}</h3>
                      <p className="text-sm text-zinc-500">{locale === 'ru' ? 'Ваш сайт хорошо оптимизирован для поисковых систем' : 'Your site is well optimized for search engines'}</p>
                    </div>
                    <div className="flex gap-2">
                      {[{ icon: CheckCircle2, color: 'text-green-500', label: locale === 'ru' ? '8 ОК' : '8 OK' }, { icon: AlertCircle, color: 'text-amber-500', label: locale === 'ru' ? '2 Совет' : '2 Tips' }].map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 rounded-lg">
                          <item.icon className={`w-4 h-4 ${item.color}`} /><span className="text-xs font-medium">{item.label}</span>
                        </div>
                      ))}
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
                        {settings.canonicalUrl} <span className="text-zinc-300">›</span>
                      </div>
                      <h3 className="text-[#1a0dab] text-lg font-medium hover:underline cursor-pointer leading-tight">{settings.seoTitle.slice(0, 60)}{settings.seoTitle.length > 60 ? '...' : ''}</h3>
                      <p className="text-sm text-zinc-600 leading-relaxed">{settings.seoDescription.slice(0, 155)}{settings.seoDescription.length > 155 ? '...' : ''}</p>
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
                      <div className="text-center">
                        <Image className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
                        <p className="text-zinc-400 text-sm">1200 × 630px</p>
                        <Button variant="outline" size="sm" className="mt-3"><Upload className="w-4 h-4 mr-2" />{locale === 'ru' ? 'Загрузить OG Image' : 'Upload OG Image'}</Button>
                      </div>
                    </div>
                  </div>
                  <Input label="OG Image URL" value={settings.ogImageUrl} onChange={e => setSettings({ ...settings, ogImageUrl: e.target.value })} />
                </CardContent>
              </Card>

              {/* Favicon */}
              <Card>
                <CardHeader>
                  <CardTitle>{locale === 'ru' ? 'Фавикон' : 'Favicon'}</CardTitle>
                  <CardDescription>{locale === 'ru' ? 'Иконка сайта в браузере. Загрузите ICO, PNG или SVG' : 'Browser tab icon. Upload ICO, PNG or SVG'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-6">
                    <div className="space-y-3">
                      {[
                        { size: '16×16', label: 'favicon-16x16.png' },
                        { size: '32×32', label: 'favicon-32x32.png' },
                        { size: '180×180', label: 'apple-touch-icon.png' },
                        { size: '192×192', label: 'android-chrome-192.png' },
                        { size: '512×512', label: 'android-chrome-512.png' },
                      ].map(f => (
                        <div key={f.size} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold text-sm">Q</div>
                          <div>
                            <p className="text-sm font-medium text-zinc-700">{f.size}</p>
                            <p className="text-xs text-zinc-400">{f.label}</p>
                          </div>
                          <Button variant="outline" size="sm" className="ml-auto"><Upload className="w-3.5 h-3.5" /></Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="p-4 bg-zinc-50 rounded-xl">
                        <p className="text-sm font-medium text-zinc-700 mb-2">{locale === 'ru' ? 'Предпросмотр в браузере' : 'Browser Preview'}</p>
                        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-zinc-200">
                          <div className="w-4 h-4 rounded bg-teal-500 flex items-center justify-center text-white text-[8px] font-bold">Q</div>
                          <span className="text-xs text-zinc-600 truncate">Qbody by Khavanskaia — Personal Fi...</span>
                          <span className="text-zinc-300 text-xs ml-auto">×</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Canonical & Indexing */}
              <Card>
                <CardHeader>
                  <CardTitle>{locale === 'ru' ? 'Индексация и каноникал' : 'Indexing & Canonical'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input label="Canonical URL" value={settings.canonicalUrl} onChange={e => setSettings({ ...settings, canonicalUrl: e.target.value })} />
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
                      { ok: true, en: 'Meta title is set (under 60 characters)', ru: 'Meta title установлен (до 60 символов)' },
                      { ok: true, en: 'Meta description is set (under 155 characters)', ru: 'Meta description установлен (до 155 символов)' },
                      { ok: true, en: 'Open Graph image is configured', ru: 'OG Image настроен' },
                      { ok: true, en: 'Structured data (JSON-LD) is present', ru: 'Структурированные данные (JSON-LD) добавлены' },
                      { ok: true, en: 'Sitemap.xml is auto-generated', ru: 'Sitemap.xml генерируется автоматически' },
                      { ok: true, en: 'Robots.txt is configured', ru: 'Robots.txt настроен' },
                      { ok: true, en: 'All images have alt attributes', ru: 'Все изображения имеют alt атрибуты' },
                      { ok: true, en: 'Canonical URL is set', ru: 'Canonical URL установлен' },
                      { ok: settings.googleVerification.length > 0, en: 'Google Search Console verified', ru: 'Google Search Console подтверждён' },
                      { ok: settings.gaTrackingId.length > 0, en: 'Google Analytics connected', ru: 'Google Analytics подключен' },
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
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center"><span className="text-white font-bold text-3xl">Q</span></div>
                    <div><Button variant="outline"><Upload className="w-4 h-4 mr-2" />{t('settings.branding.uploadLogo')}</Button></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t('settings.branding.colors')}</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-zinc-700">{t('settings.branding.primaryColor')}</label>
                    <input type="color" value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} className="w-12 h-12 rounded-xl border-2 border-zinc-200 cursor-pointer" />
                    <Input value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} className="w-32" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t('settings.branding.heroImage')}</CardTitle></CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-zinc-300 rounded-2xl p-8 text-center">
                    <Image className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                    <p className="text-zinc-500 mb-4">{t('settings.branding.dragDrop')}</p>
                    <Button variant="outline"><Upload className="w-4 h-4 mr-2" />{t('settings.branding.uploadImage')}</Button>
                  </div>
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

          {activeTab === 'courses' && (
            <Card>
              <CardHeader><CardTitle>{t('settings.courses.title')}</CardTitle><CardDescription>{t('settings.courses.subtitle')}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="p-4 border border-zinc-200 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-zinc-900">{locale === 'ru' ? course.titleRu : course.title}</h3>
                        <p className="text-sm text-zinc-500 mt-1">{course.lessons} {t('settings.courses.lessons')} • ${course.price}</p>
                      </div>
                      <Badge variant="success">{t('settings.courses.active')}</Badge>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-1" />{t('settings.courses.editCourse')}</Button>
                      <Button variant="outline" size="sm">{t('settings.courses.manageLessons')}</Button>
                    </div>
                  </div>
                ))}
                <Button variant="gradient" className="w-full"><Plus className="w-4 h-4 mr-2" />{t('settings.courses.addCourse')}</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'pricing' && (
            <Card>
              <CardHeader><CardTitle>{t('settings.pricing.title')}</CardTitle><CardDescription>{t('settings.pricing.subtitle')}</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { key: 'weightLoss', price: 49 },
                    { key: 'muscleGain', price: 49 },
                    { key: 'beginner', price: 39 },
                    { key: 'endurance', price: 49 },
                    { key: 'homeFitness', price: 39 },
                  ].map((program) => {
                    const programData = t(`landing.programs.programs.${program.key}`) as any
                    return (
                      <div key={program.key} className="p-4 border border-zinc-200 rounded-xl">
                        <h3 className="font-semibold mb-2">{programData?.title || program.key}</h3>
                        <Input label={`${t('settings.pricing.title')} ($)`} type="number" defaultValue={String(program.price)} />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'social' && (
            <Card>
              <CardHeader><CardTitle>{t('settings.social.title')}</CardTitle><CardDescription>{t('settings.social.subtitle')}</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <Input label={t('settings.social.instagram')} icon={<Instagram className="w-4 h-4" />} value={settings.instagram} onChange={(e) => setSettings({ ...settings, instagram: e.target.value })} />
                <Input label={t('settings.social.telegram')} value={settings.telegram} onChange={(e) => setSettings({ ...settings, telegram: e.target.value })} />
                <Input label={t('settings.social.whatsapp')} value={settings.whatsapp} onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })} />
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
                    <option value="ru">🇷🇺 Русский</option>
                    <option value="es">🇪🇸 Español (coming soon)</option>
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
                      <Input value={item.ru} className="h-10" />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-6 pt-4 border-t">
                  <Button variant="outline"><Plus className="w-4 h-4 mr-2" />{t('settings.translations.addLanguage')}</Button>
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
