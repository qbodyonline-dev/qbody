'use client'
import React, { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Plus, Trash2, Copy, GripVertical, ChevronDown, ChevronUp, X, Check, Upload, ImageIcon, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

import type { CourseItem, ProgramItem, ResultItem, HeaderData, HeroData, AboutData, NavLink } from './types'
import { COURSE_GRADIENTS, PROGRAM_GRADIENTS, EMOJI_ICONS, HERO_GRADIENTS, LOGO_GRADIENTS } from './renderers'

/* ═══════════ SHARED COMPONENTS ═══════════ */

interface EmojiPickerProps {
  value: string
  onChange: (v: string) => void
  onClose: () => void
}

function EmojiPicker({ value, onChange, onClose }: EmojiPickerProps) {
  return (
    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 p-2">
      <div className="grid grid-cols-6 gap-1">
        {EMOJI_ICONS.map(e => (
          <button key={e} onClick={() => { onChange(e); onClose() }}
            className={`w-9 h-9 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xl flex items-center justify-center ${value === e ? 'bg-teal-100 dark:bg-teal-900' : ''}`}>
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}

interface GradientPickerProps {
  value: string
  options: string[]
  onChange: (v: string) => void
  onClose: () => void
}

function GradientPicker({ value, options, onChange, onClose }: GradientPickerProps) {
  return (
    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 p-2">
      <div className="grid grid-cols-3 gap-1.5">
        {options.map(g => (
          <button key={g} onClick={() => { onChange(g); onClose() }}
            className={`w-12 h-12 rounded-lg border-2 transition-all ${value === g ? 'border-teal-500 scale-105' : 'border-zinc-200 dark:border-zinc-600'}`}
            style={{ background: g }} />
        ))}
      </div>
    </div>
  )
}

interface FeaturesEditorProps {
  features: string[]
  onChange: (f: string[]) => void
  lang: 'en' | 'ru'
}

function FeaturesEditor({ features, onChange, lang }: FeaturesEditorProps) {
  const [newFeature, setNewFeature] = useState('')

  const addFeature = () => {
    if (newFeature.trim()) {
      onChange([...features, newFeature.trim()])
      setNewFeature('')
    }
  }

  const removeFeature = (idx: number) => {
    onChange(features.filter((_, i) => i !== idx))
  }

  const updateFeature = (idx: number, val: string) => {
    const next = [...features]
    next[idx] = val
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <label className="text-xs text-zinc-500 block">{lang === 'ru' ? 'Преимущества' : 'Features'}</label>
      <div className="space-y-1.5">
        {features.map((f, i) => (
          <div key={i} className="flex gap-1.5">
            <Input value={f} onChange={e => updateFeature(i, e.target.value)} className="text-xs h-8 flex-1" />
            <button onClick={() => removeFeature(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        <div className="flex gap-1.5">
          <Input value={newFeature} onChange={e => setNewFeature(e.target.value)} placeholder={lang === 'ru' ? 'Новое преимущество...' : 'New feature...'} className="text-xs h-8 flex-1" onKeyDown={e => e.key === 'Enter' && addFeature()} />
          <button onClick={addFeature} className="p-1.5 rounded-lg hover:bg-teal-50 text-teal-500"><Plus className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════ COURSE ITEM EDITOR ═══════════ */

interface CourseItemEditorProps {
  item: CourseItem
  onChange: (item: CourseItem) => void
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

export function CourseItemEditor({
  item, onChange, onDelete, onDuplicate, lang, isExpanded, onToggle,
  onDragStart, onDragOver, onDragEnd, isDragging
}: CourseItemEditorProps) {
  const [showEmoji, setShowEmoji] = useState(false)
  const [showGradient, setShowGradient] = useState(false)

  const u = (key: keyof CourseItem, val: any) => onChange({ ...item, [key]: val })
  const title = lang === 'ru' ? item.titleRu : item.title

  return (
    <div draggable onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}
      className={`border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 transition-all ${isDragging ? 'opacity-40' : ''}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 cursor-pointer select-none" onClick={onToggle}>
        <GripVertical className="w-4 h-4 text-zinc-300 cursor-grab flex-shrink-0" />
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: item.gradient }}>{item.icon}</div>
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex-1 truncate">{title || (lang === 'ru' ? 'Новый курс' : 'New course')}</span>
        <span className="text-xs text-zinc-500">${item.price}</span>
        <div className="flex gap-0.5">
          <button onClick={e => { e.stopPropagation(); onDuplicate() }} className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"><Copy className="w-3.5 h-3.5 text-zinc-400" /></button>
          <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-1 rounded hover:bg-red-100"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Row 1: Icon & Gradient */}
          <div className="flex gap-4">
            <div className="relative">
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Иконка' : 'Icon'}</label>
              <button onClick={() => setShowEmoji(!showEmoji)} className="w-12 h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 text-2xl flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800">{item.icon}</button>
              {showEmoji && <EmojiPicker value={item.icon} onChange={v => u('icon', v)} onClose={() => setShowEmoji(false)} />}
            </div>
            <div className="relative">
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Градиент' : 'Gradient'}</label>
              <button onClick={() => setShowGradient(!showGradient)} className="w-12 h-12 rounded-xl border-2 border-zinc-200 dark:border-zinc-600" style={{ background: item.gradient }} />
              {showGradient && <GradientPicker value={item.gradient} options={COURSE_GRADIENTS} onChange={v => u('gradient', v)} onClose={() => setShowGradient(false)} />}
            </div>
          </div>

          {/* Row 2: Titles */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Title (EN)</label>
              <Input value={item.title} onChange={e => u('title', e.target.value)} className="text-sm h-9" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Название (RU)' : 'Title (RU)'}</label>
              <Input value={item.titleRu} onChange={e => u('titleRu', e.target.value)} className="text-sm h-9" />
            </div>
          </div>

          {/* Row 3: Descriptions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Description (EN)</label>
              <textarea value={item.description} onChange={e => u('description', e.target.value)} className="w-full p-2 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-xl h-16 resize-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Описание (RU)' : 'Description (RU)'}</label>
              <textarea value={item.descriptionRu} onChange={e => u('descriptionRu', e.target.value)} className="w-full p-2 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-xl h-16 resize-none" />
            </div>
          </div>

          {/* Row 4: Price, Duration, Lessons, Link */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Цена $' : 'Price $'}</label>
              <Input type="number" value={item.price} onChange={e => u('price', Number(e.target.value))} className="text-sm h-9" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Старая цена' : 'Old price'}</label>
              <Input type="number" value={item.oldPrice || ''} onChange={e => u('oldPrice', e.target.value ? Number(e.target.value) : undefined)} className="text-sm h-9" placeholder="—" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Длит.' : 'Duration'}</label>
              <Input value={item.duration} onChange={e => u('duration', e.target.value)} className="text-sm h-9" placeholder="6 weeks" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Уроков' : 'Lessons'}</label>
              <Input type="number" value={item.lessons} onChange={e => u('lessons', Number(e.target.value))} className="text-sm h-9" />
            </div>
          </div>

          {/* Row 5: Link */}
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Ссылка' : 'Link'}</label>
            <Input value={item.link} onChange={e => u('link', e.target.value)} className="text-sm h-9" placeholder="/courses/..." />
          </div>

          {/* Row 6: Features */}
          <div className="grid grid-cols-2 gap-4">
            <FeaturesEditor features={item.features} onChange={f => u('features', f)} lang="en" />
            <FeaturesEditor features={item.featuresRu} onChange={f => u('featuresRu', f)} lang="ru" />
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════ PROGRAM ITEM EDITOR ═══════════ */

interface ProgramItemEditorProps {
  item: ProgramItem
  onChange: (item: ProgramItem) => void
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

export function ProgramItemEditor({
  item, onChange, onDelete, onDuplicate, lang, isExpanded, onToggle,
  onDragStart, onDragOver, onDragEnd, isDragging
}: ProgramItemEditorProps) {
  const [showEmoji, setShowEmoji] = useState(false)
  const [showGradient, setShowGradient] = useState(false)

  const u = (key: keyof ProgramItem, val: any) => onChange({ ...item, [key]: val })
  const title = lang === 'ru' ? item.titleRu : item.title

  return (
    <div draggable onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}
      className={`border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 transition-all ${isDragging ? 'opacity-40' : ''} ${item.popular ? 'ring-2 ring-teal-400' : ''} ${item.soon ? 'ring-2 ring-amber-400' : ''}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 cursor-pointer select-none" onClick={onToggle}>
        <GripVertical className="w-4 h-4 text-zinc-300 cursor-grab flex-shrink-0" />
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: item.gradient }}>{item.icon}</div>
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex-1 truncate">{title || (lang === 'ru' ? 'Новая программа' : 'New program')}</span>
        {item.popular && <span className="text-[10px] bg-teal-500 text-white px-2 py-0.5 rounded-full">{lang === 'ru' ? 'Хит' : 'Popular'}</span>}
        {item.soon && <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full">Soon</span>}
        <span className="text-xs text-zinc-500">${item.price}</span>
        <div className="flex gap-0.5">
          <button onClick={e => { e.stopPropagation(); onDuplicate() }} className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"><Copy className="w-3.5 h-3.5 text-zinc-400" /></button>
          <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-1 rounded hover:bg-red-100"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Row 1: Icon, Gradient, Popular */}
          <div className="flex gap-4 items-end">
            <div className="relative">
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Иконка' : 'Icon'}</label>
              <button onClick={() => setShowEmoji(!showEmoji)} className="w-12 h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 text-2xl flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800">{item.icon}</button>
              {showEmoji && <EmojiPicker value={item.icon} onChange={v => u('icon', v)} onClose={() => setShowEmoji(false)} />}
            </div>
            <div className="relative">
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Градиент' : 'Gradient'}</label>
              <button onClick={() => setShowGradient(!showGradient)} className="w-12 h-12 rounded-xl border-2 border-zinc-200 dark:border-zinc-600" style={{ background: item.gradient }} />
              {showGradient && <GradientPicker value={item.gradient} options={PROGRAM_GRADIENTS} onChange={v => u('gradient', v)} onClose={() => setShowGradient(false)} />}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={item.popular || false} onChange={e => u('popular', e.target.checked)} className="w-4 h-4 rounded border-zinc-300 text-teal-500 focus:ring-teal-500" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{lang === 'ru' ? 'Популярный' : 'Popular'}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={item.soon || false} onChange={e => u('soon', e.target.checked)} className="w-4 h-4 rounded border-zinc-300 text-amber-500 focus:ring-amber-500" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Soon</span>
            </label>
          </div>

          {/* Row 2: Titles */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Title (EN)</label>
              <Input value={item.title} onChange={e => u('title', e.target.value)} className="text-sm h-9" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Название (RU)' : 'Title (RU)'}</label>
              <Input value={item.titleRu} onChange={e => u('titleRu', e.target.value)} className="text-sm h-9" />
            </div>
          </div>

          {/* Row 3: Descriptions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Description (EN)</label>
              <textarea value={item.description} onChange={e => u('description', e.target.value)} className="w-full p-2 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-xl h-16 resize-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Описание (RU)' : 'Description (RU)'}</label>
              <textarea value={item.descriptionRu} onChange={e => u('descriptionRu', e.target.value)} className="w-full p-2 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-xl h-16 resize-none" />
            </div>
          </div>

          {/* Row 4: Price, Duration, Level, Link */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Цена $' : 'Price $'}</label>
              <Input type="number" value={item.price} onChange={e => u('price', Number(e.target.value))} className="text-sm h-9" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Длит.' : 'Duration'}</label>
              <Input value={item.duration} onChange={e => u('duration', e.target.value)} className="text-sm h-9" placeholder="8 weeks" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Уровень' : 'Level'}</label>
              <select value={item.level} onChange={e => u('level', e.target.value)} className="w-full h-9 px-3 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-xl">
                <option value="any">{lang === 'ru' ? 'Любой' : 'Any'}</option>
                <option value="beginner">{lang === 'ru' ? 'Новичок' : 'Beginner'}</option>
                <option value="intermediate">{lang === 'ru' ? 'Средний' : 'Intermediate'}</option>
                <option value="advanced">{lang === 'ru' ? 'Продвинутый' : 'Advanced'}</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Ссылка' : 'Link'}</label>
              <Input value={item.link} onChange={e => u('link', e.target.value)} className="text-sm h-9" placeholder="/programs/..." />
            </div>
          </div>

          {/* Row 5: Features */}
          <div className="grid grid-cols-2 gap-4">
            <FeaturesEditor features={item.features} onChange={f => u('features', f)} lang="en" />
            <FeaturesEditor features={item.featuresRu} onChange={f => u('featuresRu', f)} lang="ru" />
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════ RESULT ITEM EDITOR ═══════════ */

interface ResultItemEditorProps {
  item: ResultItem
  onChange: (item: ResultItem) => void
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

export function ResultItemEditor({
  item, onChange, onDelete, onDuplicate, lang, isExpanded, onToggle,
  onDragStart, onDragOver, onDragEnd, isDragging
}: ResultItemEditorProps) {
  const [showEmoji, setShowEmoji] = useState(false)

  const u = (key: keyof ResultItem, val: any) => onChange({ ...item, [key]: val })
  const name = lang === 'ru' ? item.nameRu : item.name

  return (
    <div draggable onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}
      className={`border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 transition-all ${isDragging ? 'opacity-40' : ''}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 cursor-pointer select-none" onClick={onToggle}>
        <GripVertical className="w-4 h-4 text-zinc-300 cursor-grab flex-shrink-0" />
        <span className="text-xl">{item.icon}</span>
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex-1 truncate">{name || (lang === 'ru' ? 'Новый результат' : 'New result')}, {item.age}</span>
        <span className="text-xs text-teal-500 font-medium">{lang === 'ru' ? item.resultRu : item.result}</span>
        <div className="flex gap-0.5">
          <button onClick={e => { e.stopPropagation(); onDuplicate() }} className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"><Copy className="w-3.5 h-3.5 text-zinc-400" /></button>
          <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-1 rounded hover:bg-red-100"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Row 1: Icon & Age */}
          <div className="flex gap-4">
            <div className="relative">
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Иконка' : 'Icon'}</label>
              <button onClick={() => setShowEmoji(!showEmoji)} className="w-12 h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 text-2xl flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800">{item.icon}</button>
              {showEmoji && <EmojiPicker value={item.icon} onChange={v => u('icon', v)} onClose={() => setShowEmoji(false)} />}
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Возраст' : 'Age'}</label>
              <Input type="number" value={item.age} onChange={e => u('age', Number(e.target.value))} className="text-sm h-12 w-20" />
            </div>
          </div>

          {/* Row 2: Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Name (EN)</label>
              <Input value={item.name} onChange={e => u('name', e.target.value)} className="text-sm h-9" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Имя (RU)' : 'Name (RU)'}</label>
              <Input value={item.nameRu} onChange={e => u('nameRu', e.target.value)} className="text-sm h-9" />
            </div>
          </div>

          {/* Row 3: Results */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Result (EN)</label>
              <Input value={item.result} onChange={e => u('result', e.target.value)} className="text-sm h-9" placeholder="-16 kg in 4 months" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Результат (RU)' : 'Result (RU)'}</label>
              <Input value={item.resultRu} onChange={e => u('resultRu', e.target.value)} className="text-sm h-9" placeholder="-16 кг за 4 мес" />
            </div>
          </div>

          {/* Row 4: Quotes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Quote (EN)</label>
              <textarea value={item.quote} onChange={e => u('quote', e.target.value)} className="w-full p-2 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-xl h-16 resize-none" placeholder="Amazing experience!" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Цитата (RU)' : 'Quote (RU)'}</label>
              <textarea value={item.quoteRu} onChange={e => u('quoteRu', e.target.value)} className="w-full p-2 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-xl h-16 resize-none" placeholder="Потрясающе!" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════ BLOCK EDITORS (List containers) ═══════════ */

interface CoursesBlockEditorProps {
  items: CourseItem[]
  onChange: (items: CourseItem[]) => void
  lang: 'en' | 'ru'
}

export function CoursesBlockEditor({ items, onChange, lang }: CoursesBlockEditorProps) {
  const [expanded, setExpanded] = useState<string | null>(items[0]?.id || null)
  const [dragId, setDragId] = useState<string | null>(null)

  const add = () => {
    const newItem: CourseItem = {
      id: `course_${Date.now()}`,
      title: 'New Course',
      titleRu: 'Новый курс',
      description: 'Course description',
      descriptionRu: 'Описание курса',
      price: 99,
      duration: '6 weeks',
      lessons: 18,
      icon: '💗',
      gradient: COURSE_GRADIENTS[0],
      features: ['Feature 1', 'Feature 2'],
      featuresRu: ['Преимущество 1', 'Преимущество 2'],
      link: '/courses/new'
    }
    onChange([...items, newItem])
    setExpanded(newItem.id)
  }

  const update = (id: string, item: CourseItem) => {
    onChange(items.map(i => i.id === id ? item : i))
  }

  const remove = (id: string) => {
    if (items.length <= 1) return
    onChange(items.filter(i => i.id !== id))
    if (expanded === id) setExpanded(items[0]?.id || null)
  }

  const duplicate = (id: string) => {
    const idx = items.findIndex(i => i.id === id)
    if (idx < 0) return
    const src = items[idx]
    const dup: CourseItem = { ...src, id: `course_${Date.now()}`, title: src.title + ' (copy)', titleRu: src.titleRu + ' (копия)' }
    const next = [...items]
    next.splice(idx + 1, 0, dup)
    onChange(next)
    setExpanded(dup.id)
  }

  const onDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!dragId || dragId === targetId) return
    const arr = [...items]
    const fromIdx = arr.findIndex(i => i.id === dragId)
    const toIdx = arr.findIndex(i => i.id === targetId)
    if (fromIdx < 0 || toIdx < 0) return
    const [moved] = arr.splice(fromIdx, 1)
    arr.splice(toIdx, 0, moved)
    onChange(arr)
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{lang === 'ru' ? 'Курсы' : 'Courses'} ({items.length})</h3>
          <Button variant="outline" size="sm" onClick={add}><Plus className="w-3.5 h-3.5 mr-1.5" />{lang === 'ru' ? 'Добавить курс' : 'Add course'}</Button>
        </div>
        <div className="space-y-2">
          {items.map(item => (
            <CourseItemEditor key={item.id} item={item} onChange={i => update(item.id, i)} onDelete={() => remove(item.id)} onDuplicate={() => duplicate(item.id)}
              lang={lang} isExpanded={expanded === item.id} onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
              onDragStart={() => setDragId(item.id)} onDragOver={e => onDragOver(e, item.id)} onDragEnd={() => setDragId(null)} isDragging={dragId === item.id} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface ProgramsBlockEditorProps {
  items: ProgramItem[]
  onChange: (items: ProgramItem[]) => void
  lang: 'en' | 'ru'
}

export function ProgramsBlockEditor({ items, onChange, lang }: ProgramsBlockEditorProps) {
  const [expanded, setExpanded] = useState<string | null>(items[0]?.id || null)
  const [dragId, setDragId] = useState<string | null>(null)

  const add = () => {
    const newItem: ProgramItem = {
      id: `program_${Date.now()}`,
      title: 'New Program',
      titleRu: 'Новая программа',
      description: 'Program description',
      descriptionRu: 'Описание программы',
      price: 49,
      duration: '8 weeks',
      level: 'any',
      icon: '🎯',
      gradient: PROGRAM_GRADIENTS[0],
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      featuresRu: ['Преимущество 1', 'Преимущество 2', 'Преимущество 3'],
      link: '/programs/new',
      popular: false
    }
    onChange([...items, newItem])
    setExpanded(newItem.id)
  }

  const update = (id: string, item: ProgramItem) => {
    onChange(items.map(i => i.id === id ? item : i))
  }

  const remove = (id: string) => {
    if (items.length <= 1) return
    onChange(items.filter(i => i.id !== id))
    if (expanded === id) setExpanded(items[0]?.id || null)
  }

  const duplicate = (id: string) => {
    const idx = items.findIndex(i => i.id === id)
    if (idx < 0) return
    const src = items[idx]
    const dup: ProgramItem = { ...src, id: `program_${Date.now()}`, title: src.title + ' (copy)', titleRu: src.titleRu + ' (копия)', popular: false }
    const next = [...items]
    next.splice(idx + 1, 0, dup)
    onChange(next)
    setExpanded(dup.id)
  }

  const onDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!dragId || dragId === targetId) return
    const arr = [...items]
    const fromIdx = arr.findIndex(i => i.id === dragId)
    const toIdx = arr.findIndex(i => i.id === targetId)
    if (fromIdx < 0 || toIdx < 0) return
    const [moved] = arr.splice(fromIdx, 1)
    arr.splice(toIdx, 0, moved)
    onChange(arr)
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{lang === 'ru' ? 'Программы' : 'Programs'} ({items.length})</h3>
          <Button variant="outline" size="sm" onClick={add}><Plus className="w-3.5 h-3.5 mr-1.5" />{lang === 'ru' ? 'Добавить программу' : 'Add program'}</Button>
        </div>
        <div className="space-y-2">
          {items.map(item => (
            <ProgramItemEditor key={item.id} item={item} onChange={i => update(item.id, i)} onDelete={() => remove(item.id)} onDuplicate={() => duplicate(item.id)}
              lang={lang} isExpanded={expanded === item.id} onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
              onDragStart={() => setDragId(item.id)} onDragOver={e => onDragOver(e, item.id)} onDragEnd={() => setDragId(null)} isDragging={dragId === item.id} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface ResultsBlockEditorProps {
  items: ResultItem[]
  onChange: (items: ResultItem[]) => void
  lang: 'en' | 'ru'
}

export function ResultsBlockEditor({ items, onChange, lang }: ResultsBlockEditorProps) {
  const [expanded, setExpanded] = useState<string | null>(items[0]?.id || null)
  const [dragId, setDragId] = useState<string | null>(null)

  const add = () => {
    const newItem: ResultItem = {
      id: `result_${Date.now()}`,
      name: 'Client Name',
      nameRu: 'Имя клиента',
      age: 30,
      result: '-10 kg in 3 months',
      resultRu: '-10 кг за 3 мес',
      quote: 'Amazing results!',
      quoteRu: 'Потрясающие результаты!',
      icon: '💪'
    }
    onChange([...items, newItem])
    setExpanded(newItem.id)
  }

  const update = (id: string, item: ResultItem) => {
    onChange(items.map(i => i.id === id ? item : i))
  }

  const remove = (id: string) => {
    if (items.length <= 1) return
    onChange(items.filter(i => i.id !== id))
    if (expanded === id) setExpanded(items[0]?.id || null)
  }

  const duplicate = (id: string) => {
    const idx = items.findIndex(i => i.id === id)
    if (idx < 0) return
    const src = items[idx]
    const dup: ResultItem = { ...src, id: `result_${Date.now()}`, name: src.name + ' (copy)', nameRu: src.nameRu + ' (копия)' }
    const next = [...items]
    next.splice(idx + 1, 0, dup)
    onChange(next)
    setExpanded(dup.id)
  }

  const onDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!dragId || dragId === targetId) return
    const arr = [...items]
    const fromIdx = arr.findIndex(i => i.id === dragId)
    const toIdx = arr.findIndex(i => i.id === targetId)
    if (fromIdx < 0 || toIdx < 0) return
    const [moved] = arr.splice(fromIdx, 1)
    arr.splice(toIdx, 0, moved)
    onChange(arr)
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{lang === 'ru' ? 'Результаты' : 'Results'} ({items.length})</h3>
          <Button variant="outline" size="sm" onClick={add}><Plus className="w-3.5 h-3.5 mr-1.5" />{lang === 'ru' ? 'Добавить результат' : 'Add result'}</Button>
        </div>
        <div className="space-y-2">
          {items.map(item => (
            <ResultItemEditor key={item.id} item={item} onChange={i => update(item.id, i)} onDelete={() => remove(item.id)} onDuplicate={() => duplicate(item.id)}
              lang={lang} isExpanded={expanded === item.id} onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
              onDragStart={() => setDragId(item.id)} onDragOver={e => onDragOver(e, item.id)} onDragEnd={() => setDragId(null)} isDragging={dragId === item.id} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION EDITORS (Header, Hero, About)
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ─────────── NAV LINK EDITOR ─────────── */
interface NavLinkEditorProps {
  link: NavLink
  onChange: (link: NavLink) => void
  onDelete: () => void
  lang: 'en' | 'ru'
}

function NavLinkEditor({ link, onChange, onDelete, lang }: NavLinkEditorProps) {
  return (
    <div className="flex gap-2 items-center p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
      <GripVertical className="w-4 h-4 text-zinc-300 cursor-grab flex-shrink-0" />
      <Input value={link.label} onChange={e => onChange({ ...link, label: e.target.value })} placeholder="Label EN" className="text-xs h-7 flex-1" />
      <Input value={link.labelRu} onChange={e => onChange({ ...link, labelRu: e.target.value })} placeholder="Label RU" className="text-xs h-7 flex-1" />
      <Input value={link.href} onChange={e => onChange({ ...link, href: e.target.value })} placeholder="/link" className="text-xs h-7 w-24" />
      <button onClick={onDelete} className="p-1 rounded hover:bg-red-100"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
    </div>
  )
}

/* ─────────── HEADER EDITOR ─────────── */
interface HeaderEditorProps {
  data: HeaderData
  onChange: (data: HeaderData) => void
  lang: 'en' | 'ru'
}

export function HeaderEditor({ data, onChange, lang }: HeaderEditorProps) {
  const [showLogoPicker, setShowLogoPicker] = useState(false)

  const addNavLink = () => {
    const newLink: NavLink = { id: `nav_${Date.now()}`, label: 'Link', labelRu: 'Ссылка', href: '/' }
    onChange({ ...data, navLinks: [...data.navLinks, newLink] })
  }

  const updateNavLink = (id: string, link: NavLink) => {
    onChange({ ...data, navLinks: data.navLinks.map(l => l.id === id ? link : l) })
  }

  const removeNavLink = (id: string) => {
    onChange({ ...data, navLinks: data.navLinks.filter(l => l.id !== id) })
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          🧭 {lang === 'ru' ? 'Настройки шапки' : 'Header Settings'}
        </h3>

        {/* Logo Section */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-3">
          <label className="text-xs font-medium text-zinc-500 block">{lang === 'ru' ? 'Логотип' : 'Logo'}</label>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <button onClick={() => setShowLogoPicker(!showLogoPicker)}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg border-2 border-zinc-200 dark:border-zinc-600 hover:scale-105 transition-transform"
                style={{ background: data.logoGradient }}>
                {data.logoIcon}
              </button>
              {showLogoPicker && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 p-3 space-y-2">
                  <label className="text-xs text-zinc-500 block">{lang === 'ru' ? 'Цвет' : 'Color'}</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {LOGO_GRADIENTS.map(g => (
                      <button key={g} onClick={() => onChange({ ...data, logoGradient: g })}
                        className={`w-10 h-10 rounded-lg border-2 ${data.logoGradient === g ? 'border-teal-500 scale-105' : 'border-zinc-200'}`}
                        style={{ background: g }} />
                    ))}
                  </div>
                  <label className="text-xs text-zinc-500 block mt-2">{lang === 'ru' ? 'Иконка' : 'Icon'}</label>
                  <Input value={data.logoIcon} onChange={e => onChange({ ...data, logoIcon: e.target.value })} placeholder="A or 💪" className="text-xs h-8" maxLength={2} />
                  <button onClick={() => setShowLogoPicker(false)} className="w-full p-1.5 text-xs bg-teal-500 text-white rounded-lg mt-2"><Check className="w-3 h-3 inline mr-1" />{lang === 'ru' ? 'Готово' : 'Done'}</button>
                </div>
              )}
            </div>
            <Input value={data.logoText} onChange={e => onChange({ ...data, logoText: e.target.value })} placeholder={lang === 'ru' ? 'Название сайта' : 'Site name'} className="text-sm h-10 flex-1" />
          </div>
        </div>

        {/* Navigation Links */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-500">{lang === 'ru' ? 'Навигация' : 'Navigation'}</label>
            <button onClick={addNavLink} className="p-1 rounded-lg hover:bg-teal-50 text-teal-500"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-1.5">
            {data.navLinks.map(link => (
              <NavLinkEditor key={link.id} link={link} onChange={l => updateNavLink(link.id, l)} onDelete={() => removeNavLink(link.id)} lang={lang} />
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-2">
            <label className="text-xs font-medium text-zinc-500 block">{lang === 'ru' ? 'Кнопка входа' : 'Login Button'}</label>
            <Input value={data.loginText} onChange={e => onChange({ ...data, loginText: e.target.value })} placeholder="EN" className="text-xs h-8" />
            <Input value={data.loginTextRu} onChange={e => onChange({ ...data, loginTextRu: e.target.value })} placeholder="RU" className="text-xs h-8" />
            <Input value={data.loginLink} onChange={e => onChange({ ...data, loginLink: e.target.value })} placeholder="/auth/login" className="text-xs h-8" />
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-2">
            <label className="text-xs font-medium text-zinc-500 block">{lang === 'ru' ? 'Кнопка CTA' : 'CTA Button'}</label>
            <Input value={data.ctaText} onChange={e => onChange({ ...data, ctaText: e.target.value })} placeholder="EN" className="text-xs h-8" />
            <Input value={data.ctaTextRu} onChange={e => onChange({ ...data, ctaTextRu: e.target.value })} placeholder="RU" className="text-xs h-8" />
            <Input value={data.ctaLink} onChange={e => onChange({ ...data, ctaLink: e.target.value })} placeholder="/auth/register" className="text-xs h-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─────────── HERO EDITOR ─────────── */
interface HeroEditorProps {
  data: HeroData
  onChange: (data: HeroData) => void
  lang: 'en' | 'ru'
}

export function HeroEditor({ data, onChange, lang }: HeroEditorProps) {
  const [showGradientPicker, setShowGradientPicker] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(lang === 'ru' ? 'Выберите изображение' : 'Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(lang === 'ru' ? 'Файл слишком большой (макс. 5MB)' : 'File too large (max 5MB)')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'hero')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload failed')
      }

      const { url } = await res.json()
      onChange({ ...data, heroImage: url })
      toast.success(lang === 'ru' ? 'Изображение загружено!' : 'Image uploaded!')
    } catch (err: any) {
      console.error('Upload error:', err)
      toast.error(err.message || (lang === 'ru' ? 'Ошибка загрузки' : 'Upload failed'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = () => {
    onChange({ ...data, heroImage: undefined })
    toast.success(lang === 'ru' ? 'Изображение удалено' : 'Image removed')
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          🦸 {lang === 'ru' ? 'Настройки Hero' : 'Hero Settings'}
        </h3>

        {/* Background Gradient */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-2">
          <label className="text-xs font-medium text-zinc-500 block">{lang === 'ru' ? 'Фоновый градиент' : 'Background Gradient'}</label>
          <div className="relative">
            <button onClick={() => setShowGradientPicker(!showGradientPicker)}
              className="w-full h-16 rounded-xl border-2 border-zinc-200 dark:border-zinc-600"
              style={{ background: data.gradient }} />
            {showGradientPicker && (
              <GradientPicker value={data.gradient} options={HERO_GRADIENTS} onChange={g => onChange({ ...data, gradient: g })} onClose={() => setShowGradientPicker(false)} />
            )}
          </div>
        </div>

        {/* Hero Image Upload */}
        <div className="p-3 bg-gradient-to-r from-teal-50 to-zinc-50 dark:from-teal-900/20 dark:to-zinc-800 rounded-lg space-y-3 border border-teal-200 dark:border-teal-800">
          <label className="text-xs font-medium text-teal-700 dark:text-teal-400 block flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            {lang === 'ru' ? 'Изображение Hero (вторая колонка)' : 'Hero Image (second column)'}
          </label>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {lang === 'ru' 
              ? 'Добавьте фото для двухколоночного дизайна Hero. Текст слева, изображение справа.' 
              : 'Add a photo for two-column Hero layout. Text on left, image on right.'}
          </p>
          
          {data.heroImage ? (
            <div className="flex gap-3 items-start">
              <div className="relative group">
                <img 
                  src={data.heroImage} 
                  alt="Hero preview" 
                  className="w-32 h-40 rounded-xl object-cover border-2 border-teal-200 dark:border-teal-700 shadow-md"
                />
                <button 
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 space-y-2">
                <Input 
                  value={data.heroImage} 
                  onChange={e => onChange({ ...data, heroImage: e.target.value })}
                  placeholder={lang === 'ru' ? 'URL изображения' : 'Image URL'}
                  className="text-xs h-8"
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-xs"
                  >
                    {uploading ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Upload className="w-3 h-3 mr-1.5" />}
                    {lang === 'ru' ? 'Заменить' : 'Replace'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={removeImage}
                    className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 mr-1.5" />
                    {lang === 'ru' ? 'Удалить' : 'Remove'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-teal-300 dark:border-teal-700 rounded-xl p-6 text-center cursor-pointer transition-all ${uploading ? 'opacity-50' : 'hover:border-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-900/30'}`}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                  <p className="text-sm text-teal-600 dark:text-teal-400">{lang === 'ru' ? 'Загрузка...' : 'Uploading...'}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-teal-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {lang === 'ru' ? 'Нажмите для загрузки' : 'Click to upload'}
                    </p>
                    <p className="text-xs text-zinc-500">PNG, JPG, WEBP (макс. 5MB)</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          {/* Manual URL input when no image */}
          {!data.heroImage && (
            <div className="flex gap-2 items-center">
              <span className="text-xs text-zinc-500">{lang === 'ru' ? 'или вставьте URL:' : 'or paste URL:'}</span>
              <Input 
                value={data.heroImage || ''} 
                onChange={e => onChange({ ...data, heroImage: e.target.value || undefined })}
                placeholder="https://..."
                className="text-xs h-8 flex-1"
              />
            </div>
          )}
        </div>

        {/* Image Style Settings - only show when image exists */}
        {data.heroImage && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-3">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block flex items-center gap-2">
              📐 {lang === 'ru' ? 'Настройки изображения' : 'Image Settings'}
            </label>
            
            {/* Max Width & Height */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Макс. ширина' : 'Max Width'}</label>
                <Input 
                  value={data.imageMaxWidth || '480px'} 
                  onChange={e => onChange({ ...data, imageMaxWidth: e.target.value })}
                  placeholder="480px"
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Макс. высота' : 'Max Height'}</label>
                <Input 
                  value={data.imageMaxHeight || '600px'} 
                  onChange={e => onChange({ ...data, imageMaxHeight: e.target.value })}
                  placeholder="600px"
                  className="text-xs h-8"
                />
              </div>
            </div>

            {/* Border Radius & Object Fit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Скругление углов' : 'Border Radius'}</label>
                <Input 
                  value={data.imageBorderRadius || '24px'} 
                  onChange={e => onChange({ ...data, imageBorderRadius: e.target.value })}
                  placeholder="24px"
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Заполнение' : 'Object Fit'}</label>
                <select 
                  value={data.imageObjectFit || 'cover'} 
                  onChange={e => onChange({ ...data, imageObjectFit: e.target.value as any })}
                  className="w-full h-8 px-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-lg"
                >
                  <option value="cover">Cover ({lang === 'ru' ? 'заполнить' : 'fill area'})</option>
                  <option value="contain">Contain ({lang === 'ru' ? 'вписать' : 'fit inside'})</option>
                  <option value="fill">Fill ({lang === 'ru' ? 'растянуть' : 'stretch'})</option>
                  <option value="none">None ({lang === 'ru' ? 'оригинал' : 'original'})</option>
                </select>
              </div>
            </div>

            {/* Padding */}
            <div>
              <label className="text-xs text-zinc-500 block mb-2">{lang === 'ru' ? 'Отступы (padding)' : 'Padding'}</label>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">{lang === 'ru' ? 'Верх' : 'Top'}</label>
                  <Input 
                    value={data.imagePaddingTop || '0'} 
                    onChange={e => onChange({ ...data, imagePaddingTop: e.target.value })}
                    placeholder="0"
                    className="text-xs h-7"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">{lang === 'ru' ? 'Право' : 'Right'}</label>
                  <Input 
                    value={data.imagePaddingRight || '0'} 
                    onChange={e => onChange({ ...data, imagePaddingRight: e.target.value })}
                    placeholder="0"
                    className="text-xs h-7"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">{lang === 'ru' ? 'Низ' : 'Bottom'}</label>
                  <Input 
                    value={data.imagePaddingBottom || '0'} 
                    onChange={e => onChange({ ...data, imagePaddingBottom: e.target.value })}
                    placeholder="0"
                    className="text-xs h-7"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">{lang === 'ru' ? 'Лево' : 'Left'}</label>
                  <Input 
                    value={data.imagePaddingLeft || '0'} 
                    onChange={e => onChange({ ...data, imagePaddingLeft: e.target.value })}
                    placeholder="0"
                    className="text-xs h-7"
                  />
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">{lang === 'ru' ? 'Значения в px, %, rem' : 'Values in px, %, rem'}</p>
            </div>
          </div>
        )}

        {/* Badge */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Бейдж EN' : 'Badge EN'}</label>
            <Input value={data.badge} onChange={e => onChange({ ...data, badge: e.target.value })} className="text-xs h-8" placeholder="CERTIFIED TRAINER" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Бейдж RU' : 'Badge RU'}</label>
            <Input value={data.badgeRu} onChange={e => onChange({ ...data, badgeRu: e.target.value })} className="text-xs h-8" placeholder="СЕРТИФИКАЦИЯ" />
          </div>
        </div>

        {/* Title */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Заголовок EN' : 'Title EN'}</label>
            <Input value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} className="text-sm h-10" placeholder="Main title" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Заголовок RU' : 'Title RU'}</label>
            <Input value={data.titleRu} onChange={e => onChange({ ...data, titleRu: e.target.value })} className="text-sm h-10" placeholder="Заголовок" />
          </div>
        </div>

        {/* Subtitle (colored) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Подзаголовок EN (цветной)' : 'Subtitle EN (colored)'}</label>
            <Input value={data.subtitle} onChange={e => onChange({ ...data, subtitle: e.target.value })} className="text-sm h-10" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Подзаголовок RU (цветной)' : 'Subtitle RU (colored)'}</label>
            <Input value={data.subtitleRu} onChange={e => onChange({ ...data, subtitleRu: e.target.value })} className="text-sm h-10" />
          </div>
        </div>

        {/* Description */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Описание EN' : 'Description EN'}</label>
            <textarea value={data.description} onChange={e => onChange({ ...data, description: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 resize-none" rows={2} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Описание RU' : 'Description RU'}</label>
            <textarea value={data.descriptionRu} onChange={e => onChange({ ...data, descriptionRu: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 resize-none" rows={2} />
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-2">
            <label className="text-xs font-medium text-zinc-500 block">{lang === 'ru' ? 'Основная кнопка' : 'Primary Button'}</label>
            <Input value={data.primaryBtnText} onChange={e => onChange({ ...data, primaryBtnText: e.target.value })} placeholder="EN" className="text-xs h-8" />
            <Input value={data.primaryBtnTextRu} onChange={e => onChange({ ...data, primaryBtnTextRu: e.target.value })} placeholder="RU" className="text-xs h-8" />
            <Input value={data.primaryBtnLink} onChange={e => onChange({ ...data, primaryBtnLink: e.target.value })} placeholder="/link" className="text-xs h-8" />
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-2">
            <label className="text-xs font-medium text-zinc-500 block">{lang === 'ru' ? 'Второстепенная кнопка' : 'Secondary Button'}</label>
            <Input value={data.secondaryBtnText} onChange={e => onChange({ ...data, secondaryBtnText: e.target.value })} placeholder="EN" className="text-xs h-8" />
            <Input value={data.secondaryBtnTextRu} onChange={e => onChange({ ...data, secondaryBtnTextRu: e.target.value })} placeholder="RU" className="text-xs h-8" />
            <Input value={data.secondaryBtnLink} onChange={e => onChange({ ...data, secondaryBtnLink: e.target.value })} placeholder="/link" className="text-xs h-8" />
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3">
          <FeaturesEditor features={data.features} onChange={f => onChange({ ...data, features: f })} lang="en" />
          <FeaturesEditor features={data.featuresRu} onChange={f => onChange({ ...data, featuresRu: f })} lang="ru" />
        </div>
      </CardContent>
    </Card>
  )
}

/* ─────────── ABOUT EDITOR ─────────── */
interface AboutEditorProps {
  data: AboutData
  onChange: (data: AboutData) => void
  lang: 'en' | 'ru'
}

export function AboutEditor({ data, onChange, lang }: AboutEditorProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          👤 {lang === 'ru' ? 'Настройки About' : 'About Settings'}
        </h3>

        {/* Image */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-2">
          <label className="text-xs font-medium text-zinc-500 block">{lang === 'ru' ? 'Фото тренера' : 'Coach Photo'}</label>
          <div className="flex gap-3 items-center">
            <div className="w-20 h-24 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex-shrink-0">
              {data.image && <img src={data.image} alt="Coach" className="w-full h-full object-cover" />}
            </div>
            <Input value={data.image} onChange={e => onChange({ ...data, image: e.target.value })}
              placeholder="/images/coach.jpg" className="text-xs h-8 flex-1" />
          </div>
        </div>

        {/* Section Label */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Лейбл секции EN' : 'Section Label EN'}</label>
            <Input value={data.sectionLabel} onChange={e => onChange({ ...data, sectionLabel: e.target.value })} className="text-xs h-8" placeholder="Your coach" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Лейбл секции RU' : 'Section Label RU'}</label>
            <Input value={data.sectionLabelRu} onChange={e => onChange({ ...data, sectionLabelRu: e.target.value })} className="text-xs h-8" placeholder="Ваш тренер" />
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Имя тренера' : 'Coach Name'}</label>
          <Input value={data.name} onChange={e => onChange({ ...data, name: e.target.value })} className="text-sm h-10" placeholder="Alexandra Ivanova" />
        </div>

        {/* Tagline */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Слоган EN' : 'Tagline EN'}</label>
            <Input value={data.tagline} onChange={e => onChange({ ...data, tagline: e.target.value })} className="text-xs h-8" placeholder="Certified fitness expert" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Слоган RU' : 'Tagline RU'}</label>
            <Input value={data.taglineRu} onChange={e => onChange({ ...data, taglineRu: e.target.value })} className="text-xs h-8" placeholder="Фитнес эксперт" />
          </div>
        </div>

        {/* Certifications */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Заголовок секции EN' : 'Section Title EN'}</label>
              <Input value={data.certificationsTitle} onChange={e => onChange({ ...data, certificationsTitle: e.target.value })} className="text-xs h-8" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Заголовок секции RU' : 'Section Title RU'}</label>
              <Input value={data.certificationsTitleRu} onChange={e => onChange({ ...data, certificationsTitleRu: e.target.value })} className="text-xs h-8" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FeaturesEditor features={data.certifications} onChange={f => onChange({ ...data, certifications: f })} lang="en" />
            <FeaturesEditor features={data.certificationsRu} onChange={f => onChange({ ...data, certificationsRu: f })} lang="ru" />
          </div>
        </div>

        {/* Career */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Карьера заголовок EN' : 'Career Title EN'}</label>
              <Input value={data.careerTitle} onChange={e => onChange({ ...data, careerTitle: e.target.value })} className="text-xs h-8" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Карьера заголовок RU' : 'Career Title RU'}</label>
              <Input value={data.careerTitleRu} onChange={e => onChange({ ...data, careerTitleRu: e.target.value })} className="text-xs h-8" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FeaturesEditor features={data.career} onChange={f => onChange({ ...data, career: f })} lang="en" />
            <FeaturesEditor features={data.careerRu} onChange={f => onChange({ ...data, careerRu: f })} lang="ru" />
          </div>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Футер EN' : 'Footer EN'}</label>
            <Input value={data.footer} onChange={e => onChange({ ...data, footer: e.target.value })} className="text-xs h-8" placeholder="📍 Location / info" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">{lang === 'ru' ? 'Футер RU' : 'Footer RU'}</label>
            <Input value={data.footerRu} onChange={e => onChange({ ...data, footerRu: e.target.value })} className="text-xs h-8" placeholder="📍 Местоположение" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
