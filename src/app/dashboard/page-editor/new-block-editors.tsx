'use client'
import React, { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp, X,
  Upload, ImageIcon, Loader2, Video, Eye, Copy,
  AlignLeft, AlignCenter, AlignRight, Maximize2, Type, Palette
} from 'lucide-react'
import { toast } from 'sonner'
import type {
  HtmlBlockData, SliderData, SliderSlide, SliderVariant,
  HeroTemplateData, HeroTemplateVariant, HeroTemplateButton, AnimationType
} from './types'
import { defaultSliderSlide } from './new-block-renderers'
import { fetchWithAuthUpload } from '@/lib/api'
import { TextStyleEditor } from './shared'
import type { TextStyle } from './shared'

/* ═══════════ SHARED UPLOAD HELPER ═══════════ */
async function uploadFile(file: File, folder: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)
  const res = await fetchWithAuthUpload('/api/upload', { method: 'POST', body: formData })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(err.error || 'Upload failed')
  }
  const data = await res.json()
  return data.url
}

/* ═══════════ SHARED: ANIMATION PICKER ═══════════ */
const ANIMATIONS: { value: AnimationType; label: string; labelRu: string }[] = [
  { value: 'none', label: 'None', labelRu: 'Нет' },
  { value: 'fadeIn', label: 'Fade In', labelRu: 'Плавное появление' },
  { value: 'slideUp', label: 'Slide Up', labelRu: 'Снизу вверх' },
  { value: 'slideDown', label: 'Slide Down', labelRu: 'Сверху вниз' },
  { value: 'slideLeft', label: 'Slide Left', labelRu: 'Справа' },
  { value: 'slideRight', label: 'Slide Right', labelRu: 'Слева' },
  { value: 'scaleIn', label: 'Scale In', labelRu: 'Масштаб' },
  { value: 'bounce', label: 'Bounce', labelRu: 'Прыжок' },
]

function AnimSelect({ value, onChange, lang }: { value: AnimationType; onChange: (v: AnimationType) => void; lang: string }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value as AnimationType)}
      className="w-full h-8 px-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-lg">
      {ANIMATIONS.map(a => <option key={a.value} value={a.value}>{lang === 'ru' ? a.labelRu : a.label}</option>)}
    </select>
  )
}

/* ═══════════ SHARED: IMAGE UPLOAD FIELD ═══════════ */
function ImageField({ value, onChange, folder, label, lang }: {
  value: string; onChange: (url: string) => void; folder: string; label: string; lang: string
}) {
  const [uploading, setUploading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return }
    setUploading(true)
    try { const url = await uploadFile(f, folder); onChange(url); toast.success('Uploaded!') }
    catch (err: any) { toast.error(err.message) }
    finally { setUploading(false); if (ref.current) ref.current.value = '' }
  }
  return (
    <div>
      <label className="text-xs text-zinc-500 block mb-1">{label}</label>
      <div className="flex gap-2">
        <Input value={value} onChange={e => onChange(e.target.value)} placeholder="URL or upload" className="text-xs h-8 flex-1" />
        <button onClick={() => ref.current?.click()} disabled={uploading}
          className="h-8 px-3 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-50">
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
        </button>
        {value && <button onClick={() => onChange('')} className="h-8 px-2 text-red-500 hover:bg-red-50 rounded-lg"><X className="w-3 h-3" /></button>}
      </div>
      <input ref={ref} type="file" accept="image/*,video/mp4" className="hidden" onChange={handleUpload} />
      {value && <div className="mt-2 h-20 rounded-lg overflow-hidden bg-zinc-800"><img src={value} className="h-full w-full object-cover" alt="" /></div>}
    </div>
  )
}

/* ═══════════ SHARED: BG PICKER ═══════════ */
const BG_GRADIENTS = [
  'linear-gradient(135deg,#0f766e,#18181b)', 'linear-gradient(135deg,#1e1b4b,#0f172a)',
  'linear-gradient(135deg,#7c2d12,#18181b)', 'linear-gradient(135deg,#581c87,#18181b)',
  'linear-gradient(135deg,#14b8a6,#06b6d4)', 'linear-gradient(135deg,#ec4899,#f43f5e)',
  'linear-gradient(135deg,#3b82f6,#8b5cf6)', 'linear-gradient(135deg,#22c55e,#14b8a6)',
  'linear-gradient(135deg,#f97316,#eab308)', 'linear-gradient(to right,#0f766e,#115e59,#134e4a,#18181b)',
]

function BgPicker({ bgType, bgColor, bgGradient, bgImage, bgVideo, overlayColor, overlayOpacity, onChange, lang, folder }: {
  bgType: string; bgColor: string; bgGradient: string; bgImage: string; bgVideo: string
  overlayColor: string; overlayOpacity: number
  onChange: (u: any) => void; lang: string; folder: string
}) {
  const ru = lang === 'ru'
  return (
    <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-3">
      <label className="text-xs font-medium text-zinc-500">{ru ? 'Фон' : 'Background'}</label>
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg p-0.5">
        {(['color', 'gradient', 'image', 'video'] as const).map(t => (
          <button key={t} onClick={() => onChange({ bgType: t })}
            className={`flex-1 px-2 py-1 text-[10px] font-medium rounded-md ${bgType === t ? 'bg-white dark:bg-zinc-600 shadow text-teal-600' : 'text-zinc-500'}`}>
            {t === 'color' ? (ru ? 'Цвет' : 'Color') : t === 'gradient' ? (ru ? 'Градиент' : 'Gradient') : t === 'image' ? (ru ? 'Фото' : 'Image') : (ru ? 'Видео' : 'Video')}
          </button>
        ))}
      </div>
      {bgType === 'color' && (
        <div className="flex gap-2 items-center">
          <input type="color" value={bgColor || '#09090b'} onChange={e => onChange({ bgColor: e.target.value })} className="w-8 h-8 rounded border-0 cursor-pointer" />
          <Input value={bgColor} onChange={e => onChange({ bgColor: e.target.value })} className="text-xs h-8 flex-1" placeholder="#09090b" />
        </div>
      )}
      {bgType === 'gradient' && (
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-1.5">
            {BG_GRADIENTS.map(g => (
              <button key={g} onClick={() => onChange({ bgGradient: g })}
                className={`h-8 rounded-lg border-2 ${bgGradient === g ? 'border-teal-500' : 'border-zinc-300 dark:border-zinc-600'}`}
                style={{ background: g }} />
            ))}
          </div>
          <Input value={bgGradient} onChange={e => onChange({ bgGradient: e.target.value })} className="text-xs h-8" placeholder="linear-gradient(...)" />
        </div>
      )}
      {bgType === 'image' && (
        <>
          <ImageField value={bgImage} onChange={url => onChange({ bgImage: url })} folder={folder} label={ru ? 'Фоновое изображение' : 'Background Image'} lang={lang} />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex gap-2 items-center">
              <label className="text-[10px] text-zinc-500 whitespace-nowrap">{ru ? 'Оверлей' : 'Overlay'}</label>
              <input type="color" value={overlayColor || '#000000'} onChange={e => onChange({ overlayColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-[10px] text-zinc-500">{ru ? 'Прозр.' : 'Opacity'}</label>
              <input type="range" min="0" max="1" step="0.05" value={overlayOpacity} onChange={e => onChange({ overlayOpacity: parseFloat(e.target.value) })} className="flex-1 h-1" />
              <span className="text-[10px] text-zinc-400 w-8">{Math.round(overlayOpacity * 100)}%</span>
            </div>
          </div>
        </>
      )}
      {bgType === 'video' && (
        <>
          <ImageField value={bgVideo} onChange={url => onChange({ bgVideo: url })} folder={folder} label={ru ? 'URL видео (MP4)' : 'Video URL (MP4)'} lang={lang} />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex gap-2 items-center">
              <label className="text-[10px] text-zinc-500">{ru ? 'Оверлей' : 'Overlay'}</label>
              <input type="color" value={overlayColor || '#000000'} onChange={e => onChange({ overlayColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-[10px] text-zinc-500">{ru ? 'Прозр.' : 'Opacity'}</label>
              <input type="range" min="0" max="1" step="0.05" value={overlayOpacity} onChange={e => onChange({ overlayOpacity: parseFloat(e.target.value) })} className="flex-1 h-1" />
              <span className="text-[10px] text-zinc-400 w-8">{Math.round(overlayOpacity * 100)}%</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ╔═══════════════════════════════════════════╗
   ║         HTML BLOCK EDITOR                ║
   ╚═══════════════════════════════════════════╝ */
interface HtmlBlockEditorProps { data: HtmlBlockData; onChange: (d: HtmlBlockData) => void; lang: 'en' | 'ru' }

export function HtmlBlockEditor({ data, onChange, lang }: HtmlBlockEditorProps) {
  const ru = lang === 'ru'
  const upd = (u: Partial<HtmlBlockData>) => onChange({ ...data, ...u })

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          <Type className="w-4 h-4 text-teal-500" /> {ru ? 'HTML Блок' : 'HTML Block'}
        </h3>

        {/* Content EN/RU */}
        <div className="space-y-2">
          <label className="text-xs text-zinc-500">{ru ? 'Контент EN' : 'Content EN'}</label>
          <textarea value={data.contentEn} onChange={e => upd({ contentEn: e.target.value })}
            className="w-full text-xs p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 font-mono resize-y" rows={6} />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-zinc-500">{ru ? 'Контент RU' : 'Content RU'}</label>
          <textarea value={data.contentRu} onChange={e => upd({ contentRu: e.target.value })}
            className="w-full text-xs p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 font-mono resize-y" rows={6} />
        </div>

        {/* Background */}
        <BgPicker bgType={data.bgType} bgColor={data.bgColor} bgGradient={data.bgGradient} bgImage={data.bgImage}
          bgVideo={data.bgVideo} overlayColor={data.overlayColor} overlayOpacity={data.overlayOpacity}
          onChange={u => upd(u)} lang={lang} folder="blocks" />

        {/* Layout & Style */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{ru ? 'Макет' : 'Layout'}</label>
            <select value={data.layout} onChange={e => upd({ layout: e.target.value as any })}
              className="w-full h-8 px-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-lg">
              <option value="full">{ru ? 'Во всю ширину' : 'Full Width'}</option>
              <option value="boxed">{ru ? 'В рамке (1200px)' : 'Boxed (1200px)'}</option>
              <option value="narrow">{ru ? 'Узкий (800px)' : 'Narrow (800px)'}</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{ru ? 'Выравнивание' : 'Text Align'}</label>
            <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg p-0.5 h-8">
              {(['left', 'center', 'right'] as const).map(a => (
                <button key={a} onClick={() => upd({ textAlign: a })}
                  className={`flex-1 flex items-center justify-center rounded-md ${data.textAlign === a ? 'bg-white dark:bg-zinc-600 shadow' : ''}`}>
                  {a === 'left' ? <AlignLeft className="w-3 h-3" /> : a === 'center' ? <AlignCenter className="w-3 h-3" /> : <AlignRight className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{ru ? 'Мин. высота' : 'Min Height'}</label>
            <Input value={data.minHeight} onChange={e => upd({ minHeight: e.target.value })} className="text-xs h-8" placeholder="auto" />
          </div>
        </div>

        {/* Padding */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{ru ? 'Отступ Y' : 'Padding Y'}</label>
            <Input value={data.paddingY} onChange={e => upd({ paddingY: e.target.value })} className="text-xs h-8" placeholder="60px" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{ru ? 'Отступ X' : 'Padding X'}</label>
            <Input value={data.paddingX} onChange={e => upd({ paddingX: e.target.value })} className="text-xs h-8" placeholder="20px" />
          </div>
        </div>

        {/* Animation */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{ru ? 'Анимация' : 'Animation'}</label>
            <AnimSelect value={data.animation} onChange={v => upd({ animation: v })} lang={lang} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{ru ? 'Задержка (мс)' : 'Delay (ms)'}</label>
            <Input type="number" value={data.animationDelay} onChange={e => upd({ animationDelay: parseInt(e.target.value) || 0 })} className="text-xs h-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ╔═══════════════════════════════════════════╗
   ║         SLIDER EDITOR                    ║
   ╚═══════════════════════════════════════════╝ */
const SLIDER_VARIANTS: { value: SliderVariant; label: string; labelRu: string; icon: string }[] = [
  { value: 'image', label: 'Image Carousel', labelRu: 'Карусель фото', icon: '🖼️' },
  { value: 'testimonial', label: 'Testimonials', labelRu: 'Отзывы', icon: '💬' },
  { value: 'content', label: 'Content Slider', labelRu: 'Контент-слайдер', icon: '📄' },
  { value: 'fullscreen', label: 'Fullscreen Hero', labelRu: 'Полноэкранный', icon: '🖥️' },
  { value: 'logo', label: 'Logo Carousel', labelRu: 'Логотипы', icon: '🏢' },
]

interface SliderEditorProps { data: SliderData; onChange: (d: SliderData) => void; lang: 'en' | 'ru' }

export function SliderEditor({ data, onChange, lang }: SliderEditorProps) {
  const ru = lang === 'ru'
  const [expandedSlide, setExpandedSlide] = useState<string | null>(data.slides[0]?.id || null)
  const upd = (u: Partial<SliderData>) => onChange({ ...data, ...u })

  const addSlide = () => {
    const s = defaultSliderSlide()
    upd({ slides: [...data.slides, s] })
    setExpandedSlide(s.id)
  }
  const removeSlide = (id: string) => upd({ slides: data.slides.filter(s => s.id !== id) })
  const updateSlide = (id: string, u: Partial<SliderSlide>) => upd({ slides: data.slides.map(s => s.id === id ? { ...s, ...u } : s) })
  const moveSlide = (id: string, dir: -1 | 1) => {
    const arr = [...data.slides]; const i = arr.findIndex(s => s.id === id); const n = i + dir
    if (n < 0 || n >= arr.length) return; [arr[i], arr[n]] = [arr[n], arr[i]]; upd({ slides: arr })
  }
  const dupSlide = (id: string) => {
    const orig = data.slides.find(s => s.id === id); if (!orig) return
    const copy = { ...orig, id: 'sl_' + Date.now() + Math.random().toString(36).slice(2, 6) }
    const i = data.slides.findIndex(s => s.id === id)
    const arr = [...data.slides]; arr.splice(i + 1, 0, copy); upd({ slides: arr })
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          <Palette className="w-4 h-4 text-teal-500" /> {ru ? 'Слайдер' : 'Slider'}
        </h3>

        {/* Variant picker */}
        <div className="space-y-2">
          <label className="text-xs text-zinc-500">{ru ? 'Тип слайдера' : 'Slider Type'}</label>
          <div className="grid grid-cols-5 gap-1.5">
            {SLIDER_VARIANTS.map(v => (
              <button key={v.value} onClick={() => upd({ variant: v.value })}
                className={`p-2 rounded-xl border text-center transition-all ${data.variant === v.value ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'}`}>
                <div className="text-lg mb-1">{v.icon}</div>
                <div className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300">{ru ? v.labelRu : v.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Section title */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{ru ? 'Заголовок EN' : 'Title EN'}</label>
            <Input value={data.titleEn} onChange={e => upd({ titleEn: e.target.value })} className="text-xs h-8" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{ru ? 'Заголовок RU' : 'Title RU'}</label>
            <Input value={data.titleRu} onChange={e => upd({ titleRu: e.target.value })} className="text-xs h-8" />
          </div>
        </div>

        {/* Settings */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-3">
          <label className="text-xs font-medium text-zinc-500">{ru ? 'Настройки' : 'Settings'}</label>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">{ru ? 'Высота' : 'Height'}</label>
              <Input value={data.height} onChange={e => upd({ height: e.target.value })} className="text-xs h-7" placeholder="500px" />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">{ru ? 'Слайдов' : 'Per View'}</label>
              <Input type="number" min={1} max={6} value={data.slidesPerView} onChange={e => upd({ slidesPerView: parseInt(e.target.value) || 1 })} className="text-xs h-7" />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">{ru ? 'Зазор' : 'Gap'}</label>
              <Input type="number" value={data.gap} onChange={e => upd({ gap: parseInt(e.target.value) || 0 })} className="text-xs h-7" />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">{ru ? 'Интервал' : 'Interval'}</label>
              <Input type="number" step={500} value={data.autoplayInterval} onChange={e => upd({ autoplayInterval: parseInt(e.target.value) || 4000 })} className="text-xs h-7" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'autoplay', label: ru ? 'Автоплей' : 'Autoplay' },
              { key: 'showArrows', label: ru ? 'Стрелки' : 'Arrows' },
              { key: 'showDots', label: ru ? 'Точки' : 'Dots' },
              { key: 'loop', label: ru ? 'Цикл' : 'Loop' },
              { key: 'pauseOnHover', label: ru ? 'Пауза при наведении' : 'Pause on Hover' },
            ].map(opt => (
              <label key={opt.key} className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                <input type="checkbox" checked={(data as any)[opt.key]} onChange={e => upd({ [opt.key]: e.target.checked } as any)}
                  className="rounded border-zinc-300" />
                {opt.label}
              </label>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-[10px] text-zinc-500">{ru ? 'Фон секции' : 'Section BG'}</label>
            <input type="color" value={data.bgColor || '#09090b'} onChange={e => upd({ bgColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
            <Input value={data.bgColor} onChange={e => upd({ bgColor: e.target.value })} className="text-xs h-7 w-24" />
          </div>
        </div>

        {/* Slides */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-500">{ru ? 'Слайды' : 'Slides'} ({data.slides.length})</label>
            <button onClick={addSlide} className="text-xs text-teal-500 hover:text-teal-400 flex items-center gap-1"><Plus className="w-3 h-3" /> {ru ? 'Добавить' : 'Add'}</button>
          </div>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {data.slides.map((slide, idx) => (
              <SlideEditor key={slide.id} slide={slide} index={idx} variant={data.variant}
                isExpanded={expandedSlide === slide.id} onToggle={() => setExpandedSlide(expandedSlide === slide.id ? null : slide.id)}
                onChange={u => updateSlide(slide.id, u)} onDelete={() => removeSlide(slide.id)}
                onMove={dir => moveSlide(slide.id, dir)} onDup={() => dupSlide(slide.id)} lang={lang} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* Single Slide Editor */
function SlideEditor({ slide, index, variant, isExpanded, onToggle, onChange, onDelete, onMove, onDup, lang }: {
  slide: SliderSlide; index: number; variant: SliderVariant; isExpanded: boolean; onToggle: () => void
  onChange: (u: Partial<SliderSlide>) => void; onDelete: () => void; onMove: (d: -1 | 1) => void; onDup: () => void; lang: string
}) {
  const ru = lang === 'ru'
  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 cursor-pointer" onClick={onToggle}>
        <GripVertical className="w-3 h-3 text-zinc-400" />
        {slide.image && <img src={slide.image} className="w-6 h-6 rounded object-cover" alt="" />}
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex-1 truncate">#{index + 1}: {ru ? slide.titleRu : slide.title || 'Untitled'}</span>
        <div className="flex gap-0.5">
          <button onClick={e => { e.stopPropagation(); onMove(-1) }} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"><ChevronUp className="w-3 h-3" /></button>
          <button onClick={e => { e.stopPropagation(); onMove(1) }} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"><ChevronDown className="w-3 h-3" /></button>
          <button onClick={e => { e.stopPropagation(); onDup() }} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"><Copy className="w-3 h-3" /></button>
          <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-1 hover:bg-red-100 text-red-500 rounded"><Trash2 className="w-3 h-3" /></button>
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </div>
      </div>
      {isExpanded && (
        <div className="p-3 space-y-3">
          <ImageField value={slide.image} onChange={url => onChange({ image: url })} folder="slides" label={ru ? 'Изображение' : 'Image'} lang={lang} />
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[10px] text-zinc-500 block mb-0.5">Title EN</label>
              <Input value={slide.title} onChange={e => onChange({ title: e.target.value })} className="text-xs h-7" /></div>
            <div><label className="text-[10px] text-zinc-500 block mb-0.5">Title RU</label>
              <Input value={slide.titleRu} onChange={e => onChange({ titleRu: e.target.value })} className="text-xs h-7" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[10px] text-zinc-500 block mb-0.5">Description EN</label>
              <textarea value={slide.description} onChange={e => onChange({ description: e.target.value })} className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 resize-none" rows={2} /></div>
            <div><label className="text-[10px] text-zinc-500 block mb-0.5">Description RU</label>
              <textarea value={slide.descriptionRu} onChange={e => onChange({ descriptionRu: e.target.value })} className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 resize-none" rows={2} /></div>
          </div>
          {variant !== 'logo' && (
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[10px] text-zinc-500 block mb-0.5">Button EN</label>
                <Input value={slide.buttonText} onChange={e => onChange({ buttonText: e.target.value })} className="text-xs h-7" /></div>
              <div><label className="text-[10px] text-zinc-500 block mb-0.5">Button RU</label>
                <Input value={slide.buttonTextRu} onChange={e => onChange({ buttonTextRu: e.target.value })} className="text-xs h-7" /></div>
            </div>
          )}
          {variant !== 'logo' && (
            <div><label className="text-[10px] text-zinc-500 block mb-0.5">{ru ? 'Ссылка кнопки' : 'Button Link'}</label>
              <Input value={slide.buttonLink} onChange={e => onChange({ buttonLink: e.target.value })} className="text-xs h-7" placeholder="#" /></div>
          )}
          {variant === 'testimonial' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] text-zinc-500 block mb-0.5">{ru ? 'Автор' : 'Author'}</label>
                  <Input value={slide.author} onChange={e => onChange({ author: e.target.value })} className="text-xs h-7" /></div>
                <div><label className="text-[10px] text-zinc-500 block mb-0.5">{ru ? 'Должность' : 'Role'}</label>
                  <Input value={slide.authorRole} onChange={e => onChange({ authorRole: e.target.value })} className="text-xs h-7" /></div>
              </div>
              <div><label className="text-[10px] text-zinc-500 block mb-0.5">{ru ? 'Рейтинг' : 'Rating'}</label>
                <div className="flex gap-1">{[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => onChange({ rating: n })} className={`text-lg ${n <= slide.rating ? 'text-yellow-400' : 'text-zinc-600'}`}>⭐</button>
                ))}</div></div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ╔═══════════════════════════════════════════╗
   ║         HERO TEMPLATE EDITOR             ║
   ╚═══════════════════════════════════════════╝ */
const HERO_VARIANTS: { value: HeroTemplateVariant; label: string; labelRu: string; icon: string }[] = [
  { value: 'centered', label: 'Centered Text', labelRu: 'По центру', icon: '🎯' },
  { value: 'split', label: 'Split (Text + Image)', labelRu: 'Две колонки', icon: '📐' },
  { value: 'videobg', label: 'Video Background', labelRu: 'Видео-фон', icon: '🎬' },
  { value: 'fullimage', label: 'Full Image BG', labelRu: 'Фото-фон', icon: '🖼️' },
  { value: 'minimal', label: 'Minimal Left', labelRu: 'Минимал слева', icon: '✨' },
]

interface HeroTemplateEditorProps { data: HeroTemplateData; onChange: (d: HeroTemplateData) => void; lang: 'en' | 'ru' }

export function HeroTemplateEditor({ data, onChange, lang }: HeroTemplateEditorProps) {
  const ru = lang === 'ru'
  const upd = (u: Partial<HeroTemplateData>) => onChange({ ...data, ...u })

  const addButton = () => upd({ buttons: [...data.buttons, { text: 'Button', textRu: 'Кнопка', link: '#', variant: 'outline' }] })
  const removeButton = (i: number) => upd({ buttons: data.buttons.filter((_, idx) => idx !== i) })
  const updateButton = (i: number, u: Partial<HeroTemplateButton>) => {
    const btns = [...data.buttons]; btns[i] = { ...btns[i], ...u }; upd({ buttons: btns })
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-teal-500" /> {ru ? 'Hero блок' : 'Hero Block'}
        </h3>

        {/* Variant */}
        <div className="space-y-2">
          <label className="text-xs text-zinc-500">{ru ? 'Шаблон' : 'Template'}</label>
          <div className="grid grid-cols-5 gap-1.5">
            {HERO_VARIANTS.map(v => (
              <button key={v.value} onClick={() => upd({ variant: v.value })}
                className={`p-2 rounded-xl border text-center transition-all ${data.variant === v.value ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-zinc-200 dark:border-zinc-700'}`}>
                <div className="text-lg mb-1">{v.icon}</div>
                <div className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300">{ru ? v.labelRu : v.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Badge */}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-500 block mb-1">Badge EN</label>
            <Input value={data.badge} onChange={e => upd({ badge: e.target.value })} className="text-xs h-8" /></div>
          <div><label className="text-xs text-zinc-500 block mb-1">Badge RU</label>
            <Input value={data.badgeRu} onChange={e => upd({ badgeRu: e.target.value })} className="text-xs h-8" /></div>
        </div>

        {/* Title */}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-500 block mb-1">{ru ? 'Заголовок EN' : 'Title EN'}</label>
            <Input value={data.title} onChange={e => upd({ title: e.target.value })} className="text-sm h-10" /></div>
          <div><label className="text-xs text-zinc-500 block mb-1">{ru ? 'Заголовок RU' : 'Title RU'}</label>
            <Input value={data.titleRu} onChange={e => upd({ titleRu: e.target.value })} className="text-sm h-10" /></div>
        </div>

        {/* Subtitle */}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-500 block mb-1">{ru ? 'Подзаголовок EN' : 'Subtitle EN'}</label>
            <Input value={data.subtitle} onChange={e => upd({ subtitle: e.target.value })} className="text-xs h-8" /></div>
          <div><label className="text-xs text-zinc-500 block mb-1">{ru ? 'Подзаголовок RU' : 'Subtitle RU'}</label>
            <Input value={data.subtitleRu} onChange={e => upd({ subtitleRu: e.target.value })} className="text-xs h-8" /></div>
        </div>

        {/* Description */}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-500 block mb-1">{ru ? 'Описание EN' : 'Description EN'}</label>
            <textarea value={data.description} onChange={e => upd({ description: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 resize-none" rows={2} /></div>
          <div><label className="text-xs text-zinc-500 block mb-1">{ru ? 'Описание RU' : 'Description RU'}</label>
            <textarea value={data.descriptionRu} onChange={e => upd({ descriptionRu: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 resize-none" rows={2} /></div>
        </div>

        {/* Buttons */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-500">{ru ? 'Кнопки' : 'Buttons'} ({data.buttons.length})</label>
            <button onClick={addButton} className="text-xs text-teal-500 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
          </div>
          {data.buttons.map((btn, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-2 items-center">
              <Input value={btn.text} onChange={e => updateButton(i, { text: e.target.value })} placeholder="EN" className="text-xs h-7" />
              <Input value={btn.textRu} onChange={e => updateButton(i, { textRu: e.target.value })} placeholder="RU" className="text-xs h-7" />
              <Input value={btn.link} onChange={e => updateButton(i, { link: e.target.value })} placeholder="/link" className="text-xs h-7 w-24" />
              <select value={btn.variant} onChange={e => updateButton(i, { variant: e.target.value as any })}
                className="h-7 px-1 text-[10px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded">
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="outline">Outline</option>
                <option value="ghost">Ghost</option>
              </select>
              <button onClick={() => removeButton(i)} className="text-red-400 p-1"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
        </div>

        {/* Background */}
        <BgPicker bgType={data.bgType} bgColor={data.bgColor} bgGradient={data.bgGradient} bgImage={data.bgImage}
          bgVideo={data.bgVideo} overlayColor={data.overlayColor} overlayOpacity={data.overlayOpacity}
          onChange={u => upd(u)} lang={lang} folder="hero" />

        {/* Side Image (for split variant) */}
        {data.variant === 'split' && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-2">
            <ImageField value={data.sideImage} onChange={url => upd({ sideImage: url })} folder="hero" label={ru ? 'Боковое изображение' : 'Side Image'} lang={lang} />
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{ru ? 'Позиция' : 'Image Position'}</label>
              <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg p-0.5">
                <button onClick={() => upd({ sideImagePosition: 'right' })} className={`flex-1 text-xs py-1 rounded-md ${data.sideImagePosition === 'right' ? 'bg-white dark:bg-zinc-600 shadow' : ''}`}>{ru ? 'Справа' : 'Right'}</button>
                <button onClick={() => upd({ sideImagePosition: 'left' })} className={`flex-1 text-xs py-1 rounded-md ${data.sideImagePosition === 'left' ? 'bg-white dark:bg-zinc-600 shadow' : ''}`}>{ru ? 'Слева' : 'Left'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Colors & Style */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{ru ? 'Цвет текста' : 'Text Color'}</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={data.textColor || '#ffffff'} onChange={e => upd({ textColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
              <Input value={data.textColor} onChange={e => upd({ textColor: e.target.value })} className="text-xs h-7" />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{ru ? 'Акцент' : 'Accent'}</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={data.accentColor || '#2dd4bf'} onChange={e => upd({ accentColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
              <Input value={data.accentColor} onChange={e => upd({ accentColor: e.target.value })} className="text-xs h-7" />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{ru ? 'Мин. высота' : 'Min Height'}</label>
            <Input value={data.minHeight} onChange={e => upd({ minHeight: e.target.value })} className="text-xs h-7" placeholder="100vh" />
          </div>
        </div>

        {/* Typography */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">{ru ? '✒️ Типография' : '✒️ Typography'}</label>
          <TextStyleEditor label="Title" value={data.titleStyle} onChange={v => upd({ titleStyle: v })} defaultColor={data.textColor || '#ffffff'} />
          <TextStyleEditor label="Subtitle" value={data.subtitleStyle} onChange={v => upd({ subtitleStyle: v })} defaultColor={data.accentColor || '#2dd4bf'} />
          <TextStyleEditor label="Desc" value={data.descriptionStyle} onChange={v => upd({ descriptionStyle: v })} defaultColor={data.textColor || '#ffffff'} />
          <TextStyleEditor label="Badge" value={data.badgeStyle} onChange={v => upd({ badgeStyle: v })} defaultColor={data.accentColor || '#2dd4bf'} />
        </div>

        {/* Animation */}
        <div>
          <label className="text-xs text-zinc-500 block mb-1">{ru ? 'Анимация' : 'Animation'}</label>
          <AnimSelect value={data.animation} onChange={v => upd({ animation: v })} lang={lang} />
        </div>

        {/* Features */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-2">
          <label className="text-xs font-medium text-zinc-500">{ru ? 'Особенности (под кнопками)' : 'Features (below buttons)'}</label>
          <div className="grid grid-cols-2 gap-3">
            <FeatList items={data.features} onChange={f => upd({ features: f })} lang="en" />
            <FeatList items={data.featuresRu} onChange={f => upd({ featuresRu: f })} lang="ru" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FeatList({ items, onChange, lang }: { items: string[]; onChange: (f: string[]) => void; lang: string }) {
  const [val, setVal] = useState('')
  return (
    <div className="space-y-1">
      {items.map((f, i) => (
        <div key={i} className="flex gap-1">
          <Input value={f} onChange={e => { const n = [...items]; n[i] = e.target.value; onChange(n) }} className="text-xs h-7 flex-1" />
          <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-red-400 p-1"><Trash2 className="w-3 h-3" /></button>
        </div>
      ))}
      <div className="flex gap-1">
        <Input value={val} onChange={e => setVal(e.target.value)} placeholder={lang === 'ru' ? 'Новое...' : 'New...'} className="text-xs h-7 flex-1"
          onKeyDown={e => { if (e.key === 'Enter' && val.trim()) { onChange([...items, val.trim()]); setVal('') } }} />
        <button onClick={() => { if (val.trim()) { onChange([...items, val.trim()]); setVal('') } }} className="text-teal-500 p-1"><Plus className="w-3 h-3" /></button>
      </div>
    </div>
  )
}
