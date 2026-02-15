'use client'
import React, { useState, useRef } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import type { FormField } from '@/lib/form-types'

/**
 * Dynamic form renderer.
 * Renders fields based on a FormField[] template.
 * Returns values as { [dbField || id]: value }
 */
type Props = {
  fields: FormField[]
  values: Record<string, any>
  onChange: (values: Record<string, any>) => void
  ru?: boolean
  disabled?: boolean
  uploadImage?: (file: File) => Promise<string>
}

export default function DynamicFormRenderer({ fields, values, onChange, ru = false, disabled = false, uploadImage }: Props) {
  const set = (key: string, val: any) => onChange({ ...values, [key]: val })

  return (
    <div className="space-y-5">
      {fields.map(field => {
        const key = field.dbField || field.id
        const label = ru ? field.labelRu : field.labelEn
        const val = values[key]

        return (
          <div key={field.id}>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">
              {label}{field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.type === 'text' && (
              <input
                type="text"
                value={val || ''}
                onChange={e => set(key, e.target.value)}
                placeholder={ru ? field.placeholderRu : field.placeholderEn}
                disabled={disabled}
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                value={val || ''}
                onChange={e => set(key, e.target.value)}
                placeholder={ru ? field.placeholderRu : field.placeholderEn}
                disabled={disabled}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            )}

            {field.type === 'number' && (
              <input
                type="number"
                step="any"
                value={val ?? ''}
                onChange={e => set(key, e.target.value === '' ? null : parseFloat(e.target.value))}
                disabled={disabled}
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            )}

            {field.type === 'date' && (
              <input
                type="date"
                value={val || ''}
                onChange={e => set(key, e.target.value)}
                disabled={disabled}
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            )}

            {field.type === 'scale' && (
              <ScaleField min={field.min || 1} max={field.max || 10} value={val} onChange={v => set(key, v)} disabled={disabled} />
            )}

            {field.type === 'select' && (
              <select
                value={val || ''}
                onChange={e => set(key, e.target.value)}
                disabled={disabled}
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="">{ru ? '— выберите —' : '— select —'}</option>
                {(field.options || []).map((opt, j) => (
                  <option key={j} value={opt.en}>{ru ? opt.ru : opt.en}</option>
                ))}
              </select>
            )}

            {field.type === 'toggle' && (
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-7 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${val ? 'bg-teal-500' : 'bg-zinc-300'}`}
                  onClick={() => !disabled && set(key, !val)}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${val ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-sm text-zinc-600">{val ? (ru ? 'Да' : 'Yes') : (ru ? 'Нет' : 'No')}</span>
              </div>
            )}

            {field.type === 'photo' && (
              <PhotoField value={val} onChange={v => set(key, v)} ru={ru} disabled={disabled} uploadImage={uploadImage} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════ Scale (1-10) ═══════════ */
function ScaleField({ min, max, value, onChange, disabled }: { min: number; max: number; value: number | null; onChange: (v: number) => void; disabled: boolean }) {
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  return (
    <div className="flex gap-1.5 flex-wrap">
      {nums.map(n => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={`w-10 h-10 rounded-xl border text-sm font-medium transition-colors ${
            value === n
              ? 'bg-teal-500 border-teal-500 text-white'
              : 'border-zinc-200 text-zinc-500 hover:bg-teal-50 hover:border-teal-400 hover:text-teal-600'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

/* ═══════════ Photo upload ═══════════ */
function PhotoField({ value, onChange, ru, disabled, uploadImage }: {
  value: string | null; onChange: (url: string | null) => void; ru: boolean; disabled: boolean
  uploadImage?: (file: File) => Promise<string>
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadImage) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      onChange(url)
    } catch { /* toast handled by parent */ }
    finally { setUploading(false) }
  }

  if (value) {
    return (
      <div className="relative w-40">
        <img src={value} alt="" className="w-40 h-40 object-cover rounded-xl" />
        {!disabled && (
          <button type="button" onClick={() => onChange(null)}
            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">✕</button>
        )}
      </div>
    )
  }

  return (
    <div
      className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 transition-colors"
      onClick={() => !disabled && ref.current?.click()}
    >
      {uploading ? <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto" /> : <Camera className="w-8 h-8 text-zinc-300 mx-auto mb-2" />}
      <p className="text-sm text-zinc-400">{ru ? 'Нажмите для загрузки' : 'Click to upload'}</p>
      <input ref={ref} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  )
}
