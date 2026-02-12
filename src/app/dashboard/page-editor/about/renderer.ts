import type { AboutSectionData, AboutContentBlock } from './types'

/* ═══════════ ABOUT2 RENDERER ═══════════ */

function sectionBg(s: AboutSectionData): string {
  if (s.bgType === 'image' && s.bgImage) return `background:url('${s.bgImage}') center/cover no-repeat;`
  if (s.bgType === 'gradient') return `background:${s.bgGradient};`
  return `background:${s.bgColor || '#0a0a0a'};`
}

function animCSS(id: string, anim: string): string {
  if (anim === 'none') return ''
  const kf = anim === 'fade-up'
    ? `@keyframes ${id}A{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}`
    : anim === 'slide-in'
    ? `@keyframes ${id}A{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)}}`
    : `@keyframes ${id}A{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}`
  return `${kf}\n#${id} .ab-anim{opacity:0;animation:${id}A 0.7s ease forwards;}\n#${id} .ab-anim:nth-child(1){animation-delay:0.1s;}#${id} .ab-anim:nth-child(2){animation-delay:0.25s;}#${id} .ab-anim:nth-child(3){animation-delay:0.4s;}#${id} .ab-anim:nth-child(4){animation-delay:0.55s;}`
}

function renderBlock(b: AboutContentBlock, s: AboutSectionData, lang: 'en' | 'ru'): string {
  const t = lang === 'ru' ? b.titleRu : b.title
  const txt = s.textColor || '#fafafa'
  const accent = s.accentColor || '#2dd4bf'
  const cardBg = s.cardBg || '#171717'

  // TextStyle for block titles and text
  const bts = s.blockTitleStyle || {}
  const btSz = bts.size ? `font-size:${bts.size}px;` : 'font-size:20px;'
  const btCl = bts.color // resolved per-block below
  const btAl = bts.align ? `text-align:${bts.align};` : ''
  const bxs = s.blockTextStyle || {}
  const bxSz = bxs.size ? `font-size:${bxs.size}px;` : ''
  const bxCl = bxs.color
  const bxAl = bxs.align ? `text-align:${bxs.align};` : ''

  const bgMap: Record<string, string> = {
    dark: `background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);`,
    light: `background:${cardBg};border:1px solid rgba(255,255,255,0.06);`,
    accent: `background:linear-gradient(135deg,${accent},${accent}cc);`,
    transparent: `background:transparent;border:1px solid rgba(255,255,255,0.08);`,
  }
  const bg = bgMap[b.bgStyle] || bgMap.dark
  const isAccent = b.bgStyle === 'accent'
  const tc = isAccent ? '#0a0a0a' : txt

  const isNum = /^\d+$/.test(b.icon)
  const iconHtml = isNum
    ? `<span style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:${isAccent ? 'rgba(0,0,0,0.15)' : `rgba(45,212,191,0.15)`};color:${isAccent ? '#0a0a0a' : accent};font-weight:700;font-size:14px;flex-shrink:0;">${b.icon}</span>`
    : `<span style="font-size:20px;">${b.icon}</span>`

  const titleColor = btCl || tc
  const titleHtml = t ? `<h4 style="${btSz}font-weight:800;letter-spacing:-0.02em;margin-bottom:20px;display:flex;align-items:center;gap:12px;color:${titleColor};${btAl}">${iconHtml} ${t}</h4>` : ''

  let body = ''

  if (b.type === 'text') {
    const text = lang === 'ru' ? b.textRu : b.text
    const txSz = bxSz || 'font-size:16px;'
    const txCl = bxCl || (tc + (isAccent ? '' : 'cc'))
    body = `<p style="${txSz}line-height:1.7;color:${txCl};${bxAl}">${text}</p>`
  } else if (b.type === 'list') {
    const items = lang === 'ru' ? b.itemsRu : b.items
    body = `<div style="display:flex;flex-direction:column;gap:10px;">${items.map(it =>
      `<div style="display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:14px;background:${isAccent ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)'};border:1px solid ${isAccent ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'};"><span style="font-size:14px;font-weight:600;color:${tc};">${it}</span></div>`
    ).join('')}</div>`
  } else if (b.type === 'grid-list') {
    const items = lang === 'ru' ? b.itemsRu : b.items
    body = `<div class="ab-grid-list" style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;">${items.map(it =>
      `<div style="display:flex;align-items:flex-start;gap:8px;"><svg style="width:14px;height:14px;color:${isAccent ? '#0a0a0a' : accent};flex-shrink:0;margin-top:3px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg><span style="font-size:14px;font-weight:600;color:${tc}${isAccent ? '' : 'dd'};">${it}</span></div>`
    ).join('')}</div>`
  } else if (b.type === 'stats') {
    const text = lang === 'ru' ? b.textRu : b.text
    const ctaT = lang === 'ru' ? b.ctaTextRu : b.ctaText
    body = `${text ? `<p style="font-size:17px;font-weight:700;line-height:1.4;color:${tc};margin-bottom:20px;">${text}</p>` : ''}`
    if (b.stats.length > 0) {
      body += `<div style="display:flex;flex-wrap:wrap;gap:28px;${text ? 'border-top:1px solid ' + (isAccent ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)') + ';padding-top:20px;' : ''}">${b.stats.map(st => {
        const sl = lang === 'ru' ? st.labelRu : st.label
        return `<div><p style="font-size:30px;font-weight:800;letter-spacing:-0.04em;color:${tc};">${st.value}</p><p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;opacity:0.6;color:${tc};">${sl}</p></div>`
      }).join('')}</div>`
    }
    if (ctaT && b.ctaLink) {
      body += `<a href="${b.ctaLink}" style="display:inline-block;margin-top:20px;padding:12px 28px;border-radius:14px;background:${isAccent ? '#0a0a0a' : accent};color:${isAccent ? '#fff' : '#fff'};font-size:15px;font-weight:600;text-decoration:none;">${ctaT}</a>`
    }
  } else if (b.type === 'cta') {
    const ctaT = lang === 'ru' ? b.ctaTextRu : b.ctaText
    const text = lang === 'ru' ? b.textRu : b.text
    body = `${text ? `<p style="font-size:16px;line-height:1.6;color:${tc}cc;margin-bottom:20px;">${text}</p>` : ''}<a href="${b.ctaLink || '#'}" style="display:inline-block;padding:14px 32px;border-radius:14px;background:${isAccent ? '#0a0a0a' : accent};color:#fff;font-size:15px;font-weight:700;text-decoration:none;">${ctaT || 'Learn more'}</a>`
  }

  return `<div class="ab-anim ab-card" style="${bg}padding:clamp(28px,4vw,44px);border-radius:2rem;position:relative;overflow:hidden;">${titleHtml}${body}</div>`
}

function photoHTML(s: AboutSectionData, id: string): string {
  const accent = s.accentColor || '#2dd4bf'
  return `<div class="ab-photo-wrap" style="position:relative;cursor:pointer;">
    <div style="position:absolute;inset:-4px;background:linear-gradient(135deg,${accent},${accent}88);border-radius:2rem;filter:blur(20px);opacity:0.2;z-index:0;transition:opacity 0.8s;"></div>
    <div class="ab-photo" style="position:relative;border-radius:2rem;overflow:hidden;border:5px solid rgba(255,255,255,0.06);box-shadow:0 20px 50px -12px rgba(0,0,0,0.5);z-index:1;">
      <img src="${s.image}" alt="${s.name}" style="width:100%;display:block;aspect-ratio:4/5;object-fit:cover;filter:grayscale(100%);transition:filter 0.6s;" />
    </div>
  </div>`
}

function nameHTML(s: AboutSectionData, lang: 'en' | 'ru', variant: string): string {
  const label = lang === 'ru' ? s.sectionLabelRu : s.sectionLabel
  const tagline = lang === 'ru' ? s.taglineRu : s.tagline
  const tags = lang === 'ru' ? s.tagsRu : s.tags
  const accent = s.accentColor || '#2dd4bf'
  const txt = s.textColor || '#fafafa'
  const parts = s.name.split(' ')
  const nameH = parts.length >= 2 ? `${parts[0]}<br/>${parts.slice(1).join(' ')}` : s.name

  const ls = s.labelStyle || {}
  const lSz = ls.size ? `font-size:${ls.size}px;` : 'font-size:11px;'
  const lCl = ls.color || accent

  let labelHtml = ''
  if (variant === 'badge' && label) labelHtml = `<span style="${lSz}font-weight:700;color:${lCl};text-transform:uppercase;letter-spacing:0.2em;">${label}</span>`
  if (variant === 'accent-line') labelHtml = `<div style="width:48px;height:4px;background:${accent};border-radius:2px;margin-bottom:4px;"></div>`

  const tagsH = tags.length ? `<div class="ab-tags" style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">${tags.map(tg => `<span style="padding:4px 12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-size:10px;font-weight:700;letter-spacing:0.12em;color:${txt}80;">${tg}</span>`).join('')}</div>` : ''

  const ns = s.nameStyle || {}
  const nSz = ns.size ? `font-size:${ns.size}px;` : 'font-size:clamp(28px,4vw,36px);'
  const nCl = ns.color || txt
  const nAl = ns.align ? `text-align:${ns.align};` : ''
  const nameStyleCSS = variant === 'gradient-text'
    ? `${nSz}font-weight:800;letter-spacing:-0.04em;line-height:1.1;background:linear-gradient(135deg,${nCl},${accent});-webkit-background-clip:text;-webkit-text-fill-color:transparent;${nAl}`
    : `${nSz}font-weight:800;letter-spacing:-0.04em;line-height:1.1;color:${nCl};${nAl}`

  const ts = s.taglineStyle || {}
  const tSz = ts.size ? `font-size:${ts.size}px;` : 'font-size:15px;'
  const tCl = ts.color || accent
  const tAl = ts.align ? `text-align:${ts.align};` : ''

  return `<div class="ab-name-block" style="margin-top:24px;">
    ${labelHtml}
    <h2 style="${nameStyleCSS}margin-top:8px;">${nameH}</h2>
    ${tagline ? `<p style="${tSz}color:${tCl};font-weight:500;margin-top:6px;${tAl}">${tagline}</p>` : ''}
    ${tagsH}
  </div>`
}

/* ═══════════ MAIN RENDER ═══════════ */
export function renderAbout2HTML(section: AboutSectionData, lang: 'en' | 'ru'): string {
  const id = 'ab' + Math.random().toString(36).slice(2, 8)
  const accent = section.accentColor || '#2dd4bf'
  const blocksHtml = section.blocks.map(b => renderBlock(b, section, lang)).join('')

  const css = `<style>
${animCSS(id, section.animation)}
#${id} .ab-photo-wrap:hover>div:first-child{opacity:0.45;}
#${id} .ab-photo-wrap:hover .ab-photo img{filter:grayscale(0%) !important;}
#${id} .ab-card{transition:transform 0.3s,box-shadow 0.3s;}
#${id} .ab-card:hover{transform:translateY(-4px);box-shadow:0 20px 40px -12px rgba(0,0,0,0.4);}
@media(max-width:1024px){
  #${id} .ab-main{grid-template-columns:1fr !important;}
  #${id} .ab-sticky{position:static !important;text-align:center;}
  #${id} .ab-photo{max-width:340px;margin:0 auto;}
  #${id} .ab-tags{justify-content:center !important;}
  #${id} .ab-name-block{text-align:center;}
  #${id} .ab-split-row{grid-template-columns:1fr !important;}
  #${id} .ab-centered-photo{max-width:320px;}
}
@media(max-width:640px){
  #${id}{padding:48px 16px !important;}
  #${id} .ab-grid-list{grid-template-columns:1fr !important;}
  #${id} .ab-card{padding:24px 20px !important;}
}
</style>`

  const photo = photoHTML(section, id)
  const name = nameHTML(section, lang, section.titleVariant)
  const pos = section.imagePosition || 'left'

  let body = ''

  if (section.layout === 'centered') {
    body = `<div style="max-width:1100px;margin:0 auto;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:48px;">
        <div class="ab-centered-photo" style="width:280px;">${photo}</div>
        <div style="text-align:center;">${name}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;">${blocksHtml}</div>
    </div>`
  } else if (section.layout === 'split') {
    // Alternate photo side with blocks
    const rows = section.blocks.map((b, i) => {
      const bHtml = renderBlock(b, section, lang)
      const photoSide = `<div class="ab-sticky" style="display:flex;align-items:center;justify-content:center;">${i === 0 ? photo + name : `<div style="font-size:96px;opacity:0.06;font-weight:900;color:${section.textColor || '#fff'};">${String(i + 1).padStart(2, '0')}</div>`}</div>`
      const isEven = i % 2 === 0
      const leftSide = (pos === 'left' ? isEven : !isEven) ? photoSide : `<div>${bHtml}</div>`
      const rightSide = (pos === 'left' ? isEven : !isEven) ? `<div>${bHtml}</div>` : photoSide
      return `<div class="ab-split-row" style="display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:center;">${leftSide}${rightSide}</div>`
    })
    body = `<div style="max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:40px;">${rows.join('')}</div>`
  } else {
    // Classic: photo sticky left/right
    const photoCol = `<div class="ab-sticky" style="position:sticky;top:112px;">${photo}${name}</div>`
    const contentCol = `<div style="display:flex;flex-direction:column;gap:24px;">${blocksHtml}</div>`
    const cols = pos === 'left'
      ? `${photoCol}${contentCol}`
      : `${contentCol}${photoCol}`
    body = `<div class="ab-main" style="display:grid;grid-template-columns:1fr 2fr;gap:48px;max-width:1200px;margin:0 auto;align-items:start;">${cols}</div>`
  }

  return `${css}<div id="${id}" style="padding:clamp(48px,8vw,100px) clamp(16px,4vw,24px);${sectionBg(section)}">${body}</div>`
}
