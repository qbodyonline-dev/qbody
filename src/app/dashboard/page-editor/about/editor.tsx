'use client'
import React, { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Upload, Loader2, Image as ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuthUpload } from '@/lib/api'
import { AboutBlockEditor } from './item-editor'
import type { AboutSectionData, AboutContentBlock, AboutLayout, AboutAnimation, AboutTitleVariant, AboutBgType } from './types'

/* ═══════════ SECTION EDITOR ═══════════ */
interface Props {
  section: AboutSectionData
  onChangeSection: (s: AboutSectionData) => void
  lang: 'en' | 'ru'
}

const LAYOUTS: { value: AboutLayout; label: string; icon: string }[] = [
  { value: 'classic', label: 'Classic', icon: '◧' },
  { value: 'centered', label: 'Centered', icon: '◫' },
  { value: 'split', label: 'Split', icon: '▥' },
]
const ANIMATIONS: { value: AboutAnimation; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fade-up', label: 'Fade Up' },
  { value: 'slide-in', label: 'Slide In' },
  { value: 'scale-up', label: 'Scale Up' },
]
const TITLE_VARS: { value: AboutTitleVariant; label: string }[] = [
  { value: 'simple', label: 'Simple' },
  { value: 'badge', label: 'Badge' },
  { value: 'accent-line', label: 'Line' },
  { value: 'gradient-text', label: 'Gradient' },
]
const BG_TYPES: { value: AboutBgType; label: string }[] = [
  { value: 'solid', label: '🎨 Solid' },
  { value: 'gradient', label: '🌈 Gradient' },
  { value: 'image', label: '🖼️ Image' },
]

export function AboutSectionEditor({ section: s, onChangeSection, lang }: Props) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ layout: true })
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [bgUploading, setBgUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const bgRef = useRef<HTMLInputElement>(null)

  const upd = (key: keyof AboutSectionData, val: any) => onChangeSection({ ...s, [key]: val })
  const toggle = (k: string) => setOpenSections(p => ({ ...p, [k]: !p[k] }))

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Select an image'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('folder', 'about')
      const res = await fetchWithAuthUpload('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      upd('image', url)
      toast.success('Photo uploaded!')
    } catch (err: any) { toast.error(err.message) }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

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

  const addBlock = () => {
    const nb: AboutContentBlock = {
      id: 'b' + Date.now(),
      type: 'text',
      icon: '✨',
      title: 'New Block',
      titleRu: 'Новый блок',
      text: '',
      textRu: '',
      items: [],
      itemsRu: [],
      stats: [],
      ctaText: '',
      ctaTextRu: '',
      ctaLink: '',
      bgStyle: 'dark',
    }
    upd('blocks', [...s.blocks, nb])
    setExpandedBlock(nb.id)
  }

  const updateBlock = (id: string, b: AboutContentBlock) => {
    upd('blocks', s.blocks.map(bl => bl.id === id ? b : bl))
  }
  const deleteBlock = (id: string) => upd('blocks', s.blocks.filter(bl => bl.id !== id))
  const duplicateBlock = (id: string) => {
    const orig = s.blocks.find(bl => bl.id === id)
    if (!orig) return
    const nb = { ...orig, id: 'b' + Date.now() }
    const idx = s.blocks.findIndex(bl => bl.id === id)
    const arr = [...s.blocks]
    arr.splice(idx + 1, 0, nb)
    upd('blocks', arr)
  }

  const Acc = ({ k, label, children }: { k: string; label: string; children: React.ReactNode }) => (
    <Card>
      <div className="px-3 py-2 cursor-pointer select-none flex items-center justify-between bg-zinc-50 dark:bg-zinc-800 rounded-t-xl" onClick={() => toggle(k)}>
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{label}</span>
        <span className="text-zinc-400 text-xs">{openSections[k] ? '▲' : '▼'}</span>
      </div>
      {openSections[k] && <CardContent className="p-3 space-y-3">{children}</CardContent>}
    </Card>
  )

  return (
    <div className="space-y-3">
      {/* Layout & Animation */}
      <Acc k="layout" label="📐 Layout & Animation">
        <div>
          <label className="text-[10px] text-zinc-500 block mb-1">Layout</label>
          <div className="flex gap-1">
            {LAYOUTS.map(l => (
              <button key={l.value} onClick={() => upd('layout', l.value)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium text-center ${s.layout === l.value ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
                {l.icon} {l.label}
              </button>
            ))}
          </div>
        </div>
        {(s.layout === 'classic' || s.layout === 'split') && (
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Photo Position</label>
            <div className="flex gap-1">
              {(['left', 'right'] as const).map(p => (
                <button key={p} onClick={() => upd('imagePosition', p)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${s.imagePosition === p ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
                  {p === 'left' ? '◀ Left' : 'Right ▶'}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="text-[10px] text-zinc-500 block mb-1">Animation</label>
          <div className="flex gap-1">
            {ANIMATIONS.map(a => (
              <button key={a.value} onClick={() => upd('animation', a.value)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium ${s.animation === a.value ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
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
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium ${s.titleVariant === v.value ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </Acc>

      {/* Photo */}
      <Acc k="photo" label="📸 Photo & Info">
        <div className="flex gap-3 items-center">
          <div className="w-20 h-24 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex-shrink-0 relative">
            {s.image ? (
              <>
                <img src={s.image} alt="Photo" className="w-full h-full object-cover" />
                <button onClick={() => upd('image', '')} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"><X className="w-3 h-3" /></button>
              </>
            ) : <div className="w-full h-full flex items-center justify-center text-zinc-400"><ImageIcon className="w-6 h-6" /></div>}
          </div>
          <div className="flex-1 space-y-1.5">
            <Input value={s.image} onChange={e => upd('image', e.target.value)} placeholder="/images/photo.jpg" className="text-xs h-7" />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="h-7 px-3 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-50">
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {uploading ? '...' : 'Upload'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
        </div>
        <Input value={s.name} onChange={e => upd('name', e.target.value)} placeholder="Name" className="text-sm h-9" />
        <div className="grid grid-cols-2 gap-2">
          <Input value={s.sectionLabel} onChange={e => upd('sectionLabel', e.target.value)} placeholder="Label EN" className="text-xs h-7" />
          <Input value={s.sectionLabelRu} onChange={e => upd('sectionLabelRu', e.target.value)} placeholder="Label RU" className="text-xs h-7" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input value={s.tagline} onChange={e => upd('tagline', e.target.value)} placeholder="Tagline EN" className="text-xs h-7" />
          <Input value={s.taglineRu} onChange={e => upd('taglineRu', e.target.value)} placeholder="Tagline RU" className="text-xs h-7" />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-1">Tags EN (comma)</label>
          <Input value={s.tags.join(', ')} onChange={e => upd('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} className="text-xs h-7" />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-1">Tags RU (comma)</label>
          <Input value={s.tagsRu.join(', ')} onChange={e => upd('tagsRu', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} className="text-xs h-7" />
        </div>
      </Acc>

      {/* Background */}
      <Acc k="bg" label="🎨 Section Background">
        <div className="flex gap-1">
          {BG_TYPES.map(t => (
            <button key={t.value} onClick={() => upd('bgType', t.value)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium ${s.bgType === t.value ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
              {t.label}
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
              {bgUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              Upload BG
            </button>
            <input ref={bgRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
          </div>
        )}
      </Acc>

      {/* Colors */}
      <Acc k="colors" label="🎨 Colors">
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

      {/* Content Blocks */}
      <Acc k="blocks" label={`📋 Content Blocks (${s.blocks.length})`}>
        <div className="space-y-2">
          {s.blocks.map((b, i) => (
            <AboutBlockEditor
              key={b.id}
              block={b}
              onChange={nb => updateBlock(b.id, nb)}
              onDelete={() => deleteBlock(b.id)}
              onDuplicate={() => duplicateBlock(b.id)}
              isExpanded={expandedBlock === b.id}
              onToggle={() => setExpandedBlock(expandedBlock === b.id ? null : b.id)}
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => {
                e.preventDefault()
                if (dragIdx === null || dragIdx === i) return
                const arr = [...s.blocks]
                const [m] = arr.splice(dragIdx, 1)
                arr.splice(i, 0, m)
                upd('blocks', arr)
                setDragIdx(i)
              }}
              onDragEnd={() => setDragIdx(null)}
              isDragging={dragIdx === i}
              lang={lang}
            />
          ))}
        </div>
        <button onClick={addBlock}
          className="w-full py-2 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 text-xs font-medium flex items-center justify-center gap-1.5 hover:border-teal-400 hover:text-teal-500 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Block
        </button>
      </Acc>
    </div>
  )
}
