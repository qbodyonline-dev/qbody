'use client'
import React from 'react'
import { Input } from '@/components/ui/input'
import { Trash2, Copy, GripVertical, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import type { ContactField, ContactFieldType, ContactInfoItem, ContactSocialLink } from './types'

const FIELD_TYPES: { value: ContactFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Select' },
]

/* ═══════════ FIELD EDITOR ═══════════ */
interface FieldProps {
  field: ContactField
  onChange: (f: ContactField) => void
  onDelete: () => void
  isExpanded: boolean
  onToggle: () => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnd: () => void
  isDragging: boolean
}

export function ContactFieldEditor({ field: f, onChange, onDelete, isExpanded, onToggle, onDragStart, onDragOver, onDragEnd, isDragging }: FieldProps) {
  const u = (key: keyof ContactField, val: any) => onChange({ ...f, [key]: val })

  return (
    <div draggable onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}
      className={`border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 ${isDragging ? 'opacity-40' : ''}`}>
      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 cursor-pointer select-none" onClick={onToggle}>
        <GripVertical className="w-3 h-3 text-zinc-300 cursor-grab" />
        <span className="text-[10px] text-teal-500 font-bold">{f.type}</span>
        <span className="text-xs text-zinc-600 dark:text-zinc-400 flex-1 truncate">{f.label}</span>
        {f.required && <span className="text-[9px] text-red-400">req</span>}
        <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-0.5 hover:bg-red-100 rounded"><Trash2 className="w-3 h-3 text-red-400" /></button>
        {isExpanded ? <ChevronUp className="w-3 h-3 text-zinc-400" /> : <ChevronDown className="w-3 h-3 text-zinc-400" />}
      </div>
      {isExpanded && (
        <div className="p-2.5 space-y-2">
          <div className="flex gap-1 flex-wrap">
            {FIELD_TYPES.map(t => (
              <button key={t.value} onClick={() => u('type', t.value)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium ${f.type === t.value ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Input value={f.label} onChange={e => u('label', e.target.value)} placeholder="Label EN" className="text-xs h-6" />
            <Input value={f.labelRu} onChange={e => u('labelRu', e.target.value)} placeholder="Label RU" className="text-xs h-6" />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Input value={f.placeholder} onChange={e => u('placeholder', e.target.value)} placeholder="Placeholder EN" className="text-xs h-6" />
            <Input value={f.placeholderRu} onChange={e => u('placeholderRu', e.target.value)} placeholder="Placeholder RU" className="text-xs h-6" />
          </div>
          {f.type === 'select' && (
            <div className="grid grid-cols-2 gap-1.5">
              <Input value={f.options || ''} onChange={e => u('options', e.target.value)} placeholder="Opt1,Opt2,Opt3" className="text-xs h-6" />
              <Input value={f.optionsRu || ''} onChange={e => u('optionsRu', e.target.value)} placeholder="Опт1,Опт2" className="text-xs h-6" />
            </div>
          )}
          <label className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <input type="checkbox" checked={f.required} onChange={e => u('required', e.target.checked)} className="rounded" /> Required
          </label>
        </div>
      )}
    </div>
  )
}

/* ═══════════ INFO ITEM EDITOR ═══════════ */
interface InfoProps {
  items: ContactInfoItem[]
  onChange: (items: ContactInfoItem[]) => void
}

export function ContactInfoEditor({ items, onChange }: InfoProps) {
  const add = () => onChange([...items, { id: 'ci' + Date.now(), icon: '📍', label: 'Label', labelRu: 'Лейбл', value: 'Value', valueRu: 'Значение', link: '' }])
  return (
    <div className="space-y-1.5">
      {items.map((it, i) => (
        <div key={it.id} className="flex gap-1 items-center">
          <Input value={it.icon} onChange={e => { const n = [...items]; n[i] = { ...n[i], icon: e.target.value }; onChange(n) }} className="text-sm text-center h-6 w-9" maxLength={2} />
          <Input value={it.label} onChange={e => { const n = [...items]; n[i] = { ...n[i], label: e.target.value }; onChange(n) }} placeholder="EN" className="text-[10px] h-6 flex-1" />
          <Input value={it.labelRu} onChange={e => { const n = [...items]; n[i] = { ...n[i], labelRu: e.target.value }; onChange(n) }} placeholder="RU" className="text-[10px] h-6 flex-1" />
          <Input value={it.value} onChange={e => { const n = [...items]; n[i] = { ...n[i], value: e.target.value }; onChange(n) }} placeholder="Value" className="text-[10px] h-6 flex-1" />
          <Input value={it.link || ''} onChange={e => { const n = [...items]; n[i] = { ...n[i], link: e.target.value }; onChange(n) }} placeholder="Link" className="text-[10px] h-6 w-20" />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="p-0.5"><Trash2 className="w-3 h-3 text-red-400" /></button>
        </div>
      ))}
      <button onClick={add} className="text-[10px] text-teal-500 font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
    </div>
  )
}

/* ═══════════ SOCIAL LINKS EDITOR ═══════════ */
interface SocialProps {
  links: ContactSocialLink[]
  onChange: (links: ContactSocialLink[]) => void
}

export function ContactSocialEditor({ links, onChange }: SocialProps) {
  const add = () => onChange([...links, { id: 'cs' + Date.now(), icon: '🔗', label: 'Link', url: 'https://' }])
  return (
    <div className="space-y-1.5">
      {links.map((sl, i) => (
        <div key={sl.id} className="flex gap-1 items-center">
          <Input value={sl.icon} onChange={e => { const n = [...links]; n[i] = { ...n[i], icon: e.target.value }; onChange(n) }} className="text-sm text-center h-6 w-9" maxLength={2} />
          <Input value={sl.label} onChange={e => { const n = [...links]; n[i] = { ...n[i], label: e.target.value }; onChange(n) }} placeholder="Label" className="text-xs h-6 w-20" />
          <Input value={sl.url} onChange={e => { const n = [...links]; n[i] = { ...n[i], url: e.target.value }; onChange(n) }} placeholder="URL" className="text-xs h-6 flex-1" />
          <button onClick={() => onChange(links.filter((_, j) => j !== i))} className="p-0.5"><Trash2 className="w-3 h-3 text-red-400" /></button>
        </div>
      ))}
      <button onClick={add} className="text-[10px] text-teal-500 font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
    </div>
  )
}
