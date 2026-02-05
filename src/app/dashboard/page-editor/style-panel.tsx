'use client'
import React, { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { GRADIENTS } from './constants'
import type { SectionStyle } from './types'

/* ═══════════ SECTION STYLE PANEL (Elementor-like) ═══════════ */
export function StylePanel({ style, onChange, onCommit, lang }: {
  style: SectionStyle
  onChange: (s: SectionStyle) => void
  onCommit: (s: SectionStyle) => void
  lang: 'en' | 'ru'
}) {
  const [tab, setTab] = useState<'bg' | 'spacing' | 'border' | 'css'>('bg')
  const localRef = useRef(style)
  localRef.current = style
  const u = (k: keyof SectionStyle, v: string) => {
    const next = { ...localRef.current, [k]: v }
    localRef.current = next
    onChange(next)
  }
  const commit = () => onCommit(localRef.current)

  return (
    <Card><CardContent className="p-3 space-y-3" onBlur={commit}>
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{lang === 'ru' ? 'Настройки секции' : 'Section Settings'}</p>
      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
        {(['bg', 'spacing', 'border', 'css'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${tab === t ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`}>
            {t === 'bg' ? (lang === 'ru' ? 'Фон' : 'BG') : t === 'spacing' ? (lang === 'ru' ? 'Отступы' : 'Spacing') : t === 'border' ? (lang === 'ru' ? 'Рамка' : 'Border') : 'CSS'}
          </button>
        ))}
      </div>

      {tab === 'bg' && (<div className="space-y-3">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">{lang === 'ru' ? 'Цвет фона' : 'Background color'}</label>
          <div className="flex items-center gap-2">
            <input type="color" value={style.bgColor || '#ffffff'} onChange={e => { u('bgColor', e.target.value); commit() }} className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-200" />
            <Input value={style.bgColor || ''} onChange={e => u('bgColor', e.target.value)} placeholder="#ffffff" className="flex-1 text-xs h-10" />
            <button onClick={() => { u('bgColor', ''); setTimeout(commit, 0) }} className="text-xs text-zinc-400 hover:text-red-500">✕</button>
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-2 block">{lang === 'ru' ? 'Градиент' : 'Gradient'}</label>
          <div className="grid grid-cols-5 gap-1.5">
            {GRADIENTS.map(g => (<button key={g} onClick={() => { u('bgGradient', g); setTimeout(commit, 0) }} className={`h-8 rounded-lg border-2 transition-all ${style.bgGradient === g ? 'border-teal-500 scale-105' : 'border-zinc-200 dark:border-zinc-700'}`} style={{ background: g }} />))}
          </div>
          {style.bgGradient && <button onClick={() => { u('bgGradient', ''); setTimeout(commit, 0) }} className="text-xs text-zinc-400 hover:text-red-500 mt-1">✕ {lang === 'ru' ? 'Убрать градиент' : 'Clear gradient'}</button>}
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">{lang === 'ru' ? 'Фоновое изображение' : 'Background image URL'}</label>
          <Input value={style.bgImage || ''} onChange={e => u('bgImage', e.target.value)} placeholder="https://..." className="text-xs h-9" />
        </div>
      </div>)}

      {tab === 'spacing' && (<div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-500 mb-1 block">{lang === 'ru' ? 'Верх' : 'Top'} (px)</label><Input type="number" value={style.paddingTop || ''} onChange={e => u('paddingTop', e.target.value)} className="text-xs h-9" placeholder="60" /></div>
          <div><label className="text-xs text-zinc-500 mb-1 block">{lang === 'ru' ? 'Низ' : 'Bottom'} (px)</label><Input type="number" value={style.paddingBottom || ''} onChange={e => u('paddingBottom', e.target.value)} className="text-xs h-9" placeholder="60" /></div>
          <div><label className="text-xs text-zinc-500 mb-1 block">{lang === 'ru' ? 'Лево' : 'Left'} (px)</label><Input type="number" value={style.paddingLeft || ''} onChange={e => u('paddingLeft', e.target.value)} className="text-xs h-9" placeholder="20" /></div>
          <div><label className="text-xs text-zinc-500 mb-1 block">{lang === 'ru' ? 'Право' : 'Right'} (px)</label><Input type="number" value={style.paddingRight || ''} onChange={e => u('paddingRight', e.target.value)} className="text-xs h-9" placeholder="20" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-500 mb-1 block">{lang === 'ru' ? 'Отступ сверху' : 'Margin top'} (px)</label><Input type="number" value={style.marginTop || ''} onChange={e => u('marginTop', e.target.value)} className="text-xs h-9" placeholder="0" /></div>
          <div><label className="text-xs text-zinc-500 mb-1 block">{lang === 'ru' ? 'Отступ снизу' : 'Margin bottom'} (px)</label><Input type="number" value={style.marginBottom || ''} onChange={e => u('marginBottom', e.target.value)} className="text-xs h-9" placeholder="0" /></div>
        </div>
        <div><label className="text-xs text-zinc-500 mb-1 block">{lang === 'ru' ? 'Макс. ширина' : 'Max width'}</label><Input value={style.maxWidth || ''} onChange={e => u('maxWidth', e.target.value)} className="text-xs h-9" placeholder="1200px" /></div>
      </div>)}

      {tab === 'border' && (<div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-500 mb-1 block">{lang === 'ru' ? 'Скругление' : 'Radius'} (px)</label><Input type="number" value={style.borderRadius || ''} onChange={e => u('borderRadius', e.target.value)} className="text-xs h-9" placeholder="0" /></div>
          <div><label className="text-xs text-zinc-500 mb-1 block">{lang === 'ru' ? 'Толщина' : 'Width'} (px)</label><Input type="number" value={style.borderWidth || ''} onChange={e => u('borderWidth', e.target.value)} className="text-xs h-9" placeholder="0" /></div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500">{lang === 'ru' ? 'Цвет рамки' : 'Border color'}</label>
          <input type="color" value={style.borderColor || '#e4e4e7'} onChange={e => { u('borderColor', e.target.value); commit() }} className="w-8 h-8 rounded cursor-pointer" />
          <Input value={style.borderColor || ''} onChange={e => u('borderColor', e.target.value)} className="flex-1 text-xs h-9" />
        </div>
        <div><label className="text-xs text-zinc-500 mb-1 block">{lang === 'ru' ? 'Тень' : 'Shadow'}</label>
          <select value={style.boxShadow || ''} onChange={e => { u('boxShadow', e.target.value); setTimeout(commit, 0) }} className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-xs">
            <option value="">{lang === 'ru' ? 'Нет' : 'None'}</option>
            <option value="0 1px 3px rgba(0,0,0,0.1)">{lang === 'ru' ? 'Мягкая' : 'Soft'}</option>
            <option value="0 4px 12px rgba(0,0,0,0.1)">{lang === 'ru' ? 'Средняя' : 'Medium'}</option>
            <option value="0 8px 30px rgba(0,0,0,0.15)">{lang === 'ru' ? 'Сильная' : 'Strong'}</option>
            <option value="0 20px 60px rgba(0,0,0,0.2)">{lang === 'ru' ? 'Глубокая' : 'Deep'}</option>
          </select>
        </div>
      </div>)}

      {tab === 'css' && (<div className="space-y-3">
        <div><label className="text-xs text-zinc-500 mb-1 block">{lang === 'ru' ? 'CSS класс' : 'CSS class'}</label><Input value={style.cssClass || ''} onChange={e => u('cssClass', e.target.value)} className="text-xs h-9" placeholder="my-section" /></div>
        <div><label className="text-xs text-zinc-500 mb-1 block">{lang === 'ru' ? 'ID (якорь)' : 'HTML ID (anchor)'}</label><Input value={style.htmlId || ''} onChange={e => u('htmlId', e.target.value)} className="text-xs h-9" placeholder="section-about" /></div>
        <div><label className="text-xs text-zinc-500 mb-1 block">{lang === 'ru' ? 'Кастомный CSS' : 'Custom CSS'}</label>
          <textarea value={style.customCss || ''} onChange={e => u('customCss', e.target.value)} className="w-full p-2 text-xs font-mono border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-xl h-24 resize-y" placeholder=".my-section { opacity: 0.9; }" /></div>
      </div>)}
    </CardContent></Card>
  )
}
