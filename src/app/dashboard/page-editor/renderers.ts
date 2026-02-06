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

  const title = lang === 'ru' ? 'Специализированные курсы' : 'Specialized courses'
  const subtitle = lang === 'ru' ? 'Программы восстановления.' : 'Recovery programs for women.'
  const sectionLabel = lang === 'ru' ? 'Видеокурсы' : 'Video courses'
  const buyLabel = lang === 'ru' ? 'Купить →' : 'Buy →'

  const coursesHtml = items.map(course => {
    const t = lang === 'ru' ? course.titleRu : course.title
    const d = lang === 'ru' ? course.descriptionRu : course.description
    const features = lang === 'ru' ? course.featuresRu : course.features

    const featuresHtml = features.map(f => 
      `<li style="padding:3px 0;font-size:13px;color:#52525b;">✅ ${f}</li>`
    ).join('')

    const priceHtml = course.oldPrice 
      ? `<span style="font-size:24px;font-weight:700;color:#18181b;">$${course.price}</span> <span style="font-size:14px;color:#a1a1aa;text-decoration:line-through;">$${course.oldPrice}</span>`
      : `<span style="font-size:24px;font-weight:700;color:#18181b;">$${course.price}</span>`

    return `<div style="border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;"><div style="background:${course.gradient};padding:40px;text-align:center;color:white;position:relative;"><div style="position:absolute;top:8px;left:8px;display:flex;gap:6px;"><span style="background:rgba(255,255,255,0.9);color:#18181b;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;">⏱ ${course.duration}</span><span style="background:rgba(255,255,255,0.9);color:#18181b;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;">📖 ${course.lessons} ${lang === 'ru' ? 'уроков' : 'lessons'}</span></div><div style="font-size:40px;margin-bottom:12px;">${course.icon}</div><h3 style="font-size:22px;font-weight:700;margin-bottom:8px;">${t}</h3><p style="font-size:14px;opacity:0.9;">${d}</p></div><div style="padding:24px;"><ul style="list-style:none;padding:0;margin:0 0 16px;">${featuresHtml}</ul><div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e4e4e7;padding-top:16px;"><div>${priceHtml}</div><a href="${course.link}" style="padding:10px 20px;border-radius:12px;background:#14b8a6;color:white;font-size:14px;text-decoration:none;font-weight:600;">${buyLabel}</a></div></div></div>`
  }).join('')

  const gridCols = items.length === 1 ? '1fr' : items.length === 2 ? '1fr 1fr' : 'repeat(auto-fit, minmax(350px, 1fr))'

  return `<div style="padding:60px 20px;"><div style="text-align:center;margin-bottom:40px;"><p style="color:#14b8a6;font-weight:600;font-size:14px;margin-bottom:12px;">🎬 ${sectionLabel}</p><h2 style="font-size:36px;font-weight:800;color:#18181b;margin-bottom:8px;">${title}</h2><p style="color:#52525b;font-size:16px;">${subtitle}</p></div><div style="display:grid;grid-template-columns:${gridCols};gap:24px;max-width:900px;margin:0 auto;">${coursesHtml}</div></div>`
}

/* ─────────── PROGRAMS RENDERER ─────────── */
export function renderProgramsHTML(items: ProgramItem[], lang: 'en' | 'ru'): string {
  if (!items || items.length === 0) {
    return `<div style="padding:60px 20px;text-align:center;"><p style="color:#71717a;">No programs yet. Add your first program!</p></div>`
  }

  const title = lang === 'ru' ? 'Программы тренировок' : 'Ready-made training programs'
  const subtitle = lang === 'ru' ? 'Выберите программу.' : 'Choose a program for your goal and start training today.'
  const sectionLabel = lang === 'ru' ? 'В приложении QbodyFit' : 'Available in QbodyFit app'
  const detailsLabel = lang === 'ru' ? 'Подробнее' : 'Details'
  const popularLabel = lang === 'ru' ? 'Хит' : 'Popular'

  // Split into main (first 3) and secondary programs
  const mainPrograms = items.slice(0, 3)
  const secondaryPrograms = items.slice(3)

  const renderProgram = (program: ProgramItem, isMain: boolean) => {
    const t = lang === 'ru' ? program.titleRu : program.title
    const d = lang === 'ru' ? program.descriptionRu : program.description
    const features = lang === 'ru' ? program.featuresRu : program.features
    const levelLabel = LEVEL_LABELS[lang][program.level]
    const soonLabel = 'Soon'

    const featuresHtml = features.map(f => 
      `<li style="padding:3px 0;font-size:13px;color:#52525b;">✅ ${f}</li>`
    ).join('')

    const popularBadge = program.popular 
      ? `<div style="position:absolute;top:12px;right:12px;background:#14b8a6;color:white;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">${popularLabel}</div>`
      : ''
    
    const soonBadge = program.soon 
      ? `<div style="position:absolute;top:12px;${program.popular ? 'right:80px' : 'right:12px'};background:#f59e0b;color:white;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">${soonLabel}</div>`
      : ''

    const borderStyle = program.popular ? 'border:2px solid #14b8a6' : program.soon ? 'border:2px solid #f59e0b' : 'border:1px solid #e4e4e7'
    
    // Button style and rendering based on soon status
    let buttonHtml: string
    if (program.soon) {
      // Disabled button style - no link, grayed out
      buttonHtml = `<span style="padding:8px 16px;border-radius:12px;background:#d4d4d8;color:#71717a;font-size:13px;cursor:not-allowed;">${soonLabel}</span>`
    } else {
      const btnStyle = program.popular 
        ? 'background:#14b8a6;color:white'
        : 'border:1px solid #e4e4e7;color:#18181b'
      buttonHtml = `<a href="${program.link}" style="padding:8px 16px;border-radius:12px;${btnStyle};font-size:13px;text-decoration:none;">${detailsLabel}</a>`
    }

    return `<div style="background:white;${borderStyle};border-radius:16px;padding:24px;position:relative;">${popularBadge}${soonBadge}<div style="width:48px;height:48px;border-radius:12px;background:${program.gradient};display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:20px;">${program.icon}</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">${t}</h3><p style="color:#52525b;font-size:14px;margin-bottom:12px;">${d}</p><p style="font-size:13px;color:#71717a;margin-bottom:16px;">⏱ ${program.duration} · ${levelLabel}</p><ul style="list-style:none;padding:0;margin:0 0 16px;">${featuresHtml}</ul><div style="border-top:1px solid #e4e4e7;padding-top:16px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:24px;font-weight:700;color:#18181b;">$${program.price}</span>${buttonHtml}</div></div>`
  }

  const mainHtml = mainPrograms.map(p => renderProgram(p, true)).join('')
  const secondaryHtml = secondaryPrograms.length > 0 
    ? `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;max-width:730px;margin:20px auto 0;">${secondaryPrograms.map(p => renderProgram(p, false)).join('')}</div>`
    : ''

  return `<div style="padding:60px 20px;"><div style="text-align:center;margin-bottom:40px;"><p style="color:#14b8a6;font-weight:600;font-size:14px;margin-bottom:12px;">📱 ${sectionLabel}</p><h2 style="font-size:36px;font-weight:800;color:#18181b;margin-bottom:8px;">${title}</h2><p style="color:#52525b;font-size:16px;">${subtitle}</p></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:1100px;margin:0 auto;">${mainHtml}</div>${secondaryHtml}</div>`
}

/* ─────────── RESULTS RENDERER ─────────── */
export function renderResultsHTML(items: ResultItem[], lang: 'en' | 'ru'): string {
  if (!items || items.length === 0) {
    return `<div style="padding:60px 20px;text-align:center;"><p style="color:#71717a;">No results yet. Add your first client result!</p></div>`
  }

  const title = lang === 'ru' ? 'Результаты клиентов' : 'Client Results'
  const sectionLabel = lang === 'ru' ? 'Реальные результаты' : 'Real transformations'
  const ctaLabel = lang === 'ru' ? 'Начать →' : 'Start →'

  const resultsHtml = items.map(result => {
    const name = lang === 'ru' ? result.nameRu : result.name
    const r = lang === 'ru' ? result.resultRu : result.result
    const quote = lang === 'ru' ? result.quoteRu : result.quote

    return `<div style="background:#fafafa;border-radius:16px;padding:24px;text-align:center;"><div style="font-size:40px;margin-bottom:12px;">${result.icon}</div><h3 style="font-size:20px;font-weight:700;color:#18181b;">${name}, ${result.age}</h3><p style="color:#14b8a6;font-weight:600;margin-bottom:8px;">${r}</p><p style="color:#71717a;font-size:13px;font-style:italic;">"${quote}"</p><div style="color:#eab308;margin-top:8px;">⭐⭐⭐⭐⭐</div></div>`
  }).join('')

  const gridCols = items.length <= 3 ? `repeat(${items.length}, 1fr)` : 'repeat(3, 1fr)'

  return `<div style="padding:60px 20px;"><div style="text-align:center;margin-bottom:40px;"><p style="color:#14b8a6;font-weight:600;font-size:14px;margin-bottom:12px;">⭐ ${sectionLabel}</p><h2 style="font-size:36px;font-weight:800;color:#18181b;margin-bottom:8px;">${title}</h2></div><div style="display:grid;grid-template-columns:${gridCols};gap:24px;max-width:1000px;margin:0 auto;">${resultsHtml}</div><div style="text-align:center;margin-top:40px;"><a href="/auth/register" style="padding:14px 36px;border-radius:16px;background:linear-gradient(135deg,#14b8a6,#0d9488);color:white;font-weight:600;font-size:16px;text-decoration:none;">${ctaLabel}</a></div></div>`
}

/* ─────────── HEADER RENDERER ─────────── */
export function renderHeaderHTML(data: HeaderData, lang: 'en' | 'ru'): string {
  const navLinksHtml = data.navLinks.map(link => {
    const label = lang === 'ru' ? link.labelRu : link.label
    return `<a href="${link.href}" style="color:#52525b;text-decoration:none;">${label}</a>`
  }).join('')

  const loginText = lang === 'ru' ? data.loginTextRu : data.loginText
  const ctaText = lang === 'ru' ? data.ctaTextRu : data.ctaText

  const logoHtml = data.logoImage
    ? `<img src="${data.logoImage}" alt="${data.logoText}" style="width:40px;height:40px;border-radius:12px;object-fit:contain;" />`
    : `<div style="width:40px;height:40px;border-radius:12px;background:${data.logoGradient};display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:18px;">${data.logoIcon}</div>`

  return `<div style="padding:16px 24px;display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e4e4e7;"><div style="display:flex;align-items:center;gap:12px;">${logoHtml}<span style="font-weight:600;font-size:16px;color:#18181b;">${data.logoText}</span></div><div style="display:flex;gap:24px;font-size:14px;">${navLinksHtml}</div><div style="display:flex;gap:8px;"><a href="${data.loginLink}" style="padding:8px 16px;border-radius:12px;border:1px solid #e4e4e7;font-size:14px;color:#18181b;text-decoration:none;">${loginText}</a><a href="${data.ctaLink}" style="padding:8px 16px;border-radius:12px;background:#14b8a6;color:white;font-size:14px;text-decoration:none;">${ctaText}</a></div></div>`
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
  return `<div style="text-align:center;padding:60px 20px;background:${data.gradient};color:white;"><p style="color:#2dd4bf;font-weight:600;font-size:14px;margin-bottom:16px;">${badge}</p><h1 style="font-size:48px;font-weight:800;margin-bottom:8px;">${title}</h1><h1 style="font-size:48px;font-weight:800;color:#2dd4bf;margin-bottom:24px;">${subtitle}</h1><p style="color:#d4d4d8;font-size:18px;max-width:600px;margin:0 auto 32px;">${description}</p><div style="display:flex;gap:12px;justify-content:center;margin-bottom:24px;"><a href="${data.primaryBtnLink}" style="padding:12px 32px;border-radius:16px;background:#14b8a6;color:white;font-weight:600;font-size:16px;text-decoration:none;">${primaryBtn}</a><a href="${data.secondaryBtnLink}" style="padding:12px 32px;border-radius:16px;border:1px solid rgba(255,255,255,0.3);color:white;font-size:16px;text-decoration:none;">${secondaryBtn}</a></div><p style="font-size:14px;color:#a1a1aa;">${featuresHtml}</p></div>`
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
    #${aboutId} .about-section-pad { padding: 32px 24px !important; }
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
