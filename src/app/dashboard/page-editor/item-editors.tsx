'use client'
import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Plus, Trash2, Copy, GripVertical, ChevronDown, ChevronUp, X, Check
} from 'lucide-react'

import type { CourseItem, ProgramItem, ResultItem } from './types'
import { COURSE_GRADIENTS, PROGRAM_GRADIENTS, EMOJI_ICONS } from './renderers'

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
      className={`border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 transition-all ${isDragging ? 'opacity-40' : ''} ${item.popular ? 'ring-2 ring-teal-400' : ''}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 cursor-pointer select-none" onClick={onToggle}>
        <GripVertical className="w-4 h-4 text-zinc-300 cursor-grab flex-shrink-0" />
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: item.gradient }}>{item.icon}</div>
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex-1 truncate">{title || (lang === 'ru' ? 'Новая программа' : 'New program')}</span>
        {item.popular && <span className="text-[10px] bg-teal-500 text-white px-2 py-0.5 rounded-full">{lang === 'ru' ? 'Хит' : 'Popular'}</span>}
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
