import type { CourseItem2, CourseSectionData } from './types'

/* ═══════════ COURSES RENDERER — 3 LAYOUTS ═══════════ */

function sectionBg(s: CourseSectionData): string {
  if (s.bgType === 'image' && s.bgImage) return `background:url('${s.bgImage}') center/cover no-repeat;`
  if (s.bgType === 'gradient') return `background:${s.bgGradient};`
  return `background:${s.bgColor};`
}

function sectionHeader(s: CourseSectionData, lang: 'en' | 'ru', id: string): string {
  const badge = lang === 'ru' ? s.sectionBadgeRu : s.sectionBadge
  const title = lang === 'ru' ? s.sectionTitleRu : s.sectionTitle
  const sub = lang === 'ru' ? s.sectionSubtitleRu : s.sectionSubtitle
  const desc = lang === 'ru' ? s.sectionDescriptionRu : s.sectionDescription
  const accent = s.accentColor || '#2dd4bf'
  const txt = s.textColor || '#fafafa'
  const v = s.titleVariant || 'badge'

  // TextStyle overrides
  const ts = s.titleStyle || {}
  const tSz = ts.size ? `${ts.size}px` : 'clamp(28px,5vw,44px)'
  const tCl = ts.color || txt
  const tAl = ts.align || ''
  const ss = s.subtitleStyle || {}
  const sSz = ss.size ? `${ss.size}px` : 'clamp(16px,2.5vw,20px)'
  const sCl = ss.color || accent
  const bs = s.badgeStyle || {}
  const bSz = bs.size ? `${bs.size}px` : '12px'
  const bCl = bs.color || accent

  let html = `<div style="margin-bottom:clamp(32px,5vw,56px);${tAl ? 'text-align:' + tAl + ';' : ''}">`

  if (v === 'badge' && badge) {
    html += `<p style="color:${bCl};font-weight:700;font-size:${bSz};letter-spacing:0.2em;text-transform:uppercase;margin-bottom:16px;${bs.align ? 'text-align:' + bs.align + ';' : ''}">${badge}</p>`
  }
  if (v === 'accent-line') {
    html += `<div style="width:48px;height:4px;background:${accent};border-radius:2px;margin-bottom:16px;"></div>`
  }

  if (v === 'gradient-text') {
    html += `<h2 class="${id}-title" style="font-size:${tSz};font-weight:800;background:linear-gradient(135deg,${tCl},${accent});-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:12px;letter-spacing:-0.03em;line-height:1.1;">${title}</h2>`
  } else {
    html += `<h2 class="${id}-title" style="font-size:${tSz};font-weight:800;color:${tCl};margin-bottom:12px;letter-spacing:-0.03em;line-height:1.1;">${title}</h2>`
  }

  if (sub) html += `<p style="font-size:${sSz};font-weight:600;color:${sCl};margin-bottom:8px;${ss.align ? 'text-align:' + ss.align + ';' : ''}">${sub}</p>`
  if (desc) html += `<p style="color:${txt}99;font-size:clamp(14px,2vw,17px);font-style:italic;max-width:560px;">${desc}</p>`

  html += '</div>'
  return html
}

function courseCard(item: CourseItem2, s: CourseSectionData, lang: 'en' | 'ru', variant: 'card' | 'row'): string {
  const t = lang === 'ru' ? item.titleRu : item.title
  const d = lang === 'ru' ? item.descriptionRu : item.description
  const features = lang === 'ru' ? item.featuresRu : item.features
  const dur = lang === 'ru' ? item.durationRu : item.duration
  const accent = s.accentColor || '#2dd4bf'
  const txt = s.textColor || '#fafafa'
  const cardBg = s.cardBg || '#171717'
  const border = s.cardBorder || 'rgba(255,255,255,0.06)'
  const btn1 = item.btn1 || { text: 'Buy', textRu: 'Купить', link: '#', style: 'primary' as const }
  const btn2 = item.btn2 || { text: 'Details', textRu: 'Подробнее', link: '#', style: 'outline' as const }
  const btn1Text = lang === 'ru' ? btn1.textRu : btn1.text
  const btn2Text = lang === 'ru' ? btn2.textRu : btn2.text
  const cur = item.currency || '$'

  // TextStyle for card elements
  const cts = s.courseTitleStyle || {}
  const ctSz = cts.size ? `${cts.size}px` : '22px'
  const ctCl = cts.color || txt
  const cds = s.courseDescStyle || {}
  const cdSz = cds.size ? `${cds.size}px` : '14px'
  const cdCl = cds.color || `${txt}80`
  const ps = s.priceStyle || {}
  const pSz = ps.size ? `${ps.size}px` : '28px'
  const pCl = ps.color || txt

  const featuresHtml = features.map(f =>
    `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;"><svg style="width:14px;height:14px;color:${accent};flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg><span style="font-size:14px;color:${txt}bb;">${f}</span></div>`
  ).join('')

  const priceHtml = item.oldPrice
    ? `<span style="font-size:${pSz};font-weight:800;color:${pCl};">${cur}${item.price}</span><span style="font-size:14px;color:${txt}50;text-decoration:line-through;margin-left:6px;">${cur}${item.oldPrice}</span>`
    : `<span style="font-size:${pSz};font-weight:800;color:${pCl};">${cur}${item.price}</span>`

  const badgeHtml = (item.badge || item.badgeRu)
    ? `<span style="position:absolute;top:16px;right:16px;background:${accent};color:#fff;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;">${lang === 'ru' ? (item.badgeRu || item.badge) : item.badge}</span>`
    : ''

  const metaHtml = `<div style="display:flex;gap:14px;margin-bottom:12px;">
    <span style="display:flex;align-items:center;gap:5px;color:${txt}60;font-size:12px;">⏱ ${dur}</span>
    <span style="display:flex;align-items:center;gap:5px;color:${txt}60;font-size:12px;">📖 ${item.lessons} ${lang === 'ru' ? 'уроков' : 'lessons'}</span>
  </div>`

  const btnStyle = (style: string) => {
    if (style === 'primary') return `background:${accent};color:#fff;border:none;`
    if (style === 'ghost') return `background:transparent;color:${accent};border:none;`
    return `background:transparent;color:${txt};border:1px solid ${txt}25;`
  }

  const btnsHtml = `<div style="display:flex;gap:8px;flex-wrap:wrap;">
    <a href="${btn1.link}" style="padding:10px 22px;border-radius:12px;${btnStyle(btn1.style)}font-size:14px;font-weight:600;text-decoration:none;transition:opacity 0.2s;">${btn1Text}</a>
    <a href="${btn2.link}" style="padding:10px 22px;border-radius:12px;${btnStyle(btn2.style)}font-size:14px;font-weight:500;text-decoration:none;transition:opacity 0.2s;">${btn2Text}</a>
  </div>`

  // Image or gradient top
  const topVisual = item.image
    ? `<div style="height:200px;background:url('${item.image}') center/cover;border-radius:16px 16px 0 0;position:relative;">${badgeHtml}</div>`
    : `<div style="height:140px;background:${item.gradient};border-radius:16px 16px 0 0;display:flex;align-items:center;justify-content:center;position:relative;"><span style="font-size:48px;">${item.icon}</span>${badgeHtml}</div>`

  if (variant === 'row') {
    // LIST layout — horizontal card
    const sideVisual = item.image
      ? `<div style="width:240px;min-height:100%;background:url('${item.image}') center/cover;border-radius:16px 0 0 16px;flex-shrink:0;position:relative;">${badgeHtml}</div>`
      : `<div style="width:180px;min-height:100%;background:${item.gradient};border-radius:16px 0 0 16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;"><span style="font-size:48px;">${item.icon}</span>${badgeHtml}</div>`

    return `<div class="course-card" style="background:${cardBg};border:1px solid ${border};border-radius:16px;display:flex;overflow:hidden;transition:transform 0.3s,box-shadow 0.3s;">
      ${sideVisual}
      <div style="padding:24px 28px;flex:1;display:flex;flex-direction:column;">
        ${metaHtml}
        <h3 style="font-size:${ctSz};font-weight:700;color:${ctCl};margin-bottom:8px;line-height:1.2;">${t}</h3>
        <p style="font-size:${cdSz};color:${cdCl};margin-bottom:16px;line-height:1.5;">${d}</p>
        <div style="margin-bottom:16px;">${featuresHtml}</div>
        <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>${priceHtml}</div>
          ${btnsHtml}
        </div>
      </div>
    </div>`
  }

  // GRID / SLIDER — vertical card
  return `<div class="course-card" style="background:${cardBg};border:1px solid ${border};border-radius:16px;overflow:hidden;display:flex;flex-direction:column;transition:transform 0.3s,box-shadow 0.3s;">
    ${topVisual}
    <div style="padding:24px 24px 28px;flex:1;display:flex;flex-direction:column;">
      ${metaHtml}
      <h3 style="font-size:${ctSz};font-weight:700;color:${ctCl};margin-bottom:8px;line-height:1.2;">${t}</h3>
      <p style="font-size:${cdSz};color:${cdCl};margin-bottom:16px;line-height:1.5;">${d}</p>
      <div style="margin-bottom:20px;flex-grow:1;">${featuresHtml}</div>
      <div style="border-top:1px solid ${border};padding-top:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>${priceHtml}</div>
        ${btnsHtml}
      </div>
    </div>
  </div>`
}

/* ═══════════ MAIN RENDER ═══════════ */
export function renderCourses2HTML(items: CourseItem2[], section: CourseSectionData, lang: 'en' | 'ru'): string {
  if (!items || items.length === 0) {
    return `<div style="padding:60px 20px;text-align:center;${sectionBg(section)}"><p style="color:#71717a;">No courses yet.</p></div>`
  }

  const id = 'cs' + Math.random().toString(36).slice(2, 8)
  const layout = section.layout || 'grid'
  const accent = section.accentColor || '#2dd4bf'
  const cardBg = section.cardBg || '#171717'
  const cols = Math.min(section.columns || 2, 4)
  const gap = section.gap || 28

  const header = sectionHeader(section, lang, id)

  // Responsive CSS
  let css = `<style>
#${id} .course-card:hover{transform:translateY(-4px);box-shadow:0 20px 40px -12px rgba(0,0,0,0.4);}
@media(max-width:900px){
  #${id} .cs-grid{grid-template-columns:1fr !important;}
  #${id} .cs-list .course-card{flex-direction:column !important;}
  #${id} .cs-list .course-card>div:first-child{width:100% !important;min-height:160px !important;border-radius:16px 16px 0 0 !important;}
}
@media(max-width:640px){
  #${id}{padding:48px 16px !important;}
  #${id} .cs-slider-track{gap:16px !important;}
  #${id} .cs-slide{min-width:85% !important;}
}
</style>`

  let body = ''

  if (layout === 'list') {
    const cards = items.map(item => courseCard(item, section, lang, 'row')).join('')
    body = `<div class="cs-list" style="display:flex;flex-direction:column;gap:${gap}px;">${cards}</div>`
  } else if (layout === 'slider') {
    const perView = section.slidesPerView || 2
    const cards = items.map(item =>
      `<div class="cs-slide" style="min-width:calc((100% - ${(perView - 1) * gap}px) / ${perView});flex-shrink:0;scroll-snap-align:start;">${courseCard(item, section, lang, 'card')}</div>`
    ).join('')

    css += `<style>
@media(max-width:768px){#${id} .cs-slide{min-width:85% !important;}}
</style>`

    body = `<div style="position:relative;">
      <div class="cs-slider-track" data-nb-slider="${id}" style="display:flex;gap:${gap}px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:4px;">
        ${cards}
      </div>
      <div style="display:flex;justify-content:center;gap:12px;margin-top:24px;">
        <button data-nb-prev="${id}" style="width:40px;height:40px;border-radius:50%;background:${cardBg};border:1px solid ${accent}40;color:${accent};font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">←</button>
        <button data-nb-next="${id}" style="width:40px;height:40px;border-radius:50%;background:${cardBg};border:1px solid ${accent}40;color:${accent};font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">→</button>
      </div>
    </div>`
  } else {
    // Grid
    const gridCols = cols === 1 ? '1fr' : cols === 2 ? 'repeat(2,1fr)' : cols === 3 ? 'repeat(3,1fr)' : 'repeat(4,1fr)'
    const cards = items.map(item => courseCard(item, section, lang, 'card')).join('')
    body = `<div class="cs-grid" style="display:grid;grid-template-columns:${gridCols};gap:${gap}px;">${cards}</div>`
  }

  return `${css}<div id="${id}" style="padding:clamp(48px,8vw,100px) clamp(16px,4vw,24px);${sectionBg(section)}"><div style="max-width:1200px;margin:0 auto;">${header}${body}</div></div>`
}
