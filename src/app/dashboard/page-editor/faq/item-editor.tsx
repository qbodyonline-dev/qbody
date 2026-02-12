'use client'
import React from 'react'
import { Input } from '@/components/ui/input'
import { Trash2, Copy, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import type { FaqItem } from './types'

interface Props {
  item: FaqItem
  index: number
  onChange: (item: FaqItem) => void
  onDelete: () => void
  onDuplicate: () => void
  isExpanded: boolean
  onToggle: () => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnd: () => void
  isDragging: boolean
}

export function FaqItemEditor({ item, index, onChange, onDelete, onDuplicate, isExpanded, onToggle, onDragStart, onDragOver, onDragEnd, isDragging }: Props) {
  const u = (key: keyof FaqItem, val: any) => onChange({ ...item, [key]: val })

  return (
    <div draggable onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}
      className={`border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 transition-all ${isDragging ? 'opacity-40' : ''}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 cursor-pointer select-none" onClick={onToggle}>
        <GripVertical className="w-3.5 h-3.5 text-zinc-300 cursor-grab flex-shrink-0" />
        <span className="text-xs font-bold text-teal-500 w-5">{String(index + 1).padStart(2, '0')}</span>
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex-1 truncate">{item.question || 'Question'}</span>
        <div className="flex gap-0.5">
          <button onClick={e => { e.stopPropagation(); onDuplicate() }} className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"><Copy className="w-3 h-3 text-zinc-400" /></button>
          <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-1 rounded hover:bg-red-100"><Trash2 className="w-3 h-3 text-red-500" /></button>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-2.5">
          {/* Icon */}
          <div className="flex gap-2 items-end">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">Icon</label>
              <Input value={item.icon || ''} onChange={e => u('icon', e.target.value)} className="text-sm text-center h-8 w-12" maxLength={2} placeholder="❓" />
            </div>
          </div>
          {/* Question */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">Question EN</label>
              <Input value={item.question} onChange={e => u('question', e.target.value)} className="text-xs h-7" />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">Question RU</label>
              <Input value={item.questionRu} onChange={e => u('questionRu', e.target.value)} className="text-xs h-7" />
            </div>
          </div>
          {/* Answer */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">Answer EN</label>
              <textarea value={item.answer} onChange={e => u('answer', e.target.value)}
                className="w-full p-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-20 resize-none" />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">Answer RU</label>
              <textarea value={item.answerRu} onChange={e => u('answerRu', e.target.value)}
                className="w-full p-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-20 resize-none" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
