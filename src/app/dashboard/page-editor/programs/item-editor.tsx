'use client'
import React, { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { ChevronDown, ChevronUp, Copy, GripVertical, ImageIcon, Loader2, Plus, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuthUpload } from '@/lib/api'
import type { ProgramItem2 } from './types'
import { PROGRAM_GRADIENTS } from './defaults'

/* ═══════════ ONE PROGRAM CARD EDITOR (Pro block) ═══════════ */

interface Props {
  item: ProgramItem2
  expanded: boolean
  lang: 'en' | 'ru'
  onToggle: () => void
  onChange: (item: ProgramItem2) => void
  onRemove: () => void
  onDuplicate: () => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
}

function StringList({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  return (
    <div className="space-y-1.5">
      {values.map((v, i) => (
        <div key={i} className="flex gap-1.5">
          <Input
            value={v}
            onChange={e => { const next = [...values]; next[i] = e.target.value; onChange(next) }}
            placeholder={placeholder}
            className="text-xs h-7 flex-1"
          />
          <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="p-1.5 text-red-400 hover:text-red-600">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...values, ''])} className="text-[11px] text-teal-500 hover:text-teal-600 flex items-center gap-1">
        <Plus className="w-3 h-3" />{placeholder}
      </button>
    </div>
  )
}

export function ProgramItemEditor({ item, expanded, lang, onToggle, onChange, onRemove, onDuplicate, onDragStart, onDragOver }: Props) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const ru = lang === 'ru'
  const set = (patch: Partial<ProgramItem2>) => onChange({ ...item, ...patch })

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('folder', 'programs')
      const res = await fetchWithAuthUpload('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      set({ image: url })
      toast.success(ru ? 'Фото загружено' : 'Image uploaded')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-900"
    >
      <div className="flex items-center gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-800">
        <GripVertical className="w-3.5 h-3.5 text-zinc-400 cursor-grab shrink-0" />
        <span className="text-base shrink-0">{item.icon || '🏋️'}</span>
        <button onClick={onToggle} className="flex-1 text-left min-w-0">
          <span className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
            {(ru ? item.titleRu : item.title) || (ru ? 'Без названия' : 'Untitled')}
          </span>
        </button>
        <button onClick={onDuplicate} className="p-1 text-zinc-400 hover:text-teal-500" title={ru ? 'Дублировать' : 'Duplicate'}>
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button onClick={onRemove} className="p-1 text-zinc-400 hover:text-red-500" title={ru ? 'Удалить' : 'Delete'}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onToggle} className="p-1 text-zinc-400">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="p-3 space-y-3 border-t border-zinc-200 dark:border-zinc-700">
          {/* Texts */}
          <div className="grid grid-cols-2 gap-2">
            <Input value={item.title} onChange={e => set({ title: e.target.value })} placeholder="Title EN" className="text-xs h-7" />
            <Input value={item.titleRu} onChange={e => set({ titleRu: e.target.value })} placeholder="Title RU" className="text-xs h-7" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <textarea value={item.description} onChange={e => set({ description: e.target.value })} placeholder="Description EN"
              className="w-full p-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-14 resize-none" />
            <textarea value={item.descriptionRu} onChange={e => set({ descriptionRu: e.target.value })} placeholder="Description RU"
              className="w-full p-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-14 resize-none" />
          </div>

          {/* Image / gradient */}
          <div>
            <label className="text-[11px] text-zinc-500 block mb-1">{ru ? 'Фото карточки' : 'Card image'}</label>
            {item.image ? (
              <div className="relative h-20 rounded-xl overflow-hidden group">
                <img src={item.image} alt="" className="w-full h-full object-cover" />
                <button onClick={() => set({ image: undefined })}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full h-14 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center gap-2 text-zinc-400 hover:border-teal-400">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /><span className="text-xs">{ru ? 'Загрузить фото' : 'Upload image'}</span></>}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden" />
            <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />{ru ? 'Без фото используется градиент с эмодзи' : 'Without an image the gradient tile with the emoji is used'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input value={item.icon} onChange={e => set({ icon: e.target.value })} placeholder="🏋️" className="text-xs h-7" />
            <div className="grid grid-cols-6 gap-1">
              {PROGRAM_GRADIENTS.map(g => (
                <button key={g} onClick={() => set({ gradient: g })}
                  className={`h-7 rounded-md border-2 ${item.gradient === g ? 'border-teal-500' : 'border-transparent'}`} style={{ background: g }} />
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-2">
            <Input value={item.duration} onChange={e => set({ duration: e.target.value })} placeholder="8 weeks" className="text-xs h-7" />
            <Input value={item.durationRu} onChange={e => set({ durationRu: e.target.value })} placeholder="8 недель" className="text-xs h-7" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input value={item.goal} onChange={e => set({ goal: e.target.value })} placeholder="Goal EN" className="text-xs h-7" />
            <Input value={item.goalRu} onChange={e => set({ goalRu: e.target.value })} placeholder="Цель" className="text-xs h-7" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input value={item.difficulty} onChange={e => set({ difficulty: e.target.value })} placeholder="Level EN" className="text-xs h-7" />
            <Input value={item.difficultyRu} onChange={e => set({ difficultyRu: e.target.value })} placeholder="Уровень" className="text-xs h-7" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">{ru ? 'Тренировок' : 'Workouts'}</label>
              <Input type="number" value={item.workouts ?? ''} onChange={e => set({ workouts: e.target.value ? +e.target.value : undefined })} className="text-xs h-7" min={0} />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">{ru ? 'Цена ($)' : 'Price ($)'}</label>
              <Input type="number" step="0.01" value={item.price ? item.price / 100 : ''} onChange={e => set({ price: Math.round((+e.target.value || 0) * 100) })} className="text-xs h-7" min={0} />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">{ru ? 'Старая ($)' : 'Old ($)'}</label>
              <Input type="number" step="0.01" value={item.oldPrice ? item.oldPrice / 100 : ''} onChange={e => set({ oldPrice: e.target.value ? Math.round(+e.target.value * 100) : undefined })} className="text-xs h-7" min={0} />
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">Features EN</label>
              <StringList values={item.features} onChange={v => set({ features: v })} placeholder="Feature" />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">{ru ? 'Что входит' : 'Features RU'}</label>
              <StringList values={item.featuresRu} onChange={v => set({ featuresRu: v })} placeholder={ru ? 'Пункт' : 'Feature'} />
            </div>
          </div>

          {/* Button */}
          <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-2">
            <label className="text-[11px] text-zinc-500 block">{ru ? 'Кнопка' : 'Button'}</label>
            <div className="grid grid-cols-2 gap-2">
              <Input value={item.btn1.text} onChange={e => set({ btn1: { ...item.btn1, text: e.target.value } })} placeholder="Button EN" className="text-xs h-7" />
              <Input value={item.btn1.textRu} onChange={e => set({ btn1: { ...item.btn1, textRu: e.target.value } })} placeholder="Кнопка" className="text-xs h-7" />
            </div>
            <div className="flex gap-2">
              <Input value={item.btn1.link} onChange={e => set({ btn1: { ...item.btn1, link: e.target.value } })} placeholder="/programs/slug" className="text-xs h-7 flex-1" />
              <div className="flex gap-1">
                {(['primary', 'outline', 'ghost'] as const).map(st => (
                  <button key={st} onClick={() => set({ btn1: { ...item.btn1, style: st } })}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium ${item.btn1.style === st ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'}`}>
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="grid grid-cols-2 gap-2">
            <Input value={item.badge || ''} onChange={e => set({ badge: e.target.value })} placeholder="Badge EN" className="text-xs h-7" />
            <Input value={item.badgeRu || ''} onChange={e => set({ badgeRu: e.target.value })} placeholder="Бейдж" className="text-xs h-7" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded accent-teal-500" checked={!!item.popular} onChange={e => set({ popular: e.target.checked })} />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">{ru ? 'Отметить как популярную' : 'Mark as popular'}</span>
          </label>
        </div>
      )}
    </div>
  )
}
