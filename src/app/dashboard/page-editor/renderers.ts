import type { CourseItem, ProgramItem, ResultItem } from './types'

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

    const featuresHtml = features.map(f => 
      `<li style="padding:3px 0;font-size:13px;color:#52525b;">✅ ${f}</li>`
    ).join('')

    const popularBadge = program.popular 
      ? `<div style="position:absolute;top:12px;right:12px;background:#14b8a6;color:white;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">${popularLabel}</div>`
      : ''

    const borderStyle = program.popular ? 'border:2px solid #14b8a6' : 'border:1px solid #e4e4e7'
    const btnStyle = program.popular 
      ? 'background:#14b8a6;color:white'
      : 'border:1px solid #e4e4e7;color:#18181b'

    return `<div style="background:white;${borderStyle};border-radius:16px;padding:24px;position:relative;">${popularBadge}<div style="width:48px;height:48px;border-radius:12px;background:${program.gradient};display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:20px;">${program.icon}</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">${t}</h3><p style="color:#52525b;font-size:14px;margin-bottom:12px;">${d}</p><p style="font-size:13px;color:#71717a;margin-bottom:16px;">⏱ ${program.duration} · ${levelLabel}</p><ul style="list-style:none;padding:0;margin:0 0 16px;">${featuresHtml}</ul><div style="border-top:1px solid #e4e4e7;padding-top:16px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:24px;font-weight:700;color:#18181b;">$${program.price}</span><a href="${program.link}" style="padding:8px 16px;border-radius:12px;${btnStyle};font-size:13px;text-decoration:none;">${detailsLabel}</a></div></div>`
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

/* ─────────── GRADIENTS PRESETS ─────────── */
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
