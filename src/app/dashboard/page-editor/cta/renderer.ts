import type { CtaSectionData, CtaButton, CtaBtnStyle } from './types'

/* ═══════════ CTA PRO RENDERER ═══════════ */

function uid(): string { return 'cta' + Math.random().toString(36).slice(2, 8) }

function bgCSS(s: CtaSectionData): string {
  if (s.bgType === 'image' && s.bgImage) return `background:url('${s.bgImage}') center/cover no-repeat;`
  if (s.bgType === 'gradient') return `background:${s.bgGradient};`
  return `background:${s.bgColor || '#0d9488'};`
}

function btnHTML(btn: CtaButton, lang: 'en' | 'ru', s: CtaSectionData): string {
  const t = lang === 'ru' ? btn.textRu : btn.text
  if (!t) return ''
  const accent = s.accentColor || '#2dd4bf'
  const styles: Record<CtaBtnStyle, string> = {
    'solid-white': 'background:#fff;color:#0a0a0a;',
    'solid-dark': 'background:#0a0a0a;color:#fff;',
    'solid-accent': `background:${accent};color:#fff;`,
    'outline-white': 'background:transparent;color:#fff;border:2px solid rgba(255,255,255,0.4);',
    'outline-accent': `background:transparent;color:${accent};border:2px solid ${accent};`,
    'ghost': 'background:transparent;color:#fff;text-decoration:underline;padding:12px 16px !important;',
  }
  return `<a href="${btn.link || '#'}" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 32px;border-radius:14px;font-size:15px;font-weight:700;text-decoration:none;transition:transform 0.2s,opacity 0.2s;${styles[btn.style] || styles['solid-white']}">${t}</a>`
}

function featuresHTML(s: CtaSectionData, lang: 'en' | 'ru'): string {
  if (!s.showFeatures || !s.features.length) return ''
  const items = s.features.map(f => {
    const t = lang === 'ru' ? f.textRu : f.text
    return `<span style="display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:500;opacity:0.85;"><span>${f.icon}</span>${t}</span>`
  }).join('')
  return `<div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:20px;">${items}</div>`
}

function animCSS(id: string, anim: string): string {
  if (anim === 'none') return ''
  const kfs: Record<string, string> = {
    'fade-up': `@keyframes ${id}F{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}`,
    'pulse': `@keyframes ${id}F{0%{transform:scale(1)}50%{transform:scale(1.02)}100%{transform:scale(1)}}`,
    'slide-in': `@keyframes ${id}F{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}`,
  }
  const dur = anim === 'pulse' ? '2s ease infinite' : '0.7s ease forwards'
  const opac = anim === 'pulse' ? '' : 'opacity:0;'
  return `${kfs[anim] || ''}\n#${id} .cta-anim{${opac}animation:${id}F ${dur};}`
}

function badgeHTML(s: CtaSectionData, lang: 'en' | 'ru'): string {
  const t = lang === 'ru' ? s.badgeRu : s.badge
  if (!t) return ''
  return `<div style="display:inline-block;padding:6px 16px;border-radius:50px;background:rgba(255,255,255,0.15);backdrop-filter:blur(8px);font-size:13px;font-weight:600;margin-bottom:16px;">${t}</div>`
}

function titleBlock(s: CtaSectionData, lang: 'en' | 'ru', align: string = 'center'): string {
  const title = lang === 'ru' ? s.titleRu : s.title
  const sub = lang === 'ru' ? s.subtitleRu : s.subtitle
  const desc = lang === 'ru' ? s.descriptionRu : s.description
  const txt = s.textColor || '#fff'
  return `
    ${badgeHTML(s, lang)}
    ${title ? `<h2 style="font-size:clamp(26px,4vw,42px);font-weight:800;letter-spacing:-0.03em;line-height:1.15;color:${txt};margin-bottom:12px;text-align:${align};">${title}</h2>` : ''}
    ${sub ? `<p style="font-size:clamp(15px,2vw,18px);line-height:1.6;color:${txt};opacity:0.85;max-width:600px;${align === 'center' ? 'margin:0 auto 24px;' : 'margin-bottom:24px;'}text-align:${align};">${sub}</p>` : ''}
    ${desc ? `<p style="font-size:14px;line-height:1.6;color:${txt};opacity:0.7;max-width:500px;${align === 'center' ? 'margin:0 auto 20px;' : 'margin-bottom:20px;'}text-align:${align};">${desc}</p>` : ''}`
}

function buttonsHTML(s: CtaSectionData, lang: 'en' | 'ru', justify: string = 'center'): string {
  const b1 = btnHTML(s.btn1, lang, s)
  const b2 = s.showBtn2 ? btnHTML(s.btn2, lang, s) : ''
  if (!b1 && !b2) return ''
  return `<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:${justify};margin-top:8px;">${b1}${b2}</div>`
}

/* ─── BANNER ─── */
function renderBanner(s: CtaSectionData, lang: 'en' | 'ru', id: string): string {
  return `<div class="cta-anim" style="text-align:center;max-width:${s.innerMaxWidth}px;margin:0 auto;padding:${s.paddingY}px 24px;">
    ${titleBlock(s, lang, 'center')}
    ${buttonsHTML(s, lang, 'center')}
    ${featuresHTML(s, lang)}
  </div>`
}

/* ─── SPLIT ─── */
function renderSplit(s: CtaSectionData, lang: 'en' | 'ru', id: string): string {
  const imgSide = s.image
    ? `<div class="cta-img-col" style="flex:1;min-width:280px;"><img src="${s.image}" alt="" style="width:100%;border-radius:20px;object-fit:cover;max-height:400px;" /></div>`
    : `<div class="cta-img-col" style="flex:1;min-width:280px;display:flex;align-items:center;justify-content:center;"><div style="width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:64px;">🚀</div></div>`
  const textSide = `<div class="cta-anim" style="flex:1;min-width:280px;display:flex;flex-direction:column;justify-content:center;">
    ${titleBlock(s, lang, 'left')}
    ${buttonsHTML(s, lang, 'flex-start')}
    ${featuresHTML(s, lang).replace('justify-content:center', 'justify-content:flex-start')}
  </div>`
  const left = s.imagePosition === 'left' ? imgSide : textSide
  const right = s.imagePosition === 'left' ? textSide : imgSide
  return `<div class="cta-split" style="display:flex;flex-wrap:wrap;gap:48px;align-items:center;max-width:${s.innerMaxWidth}px;margin:0 auto;padding:${s.paddingY}px 24px;">${left}${right}</div>`
}

/* ─── MINIMAL ─── */
function renderMinimal(s: CtaSectionData, lang: 'en' | 'ru', id: string): string {
  const accent = s.accentColor || '#2dd4bf'
  return `<div class="cta-anim" style="max-width:${Math.min(s.innerMaxWidth, 800)}px;margin:0 auto;padding:${s.paddingY}px 24px;">
    <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:24px;padding:clamp(28px,4vw,48px);border-radius:${s.borderRadius}px;border:2px solid ${accent}44;background:rgba(255,255,255,0.03);">
      <div style="flex:1;min-width:240px;">
        ${badgeHTML(s, lang)}
        <h2 style="font-size:clamp(20px,3vw,28px);font-weight:800;letter-spacing:-0.02em;color:${s.textColor || '#fff'};margin-bottom:8px;">${lang === 'ru' ? s.titleRu : s.title}</h2>
        ${s.subtitle || s.subtitleRu ? `<p style="font-size:15px;color:${s.textColor || '#fff'};opacity:0.7;">${lang === 'ru' ? s.subtitleRu : s.subtitle}</p>` : ''}
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        ${btnHTML(s.btn1, lang, s)}
        ${s.showBtn2 ? btnHTML(s.btn2, lang, s) : ''}
      </div>
    </div>
    ${featuresHTML(s, lang)}
  </div>`
}

/* ─── FULLWIDTH ─── */
function renderFullwidth(s: CtaSectionData, lang: 'en' | 'ru', id: string): string {
  const overlay = s.bgType === 'image' && s.bgImage
    ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,${s.overlayOpacity});z-index:0;"></div>`
    : ''
  return `<div style="position:relative;overflow:hidden;min-height:360px;display:flex;align-items:center;justify-content:center;">
    ${overlay}
    <div class="cta-anim" style="position:relative;z-index:1;text-align:center;max-width:${s.innerMaxWidth}px;padding:${s.paddingY}px 24px;">
      ${titleBlock(s, lang, 'center')}
      ${buttonsHTML(s, lang, 'center')}
      ${featuresHTML(s, lang)}
    </div>
  </div>`
}

/* ═══════════ MAIN RENDER ═══════════ */
export function renderCta2HTML(section: CtaSectionData, lang: 'en' | 'ru'): string {
  const id = uid()
  const renderers: Record<string, (s: CtaSectionData, l: 'en' | 'ru', id: string) => string> = {
    banner: renderBanner,
    split: renderSplit,
    minimal: renderMinimal,
    fullwidth: renderFullwidth,
  }
  const render = renderers[section.layout] || renderBanner
  const body = render(section, lang, id)

  const css = `<style>
${animCSS(id, section.animation)}
#${id} a:hover{transform:translateY(-2px);opacity:0.9;}
@media(max-width:768px){
  #${id} .cta-split{flex-direction:column !important;text-align:center;}
  #${id} .cta-split>div{min-width:100% !important;}
  #${id} .cta-img-col img{max-height:280px !important;}
}
</style>`

  const bgStyle = section.layout === 'fullwidth' && section.bgType === 'image' && section.bgImage
    ? `background:url('${section.bgImage}') center/cover no-repeat;`
    : bgCSS(section)

  const radius = section.layout === 'fullwidth' ? '0' : `${section.borderRadius}px`
  const margin = section.layout === 'fullwidth' ? '0' : '0 auto'

  return `${css}<div id="${id}" style="${bgStyle}border-radius:${radius};color:${section.textColor || '#fff'};overflow:hidden;${margin === '0' ? '' : `max-width:${section.innerMaxWidth + 48}px;margin:${margin};`}">${body}</div>`
}
