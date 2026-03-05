import React from 'react'
import type { SectionStyle } from './types'

/* ═══════════ UTILITIES ═══════════ */

/* Block style → inline CSS string */
/* Safely append 'px' only if the value is a plain number (no existing unit) */
const addPxIfNeeded = (v: string): string => /^\d+(\.\d+)?$/.test(v) ? `${v}px` : v

export const styleToCSS = (s: SectionStyle): string => {
  const p: string[] = []
  if (s.bgGradient) p.push(`background:${s.bgGradient}`)
  else if (s.bgColor) p.push(`background-color:${s.bgColor}`)
  if (s.bgImage) p.push(`background-image:url(${s.bgImage});background-size:cover;background-position:center`)
  if (s.paddingTop) p.push(`padding-top:${addPxIfNeeded(s.paddingTop)}`)
  if (s.paddingBottom) p.push(`padding-bottom:${addPxIfNeeded(s.paddingBottom)}`)
  if (s.paddingLeft) p.push(`padding-left:${addPxIfNeeded(s.paddingLeft)}`)
  if (s.paddingRight) p.push(`padding-right:${addPxIfNeeded(s.paddingRight)}`)
  if (s.marginTop) p.push(`margin-top:${addPxIfNeeded(s.marginTop)}`)
  if (s.marginBottom) p.push(`margin-bottom:${addPxIfNeeded(s.marginBottom)}`)
  if (s.maxWidth) {
    p.push(`max-width:${s.maxWidth}`)
    p.push('margin-left:auto;margin-right:auto')
  }
  if (s.borderRadius) p.push(`border-radius:${addPxIfNeeded(s.borderRadius)}`)
  if (s.borderWidth && s.borderColor) p.push(`border:${addPxIfNeeded(s.borderWidth)} solid ${s.borderColor}`)
  if (s.boxShadow) p.push(`box-shadow:${s.boxShadow}`)
  if (s.customCss) p.push(s.customCss)
  return p.join(';')
}

/* Block style → HTML attributes string */
export const styleAttrs = (s: SectionStyle): string => {
  let a = ''
  if (s.htmlId) a += ` id="${s.htmlId}"`
  if (s.cssClass) a += ` class="${s.cssClass}"`
  return a
}

/* Convert CSS string like "background-color:#fff;padding-top:60px" to React CSSProperties object */
export const parseCSStoObj = (css: string): React.CSSProperties => {
  const obj: Record<string, string> = {}
  css.split(';').forEach(pair => {
    const [k, ...rest] = pair.split(':')
    if (!k?.trim() || rest.length === 0) return
    const key = k.trim()
    const val = rest.join(':').trim()
    // Convert kebab-case to camelCase
    const camel = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    obj[camel] = val
  })
  return obj as React.CSSProperties
}
