'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useLocale, useRendererLang } from '@/lib/i18n'
import { sanitizeHTML, sanitizeStyleObj } from '@/lib/sanitize-html'
import { renderAboutHTML, renderCoursesHTML, renderProgramsHTML, renderResultsHTML, renderHeaderHTML, renderHeroHTML } from '@/app/dashboard/page-editor/renderers'
import type { HeaderLangConfig } from '@/app/dashboard/page-editor/renderers'
import { renderHtmlBlockHTML, renderSliderHTML, renderHeroTemplateHTML } from '@/app/dashboard/page-editor/new-block-renderers'
import { renderCourses2HTML } from '@/app/dashboard/page-editor/courses'
import { renderAbout2HTML } from '@/app/dashboard/page-editor/about'
import { renderCta2HTML } from '@/app/dashboard/page-editor/cta'
import { renderFaq2HTML } from '@/app/dashboard/page-editor/faq'
import { renderContact2HTML } from '@/app/dashboard/page-editor/contact'
import { renderFooter2HTML } from '@/app/dashboard/page-editor/footer'
import { useSliderControls } from '@/components/ui/scroll-reveal'
import { Loader2 } from 'lucide-react'

interface PageBlock {
  id: string; type: string; label: string; labelRu: string
  visible: boolean; contentEn: string; contentRu: string
  style: Record<string, any>; data?: any; items?: any
}

function isSafeCSSUrl(url: string): boolean {
  if (!url) return false
  const lower = url.trim().toLowerCase()
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:') || lower.startsWith('data:text/html') || lower.includes('expression(')) return false
  if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('/') || lower.startsWith('data:image/')) return true
  return !lower.includes(':')
}

function styleToCSS(s: Record<string, any>): React.CSSProperties {
  const css: React.CSSProperties = {}
  if (!s) return css
  if (s.bgGradient) css.background = s.bgGradient
  else if (s.bgColor) css.backgroundColor = s.bgColor
  if (s.bgImage && isSafeCSSUrl(s.bgImage)) {
    css.backgroundImage = `url(${encodeURI(s.bgImage)})`; css.backgroundSize = 'cover'; css.backgroundPosition = 'center'
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

function DynamicBlock({ block, lang, index, headerLangConfig }: { block: PageBlock; lang: 'en' | 'ru'; index?: number; headerLangConfig?: HeaderLangConfig }) {
  if (!block.visible) return null

  let content: string
  if (block.type === 'header' && block.data) content = renderHeaderHTML(block.data, lang, headerLangConfig)
  else if (block.type === 'hero' && block.data) content = renderHeroHTML(block.data, lang)
  else if (block.type === 'about' && block.data) content = renderAboutHTML(block.data, lang)
  else if (block.type === 'courses' && block.items) content = renderCoursesHTML(block.items, lang)
  else if (block.type === 'programs' && block.items) content = renderProgramsHTML(block.items, lang)
  else if (block.type === 'results' && block.items) content = renderResultsHTML(block.items, lang)
  else if (block.type === 'htmlblock' && block.data) content = renderHtmlBlockHTML(block.data, lang)
  else if (block.type === 'slider' && block.data) content = renderSliderHTML(block.data, lang)
  else if (block.type === 'herotemplate' && block.data) content = renderHeroTemplateHTML(block.data, lang)
  else if (block.type === 'courses2' && block.data) {
    const dd = block.data as any; content = renderCourses2HTML(dd.items || [], dd.section || {}, lang)
  } else if (block.type === 'about2' && block.data) {
    const dd = block.data as any; content = renderAbout2HTML(dd.section || {}, lang)
  } else if (block.type === 'cta2' && block.data) {
    const dd = block.data as any; content = renderCta2HTML(dd.section || {}, lang)
  } else if (block.type === 'faq2' && block.data) {
    const dd = block.data as any; content = renderFaq2HTML(dd.section || {}, lang)
  } else if (block.type === 'contact2' && block.data) {
    const dd = block.data as any; content = renderContact2HTML(dd.section || {}, lang)
  } else if (block.type === 'footer2' && block.data) {
    const dd = block.data as any; content = renderFooter2HTML(dd.section || {}, lang)
  } else {
    content = lang === 'ru' ? block.contentRu : block.contentEn
  }
  if (!content) return null

  const safeContent = sanitizeHTML(content)
  const isStructured = ['header', 'hero', 'about', 'about2', 'cta2', 'faq2', 'contact2', 'footer2', 'courses', 'courses2', 'programs', 'results', 'htmlblock', 'slider', 'herotemplate'].includes(block.type) && (block.data || block.items)
  const safeStyle = sanitizeStyleObj(block.style || {})
  const sectionStyle = isStructured ? {} : styleToCSS(safeStyle as any)

  const rawId = block.style?.htmlId || ''
  const sectionId = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || undefined

  return (
    <section id={sectionId} style={sectionStyle} className="reveal-up">
      <div dangerouslySetInnerHTML={{ __html: safeContent }} />
    </section>
  )
}

export default function SlugPage() {
  const params = useParams()
  const slug = params.slug as string
  const { locale, langConfig: siteLC, setLocale } = useLocale()
  const lang = useRendererLang()
  const [blocks, setBlocks] = useState<PageBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [notFoundPage, setNotFoundPage] = useState(false)
  const [pageBgColor, setPageBgColor] = useState<string | undefined>(undefined)

  // Activate scroll reveal after blocks are loaded
  useEffect(() => {
    if (loading || blocks.length === 0) return
    let observer: IntersectionObserver | null = null
    const timer = setTimeout(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-scale')
          .forEach(el => el.classList.add('is-visible'))
        return
      }
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              observer?.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      )
      document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-scale')
        .forEach(el => observer!.observe(el))
    }, 50)
    return () => { clearTimeout(timer); observer?.disconnect() }
  }, [loading, blocks])

  const headerLangConfig: HeaderLangConfig = {
    isBilingual: siteLC.isBilingual,
    primaryLanguage: siteLC.primaryLanguage,
    secondaryLanguage: siteLC.secondaryLanguage,
  }

  // ✅ SLIDER ARROWS / DOTS: Event delegation (sanitizer strips inline onclick from rendered HTML)
  useSliderControls()

  // Event delegation for language switcher buttons
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('[data-lang-switch]') as HTMLElement | null
      if (btn) {
        const newLang = btn.getAttribute('data-lang-switch')
        if (newLang && newLang !== locale) {
          setLocale(newLang)
        }
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [locale, setLocale])

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if this page exists and is published
        const pagesRes = await fetch('/api/pages')
        if (pagesRes.ok) {
          const pages = await pagesRes.json()
          const page = (Array.isArray(pages) ? pages : []).find((p: any) => p.slug === slug)
          if (!page) { setNotFoundPage(true); setLoading(false); return }
          if (page.settings?.bgColor) setPageBgColor(page.settings.bgColor)
        }

        // Load blocks
        const res = await fetch(`/api/page-blocks?page=${encodeURIComponent(slug)}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data.blocks && data.blocks.length > 0) {
            setBlocks(data.blocks)
          }
        }
      } catch (err) {
        console.error('Failed to load page:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  if (notFoundPage || blocks.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-zinc-400 mb-6">{lang === 'ru' ? 'Страница не найдена' : 'Page not found'}</p>
        <a href="/" className="text-teal-400 hover:text-teal-300 underline">{lang === 'ru' ? 'На главную' : 'Go home'}</a>
      </div>
    )
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: pageBgColor || '#09090b' }}>
      {blocks.map((block, i) => (
        <DynamicBlock key={block.id} block={block} lang={lang} index={i} headerLangConfig={headerLangConfig} />
      ))}
    </main>
  )
}
