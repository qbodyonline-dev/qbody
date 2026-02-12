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

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] text-zinc-500 font-medium w-14 flex-shrink-0 truncate" title={label}>{label}</span>
      {/* Align */}
      <div className="flex border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden">
        {ALIGNS.map(a => (
          <button key={a.value} onClick={() => u('align', ts.align === a.value ? undefined : a.value)}
            className={`p-0.5 ${ts.align === a.value ? 'bg-teal-500 text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600'}`}>
            <a.icon className="w-3 h-3" />
          </button>
        ))}
      </div>
      {/* Color */}
      <input type="color" value={ts.color || defaultColor || '#ffffff'} onChange={e => u('color', e.target.value)}
        className="w-5 h-5 rounded border-0 cursor-pointer flex-shrink-0" title="Color" />
      {/* Size */}
      <Input type="number" value={ts.size || ''} onChange={e => u('size', e.target.value ? +e.target.value : undefined)}
        placeholder="px" className="text-[10px] h-5 w-12 text-center" min={8} max={120} />
    </div>
  )
}
