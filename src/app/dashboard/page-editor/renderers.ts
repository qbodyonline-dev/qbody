import type { CourseItem, ProgramItem, ResultItem, HeaderData, HeroData, AboutData } from './types'

/* ═══════════ HTML RENDERERS ═══════════ */
/* These functions generate HTML from structured data */

const LEVEL_LABELS = {
  en: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', any: 'Any level' },
  ru: { beginner: 'Новичок', intermediate: 'Средний', advanced: 'Продвинутый', any: 'Любой' }
}

/* ─────────── COURSES RENDERER ─────────── */
export function renderCoursesHTML(items: CourseItem[], lang: 'en' | 'ru'): string {
  if (!items || items.length === 0) {
    return `<div style="padding:60px 20px;text-align:center;"><p style="color:#71717a;">No courses yet. Add your first course!</p></div>`
  }

  const title = lang === 'ru' ? 'Специализированное восстановление' : 'Specialized Recovery'
  const subtitle = lang === 'ru' ? 'Клинически обоснованные программы восстановления под руководством тренера.' : 'Clinically inspired, trainer-led recovery programs for the modern woman.'
  const sectionLabel = lang === 'ru' ? 'Экспертные видеокурсы' : 'Expert Video Courses'
  const buyLabel = lang === 'ru' ? 'Купить' : 'Buy Now'

  const courseId = `courses-${Date.now()}`

  const coursesHtml = items.map(course => {
    const t = lang === 'ru' ? course.titleRu : course.title
    const d = lang === 'ru' ? course.descriptionRu : course.description
    const features = lang === 'ru' ? course.featuresRu : course.features

    const featuresHtml = features.map(f =>
      `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;"><svg style="width:16px;height:16px;color:#2dd4bf;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg><span style="font-size:15px;color:#d4d4d8;">${f}</span></div>`
    ).join('')

    const priceHtml = course.oldPrice
      ? `<span style="font-size:32px;font-weight:800;color:#fafafa;letter-spacing:-0.02em;">${course.price}</span> <span style="font-size:16px;color:#52525b;text-decoration:line-through;margin-left:4px;">${course.oldPrice}</span>`
      : `<span style="font-size:32px;font-weight:800;color:#fafafa;letter-spacing:-0.02em;">${course.price}</span>`

    // Split title — last word italic teal
    const words = t.split(' ')
    const lastW = words.pop() || ''
    const mainT = words.join(' ')
    const titleHtml = mainT ? `${mainT} <em style="font-style:italic;color:#2dd4bf;">${lastW}</em>` : `<em style="font-style:italic;color:#2dd4bf;">${lastW}</em>`

    return `<div class="course-card" style="background:#171717;border:1px solid rgba(255,255,255,0.06);border-radius:24px;padding:40px 36px;display:flex;flex-direction:column;position:relative;transition:transform 0.3s ease,box-shadow 0.3s ease;">
      <div style="width:52px;height:52px;border-radius:16px;background:rgba(45,212,191,0.1);display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:28px;">${course.icon}</div>
      <div style="position:absolute;top:36px;right:36px;display:flex;gap:14px;">
        <span style="display:flex;align-items:center;gap:5px;color:#71717a;font-size:13px;"><svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>${course.duration}</span>
        <span style="display:flex;align-items:center;gap:5px;color:#71717a;font-size:13px;"><svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>${course.lessons} ${lang === 'ru' ? 'уроков' : 'lessons'}</span>
      </div>
      <h3 style="font-size:26px;font-weight:800;color:#fafafa;margin-bottom:12px;letter-spacing:-0.02em;line-height:1.2;">${titleHtml}</h3>
      <p style="font-size:15px;color:#71717a;line-height:1.6;margin-bottom:28px;">${d}</p>
      <div style="margin-bottom:32px;flex-grow:1;">${featuresHtml}</div>
      <div style="height:1px;background:rgba(255,255,255,0.06);margin-bottom:24px;"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;"><div>${priceHtml}</div><a href="${course.link}" class="course-btn" style="padding:12px 28px;border-radius:14px;border:1px solid rgba(255,255,255,0.15);color:#fafafa;font-size:15px;font-weight:600;text-decoration:none;transition:all 0.2s ease;">${buyLabel}</a></div>
    </div>`
  }).join('')

  const gridCols = items.length === 1 ? '1fr' : items.length === 2 ? '1fr 1fr' : 'repeat(auto-fit, minmax(320px, 1fr))'

  return `<style>
    #${courseId} .course-card:hover { transform: translateY(-6px); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    #${courseId} .course-card:hover .course-btn { background: #14b8a6 !important; border-color: #14b8a6 !important; }
    @media (max-width: 900px) {
      #${courseId} .courses-grid { grid-template-columns: 1fr !important; }
    }
    @media (max-width: 640px) {
      #${courseId} .course-card { padding: 28px 20px !important; }
      #${courseId} .courses-grid { gap: 16px !important; }
      #${courseId} { padding: 60px 16px !important; }
      #${courseId} h2 { font-size: 32px !important; }
      #${courseId} .course-card h3 { font-size: 22px !important; }
    }
  </style>
  <div id="${courseId}" style="padding:100px 24px;background:#0a0a0a;">
    <div style="max-width:1100px;margin:0 auto;">
      <div style="margin-bottom:56px;"><p style="color:#2dd4bf;font-weight:700;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:16px;">🎬 ${sectionLabel}</p><h2 style="font-size:44px;font-weight:800;color:#fafafa;margin-bottom:12px;letter-spacing:-0.03em;line-height:1.1;">${title}</h2><p style="color:#71717a;font-size:17px;font-style:italic;max-width:520px;">${subtitle}</p></div>
      <div class="courses-grid" style="display:grid;grid-template-columns:${gridCols};gap:28px;">${coursesHtml}</div>
    </div>
  </div>`
}

/* ─────────── PROGRAMS RENDERER ─────────── */
export function renderProgramsHTML(items: ProgramItem[], lang: 'en' | 'ru'): string {
  if (!items || items.length === 0) {
    return `<div style="padding:60px 20px;text-align:center;"><p style="color:#71717a;">No programs yet. Add your first program!</p></div>`
  }

  const title = lang === 'ru' ? 'Готовые программы тренировок' : 'Ready-Made Training Programs'
  const subtitle = lang === 'ru' ? 'Выберите программу под вашу цель и начните тренироваться уже сегодня.' : 'Choose a program for your goal and start training today.'
  const sectionLabel = lang === 'ru' ? 'В приложении QbodyFit' : 'Available in QbodyFit App'
  const detailsLabel = lang === 'ru' ? 'Подробнее' : 'Details'
  const popularLabel = lang === 'ru' ? 'Хит' : 'Popular'

  const progId = `programs-${Date.now()}`

  const renderProgram = (program: ProgramItem) => {
    const t = lang === 'ru' ? program.titleRu : program.title
    const d = lang === 'ru' ? program.descriptionRu : program.description
    const features = lang === 'ru' ? program.featuresRu : program.features
    const levelLabel = LEVEL_LABELS[lang][program.level]
    const soonLabel = lang === 'ru' ? 'Скоро' : 'Soon'

    const featuresHtml = features.map(f =>
      `<div style="display:flex;align-items:center;gap:10px;padding:5px 0;"><svg style="width:16px;height:16px;color:#2dd4bf;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg><span style="font-size:14px;color:#d4d4d8;">${f}</span></div>`
    ).join('')

    // Split title — last word italic teal
    const words = t.split(' ')
    const lastW = words.pop() || ''
    const mainT = words.join(' ')
    const titleHtml = mainT ? `${mainT} <em style="font-style:italic;color:#2dd4bf;">${lastW}</em>` : `<em style="font-style:italic;color:#2dd4bf;">${lastW}</em>`

    const popularBadge = program.popular
      ? `<div style="position:absolute;top:28px;right:28px;background:#14b8a6;color:white;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:0.02em;">${popularLabel}</div>`
      : ''

    const soonBadge = program.soon
      ? `<div style="position:absolute;top:28px;${program.popular ? 'right:100px' : 'right:28px'};background:#f59e0b;color:white;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;">${soonLabel}</div>`
      : ''

    const borderStyle = program.popular ? 'border:2px solid rgba(20,184,166,0.4)' : program.soon ? 'border:2px solid rgba(245,158,11,0.4)' : 'border:1px solid rgba(255,255,255,0.06)'

    let buttonHtml: string
    if (program.soon) {
      buttonHtml = `<span style="padding:12px 28px;border-radius:14px;background:#27272a;color:#52525b;font-size:15px;font-weight:600;cursor:not-allowed;">${soonLabel}</span>`
    } else {
      buttonHtml = `<a href="${program.link}" class="prog-btn" style="padding:12px 28px;border-radius:14px;border:1px solid rgba(255,255,255,0.15);color:#fafafa;font-size:15px;font-weight:600;text-decoration:none;transition:all 0.2s ease;">${detailsLabel}</a>`
    }

    return `<div class="prog-card" style="background:#171717;${borderStyle};border-radius:24px;padding:36px 32px;position:relative;display:flex;flex-direction:column;transition:transform 0.3s ease,box-shadow 0.3s ease;">
      ${popularBadge}${soonBadge}
      <div style="width:52px;height:52px;border-radius:16px;background:${program.gradient};display:flex;align-items:center;justify-content:center;margin-bottom:24px;font-size:24px;">${program.icon}</div>
      <h3 style="font-size:22px;font-weight:800;color:#fafafa;margin-bottom:10px;letter-spacing:-0.02em;line-height:1.2;">${titleHtml}</h3>
      <p style="font-size:14px;color:#71717a;line-height:1.6;margin-bottom:16px;">${d}</p>
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;">
        <span style="display:flex;align-items:center;gap:5px;color:#71717a;font-size:13px;"><svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>${program.duration}</span>
        <span style="width:3px;height:3px;border-radius:50%;background:#52525b;"></span>
        <span style="color:#71717a;font-size:13px;">${levelLabel}</span>
      </div>
      <div style="margin-bottom:28px;flex-grow:1;">${featuresHtml}</div>
      <div style="height:1px;background:rgba(255,255,255,0.06);margin-bottom:20px;"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:28px;font-weight:800;color:#fafafa;letter-spacing:-0.02em;">${program.price}</span>${buttonHtml}</div>
    </div>`
  }

  const allHtml = items.map(p => renderProgram(p)).join('')
  const gridCols = items.length <= 3 ? `repeat(${items.length}, 1fr)` : 'repeat(3, 1fr)'

  return `<style>
    #${progId} .prog-card:hover { transform: translateY(-6px); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    #${progId} .prog-card:hover .prog-btn { background: #14b8a6 !important; border-color: #14b8a6 !important; }
    @media (max-width: 1024px) { #${progId} .prog-grid { grid-template-columns: repeat(2, 1fr) !important; } }
    @media (max-width: 640px) {
      #${progId} .prog-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
      #${progId} .prog-card { padding: 28px 20px !important; }
      #${progId} { padding: 60px 16px !important; }
      #${progId} h2 { font-size: 32px !important; }
      #${progId} h3 { font-size: 20px !important; }
    }
  </style>
  <div id="${progId}" style="padding:100px 24px;background:#0a0a0a;">
    <div style="max-width:1100px;margin:0 auto;">
      <div style="margin-bottom:56px;"><p style="color:#2dd4bf;font-weight:700;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:16px;">📱 ${sectionLabel}</p><h2 style="font-size:44px;font-weight:800;color:#fafafa;margin-bottom:12px;letter-spacing:-0.03em;line-height:1.1;">${title}</h2><p style="color:#71717a;font-size:17px;font-style:italic;max-width:520px;">${subtitle}</p></div>
      <div class="prog-grid" style="display:grid;grid-template-columns:${gridCols};gap:28px;">${allHtml}</div>
    </div>
  </div>`
}

/* ─────────── RESULTS RENDERER ─────────── */
export function renderResultsHTML(items: ResultItem[], lang: 'en' | 'ru'): string {
  if (!items || items.length === 0) {
    return `<div style="padding:60px 20px;text-align:center;"><p style="color:#71717a;">No results yet. Add your first client result!</p></div>`
  }

  const title = lang === 'ru' ? 'Результаты клиентов' : 'Client Results'
  const subtitle = lang === 'ru' ? 'Реальные истории трансформации наших клиенток.' : 'Real transformation stories from our clients.'
  const sectionLabel = lang === 'ru' ? 'Реальные трансформации' : 'Real Transformations'
  const ctaLabel = lang === 'ru' ? 'Начать сейчас' : 'Start Now'

  const resId = `results-${Date.now()}`

  // Generate stars SVG
  const starSvg = `<svg style="width:16px;height:16px;color:#eab308;" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
  const starsHtml = Array(5).fill(starSvg).join('')

  const resultsHtml = items.map(result => {
    const name = lang === 'ru' ? result.nameRu : result.name
    const r = lang === 'ru' ? result.resultRu : result.result
    const quote = lang === 'ru' ? result.quoteRu : result.quote

    return `<div class="result-card" style="background:#171717;border:1px solid rgba(255,255,255,0.06);border-radius:24px;padding:36px 32px;display:flex;flex-direction:column;align-items:center;text-align:center;transition:transform 0.3s ease,box-shadow 0.3s ease;">
      <div style="width:60px;height:60px;border-radius:20px;background:rgba(45,212,191,0.1);display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:24px;">${result.icon}</div>
      <h3 style="font-size:22px;font-weight:800;color:#fafafa;margin-bottom:6px;letter-spacing:-0.02em;">${name}, ${result.age}</h3>
      <p style="color:#2dd4bf;font-weight:700;font-size:15px;margin-bottom:16px;">${r}</p>
      <p style="color:#a1a1aa;font-size:14px;font-style:italic;line-height:1.6;margin-bottom:20px;flex-grow:1;">“${quote}”</p>
      <div style="display:flex;gap:4px;">${starsHtml}</div>
    </div>`
  }).join('')

  const gridCols = items.length <= 3 ? `repeat(${items.length}, 1fr)` : 'repeat(3, 1fr)'

  return `<style>
    #${resId} .result-card:hover { transform: translateY(-6px); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    #${resId} .result-cta:hover { opacity: 0.9; transform: translateY(-2px); }
    @media (max-width: 1024px) { #${resId} .results-grid { grid-template-columns: repeat(2, 1fr) !important; } }
    @media (max-width: 640px) {
      #${resId} .results-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
      #${resId} .result-card { padding: 28px 20px !important; }
      #${resId} { padding: 60px 16px !important; }
      #${resId} h2 { font-size: 32px !important; }
    }
  </style>
  <div id="${resId}" style="padding:100px 24px;background:#0a0a0a;">
    <div style="max-width:1100px;margin:0 auto;">
      <div style="margin-bottom:56px;"><p style="color:#2dd4bf;font-weight:700;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:16px;">⭐ ${sectionLabel}</p><h2 style="font-size:44px;font-weight:800;color:#fafafa;margin-bottom:12px;letter-spacing:-0.03em;line-height:1.1;">${title}</h2><p style="color:#71717a;font-size:17px;font-style:italic;max-width:520px;">${subtitle}</p></div>
      <div class="results-grid" style="display:grid;grid-template-columns:${gridCols};gap:28px;">${resultsHtml}</div>
      <div style="margin-top:56px;"><a href="/auth/register" class="result-cta" style="display:inline-block;padding:14px 36px;border-radius:14px;background:#14b8a6;color:white;font-weight:700;font-size:16px;text-decoration:none;transition:all 0.2s ease;">${ctaLabel}</a></div>
    </div>
  </div>`
}

/* ─────────── HEADER RENDERER ─────────── */
export interface HeaderLangConfig {
  isBilingual: boolean
  primaryLanguage: string
  secondaryLanguage: string | null
}

export function renderHeaderHTML(data: HeaderData, lang: 'en' | 'ru', langConfig?: HeaderLangConfig): string {
  const id = 'hdr' + Math.random().toString(36).slice(2, 8)
  const v = data.variant || 'classic'
  const accent = data.accentColor || '#14b8a6'
  const bg = data.bgColor || '#000000'
  const txtCol = data.textColor || '#ffffff'
  const navCol = `${txtCol}cc` // slightly transparent

  // TextStyle overrides
  const ls = data.logoStyle || {}
  const lSz = ls.size ? `${ls.size}px` : '16px'
  const lCl = ls.color || txtCol
  const ns = data.navStyle || {}
  const nSz = ns.size ? `${ns.size}px` : '14px'
  const nCl = ns.color || navCol

  const navLinksHtml = data.navLinks.map(link => {
    const label = lang === 'ru' ? link.labelRu : link.label
    return `<a href="${link.href}" class="${id}-nav" style="color:${nCl};text-decoration:none;font-size:${nSz};font-weight:500;padding:8px 4px;transition:color 0.2s;">${label}</a>`
  }).join('')

  const loginText = lang === 'ru' ? data.loginTextRu : data.loginText
  const ctaText = lang === 'ru' ? data.ctaTextRu : data.ctaText
  const sub = lang === 'ru' ? (data.logoSubtextRu || data.logoSubtext) : data.logoSubtext

  const logoHtml = data.logoImage
    ? `<img src="${data.logoImage}" alt="${data.logoText}" style="width:36px;height:36px;border-radius:10px;object-fit:contain;" />`
    : `<div style="width:36px;height:36px;border-radius:10px;background:${data.logoGradient};display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:16px;flex-shrink:0;">${data.logoIcon}</div>`

  const logoBlock = `<div class="${id}-logo" style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
    ${logoHtml}
    <div><span style="font-weight:600;font-size:${lSz};color:${lCl};display:block;line-height:1.2;">${data.logoText}</span>${sub ? `<span style="font-size:12px;color:${accent};display:block;line-height:1.2;">${sub}</span>` : ''}</div>
  </div>`

  // Language switcher
  const lc = langConfig || { isBilingual: false, primaryLanguage: 'en', secondaryLanguage: null }
  const langSwitcherHtml = lc.isBilingual && lc.secondaryLanguage
    ? `<div class="${id}-langsw" style="display:flex;align-items:center;gap:2px;background:${txtCol}10;border-radius:8px;padding:2px;margin-right:4px;">
        <span data-lang-switch="${lc.primaryLanguage}" style="padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;letter-spacing:0.05em;transition:all 0.2s;user-select:none;${lang === 'en' ? `background:${accent};color:#fff;` : `background:transparent;color:${txtCol}88;`}">${lc.primaryLanguage.toUpperCase()}</span>
        <span data-lang-switch="${lc.secondaryLanguage}" style="padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;letter-spacing:0.05em;transition:all 0.2s;user-select:none;${lang === 'ru' ? `background:${accent};color:#fff;` : `background:transparent;color:${txtCol}88;`}">${lc.secondaryLanguage.toUpperCase()}</span>
      </div>`
    : ''

  const btnsHtml = `<div class="${id}-btns" style="display:flex;gap:8px;align-items:center;">
    ${langSwitcherHtml}
    <a href="${data.loginLink}" style="padding:8px 18px;border-radius:10px;border:1px solid ${txtCol}30;font-size:13px;font-weight:500;color:${txtCol};text-decoration:none;transition:all 0.2s;">${loginText}</a>
    <a href="${data.ctaLink}" style="padding:8px 18px;border-radius:10px;background:${accent};color:#fff;font-size:13px;font-weight:600;text-decoration:none;transition:all 0.2s;">${ctaText}</a>
  </div>`

  const navBlock = `<nav class="${id}-navwrap" style="display:flex;gap:clamp(12px,2vw,24px);align-items:center;">${navLinksHtml}</nav>`

  // Top bar
  const topBar = data.topBar?.enabled ? `<div style="background:${data.topBar.bgColor || accent};padding:8px 16px;text-align:center;font-size:13px;"><a href="${data.topBar.link || '#'}" style="color:${data.topBar.textColor || '#fff'};text-decoration:none;font-weight:500;">${lang === 'ru' ? data.topBar.textRu : data.topBar.text}</a></div>` : ''

  // Responsive CSS
  const css = `<style>
.${id}-nav:hover{color:${accent} !important;}
@media(max-width:768px){
  .${id}-navwrap{display:none !important;}
  .${id}-btns{display:none !important;}
  .${id}-mob{display:flex !important;}
}
</style>`

  const mobBtn = `<div class="${id}-mob" style="display:none;align-items:center;gap:8px;">
    ${langSwitcherHtml}
    <span style="font-size:13px;color:${accent};font-weight:600;">Menu ≡</span>
  </div>`

  let headerInner = ''

  if (v === 'centered') {
    // Centered: logo centered top, nav centered below
    headerInner = `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 24px;">
      ${logoBlock}
      <div style="display:flex;align-items:center;gap:16px;">${navBlock}${btnsHtml}</div>
    </div>`
  } else if (v === 'minimal') {
    // Minimal: logo left, nav+CTA right together
    headerInner = `<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 24px;">
      ${logoBlock}
      <div style="display:flex;align-items:center;gap:clamp(16px,3vw,32px);">${navBlock}<a href="${data.ctaLink}" class="${id}-btns" style="padding:8px 20px;border-radius:10px;background:${accent};color:#fff;font-size:13px;font-weight:600;text-decoration:none;">${ctaText}</a></div>
      ${mobBtn}
    </div>`
  } else if (v === 'split') {
    // Split: accent line + logo left, nav center, buttons right
    headerInner = `<div style="border-top:3px solid ${accent};"><div style="display:flex;align-items:center;justify-content:space-between;padding:14px 24px;">
      ${logoBlock}
      ${navBlock}
      <div style="display:flex;align-items:center;gap:8px;">${btnsHtml}${mobBtn}</div>
    </div></div>`
  } else {
    // Classic: logo left/center, nav left/center/right, buttons right
    const lp = data.logoPosition || 'left'
    const np = data.navPosition || 'center'
    const justify = np === 'left' ? 'flex-start' : np === 'right' ? 'flex-end' : 'center'

    if (lp === 'center') {
      // Logo center — nav below or flanked
      headerInner = `<div style="padding:14px 24px;"><div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="flex:1;"></div>
        ${logoBlock}
        <div style="flex:1;display:flex;justify-content:flex-end;">${btnsHtml}${mobBtn}</div>
      </div><div style="display:flex;justify-content:${justify};padding-top:6px;">${navBlock}</div></div>`
    } else {
      headerInner = `<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 24px;">
        ${logoBlock}
        <div style="flex:1;display:flex;justify-content:${justify};">${navBlock}</div>
        <div style="display:flex;align-items:center;gap:8px;">${btnsHtml}${mobBtn}</div>
      </div>`
    }
  }

  return `${css}${topBar}<div style="background:${bg};border-bottom:1px solid ${txtCol}12;max-width:100%;">${headerInner}</div>`
}

/* ─────────── HERO RENDERER ─────────── */
export function renderHeroHTML(data: HeroData, lang: 'en' | 'ru'): string {
  const badge = lang === 'ru' ? data.badgeRu : data.badge
  const title = lang === 'ru' ? data.titleRu : data.title
  const subtitle = lang === 'ru' ? data.subtitleRu : data.subtitle
  const description = lang === 'ru' ? data.descriptionRu : data.description
  const primaryBtn = lang === 'ru' ? data.primaryBtnTextRu : data.primaryBtnText
  const secondaryBtn = lang === 'ru' ? data.secondaryBtnTextRu : data.secondaryBtnText
  const features = lang === 'ru' ? data.featuresRu : data.features

  const featuresHtml = features.map(f => `✓ ${f}`).join('&nbsp;&nbsp;')

  // Two-column layout with image
  if (data.heroImage) {
    const heroId = `hero-${Date.now()}`
    
    // Image style settings with defaults
    const imgMaxWidth = data.imageMaxWidth || '480px'
    const imgMaxHeight = data.imageMaxHeight || '600px'
    const imgBorderRadius = data.imageBorderRadius || '24px'
    const imgObjectFit = data.imageObjectFit || 'cover'
    const imgPadTop = data.imagePaddingTop || '0'
    const imgPadRight = data.imagePaddingRight || '0'
    const imgPadBottom = data.imagePaddingBottom || '0'
    const imgPadLeft = data.imagePaddingLeft || '0'
    
    // Add px if only number
    const addPx = (val: string) => /^\d+$/.test(val) ? val + 'px' : val
    const imgPadding = `${addPx(imgPadTop)} ${addPx(imgPadRight)} ${addPx(imgPadBottom)} ${addPx(imgPadLeft)}`
    
    return `<div style="padding:60px 20px;background:${data.gradient};color:white;">
      <style>
        @media (max-width: 900px) {
          #${heroId} .hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          #${heroId} .hero-text { text-align: center !important; }
          #${heroId} .hero-title { font-size: 32px !important; }
          #${heroId} .hero-buttons { justify-content: center !important; }
          #${heroId} .hero-features { text-align: center !important; }
          #${heroId} .hero-image-wrap { order: -1 !important; }
          #${heroId} .hero-image { max-width: min(320px, 100%) !important; margin: 0 auto !important; }
        }
      </style>
      <div id="${heroId}">
        <div class="hero-grid" style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;">
          <div class="hero-text" style="text-align:left;">
            <p style="color:#2dd4bf;font-weight:600;font-size:14px;margin-bottom:16px;">${badge}</p>
            <h1 class="hero-title" style="font-size:42px;font-weight:800;margin-bottom:8px;line-height:1.1;">${title}</h1>
            <h1 class="hero-title" style="font-size:42px;font-weight:800;color:#2dd4bf;margin-bottom:24px;line-height:1.1;">${subtitle}</h1>
            <p style="color:#d4d4d8;font-size:18px;margin-bottom:32px;line-height:1.6;">${description}</p>
            <div class="hero-buttons" style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
              <a href="${data.primaryBtnLink}" style="padding:14px 32px;border-radius:16px;background:#14b8a6;color:white;font-weight:600;font-size:16px;text-decoration:none;display:inline-block;">${primaryBtn}</a>
              <a href="${data.secondaryBtnLink}" style="padding:14px 32px;border-radius:16px;border:1px solid rgba(255,255,255,0.3);color:white;font-size:16px;text-decoration:none;display:inline-block;">${secondaryBtn}</a>
            </div>
            <p class="hero-features" style="font-size:14px;color:#a1a1aa;">${featuresHtml}</p>
          </div>
          <div class="hero-image-wrap" style="display:flex;justify-content:center;align-items:center;padding:${imgPadding};">
            <img class="hero-image" src="${data.heroImage}" alt="Hero" style="width:100%;max-width:${imgMaxWidth};max-height:${imgMaxHeight};border-radius:${imgBorderRadius};object-fit:${imgObjectFit};box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);" />
          </div>
        </div>
      </div>
    </div>`
  }

  // Single column layout (no image) - original design
  const heroNoImgId = `hero-noimg-${Date.now()}`
  return `<style>
    @media (max-width: 640px) {
      #${heroNoImgId} h1 { font-size: 32px !important; }
      #${heroNoImgId} { padding: 40px 16px !important; }
      #${heroNoImgId} .hero-btns { flex-direction: column !important; align-items: center !important; }
    }
  </style>
  <div id="${heroNoImgId}" style="text-align:center;padding:60px 20px;background:${data.gradient};color:white;"><p style="color:#2dd4bf;font-weight:600;font-size:14px;margin-bottom:16px;">${badge}</p><h1 style="font-size:48px;font-weight:800;margin-bottom:8px;">${title}</h1><h1 style="font-size:48px;font-weight:800;color:#2dd4bf;margin-bottom:24px;">${subtitle}</h1><p style="color:#d4d4d8;font-size:18px;max-width:600px;margin:0 auto 32px;">${description}</p><div class="hero-btns" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:24px;"><a href="${data.primaryBtnLink}" style="padding:12px 32px;border-radius:16px;background:#14b8a6;color:white;font-weight:600;font-size:16px;text-decoration:none;">${primaryBtn}</a><a href="${data.secondaryBtnLink}" style="padding:12px 32px;border-radius:16px;border:1px solid rgba(255,255,255,0.3);color:white;font-size:16px;text-decoration:none;">${secondaryBtn}</a></div><p style="font-size:14px;color:#a1a1aa;">${featuresHtml}</p></div>`
}

/* ─────────── ABOUT RENDERER ─────────── */
export function renderAboutHTML(data: AboutData, lang: 'en' | 'ru'): string {
  const sectionLabel = lang === 'ru' ? data.sectionLabelRu : data.sectionLabel
  const tagline = lang === 'ru' ? data.taglineRu : data.tagline
  const certificationsTitle = lang === 'ru' ? data.certificationsTitleRu : data.certificationsTitle
  const certifications = lang === 'ru' ? data.certificationsRu : data.certifications
  const careerTitle = lang === 'ru' ? data.careerTitleRu : data.careerTitle
  const career = lang === 'ru' ? data.careerRu : data.career
  const footer = lang === 'ru' ? data.footerRu : data.footer
  const tags = lang === 'ru' ? (data.tagsRu || data.tags || ['ТРЕНЕР', 'АТЛЕТ']) : (data.tags || ['COACH', 'ATHLETE'])
  const personalJourneyTitle = lang === 'ru' 
    ? (data.personalJourneyTitleRu || 'Личный путь') 
    : (data.personalJourneyTitle || 'Personal Journey')
  const stats = data.stats || []

  // Split name into first/last for line break
  const nameParts = data.name.split(' ')
  const nameHtml = nameParts.length >= 2 
    ? `${nameParts[0]} <br/>${nameParts.slice(1).join(' ')}` 
    : data.name

  const aboutId = `about-${Date.now()}`

  // Certifications in 2-column grid
  const certificationsHtml = certifications.map(c => 
    `<div style="display:flex;align-items:flex-start;gap:10px;">
      <svg style="width:16px;height:16px;color:#0d9488;flex-shrink:0;margin-top:2px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span style="font-size:14px;font-weight:600;line-height:1.5;color:#d4d4d4;">${c}</span>
    </div>`
  ).join('')

  // Career items
  const careerHtml = career.map(c => {
    // Check if it starts with emoji or medal
    return `<div style="display:flex;align-items:center;gap:16px;padding:16px 20px;border-radius:16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);">
      <span style="font-size:14px;font-weight:600;color:#e5e5e5;">${c}</span>
    </div>`
  }).join('')

  // Tags
  const tagsHtml = tags.map(tag => 
    `<span style="padding:4px 14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-size:10px;font-weight:700;letter-spacing:0.15em;color:#a3a3a3;">${tag}</span>`
  ).join('')

  // Stats
  const statsHtml = stats.map(s => {
    const label = lang === 'ru' ? s.labelRu : s.label
    return `<div>
      <p style="font-size:32px;font-weight:800;letter-spacing:-0.05em;color:#0a0a0a;">${s.value}</p>
      <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;opacity:0.6;font-style:italic;color:#0a0a0a;">${label}</p>
    </div>`
  }).join('')

  return `
<style>
  #${aboutId} { font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif; }

  /* Photo glow + grayscale hover */
  #${aboutId} .about-photo-wrap {
    position: relative;
  }
  #${aboutId} .about-photo-glow {
    position: absolute;
    inset: -4px;
    background: linear-gradient(135deg, #2dd4bf, #0d9488);
    border-radius: 2.5rem;
    filter: blur(20px);
    opacity: 0.2;
    transition: opacity 1s ease;
    z-index: 0;
  }
  #${aboutId} .about-photo-wrap:hover .about-photo-glow {
    opacity: 0.45;
  }
  #${aboutId} .about-photo-inner {
    position: relative;
    border-radius: 2.5rem;
    overflow: hidden;
    border: 6px solid rgba(255,255,255,0.06);
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    z-index: 1;
  }
  #${aboutId} .about-photo-inner img {
    width: 100%;
    display: block;
    filter: grayscale(100%);
    transition: filter 0.7s ease;
  }
  #${aboutId} .about-photo-wrap:hover .about-photo-inner img {
    filter: grayscale(0%);
  }

  /* Fade-up entrance animations */
  @keyframes aboutFadeUp {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
  }
  #${aboutId} .about-fade-up {
    opacity: 0;
    animation: aboutFadeUp 0.8s ease forwards;
  }
  #${aboutId} .about-fade-up:nth-child(1) { animation-delay: 0.1s; }
  #${aboutId} .about-fade-up:nth-child(2) { animation-delay: 0.3s; }
  #${aboutId} .about-fade-up:nth-child(3) { animation-delay: 0.5s; }

  /* Card hover effects */
  #${aboutId} .about-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  #${aboutId} .about-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4);
  }

  /* Block number badge */
  #${aboutId} .about-block-num {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    font-weight: 700;
    font-size: 14px;
    flex-shrink: 0;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    #${aboutId} .about-grid { grid-template-columns: 1fr !important; }
    #${aboutId} .about-left { position: static !important; text-align: center; }
    #${aboutId} .about-photo-inner { max-width: 360px; margin: 0 auto; }
    #${aboutId} .about-tags { justify-content: center !important; }
    #${aboutId} .about-name { text-align: center; }
  }
  @media (max-width: 640px) {
    #${aboutId} .about-certs-grid { grid-template-columns: 1fr !important; }
    #${aboutId} .about-section-pad { padding: 28px 20px !important; }
    #${aboutId} { padding: 60px 16px !important; }
    #${aboutId} .about-grid { gap: 32px !important; }
    #${aboutId} h2 { font-size: 28px !important; }
    #${aboutId} h4 { font-size: 18px !important; }
  }
</style>

<div id="${aboutId}" style="padding:80px 24px;background:#0a0a0a;">
  <div class="about-grid" style="display:grid;grid-template-columns:1fr 2fr;gap:48px;max-width:1200px;margin:0 auto;align-items:start;">
    
    <!-- Left Sticky Side -->
    <div class="about-left" style="position:sticky;top:112px;">
      <div class="about-photo-wrap" style="cursor:pointer;">
        <div class="about-photo-glow"></div>
        <div class="about-photo-inner">
          <img src="${data.image}" alt="${data.name}" style="aspect-ratio:4/5;object-fit:cover;" />
        </div>
      </div>
      <div style="margin-top:32px;" class="about-name">
        <span style="font-size:12px;font-weight:700;color:#0d9488;text-transform:uppercase;letter-spacing:0.2em;">${sectionLabel}</span>
        <h2 style="font-size:36px;font-weight:800;letter-spacing:-0.04em;margin-top:8px;line-height:1.1;color:#fafafa;">${nameHtml}</h2>
        <div class="about-tags" style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">
          ${tagsHtml}
        </div>
      </div>
    </div>

    <!-- Right Detailed Side -->
    <div style="display:flex;flex-direction:column;gap:32px;">
      
      <!-- Block 1: Professional Qualifications -->
      <div class="about-fade-up about-card about-section-pad" style="background:rgba(255,255,255,0.03);padding:48px;border-radius:2.5rem;border:1px solid rgba(255,255,255,0.06);box-shadow:0 10px 40px -10px rgba(0,0,0,0.3);position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;right:0;padding:32px;opacity:0.04;">
          <svg style="width:120px;height:120px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
        </div>
        <h4 style="font-size:22px;font-weight:800;letter-spacing:-0.02em;margin-bottom:32px;display:flex;align-items:center;gap:14px;color:#fafafa;">
          <span class="about-block-num" style="background:rgba(45,212,191,0.15);color:#2dd4bf;">01</span>
          ${certificationsTitle}
        </h4>
        <div class="about-certs-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px 28px;">
          ${certificationsHtml}
        </div>
      </div>

      <!-- Block 2: Career / Achievements -->
      <div class="about-fade-up about-card about-section-pad" style="background:#171717;padding:48px;border-radius:2.5rem;border:1px solid rgba(255,255,255,0.06);box-shadow:0 10px 40px -10px rgba(0,0,0,0.4);position:relative;overflow:hidden;">
        <div style="position:absolute;bottom:-40px;right:-40px;width:200px;height:200px;background:rgba(13,148,136,0.08);filter:blur(80px);border-radius:50%;"></div>
        <h4 style="font-size:22px;font-weight:800;letter-spacing:-0.02em;margin-bottom:32px;display:flex;align-items:center;gap:14px;color:#fafafa;">
          <span class="about-block-num" style="background:rgba(255,255,255,0.08);color:#2dd4bf;">02</span>
          ${careerTitle}
        </h4>
        <div style="display:flex;flex-direction:column;gap:12px;position:relative;z-index:1;">
          ${careerHtml}
        </div>
      </div>

      <!-- Block 3: Personal Journey -->
      <div class="about-fade-up about-card about-section-pad" style="background:linear-gradient(135deg,#2dd4bf,#0d9488);padding:48px;border-radius:2.5rem;color:#0a0a0a;position:relative;overflow:hidden;box-shadow:0 25px 50px -12px rgba(45,212,191,0.25);">
        <div style="position:absolute;top:0;right:0;padding:32px;opacity:0.15;">
          <svg style="width:96px;height:96px;" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </div>
        <h4 style="font-size:22px;font-weight:800;letter-spacing:-0.02em;margin-bottom:24px;color:#0a0a0a;">${personalJourneyTitle}</h4>
        <div style="display:flex;flex-direction:column;gap:20px;">
          <p style="font-size:18px;font-weight:700;line-height:1.3;color:#0a0a0a;">${footer}</p>
          ${stats.length > 0 ? `
          <div style="height:1px;background:rgba(0,0,0,0.1);"></div>
          <div style="display:flex;flex-wrap:wrap;gap:32px;">
            ${statsHtml}
          </div>` : ''}
        </div>
      </div>

    </div>
  </div>
</div>`
}

/* ─────────── GRADIENTS PRESETS ─────────── */
export const HERO_GRADIENTS = [
  'linear-gradient(135deg,#0f766e 0%,#115e59 25%,#134e4a 50%,#18181b 100%)',
  'linear-gradient(135deg,#1e3a8a 0%,#1e40af 25%,#1d4ed8 50%,#18181b 100%)',
  'linear-gradient(135deg,#7c2d12 0%,#9a3412 25%,#c2410c 50%,#18181b 100%)',
  'linear-gradient(135deg,#581c87 0%,#6b21a8 25%,#7c3aed 50%,#18181b 100%)',
  'linear-gradient(135deg,#18181b 0%,#27272a 50%,#3f3f46 100%)',
  'linear-gradient(135deg,#14532d 0%,#166534 25%,#15803d 50%,#18181b 100%)',
]

export const LOGO_GRADIENTS = [
  'linear-gradient(135deg,#2dd4bf,#0d9488)',
  'linear-gradient(135deg,#60a5fa,#3b82f6)',
  'linear-gradient(135deg,#f472b6,#ec4899)',
  'linear-gradient(135deg,#a78bfa,#8b5cf6)',
  'linear-gradient(135deg,#fbbf24,#f59e0b)',
  'linear-gradient(135deg,#34d399,#10b981)',
]

export const COURSE_GRADIENTS = [
  'linear-gradient(135deg,#ec4899,#f43f5e)',
  'linear-gradient(135deg,#8b5cf6,#7c3aed)',
  'linear-gradient(135deg,#3b82f6,#6366f1)',
  'linear-gradient(135deg,#14b8a6,#0d9488)',
  'linear-gradient(135deg,#f97316,#eab308)',
  'linear-gradient(135deg,#22c55e,#10b981)',
]

export const PROGRAM_GRADIENTS = [
  'linear-gradient(135deg,#ec4899,#f43f5e)',
  'linear-gradient(135deg,#3b82f6,#6366f1)',
  'linear-gradient(135deg,#22c55e,#10b981)',
  'linear-gradient(135deg,#f97316,#eab308)',
  'linear-gradient(135deg,#14b8a6,#0d9488)',
  'linear-gradient(135deg,#8b5cf6,#7c3aed)',
]

export const EMOJI_ICONS = ['💗', '👶', '🎯', '💪', '⭐', '⚡', '🏠', '📉', '🔥', '🏆', '💎', '🌟']
