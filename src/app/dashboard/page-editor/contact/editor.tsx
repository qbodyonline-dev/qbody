'use client'
import React, { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuthUpload } from '@/lib/api'
import { ContactFieldEditor, ContactInfoEditor, ContactSocialEditor } from './item-editor'
import type { ContactSectionData, ContactField, ContactLayout, ContactAnimation, ContactTitleVariant, ContactBgType } from './types'
import { TextStyleEditor } from '../shared'

const LAYOUTS: { value: ContactLayout; label: string; desc: string }[] = [
  { value: 'classic', label: '▤ Classic', desc: 'Centered form' },
  { value: 'split', label: '◧ Split', desc: 'Info + Form' },
  { value: 'minimal', label: '▭ Minimal', desc: 'Email + Btn' },
  { value: 'infocards', label: '▦ Info Cards', desc: 'Cards + Form' },
]
const ANIMATIONS: { value: ContactAnimation; label: string }[] = [
  { value: 'none', label: 'None' }, { value: 'fade-up', label: 'Fade Up' },
  { value: 'slide-in', label: 'Slide In' }, { value: 'scale-up', label: 'Scale Up' },
]
const TITLE_VARS: { value: ContactTitleVariant; label: string }[] = [
  { value: 'simple', label: 'Simple' }, { value: 'badge', label: 'Badge' },
  { value: 'accent-line', label: 'Line' }, { value: 'gradient-text', label: 'Gradient' },
]

interface Props {
  section: ContactSectionData
  onChangeSection: (s: ContactSectionData) => void
  lang: 'en' | 'ru'
}

export function ContactSectionEditor({ section: s, onChangeSection, lang }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({ layout: true })
  const [expandedField, setExpandedField] = useState<string | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [bgUploading, setBgUploading] = useState(false)
  const bgRef = useRef<HTMLInputElement>(null)

  const upd = (key: keyof ContactSectionData, val: any) => onChangeSection({ ...s, [key]: val })
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
      toast.success('Uploaded!')
    } catch (err: any) { toast.error(err.message) }
    finally { setBgUploading(false); if (bgRef.current) bgRef.current.value = '' }
  }

  const addField = () => {
    const nf: ContactField = { id: 'cf' + Date.now(), type: 'text', label: 'New field', labelRu: 'Новое поле', placeholder: '', placeholderRu: '', required: false }
    upd('fields', [...s.fields, nf])
    setExpandedField(nf.id)
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
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium ${s.animation === a.value ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'}`}>{a.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-1">Title Variant</label>
          <div className="flex gap-1">
            {TITLE_VARS.map(v => (
              <button key={v.value} onClick={() => upd('titleVariant', v.value)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium ${s.titleVariant === v.value ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'}`}>{v.label}</button>
            ))}
          </div>
        </div>
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
          <TextStyleEditor label="Labels" value={s.labelStyle} onChange={v => upd('labelStyle', v)} defaultColor={s.textColor} />
          <TextStyleEditor label="Button" value={s.btnStyle} onChange={v => upd('btnStyle', v)} defaultColor="#ffffff" />
        </div>
      </Acc>

      {/* Form fields */}
      <Acc k="fields" label={`📝 Form Fields (${s.fields.length})`}>
        <div className="space-y-1.5">
          {s.fields.map((f, i) => (
            <ContactFieldEditor
              key={f.id}
              field={f}
              onChange={nf => upd('fields', s.fields.map(x => x.id === f.id ? nf : x))}
              onDelete={() => upd('fields', s.fields.filter(x => x.id !== f.id))}
              isExpanded={expandedField === f.id}
              onToggle={() => setExpandedField(expandedField === f.id ? null : f.id)}
              onDragStart={() => setDragIdx(i)}
              onDragOver={e => {
                e.preventDefault()
                if (dragIdx === null || dragIdx === i) return
                const arr = [...s.fields]; const [m] = arr.splice(dragIdx, 1); arr.splice(i, 0, m)
                upd('fields', arr); setDragIdx(i)
              }}
              onDragEnd={() => setDragIdx(null)}
              isDragging={dragIdx === i}
            />
          ))}
        </div>
        <button onClick={addField}
          className="w-full py-1.5 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 text-[10px] font-medium flex items-center justify-center gap-1 hover:border-teal-400 hover:text-teal-500">
          <Plus className="w-3 h-3" /> Add Field
        </button>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
          <Input value={s.btnText} onChange={e => upd('btnText', e.target.value)} placeholder="Button EN" className="text-xs h-7" />
          <Input value={s.btnTextRu} onChange={e => upd('btnTextRu', e.target.value)} placeholder="Button RU" className="text-xs h-7" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input value={s.successMsg} onChange={e => upd('successMsg', e.target.value)} placeholder="Success EN" className="text-xs h-7" />
          <Input value={s.successMsgRu} onChange={e => upd('successMsgRu', e.target.value)} placeholder="Success RU" className="text-xs h-7" />
        </div>
      </Acc>

      {/* Info items */}
      {(s.layout === 'split' || s.layout === 'infocards') && (
        <Acc k="info" label="📍 Contact Info">
          <ContactInfoEditor items={s.infoItems} onChange={v => upd('infoItems', v)} />
        </Acc>
      )}

      {/* Social */}
      <Acc k="social" label="🔗 Social Links">
        <label className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <input type="checkbox" checked={s.showSocial} onChange={e => upd('showSocial', e.target.checked)} className="rounded" /> Show social links
        </label>
        {s.showSocial && <ContactSocialEditor links={s.socialLinks} onChange={v => upd('socialLinks', v)} />}
      </Acc>

      {/* Background & Colors */}
      <Acc k="bg" label="🎨 Background & Colors">
        <div className="flex gap-1">
          {([['solid', '🎨 Solid'], ['gradient', '🌈 Gradient'], ['image', '🖼️ Image']] as [ContactBgType, string][]).map(([v, l]) => (
            <button key={v} onClick={() => upd('bgType', v)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium ${s.bgType === v ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'}`}>{l}</button>
          ))}
        </div>
        {s.bgType === 'solid' && (
          <div className="flex gap-2 items-center">
            <input type="color" value={s.bgColor} onChange={e => upd('bgColor', e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer" />
            <Input value={s.bgColor} onChange={e => upd('bgColor', e.target.value)} className="text-xs h-7 flex-1" />
          </div>
        )}
        {s.bgType === 'gradient' && <Input value={s.bgGradient} onChange={e => upd('bgGradient', e.target.value)} placeholder="linear-gradient(...)" className="text-xs h-7" />}
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
        <div className="grid grid-cols-2 gap-2">
          {([['textColor', 'Text'], ['accentColor', 'Accent'], ['cardBg', 'Card BG'], ['inputBg', 'Input BG']] as const).map(([key, label]) => (
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
    </div>
  )
}
