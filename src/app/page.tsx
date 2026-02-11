'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { useSmoothAnchor, useLazyImages } from '@/components/ui/scroll-reveal'
import {
  Menu, X, User, LayoutDashboard
} from 'lucide-react'
import { renderAboutHTML, renderCoursesHTML, renderProgramsHTML, renderResultsHTML } from '@/app/dashboard/page-editor/renderers'
import { renderHtmlBlockHTML, renderSliderHTML, renderHeroTemplateHTML } from '@/app/dashboard/page-editor/new-block-renderers'
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

  // Lock body scroll when mobile menu open
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isMobileMenuOpen])

  // Use DB data if available, otherwise defaults
  const d = headerData
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

  return (
    <>
      {/* ── Header bar ── */}
      <header role="banner" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen ? 'bg-black border-b border-zinc-800' : 'bg-black lg:bg-transparent'
      }`}>
        <nav className="container-custom">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              {d?.logoImage ? (
                <img src={d.logoImage.includes('supabase.co') ? `/api/img?src=${encodeURIComponent(d.logoImage)}&w=80&q=75` : d.logoImage} alt={logoText} width="36" height="36" className="w-9 h-9 rounded-xl object-contain" />
              ) : (
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${d?.logoGradient || 'bg-gradient-to-br from-teal-400 to-teal-600'}`}>
                  <span className="text-white font-bold text-base">{logoIcon}</span>
                </div>
              )}
              {/* Mobile: brand name between logo and hamburger */}
              <span className="lg:hidden text-sm font-semibold" style={{ color: '#14B8A6' }}>Qbody by Khavanskaia</span>
              {/* Desktop: full logo */}
              <div className="hidden lg:block">
                <span className="text-white font-semibold text-lg">{logoText}</span>
                <span className="text-teal-400 text-sm block -mt-1">by Khavanskaia</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-8">
              {navigation.map((item: any) => (
                <Link key={item.name} href={item.href} className="text-zinc-300 hover:text-white transition-colors text-sm font-medium">
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher variant="dropdown" className="hidden sm:block" />
              {!authLoading && user ? (
                <Link href="/dashboard" className="hidden lg:block">
                  <Button variant="gradient">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    {t('nav.dashboard') || 'Dashboard'}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href={loginLink} className="hidden lg:block">
                    <Button variant="ghost" className="text-zinc-300 hover:text-white">
                      <User className="w-4 h-4 mr-2" />
                      {loginText}
                    </Button>
                  </Link>
                  <Link href={ctaLink} className="hidden lg:block">
                    <Button variant="gradient">{ctaText}</Button>
                  </Link>
                </>
              )}
              {/* Hamburger */}
              <button
                className="lg:hidden text-white p-2 relative z-[60]"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* ── Fullscreen Mobile Menu ── */}
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-[55] lg:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Slide-in panel from right */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full max-w-sm z-[56] lg:hidden
          bg-black flex flex-col
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Menu header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-zinc-800 flex-shrink-0">
          <span className="text-sm font-semibold" style={{ color: '#14B8A6' }}>Qbody by Khavanskaia</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-white p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-1">
            {navigation.map((item: any, i: number) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-lg font-medium text-zinc-200 hover:text-white px-4 py-3.5 rounded-xl
                  hover:bg-zinc-800/50 transition-all"
                style={{
                  transitionDelay: isMobileMenuOpen ? `${(i + 1) * 60}ms` : '0ms',
                  transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(40px)',
                  opacity: isMobileMenuOpen ? 1 : 0,
                  transition: 'transform 0.3s ease, opacity 0.3s ease, background-color 0.15s ease',
                }}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div
            className="my-6 border-t border-zinc-800"
            style={{
              transitionDelay: isMobileMenuOpen ? `${(navigation.length + 1) * 60}ms` : '0ms',
              opacity: isMobileMenuOpen ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          />

          {/* Auth buttons */}
          <div
            className="space-y-3"
            style={{
              transitionDelay: isMobileMenuOpen ? `${(navigation.length + 2) * 60}ms` : '0ms',
              transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(40px)',
              opacity: isMobileMenuOpen ? 1 : 0,
              transition: 'transform 0.3s ease, opacity 0.3s ease',
            }}
          >
            {!authLoading && user ? (
              <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block">
                <button className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-white"
                  style={{ background: 'linear-gradient(135deg, #14B8A6, #0D9488)' }}>
                  <LayoutDashboard className="w-5 h-5" />
                  {t('nav.dashboard') || 'Dashboard'}
                </button>
              </Link>
            ) : (
              <>
                <Link href={loginLink} onClick={() => setIsMobileMenuOpen(false)} className="block">
                  <button className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium
                    text-white border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50 transition-colors">
                    <User className="w-5 h-5" />
                    {ru ? 'Войти' : 'Log In'}
                  </button>
                </Link>
                <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)} className="block">
                  <button className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-white"
                    style={{ background: 'linear-gradient(135deg, #14B8A6, #0D9488)' }}>
                    {ru ? 'Регистрация' : 'Sign Up'}
                  </button>
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Bottom branding */}
        <div
          className="px-6 py-4 border-t border-zinc-800 flex-shrink-0"
          style={{
            transitionDelay: isMobileMenuOpen ? `${(navigation.length + 3) * 60}ms` : '0ms',
            opacity: isMobileMenuOpen ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        >
          <p className="text-xs text-zinc-600 text-center">© {new Date().getFullYear()} Qbody by Khavanskaia</p>
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
  const isStructured = ['about', 'courses', 'programs', 'results', 'htmlblock', 'slider', 'herotemplate'].includes(block.type) && (block.data || block.items)
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
    : block.type === 'about' ? 'about'
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
  const lang = (locale || 'ru') as 'en' | 'ru'
  const [blocks, setBlocks] = useState<PageBlock[]>([])
  const [settings, setSettings] = useState<{ branding?: { heroImageUrl?: string; logoUrl?: string; primaryColor?: string } }>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load page blocks and settings in parallel
        const [blocksRes, settingsRes] = await Promise.all([
          fetch('/api/page-blocks?page=home', { cache: 'no-store' }),
          fetch('/api/settings', { cache: 'no-store' })
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

      <main className="min-h-screen bg-zinc-950 page-enter">
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
