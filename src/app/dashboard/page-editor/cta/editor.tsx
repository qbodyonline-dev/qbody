'use client'
import React, { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Upload, Loader2, Trash2, Image as ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuthUpload } from '@/lib/api'
import { CTA_GRADIENTS } from './defaults'
import type { CtaSectionData, CtaLayout, CtaAnimation, CtaBgType, CtaBtnStyle, CtaButton, CtaFeature } from './types'
import { TextStyleEditor } from '../shared'

const LAYOUTS: { value: CtaLayout; label: string; desc: string }[] = [
  { value: 'banner', label: '🎯 Banner', desc: 'Centered' },
  { value: 'split', label: '◧ Split', desc: 'Image + Text' },
  { value: 'minimal', label: '▭ Minimal', desc: 'Compact' },
  { value: 'fullwidth', label: '▬ Fullwidth', desc: 'BG Image' },
]
const ANIMATIONS: { value: CtaAnimation; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fade-up', label: 'Fade Up' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'slide-in', label: 'Slide In' },
]
const BTN_STYLES: { value: CtaBtnStyle; label: string }[] = [
  { value: 'solid-white', label: 'White' },
  { value: 'solid-dark', label: 'Dark' },
  { value: 'solid-accent', label: 'Accent' },
  { value: 'outline-white', label: 'Outline' },
  { value: 'outline-accent', label: 'Outline Acc' },
  { value: 'ghost', label: 'Ghost' },
]

/* ─── Button editor mini ─── */
function BtnEdit({ btn, onChange, label }: { btn: CtaButton; onChange: (b: CtaButton) => void; label: string }) {
  return (
    <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-2">
      <label className="text-[10px] font-medium text-zinc-500">{label}</label>
      <div className="grid grid-cols-2 gap-1.5">
        <Input value={btn.text} onChange={e => onChange({ ...btn, text: e.target.value })} placeholder="EN" className="text-xs h-7" />
        <Input value={btn.textRu} onChange={e => onChange({ ...btn, textRu: e.target.value })} placeholder="RU" className="text-xs h-7" />
      </div>
      <Input value={btn.link} onChange={e => onChange({ ...btn, link: e.target.value })} placeholder="/link" className="text-xs h-7" />
      <div className="flex gap-1 flex-wrap">
        {BTN_STYLES.map(s => (
          <button key={s.value} onClick={() => onChange({ ...btn, style: s.value })}
            className={`px-2 py-0.5 rounded text-[9px] font-medium ${btn.style === s.value ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'}`}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─── Feature editor ─── */
function FeatEdit({ features, onChange }: { features: CtaFeature[]; onChange: (f: CtaFeature[]) => void }) {
  return (
    <div className="space-y-1.5">
      {features.map((f, i) => (
        <div key={i} className="flex gap-1 items-center">
          <Input value={f.icon} onChange={e => { const n = [...features]; n[i] = { ...n[i], icon: e.target.value }; onChange(n) }}
            className="text-center text-xs h-6 w-10" maxLength={2} />
          <Input value={f.text} onChange={e => { const n = [...features]; n[i] = { ...n[i], text: e.target.value }; onChange(n) }}
            placeholder="EN" className="text-xs h-6 flex-1" />
          <Input value={f.textRu} onChange={e => { const n = [...features]; n[i] = { ...n[i], textRu: e.target.value }; onChange(n) }}
            placeholder="RU" className="text-xs h-6 flex-1" />
          <button onClick={() => onChange(features.filter((_, j) => j !== i))} className="p-0.5"><Trash2 className="w-3 h-3 text-red-400" /></button>
        </div>
      ))}
      <button onClick={() => onChange([...features, { icon: '✨', text: '', textRu: '' }])}
        className="text-[10px] text-teal-500 font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
    </div>
  )
}

/* ═══════════ MAIN EDITOR ═══════════ */
interface Props {
  section: CtaSectionData
  onChangeSection: (s: CtaSectionData) => void
  lang: 'en' | 'ru'
}

export function CtaSectionEditor({ section: s, onChangeSection, lang }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({ layout: true })
  const [imgUploading, setImgUploading] = useState(false)
  const [bgUploading, setBgUploading] = useState(false)
  const imgRef = useRef<HTMLInputElement>(null)
  const bgRef = useRef<HTMLInputElement>(null)

  const upd = (key: keyof CtaSectionData, val: any) => onChangeSection({ ...s, [key]: val })
  const toggle = (k: string) => setOpen(p => ({ ...p, [k]: !p[k] }))

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'bgImage') => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Select an image'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
    const setter = field === 'image' ? setImgUploading : setBgUploading
    setter(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('folder', 'cta')
      const res = await fetchWithAuthUpload('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      if (field === 'bgImage') onChangeSection({ ...s, bgImage: url, bgType: 'image' })
      else upd('image', url)
      toast.success('Uploaded!')
    } catch (err: any) { toast.error(err.message) }
    finally { setter(false); if (imgRef.current) imgRef.current.value = ''; if (bgRef.current) bgRef.current.value = '' }
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
      <Acc k="layout" label="📐 Layout & Animation">
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
        {(s.layout === 'split') && (
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Image Side</label>
            <div className="flex gap-1">
              {(['left', 'right'] as const).map(p => (
                <button key={p} onClick={() => upd('imagePosition', p)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${s.imagePosition === p ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'}`}>
                  {p === 'left' ? '◀ Left' : 'Right ▶'}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Border Radius</label>
            <Input type="number" value={s.borderRadius} onChange={e => upd('borderRadius', +e.target.value)} className="text-xs h-7" min={0} max={60} />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Padding Y</label>
            <Input type="number" value={s.paddingY} onChange={e => upd('paddingY', +e.target.value)} className="text-xs h-7" min={20} max={120} />
          </div>
        </div>
      </Acc>

      {/* Content */}
      <Acc k="content" label="✏️ Content">
        <div className="grid grid-cols-2 gap-2">
          <Input value={s.badge} onChange={e => upd('badge', e.target.value)} placeholder="Badge EN" className="text-xs h-7" />
          <Input value={s.badgeRu} onChange={e => upd('badgeRu', e.target.value)} placeholder="Badge RU" className="text-xs h-7" />
        </div>
        <TextStyleEditor label="Badge" value={s.badgeStyle} onChange={v => upd('badgeStyle', v)} defaultColor={s.textColor} />
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
        <div className="grid grid-cols-2 gap-2">
          <textarea value={s.description} onChange={e => upd('description', e.target.value)} placeholder="Description EN" className="w-full p-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-12 resize-none" />
          <textarea value={s.descriptionRu} onChange={e => upd('descriptionRu', e.target.value)} placeholder="Description RU" className="w-full p-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-12 resize-none" />
        </div>
        <TextStyleEditor label="Desc" value={s.descriptionStyle} onChange={v => upd('descriptionStyle', v)} defaultColor={s.textColor} />
      </Acc>

      {/* Buttons */}
      <Acc k="buttons" label="🔘 Buttons">
        <BtnEdit btn={s.btn1} onChange={b => upd('btn1', b)} label="Button 1 (Primary)" />
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <input type="checkbox" checked={s.showBtn2} onChange={e => upd('showBtn2', e.target.checked)} className="rounded" />
          Show Button 2
        </label>
        {s.showBtn2 && <BtnEdit btn={s.btn2} onChange={b => upd('btn2', b)} label="Button 2 (Secondary)" />}
      </Acc>

      {/* Features */}
      <Acc k="features" label="✅ Trust Signals">
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <input type="checkbox" checked={s.showFeatures} onChange={e => upd('showFeatures', e.target.checked)} className="rounded" />
          Show features
        </label>
        {s.showFeatures && <FeatEdit features={s.features} onChange={f => upd('features', f)} />}
      </Acc>

      {/* Image (split/fullwidth) */}
      {(s.layout === 'split' || s.layout === 'fullwidth') && (
        <Acc k="image" label="🖼️ Section Image">
          <div className="flex gap-2 items-center">
            {s.image && (
              <div className="w-16 h-16 rounded-lg overflow-hidden relative flex-shrink-0">
                <img src={s.image} alt="" className="w-full h-full object-cover" />
                <button onClick={() => upd('image', '')} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="w-2.5 h-2.5" /></button>
              </div>
            )}
            <div className="flex-1 space-y-1.5">
              <Input value={s.image} onChange={e => upd('image', e.target.value)} placeholder="URL" className="text-xs h-7" />
              <button onClick={() => imgRef.current?.click()} disabled={imgUploading}
                className="h-7 px-3 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-50">
                {imgUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload
              </button>
              <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, 'image')} />
            </div>
          </div>
        </Acc>
      )}

      {/* Background */}
      <Acc k="bg" label="🎨 Background">
        <div className="flex gap-1">
          {([['solid', '🎨 Solid'], ['gradient', '🌈 Gradient'], ['image', '🖼️ Image']] as [CtaBgType, string][]).map(([v, l]) => (
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
          <div className="space-y-2">
            <Input value={s.bgGradient} onChange={e => upd('bgGradient', e.target.value)} placeholder="linear-gradient(...)" className="text-xs h-7" />
            <div className="flex gap-1.5 flex-wrap">
              {CTA_GRADIENTS.map((g, i) => (
                <button key={i} onClick={() => upd('bgGradient', g)} title={g}
                  className={`w-7 h-7 rounded-lg border-2 ${s.bgGradient === g ? 'border-white' : 'border-transparent'}`} style={{ background: g }} />
              ))}
            </div>
          </div>
        )}
        {s.bgType === 'image' && (
          <div className="space-y-2">
            <Input value={s.bgImage || ''} onChange={e => upd('bgImage', e.target.value)} placeholder="URL" className="text-xs h-7" />
            <button onClick={() => bgRef.current?.click()} disabled={bgUploading}
              className="h-7 px-3 rounded-lg bg-zinc-600 hover:bg-zinc-700 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-50">
              {bgUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload BG
            </button>
            <input ref={bgRef} type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, 'bgImage')} />
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">Overlay: {Math.round(s.overlayOpacity * 100)}%</label>
              <input type="range" min="0" max="100" value={Math.round(s.overlayOpacity * 100)}
                onChange={e => upd('overlayOpacity', +e.target.value / 100)} className="w-full h-1.5 accent-teal-500" />
            </div>
          </div>
        )}
      </Acc>

      {/* Colors */}
      <Acc k="colors" label="🎨 Colors">
        <div className="grid grid-cols-2 gap-2">
          {([['textColor', 'Text'], ['accentColor', 'Accent']] as const).map(([key, label]) => (
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
