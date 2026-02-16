'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation, useRendererLang } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { useSmoothAnchor, useLazyImages } from '@/components/ui/scroll-reveal'
import {
  Menu, X, User, LayoutDashboard
} from 'lucide-react'
import { renderAboutHTML, renderCoursesHTML, renderProgramsHTML, renderResultsHTML } from '@/app/dashboard/page-editor/renderers'
import { renderHtmlBlockHTML, renderSliderHTML, renderHeroTemplateHTML } from '@/app/dashboard/page-editor/new-block-renderers'
import { renderCourses2HTML } from '@/app/dashboard/page-editor/courses'
import type { CourseItem2, CourseSectionData } from '@/app/dashboard/page-editor/courses'
import { renderAbout2HTML } from '@/app/dashboard/page-editor/about'
import type { AboutSectionData } from '@/app/dashboard/page-editor/about'
import { renderCta2HTML } from '@/app/dashboard/page-editor/cta'
import type { CtaSectionData } from '@/app/dashboard/page-editor/cta'
import { renderFaq2HTML } from '@/app/dashboard/page-editor/faq'
import type { FaqSectionData } from '@/app/dashboard/page-editor/faq'
import { renderContact2HTML } from '@/app/dashboard/page-editor/contact'
import type { ContactSectionData } from '@/app/dashboard/page-editor/contact'
import { renderFooter2HTML } from '@/app/dashboard/page-editor/footer'
import type { FooterSectionData } from '@/app/dashboard/page-editor/footer'
import type { AboutData, CourseItem, ProgramItem, ResultItem, HtmlBlockData, SliderData, HeroTemplateData } from '@/app/dashboard/page-editor/types'
import { sanitizeHTML, sanitizeStyleObj } from '@/lib/sanitize-html'

/* ═══════════ TYPES ═══════════ */
interface PageBlock {
  id: string
  type: string
  label: string
  labelRu: string
  visible: boolean
  contentEn: string
  contentRu: string
  style: Record<string, any>
  data?: any
  items?: any
}

/* ═══════════ Convert style object → inline CSS string ═══════════ */
/** ✅ XSS PROTECTION: Validate URL for safe use in CSS */
function isSafeCSSUrl(url: string): boolean {
  if (!url) return false
  const lower = url.trim().toLowerCase()
  if (lower.startsWith('javascript:')) return false
  if (lower.startsWith('vbscript:')) return false
  if (lower.startsWith('data:text/html')) return false
  if (lower.includes('expression(')) return false
  // Only allow http(s), data:image, and relative URLs
  if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('/') || lower.startsWith('data:image/')) return true
  return !lower.includes(':')
}

function styleToCSS(s: Record<string, any>): React.CSSProperties {
  const css: React.CSSProperties = {}
  if (!s) return css
  if (s.bgGradient) css.background = s.bgGradient
  else if (s.bgColor) css.backgroundColor = s.bgColor
  if (s.bgImage && isSafeCSSUrl(s.bgImage)) {
    css.backgroundImage = `url(${encodeURI(s.bgImage)})`
    css.backgroundSize = 'cover'
    css.backgroundPosition = 'center'
  }
  if (s.paddingTop) css.paddingTop = `${s.paddingTop}px`
  if (s.paddingBottom) css.paddingBottom = `${s.paddingBottom}px`
  if (s.paddingLeft) css.paddingLeft = `${s.paddingLeft}px`
  if (s.paddingRight) css.paddingRight = `${s.paddingRight}px`
  if (s.marginTop) css.marginTop = `${s.marginTop}px`
  if (s.marginBottom) css.marginBottom = `${s.marginBottom}px`
  if (s.maxWidth) { css.maxWidth = s.maxWidth; css.marginLeft = 'auto'; css.marginRight = 'auto' }
  if (s.borderRadius) css.borderRadius = `${s.borderRadius}px`
  if (s.borderWidth && s.borderColor) css.border = `${s.borderWidth}px solid ${s.borderColor}`
  if (s.boxShadow) css.boxShadow = s.boxShadow
  return css
}

/* ═══════════ HEADER (reads data from DB, falls back to defaults) ═══════════ */
function Header({ headerData, lang }: { headerData?: any; lang: 'en' | 'ru' }) {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const ru = lang === 'ru'

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  React.useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isMobileMenuOpen])

  const d = headerData
  const variant = d?.variant || 'classic'
  const accent = d?.accentColor || '#14b8a6'
  const bgColor = d?.bgColor || '#000000'
  const textColor = d?.textColor || '#ffffff'
  const logoPos = d?.logoPosition || 'left'
  const navPos = d?.navPosition || 'center'
  const isSticky = d?.sticky !== false
  const topBar = d?.topBar
  const sub = ru ? (d?.logoSubtextRu || d?.logoSubtext || 'by Khavanskaia') : (d?.logoSubtext || 'by Khavanskaia')

  const navigation = d?.navLinks?.length
    ? d.navLinks.map((link: any) => ({ name: ru ? (link.labelRu || link.label) : link.label, href: link.href }))
    : [
        { name: t('nav.home'), href: '/' },
        { name: t('nav.programs'), href: '#programs' },
        { name: t('nav.courses'), href: '#courses' },
        { name: t('nav.about'), href: '#about' },
        { name: t('nav.results'), href: '#results' },
        { name: t('nav.contacts'), href: '#contacts' },
      ]

  const loginText = d ? (ru ? (d.loginTextRu || d.loginText) : d.loginText) : t('nav.login')
  const loginLink = d?.loginLink || '/auth/login'
  const ctaText = d ? (ru ? (d.ctaTextRu || d.ctaText) : d.ctaText) : t('nav.getStarted')
  const ctaLink = d?.ctaLink || '#programs'
  const logoText = d?.logoText || 'Qbody'
  const logoIcon = d?.logoIcon || 'Q'

  const navJustify = navPos === 'left' ? 'justify-start' : navPos === 'right' ? 'justify-end' : 'justify-center'

  /* ── Sub-components ── */
  const LogoBlock = () => (
    <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
      {d?.logoImage ? (
        <img src={d.logoImage.includes('supabase.co') ? `/api/img?src=${encodeURIComponent(d.logoImage)}&w=80&q=75` : d.logoImage} alt={logoText} width="36" height="36" className="w-9 h-9 rounded-xl object-contain" />
      ) : (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: d?.logoGradient || `linear-gradient(135deg,${accent},${accent}dd)` }}>
          <span className="text-white font-bold text-base">{logoIcon}</span>
        </div>
      )}
      <span className="lg:hidden text-sm font-semibold" style={{ color: accent }}>{logoText}</span>
      <div className="hidden lg:block">
        <span className="font-semibold text-lg block leading-tight" style={{ color: textColor }}>{logoText}</span>
        {sub && <span className="text-sm block -mt-0.5" style={{ color: accent }}>{sub}</span>}
      </div>
    </Link>
  )

  const NavLinks = () => (
    <div className={`hidden lg:flex items-center gap-6 xl:gap-8 ${navJustify}`}>
      {navigation.map((item: any) => (
        <Link key={item.name} href={item.href} className="text-sm font-medium transition-colors hover:opacity-100" style={{ color: `${textColor}cc` }}
          onMouseEnter={e => (e.currentTarget.style.color = accent)} onMouseLeave={e => (e.currentTarget.style.color = `${textColor}cc`)}>
          {item.name}
        </Link>
      ))}
    </div>
  )

  const AuthButtons = () => (
    <div className="flex items-center gap-3">
      <LanguageSwitcher variant="dropdown" className="hidden sm:block" />
      {!authLoading && user ? (
        <Link href="/dashboard" className="hidden lg:block">
          <Button variant="gradient"><LayoutDashboard className="w-4 h-4 mr-2" />{t('nav.dashboard') || 'Dashboard'}</Button>
        </Link>
      ) : (
        <>
          <Link href={loginLink} className="hidden lg:block">
            <Button variant="ghost" className="hover:opacity-80" style={{ color: `${textColor}cc`, borderColor: `${textColor}20` }}>
              <User className="w-4 h-4 mr-2" />{loginText}
            </Button>
          </Link>
          <Link href={ctaLink} className="hidden lg:block">
            <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: accent }}>{ctaText}</button>
          </Link>
        </>
      )}
      <button className="lg:hidden p-2 relative z-[60]" style={{ color: textColor }} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu">
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
    </div>
  )

  /* ── Variant layouts ── */
  const renderDesktop = () => {
    if (variant === 'centered') {
      return (
        <div className="container-custom">
          <div className="flex flex-col items-center gap-1 py-3 lg:py-4">
            <LogoBlock />
            <div className="flex items-center gap-4">
              <NavLinks />
              <div className="hidden lg:flex items-center gap-2 ml-4">
                <LanguageSwitcher variant="dropdown" />
                {!authLoading && user ? (
                  <Link href="/dashboard"><Button variant="gradient" size="sm"><LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />{t('nav.dashboard') || 'Dashboard'}</Button></Link>
                ) : (
                  <Link href={ctaLink}><button className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: accent }}>{ctaText}</button></Link>
                )}
              </div>
            </div>
          </div>
          {/* Mobile hamburger for centered */}
          <div className="lg:hidden absolute top-3 right-4">
            <button className="p-2 relative z-[60]" style={{ color: textColor }} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      )
    }

    if (variant === 'minimal') {
      return (
        <div className="container-custom">
          <div className="flex items-center justify-between h-16 lg:h-[68px]">
            <LogoBlock />
            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              <NavLinks />
              <LanguageSwitcher variant="dropdown" />
              {!authLoading && user ? (
                <Link href="/dashboard"><Button variant="gradient" size="sm"><LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />{t('nav.dashboard') || 'Dashboard'}</Button></Link>
              ) : (
                <Link href={ctaLink}><button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: accent }}>{ctaText}</button></Link>
              )}
            </div>
            <button className="lg:hidden p-2 relative z-[60]" style={{ color: textColor }} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      )
    }

    if (variant === 'split') {
      return (
        <>
          <div className="h-[3px]" style={{ background: accent }} />
          <div className="container-custom">
            <div className="flex items-center justify-between h-16 lg:h-[68px]">
              <LogoBlock />
              <NavLinks />
              <AuthButtons />
            </div>
          </div>
        </>
      )
    }

    // Classic
    if (logoPos === 'center') {
      return (
        <div className="container-custom">
          <div className="flex items-center justify-between h-16 lg:h-[68px] relative">
            <div className="flex-1" />
            <div className="absolute left-1/2 -translate-x-1/2"><LogoBlock /></div>
            <div className="flex-1 flex justify-end"><AuthButtons /></div>
          </div>
          <div className={`hidden lg:flex pb-2 ${navJustify}`}>
            {navigation.map((item: any) => (
              <Link key={item.name} href={item.href} className="text-sm font-medium px-3 py-1 transition-colors" style={{ color: `${textColor}cc` }}
                onMouseEnter={e => (e.currentTarget.style.color = accent)} onMouseLeave={e => (e.currentTarget.style.color = `${textColor}cc`)}>
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <LogoBlock />
          <div className={`flex-1 hidden lg:flex items-center gap-8 mx-6 ${navJustify}`}>
            {navigation.map((item: any) => (
              <Link key={item.name} href={item.href} className="text-sm font-medium transition-colors" style={{ color: `${textColor}cc` }}
                onMouseEnter={e => (e.currentTarget.style.color = accent)} onMouseLeave={e => (e.currentTarget.style.color = `${textColor}cc`)}>
                {item.name}
              </Link>
            ))}
          </div>
          <AuthButtons />
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Top bar */}
      {topBar?.enabled && (
        <div className="text-center text-sm py-2 px-4" style={{ background: topBar.bgColor || accent }}>
          <a href={topBar.link || '#'} className="font-medium hover:underline" style={{ color: topBar.textColor || '#fff' }}>
            {ru ? topBar.textRu : topBar.text}
          </a>
        </div>
      )}

      {/* Header bar */}
      <header role="banner" className={`${isSticky ? 'sticky top-0' : 'relative'} left-0 right-0 z-50 transition-all duration-300`}
        style={{ background: isScrolled || isMobileMenuOpen ? bgColor : `${bgColor}${Math.round((d?.bgOpacity ?? 1) * 255).toString(16).padStart(2,'0')}`, borderBottom: `1px solid ${textColor}12` }}>
        {renderDesktop()}
      </header>

      {/* ── Mobile Menu Overlay ── */}
      <div className={`fixed inset-0 bg-black/60 z-[55] lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)} />

      {/* Slide-in panel */}
      <div className={`fixed top-0 right-0 bottom-0 w-full max-w-sm z-[56] lg:hidden flex flex-col transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: bgColor }}>
        <div className="flex items-center justify-between h-16 px-6 flex-shrink-0" style={{ borderBottom: `1px solid ${textColor}15` }}>
          <span className="text-sm font-semibold" style={{ color: accent }}>{logoText}{sub ? ` ${sub}` : ''}</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2" style={{ color: textColor }}><X className="w-6 h-6" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-1">
            {navigation.map((item: any, i: number) => (
              <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                className="block text-lg font-medium px-4 py-3.5 rounded-xl transition-all"
                style={{
                  color: `${textColor}dd`,
                  transitionDelay: isMobileMenuOpen ? `${(i + 1) * 60}ms` : '0ms',
                  transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(40px)',
                  opacity: isMobileMenuOpen ? 1 : 0,
                  transition: 'transform 0.3s ease, opacity 0.3s ease, background-color 0.15s ease',
                }}>
                {item.name}
              </Link>
            ))}
          </div>
          <div className="my-6" style={{ borderTop: `1px solid ${textColor}15`, transitionDelay: isMobileMenuOpen ? `${(navigation.length + 1) * 60}ms` : '0ms', opacity: isMobileMenuOpen ? 1 : 0, transition: 'opacity 0.3s ease' }} />
          <div className="space-y-3" style={{ transitionDelay: isMobileMenuOpen ? `${(navigation.length + 2) * 60}ms` : '0ms', transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(40px)', opacity: isMobileMenuOpen ? 1 : 0, transition: 'transform 0.3s ease, opacity 0.3s ease' }}>
            {!authLoading && user ? (
              <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block">
                <button className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-white" style={{ background: accent }}>
                  <LayoutDashboard className="w-5 h-5" />{t('nav.dashboard') || 'Dashboard'}
                </button>
              </Link>
            ) : (
              <>
                <Link href={loginLink} onClick={() => setIsMobileMenuOpen(false)} className="block">
                  <button className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium transition-colors" style={{ color: textColor, border: `1px solid ${textColor}25` }}>
                    <User className="w-5 h-5" />{loginText}
                  </button>
                </Link>
                <Link href={ctaLink} onClick={() => setIsMobileMenuOpen(false)} className="block">
                  <button className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-white" style={{ background: accent }}>
                    {ctaText}
                  </button>
                </Link>
              </>
            )}
            <div className="flex justify-center pt-2"><LanguageSwitcher variant="dropdown" /></div>
          </div>
        </nav>
        <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${textColor}15`, transitionDelay: isMobileMenuOpen ? `${(navigation.length + 3) * 60}ms` : '0ms', opacity: isMobileMenuOpen ? 1 : 0, transition: 'opacity 0.4s ease' }}>
          <p className="text-xs text-center" style={{ color: `${textColor}40` }}>© {new Date().getFullYear()} {logoText}{sub ? ` ${sub}` : ''}</p>
        </div>
      </div>
    </>
  )
}

/* ═══════════ IMAGE PROXY HELPER ═══════════ */
/** Rewrite Supabase image URLs → /api/img proxy with resize + WebP + cache */
function proxyImages(html: string, widthHint?: number, qualityHint?: number): string {
  return html.replace(
    /src="(https:\/\/crybeycjfpyyxjgszcpu\.supabase\.co\/storage\/v1\/object\/public\/[^"]+)"/g,
    (_, url) => {
      const params = new URLSearchParams({ src: url })
      if (widthHint) params.set('w', String(widthHint))
      if (qualityHint) params.set('q', String(qualityHint))
      return `src="/api/img?${params.toString()}"`
    }
  )
}

/* ═══════════ DYNAMIC BLOCK RENDERER ═══════════ */
function DynamicBlock({ block, lang, index }: { block: PageBlock; lang: 'en' | 'ru'; index?: number }) {
  if (!block.visible) return null

  // Re-render structured blocks from data/items to ensure latest dark theme design
  let content: string
  if (block.type === 'about' && block.data) {
    content = renderAboutHTML(block.data as AboutData, lang)
  } else if (block.type === 'courses' && block.items) {
    content = renderCoursesHTML(block.items as CourseItem[], lang)
  } else if (block.type === 'programs' && block.items) {
    content = renderProgramsHTML(block.items as ProgramItem[], lang)
  } else if (block.type === 'results' && block.items) {
    content = renderResultsHTML(block.items as ResultItem[], lang)
  } else if (block.type === 'htmlblock' && block.data) {
    content = renderHtmlBlockHTML(block.data as HtmlBlockData, lang)
  } else if (block.type === 'slider' && block.data) {
    content = renderSliderHTML(block.data as SliderData, lang)
  } else if (block.type === 'herotemplate' && block.data) {
    content = renderHeroTemplateHTML(block.data as HeroTemplateData, lang)
  } else if ((block.type as any) === 'courses2' && block.data) {
    const dd = block.data as any
    content = renderCourses2HTML(dd.items || [], dd.section || {}, lang)
  } else if ((block.type as any) === 'about2' && block.data) {
    const dd = block.data as any
    content = renderAbout2HTML(dd.section || {}, lang)
  } else if ((block.type as any) === 'cta2' && block.data) {
    const dd = block.data as any
    content = renderCta2HTML(dd.section || {}, lang)
  } else if ((block.type as any) === 'faq2' && block.data) {
    const dd = block.data as any
    content = renderFaq2HTML(dd.section || {}, lang)
  } else if ((block.type as any) === 'contact2' && block.data) {
    const dd = block.data as any
    content = renderContact2HTML(dd.section || {}, lang)
  } else if ((block.type as any) === 'footer2' && block.data) {
    const dd = block.data as any
    content = renderFooter2HTML(dd.section || {}, lang)
  } else {
    content = lang === 'ru' ? block.contentRu : block.contentEn
  }
  if (!content) return null

  // ✅ XSS PROTECTION: Sanitize all HTML before rendering
  let safeContent = sanitizeHTML(content)

  // ✅ IMAGE OPTIMIZATION: Route Supabase images through /api/img proxy
  if (block.type === 'hero') {
    safeContent = proxyImages(safeContent, 800, 80) // Hero: 800px wide for 2x retina
  } else if (block.type === 'about') {
    safeContent = proxyImages(safeContent, 600, 78)
  } else {
    safeContent = proxyImages(safeContent, 1200, 80)
  }

  // ✅ LOGO: Proxy logo at small size
  safeContent = safeContent.replace(
    /src="(https:\/\/crybeycjfpyyxjgszcpu\.supabase\.co[^"]+)"/g,
    (match, url) => {
      if (match.includes('/api/img')) return match // Already proxied
      const params = new URLSearchParams({ src: url, w: '160', q: '75' })
      return `src="/api/img?${params.toString()}"`
    }
  )

  // ✅ LCP OPTIMIZATION: Add fetchpriority="high" and dimensions to hero images
  if (block.type === 'hero') {
    safeContent = safeContent.replace(
      /<img\s+(class="hero-image")/gi,
      '<img fetchpriority="high" loading="eager" width="400" height="600" $1'
    )
    if (!safeContent.includes('fetchpriority')) {
      safeContent = safeContent.replace(
        /<img\s/i,
        '<img fetchpriority="high" loading="eager" '
      )
    }
  }

  // ✅ LAZY LOAD: Add loading="lazy" to non-hero images
  if (block.type !== 'hero') {
    safeContent = safeContent.replace(
      /<img(?![^>]*loading=)/gi,
      '<img loading="lazy" '
    )
  }

  // For structured blocks rendered on-the-fly, skip section styles (renderer includes its own bg)
  const isStructured = ['about', 'about2', 'cta2', 'faq2', 'contact2', 'footer2', 'courses', 'courses2', 'programs', 'results', 'htmlblock', 'slider', 'herotemplate'].includes(block.type) && (block.data || block.items)
  // ✅ XSS PROTECTION: Sanitize style object (block javascript: in bgImage etc.)
  const safeStyle = sanitizeStyleObj(block.style || {})
  const sectionStyle = isStructured ? {} : styleToCSS(safeStyle as any)

  // Map block type to HTML section id for anchor links
  // ✅ XSS PROTECTION: Sanitize htmlId to prevent attribute injection
  const rawId = block.style?.htmlId || ''
  const cleanHtmlId = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50)
  const sectionId = block.type === 'hero' ? undefined
    : block.type === 'programs' ? 'programs'
    : block.type === 'courses' ? 'courses'
    : (block.type as any) === 'courses2' ? 'courses'
    : block.type === 'about' ? 'about'
    : (block.type as any) === 'about2' ? 'about'
    : block.type === 'results' ? 'results'
    : block.type === 'footer' ? 'contacts'
    : cleanHtmlId || undefined

  // ✅ CLS FIX: Reserve space for hero section to prevent layout shift
  const heroStyle = block.type === 'hero' ? { minHeight: '100vh', ...sectionStyle } : sectionStyle

  // ✅ SMOOTH ANIMATIONS: Assign reveal class based on block type
  // Hero gets instant reveal (above fold), other blocks get scroll-triggered
  const revealClass = block.type === 'hero'
    ? '' // Hero uses hero-reveal inside its HTML
    : index !== undefined && index % 2 === 0
      ? 'reveal-up'
      : 'reveal-up'

  return (
    <section id={sectionId} style={heroStyle} className={revealClass}>
      <div dangerouslySetInnerHTML={{ __html: safeContent }} />
    </section>
  )
}

/* ═══════════ LOADING SKELETON — matches hero layout to prevent CLS ═══════════ */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero skeleton — exact match to real hero to prevent CLS */}
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '48px', flexWrap: 'wrap' }}>
            {/* Text side skeleton */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ width: '200px', height: '24px', background: '#27272a', borderRadius: '8px', marginBottom: '16px' }} />
              <div style={{ width: '100%', maxWidth: '500px', height: '48px', background: '#27272a', borderRadius: '8px', marginBottom: '12px' }} />
              <div style={{ width: '80%', maxWidth: '400px', height: '48px', background: '#27272a', borderRadius: '8px', marginBottom: '24px' }} />
              <div style={{ width: '60%', maxWidth: '350px', height: '20px', background: '#27272a', borderRadius: '8px', marginBottom: '32px' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '160px', height: '48px', background: '#27272a', borderRadius: '12px' }} />
                <div style={{ width: '160px', height: '48px', background: '#1c1c1e', borderRadius: '12px', border: '1px solid #3f3f46' }} />
              </div>
            </div>
            {/* Image side skeleton */}
            <div style={{ width: '400px', height: '500px', background: '#27272a', borderRadius: '24px', flexShrink: 0 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════ MAIN PAGE ═══════════ */
export default function HomePage() {
  const { locale } = useTranslation()
  const lang = useRendererLang()
  const [blocks, setBlocks] = useState<PageBlock[]>([])
  const [settings, setSettings] = useState<{ branding?: { heroImageUrl?: string; logoUrl?: string; primaryColor?: string } }>({})
  const [pageBgColor, setPageBgColor] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load page blocks, settings, and page meta in parallel
        const [blocksRes, settingsRes, pagesRes] = await Promise.all([
          fetch('/api/page-blocks?page=home', { cache: 'no-store' }),
          fetch('/api/settings', { cache: 'no-store' }),
          fetch('/api/pages', { cache: 'no-store' })
        ])
        
        if (blocksRes.ok) {
          const data = await blocksRes.json()
          if (data.blocks && data.blocks.length > 0) {
            setBlocks(data.blocks)
          }
        }
        
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          setSettings(settingsData)
        }

        if (pagesRes.ok) {
          const pagesData = await pagesRes.json()
          const homePage = (Array.isArray(pagesData) ? pagesData : []).find((p: any) => p.is_homepage || p.slug === 'home')
          if (homePage?.settings?.bgColor) setPageBgColor(homePage.settings.bgColor)
        }
      } catch (err) {
        console.error('Failed to load page data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Preload hero image for faster LCP
  useEffect(() => {
    if (loading || !blocks.length) return
    const heroBlock = blocks.find(b => b.type === 'hero' && b.visible)
    if (!heroBlock) return
    const content = lang === 'ru' ? heroBlock.contentRu : heroBlock.contentEn
    const match = content.match(/src="(https:\/\/crybeycjfpyyxjgszcpu\.supabase\.co[^"]+)"/) 
    if (match?.[1]) {
      const proxyUrl = `/api/img?src=${encodeURIComponent(match[1])}&w=800&q=80`
      const existing = document.querySelector(`link[rel="preload"][href="${proxyUrl}"]`)
      if (!existing) {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.type = 'image/webp'
        link.href = proxyUrl
        // @ts-ignore
        link.fetchPriority = 'high'
        document.head.appendChild(link)
      }
    }
  }, [loading, blocks, lang])

  // Smooth anchor scrolling with header offset
  useSmoothAnchor(80)
  // Smooth lazy image reveal
  useLazyImages()

  // ✅ SLIDER ARROWS: Attach click handlers (sanitizer strips onclick from rendered HTML)
  useEffect(() => {
    if (loading || !blocks.length) return
    const t = setTimeout(() => {
      document.querySelectorAll<HTMLElement>('[data-nb-prev]').forEach(el => {
        if ((el as any)._nbBound) return
        ;(el as any)._nbBound = true
        el.addEventListener('click', () => {
          const sid = el.getAttribute('data-nb-prev')
          const track = document.querySelector('.' + sid + '-track') as HTMLElement
          if (track) track.scrollBy({ left: -track.offsetWidth, behavior: 'smooth' })
        })
      })
      document.querySelectorAll<HTMLElement>('[data-nb-next]').forEach(el => {
        if ((el as any)._nbBound) return
        ;(el as any)._nbBound = true
        el.addEventListener('click', () => {
          const sid = el.getAttribute('data-nb-next')
          const track = document.querySelector('.' + sid + '-track') as HTMLElement
          if (track) track.scrollBy({ left: track.offsetWidth, behavior: 'smooth' })
        })
      })
    }, 150)
    return () => clearTimeout(t)
  }, [loading, blocks])

  // ✅ SMOOTH ANIMATIONS: Set up IntersectionObserver AFTER blocks render
  useEffect(() => {
    if (loading || !blocks.length) return

    // Small delay to ensure DOM is painted
    const timer = setTimeout(() => {
      // Respect prefers-reduced-motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-scale, .reveal')
          .forEach(el => el.classList.add('is-visible'))
        return
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })

      // Observe all reveal elements
      document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-scale, .reveal')
        .forEach(el => observer.observe(el))

      // Handle .about-fade-up elements from renderers
      const fadeUps = document.querySelectorAll('.about-fade-up')
      fadeUps.forEach((el, i) => {
        const htmlEl = el as HTMLElement
        htmlEl.style.animation = 'none'
        htmlEl.classList.add('reveal-up')
        htmlEl.style.transitionDelay = `${i * 0.12}s`
        observer.observe(htmlEl)
      })

      return () => observer.disconnect()
    }, 50)
    return () => clearTimeout(timer)
  }, [loading, blocks])

  // ✅ SMART CTA: Intercept auth links when user is already logged in
  const { user: currentUser, isClient: isClientUser, loading: authLoad } = useAuth()
  useEffect(() => {
    if (authLoad || !currentUser) return
    const dest = isClientUser ? '/client/home' : '/dashboard'

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href') || ''
      // Intercept auth links when user is already logged in
      if (
        href.includes('/auth/login') ||
        href.includes('/auth/register') ||
        href.includes('/auth/signup')
      ) {
        e.preventDefault()
        window.location.href = dest
      }
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [authLoad, currentUser, isClientUser])

  if (loading) return <LoadingSkeleton />

  // Separate header blocks from content blocks
  const headerBlock = blocks.find(b => b.type === 'header')
  const footerBlock = blocks.find(b => b.type === 'footer')
  const contentBlocks = blocks.filter(b => b.type !== 'header' && b.type !== 'footer')
  
  // Apply hero image from settings to hero block if available
  const heroImageUrl = settings.branding?.heroImageUrl
  const processedBlocks = contentBlocks.map(block => {
    if (block.type === 'hero' && heroImageUrl) {
      return {
        ...block,
        style: {
          ...block.style,
          bgImage: heroImageUrl
        }
      }
    }
    return block
  })

  return (
    <>
      {/* Header reads data from Page Editor DB */}
      <Header headerData={headerBlock?.data} lang={lang} />

      <main className="min-h-screen page-enter" style={{ backgroundColor: pageBgColor || '#09090b' }}>
        {/* Render all content blocks dynamically from the database */}
        {processedBlocks.map((block, i) => (
          <DynamicBlock key={block.id} block={block} lang={lang} index={i} />
        ))}
      </main>

      {/* Footer from DB */}
      {footerBlock && footerBlock.visible && (
        <footer id="contacts" className="reveal-up">
          <div
            style={styleToCSS(sanitizeStyleObj(footerBlock.style || {}) as any)}
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(lang === 'ru' ? footerBlock.contentRu : footerBlock.contentEn) }}
          />
        </footer>
      )}

      {/* Policy Links Footer */}
      <div className="bg-zinc-950 border-t border-zinc-800 py-6 reveal-up">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">© {new Date().getFullYear()} Qbody by Khavanskaia. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/privacy" className="text-zinc-500 hover:text-zinc-300 transition-colors">{lang === 'ru' ? 'Конфиденциальность' : 'Privacy Policy'}</Link>
            <Link href="/terms" className="text-zinc-500 hover:text-zinc-300 transition-colors">{lang === 'ru' ? 'Условия' : 'Terms of Service'}</Link>
            <Link href="/cookies" className="text-zinc-500 hover:text-zinc-300 transition-colors">{lang === 'ru' ? 'Cookie' : 'Cookie Policy'}</Link>
          </div>
        </div>
      </div>
    </>
  )
}
