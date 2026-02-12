'use client'
import React from 'react'
import { Input } from '@/components/ui/input'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import type { TextStyle, TextAlign } from './text-style'

interface Props {
  label: string
  value: TextStyle | undefined
  onChange: (ts: TextStyle) => void
  defaultColor?: string
}

const ALIGNS: { value: TextAlign; icon: React.FC<any> }[] = [
  { value: 'left', icon: AlignLeft },
  { value: 'center', icon: AlignCenter },
  { value: 'right', icon: AlignRight },
]

export function TextStyleEditor({ label, value, onChange, defaultColor }: Props) {
  const ts = value || {}
  const u = (key: keyof TextStyle, val: any) => {
    const n = { ...ts, [key]: val || undefined }
    onChange(n)
  }

  const displayColor = ts.color || defaultColor || '#ffffff'

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] text-zinc-500 font-medium w-16 flex-shrink-0 truncate" title={label}>{label}</span>
      {/* Align */}
      <div className="flex border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden">
        {ALIGNS.map(a => (
          <button key={a.value} onClick={() => u('align', ts.align === a.value ? undefined : a.value)}
            className={`p-1 ${ts.align === a.value ? 'bg-teal-500 text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600'}`}>
            <a.icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
      {/* Color */}
      <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 rounded-md px-1 py-0.5">
        <input type="color" value={displayColor} onChange={e => u('color', e.target.value)}
          className="w-5 h-5 rounded border-0 cursor-pointer flex-shrink-0 bg-transparent" title="Color" />
        <span className="text-[9px] text-zinc-400 font-mono w-[52px]">{displayColor}</span>
      </div>
      {/* Size */}
      <div className="flex items-center gap-0.5 border border-zinc-200 dark:border-zinc-700 rounded-md px-1.5 py-0.5">
        <input
          type="number"
          value={ts.size ?? ''}
          onChange={e => u('size', e.target.value ? +e.target.value : undefined)}
          placeholder="—"
          min={8}
          max={120}
          className="w-10 text-[11px] text-center bg-transparent outline-none text-zinc-700 dark:text-zinc-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[9px] text-zinc-400">px</span>
      </div>
    </div>
  )
}
