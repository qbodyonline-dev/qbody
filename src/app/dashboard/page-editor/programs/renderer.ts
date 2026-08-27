// Import from the leaf module, not ../shared — that barrel re-exports a
// 'use client' component and this renderer also runs inside API routes.
import { mergeTextStyle, textStyleCSS } from '../shared/text-style'
import { DIFF_LABELS, GOAL_LABELS } from './types'
import { PROGRAM_GRADIENTS, defaultProgramAutoData, defaultProgramSectionData } from './defaults'
import type { DbProgram, ProgramAutoData, ProgramItem2, ProgramSectionData, ProgramSort } from './types'

/* ═══════════ PROGRAMS RENDERER — 3 LAYOUTS ═══════════ */
/* One card renderer feeds both blocks: "Programs" (rows from the database)
   and "Programs Pro" (items typed by hand). Layouts: columns, slider, carousel.
   Inline JS is stripped by the sanitizer, so the slider talks to the global
   useSliderControls hook through data-* attributes and the carousel is pure CSS. */

function sectionBg(s: ProgramSectionData): string {
  if (s.bgType === 'image' && s.bgImage) return `background:url('${s.bgImage}') center/cover no-repeat;`
  if (s.bgType === 'gradient') return `background:${s.bgGradient};`
  return `background:${s.bgColor};`
}

function sectionHeader(s: ProgramSectionData, lang: 'en' | 'ru', id: string): string {
  const badge = lang === 'ru' ? s.sectionBadgeRu : s.sectionBadge
  const title = lang === 'ru' ? s.sectionTitleRu : s.sectionTitle
  const sub = lang === 'ru' ? s.sectionSubtitleRu : s.sectionSubtitle
  const desc = lang === 'ru' ? s.sectionDescriptionRu : s.sectionDescription
  const accent = s.accentColor || '#2dd4bf'
  const txt = s.textColor || '#fafafa'
  const v = s.titleVariant || 'badge'

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

  if (!badge && !title && !sub && !desc) return ''

  let html = `<div style="margin-bottom:clamp(32px,5vw,56px);${tAl ? 'text-align:' + tAl + ';' : ''}">`

  if (v === 'badge' && badge) {
    html += `<p style="color:${bCl};font-weight:700;font-size:${bSz};letter-spacing:0.2em;text-transform:uppercase;margin-bottom:16px;${bs.align ? 'text-align:' + bs.align + ';' : ''}">${badge}</p>`
  }
  if (v === 'accent-line') {
    html += `<div style="width:48px;height:4px;background:${accent};border-radius:2px;margin-bottom:16px;"></div>`
  }

  if (title) {
    if (v === 'gradient-text') {
      html += `<h2 class="${id}-title" style="font-size:${tSz};font-weight:800;background:linear-gradient(135deg,${tCl},${accent});-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:12px;letter-spacing:-0.03em;line-height:1.1;">${title}</h2>`
    } else {
      html += `<h2 class="${id}-title" style="font-size:${tSz};font-weight:800;color:${tCl};margin-bottom:12px;letter-spacing:-0.03em;line-height:1.1;">${title}</h2>`
    }
  }

  if (sub) html += `<p style="font-size:${sSz};font-weight:600;color:${sCl};margin-bottom:8px;${ss.align ? 'text-align:' + ss.align + ';' : ''}">${sub}</p>`
  if (desc) html += `<p style="color:${txt}99;font-size:clamp(14px,2vw,17px);font-style:italic;max-width:560px;">${desc}</p>`

  html += '</div>'
  return html
}

function money(cents: number, currency: string): string {
  const value = cents / 100
  const text = Number.isInteger(value) ? String(value) : value.toFixed(2)
  return `${currency || '$'}${text}`
}

function pill(text: string, color: string, border: string): string {
  return `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;border:1px solid ${border};color:${color};font-size:12px;font-weight:600;white-space:nowrap;">${text}</span>`
}

function button(btn: { text: string; textRu: string; link: string; style: string }, lang: 'en' | 'ru', accent: string, cardBg: string): string {
  const label = lang === 'ru' ? btn.textRu : btn.text
  if (!label) return ''
  const href = btn.link || '#'
  const base = 'display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:11px 20px;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none;transition:transform 0.2s,opacity 0.2s;white-space:nowrap;'
  if (btn.style === 'outline') {
    return `<a href="${href}" style="${base}border:1.5px solid ${accent};color:${accent};background:transparent;">${label}</a>`
  }
  if (btn.style === 'ghost') {
    return `<a href="${href}" style="${base}color:${accent};background:${accent}1a;">${label}</a>`
  }
  return `<a href="${href}" style="${base}background:${accent};color:${cardBg};">${label}</a>`
}

/** Russian plural: 1 неделя · 2 недели · 5 недель · 21 неделя · 22 недели */
function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

/* ═══════════ CARD ═══════════ */
export function programCard(item: ProgramItem2, s: ProgramSectionData, lang: 'en' | 'ru'): string {
  const t = lang === 'ru' ? item.titleRu || item.title : item.title
  const d = lang === 'ru' ? item.descriptionRu || item.description : item.description
  const dur = lang === 'ru' ? item.durationRu || item.duration : item.duration
  const goal = lang === 'ru' ? item.goalRu || item.goal : item.goal
  const diff = lang === 'ru' ? item.difficultyRu || item.difficulty : item.difficulty
  const badge = lang === 'ru' ? item.badgeRu || item.badge : item.badge
  const features = (lang === 'ru' ? item.featuresRu : item.features) || []

  const accent = s.accentColor || '#2dd4bf'
  const cardBg = s.cardBg || '#171717'
  const border = s.cardBorder || 'rgba(255,255,255,0.06)'
  const txt = s.textColor || '#fafafa'

  const ctSz = s.cardTitleStyle?.size ? `${s.cardTitleStyle.size}px` : '20px'
  const ctCl = s.cardTitleStyle?.color || txt
  const cdSz = s.cardDescStyle?.size ? `${s.cardDescStyle.size}px` : '14px'
  const cdCl = s.cardDescStyle?.color || `${txt}99`

  /* Visual — image, or a gradient tile with the emoji */
  let visual = ''
  if (s.showImage) {
    const corner: string[] = []
    if (s.showBadges && diff) {
      corner.push(`<span style="padding:5px 11px;border-radius:999px;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);color:#fff;font-size:11px;font-weight:700;letter-spacing:0.04em;">${diff}</span>`)
    }
    if (s.showBadges && (item.popular || badge)) {
      corner.push(`<span style="padding:5px 11px;border-radius:999px;background:${accent};color:${cardBg};font-size:11px;font-weight:800;letter-spacing:0.04em;">${badge || (lang === 'ru' ? 'Хит' : 'Popular')}</span>`)
    }
    const corners = corner.length
      ? `<div style="position:absolute;top:12px;left:12px;right:12px;display:flex;justify-content:space-between;gap:8px;">${corner.length === 1 ? corner[0] : corner.join('')}</div>`
      : ''

    const inner = item.image
      ? `<img src="${item.image}" alt="${t}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" />`
      : `<div style="width:100%;height:100%;background:${item.gradient};display:flex;align-items:center;justify-content:center;font-size:52px;">${item.icon || '🏋️'}</div>`

    visual = `<div style="position:relative;aspect-ratio:16/10;overflow:hidden;background:${item.gradient};">
      ${inner}
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.35) 0%,rgba(0,0,0,0) 45%,rgba(0,0,0,0.45) 100%);"></div>
      ${corners}
    </div>`
  }

  /* Meta pills */
  let metaHtml = ''
  if (s.showMeta) {
    const pills: string[] = []
    if (dur) pills.push(pill(dur, `${txt}cc`, border))
    if (item.workouts) pills.push(pill(`${item.workouts} ${lang === 'ru' ? 'трен.' : 'workouts'}`, `${txt}cc`, border))
    if (goal) pills.push(pill(goal, accent, `${accent}55`))
    if (!s.showImage && diff) pills.push(pill(diff, `${txt}cc`, border))
    if (pills.length) metaHtml = `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;">${pills.join('')}</div>`
  }

  /* Features — a limit of 0 hides the list, matching the "max" label in the editor */
  let featuresHtml = ''
  const featuresLimit = s.featuresLimit ?? 4
  if (s.showFeatures && featuresLimit > 0 && features.length > 0) {
    const limit = featuresLimit
    featuresHtml = `<ul style="list-style:none;padding:0;margin:0 0 18px;display:flex;flex-direction:column;gap:8px;">${features
      .filter(Boolean)
      .slice(0, limit)
      .map(f => `<li style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:${txt}b3;line-height:1.45;"><span style="color:${accent};flex-shrink:0;font-weight:700;">✓</span><span>${f}</span></li>`)
      .join('')}</ul>`
  }

  /* Price */
  let priceHtml = ''
  if (s.showPrice && item.price > 0) {
    const pSz = s.priceStyle?.size ? `${s.priceStyle.size}px` : '24px'
    const pCl = s.priceStyle?.color || txt
    const old = item.oldPrice && item.oldPrice > item.price
      ? `<span style="font-size:14px;color:${txt}66;text-decoration:line-through;margin-left:8px;">${money(item.oldPrice, item.currency)}</span>`
      : ''
    priceHtml = `<div style="display:flex;align-items:baseline;"><span style="font-size:${pSz};font-weight:800;color:${pCl};">${money(item.price, item.currency)}</span>${old}</div>`
  }

  /* Buttons */
  let btnsHtml = ''
  if (s.showButton) {
    const b1 = button(item.btn1, lang, accent, cardBg)
    const b2 = button(item.btn2, lang, accent, cardBg)
    if (b1 || b2) btnsHtml = `<div style="display:flex;gap:8px;flex-wrap:wrap;">${b1}${b2}</div>`
  }

  const footer = priceHtml || btnsHtml
    ? `<div style="margin-top:auto;padding-top:16px;border-top:1px solid ${border};display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">${priceHtml || '<span></span>'}${btnsHtml}</div>`
    : ''

  const titleStyle = mergeTextStyle(
    `font-size:${ctSz};font-weight:700;color:${ctCl};margin:0 0 8px;line-height:1.25;letter-spacing:-0.01em;`,
    s.cardTitleStyle
  )
  const descStyle = mergeTextStyle(
    `font-size:${cdSz};color:${cdCl};margin:0 0 16px;line-height:1.55;`,
    s.cardDescStyle
  )

  return `<article class="pg-card" style="background:${cardBg};border:1px solid ${border};border-radius:18px;overflow:hidden;display:flex;flex-direction:column;height:100%;transition:transform 0.3s,box-shadow 0.3s,border-color 0.3s;">
    ${visual}
    <div style="padding:22px 22px 24px;flex:1;display:flex;flex-direction:column;">
      ${metaHtml}
      <h3 style="${titleStyle}">${t}</h3>
      ${d ? `<p style="${descStyle}">${d}</p>` : ''}
      <div style="flex:1;">${featuresHtml}</div>
      ${footer}
    </div>
  </article>`
}

/* ═══════════ LAYOUTS ═══════════ */
function layoutBody(cards: string[], s: ProgramSectionData, id: string): { body: string; css: string } {
  const gap = s.gap || 28
  const accent = s.accentColor || '#2dd4bf'
  const cardBg = s.cardBg || '#171717'
  let css = ''

  if (s.layout === 'slider') {
    const perView = Math.max(1, Math.min(s.slidesPerView || 3, 4))
    const slides = cards
      .map(c => `<div class="pg-slide" style="min-width:calc((100% - ${(perView - 1) * gap}px) / ${perView});flex-shrink:0;scroll-snap-align:start;">${c}</div>`)
      .join('')

    const arrows = s.showArrows
      ? `<button type="button" aria-label="Previous" data-slider-prev="${id}" style="width:42px;height:42px;border-radius:50%;background:${cardBg};border:1px solid ${accent}40;color:${accent};font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">←</button>
         <button type="button" aria-label="Next" data-slider-next="${id}" style="width:42px;height:42px;border-radius:50%;background:${cardBg};border:1px solid ${accent}40;color:${accent};font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">→</button>`
      : ''

    const pages = Math.max(1, Math.ceil(cards.length / perView))
    const dots = s.showDots && pages > 1
      ? `<div style="display:flex;justify-content:center;gap:8px;margin-top:20px;">${Array.from({ length: pages }, (_, i) =>
          `<button type="button" aria-label="Slide ${i + 1}" data-slider-dot="${id}" data-slider-index="${i}" style="width:9px;height:9px;border-radius:50%;border:none;padding:0;cursor:pointer;background:${i === 0 ? accent : 'rgba(255,255,255,0.3)'};"></button>`
        ).join('')}</div>`
      : ''

    css = `@media(max-width:900px){#${id} .pg-slide{min-width:60% !important;}}
@media(max-width:640px){#${id} .pg-slide{min-width:85% !important;}}`

    const controls = arrows ? `<div style="display:flex;justify-content:center;gap:12px;margin-top:24px;">${arrows}</div>` : ''

    return {
      css,
      body: `<div style="position:relative;">
        <div class="pg-slider-track ${id}-track" style="display:flex;gap:${gap}px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:4px;">${slides}</div>
        ${controls}${dots}
      </div>`,
    }
  }

  if (s.layout === 'carousel') {
    const width = Math.max(220, s.carouselCardWidth || 320)
    const speed = Math.max(10, s.carouselSpeed || 40)
    // Repeat the set only until it overflows the viewport, then duplicate the
    // whole run once — translating exactly -50% makes the loop seamless.
    // Flooring at 2 here would emit four copies of the catalogue, not two.
    const reps = Math.max(1, Math.ceil(8 / Math.max(1, cards.length)))
    const run = Array.from({ length: reps }, () => cards.join('')).join('')
    const slides = `${run}${run}`

    css = `@keyframes pgm-${id}{from{transform:translateX(0);}to{transform:translateX(-50%);}}
#${id} .pg-marquee{display:flex;gap:${gap}px;width:max-content;animation:pgm-${id} ${speed}s linear infinite;}
#${id} .pg-marquee-wrap:hover .pg-marquee{animation-play-state:paused;}
#${id} .pg-marquee>*{width:${width}px;flex-shrink:0;}
@media(prefers-reduced-motion:reduce){#${id} .pg-marquee{animation:none;}#${id} .pg-marquee-wrap{overflow-x:auto;}}`

    return {
      css,
      body: `<div class="pg-marquee-wrap" style="overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent);mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent);">
        <div class="pg-marquee">${slides}</div>
      </div>`,
    }
  }

  // Grid
  const cols = Math.max(1, Math.min(s.columns || 3, 4))
  css = `@media(max-width:1100px){#${id} .pg-grid{grid-template-columns:repeat(${Math.min(cols, 2)},1fr) !important;}}
@media(max-width:720px){#${id} .pg-grid{grid-template-columns:1fr !important;}}`

  return {
    css,
    body: `<div class="pg-grid" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:${gap}px;">${cards.join('')}</div>`,
  }
}

/* ═══════════ MAIN RENDER ═══════════ */
export function renderProgramsSectionHTML(items: ProgramItem2[], sectionInput: ProgramSectionData, lang: 'en' | 'ru'): string {
  // Merge over the defaults: blocks persist their whole section object, so a
  // field added after a block was saved must not read as "off", and a row with
  // a partial (or empty) object must not throw and take the whole page down.
  const section: ProgramSectionData = { ...defaultProgramSectionData, ...(sectionInput || {}) }
  const id = 'pg' + Math.random().toString(36).slice(2, 8)

  if (!items || items.length === 0) {
    const empty = lang === 'ru' ? 'Программы пока не добавлены.' : 'No programs yet.'
    return `<div id="${id}" style="padding:60px 20px;text-align:center;${sectionBg(section)}"><p style="color:#71717a;">${empty}</p></div>`
  }

  const header = sectionHeader(section, lang, id)
  const cards = items.map(item => programCard(item, section, lang))
  const { body, css } = layoutBody(cards, section, id)

  const styleTag = `<style>
#${id} .pg-card:hover{transform:translateY(-4px);box-shadow:0 22px 44px -14px rgba(0,0,0,0.45);border-color:${section.accentColor || '#2dd4bf'}55;}
#${id} .pg-slider-track::-webkit-scrollbar{display:none;}
@media(max-width:640px){#${id}{padding-left:16px !important;padding-right:16px !important;}}
${css}
</style>`

  return `${styleTag}<div id="${id}" style="padding:clamp(48px,8vw,100px) clamp(16px,4vw,24px);${sectionBg(section)}"><div style="max-width:1200px;margin:0 auto;">${header}${body}</div></div>`
}

/** Pro block — items typed by hand. */
export const renderPrograms2HTML = renderProgramsSectionHTML

/* ═══════════ DATABASE → CARDS ═══════════ */
function sortPrograms(rows: DbProgram[], sort: ProgramSort): DbProgram[] {
  const list = [...rows]
  switch (sort) {
    case 'oldest': return list.sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')))
    case 'price_asc': return list.sort((a, b) => (a.price || 0) - (b.price || 0))
    case 'price_desc': return list.sort((a, b) => (b.price || 0) - (a.price || 0))
    case 'duration_asc': return list.sort((a, b) => (a.duration_weeks || 0) - (b.duration_weeks || 0))
    case 'duration_desc': return list.sort((a, b) => (b.duration_weeks || 0) - (a.duration_weeks || 0))
    case 'name': return list.sort((a, b) => a.name.localeCompare(b.name))
    case 'newest':
    default: return list.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
  }
}

export function dbProgramsToItems(rows: DbProgram[], dataInput: ProgramAutoData): ProgramItem2[] {
  const data: ProgramAutoData = { ...defaultProgramAutoData(), ...(dataInput || {}) }
  const sorted = sortPrograms(rows || [], data.sort)
  const limited = data.limit > 0 ? sorted.slice(0, data.limit) : sorted

  return limited.map((p, i) => {
    const weeks = p.duration_weeks || 0
    const workouts = (p.program_days || []).filter(d => !d.is_rest_day && d.workout_id).length
    const goal = GOAL_LABELS[p.goal || ''] || { en: p.goal || '', ru: p.goal || '' }
    const diff = DIFF_LABELS[p.difficulty || ''] || { en: p.difficulty || '', ru: p.difficulty || '' }
    const link = p.slug ? `/programs/${p.slug}` : '/programs'
    const features = (p.features && p.features.length ? p.features : p.includes) || []
    const featuresRu = (p.features_secondary && p.features_secondary.length ? p.features_secondary : p.includes_secondary) || []

    return {
      id: p.id,
      title: p.name,
      titleRu: p.name_secondary || p.name,
      description: p.description || '',
      descriptionRu: p.description_secondary || p.description || '',
      price: p.price || 0,
      oldPrice: p.original_price || undefined,
      currency: '$',
      duration: weeks ? `${weeks} ${weeks === 1 ? 'week' : 'weeks'}` : '',
      durationRu: weeks ? `${weeks} ${pluralRu(weeks, 'неделя', 'недели', 'недель')}` : '',
      workouts: workouts || undefined,
      goal: goal.en,
      goalRu: goal.ru,
      difficulty: diff.en,
      difficultyRu: diff.ru,
      icon: '🏋️',
      gradient: PROGRAM_GRADIENTS[i % PROGRAM_GRADIENTS.length],
      image: p.hero_image_url || undefined,
      features,
      featuresRu: featuresRu.length ? featuresRu : features,
      btn1: { text: data.ctaText, textRu: data.ctaTextRu, link, style: 'primary' as const },
      btn2: { text: '', textRu: '', link: '', style: 'ghost' as const },
    }
  })
}

/** Auto block — cards are built from live training_programs rows. */
export function renderProgramsAutoHTML(rows: DbProgram[], dataInput: ProgramAutoData, lang: 'en' | 'ru'): string {
  const data: ProgramAutoData = { ...defaultProgramAutoData(), ...(dataInput || {}) }
  return renderProgramsSectionHTML(dbProgramsToItems(rows || [], data), data.section, lang)
}

export { textStyleCSS }
