'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/lib/i18n'
import {
  ArrowLeft, Save, Loader2, Eye, Upload, X, Plus, Trash2, ExternalLink, Globe, Lock,
} from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuth, fetchWithAuthUpload } from '@/lib/api'
import { CourseLanding } from '@/components/course-landing'
import { defaultLandingContent, mergeLandingContent } from '@/components/course-landing/content'
import type { L, LandingContent } from '@/components/course-landing/content'

/* ═══════════ LANDING CONTENT EDITOR ═══════════ */
/* Edits every text (EN/RU) and photo of the course landing template.
   Content is saved whole into site_settings (course_landing_{courseId})
   through /api/courses/[id]/landing; the template merges it over the
   defaults, so a partially filled config can never break the page. */

type Path = (string | number)[]

function getAt(obj: any, path: Path): any {
  return path.reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

function setAt(obj: any, path: Path, value: any): any {
  if (path.length === 0) return value
  const [head, ...rest] = path
  const copy: any = Array.isArray(obj) ? [...obj] : { ...(obj || {}) }
  copy[head as any] = setAt(copy[head as any], rest, value)
  return copy
}

/* ─── field definitions ─── */
type FieldDef =
  | { kind: 'L'; label: string; path: Path; long?: boolean }
  | { kind: 'photo'; label: string; path: Path; hint?: string }
  | { kind: 'string'; label: string; path: Path; placeholder?: string }
  | { kind: 'number'; label: string; path: Path; min?: number; max?: number }
  | { kind: 'divider'; label: string }

type SectionDef = { id: string; emoji: string; title: string; fields: FieldDef[] }

function buildSections(): SectionDef[] {
  const L_ = (label: string, path: Path, long = false): FieldDef => ({ kind: 'L', label, path, long })
  const P_ = (label: string, path: Path, hint?: string): FieldDef => ({ kind: 'photo', label, path, hint })
  const D_ = (label: string): FieldDef => ({ kind: 'divider', label })

  return [
    {
      id: 'hero', emoji: '🎯', title: 'Hero (первый экран)',
      fields: [
        P_('Фоновое фото', ['hero', 'bgImage'], 'Фото на весь первый экран с затемнением. Пусто — тёмный фон с кругами, как в макете.'),
        L_('Заголовок, строка 1', ['hero', 'titleTop']),
        L_('Акцентное слово (мятное)', ['hero', 'accent']),
        L_('Заголовок, продолжение', ['hero', 'titleRest']),
        L_('Подзаголовок', ['hero', 'subtitle'], true),
        L_('Кнопка', ['hero', 'cta']),
        L_('Подпись под кнопкой', ['hero', 'caption']),
      ],
    },
    {
      id: 'video', emoji: '🎬', title: 'Видео',
      fields: [
        L_('Заголовок секции', ['video', 'heading']),
        { kind: 'string', label: 'Ссылка на видео (YouTube / Vimeo / mp4)', path: ['video', 'url'], placeholder: 'Пусто — возьмётся Hero-видео курса' },
      ],
    },
    {
      id: 'forwho', emoji: '👥', title: 'Для кого',
      fields: [
        L_('Заголовок секции', ['forWho', 'heading']),
        D_('Карточка 1 (тёмная)'),
        P_('Фото', ['forWho', 'cards', 0, 'photo']),
        L_('Заголовок', ['forWho', 'cards', 0, 'title']),
        L_('«Сейчас»', ['forWho', 'cards', 0, 'nowText'], true),
        L_('«После курса»', ['forWho', 'cards', 0, 'afterText'], true),
        D_('Карточка 2 (светлая)'),
        P_('Фото', ['forWho', 'cards', 1, 'photo']),
        L_('Заголовок', ['forWho', 'cards', 1, 'title']),
        L_('«Сейчас»', ['forWho', 'cards', 1, 'nowText'], true),
        L_('«После курса»', ['forWho', 'cards', 1, 'afterText'], true),
      ],
    },
    {
      id: 'cases', emoji: '💬', title: 'Кейсы',
      fields: [
        L_('Заголовок секции', ['cases', 'heading']),
        ...[0, 1, 2].flatMap((i): FieldDef[] => [
          D_(`Кейс ${i + 1}`),
          P_('Фото / кадр видео', ['cases', 'items', i, 'media']),
          L_('Имя и возраст', ['cases', 'items', i, 'name']),
          L_('«До»', ['cases', 'items', i, 'before'], true),
          L_('«После»', ['cases', 'items', i, 'after'], true),
        ]),
      ],
    },
    {
      id: 'results', emoji: '✅', title: 'По итогу курса',
      fields: [
        L_('Заголовок секции', ['results', 'heading']),
        ...([
          [0, 'Карточка с фото (слева, высокая)'],
          [1, 'Мятная карточка'],
          [2, 'Карточка с фото (справа, высокая)'],
          [3, 'Тёмная карточка'],
          [4, 'Широкая карточка с фото (слева)'],
          [5, 'Широкая карточка с фото (справа)'],
        ] as [number, string][]).flatMap(([i, name]): FieldDef[] => [
          D_(name),
          ...(i === 1 || i === 3 ? [] : [P_('Фото', ['results', 'cells', i, 'photo'])]),
          L_('Заголовок', ['results', 'cells', i, 'title']),
          L_('Текст', ['results', 'cells', i, 'text'], true),
        ]),
      ],
    },
    {
      id: 'inside', emoji: '📦', title: 'Что внутри',
      fields: [
        L_('Заголовок секции', ['inside', 'heading']),
        D_('Платформа'),
        L_('Заголовок', ['inside', 'platformTitle']),
        L_('Текст', ['inside', 'platformText'], true),
        D_('Чек-листы'),
        L_('Заголовок', ['inside', 'checklistsTitle']),
        D_('Тренировки'),
        P_('Фото', ['inside', 'practicePhoto']),
        L_('Заголовок', ['inside', 'practiceTitle']),
        L_('Текст', ['inside', 'practiceText'], true),
        D_('Программы тренировок'),
        P_('Фото', ['inside', 'plansPhoto']),
        L_('Заголовок', ['inside', 'plansTitle']),
        ...[0, 1, 2, 3].map((i): FieldDef => L_(`Пункт ${i + 1}`, ['inside', 'plansItems', i])),
      ],
    },
    {
      id: 'stats', emoji: '🔢', title: 'Цифры',
      fields: [0, 1, 2, 3].flatMap((i): FieldDef[] => [
        D_(`Цифра ${i + 1}`),
        { kind: 'string', label: 'Значение (12, 35+, …)', path: ['stats', i, 'value'] },
        L_('Подпись', ['stats', i, 'label']),
        L_('Пояснение', ['stats', i, 'sub']),
      ]),
    },
    {
      id: 'expert', emoji: '🏆', title: 'Эксперт',
      fields: [
        P_('Фото', ['expert', 'photo'], 'Пусто — возьмётся фото инструктора из курса.'),
        L_('Надзаголовок', ['expert', 'kicker']),
        L_('Заголовок', ['expert', 'title']),
        L_('Текст', ['expert', 'text'], true),
        L_('Бейдж на фото', ['expert', 'badge']),
        ...[0, 1, 2, 3].flatMap((i): FieldDef[] => [
          D_(`Факт ${i + 1}`),
          L_('Заголовок', ['expert', 'facts', i, 'title']),
          L_('Пояснение', ['expert', 'facts', i, 'sub']),
        ]),
      ],
    },
    {
      id: 'bonus', emoji: '🎁', title: 'Бонус',
      fields: [
        L_('Метка («БОНУС:»)', ['bonus', 'label']),
        L_('Заголовок', ['bonus', 'heading']),
        L_('Текст', ['bonus', 'text'], true),
        ...[0, 1, 2, 3].flatMap((i): FieldDef[] => [
          D_(`Программа ${i + 1}`),
          P_('Фото', ['bonus', 'cards', i, 'photo']),
          L_('Название', ['bonus', 'cards', i, 'title']),
          L_('Описание', ['bonus', 'cards', i, 'text']),
        ]),
      ],
    },
    {
      id: 'pricing', emoji: '💳', title: 'Тариф',
      fields: [
        L_('Заголовок', ['pricing', 'heading']),
        ...[0, 1, 2, 3, 4, 5, 6, 7].map((i): FieldDef => L_(`Пункт ${i + 1}`, ['pricing', 'bullets', i])),
        D_('Карточка цены'),
        L_('Метка тарифа', ['pricing', 'planLabel']),
        L_('Описание под ценой', ['pricing', 'note'], true),
        L_('Кнопка', ['pricing', 'cta']),
        L_('Подпись под кнопкой', ['pricing', 'secure']),
      ],
    },
  ]
}

/* ═══════════ PAGE ═══════════ */

export default function CourseLandingEditorPage() {
  const { locale } = useTranslation()
  const ru = locale === 'ru'
  const params = useParams()
  const courseId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [course, setCourse] = useState<any>(null)
  const [enabled, setEnabled] = useState(false)
  const [draft, setDraft] = useState<LandingContent | null>(null)
  const [dirty, setDirty] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const [showPreview, setShowPreview] = useState(false)
  const [previewRu, setPreviewRu] = useState(true)
  const [uploadingPath, setUploadingPath] = useState<string | null>(null)

  const sections = useMemo(() => buildSections(), [])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth(`/api/courses/${courseId}/landing`)
        if (!res.ok) throw new Error('Failed to load')
        const j = await res.json()
        setCourse(j.course)
        setEnabled(j.enabled)
        setDraft(mergeLandingContent(defaultLandingContent(), j.data || {}))
      } catch {
        toast.error(ru ? 'Не удалось загрузить лендинг' : 'Failed to load the landing')
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  // Предупреждение о несохранённых изменениях
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const setField = (path: Path, value: any) => {
    setDraft(prev => (prev ? setAt(prev, path, value) : prev))
    setDirty(true)
  }

  const save = async (nextEnabled = enabled) => {
    if (!draft) return
    setSaving(true)
    try {
      const res = await fetchWithAuth(`/api/courses/${courseId}/landing`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: nextEnabled, data: draft }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || (ru ? 'Ошибка сохранения' : 'Save failed'))
      }
      setEnabled(nextEnabled)
      setDirty(false)
      toast.success(ru ? 'Лендинг сохранён' : 'Landing saved')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const uploadPhoto = async (path: Path) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      setUploadingPath(path.join('.'))
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('folder', `courses/${courseId}/landing`)
        const res = await fetchWithAuthUpload('/api/upload', { method: 'POST', body: fd })
        if (!res.ok) throw new Error('Upload failed')
        const { url } = await res.json()
        setField(path, url)
        toast.success(ru ? 'Фото загружено' : 'Photo uploaded')
      } catch {
        toast.error(ru ? 'Ошибка загрузки' : 'Upload failed')
      } finally {
        setUploadingPath(null)
      }
    }
    input.click()
  }

  /* ─── module results (по id модуля) ─── */
  const modules: any[] = useMemo(() => {
    if (!course || !draft) return []
    return (course.course_modules || [])
      .filter((m: any) => (m.course_lessons || []).length > 0)
      .slice(0, draft.program.maxModules ?? 5)
  }, [course, draft])

  const moduleBullets = (moduleId: string, index: number): L[] => {
    if (!draft) return []
    return draft.program.resultsByModule?.[moduleId] || draft.program.results[index] || []
  }

  const setModuleBullets = (moduleId: string, lang: 'ru' | 'en', text: string, index: number) => {
    if (!draft) return
    const current = moduleBullets(moduleId, index)
    const lines = text.split('\n')
    const next: L[] = lines.map((line, i) => ({
      ru: lang === 'ru' ? line : (current[i]?.ru ?? ''),
      en: lang === 'en' ? line : (current[i]?.en ?? ''),
    }))
    setField(['program', 'resultsByModule'], { ...(draft.program.resultsByModule || {}), [moduleId]: next })
  }

  /* ─── faq ─── */
  const faqItems = draft?.faq.items || []
  const addFaq = () => setField(['faq', 'items'], [...faqItems, { q: { en: '', ru: '' }, a: { en: '', ru: '' } }])
  const removeFaq = (i: number) => setField(['faq', 'items'], faqItems.filter((_, idx) => idx !== i))

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
  }
  if (!course || !draft) {
    return <div className="text-center py-16 text-zinc-500">{ru ? 'Курс не найден' : 'Course not found'}</div>
  }

  const active = sections.find(s => s.id === activeSection)

  return (
    <div className="space-y-5">
      {/* ─── Top bar ─── */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/dashboard/courses">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />{ru ? 'Курсы' : 'Courses'}</Button>
        </Link>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {ru ? 'Лендинг курса' : 'Course landing'} — {ru ? (course.title_secondary || course.title) : course.title}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {ru ? 'Тексты на двух языках; пустой EN показывает RU до перевода.' : 'Bilingual texts; empty EN falls back to RU until translated.'}
          </p>
        </div>
        <button
          onClick={() => save(!enabled)}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            enabled
              ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-400'
          }`}
          title={ru ? 'Переключить и сохранить' : 'Toggle and save'}
        >
          {enabled ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {enabled ? (ru ? 'Лендинг включён' : 'Landing on') : (ru ? 'Лендинг выключен' : 'Landing off')}
        </button>
        <a href={`/courses/${course.slug}`} target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm"><ExternalLink className="w-4 h-4 mr-1" />{ru ? 'Открыть' : 'Open'}</Button>
        </a>
        <Button variant="outline" size="sm" onClick={() => setShowPreview(v => !v)}>
          <Eye className="w-4 h-4 mr-1" />{ru ? 'Превью' : 'Preview'}
        </Button>
        <Button variant="gradient" onClick={() => save()} disabled={saving || !dirty}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {ru ? 'Сохранить' : 'Save'}{dirty ? ' •' : ''}
        </Button>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-5 items-start">
        {/* ─── Sections nav ─── */}
        <Card className="lg:sticky lg:top-4">
          <CardContent className="p-2">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === s.id
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                {s.emoji} {s.title}
              </button>
            ))}
            <button
              onClick={() => setActiveSection('program')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === 'program'
                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              📚 {ru ? 'Программа (результаты)' : 'Program (results)'}
            </button>
            <button
              onClick={() => setActiveSection('faq')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === 'faq'
                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              ❓ FAQ
            </button>
          </CardContent>
        </Card>

        {/* ─── Fields ─── */}
        <Card>
          <CardContent className="p-5 space-y-4">
            {active && (
              <>
                <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">{active.emoji} {active.title}</h2>
                {active.fields.map((f, i) => {
                  if (f.kind === 'divider') {
                    return <p key={i} className="pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">{f.label}</p>
                  }
                  if (f.kind === 'photo') {
                    const value = getAt(draft, f.path) as string | undefined
                    const key = f.path.join('.')
                    return (
                      <div key={key}>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{f.label}</label>
                        <div className="flex items-center gap-3">
                          {value ? (
                            <div className="relative group shrink-0">
                              <img src={value} alt="" className="w-20 h-20 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700" />
                              <button
                                onClick={() => setField(f.path, undefined)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-dashed border-zinc-300 dark:border-zinc-600 shrink-0" />
                          )}
                          <div className="flex-1 space-y-2 min-w-0">
                            <Input value={value || ''} onChange={e => setField(f.path, e.target.value || undefined)} placeholder="https://…" className="text-xs h-8" />
                            <Button variant="outline" size="sm" onClick={() => uploadPhoto(f.path)} disabled={uploadingPath === key} className="text-xs">
                              {uploadingPath === key ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                              {ru ? 'Загрузить' : 'Upload'}
                            </Button>
                          </div>
                        </div>
                        {f.hint && <p className="text-[11px] text-zinc-400 mt-1.5">{f.hint}</p>}
                      </div>
                    )
                  }
                  if (f.kind === 'string') {
                    const value = getAt(draft, f.path) as string | undefined
                    return (
                      <div key={f.path.join('.')}>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{f.label}</label>
                        <Input value={value || ''} onChange={e => setField(f.path, e.target.value || undefined)} placeholder={f.placeholder} className="text-sm h-9" />
                      </div>
                    )
                  }
                  if (f.kind === 'number') {
                    const value = getAt(draft, f.path) as number | undefined
                    return (
                      <div key={f.path.join('.')}>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{f.label}</label>
                        <Input type="number" value={value ?? ''} onChange={e => setField(f.path, e.target.value === '' ? undefined : +e.target.value)} min={f.min} max={f.max} className="text-sm h-9 w-28" />
                      </div>
                    )
                  }
                  // L — bilingual
                  const value = (getAt(draft, f.path) as L) || { en: '', ru: '' }
                  const key = f.path.join('.')
                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{f.label}</label>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {(['ru', 'en'] as const).map(lang => (
                          f.long ? (
                            <textarea
                              key={lang}
                              value={value[lang] || ''}
                              onChange={e => setField([...f.path, lang], e.target.value)}
                              placeholder={lang.toUpperCase()}
                              className="w-full h-20 p-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          ) : (
                            <Input
                              key={lang}
                              value={value[lang] || ''}
                              onChange={e => setField([...f.path, lang], e.target.value)}
                              placeholder={lang.toUpperCase()}
                              className="text-sm h-9"
                            />
                          )
                        ))}
                      </div>
                    </div>
                  )
                })}
              </>
            )}

            {/* ─── Программа: результаты по модулям ─── */}
            {activeSection === 'program' && (
              <>
                <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">📚 {ru ? 'Программа — «Результат» модулей' : 'Program — module results'}</h2>
                <p className="text-xs text-zinc-500 -mt-2">
                  {ru
                    ? 'Названия модулей и уроки берутся из курса автоматически. Здесь — только текст «РЕЗУЛЬТАТ:» каждого модуля, по строке на пункт. Привязано к модулю, перестановка модулей ничего не сломает.'
                    : 'Module titles and lessons come from the course automatically. Here you edit only each module’s RESULT bullets, one per line. Bound to the module id, so reordering is safe.'}
                </p>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{ru ? 'Сколько модулей показывать' : 'Modules to show'}</label>
                  <Input
                    type="number" min={1} max={12}
                    value={draft.program.maxModules ?? 5}
                    onChange={e => setField(['program', 'maxModules'], Math.max(1, +e.target.value || 5))}
                    className="text-sm h-9 w-28"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">{ru ? 'Служебные модули в конце (Bonus, References) отрезаются этим лимитом.' : 'Trailing service modules (Bonus, References) are cut by this limit.'}</p>
                </div>
                {modules.map((m: any, index: number) => {
                  const bullets = moduleBullets(m.id, index)
                  return (
                    <div key={m.id} className="border border-zinc-100 dark:border-zinc-800 rounded-xl p-4">
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                        {String(index + 1).padStart(2, '0')}. {ru ? (m.title_secondary || m.title) : m.title}
                        <span className="ml-2 text-xs font-normal text-zinc-400">({(m.course_lessons || []).length} {ru ? 'ур.' : 'lessons'})</span>
                      </p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <div>
                          <p className="text-[11px] text-zinc-400 mb-1">RU — {ru ? 'по строке на пункт' : 'one bullet per line'}</p>
                          <textarea
                            value={bullets.map(b => b.ru).join('\n')}
                            onChange={e => setModuleBullets(m.id, 'ru', e.target.value, index)}
                            className="w-full h-24 p-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                        <div>
                          <p className="text-[11px] text-zinc-400 mb-1">EN</p>
                          <textarea
                            value={bullets.map(b => b.en).join('\n')}
                            onChange={e => setModuleBullets(m.id, 'en', e.target.value, index)}
                            className="w-full h-24 p-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}

            {/* ─── FAQ ─── */}
            {activeSection === 'faq' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">❓ FAQ</h2>
                  <Button variant="outline" size="sm" onClick={addFaq}><Plus className="w-4 h-4 mr-1" />{ru ? 'Вопрос' : 'Add'}</Button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{ru ? 'Заголовок секции' : 'Section heading'}</label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {(['ru', 'en'] as const).map(lang => (
                      <Input key={lang} value={draft.faq.heading[lang] || ''} onChange={e => setField(['faq', 'heading', lang], e.target.value)} placeholder={lang.toUpperCase()} className="text-sm h-9" />
                    ))}
                  </div>
                </div>
                {faqItems.map((item, i) => (
                  <div key={i} className="border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{ru ? 'Вопрос' : 'Question'} {i + 1}</p>
                      <button onClick={() => removeFaq(i)} className="p-1 text-zinc-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {(['ru', 'en'] as const).map(lang => (
                        <Input key={lang} value={item.q[lang] || ''} onChange={e => setField(['faq', 'items', i, 'q', lang], e.target.value)} placeholder={`${ru ? 'Вопрос' : 'Question'} ${lang.toUpperCase()}`} className="text-sm h-9" />
                      ))}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {(['ru', 'en'] as const).map(lang => (
                        <textarea key={lang} value={item.a[lang] || ''} onChange={e => setField(['faq', 'items', i, 'a', lang], e.target.value)} placeholder={`${ru ? 'Ответ' : 'Answer'} ${lang.toUpperCase()}`} className="w-full h-16 p-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Live preview ─── */}
      {showPreview && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-teal-50 to-zinc-50 dark:from-teal-900/20 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
              <Eye className="w-3.5 h-3.5 text-teal-500" />
              <span className="text-[11px] font-bold text-teal-600 uppercase tracking-widest">{ru ? 'Превью' : 'Live preview'}</span>
              <div className="flex gap-1 ml-auto">
                {([['ru', 'RU'], ['en', 'EN']] as const).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setPreviewRu(v === 'ru')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${previewRu === (v === 'ru') ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-h-[75vh] overflow-y-auto">
              <div className="pointer-events-none">
                <CourseLanding
                  course={course}
                  landingData={draft}
                  ru={previewRu}
                  onBuy={() => {}}
                  buying={false}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
