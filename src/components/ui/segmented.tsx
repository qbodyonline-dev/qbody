'use client'
import React from 'react'
import type { LucideIcon } from 'lucide-react'

export type SegmentedOption<T extends string> = {
  value: T
  label: string
  hint?: string
  icon?: LucideIcon
}

/**
 * Two-or-more-way switch. Used where a checkbox would hide what the other
 * state actually means — e.g. "public catalog" vs "selected clients only".
 */
export function Segmented<T extends string>({ value, onChange, options, className = '' }: {
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
  className?: string
}) {
  return (
    <div className={`grid gap-2 ${options.length === 2 ? 'sm:grid-cols-2' : ''} ${className}`}>
      {options.map((option) => {
        const active = option.value === value
        const Icon = option.icon
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`text-left px-4 py-3 rounded-xl border-2 transition-colors ${
              active
                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
            }`}
          >
            <span className={`flex items-center gap-2 text-sm font-medium ${
              active ? 'text-teal-700 dark:text-teal-300' : 'text-zinc-700 dark:text-zinc-300'
            }`}>
              {Icon && <Icon className="w-4 h-4 shrink-0" />}
              {option.label}
            </span>
            {option.hint && (
              <span className="block text-xs text-zinc-500 mt-1">{option.hint}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
