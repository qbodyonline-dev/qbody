import type { FooterSectionData, FooterNavColumn, FooterSocialLink, FooterContactItem } from './types'
import { defaultFooterSectionData } from './defaults'
import type { TextStyle } from '../shared'

/* ═══════════ FOOTER PRO RENDERER ═══════════ */

function uid(): string { return 'ftr' + Math.random().toString(36).slice(2, 8) }

/** Safely merge section with defaults to prevent undefined crashes */
function safe(s: Partial<FooterSectionData>): FooterSectionData {
  return {
    ...defaultFooterSectionData,
    ...s,
    navColumns: s.navColumns ?? defaultFooterSectionData.navColumns,
    socialLinks: s.socialLinks ?? defaultFooterSectionData.socialLinks,
    contactItems: s.contactItems ?? defaultFooterSectionData.contactItems,
  }
}

/** Apply TextStyle to inline CSS string */
function ts(style?: TextStyle, defaultColor?: string): string {
  if (!style) return defaultColor ? `color:${defaultColor};` : ''
  const parts: string[] = []
  if (style.color || defaultColor) parts.push(`color:${style.color || defaultColor}`)
  if (style.fontSize) parts.push(`font-size:${style.fontSize}px`)
  if (style.fontWeight) parts.push(`font-weight:${style.fontWeight}`)
  if (style.fontFamily) parts.push(`font-family:${style.fontFamily}`)
  if (style.letterSpacing) parts.push(`letter-spacing:${style.letterSpacing}em`)
  if (style.textTransform) parts.push(`text-transform:${style.textTransform}`)
  return parts.join(';') + (parts.length ? ';' : '')
}

function bgCSS(s: FooterSectionData): string {
  if (s.bgType === 'gradient' && s.bgGradient) return `background:${s.bgGradient};`
  return `background:${s.bgColor || '#0a0a0a'};`
}

function logoHTML(s: FooterSectionData): string {
  if (s.logoImage) {
    return `<img src="${s.logoImage}" alt="${s.logoText || ''}" style="height:36px;object-fit:contain;" />`
  }
  const logoCSS = ts(s.logoStyle, s.textColor) || `color:${s.textColor};`
  return `<div style="display:flex;align-items:center;gap:10px;">
    <div style="width:36px;height:36px;border-radius:10px;background:${s.logoGradient || 'linear-gradient(135deg,#2dd4bf,#0d9488)'};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:16px;">${s.logoIcon || 'Q'}</div>
    <span style="font-weight:700;font-size:17px;letter-spacing:-0.02em;${logoCSS}">${s.logoText || ''}</span>
  </div>`
}

function socialHTML(s: FooterSectionData): string {
  if (!s.showSocial || !s.socialLinks.length) return ''
  const items = s.socialLinks.map(sl =>
    `<a href="${sl.url}" target="_blank" rel="noopener" title="${sl.label}" style="width:36px;height:36px;border-radius:10px;background:${s.borderColor};display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-size:16px;transition:background 0.2s;">${sl.icon}</a>`
  ).join('')
  return `<div style="display:flex;gap:8px;flex-wrap:wrap;">${items}</div>`
}

function contactHTML(s: FooterSectionData, lang: 'en' | 'ru'): string {
  if (!s.showContact || !s.contactItems.length) return ''
  const items = s.contactItems.map(c => {
    const t = lang === 'ru' ? c.textRu : c.text
    const inner = `<span style="margin-right:6px;">${c.icon}</span>${t}`
    if (c.link) return `<a href="${c.link}" style="display:flex;align-items:center;color:${s.mutedColor};text-decoration:none;font-size:13px;line-height:1.8;transition:color 0.2s;">${inner}</a>`
    return `<div style="display:flex;align-items:center;color:${s.mutedColor};font-size:13px;line-height:1.8;">${inner}</div>`
  }).join('')
  return `<div>${items}</div>`
}

function navColHTML(col: FooterNavColumn, lang: 'en' | 'ru', s: FooterSectionData): string {
  const title = lang === 'ru' ? col.titleRu : col.title
  const links = (col.links || []).map(l => {
    const t = lang === 'ru' ? l.labelRu : l.label
    return `<a href="${l.href || '#'}" style="display:block;color:${s.mutedColor};text-decoration:none;font-size:13px;line-height:2;transition:color 0.2s;">${t}</a>`
  }).join('')
  const headCSS = ts(s.headingStyle, s.textColor) || `color:${s.textColor};`
  return `<div>
    <div style="font-weight:600;font-size:13px;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.05em;${headCSS}">${title}</div>
    ${links}
  </div>`
}

function copyrightHTML(s: FooterSectionData, lang: 'en' | 'ru'): string {
  const t = lang === 'ru' ? s.copyrightTextRu : s.copyrightText
  return `<div style="border-top:1px solid ${s.borderColor};padding-top:20px;margin-top:32px;font-size:12px;color:${s.mutedColor};text-align:center;">${t}</div>`
}

function ctaBarHTML(s: FooterSectionData, lang: 'en' | 'ru'): string {
  if (!s.showCta) return ''
  const t = lang === 'ru' ? s.ctaTitleRu : s.ctaTitle
  const sub = lang === 'ru' ? s.ctaSubtitleRu : s.ctaSubtitle
  const btn = lang === 'ru' ? s.ctaBtnTextRu : s.ctaBtnText
  return `<div class="ftr-cta" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:20px;padding:28px 32px;border-radius:16px;background:${s.accentColor}15;border:1px solid ${s.accentColor}30;margin-bottom:40px;">
    <div style="flex:1;min-width:240px;">
      <div style="font-size:18px;font-weight:700;color:${s.textColor};margin-bottom:4px;">${t}</div>
      ${sub ? `<div style="font-size:13px;color:${s.mutedColor};">${sub}</div>` : ''}
    </div>
    <a href="${s.ctaBtnLink || '#'}" style="display:inline-flex;align-items:center;padding:12px 28px;border-radius:12px;background:${s.accentColor};color:#fff;font-weight:600;font-size:14px;text-decoration:none;transition:opacity 0.2s;">${btn}</a>
  </div>`
}

/* ─── Layout 1: SIMPLE ─── centered logo + desc + socials + copyright */
function renderSimple(s: FooterSectionData, lang: 'en' | 'ru'): string {
  const desc = lang === 'ru' ? s.descriptionRu : s.description
  const descCSS = ts(s.descStyle, s.mutedColor) || `color:${s.mutedColor};`
  return `<div style="text-align:center;max-width:${s.innerMaxWidth}px;margin:0 auto;padding:${s.paddingY}px 24px;">
    <div style="display:flex;justify-content:center;margin-bottom:16px;">${logoHTML(s)}</div>
    ${desc ? `<p style="font-size:14px;max-width:400px;margin:0 auto 20px;line-height:1.6;${descCSS}">${desc}</p>` : ''}
    ${s.showSocial ? `<div style="display:flex;justify-content:center;margin-bottom:8px;">${socialHTML(s)}</div>` : ''}
    ${s.showContact && s.contactItems?.length ? `<div style="display:flex;justify-content:center;flex-wrap:wrap;gap:16px;margin-top:16px;">${s.contactItems.map(c => {
      const t = lang === 'ru' ? c.textRu : c.text
      return c.link
        ? `<a href="${c.link}" style="color:${s.mutedColor};text-decoration:none;font-size:13px;">${c.icon} ${t}</a>`
        : `<span style="color:${s.mutedColor};font-size:13px;">${c.icon} ${t}</span>`
    }).join('')}</div>` : ''}
    ${copyrightHTML(s, lang)}
  </div>`
}

/* ─── Layout 2: COLUMNS ─── logo+desc left, nav columns right */
function renderColumns(s: FooterSectionData, lang: 'en' | 'ru'): string {
  const desc = lang === 'ru' ? s.descriptionRu : s.description
  const descCSS = ts(s.descStyle, s.mutedColor) || `color:${s.mutedColor};`
  const cols = s.showNav && s.navColumns.length > 0 ? s.navColumns : []
  const navCols = cols.map(c => navColHTML(c, lang, s)).join('')
  const gridCols = cols.length > 0 ? `1.5fr repeat(${cols.length},1fr)` : '1fr'
  return `<div style="max-width:${s.innerMaxWidth}px;margin:0 auto;padding:${s.paddingY}px 24px;">
    ${ctaBarHTML(s, lang)}
    <div class="ftr-grid" style="display:grid;grid-template-columns:${gridCols};gap:40px;">
      <div>
        ${logoHTML(s)}
        ${desc ? `<p style="font-size:13px;margin-top:14px;line-height:1.7;max-width:280px;${descCSS}">${desc}</p>` : ''}
        <div style="margin-top:20px;">${socialHTML(s)}</div>
        ${s.showContact ? `<div style="margin-top:20px;">${contactHTML(s, lang)}</div>` : ''}
      </div>
      ${navCols}
    </div>
    ${copyrightHTML(s, lang)}
  </div>`
}

/* ─── Layout 3: MINIMAL ─── single row: logo left, links center, copyright right */
function renderMinimal(s: FooterSectionData, lang: 'en' | 'ru'): string {
  const copy = lang === 'ru' ? s.copyrightTextRu : s.copyrightText
  const flatLinks = s.showNav ? s.navColumns.flatMap(c => c.links || []).slice(0, 6) : []
  const linksHtml = flatLinks.map(l => {
    const t = lang === 'ru' ? l.labelRu : l.label
    return `<a href="${l.href}" style="color:${s.mutedColor};text-decoration:none;font-size:13px;transition:color 0.2s;">${t}</a>`
  }).join('')
  return `<div style="max-width:${s.innerMaxWidth}px;margin:0 auto;padding:${Math.max(s.paddingY * 0.6, 24)}px 24px;">
    <div class="ftr-minimal" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
      ${logoHTML(s)}
      ${linksHtml ? `<div style="display:flex;gap:24px;flex-wrap:wrap;">${linksHtml}</div>` : ''}
      <div style="display:flex;align-items:center;gap:16px;">
        ${s.showSocial ? socialHTML(s) : ''}
      </div>
    </div>
    <div style="border-top:1px solid ${s.borderColor};padding-top:16px;margin-top:20px;font-size:12px;color:${s.mutedColor};text-align:center;">${copy}</div>
  </div>`
}

/* ─── Layout 4: CTA-FOOTER ─── CTA bar on top + columns footer */
function renderCtaFooter(s: FooterSectionData, lang: 'en' | 'ru'): string {
  // Force showCta for this layout
  const sWithCta = { ...s, showCta: true }
  return renderColumns(sWithCta, lang)
}

/* ─── Layout 5: BIG ─── large footer: logo+desc+socials row, then nav columns, then contact + copyright */
function renderBig(s: FooterSectionData, lang: 'en' | 'ru'): string {
  const desc = lang === 'ru' ? s.descriptionRu : s.description
  const descCSS = ts(s.descStyle, s.mutedColor) || `color:${s.mutedColor};`
  const cols = s.showNav && s.navColumns.length > 0 ? s.navColumns : []
  const navCols = cols.map(c => navColHTML(c, lang, s)).join('')
  return `<div style="max-width:${s.innerMaxWidth}px;margin:0 auto;padding:${s.paddingY}px 24px;">
    ${ctaBarHTML(s, lang)}
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:24px;margin-bottom:40px;padding-bottom:32px;border-bottom:1px solid ${s.borderColor};">
      <div style="max-width:360px;">
        ${logoHTML(s)}
        ${desc ? `<p style="font-size:13px;margin-top:14px;line-height:1.7;${descCSS}">${desc}</p>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:12px;">
        ${socialHTML(s)}
        ${s.showContact ? contactHTML(s, lang) : ''}
      </div>
    </div>
    ${navCols ? `<div class="ftr-nav-grid" style="display:grid;grid-template-columns:repeat(${cols.length},1fr);gap:32px;">${navCols}</div>` : ''}
    ${copyrightHTML(s, lang)}
  </div>`
}

/* ─── Layout 6: SPLIT ─── left: branding, right: nav + contact */
function renderSplit(s: FooterSectionData, lang: 'en' | 'ru'): string {
  const desc = lang === 'ru' ? s.descriptionRu : s.description
  const descCSS = ts(s.descStyle, s.mutedColor) || `color:${s.mutedColor};`
  const cols = s.showNav && s.navColumns.length > 0 ? s.navColumns : []
  const navCols = cols.map(c => navColHTML(c, lang, s)).join('')
  return `<div style="max-width:${s.innerMaxWidth}px;margin:0 auto;padding:${s.paddingY}px 24px;">
    ${ctaBarHTML(s, lang)}
    <div class="ftr-split" style="display:grid;grid-template-columns:1fr 1fr;gap:60px;">
      <div style="display:flex;flex-direction:column;justify-content:space-between;">
        <div>
          ${logoHTML(s)}
          ${desc ? `<p style="font-size:13px;margin-top:14px;line-height:1.7;max-width:320px;${descCSS}">${desc}</p>` : ''}
          <div style="margin-top:24px;">${socialHTML(s)}</div>
        </div>
        ${s.showContact ? `<div style="margin-top:24px;">${contactHTML(s, lang)}</div>` : ''}
      </div>
      ${navCols ? `<div class="ftr-nav-right" style="display:grid;grid-template-columns:repeat(${Math.min(cols.length, 3)},1fr);gap:24px;">${navCols}</div>` : ''}
    </div>
    ${copyrightHTML(s, lang)}
  </div>`
}

/* ═══════════ MAIN RENDER ═══════════ */
export function renderFooter2HTML(section: FooterSectionData | Partial<FooterSectionData>, lang: 'en' | 'ru'): string {
  const s = safe(section as Partial<FooterSectionData>)
  const id = uid()
  const renderers: Record<string, (s: FooterSectionData, l: 'en' | 'ru') => string> = {
    simple: renderSimple,
    columns: renderColumns,
    minimal: renderMinimal,
    'cta-footer': renderCtaFooter,
    big: renderBig,
    split: renderSplit,
  }
  const render = renderers[s.layout] || renderColumns
  const body = render(s, lang)

  const css = `<style>
#${id} a:hover{opacity:0.8;}
@media(max-width:768px){
  #${id} .ftr-grid{grid-template-columns:1fr !important;gap:32px !important;}
  #${id} .ftr-split{grid-template-columns:1fr !important;gap:32px !important;}
  #${id} .ftr-nav-grid{grid-template-columns:repeat(2,1fr) !important;gap:24px !important;}
  #${id} .ftr-nav-right{grid-template-columns:repeat(2,1fr) !important;gap:24px !important;}
  #${id} .ftr-minimal{flex-direction:column !important;text-align:center !important;align-items:center !important;}
  #${id} .ftr-cta{flex-direction:column !important;text-align:center !important;align-items:center !important;}
}
@media(max-width:480px){
  #${id} .ftr-nav-grid{grid-template-columns:1fr !important;}
  #${id} .ftr-nav-right{grid-template-columns:1fr !important;}
}
</style>`

  return `${css}<div id="${id}" style="${bgCSS(s)}color:${s.textColor};">${body}</div>`
}
