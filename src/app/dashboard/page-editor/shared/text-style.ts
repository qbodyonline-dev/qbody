/* ═══════════ SHARED TEXT STYLE TYPES & HELPERS ═══════════ */

export type TextAlign = 'left' | 'center' | 'right'

export interface TextStyle {
  align?: TextAlign
  color?: string
  size?: number       // px
}

/** Default text styles for common section elements */
export const defaultTextStyle = (): TextStyle => ({ align: undefined, color: undefined, size: undefined })

/** Convert TextStyle to inline CSS string */
export function textStyleCSS(ts?: TextStyle, fallbackColor?: string): string {
  if (!ts) return fallbackColor ? `color:${fallbackColor};` : ''
  const parts: string[] = []
  if (ts.align) parts.push(`text-align:${ts.align}`)
  if (ts.color) parts.push(`color:${ts.color}`)
  else if (fallbackColor) parts.push(`color:${fallbackColor}`)
  if (ts.size) parts.push(`font-size:${ts.size}px`)
  return parts.join(';') + (parts.length ? ';' : '')
}

/** Merge TextStyle into existing inline style string */
export function mergeTextStyle(existingStyle: string, ts?: TextStyle, fallbackColor?: string): string {
  const extra = textStyleCSS(ts, fallbackColor)
  if (!extra) return existingStyle
  let s = existingStyle
  if (ts?.align) s = s.replace(/text-align:[^;]+;?/g, '')
  if (ts?.color) s = s.replace(/(?<![a-z-])color:[^;]+;?/g, '')
  if (ts?.size) s = s.replace(/font-size:[^;]+;?/g, '')
  return (s + extra).replace(/;;+/g, ';')
}
