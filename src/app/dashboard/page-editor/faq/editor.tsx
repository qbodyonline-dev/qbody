'use client'
import React, { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuthUpload } from '@/lib/api'
import { FaqItemEditor } from './item-editor'
import type { FaqSectionData, FaqItem, FaqLayout, FaqAnimation, FaqTitleVariant, FaqBgType } from './types'
import { TextStyleEditor } from '../shared'

const LAYOUTS: { value: FaqLayout; label: string; desc: string }[] = [
  { value: 'accordion', label: '▤ Accordion', desc: 'Toggle open/close' },
  { value: 'cards', label: '▦ Cards', desc: 'Grid of cards' },
  { value: 'twocol', label: '▥ Two Column', desc: 'Inline 2-col' },
  { value: 'sidebyside', label: '◧ Side-by-Side', desc: 'Title left, FAQ right' },
]
const ANIMATIONS: { value: FaqAnimation; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fade-up', label: 'Fade Up' },
  { value: 'slide-in', label: 'Slide In' },
  { value: 'scale-up', label: 'Scale Up' },
]
const TITLE_VARS: { value: FaqTitleVariant; label: string }[] = [
  { value: 'simple', label: 'Simple' },
  { value: 'badge', label: 'Badge' },
  { value: 'accent-line', label: 'Line' },
  { value: 'gradient-text', label: 'Gradient' },
]

interface Props {
  section: FaqSectionData
  onChangeSection: (s: FaqSectionData) => void
  lang: 'en' | 'ru'
}

export function FaqSectionEditor({ section: s, onChangeSection, lang }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({ layout: true })
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [bgUploading, setBgUploading] = useState(false)
  const bgRef = useRef<HTMLInputElement>(null)

  const upd = (key: keyof FaqSectionData, val: any) => onChangeSection({ ...s, [key]: val })
  const toggle = (k: string) => setOpen(p => ({ ...p, [k]: !p[k] }))

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBgUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('folder', 'sections')
      const res = await fetchWithAuthUpload('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      onChangeSection({ ...s, bgImage: url, bgType: 'image' })
      toast.success('Background uploaded!')
    } catch (err: any) { toast.error(err.message) }
    finally { setBgUploading(false); if (bgRef.current) bgRef.current.value = '' }
  }

  const addItem = () => {
    const ni: FaqItem = { id: 'fq' + Date.now(), question: 'New question', questionRu: 'Новый вопрос', answer: 'Answer here...', answerRu: 'Ответ здесь...', icon: '❓' }
    upd('items', [...s.items, ni])
    setExpandedItem(ni.id)
  }
  const updateItem = (id: string, item: FaqItem) => upd('items', s.items.map(it => it.id === id ? item : it))
  const deleteItem = (id: string) => upd('items', s.items.filter(it => it.id !== id))
  const duplicateItem = (id: string) => {
    const orig = s.items.find(it => it.id === id)
    if (!orig) return
    const ni = { ...orig, id: 'fq' + Date.now() }
    const idx = s.items.findIndex(it => it.id === id)
    const arr = [...s.items]; arr.splice(idx + 1, 0, ni)
    upd('items', arr)
  }

  const Acc = ({ k, label, children }: { k: string; label: string; children: React.ReactNode }) => (
    <Card>
      <div className="px-3 py-2 cursor-pointer select-none flex items-center justify-between bg-zinc-50 dark:bg-zinc-800 rounded-t-xl" onClick={() => toggle(k)}>
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{label}</span>
        <span className="text-zinc-400 text-xs">{open[k] ? '▲' : '▼'}</span>
      </div>
      {open[k] && <CardContent className="p-3 space-y-3">{children}</CardContent>}
    </Card>
  )

  return (
    <div className="space-y-3">
      {/* Layout */}
      <Acc k="layout" label="📐 Layout & Style">
        <div className="grid grid-cols-2 gap-1.5">
          {LAYOUTS.map(l => (
            <button key={l.value} onClick={() => upd('layout', l.value)}
              className={`py-2 rounded-lg text-center ${s.layout === l.value ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
              <div className="text-xs font-medium">{l.label}</div>
              <div className="text-[9px] opacity-60">{l.desc}</div>
            </button>
          ))}
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-1">Animation</label>
          <div className="flex gap-1">
            {ANIMATIONS.map(a => (
              <button key={a.value} onClick={() => upd('animation', a.value)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium ${s.animation === a.value ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'}`}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-1">Title Variant</label>
          <div className="flex gap-1">
            {TITLE_VARS.map(v => (
              <button key={v.value} onClick={() => upd('titleVariant', v.value)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium ${s.titleVariant === v.value ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'}`}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <input type="checkbox" checked={s.showNumbers} onChange={e => upd('showNumbers', e.target.checked)} className="rounded" /> Numbers
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <input type="checkbox" checked={s.showIcons} onChange={e => upd('showIcons', e.target.checked)} className="rounded" /> Icons
          </label>
        </div>
        {(s.layout === 'cards' || s.layout === 'twocol') && (
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Columns ({s.columns})</label>
            <input type="range" min="1" max="3" value={s.columns} onChange={e => upd('columns', +e.target.value)} className="w-full h-1.5 accent-teal-500" />
          </div>
        )}
        {(s.layout === 'accordion' || s.layout === 'sidebyside') && (
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Default open (-1 = none)</label>
            <Input type="number" value={s.defaultOpen} onChange={e => upd('defaultOpen', +e.target.value)} className="text-xs h-7 w-20" min={-1} max={s.items.length - 1} />
          </div>
        )}
      </Acc>

      {/* Header */}
      <Acc k="header" label="✏️ Section Header">
        <div className="grid grid-cols-2 gap-2">
          <Input value={s.badge} onChange={e => upd('badge', e.target.value)} placeholder="Badge EN" className="text-xs h-7" />
          <Input value={s.badgeRu} onChange={e => upd('badgeRu', e.target.value)} placeholder="Badge RU" className="text-xs h-7" />
        </div>
        <TextStyleEditor label="Badge" value={s.badgeStyle} onChange={v => upd('badgeStyle', v)} defaultColor={s.accentColor} />
        <div className="grid grid-cols-2 gap-2">
          <Input value={s.title} onChange={e => upd('title', e.target.value)} placeholder="Title EN" className="text-xs h-7" />
          <Input value={s.titleRu} onChange={e => upd('titleRu', e.target.value)} placeholder="Title RU" className="text-xs h-7" />
        </div>
        <TextStyleEditor label="Title" value={s.titleStyle} onChange={v => upd('titleStyle', v)} defaultColor={s.textColor} />
        <div className="grid grid-cols-2 gap-2">
          <Input value={s.subtitle} onChange={e => upd('subtitle', e.target.value)} placeholder="Subtitle EN" className="text-xs h-7" />
          <Input value={s.subtitleRu} onChange={e => upd('subtitleRu', e.target.value)} placeholder="Subtitle RU" className="text-xs h-7" />
        </div>
        <TextStyleEditor label="Subtitle" value={s.subtitleStyle} onChange={v => upd('subtitleStyle', v)} defaultColor={s.textColor} />
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 space-y-2">
          <span className="text-[10px] text-zinc-500 font-bold">Q&A Text</span>
          <TextStyleEditor label="Question" value={s.questionStyle} onChange={v => upd('questionStyle', v)} defaultColor={s.textColor} />
          <TextStyleEditor label="Answer" value={s.answerStyle} onChange={v => upd('answerStyle', v)} defaultColor={s.textColor} />
        </div>
      </Acc>

      {/* Background */}
      <Acc k="bg" label="🎨 Background & Colors">
        <div className="flex gap-1">
          {([['solid', '🎨 Solid'], ['gradient', '🌈 Gradient'], ['image', '🖼️ Image']] as [FaqBgType, string][]).map(([v, l]) => (
            <button key={v} onClick={() => upd('bgType', v)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium ${s.bgType === v ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'}`}>
              {l}
            </button>
          ))}
        </div>
        {s.bgType === 'solid' && (
          <div className="flex gap-2 items-center">
            <input type="color" value={s.bgColor} onChange={e => upd('bgColor', e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer" />
            <Input value={s.bgColor} onChange={e => upd('bgColor', e.target.value)} className="text-xs h-7 flex-1" />
          </div>
        )}
        {s.bgType === 'gradient' && (
          <Input value={s.bgGradient} onChange={e => upd('bgGradient', e.target.value)} placeholder="linear-gradient(...)" className="text-xs h-7" />
        )}
        {s.bgType === 'image' && (
          <div className="space-y-2">
            <Input value={s.bgImage || ''} onChange={e => upd('bgImage', e.target.value)} placeholder="URL" className="text-xs h-7" />
            <button onClick={() => bgRef.current?.click()} disabled={bgUploading}
              className="h-7 px-3 rounded-lg bg-zinc-600 hover:bg-zinc-700 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-50">
              {bgUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload BG
            </button>
            <input ref={bgRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          {([['textColor', 'Text'], ['accentColor', 'Accent'], ['cardBg', 'Card BG']] as const).map(([key, label]) => (
            <div key={key}>
              <label className="text-[10px] text-zinc-500 block mb-1">{label}</label>
              <div className="flex gap-1 items-center">
                <input type="color" value={(s as any)[key]} onChange={e => upd(key, e.target.value)} className="w-6 h-6 rounded border-0 cursor-pointer" />
                <Input value={(s as any)[key]} onChange={e => upd(key, e.target.value)} className="text-[10px] h-6 flex-1" />
              </div>
            </div>
          ))}
        </div>
      </Acc>

      {/* Items */}
      <Acc k="items" label={`📋 FAQ Items (${s.items.length})`}>
        <div className="space-y-2">
          {s.items.map((item, i) => (
            <FaqItemEditor
              key={item.id}
              item={item}
              index={i}
              onChange={ni => updateItem(item.id, ni)}
              onDelete={() => deleteItem(item.id)}
              onDuplicate={() => duplicateItem(item.id)}
              isExpanded={expandedItem === item.id}
              onToggle={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
              onDragStart={() => setDragIdx(i)}
              onDragOver={e => {
                e.preventDefault()
                if (dragIdx === null || dragIdx === i) return
                const arr = [...s.items]
                const [m] = arr.splice(dragIdx, 1)
                arr.splice(i, 0, m)
                upd('items', arr)
                setDragIdx(i)
              }}
              onDragEnd={() => setDragIdx(null)}
              isDragging={dragIdx === i}
            />
          ))}
        </div>
        <button onClick={addItem}
          className="w-full py-2 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 text-xs font-medium flex items-center justify-center gap-1.5 hover:border-teal-400 hover:text-teal-500 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Question
        </button>
      </Acc>
    </div>
  )
}
