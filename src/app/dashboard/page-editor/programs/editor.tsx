'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronDown, Database, Loader2, Plus, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuth, fetchWithAuthUpload } from '@/lib/api'
import { TextStyleEditor } from '../shared'
import type { DbProgram, ProgramAutoData, ProgramBgType, ProgramItem2, ProgramLayout, ProgramSectionData, ProgramSort, ProgramTitleVariant } from './types'
import { PROGRAM_GRADIENTS, defaultProgramAutoData, defaultProgramItems2 } from './defaults'
import { dbProgramsToItems } from './renderer'
import { ProgramItemEditor } from './item-editor'

/* ═══════════ SHARED SECTION SETTINGS ═══════════ */

function Panel({ id, title, open, onToggle, children }: {
  id: string; title: string; open: boolean; onToggle: (id: string) => void; children: React.ReactNode
}) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
      <button
        onClick={() => onToggle(id)}
        className={`w-full flex items-center justify-between p-3 text-xs font-semibold transition-colors ${
          open ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
        }`}
      >
        {title}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="p-3 space-y-3 border-t border-zinc-200 dark:border-zinc-700">{children}</div>}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" className="w-4 h-4 rounded accent-teal-500" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="text-xs text-zinc-600 dark:text-zinc-400">{label}</span>
    </label>
  )
}

function SectionSettings({ section, onChange, lang, openPanel, setOpenPanel }: {
  section: ProgramSectionData
  onChange: (s: ProgramSectionData) => void
  lang: 'en' | 'ru'
  openPanel: string
  setOpenPanel: (v: string) => void
}) {
  const ru = lang === 'ru'
  const [bgUploading, setBgUploading] = useState(false)
  const bgRef = useRef<HTMLInputElement>(null)
  const toggle = (id: string) => setOpenPanel(openPanel === id ? '' : id)

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBgUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('folder', 'sections')
      const res = await fetchWithAuthUpload('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      onChange({ ...section, bgImage: url, bgType: 'image' })
      toast.success(ru ? 'Фон загружен' : 'Background uploaded')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setBgUploading(false); if (bgRef.current) bgRef.current.value = ''
    }
  }

  return (
    <>
      {/* ─── Layout ─── */}
      <Panel id="layout" title={ru ? '📐 Макет' : '📐 Layout'} open={openPanel === 'layout'} onToggle={toggle}>
        <div className="grid grid-cols-3 gap-2">
          {([['grid', 'Columns', 'Колонки'], ['slider', 'Slider', 'Слайдер'], ['carousel', 'Carousel', 'Карусель']] as [ProgramLayout, string, string][]).map(([v, en, rus]) => (
            <button key={v} onClick={() => onChange({ ...section, layout: v })}
              className={`p-2.5 rounded-xl border-2 text-center transition-all ${section.layout === v ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-zinc-200 dark:border-zinc-700'}`}>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{ru ? rus : en}</span>
            </button>
          ))}
        </div>

        {section.layout === 'grid' && (
          <div>
            <label className="text-[11px] text-zinc-500 block mb-1">{ru ? 'Колонки' : 'Columns'}</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map(n => (
                <button key={n} onClick={() => onChange({ ...section, columns: n })}
                  className={`w-8 h-8 rounded-lg text-[11px] font-bold ${section.columns === n ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600'}`}>{n}</button>
              ))}
            </div>
          </div>
        )}

        {section.layout === 'slider' && (
          <>
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">{ru ? 'Карточек на экране' : 'Slides per view'}</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map(n => (
                  <button key={n} onClick={() => onChange({ ...section, slidesPerView: n })}
                    className={`w-8 h-8 rounded-lg text-[11px] font-bold ${section.slidesPerView === n ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600'}`}>{n}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <Toggle label={ru ? 'Стрелки' : 'Arrows'} checked={section.showArrows} onChange={v => onChange({ ...section, showArrows: v })} />
              <Toggle label={ru ? 'Точки' : 'Dots'} checked={section.showDots} onChange={v => onChange({ ...section, showDots: v })} />
            </div>
          </>
        )}

        {section.layout === 'carousel' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">{ru ? 'Круг за (сек)' : 'Loop (sec)'}</label>
                <Input type="number" value={section.carouselSpeed} onChange={e => onChange({ ...section, carouselSpeed: +e.target.value })} className="text-xs h-7" min={10} max={180} />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">{ru ? 'Ширина карточки' : 'Card width'}</label>
                <Input type="number" value={section.carouselCardWidth} onChange={e => onChange({ ...section, carouselCardWidth: +e.target.value })} className="text-xs h-7" min={220} max={520} />
              </div>
            </div>
            <p className="text-[10px] text-zinc-400">{ru ? 'Лента едет непрерывно и останавливается при наведении.' : 'The strip scrolls continuously and pauses on hover.'}</p>
          </>
        )}

        <div>
          <label className="text-[11px] text-zinc-500 block mb-1">{ru ? 'Отступ между карточками (px)' : 'Gap (px)'}</label>
          <Input type="number" value={section.gap} onChange={e => onChange({ ...section, gap: +e.target.value })} className="text-xs h-7 w-20" min={0} max={80} />
        </div>
      </Panel>

      {/* ─── Section header ─── */}
      <Panel id="header" title={ru ? '✏️ Заголовок секции' : '✏️ Section Header'} open={openPanel === 'header'} onToggle={toggle}>
        <div>
          <label className="text-[11px] text-zinc-500 block mb-1">{ru ? 'Вариант заголовка' : 'Title Variant'}</label>
          <div className="grid grid-cols-4 gap-1.5">
            {([['simple', 'Simple', 'Простой'], ['badge', 'Badge', 'Бейдж'], ['accent-line', 'Line', 'Линия'], ['gradient-text', 'Gradient', 'Градиент']] as [ProgramTitleVariant, string, string][]).map(([v, en, rus]) => (
              <button key={v} onClick={() => onChange({ ...section, titleVariant: v })}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-medium ${section.titleVariant === v ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
                {ru ? rus : en}
              </button>
            ))}
          </div>
        </div>
        {section.titleVariant === 'badge' && (
          <div className="grid grid-cols-2 gap-2">
            <Input value={section.sectionBadge} onChange={e => onChange({ ...section, sectionBadge: e.target.value })} placeholder="Badge EN" className="text-xs h-7" />
            <Input value={section.sectionBadgeRu} onChange={e => onChange({ ...section, sectionBadgeRu: e.target.value })} placeholder="Badge RU" className="text-xs h-7" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Input value={section.sectionTitle} onChange={e => onChange({ ...section, sectionTitle: e.target.value })} placeholder="Title EN" className="text-xs h-7" />
          <Input value={section.sectionTitleRu} onChange={e => onChange({ ...section, sectionTitleRu: e.target.value })} placeholder="Title RU" className="text-xs h-7" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input value={section.sectionSubtitle} onChange={e => onChange({ ...section, sectionSubtitle: e.target.value })} placeholder="Subtitle EN" className="text-xs h-7" />
          <Input value={section.sectionSubtitleRu} onChange={e => onChange({ ...section, sectionSubtitleRu: e.target.value })} placeholder="Subtitle RU" className="text-xs h-7" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <textarea value={section.sectionDescription} onChange={e => onChange({ ...section, sectionDescription: e.target.value })} placeholder="Description EN"
            className="w-full p-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-12 resize-none" />
          <textarea value={section.sectionDescriptionRu} onChange={e => onChange({ ...section, sectionDescriptionRu: e.target.value })} placeholder="Description RU"
            className="w-full p-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-12 resize-none" />
        </div>
      </Panel>

      {/* ─── Background ─── */}
      <Panel id="bg" title={ru ? '🎨 Фон секции' : '🎨 Section Background'} open={openPanel === 'bg'} onToggle={toggle}>
        <div className="flex gap-1.5 mb-2">
          {([['solid', 'Solid', 'Цвет'], ['gradient', 'Gradient', 'Градиент'], ['image', 'Image', 'Фото']] as [ProgramBgType, string, string][]).map(([v, en, rus]) => (
            <button key={v} onClick={() => onChange({ ...section, bgType: v })}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium ${section.bgType === v ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
              {ru ? rus : en}
            </button>
          ))}
        </div>
        {section.bgType === 'solid' && (
          <div className="flex gap-2 items-center">
            <input type="color" value={section.bgColor} onChange={e => onChange({ ...section, bgColor: e.target.value })} className="w-8 h-8 rounded border-0 cursor-pointer" />
            <Input value={section.bgColor} onChange={e => onChange({ ...section, bgColor: e.target.value })} className="text-xs h-7 flex-1" />
          </div>
        )}
        {section.bgType === 'gradient' && (
          <div className="space-y-2">
            <Input value={section.bgGradient} onChange={e => onChange({ ...section, bgGradient: e.target.value })} placeholder="linear-gradient(...)" className="text-xs h-7" />
            <div className="grid grid-cols-3 gap-1.5">
              {PROGRAM_GRADIENTS.map(g => (
                <button key={g} onClick={() => onChange({ ...section, bgGradient: g })} className="h-8 rounded-lg border-2 border-zinc-200" style={{ background: g }} />
              ))}
            </div>
          </div>
        )}
        {section.bgType === 'image' && (
          <div className="space-y-2">
            {section.bgImage ? (
              <div className="relative h-20 rounded-xl overflow-hidden group">
                <img src={section.bgImage} alt="" className="w-full h-full object-cover" />
                <button onClick={() => onChange({ ...section, bgImage: undefined })}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button onClick={() => bgRef.current?.click()} disabled={bgUploading}
                className="w-full h-16 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center text-zinc-400 hover:border-teal-400 gap-2">
                {bgUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /><span className="text-xs">{ru ? 'Загрузить фон' : 'Upload background'}</span></>}
              </button>
            )}
            <input ref={bgRef} type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
          </div>
        )}
      </Panel>

      {/* ─── Card style ─── */}
      <Panel id="card" title={ru ? '🃏 Стиль карточек' : '🃏 Card Style'} open={openPanel === 'card'} onToggle={toggle}>
        {([['cardBg', ru ? 'Фон карточки' : 'Card background'], ['cardBorder', ru ? 'Рамка' : 'Border'], ['textColor', ru ? 'Текст' : 'Text'], ['accentColor', ru ? 'Акцент' : 'Accent']] as [keyof ProgramSectionData, string][]).map(([key, label]) => {
          const raw = String(section[key] || '')
          // <input type="color"> only understands #rrggbb; the card border is
          // rgba(...) by default, so show a live swatch instead of mangling it.
          const isHex = /^#[0-9a-fA-F]{6}$/.test(raw)
          return (
            <div key={String(key)} className="flex gap-2 items-center">
              <span className="text-[11px] text-zinc-500 w-28 shrink-0">{label}</span>
              {isHex ? (
                <input type="color" value={raw} onChange={e => onChange({ ...section, [key]: e.target.value })} className="w-8 h-8 rounded border-0 cursor-pointer" />
              ) : (
                <span
                  title={ru ? 'Значение не hex — правится текстом' : 'Not a hex value — edit it as text'}
                  className="w-8 h-8 rounded border border-zinc-300 dark:border-zinc-600 shrink-0"
                  style={{ background: raw || 'transparent' }}
                />
              )}
              <Input value={raw} onChange={e => onChange({ ...section, [key]: e.target.value })} className="text-xs h-7 flex-1" />
            </div>
          )
        })}
      </Panel>

      {/* ─── What the card shows ─── */}
      <Panel id="elements" title={ru ? '👁 Что показывать в карточке' : '👁 Card Elements'} open={openPanel === 'elements'} onToggle={toggle}>
        <div className="grid grid-cols-2 gap-2">
          <Toggle label={ru ? 'Фото' : 'Image'} checked={section.showImage} onChange={v => onChange({ ...section, showImage: v })} />
          <Toggle label={ru ? 'Бейджи' : 'Badges'} checked={section.showBadges} onChange={v => onChange({ ...section, showBadges: v })} />
          <Toggle label={ru ? 'Мета (недели, цель)' : 'Meta pills'} checked={section.showMeta} onChange={v => onChange({ ...section, showMeta: v })} />
          <Toggle label={ru ? 'Список пунктов' : 'Features'} checked={section.showFeatures} onChange={v => onChange({ ...section, showFeatures: v })} />
          <Toggle label={ru ? 'Цена' : 'Price'} checked={section.showPrice} onChange={v => onChange({ ...section, showPrice: v })} />
          <Toggle label={ru ? 'Кнопка' : 'Button'} checked={section.showButton} onChange={v => onChange({ ...section, showButton: v })} />
        </div>
        {section.showFeatures && (
          <div>
            <label className="text-[11px] text-zinc-500 block mb-1">{ru ? 'Максимум пунктов (0 — скрыть список)' : 'Max features (0 hides the list)'}</label>
            <Input type="number" value={section.featuresLimit} onChange={e => onChange({ ...section, featuresLimit: +e.target.value })} className="text-xs h-7 w-20" min={0} max={10} />
          </div>
        )}
      </Panel>

      {/* ─── Text styles ─── */}
      <Panel id="text" title={ru ? '🔤 Стили текста' : '🔤 Text Styles'} open={openPanel === 'text'} onToggle={toggle}>
        <TextStyleEditor label={ru ? 'Заголовок секции' : 'Section title'} value={section.titleStyle} onChange={v => onChange({ ...section, titleStyle: v })} />
        <TextStyleEditor label={ru ? 'Подзаголовок' : 'Subtitle'} value={section.subtitleStyle} onChange={v => onChange({ ...section, subtitleStyle: v })} />
        <TextStyleEditor label={ru ? 'Бейдж' : 'Badge'} value={section.badgeStyle} onChange={v => onChange({ ...section, badgeStyle: v })} />
        <TextStyleEditor label={ru ? 'Название программы' : 'Program title'} value={section.cardTitleStyle} onChange={v => onChange({ ...section, cardTitleStyle: v })} />
        <TextStyleEditor label={ru ? 'Описание' : 'Description'} value={section.cardDescStyle} onChange={v => onChange({ ...section, cardDescStyle: v })} />
        <TextStyleEditor label={ru ? 'Цена' : 'Price'} value={section.priceStyle} onChange={v => onChange({ ...section, priceStyle: v })} />
      </Panel>
    </>
  )
}

/* ═══════════ AUTO BLOCK EDITOR ═══════════ */

const SORTS: [ProgramSort, string, string][] = [
  ['newest', 'Newest first', 'Сначала новые'],
  ['oldest', 'Oldest first', 'Сначала старые'],
  ['name', 'By name', 'По названию'],
  ['price_asc', 'Price ↑', 'Цена ↑'],
  ['price_desc', 'Price ↓', 'Цена ↓'],
  ['duration_asc', 'Duration ↑', 'Длительность ↑'],
  ['duration_desc', 'Duration ↓', 'Длительность ↓'],
]

export function ProgramsAutoEditor({ data, onChange, lang, programs, loadingPrograms }: {
  data: ProgramAutoData
  onChange: (d: ProgramAutoData) => void
  lang: 'en' | 'ru'
  programs: DbProgram[]
  loadingPrograms: boolean
}) {
  const ru = lang === 'ru'
  const [openPanel, setOpenPanel] = useState('source')
  const shown = data.limit > 0 ? Math.min(data.limit, programs.length) : programs.length

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          🏋️ {ru ? 'Программы (из базы)' : 'Programs (from database)'}
        </h3>

        <Panel id="source" title={ru ? '🗄 Что показывать' : '🗄 What to show'} open={openPanel === 'source'} onToggle={id => setOpenPanel(openPanel === id ? '' : id)}>
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/20">
            <Database className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-teal-700 dark:text-teal-300 leading-relaxed">
              {loadingPrograms
                ? (ru ? 'Загружаю программы…' : 'Loading programs…')
                : ru
                  ? `Секция сама подтягивает программы из базы: сейчас подходит ${programs.length}, покажется ${shown}. Скрытые и невидимые программы сюда не попадают.`
                  : `The section pulls programs from the database: ${programs.length} match, ${shown} will be shown. Hidden and invisible programs never appear here.`}
            </p>
          </div>

          <div>
            <label className="text-[11px] text-zinc-500 block mb-1">{ru ? 'Сколько показывать' : 'How many'}</label>
            <div className="flex gap-1.5">
              {[0, 3, 4, 6, 8].map(n => (
                <button key={n} onClick={() => onChange({ ...data, limit: n })}
                  className={`px-2.5 h-8 rounded-lg text-[11px] font-bold ${data.limit === n ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600'}`}>
                  {n === 0 ? (ru ? 'Все' : 'All') : n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-zinc-500 block mb-1">{ru ? 'Сортировка' : 'Sort'}</label>
            <select value={data.sort} onChange={e => onChange({ ...data, sort: e.target.value as ProgramSort })}
              className="w-full h-8 px-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800">
              {SORTS.map(([v, en, rus]) => <option key={v} value={v}>{ru ? rus : en}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-zinc-500 block mb-1">{ru ? 'Текст кнопки' : 'Button label'}</label>
            <div className="grid grid-cols-2 gap-2">
              <Input value={data.ctaText} onChange={e => onChange({ ...data, ctaText: e.target.value })} placeholder="View program" className="text-xs h-7" />
              <Input value={data.ctaTextRu} onChange={e => onChange({ ...data, ctaTextRu: e.target.value })} placeholder="Смотреть программу" className="text-xs h-7" />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">{ru ? 'Ссылка подставляется сама: /programs/{slug}' : 'The link is filled in automatically: /programs/{slug}'}</p>
          </div>
        </Panel>

        <SectionSettings
          section={data.section}
          onChange={s => onChange({ ...data, section: s })}
          lang={lang}
          openPanel={openPanel}
          setOpenPanel={setOpenPanel}
        />
      </CardContent>
    </Card>
  )
}

/* ═══════════ PRO BLOCK EDITOR ═══════════ */

export function ProgramsProEditor({ items, section, onChangeItems, onChangeSection, lang, programs }: {
  items: ProgramItem2[]
  section: ProgramSectionData
  onChangeItems: (items: ProgramItem2[]) => void
  onChangeSection: (section: ProgramSectionData) => void
  lang: 'en' | 'ru'
  programs: DbProgram[]
}) {
  const ru = lang === 'ru'
  const [openPanel, setOpenPanel] = useState('layout')
  const [expanded, setExpanded] = useState<string | null>(items[0]?.id || null)
  const [dragId, setDragId] = useState<string | null>(null)

  const add = () => {
    const n: ProgramItem2 = {
      ...defaultProgramItems2[0],
      id: `prog_${Date.now()}`,
      title: 'New Program',
      titleRu: 'Новая программа',
      description: '',
      descriptionRu: '',
      features: [],
      featuresRu: [],
      badge: '',
      badgeRu: '',
      popular: false,
      btn1: { ...defaultProgramItems2[0].btn1 },
      btn2: { ...defaultProgramItems2[0].btn2 },
    }
    onChangeItems([...items, n])
    setExpanded(n.id)
  }

  const importFromDb = () => {
    if (programs.length === 0) {
      toast.error(ru ? 'В базе нет подходящих программ' : 'No matching programs in the database')
      return
    }
    const imported = dbProgramsToItems(programs, defaultProgramAutoData())
    onChangeItems(imported)
    setExpanded(imported[0]?.id || null)
    toast.success(ru ? `Перенесено программ: ${imported.length}. Теперь тексты можно править вручную.` : `${imported.length} programs imported — the texts are yours to edit now.`)
  }

  const update = (id: string, item: ProgramItem2) => onChangeItems(items.map(i => i.id === id ? item : i))
  const remove = (id: string) => {
    if (items.length <= 1) return
    onChangeItems(items.filter(i => i.id !== id))
    if (expanded === id) setExpanded(items[0]?.id || null)
  }
  const duplicate = (id: string) => {
    const idx = items.findIndex(i => i.id === id)
    if (idx < 0) return
    const dup: ProgramItem2 = {
      ...items[idx],
      id: `prog_${Date.now()}`,
      title: items[idx].title + ' (copy)',
      titleRu: items[idx].titleRu + ' (копия)',
      popular: false,
    }
    const next = [...items]; next.splice(idx + 1, 0, dup)
    onChangeItems(next); setExpanded(dup.id)
  }
  const onDragOver = (e: React.DragEvent, tid: string) => {
    e.preventDefault()
    if (!dragId || dragId === tid) return
    const arr = [...items]
    const fi = arr.findIndex(i => i.id === dragId)
    const ti = arr.findIndex(i => i.id === tid)
    if (fi < 0 || ti < 0) return
    const [m] = arr.splice(fi, 1); arr.splice(ti, 0, m)
    onChangeItems(arr)
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          🏋️ {ru ? 'Программы Pro' : 'Programs Pro'}
        </h3>

        <SectionSettings section={section} onChange={onChangeSection} lang={lang} openPanel={openPanel} setOpenPanel={setOpenPanel} />

        {/* ─── Cards ─── */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            {ru ? `Карточки (${items.length})` : `Cards (${items.length})`}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={importFromDb} className="h-7 text-[11px]">
              <Database className="w-3 h-3 mr-1" />{ru ? 'Из базы' : 'From DB'}
            </Button>
            <Button variant="gradient" size="sm" onClick={add} className="h-7 text-[11px]">
              <Plus className="w-3 h-3 mr-1" />{ru ? 'Добавить' : 'Add'}
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-zinc-400 -mt-1">
          {ru ? '«Из базы» перенесёт текущие программы в карточки один раз — дальше тексты живут отдельно и правятся вручную.' : '"From DB" copies the current programs into cards once — after that the texts are independent and edited by hand.'}
        </p>

        <div className="space-y-2">
          {items.map(item => (
            <ProgramItemEditor
              key={item.id}
              item={item}
              expanded={expanded === item.id}
              lang={lang}
              onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
              onChange={next => update(item.id, next)}
              onRemove={() => remove(item.id)}
              onDuplicate={() => duplicate(item.id)}
              onDragStart={() => setDragId(item.id)}
              onDragOver={e => onDragOver(e, item.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/* ═══════════ SHARED: load programs for the editor ═══════════ */

export function useEditorPrograms(enabled: boolean) {
  const [programs, setPrograms] = useState<DbProgram[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    const load = () => {
      setLoading(true)
      fetchWithAuth('/api/programs')
        .then(res => res.ok ? res.json() : { programs: [] })
        .then(data => {
          if (cancelled) return
          // Same filter the server applies when it rebuilds the section
          const list: DbProgram[] = (data.programs || []).filter((p: any) => p.is_active !== false && !p.is_private)
          setPrograms(list)
        })
        .catch(() => { if (!cancelled) setPrograms([]) })
        .finally(() => { if (!cancelled) setLoading(false) })
    }

    load()

    // The catalogue is edited on another screen — pick changes up on return
    // instead of showing a stale preview until a full reload.
    const onFocus = () => { if (document.visibilityState === 'visible') load() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [enabled])

  return { programs, loading }
}
