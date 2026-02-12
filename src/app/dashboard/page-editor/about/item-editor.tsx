'use client'
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Copy, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import type { AboutContentBlock, AboutBlockType } from './types'

/* ═══════════ MINI LIST EDITOR ═══════════ */
function ListEditor({ items, onChange, label }: { items: string[]; onChange: (v: string[]) => void; label: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-zinc-500 flex items-center justify-between">
        {label}
        <button onClick={() => onChange([...items, ''])} className="text-teal-500"><Plus className="w-3 h-3" /></button>
      </label>
      {items.map((it, i) => (
        <div key={i} className="flex gap-1">
          <Input value={it} onChange={e => { const n = [...items]; n[i] = e.target.value; onChange(n) }} className="text-xs h-7 flex-1" />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="p-1 rounded hover:bg-red-50"><Trash2 className="w-3 h-3 text-red-400" /></button>
        </div>
      ))}
    </div>
  )
}

/* ═══════════ STAT EDITOR ═══════════ */
function StatEditor({ stats, onChange }: { stats: { value: string; label: string; labelRu: string }[]; onChange: (v: typeof stats) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] text-zinc-500 flex items-center justify-between">
        Stats
        <button onClick={() => onChange([...stats, { value: '', label: '', labelRu: '' }])} className="text-teal-500"><Plus className="w-3 h-3" /></button>
      </label>
      {stats.map((st, i) => (
        <div key={i} className="flex gap-1">
          <Input value={st.value} onChange={e => { const n = [...stats]; n[i] = { ...n[i], value: e.target.value }; onChange(n) }} className="text-xs h-6 w-16" placeholder="17+" />
          <Input value={st.label} onChange={e => { const n = [...stats]; n[i] = { ...n[i], label: e.target.value }; onChange(n) }} className="text-xs h-6 flex-1" placeholder="EN" />
          <Input value={st.labelRu} onChange={e => { const n = [...stats]; n[i] = { ...n[i], labelRu: e.target.value }; onChange(n) }} className="text-xs h-6 flex-1" placeholder="RU" />
          <button onClick={() => onChange(stats.filter((_, j) => j !== i))} className="p-0.5"><Trash2 className="w-3 h-3 text-red-400" /></button>
        </div>
      ))}
    </div>
  )
}

/* ═══════════ ABOUT BLOCK EDITOR ═══════════ */
interface Props {
  block: AboutContentBlock
  onChange: (b: AboutContentBlock) => void
  onDelete: () => void
  onDuplicate: () => void
  isExpanded: boolean
  onToggle: () => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnd: () => void
  isDragging: boolean
  lang: 'en' | 'ru'
}

const BLOCK_TYPES: { value: AboutBlockType; label: string }[] = [
  { value: 'text', label: '📝 Text' },
  { value: 'list', label: '📋 List' },
  { value: 'grid-list', label: '✅ Grid List' },
  { value: 'stats', label: '📊 Stats' },
  { value: 'cta', label: '🔘 CTA' },
]

const BG_STYLES = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'accent', label: 'Accent' },
  { value: 'transparent', label: 'Clear' },
] as const

export function AboutBlockEditor({ block: b, onChange, onDelete, onDuplicate, isExpanded, onToggle, onDragStart, onDragOver, onDragEnd, isDragging, lang }: Props) {
  const u = (key: keyof AboutContentBlock, val: any) => onChange({ ...b, [key]: val })
  const title = lang === 'ru' ? b.titleRu : b.title

  return (
    <div draggable onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}
      className={`border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 transition-all ${isDragging ? 'opacity-40' : ''}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 cursor-pointer select-none" onClick={onToggle}>
        <GripVertical className="w-3.5 h-3.5 text-zinc-300 cursor-grab flex-shrink-0" />
        <span className="text-sm">{b.icon}</span>
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex-1 truncate">{title || 'Block'}</span>
        <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">{b.type}</span>
        <div className="flex gap-0.5">
          <button onClick={e => { e.stopPropagation(); onDuplicate() }} className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"><Copy className="w-3 h-3 text-zinc-400" /></button>
          <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-1 rounded hover:bg-red-100"><Trash2 className="w-3 h-3 text-red-500" /></button>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Type + Icon + BG Style */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-[10px] text-zinc-500 block mb-1">Type</label>
              <div className="flex gap-1 flex-wrap">
                {BLOCK_TYPES.map(t => (
                  <button key={t.value} onClick={() => u('type', t.value)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium ${b.type === t.value ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">Icon</label>
              <Input value={b.icon} onChange={e => u('icon', e.target.value)} className="text-sm text-center h-8 w-12" maxLength={4} />
            </div>
          </div>

          {/* BG Style */}
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Style</label>
            <div className="flex gap-1">
              {BG_STYLES.map(s => (
                <button key={s.value} onClick={() => u('bgStyle', s.value)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium ${b.bgStyle === s.value ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="grid grid-cols-2 gap-2">
            <Input value={b.title} onChange={e => u('title', e.target.value)} placeholder="Title EN" className="text-xs h-7" />
            <Input value={b.titleRu} onChange={e => u('titleRu', e.target.value)} placeholder="Title RU" className="text-xs h-7" />
          </div>

          {/* Text (for text, stats, cta) */}
          {(b.type === 'text' || b.type === 'stats' || b.type === 'cta') && (
            <div className="grid grid-cols-2 gap-2">
              <textarea value={b.text} onChange={e => u('text', e.target.value)} placeholder="Text EN" className="w-full p-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-14 resize-none" />
              <textarea value={b.textRu} onChange={e => u('textRu', e.target.value)} placeholder="Text RU" className="w-full p-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-14 resize-none" />
            </div>
          )}

          {/* List items (for list, grid-list) */}
          {(b.type === 'list' || b.type === 'grid-list') && (
            <div className="grid grid-cols-2 gap-3">
              <ListEditor items={b.items} onChange={v => u('items', v)} label="Items EN" />
              <ListEditor items={b.itemsRu} onChange={v => u('itemsRu', v)} label="Items RU" />
            </div>
          )}

          {/* Stats (for stats) */}
          {b.type === 'stats' && (
            <StatEditor stats={b.stats} onChange={v => u('stats', v)} />
          )}

          {/* CTA (for stats, cta) */}
          {(b.type === 'stats' || b.type === 'cta') && (
            <div className="grid grid-cols-3 gap-2">
              <Input value={b.ctaText} onChange={e => u('ctaText', e.target.value)} placeholder="CTA EN" className="text-xs h-7" />
              <Input value={b.ctaTextRu} onChange={e => u('ctaTextRu', e.target.value)} placeholder="CTA RU" className="text-xs h-7" />
              <Input value={b.ctaLink} onChange={e => u('ctaLink', e.target.value)} placeholder="/link" className="text-xs h-7" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
