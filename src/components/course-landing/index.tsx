'use client'
import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { getVideoEmbed } from '@/lib/video-embed'
import { defaultLandingContent, mergeLandingContent } from './content'
import type { L, LandingContent } from './content'

/* ═══════════ COURSE LANDING TEMPLATE ═══════════ */
/* Rendered 1:1 from the client's Figma mockup («Qbody — Premium Landing»).
   All texts/photos come from LandingContent (defaults + stored overrides);
   the course structure (modules, lessons, price) comes from the live course. */

const INK = '#0B0D0E'
const CARD_DARK = '#202525'
const PAPER = '#F7F8F5'
const PINK_SECTION = '#FCECF1'
const PINK_BRIGHT = '#FFE2FC'
const MINT = '#B9F3E6'
const MINT_BTN = '#6EE0C8'
const MINT_PALE = '#EAF5F1'
const ACCENT_PINK = '#FF3F79'
const PILL_PINK = '#FF4B81'
const CIRCLE_TEAL = '#0C2C2A'
const CIRCLE_WINE = '#371621'

interface LandingModule {
  id: string
  title: string
  title_secondary?: string | null
  course_lessons?: { id: string; title: string; title_secondary?: string | null }[]
}

interface LandingCourse {
  slug: string
  title: string
  title_secondary?: string | null
  price: number
  hero_video_url?: string | null
  instructor_image_url?: string | null
  course_modules?: LandingModule[]
}

interface Props {
  course: LandingCourse
  /** Stored overrides from site_settings; merged over the defaults here */
  landingData?: any
  ru: boolean
  onBuy: () => void
  buying: boolean
  /** Auth state is still restoring — hold the buy button so the intent is not lost */
  authBusy?: boolean
  /** Logged-in account entry for the header; null → show the sign-in link */
  account?: { href: string; label: string } | null
}

/* ─── helpers ─── */

function useT(ru: boolean) {
  return (t: L | undefined): string => {
    if (!t) return ''
    // || '' — на случай мусора вместо {en,ru} в сохранённых данных:
    // вернуть undefined нельзя, на результате зовут .trim()
    return ru ? (t.ru || t.en || '') : (t.en || t.ru || '')
  }
}

function Photo({ src, label, className = '', dark = false }: { src?: string; label?: string; className?: string; dark?: boolean }) {
  if (src) {
    return <img src={src} alt="" loading="lazy" className={`object-cover ${className}`} />
  }
  return (
    <div className={`flex items-center justify-center ${dark ? 'bg-[#1B1F1F]' : 'bg-[#E6E4DF]'} ${className}`}>
      <span className={`text-[11px] font-bold uppercase tracking-[0.25em] text-center px-4 ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>
        {label || 'ФОТО'}
      </span>
    </div>
  )
}

function Chip({ text, tone }: { text: string; tone: 'pink' | 'mint' }) {
  const cls = tone === 'pink' ? 'bg-[#FFD9E4] text-[#C2325F]' : 'bg-[#CDEFE3] text-[#16645B]'
  return (
    <span className={`inline-block px-3.5 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-[0.12em] ${cls}`}>
      {text}
    </span>
  )
}

/** 1 урок · 2 урока · 5 уроков / 1 lesson · N lessons */
function lessonsWord(n: number, ru: boolean): string {
  if (!ru) return n === 1 ? 'LESSON' : 'LESSONS'
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'УРОК'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'УРОКА'
  return 'УРОКОВ'
}

function MintCheck() {
  return (
    <span className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[13px] font-black" style={{ background: MINT, color: '#0E4F43' }}>
      ✓
    </span>
  )
}

function Heading({ children, light = false, className = '' }: { children: React.ReactNode; light?: boolean; className?: string }) {
  return (
    <h2 className={`font-extrabold uppercase leading-[1.02] tracking-[-0.02em] text-[clamp(30px,4vw,56px)] ${light ? 'text-white' : 'text-[#0B0D0E]'} ${className}`}>
      {children}
    </h2>
  )
}

/* ═══════════ COMPONENT ═══════════ */

export function CourseLanding({ course, landingData, ru, onBuy, buying, authBusy = false, account = null }: Props) {
  const T = useT(ru)
  // Merge once per data change, not on every FAQ/video state tick
  const c: LandingContent = useMemo(
    () => mergeLandingContent(defaultLandingContent(), landingData || {}),
    [landingData]
  )
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [videoOpen, setVideoOpen] = useState(false)

  const maxModules = c.program.maxModules ?? 5
  const modules = (course.course_modules || [])
    .filter(m => (m.course_lessons || []).length > 0)
    .slice(0, maxModules)
  const videoUrl = c.video.url || course.hero_video_url || ''
  const expertPhoto = c.expert.photo || course.instructor_image_url || undefined
  // Точная цена: показываем ровно то, что спишет Stripe (без округления центов)
  const priceValue = (course.price || 0) / 100
  const price = `$${Number.isInteger(priceValue) ? priceValue : priceValue.toFixed(2)}`
  const planName = ru ? (course.title_secondary || course.title) : course.title

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
  const scrollToPricing = () => scrollToId('landing-pricing')

  return (
    <div className="font-sans" style={{ background: PAPER }}>
      {/* ═══ Header ═══ */}
      {/* Липкий: CTA «Получить доступ» остаётся на экране на всём скролле лендинга */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-zinc-100">
        <div className="max-w-[1370px] mx-auto px-4 md:px-5 h-[64px] md:h-[80px] flex items-center justify-between gap-3 md:gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-[#0B0D0E]" style={{ background: MINT_BTN }}>Q</span>
            {/* На узких экранах место отдаём переключателю языка и CTA */}
            <span className="hidden sm:inline text-xl font-bold text-[#0B0D0E]">Qbody</span>
          </Link>
          {/* Якорная навигация по секциям — desktop */}
          <nav className="hidden lg:flex items-center gap-7">
            {([
              ['landing-video', ru ? 'О курсе' : 'About'],
              ['landing-forwho', ru ? 'Для кого' : 'For whom'],
              ['landing-program', ru ? 'Программа' : 'Program'],
              ['landing-expert', ru ? 'Эксперт' : 'Expert'],
              ['landing-faq', 'FAQ'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => scrollToId(id)}
                className="text-[13px] font-bold uppercase tracking-[0.08em] text-zinc-500 hover:text-[#0B0D0E] transition-colors"
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <LanguageSwitcher />
            <Link
              href={account ? account.href : '/auth/login'}
              className="hidden sm:inline-block text-[13px] font-extrabold uppercase tracking-[0.08em] transition-colors hover:text-[#0B0D0E]"
              style={{ color: '#0E7C68' }}
            >
              {account ? account.label : (ru ? 'Войти' : 'Sign in')}
            </Link>
            <button
              onClick={scrollToPricing}
              className="px-3.5 md:px-5 py-2.5 rounded-xl text-[11px] md:text-[12px] font-extrabold uppercase tracking-[0.06em] md:tracking-[0.1em] whitespace-nowrap text-[#0B0D0E] transition-transform hover:scale-[1.03] active:scale-[0.99]"
              style={{ background: MINT_BTN }}
            >
              {T(c.pricing.cta)}
            </button>
          </div>
        </div>
      </header>

      {/* ═══ 01 Hero ═══ */}
      <section className="relative overflow-hidden" style={{ background: INK }}>
        {c.hero.bgImage ? (
          <>
            <img src={c.hero.bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(11,13,14,0.88) 0%, rgba(11,13,14,0.55) 55%, rgba(11,13,14,0.25) 100%)' }} />
          </>
        ) : (
          <>
            <div className="absolute rounded-full pointer-events-none" style={{ background: CIRCLE_TEAL, width: 760, height: 760, right: -90, top: -130 }} />
            <div className="absolute rounded-full pointer-events-none" style={{ background: CIRCLE_WINE, width: 620, height: 620, left: -260, bottom: -310 }} />
          </>
        )}
        <div className="relative max-w-[1370px] mx-auto px-5 py-[clamp(80px,12vw,205px)]">
          <h1 className="font-extrabold uppercase text-white leading-[1.0] tracking-[-0.02em] text-[clamp(32px,5.6vw,76px)]">
            {T(c.hero.titleTop) ? <>{T(c.hero.titleTop)}<br /></> : null}
            <span style={{ color: MINT_BTN }}>{T(c.hero.accent)}</span> {T(c.hero.titleRest)}
          </h1>
          <p className="mt-7 max-w-[620px] text-[clamp(16px,1.6vw,22px)] leading-relaxed text-zinc-300">
            {T(c.hero.subtitle)}
          </p>
          <button
            onClick={scrollToPricing}
            className="mt-10 inline-flex items-center justify-center h-[70px] md:h-[82px] px-10 md:px-16 rounded-2xl font-extrabold uppercase tracking-[0.14em] text-[15px] text-[#0B0D0E] transition-transform hover:scale-[1.02] active:scale-[0.99]"
            style={{ background: MINT_BTN }}
          >
            {T(c.hero.cta)}
          </button>
          <p className="mt-6 text-[13px] tracking-[0.06em] text-zinc-400">{T(c.hero.caption)}</p>
        </div>
      </section>

      {/* ═══ 02 Video ═══ */}
      <section id="landing-video" className="scroll-mt-[88px]" style={{ background: PAPER }}>
        <div className="max-w-[1370px] mx-auto px-5 py-[clamp(56px,7vw,120px)]">
          <Heading>{T(c.video.heading)}</Heading>
          <div className="relative mt-[clamp(28px,4vw,64px)] h-[clamp(240px,32vw,515px)]">
            <div className="absolute inset-y-0 left-0 w-[44%] rounded-[28px]" style={{ background: MINT }} />
            <div className="absolute inset-y-0 right-0 w-full md:w-[61%] rounded-[28px] overflow-hidden" style={{ background: '#0B0D0F' }}>
              {videoUrl && videoOpen ? (
                getVideoEmbed(videoUrl)
              ) : (
                <button
                  onClick={() => videoUrl && setVideoOpen(true)}
                  className="w-full h-full flex items-center justify-center group"
                  aria-label={ru ? 'Смотреть видео' : 'Play video'}
                >
                  <span className="w-[104px] h-[104px] rounded-full bg-white flex items-center justify-center text-[34px] text-[#0B0D0E] pl-1.5 transition-transform group-hover:scale-105">
                    ▶
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 03 Для кого ═══ */}
      <section id="landing-forwho" className="scroll-mt-[88px]" style={{ background: PINK_SECTION }}>
        <div className="max-w-[1370px] mx-auto px-5 py-[clamp(56px,7vw,110px)]">
          <Heading>{T(c.forWho.heading)}</Heading>
          <div className="grid md:grid-cols-2 gap-6 mt-[clamp(28px,4vw,64px)]">
            {c.forWho.cards.map((card, i) => (
              <div key={i} className="rounded-[28px] overflow-hidden flex flex-col" style={{ background: card.dark ? CARD_DARK : MINT_PALE }}>
                <div className="relative h-[280px] md:h-[310px]">
                  <Photo src={card.photo} className="absolute inset-0 w-full h-full" />
                  <span className={`absolute top-4 left-6 text-[80px] font-extrabold leading-none ${card.dark ? 'text-white/40' : 'text-black/15'}`}>
                    {card.num}
                  </span>
                </div>
                <div className="p-8 flex-1">
                  <h3 className={`text-[clamp(20px,1.8vw,26px)] font-extrabold uppercase leading-tight ${card.dark ? 'text-white' : 'text-[#0B0D0E]'}`}>
                    {T(card.title)}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-6 mt-7">
                    <div>
                      <Chip text={ru ? 'Сейчас' : 'Now'} tone="pink" />
                      <p className={`mt-4 text-[14px] leading-relaxed ${card.dark ? 'text-zinc-300' : 'text-zinc-600'}`}>{T(card.nowText)}</p>
                    </div>
                    <div>
                      <Chip text={ru ? 'После курса' : 'After the course'} tone="mint" />
                      <p className={`mt-4 text-[14px] leading-relaxed ${card.dark ? 'text-zinc-300' : 'text-zinc-600'}`}>{T(card.afterText)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 04 Кейсы ═══ */}
      <section style={{ background: PINK_BRIGHT }}>
        <div className="max-w-[1370px] mx-auto px-5 py-[clamp(56px,7vw,110px)]">
          <Heading>{T(c.cases.heading)}</Heading>
          <div className="grid md:grid-cols-3 gap-6 mt-[clamp(28px,4vw,64px)]">
            {c.cases.items.filter(item => item.media || T(item.name).trim() || T(item.before).trim() || T(item.after).trim()).map((item, i) => (
              <div key={i} className="bg-white rounded-[24px] overflow-hidden">
                <div className="relative h-[215px]">
                  {item.media ? (
                    <Photo src={item.media} className="absolute inset-0 w-full h-full" />
                  ) : i === 1 ? (
                    /* средняя карточка в макете — мятная */
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: MINT }}>
                      <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#16645B] text-center px-4">{ru ? 'Фото / видео клиентки' : 'Client photo / video'}</span>
                    </div>
                  ) : (
                    <Photo label={ru ? 'Фото / видео клиентки' : 'Client photo / video'} className="absolute inset-0 w-full h-full" />
                  )}
                </div>
                <div className="p-7">
                  <p className="text-[18px] font-bold text-[#0B0D0E]">{T(item.name)}</p>
                  <div className="mt-4">
                    <Chip text={ru ? 'До' : 'Before'} tone="pink" />
                    <p className="mt-3 text-[13px] leading-relaxed text-zinc-600">{T(item.before)}</p>
                  </div>
                  <div className="mt-5">
                    <Chip text={ru ? 'После' : 'After'} tone="mint" />
                    <p className="mt-3 text-[13px] leading-relaxed text-zinc-600">{T(item.after)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 05 Результаты (bento) ═══ */}
      <section style={{ background: PAPER }}>
        <div className="max-w-[1370px] mx-auto px-5 py-[clamp(56px,7vw,110px)]">
          <Heading>{T(c.results.heading)}</Heading>
          {(() => {
            /* Защита от укороченного массива в сохранённых данных: отсутствующая
               ячейка убирает свой блок, а не роняет всю страницу. */
            const cells = c.results.cells || []
            return (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-[clamp(28px,4vw,64px)]">
                <ResultPhotoCard cell={cells[0]} T={T} className="md:col-span-4" tall />
                <div className="md:col-span-4 flex flex-col gap-6">
                  {cells[1] && (
                    <div className="rounded-[24px] p-7 flex-1" style={{ background: MINT }}>
                      <h3 className="text-[clamp(18px,1.6vw,24px)] font-extrabold uppercase leading-tight text-[#0B0D0E]">{T(cells[1].title)}</h3>
                      <p className="mt-3 text-[14px] leading-relaxed text-[#2A4A42]">{T(cells[1].text)}</p>
                    </div>
                  )}
                  {cells[3] && (
                    <div className="rounded-[24px] p-7 flex-1" style={{ background: INK }}>
                      <h3 className="text-[clamp(18px,1.6vw,24px)] font-extrabold uppercase leading-tight text-white">{T(cells[3].title)}</h3>
                      <p className="mt-3 text-[14px] leading-relaxed text-zinc-400">{T(cells[3].text)}</p>
                    </div>
                  )}
                </div>
                <ResultPhotoCard cell={cells[2]} T={T} className="md:col-span-4" tall />
                <ResultPhotoCard cell={cells[4]} T={T} className="md:col-span-6" />
                <ResultPhotoCard cell={cells[5]} T={T} className="md:col-span-6" />
              </div>
            )
          })()}
        </div>
      </section>

      {/* ═══ 06 Что внутри ═══ */}
      <section style={{ background: PINK_SECTION }}>
        <div className="max-w-[1370px] mx-auto px-5 py-[clamp(56px,7vw,110px)]">
          <Heading>{T(c.inside.heading)}</Heading>
          <div className="grid md:grid-cols-12 gap-6 mt-[clamp(28px,4vw,64px)]">
            {/* Платформа */}
            <div className="md:col-span-7 rounded-[28px] p-9 flex flex-col lg:flex-row gap-8" style={{ background: CARD_DARK }}>
              <div className="flex-1">
                <h3 className="text-[clamp(20px,1.9vw,28px)] font-extrabold uppercase leading-tight text-white">{T(c.inside.platformTitle)}</h3>
                <p className="mt-5 text-[14px] leading-relaxed text-zinc-300 whitespace-pre-line">{T(c.inside.platformText)}</p>
              </div>
              {/* декоративный мокап платформы */}
              <div className="w-full lg:w-[320px] shrink-0 rounded-2xl bg-[#15181A] p-4" aria-hidden>
                <div className="h-10 rounded-lg bg-white/95 mb-4" />
                <div className="flex gap-4">
                  <div className="w-12 rounded-lg" style={{ background: MINT_BTN, height: 180 }} />
                  <div className="flex-1 space-y-3">
                    {[0, 1, 2, 3, 4].map(k => (
                      <div key={k} className="h-7 rounded-md bg-white/95 flex items-center px-3">
                        <div className="h-1.5 w-2/3 rounded" style={{ background: MINT }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Чек-листы */}
            <div className="md:col-span-5 rounded-[28px] p-9 relative overflow-hidden" style={{ background: MINT }}>
              <h3 className="text-[clamp(20px,1.9vw,28px)] font-extrabold uppercase leading-tight text-[#0B0D0E] max-w-[60%]">{T(c.inside.checklistsTitle)}</h3>
              <div className="absolute right-8 bottom-8 w-[160px] rounded-xl bg-white shadow-lg p-5" aria-hidden>
                <p className="text-[15px] font-extrabold uppercase leading-tight text-[#0B0D0E]">Check<br />list</p>
                <div className="mt-4 space-y-2">
                  {[0, 1, 2, 3].map(k => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black" style={{ background: MINT, color: '#0E4F43' }}>✓</span>
                      <div className="h-1.5 flex-1 rounded bg-zinc-200" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Практика */}
            <div className="md:col-span-6 bg-white rounded-[28px] overflow-hidden">
              <Photo src={c.inside.practicePhoto} className="w-full h-[260px]" />
              <div className="p-8">
                <h3 className="text-[clamp(18px,1.7vw,26px)] font-extrabold uppercase leading-tight text-[#0B0D0E]">{T(c.inside.practiceTitle)}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-zinc-600">{T(c.inside.practiceText)}</p>
              </div>
            </div>
            {/* Программы */}
            <div className="md:col-span-6 rounded-[28px] overflow-hidden flex flex-col sm:flex-row" style={{ background: INK }}>
              <Photo src={c.inside.plansPhoto} dark className="w-full sm:w-[300px] h-[220px] sm:h-auto shrink-0" />
              <div className="p-8 flex-1">
                <h3 className="text-[clamp(18px,1.7vw,26px)] font-extrabold uppercase leading-tight text-white">{T(c.inside.plansTitle)}</h3>
                <ul className="mt-6 space-y-4">
                  {c.inside.plansItems.filter(item => T(item).trim()).map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-[15px] text-zinc-200">
                      <MintCheck />
                      {T(item)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 07 Цифры ═══ */}
      <section style={{ background: PAPER }}>
        <div className="max-w-[1370px] mx-auto px-5 py-[clamp(40px,5vw,80px)]">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {c.stats.filter(s => (s.value || '').trim() || T(s.label).trim()).map((s, i) => (
              <div key={i} className={`px-6 py-5 ${i > 0 ? 'md:border-l md:border-zinc-300' : ''}`}>
                <p className="text-[clamp(38px,4vw,60px)] font-extrabold leading-none text-[#0B0D0E]">{s.value}</p>
                <p className="mt-3 text-[16px] font-extrabold uppercase tracking-[0.06em] text-[#0B0D0E]">{T(s.label)}</p>
                <p className="mt-1.5 text-[13px] text-zinc-500">{T(s.sub)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 08 Программа курса ═══ */}
      <section id="landing-program" className="scroll-mt-[88px]" style={{ background: INK }}>
        <div className="max-w-[1370px] mx-auto px-5 py-[clamp(64px,8vw,150px)]">
          <Heading light>{T(c.program.heading)}</Heading>
          <div className="space-y-8 mt-[clamp(28px,4vw,64px)]">
            {modules.map((m, mi) => {
              const lessons = m.course_lessons || []
              // Сначала по id модуля (стабильно при перестановках), затем по позиции
              const bullets = c.program.resultsByModule?.[m.id] || c.program.results[mi] || []
              return (
                <div key={m.id} className="bg-white rounded-[28px] p-7 md:p-10">
                  <div className="flex flex-wrap items-start gap-4 md:gap-6">
                    <span className="text-[clamp(28px,2.6vw,40px)] font-extrabold leading-none" style={{ color: ACCENT_PINK }}>
                      {String(mi + 1).padStart(2, '0')}.
                    </span>
                    <h3 className="flex-1 min-w-[200px] text-[clamp(18px,1.9vw,28px)] font-extrabold uppercase leading-tight text-[#0B0D0E] pt-1">
                      {ru ? (m.title_secondary || m.title) : m.title}
                    </h3>
                    <span className="px-5 py-2 rounded-full text-[12px] font-extrabold uppercase tracking-[0.14em] text-white" style={{ background: INK }}>
                      {lessons.length} {lessonsWord(lessons.length, ru)}
                    </span>
                  </div>
                  <div className="grid lg:grid-cols-12 gap-8 mt-8">
                    <div className="lg:col-span-7 grid sm:grid-cols-2 gap-x-10 gap-y-5">
                      {lessons.map((lesson, li) => (
                        <div key={lesson.id} className="flex gap-3">
                          <span className="text-[13px] font-extrabold pt-0.5" style={{ color: ACCENT_PINK }}>
                            {String(li + 1).padStart(2, '0')}.
                          </span>
                          <p className="text-[13px] leading-relaxed text-zinc-600">
                            {(ru ? (lesson.title_secondary || lesson.title) : lesson.title).replace(/^Урок \d+\.\s*/i, '').replace(/^Lesson \d+\.\s*/i, '')}
                          </p>
                        </div>
                      ))}
                    </div>
                    {bullets.some(b => T(b).trim()) && (
                      <div className="lg:col-span-5">
                        <div className="rounded-[20px] p-7" style={{ background: MINT }}>
                          <p className="text-[14px] font-extrabold uppercase tracking-[0.1em] text-[#0B0D0E]">{T(c.program.resultLabel)}</p>
                          <ul className="mt-4 space-y-2.5">
                            {bullets.filter(b => T(b).trim()).map((b, bi) => (
                              <li key={bi} className="flex gap-2.5 text-[14px] font-bold leading-snug text-[#0B0D0E]">
                                <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#0B0D0E] shrink-0" />
                                {T(b)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ 09 Эксперт ═══ */}
      <section id="landing-expert" className="scroll-mt-[88px]" style={{ background: PAPER }}>
        <div className="max-w-[1370px] mx-auto px-5 py-[clamp(56px,7vw,115px)]">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 relative rounded-[32px] overflow-hidden h-[420px] md:h-[600px] lg:h-[730px]">
              <Photo src={expertPhoto} className="absolute inset-0 w-full h-full" />
              <span className="absolute left-8 bottom-8 px-6 py-2.5 rounded-full text-[12px] font-extrabold uppercase tracking-[0.12em] text-white" style={{ background: PILL_PINK }}>
                {T(c.expert.badge)}
              </span>
            </div>
            <div className="lg:col-span-7">
              <p className="text-[13px] font-extrabold uppercase tracking-[0.2em]" style={{ color: '#0E9B82' }}>{T(c.expert.kicker)}</p>
              <Heading className="mt-4">{T(c.expert.title)}</Heading>
              <p className="mt-6 max-w-[650px] text-[clamp(15px,1.4vw,19px)] leading-relaxed text-zinc-600">{T(c.expert.text)}</p>
              <div className="grid sm:grid-cols-2 gap-5 mt-9">
                {c.expert.facts.filter(f => T(f.title).trim() || T(f.sub).trim()).map((f, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-5">
                    <p className="text-[14px] font-extrabold uppercase leading-snug text-[#0B0D0E]">{T(f.title)}</p>
                    {T(f.sub) && <p className="mt-1 text-[13px] text-zinc-500">{T(f.sub)}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 10 Бонус ═══ */}
      <section style={{ background: INK }}>
        <div className="max-w-[1370px] mx-auto px-5 py-[clamp(56px,7vw,120px)]">
          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-10">
            <Heading light className="shrink-0">{T(c.bonus.label)}</Heading>
            <Heading light>{T(c.bonus.heading)}</Heading>
          </div>
          <p className="mt-7 max-w-[900px] text-[15px] leading-relaxed text-zinc-400">{T(c.bonus.text)}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-[clamp(28px,4vw,60px)]">
            {c.bonus.cards.filter(card => card.photo || T(card.title).trim() || T(card.text).trim()).map((card, i) => (
              <div key={i}>
                <Photo src={card.photo} dark className="w-full h-[300px] md:h-[380px] rounded-[20px]" />
                <p className="mt-5 text-[17px] font-extrabold uppercase text-white">{T(card.title)}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">{T(card.text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 11 Тариф ═══ */}
      <section id="landing-pricing" className="scroll-mt-[88px]" style={{ background: INK }}>
        <div className="max-w-[1370px] mx-auto px-5 pb-[clamp(64px,8vw,130px)] pt-2">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-6">
              <Heading light>{T(c.pricing.heading)}</Heading>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6 mt-10">
                {c.pricing.bullets.filter(b => T(b).trim()).map((b, i) => (
                  <div key={i} className="flex items-center gap-3.5 text-[15px] text-zinc-200">
                    <MintCheck />
                    {T(b)}
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-6 flex lg:justify-end">
              <div className="w-full max-w-[485px] bg-white rounded-[28px] overflow-hidden">
                <div className="h-3" style={{ background: ACCENT_PINK }} />
                <div className="p-9 text-center">
                  <p className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#0B0D0E]">{T(c.pricing.planLabel)}</p>
                  <p className="mt-2 text-[15px] text-zinc-500">{planName}</p>
                  <p className="mt-6 text-[clamp(52px,5vw,72px)] font-extrabold leading-none text-[#0B0D0E]">{price}</p>
                  <p className="mt-6 text-[13px] leading-relaxed text-zinc-500 max-w-[350px] mx-auto">{T(c.pricing.note)}</p>
                  <button
                    onClick={onBuy}
                    disabled={buying || authBusy}
                    className="mt-8 w-full h-[70px] rounded-2xl font-extrabold uppercase tracking-[0.14em] text-[15px] text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: ACCENT_PINK }}
                  >
                    {buying && <Loader2 className="w-5 h-5 animate-spin" />}
                    {T(c.pricing.cta)}
                  </button>
                  <p className="mt-5 text-[12px] text-zinc-400">{T(c.pricing.secure)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 12 FAQ ═══ */}
      <section id="landing-faq" className="scroll-mt-[88px]" style={{ background: MINT }}>
        <div className="max-w-[1370px] mx-auto px-5 py-[clamp(56px,7vw,120px)]">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <Heading>{T(c.faq.heading)}</Heading>
            </div>
            <div className="lg:col-span-7">
              {c.faq.items.filter(item => T(item.q).trim()).map((item, i) => (
                <div key={i} className="border-b" style={{ borderColor: 'rgba(11,13,14,0.15)' }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-6 py-6 text-left"
                    aria-expanded={openFaq === i}
                  >
                    <span className="text-[15px] font-bold text-[#0B0D0E]">{T(item.q)}</span>
                    <span className="text-[26px] font-light leading-none text-[#0B0D0E] shrink-0">{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && T(item.a) && (
                    <p className="pb-6 -mt-1 text-[14px] leading-relaxed text-[#2A4A42] max-w-[640px]">{T(item.a)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer style={{ background: INK }}>
        <div className="max-w-[1370px] mx-auto px-5 h-[110px] flex flex-col sm:flex-row items-center justify-between gap-3 py-6 sm:py-0">
          <Link href="/" className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold text-[#0B0D0E]" style={{ background: MINT_BTN }}>Q</span>
            <span className="text-lg font-bold text-white">Qbody</span>
          </Link>
          <p className="text-[13px] text-zinc-500">© {new Date().getFullYear()} Qbody by Khavanskaia</p>
          <p className="text-[13px] text-zinc-500">
            <Link href="/privacy" className="hover:text-zinc-300">Privacy</Link>
            <span className="mx-2">·</span>
            <Link href="/terms" className="hover:text-zinc-300">Terms</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ─── Result bento photo card ─── */
function ResultPhotoCard({ cell, T, className = '', tall = false }: {
  cell?: { title: L; text: L; photo?: string }
  T: (t: L | undefined) => string
  className?: string
  tall?: boolean
}) {
  if (!cell) return null
  return (
    <div className={`rounded-[24px] overflow-hidden flex flex-col ${className}`} style={{ background: '#14110D' }}>
      <Photo src={cell.photo} className={`w-full ${tall ? 'h-[300px] md:h-[380px]' : 'h-[165px]'}`} />
      <div className="px-6 py-5">
        <h3 className="text-[16px] font-extrabold uppercase text-white">{T(cell.title)}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">{T(cell.text)}</p>
      </div>
    </div>
  )
}
