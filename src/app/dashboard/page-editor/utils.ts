import React from 'react'
import type { SectionStyle } from './types'

/* ═══════════ UTILITIES ═══════════ */

/* Block style → inline CSS string */
export const styleToCSS = (s: SectionStyle): string => {
  const p: string[] = []
  if (s.bgGradient) p.push(`background:${s.bgGradient}`)
  else if (s.bgColor) p.push(`background-color:${s.bgColor}`)
  if (s.bgImage) p.push(`background-image:url(${s.bgImage});background-size:cover;background-position:center`)
  if (s.paddingTop) p.push(`padding-top:${s.paddingTop}px`)
  if (s.paddingBottom) p.push(`padding-bottom:${s.paddingBottom}px`)
  if (s.paddingLeft) p.push(`padding-left:${s.paddingLeft}px`)
  if (s.paddingRight) p.push(`padding-right:${s.paddingRight}px`)
  if (s.marginTop) p.push(`margin-top:${s.marginTop}px`)
  if (s.marginBottom) p.push(`margin-bottom:${s.marginBottom}px`)
  if (s.maxWidth) {
    p.push(`max-width:${s.maxWidth}`)
    if (!s.marginTop && !s.marginBottom) p.push('margin-left:auto;margin-right:auto')
    else p.push('margin-left:auto;margin-right:auto')
  }
  if (s.borderRadius) p.push(`border-radius:${s.borderRadius}px`)
  if (s.borderWidth && s.borderColor) p.push(`border:${s.borderWidth}px solid ${s.borderColor}`)
  if (s.boxShadow) p.push(`box-shadow:${s.boxShadow}`)
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
