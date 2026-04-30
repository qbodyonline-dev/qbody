import type { FaqSectionData, FaqItem } from './types'

/* ═══════════ FAQ PRO RENDERER ═══════════ */

function uid(): string { return 'fq' + Math.random().toString(36).slice(2, 8) }

function bgCSS(s: FaqSectionData): string {
  if (s.bgType === 'image' && s.bgImage) return `background:url('${s.bgImage}') center/cover no-repeat;`
  if (s.bgType === 'gradient') return `background:${s.bgGradient};`
  return `background:${s.bgColor || '#0a0a0a'};`
}

function animCSS(id: string, anim: string): string {
  if (anim === 'none') return ''
  const kfs: Record<string, string> = {
    'fade-up': `@keyframes ${id}A{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}`,
    'slide-in': `@keyframes ${id}A{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}`,
    'scale-up': `@keyframes ${id}A{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}`,
  }
  return `${kfs[anim] || ''}\n#${id} .fq-anim{opacity:0;animation:${id}A 0.6s ease forwards;}\n#${id} .fq-anim:nth-child(1){animation-delay:0.05s;}#${id} .fq-anim:nth-child(2){animation-delay:0.1s;}#${id} .fq-anim:nth-child(3){animation-delay:0.15s;}#${id} .fq-anim:nth-child(4){animation-delay:0.2s;}#${id} .fq-anim:nth-child(5){animation-delay:0.25s;}#${id} .fq-anim:nth-child(6){animation-delay:0.3s;}#${id} .fq-anim:nth-child(7){animation-delay:0.35s;}#${id} .fq-anim:nth-child(8){animation-delay:0.4s;}`
}

function sectionHeader(s: FaqSectionData, lang: 'en' | 'ru', align: string = 'center'): string {
  const title = lang === 'ru' ? s.titleRu : s.title
  const sub = lang === 'ru' ? s.subtitleRu : s.subtitle
  const badge = lang === 'ru' ? s.badgeRu : s.badge
  const accent = s.accentColor || '#2dd4bf'
  const txt = s.textColor || '#fafafa'
  const v = s.titleVariant
  const bts = s.badgeStyle || {}, tts = s.titleStyle || {}, sts = s.subtitleStyle || {}
  const bSz = bts.size ? `font-size:${bts.size}px;` : 'font-size:13px;'
  const bCl = bts.color ? `color:${bts.color};` : `color:${accent};`
  const bAl = bts.align || align

  let badgeH = ''
  if (badge && v === 'badge') badgeH = `<div style="text-align:${bAl};"><div style="display:inline-block;padding:6px 16px;border-radius:50px;background:${accent}22;${bSz}font-weight:700;margin-bottom:12px;${bCl}">${badge}</div></div>`
  if (v === 'accent-line') badgeH = `<div style="width:48px;height:4px;background:${accent};border-radius:2px;margin-bottom:12px;${align === 'center' ? 'margin-left:auto;margin-right:auto;' : ''}"></div>`

  const tA = tts.align || align, sA = sts.align || align
  const tC = tts.color || txt, sC = sts.color || txt
  const tSz = tts.size ? `font-size:${tts.size}px;` : 'font-size:clamp(26px,4vw,40px);'
  const sSz = sts.size ? `font-size:${sts.size}px;` : 'font-size:clamp(14px,2vw,17px);'

  const titleCss = v === 'gradient-text'
    ? `background:linear-gradient(135deg,${tC},${accent});-webkit-background-clip:text;-webkit-text-fill-color:transparent;`
    : `color:${tC};`

  return `<div style="text-align:${align};margin-bottom:clamp(32px,4vw,48px);">
    ${badgeH}
    ${title ? `<h2 style="${tSz}font-weight:800;letter-spacing:-0.03em;line-height:1.15;${titleCss}text-align:${tA};">${title}</h2>` : ''}
    ${sub ? `<p style="${sSz}color:${sC};opacity:0.6;margin-top:12px;max-width:600px;text-align:${sA};${sA === 'center' ? 'margin-left:auto;margin-right:auto;' : ''}">${sub}</p>` : ''}
  </div>`
}

function prefix(s: FaqSectionData, i: number, item: FaqItem): string {
  if (s.showIcons && item.icon) return `<span style="font-size:18px;flex-shrink:0;">${item.icon}</span>`
  if (s.showNumbers) return `<span style="font-size:13px;font-weight:700;color:${s.accentColor || '#2dd4bf'};flex-shrink:0;width:24px;text-align:center;">${String(i + 1).padStart(2, '0')}</span>`
  return ''
}

function qStyle(s: FaqSectionData, fallbackSz: string): string {
  const qs = s.questionStyle || {}
  const sz = qs.size ? `font-size:${qs.size}px;` : `font-size:${fallbackSz};`
  const cl = qs.color ? `color:${qs.color};` : `color:${s.textColor || '#fafafa'};`
  const al = qs.align ? `text-align:${qs.align};` : ''
  return `${sz}${cl}${al}`
}

function aStyle(s: FaqSectionData, fallbackSz: string, opacSuffix: string = 'aa'): string {
  const as2 = s.answerStyle || {}
  const sz = as2.size ? `font-size:${as2.size}px;` : `font-size:${fallbackSz};`
  const cl = as2.color ? `color:${as2.color};` : `color:${(s.textColor || '#fafafa')}${opacSuffix};`
  const al = as2.align ? `text-align:${as2.align};` : ''
  return `${sz}line-height:1.7;${cl}${al}`
}

/* ─── ACCORDION ─── */
function renderAccordion(s: FaqSectionData, lang: 'en' | 'ru', id: string): string {
  const accent = s.accentColor || '#2dd4bf'
  const txt = s.textColor || '#fafafa'
  const items = s.items.map((item, i) => {
    const q = lang === 'ru' ? item.questionRu : item.question
    const a = lang === 'ru' ? item.answerRu : item.answer
    const open = s.defaultOpen === i
    return `<div class="fq-anim fq-acc" data-faq-idx="${i}" style="border-bottom:1px solid ${txt}11;">
      <button type="button" class="fq-acc-btn" data-faq-toggle="1" style="width:100%;display:flex;align-items:center;gap:14px;padding:20px 0;background:none;border:none;cursor:pointer;text-align:left;">
        ${prefix(s, i, item)}
        <span style="flex:1;${qStyle(s, 'clamp(15px,2vw,17px)')}font-weight:600;">${q}</span>
        <span class="fq-acc-icon" style="font-size:20px;color:${accent};transition:transform 0.3s;flex-shrink:0;${open ? 'transform:rotate(45deg);' : ''}">+</span>
      </button>
      <div class="fq-acc-body" style="max-height:${open ? '500px' : '0px'};opacity:${open ? '1' : '0'};overflow:hidden;transition:max-height 0.35s ease,opacity 0.3s ease;">
        <p style="padding:0 0 20px ${s.showNumbers || (s.showIcons && item.icon) ? '38px' : '0'};${aStyle(s, '15px')}">${a}</p>
      </div>
    </div>`
  }).join('')
  return `<div style="max-width:${s.innerMaxWidth}px;margin:0 auto;">${sectionHeader(s, lang, 'center')}${items}</div>`
}

/* ─── CARDS ─── */
function renderCards(s: FaqSectionData, lang: 'en' | 'ru', id: string): string {
  const accent = s.accentColor || '#2dd4bf'
  const txt = s.textColor || '#fafafa'
  const cardBg = s.cardBg || '#171717'
  const items = s.items.map((item, i) => {
    const q = lang === 'ru' ? item.questionRu : item.question
    const a = lang === 'ru' ? item.answerRu : item.answer
    return `<div class="fq-anim fq-card" style="background:${cardBg};border:1px solid ${txt}0d;border-radius:20px;padding:clamp(24px,3vw,32px);transition:transform 0.3s,box-shadow 0.3s;">
      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
        ${prefix(s, i, item)}
        <h3 style="${qStyle(s, '16px')}font-weight:700;line-height:1.4;">${q}</h3>
      </div>
      <p style="${aStyle(s, '14px', '99')}${s.showNumbers || (s.showIcons && item.icon) ? 'padding-left:36px;' : ''}">${a}</p>
    </div>`
  }).join('')
  return `<div style="max-width:${s.innerMaxWidth + 200}px;margin:0 auto;">${sectionHeader(s, lang, 'center')}<div class="fq-cards-grid" style="display:grid;grid-template-columns:repeat(${s.columns},1fr);gap:20px;">${items}</div></div>`
}

/* ─── TWO COLUMN ─── */
function renderTwocol(s: FaqSectionData, lang: 'en' | 'ru', id: string): string {
  const accent = s.accentColor || '#2dd4bf'
  const txt = s.textColor || '#fafafa'
  const items = s.items.map((item, i) => {
    const q = lang === 'ru' ? item.questionRu : item.question
    const a = lang === 'ru' ? item.answerRu : item.answer
    return `<div class="fq-anim" style="padding:24px 0;border-bottom:1px solid ${txt}0d;">
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;">
        ${prefix(s, i, item)}
        <h3 style="${qStyle(s, '15px')}font-weight:700;">${q}</h3>
      </div>
      <p style="${aStyle(s, '14px', '88')}${s.showNumbers || (s.showIcons && item.icon) ? 'padding-left:34px;' : ''}">${a}</p>
    </div>`
  }).join('')
  return `<div style="max-width:${s.innerMaxWidth + 200}px;margin:0 auto;">${sectionHeader(s, lang, 'center')}<div class="fq-twocol" style="display:grid;grid-template-columns:1fr 1fr;gap:0 48px;">${items}</div></div>`
}

/* ─── SIDE BY SIDE ─── */
function renderSidebyside(s: FaqSectionData, lang: 'en' | 'ru', id: string): string {
  const accent = s.accentColor || '#2dd4bf'
  const txt = s.textColor || '#fafafa'
  const items = s.items.map((item, i) => {
    const q = lang === 'ru' ? item.questionRu : item.question
    const a = lang === 'ru' ? item.answerRu : item.answer
    const open = s.defaultOpen === i
    return `<div class="fq-anim fq-acc" data-faq-idx="${i}" style="border-bottom:1px solid ${txt}11;">
      <button type="button" class="fq-acc-btn" data-faq-toggle="1" style="width:100%;display:flex;align-items:center;gap:14px;padding:18px 0;background:none;border:none;cursor:pointer;text-align:left;">
        ${prefix(s, i, item)}
        <span style="flex:1;${qStyle(s, '15px')}font-weight:600;">${q}</span>
        <span class="fq-acc-icon" style="font-size:18px;color:${accent};transition:transform 0.3s;flex-shrink:0;${open ? 'transform:rotate(45deg);' : ''}">+</span>
      </button>
      <div class="fq-acc-body" style="max-height:${open ? '500px' : '0px'};opacity:${open ? '1' : '0'};overflow:hidden;transition:max-height 0.35s ease,opacity 0.3s ease;">
        <p style="padding:0 0 18px ${s.showNumbers || (s.showIcons && item.icon) ? '38px' : '0'};${aStyle(s, '14px')}">${a}</p>
      </div>
    </div>`
  }).join('')

  return `<div class="fq-side" style="display:grid;grid-template-columns:1fr 1.5fr;gap:48px;max-width:${s.innerMaxWidth + 100}px;margin:0 auto;align-items:start;">
    <div style="position:sticky;top:112px;">${sectionHeader(s, lang, 'left')}</div>
    <div>${items}</div>
  </div>`
}

/* ═══════════ MAIN RENDER ═══════════ */
export function renderFaq2HTML(section: FaqSectionData, lang: 'en' | 'ru'): string {
  const id = uid()
  const renderers: Record<string, (s: FaqSectionData, l: 'en' | 'ru', id: string) => string> = {
    accordion: renderAccordion,
    cards: renderCards,
    twocol: renderTwocol,
    sidebyside: renderSidebyside,
  }
  const render = renderers[section.layout] || renderAccordion
  const body = render(section, lang, id)

  const css = `<style>
${animCSS(id, section.animation)}
#${id} .fq-card:hover{transform:translateY(-4px);box-shadow:0 16px 40px -12px rgba(0,0,0,0.4);}
#${id} .fq-acc-btn:hover{opacity:0.85;}
@media(max-width:768px){
  #${id} .fq-cards-grid{grid-template-columns:1fr !important;}
  #${id} .fq-twocol{grid-template-columns:1fr !important;}
  #${id} .fq-side{grid-template-columns:1fr !important;}
  #${id} .fq-side>div:first-child{position:static !important;text-align:center;}
}
</style>`

  return `${css}<div id="${id}" style="padding:clamp(48px,8vw,100px) clamp(16px,4vw,24px);${bgCSS(section)};color:${section.textColor || '#fafafa'};">${body}</div>`
}
