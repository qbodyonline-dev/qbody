'use client'
import React, { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Copy, GripVertical, ChevronDown, ChevronUp, X, Upload, Loader2, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuthUpload } from '@/lib/api'
import type { CourseItem2, CourseButton } from './types'
import { COURSE_GRADIENTS } from './defaults'

/* ═══════════ SHARED: Features Editor ═══════════ */
function FeaturesEditor({ features, onChange, lang }: { features: string[]; onChange: (f: string[]) => void; lang: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-zinc-500 flex items-center justify-between">
        Features ({lang.toUpperCase()})
        <button onClick={() => onChange([...features, ''])} className="text-teal-500 hover:text-teal-400"><Plus className="w-3 h-3" /></button>
      </label>
      {features.map((f, i) => (
        <div key={i} className="flex gap-1">
          <Input value={f} onChange={e => { const n = [...features]; n[i] = e.target.value; onChange(n) }} className="text-xs h-7 flex-1" placeholder={`Feature ${i + 1}`} />
          <button onClick={() => onChange(features.filter((_, j) => j !== i))} className="p-1 rounded hover:bg-red-50"><Trash2 className="w-3 h-3 text-red-400" /></button>
        </div>
      ))}
    </div>
  )
}

/* ═══════════ BUTTON EDITOR ═══════════ */
function BtnEditor({ btn, onChange, label, lang }: { btn: CourseButton; onChange: (b: CourseButton) => void; label: string; lang: string }) {
  return (
    <div className="space-y-1.5 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
      <label className="text-[10px] font-semibold text-zinc-500 uppercase">{label}</label>
      <div className="grid grid-cols-2 gap-1.5">
        <Input value={btn.text} onChange={e => onChange({ ...btn, text: e.target.value })} placeholder="EN" className="text-xs h-6" />
        <Input value={btn.textRu} onChange={e => onChange({ ...btn, textRu: e.target.value })} placeholder="RU" className="text-xs h-6" />
      </div>
      <Input value={btn.link} onChange={e => onChange({ ...btn, link: e.target.value })} placeholder="/courses/..." className="text-xs h-6" />
      <div className="flex gap-1">
        {(['primary', 'outline', 'ghost'] as const).map(s => (
          <button key={s} onClick={() => onChange({ ...btn, style: s })}
            className={`px-2 py-0.5 rounded text-[10px] font-medium ${btn.style === s ? 'bg-teal-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ═══════════ COURSE ITEM EDITOR ═══════════ */
interface CourseItemEditorProps {
  item: CourseItem2
  onChange: (item: CourseItem2) => void
  onDelete: () => void
  onDuplicate: () => void
  lang: 'en' | 'ru'
  isExpanded: boolean
  onToggle: () => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnd: () => void
  isDragging: boolean
}

export function CourseItemEditor2({
  item, onChange, onDelete, onDuplicate, lang, isExpanded, onToggle,
  onDragStart, onDragOver, onDragEnd, isDragging
}: CourseItemEditorProps) {
  const [showGradient, setShowGradient] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const u = (key: keyof CourseItem2, val: any) => onChange({ ...item, [key]: val })
  const title = lang === 'ru' ? item.titleRu : item.title

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Select an image'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'courses')
      const res = await fetchWithAuthUpload('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      u('image', url)
      toast.success('Image uploaded!')
    } catch (err: any) { toast.error(err.message || 'Upload error') }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  return (
    <div draggable onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}
      className={`border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 transition-all ${isDragging ? 'opacity-40' : ''}`}>
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 cursor-pointer select-none" onClick={onToggle}>
        <GripVertical className="w-4 h-4 text-zinc-300 cursor-grab flex-shrink-0" />
        {item.image ? (
          <img src={item.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: item.gradient }}>{item.icon}</div>
        )}
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex-1 truncate">{title || 'New course'}</span>
        {item.popular && <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-medium">★</span>}
        <span className="text-xs text-zinc-500">{item.currency || '$'}{item.price}</span>
        <div className="flex gap-0.5">
          <button onClick={e => { e.stopPropagation(); onDuplicate() }} className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"><Copy className="w-3.5 h-3.5 text-zinc-400" /></button>
          <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-1 rounded hover:bg-red-100"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Image + Icon/Gradient row */}
          <div className="flex gap-3 items-start">
            {/* Image upload */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-zinc-500 block">{lang === 'ru' ? 'Фото' : 'Image'}</label>
              {item.image ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden relative group">
                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => u('image', undefined)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex flex-col items-center justify-center text-zinc-400 hover:border-teal-400 hover:text-teal-500 transition-colors">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ImageIcon className="w-5 h-5" /><span className="text-[9px] mt-1">Upload</span></>}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>
            {/* Icon */}
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">{lang === 'ru' ? 'Иконка' : 'Icon'}</label>
              <Input value={item.icon} onChange={e => u('icon', e.target.value)} className="text-lg text-center h-10 w-14" maxLength={2} />
            </div>
            {/* Gradient */}
            <div className="relative">
              <label className="text-[11px] text-zinc-500 block mb-1">{lang === 'ru' ? 'Градиент' : 'Gradient'}</label>
              <button onClick={() => setShowGradient(!showGradient)} className="w-10 h-10 rounded-xl border-2 border-zinc-200 dark:border-zinc-600" style={{ background: item.gradient }} />
              {showGradient && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 p-2 grid grid-cols-3 gap-1.5">
                  {COURSE_GRADIENTS.map(g => (
                    <button key={g} onClick={() => { u('gradient', g); setShowGradient(false) }}
                      className={`w-9 h-9 rounded-lg border-2 ${item.gradient === g ? 'border-teal-500 scale-105' : 'border-zinc-200'}`}
                      style={{ background: g }} />
                  ))}
                </div>
              )}
            </div>
            {/* Badge + Popular */}
            <div className="flex-1 space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <Input value={item.badge || ''} onChange={e => u('badge', e.target.value)} placeholder="Badge EN" className="text-xs h-7" />
                <Input value={item.badgeRu || ''} onChange={e => u('badgeRu', e.target.value)} placeholder="Badge RU" className="text-xs h-7" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={item.popular || false} onChange={e => u('popular', e.target.checked)} className="rounded accent-teal-500" />
                <span className="text-[11px] text-zinc-500">{lang === 'ru' ? 'Популярный' : 'Popular'}</span>
              </label>
            </div>
          </div>

          {/* Titles */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">Title EN</label>
              <Input value={item.title} onChange={e => u('title', e.target.value)} className="text-xs h-8" />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">Title RU</label>
              <Input value={item.titleRu} onChange={e => u('titleRu', e.target.value)} className="text-xs h-8" />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">Description EN</label>
              <textarea value={item.description} onChange={e => u('description', e.target.value)} className="w-full p-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-14 resize-none" />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">Description RU</label>
              <textarea value={item.descriptionRu} onChange={e => u('descriptionRu', e.target.value)} className="w-full p-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-14 resize-none" />
            </div>
          </div>

          {/* Price / Duration / Lessons / Currency */}
          <div className="grid grid-cols-5 gap-2">
            <div><label className="text-[10px] text-zinc-500 block mb-1">Price</label><Input type="number" value={item.price} onChange={e => u('price', +e.target.value)} className="text-xs h-7" /></div>
            <div><label className="text-[10px] text-zinc-500 block mb-1">Old price</label><Input type="number" value={item.oldPrice || ''} onChange={e => u('oldPrice', e.target.value ? +e.target.value : undefined)} className="text-xs h-7" placeholder="—" /></div>
            <div><label className="text-[10px] text-zinc-500 block mb-1">Currency</label><Input value={item.currency} onChange={e => u('currency', e.target.value)} className="text-xs h-7" placeholder="$" /></div>
            <div><label className="text-[10px] text-zinc-500 block mb-1">Duration</label><Input value={item.duration} onChange={e => u('duration', e.target.value)} className="text-xs h-7" /></div>
            <div><label className="text-[10px] text-zinc-500 block mb-1">Lessons</label><Input type="number" value={item.lessons} onChange={e => u('lessons', +e.target.value)} className="text-xs h-7" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[10px] text-zinc-500 block mb-1">Duration RU</label><Input value={item.durationRu} onChange={e => u('durationRu', e.target.value)} className="text-xs h-7" placeholder="6 недель" /></div>
            <div />
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3">
            <FeaturesEditor features={item.features} onChange={f => u('features', f)} lang="en" />
            <FeaturesEditor features={item.featuresRu} onChange={f => u('featuresRu', f)} lang="ru" />
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <BtnEditor btn={item.btn1} onChange={b => u('btn1', b)} label="Button 1" lang={lang} />
            <BtnEditor btn={item.btn2} onChange={b => u('btn2', b)} label="Button 2" lang={lang} />
          </div>
        </div>
      )}
    </div>
  )
}
