'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import {
  Menu, X, User, LayoutDashboard
} from 'lucide-react'
import { renderAboutHTML, renderCoursesHTML, renderProgramsHTML, renderResultsHTML } from '@/app/dashboard/page-editor/renderers'
import type { AboutData, CourseItem, ProgramItem, ResultItem } from '@/app/dashboard/page-editor/types'
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
    <header role="banner" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800' : 'bg-transparent'
    }`}>
      <nav className="container-custom">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3">
            {d?.logoImage ? (
              <img src={d.logoImage} alt={logoText} className="w-10 h-10 rounded-xl object-contain" />
            ) : (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d?.logoGradient || 'bg-gradient-to-br from-teal-400 to-teal-600'}`}>
                <span className="text-white font-bold text-lg">{logoIcon}</span>
              </div>
            )}
            <div className="hidden sm:block">
              <span className="text-white font-semibold text-lg">{logoText}</span>
              <span className="text-teal-400 text-sm block -mt-1">by Khavanskaia</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navigation.map((item: any) => (
              <Link key={item.name} href={item.href} className="text-zinc-300 hover:text-white transition-colors text-sm font-medium">
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher variant="dropdown" className="hidden sm:block" />
            {!authLoading && user ? (
              <Link href="/dashboard" className="hidden sm:block">
                <Button variant="gradient">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  {t('nav.dashboard') || 'Dashboard'}
                </Button>
              </Link>
            ) : (
              <>
                <Link href={loginLink} className="hidden sm:block">
                  <Button variant="ghost" className="text-zinc-300 hover:text-white">
                    <User className="w-4 h-4 mr-2" />
                    {loginText}
                  </Button>
                </Link>
                <Link href={ctaLink} className="hidden sm:block">
                  <Button variant="gradient">{ctaText}</Button>
                </Link>
              </>
            )}
            <button className="lg:hidden text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-zinc-800">
            {navigation.map((item: any) => (
              <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                className="block text-zinc-300 hover:text-white px-4 py-3 rounded-xl">
                {item.name}
              </Link>
            ))}
            {!authLoading && !user && (
              <>
                <Link href={loginLink} onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-zinc-300 hover:text-white px-4 py-3 rounded-xl">
                  {loginText}
                </Link>
                <Link href={ctaLink} onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-teal-400 hover:text-teal-300 px-4 py-3 rounded-xl font-medium">
                  {ctaText}
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}

/* ═══════════ DYNAMIC BLOCK RENDERER ═══════════ */
function DynamicBlock({ block, lang }: { block: PageBlock; lang: 'en' | 'ru' }) {
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
  } else {
    content = lang === 'ru' ? block.contentRu : block.contentEn
  }
  if (!content) return null

  // ✅ XSS PROTECTION: Sanitize all HTML before rendering
  const safeContent = sanitizeHTML(content)

  // For structured blocks rendered on-the-fly, skip section styles (renderer includes its own bg)
  const isStructured = ['about', 'courses', 'programs', 'results'].includes(block.type) && (block.data || block.items)
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

  return (
    <section id={sectionId} style={sectionStyle}>
      <div dangerouslySetInnerHTML={{ __html: safeContent }} />
    </section>
  )
}

/* ═══════════ LOADING SKELETON ═══════════ */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero skeleton */}
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-64 h-8 bg-zinc-800 rounded-lg mx-auto animate-pulse" />
          <div className="w-96 h-12 bg-zinc-800 rounded-lg mx-auto animate-pulse" />
          <div className="w-80 h-6 bg-zinc-800 rounded-lg mx-auto animate-pulse" />
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
          fetch('/api/page-blocks?page=home'),
          fetch('/api/settings')
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

  // Observe .about-fade-up elements for scroll-triggered animations
  useEffect(() => {
    if (loading) return
    const timer = setTimeout(() => {
      const items = document.querySelectorAll('.about-fade-up')
      if (!items.length) return
      // Remove CSS animation, use IntersectionObserver instead
      items.forEach(el => {
        ;(el as HTMLElement).style.animation = 'none'
        ;(el as HTMLElement).style.opacity = '0'
        ;(el as HTMLElement).style.transform = 'translateY(40px)'
        ;(el as HTMLElement).style.transition = 'opacity 0.8s ease, transform 0.8s ease'
      })
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            el.style.opacity = '1'
            el.style.transform = 'translateY(0)'
            observer.unobserve(el)
          }
        })
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' })
      items.forEach((item, i) => {
        ;(item as HTMLElement).style.transitionDelay = `${i * 0.15}s`
        observer.observe(item)
      })
      return () => observer.disconnect()
    }, 100)
    return () => clearTimeout(timer)
  }, [loading, blocks])

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

      <main className="min-h-screen bg-zinc-950">
        {/* Render all content blocks dynamically from the database */}
        {processedBlocks.map(block => (
          <DynamicBlock key={block.id} block={block} lang={lang} />
        ))}
      </main>

      {/* Footer from DB */}
      {footerBlock && footerBlock.visible && (
        <footer id="contacts">
          <div
            style={styleToCSS(sanitizeStyleObj(footerBlock.style || {}) as any)}
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(lang === 'ru' ? footerBlock.contentRu : footerBlock.contentEn) }}
          />
        </footer>
      )}

      {/* Policy Links Footer */}
      <div className="bg-zinc-950 border-t border-zinc-800 py-6">
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
