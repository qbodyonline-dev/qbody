'use client'
import React, { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, ChevronDown, Upload, Loader2, X, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuthUpload } from '@/lib/api'
import type { CourseItem2, CourseSectionData, CourseLayout, CourseTitleVariant, CourseBgType } from './types'
import { COURSE_GRADIENTS, defaultCourseItems2 } from './defaults'
import { TextStyleEditor } from '../shared'
import { CourseItemEditor2 } from './item-editor'

/* ═══════════ COURSES SECTION EDITOR ═══════════ */
interface Props {
  items: CourseItem2[]
  section: CourseSectionData
  onChangeItems: (items: CourseItem2[]) => void
  onChangeSection: (section: CourseSectionData) => void
  lang: 'en' | 'ru'
}

export function CoursesSectionEditor({ items, section, onChangeItems, onChangeSection, lang }: Props) {
  const [expanded, setExpanded] = useState<string | null>(items[0]?.id || null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [openPanel, setOpenPanel] = useState<string>('layout')
  const [bgUploading, setBgUploading] = useState(false)
  const bgRef = useRef<HTMLInputElement>(null)

  const toggle = (id: string) => setOpenPanel(openPanel === id ? '' : id)
  const S = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
      <button onClick={() => toggle(id)} className={`w-full flex items-center justify-between p-3 text-xs font-semibold transition-colors ${openPanel === id ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
        {title}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openPanel === id ? 'rotate-180' : ''}`} />
      </button>
      {openPanel === id && <div className="p-3 space-y-3 border-t border-zinc-200 dark:border-zinc-700">{children}</div>}
    </div>
  )

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBgUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('folder', 'sections')
      const res = await fetchWithAuthUpload('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      onChangeSection({ ...section, bgImage: url, bgType: 'image' })
      toast.success('Background uploaded!')
    } catch (err: any) { toast.error(err.message) }
    finally { setBgUploading(false); if (bgRef.current) bgRef.current.value = '' }
  }

  // Course list management
  const add = () => {
    const n: CourseItem2 = {
      ...defaultCourseItems2[0],
      id: `course_${Date.now()}`,
      title: 'New Course',
      titleRu: 'Новый курс',
      description: 'Description',
      descriptionRu: 'Описание',
      badge: '',
      badgeRu: '',
      popular: false,
    }
    onChangeItems([...items, n])
    setExpanded(n.id)
  }

  const update = (id: string, item: CourseItem2) => onChangeItems(items.map(i => i.id === id ? item : i))
  const remove = (id: string) => { if (items.length <= 1) return; onChangeItems(items.filter(i => i.id !== id)); if (expanded === id) setExpanded(items[0]?.id || null) }
  const duplicate = (id: string) => {
    const idx = items.findIndex(i => i.id === id); if (idx < 0) return
    const dup: CourseItem2 = { ...items[idx], id: `course_${Date.now()}`, title: items[idx].title + ' (copy)', titleRu: items[idx].titleRu + ' (копия)', popular: false }
    const next = [...items]; next.splice(idx + 1, 0, dup); onChangeItems(next); setExpanded(dup.id)
  }
  const onDragOver = (e: React.DragEvent, tid: string) => {
    e.preventDefault(); if (!dragId || dragId === tid) return
    const arr = [...items]; const fi = arr.findIndex(i => i.id === dragId); const ti = arr.findIndex(i => i.id === tid)
    if (fi < 0 || ti < 0) return; const [m] = arr.splice(fi, 1); arr.splice(ti, 0, m); onChangeItems(arr)
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          🎬 {lang === 'ru' ? 'Секция курсов' : 'Courses Section'}
        </h3>

        {/* ─── Layout ─── */}
        <S id="layout" title={lang === 'ru' ? '📐 Макет' : '📐 Layout'}>
          <div className="grid grid-cols-3 gap-2">
            {([['grid', 'Grid', 'Сетка'], ['list', 'List', 'Список'], ['slider', 'Slider', 'Слайдер']] as [CourseLayout, string, string][]).map(([v, en, ru]) => (
              <button key={v} onClick={() => onChangeSection({ ...section, layout: v })}
                className={`p-2.5 rounded-xl border-2 text-center transition-all ${section.layout === v ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-zinc-200 dark:border-zinc-700'}`}>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{lang === 'ru' ? ru : en}</span>
              </button>
            ))}
          </div>
          {section.layout === 'grid' && (
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">{lang === 'ru' ? 'Колонки' : 'Columns'}</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map(n => (
                  <button key={n} onClick={() => onChangeSection({ ...section, columns: n })}
                    className={`w-8 h-8 rounded-lg text-[11px] font-bold ${section.columns === n ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600'}`}>{n}</button>
                ))}
              </div>
            </div>
          )}
          {section.layout === 'slider' && (
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">{lang === 'ru' ? 'Слайдов на экране' : 'Slides per view'}</label>
              <div className="flex gap-1.5">
                {[1, 2, 3].map(n => (
                  <button key={n} onClick={() => onChangeSection({ ...section, slidesPerView: n })}
                    className={`w-8 h-8 rounded-lg text-[11px] font-bold ${section.slidesPerView === n ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600'}`}>{n}</button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="text-[11px] text-zinc-500 block mb-1">Gap (px)</label>
            <Input type="number" value={section.gap} onChange={e => onChangeSection({ ...section, gap: +e.target.value })} className="text-xs h-7 w-20" min={0} max={80} />
          </div>
        </S>

        {/* ─── Section Header ─── */}
        <S id="header" title={lang === 'ru' ? '✏️ Заголовок секции' : '✏️ Section Header'}>
          <div>
            <label className="text-[11px] text-zinc-500 block mb-1">{lang === 'ru' ? 'Вариант заголовка' : 'Title Variant'}</label>
            <div className="grid grid-cols-4 gap-1.5">
              {([['simple', 'Simple', 'Простой'], ['badge', 'Badge', 'Бейдж'], ['accent-line', 'Line', 'Линия'], ['gradient-text', 'Gradient', 'Градиент']] as [CourseTitleVariant, string, string][]).map(([v, en, ru]) => (
                <button key={v} onClick={() => onChangeSection({ ...section, titleVariant: v })}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-medium ${section.titleVariant === v ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
                  {lang === 'ru' ? ru : en}
                </button>
              ))}
            </div>
          </div>
          {section.titleVariant === 'badge' && (
            <div className="grid grid-cols-2 gap-2">
              <Input value={section.sectionBadge} onChange={e => onChangeSection({ ...section, sectionBadge: e.target.value })} placeholder="Badge EN" className="text-xs h-7" />
              <Input value={section.sectionBadgeRu} onChange={e => onChangeSection({ ...section, sectionBadgeRu: e.target.value })} placeholder="Badge RU" className="text-xs h-7" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Input value={section.sectionTitle} onChange={e => onChangeSection({ ...section, sectionTitle: e.target.value })} placeholder="Title EN" className="text-xs h-7" />
            <Input value={section.sectionTitleRu} onChange={e => onChangeSection({ ...section, sectionTitleRu: e.target.value })} placeholder="Title RU" className="text-xs h-7" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input value={section.sectionSubtitle} onChange={e => onChangeSection({ ...section, sectionSubtitle: e.target.value })} placeholder="Subtitle EN" className="text-xs h-7" />
            <Input value={section.sectionSubtitleRu} onChange={e => onChangeSection({ ...section, sectionSubtitleRu: e.target.value })} placeholder="Subtitle RU" className="text-xs h-7" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <textarea value={section.sectionDescription} onChange={e => onChangeSection({ ...section, sectionDescription: e.target.value })} placeholder="Description EN" className="w-full p-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-12 resize-none" />
            <textarea value={section.sectionDescriptionRu} onChange={e => onChangeSection({ ...section, sectionDescriptionRu: e.target.value })} placeholder="Description RU" className="w-full p-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-12 resize-none" />
          </div>
        </S>

        {/* ─── Background ─── */}
        <S id="bg" title={lang === 'ru' ? '🎨 Фон секции' : '🎨 Section Background'}>
          <div className="flex gap-1.5 mb-2">
            {([['solid', 'Solid', 'Цвет'], ['gradient', 'Gradient', 'Градиент'], ['image', 'Image', 'Фото']] as [CourseBgType, string, string][]).map(([v, en, ru]) => (
              <button key={v} onClick={() => onChangeSection({ ...section, bgType: v })}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium ${section.bgType === v ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
                {lang === 'ru' ? ru : en}
              </button>
            ))}
          </div>
          {section.bgType === 'solid' && (
            <div className="flex gap-2 items-center">
              <input type="color" value={section.bgColor} onChange={e => onChangeSection({ ...section, bgColor: e.target.value })} className="w-8 h-8 rounded border-0 cursor-pointer" />
              <Input value={section.bgColor} onChange={e => onChangeSection({ ...section, bgColor: e.target.value })} className="text-xs h-7 flex-1" />
            </div>
          )}
          {section.bgType === 'gradient' && (
            <div className="space-y-2">
              <Input value={section.bgGradient} onChange={e => onChangeSection({ ...section, bgGradient: e.target.value })} placeholder="linear-gradient(...)" className="text-xs h-7" />
              <div className="grid grid-cols-3 gap-1.5">
                {COURSE_GRADIENTS.slice(0, 6).map(g => (
                  <button key={g} onClick={() => onChangeSection({ ...section, bgGradient: g })} className="h-8 rounded-lg border-2 border-zinc-200" style={{ background: g }} />
                ))}
              </div>
            </div>
          )}
          {section.bgType === 'image' && (
            <div className="space-y-2">
              {section.bgImage ? (
                <div className="relative h-20 rounded-xl overflow-hidden group">
                  <img src={section.bgImage} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => onChangeSection({ ...section, bgImage: undefined })} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <button onClick={() => bgRef.current?.click()} disabled={bgUploading}
                  className="w-full h-16 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center text-zinc-400 hover:border-teal-400 gap-2">
                  {bgUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /><span className="text-xs">Upload background</span></>}
                </button>
              )}
              <input ref={bgRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
            </div>
          )}
        </S>

        {/* ─── Card Style ─── */}
        <S id="style" title={lang === 'ru' ? '🎨 Стиль карточек' : '🎨 Card Style'}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500">{lang === 'ru' ? 'Фон карточки' : 'Card BG'}</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={section.cardBg} onChange={e => onChangeSection({ ...section, cardBg: e.target.value })} className="w-7 h-7 rounded border-0 cursor-pointer" />
                <Input value={section.cardBg} onChange={e => onChangeSection({ ...section, cardBg: e.target.value })} className="text-xs h-7 flex-1" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500">{lang === 'ru' ? 'Акцент' : 'Accent'}</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={section.accentColor} onChange={e => onChangeSection({ ...section, accentColor: e.target.value })} className="w-7 h-7 rounded border-0 cursor-pointer" />
                <Input value={section.accentColor} onChange={e => onChangeSection({ ...section, accentColor: e.target.value })} className="text-xs h-7 flex-1" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500">{lang === 'ru' ? 'Текст' : 'Text'}</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={section.textColor} onChange={e => onChangeSection({ ...section, textColor: e.target.value })} className="w-7 h-7 rounded border-0 cursor-pointer" />
                <Input value={section.textColor} onChange={e => onChangeSection({ ...section, textColor: e.target.value })} className="text-xs h-7 flex-1" />
              </div>
            </div>
          </div>
        </S>

        {/* ─── Typography ─── */}
        <S id="typo" title={lang === 'ru' ? '✒️ Типография' : '✒️ Typography'}>
          <div className="space-y-1.5">
            <TextStyleEditor label="Title" value={section.titleStyle} onChange={v => onChangeSection({ ...section, titleStyle: v })} defaultColor={section.textColor} />
            <TextStyleEditor label="Subtitle" value={section.subtitleStyle} onChange={v => onChangeSection({ ...section, subtitleStyle: v })} defaultColor={section.accentColor} />
            <TextStyleEditor label="Badge" value={section.badgeStyle} onChange={v => onChangeSection({ ...section, badgeStyle: v })} defaultColor={section.accentColor} />
            <TextStyleEditor label="Card Title" value={section.courseTitleStyle} onChange={v => onChangeSection({ ...section, courseTitleStyle: v })} defaultColor={section.textColor} />
            <TextStyleEditor label="Card Desc" value={section.courseDescStyle} onChange={v => onChangeSection({ ...section, courseDescStyle: v })} defaultColor={section.textColor} />
            <TextStyleEditor label="Price" value={section.priceStyle} onChange={v => onChangeSection({ ...section, priceStyle: v })} defaultColor={section.textColor} />
          </div>
        </S>

        {/* ─── Course Items ─── */}
        <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">📋 {lang === 'ru' ? 'Курсы' : 'Courses'} ({items.length})</span>
            <Button variant="outline" size="sm" onClick={add} className="h-7 text-xs"><Plus className="w-3 h-3 mr-1" />{lang === 'ru' ? 'Добавить' : 'Add'}</Button>
          </div>
          <div className="p-2 space-y-2">
            {items.map(item => (
              <CourseItemEditor2 key={item.id} item={item} onChange={i => update(item.id, i)} onDelete={() => remove(item.id)} onDuplicate={() => duplicate(item.id)}
                lang={lang} isExpanded={expanded === item.id} onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
                onDragStart={() => setDragId(item.id)} onDragOver={e => onDragOver(e, item.id)} onDragEnd={() => setDragId(null)} isDragging={dragId === item.id} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
