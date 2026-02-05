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
}

/* ═══════════ Convert style object → inline CSS string ═══════════ */
function styleToCSS(s: Record<string, any>): React.CSSProperties {
  const css: React.CSSProperties = {}
  if (!s) return css
  if (s.bgGradient) css.background = s.bgGradient
  else if (s.bgColor) css.backgroundColor = s.bgColor
  if (s.bgImage) {
    css.backgroundImage = `url(${s.bgImage})`
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

/* ═══════════ HEADER (always rendered, not from DB content) ═══════════ */
function Header() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.programs'), href: '#programs' },
    { name: t('nav.courses'), href: '#courses' },
    { name: t('nav.about'), href: '#about' },
    { name: t('nav.results'), href: '#results' },
    { name: t('nav.contacts'), href: '#contacts' },
  ]

  return (
    <header role="banner" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800' : 'bg-transparent'
    }`}>
      <nav className="container-custom">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-semibold text-lg">Qbody</span>
              <span className="text-teal-400 text-sm block -mt-1">by Khavanskaia</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navigation.map((item) => (
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
                <Link href="/auth/login" className="hidden sm:block">
                  <Button variant="ghost" className="text-zinc-300 hover:text-white">
                    <User className="w-4 h-4 mr-2" />
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link href="#programs" className="hidden sm:block">
                  <Button variant="gradient">{t('nav.getStarted')}</Button>
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
            {navigation.map((item) => (
              <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                className="block text-zinc-300 hover:text-white px-4 py-3 rounded-xl">
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  )
}

/* ═══════════ DYNAMIC BLOCK RENDERER ═══════════ */
function DynamicBlock({ block, lang }: { block: PageBlock; lang: 'en' | 'ru' }) {
  if (!block.visible) return null

  const content = lang === 'ru' ? block.contentRu : block.contentEn
  if (!content) return null

  const sectionStyle = styleToCSS(block.style || {})

  // Map block type to HTML section id for anchor links
  const sectionId = block.type === 'hero' ? undefined
    : block.type === 'programs' ? 'programs'
    : block.type === 'courses' ? 'courses'
    : block.type === 'about' ? 'about'
    : block.type === 'results' ? 'results'
    : block.type === 'footer' ? 'contacts'
    : block.style?.htmlId || undefined

  return (
    <section id={sectionId} style={sectionStyle}>
      <div dangerouslySetInnerHTML={{ __html: content }} />
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
      {/* Always use the React Header component for navigation (auth, language switcher, etc.) */}
      <Header />

      <main className="min-h-screen">
        {/* Render all content blocks dynamically from the database */}
        {processedBlocks.map(block => (
          <DynamicBlock key={block.id} block={block} lang={lang} />
        ))}
      </main>

      {/* Footer from DB */}
      {footerBlock && footerBlock.visible && (
        <footer id="contacts">
          <div
            style={styleToCSS(footerBlock.style || {})}
            dangerouslySetInnerHTML={{ __html: lang === 'ru' ? footerBlock.contentRu : footerBlock.contentEn }}
          />
        </footer>
      )}
    </>
  )
}
