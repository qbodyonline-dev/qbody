'use client'

import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { sanitizeHTML, sanitizeStyleObj } from '@/lib/sanitize-html'
import { useScrollReveal, useSmoothAnchor, useLazyImages } from '@/components/ui/scroll-reveal'

interface PageBlock {
  id: string
  type: string
  label: string
  labelRu: string
  visible: boolean
  contentEn: string
  contentRu: string
  style: {
    bgColor?: string
    bgGradient?: string
    bgImage?: string
    paddingTop?: string
    paddingBottom?: string
    paddingLeft?: string
    paddingRight?: string
    marginTop?: string
    marginBottom?: string
    maxWidth?: string
    borderRadius?: string
    borderWidth?: string
    borderColor?: string
    boxShadow?: string
    cssClass?: string
    htmlId?: string
  }
}

function styleToCSS(s: PageBlock['style']): React.CSSProperties {
  const style: React.CSSProperties = {}
  
  if (s.bgGradient) style.background = s.bgGradient
  else if (s.bgColor) style.backgroundColor = s.bgColor
  
  if (s.bgImage) {
    style.backgroundImage = `url(${s.bgImage})`
    style.backgroundSize = 'cover'
    style.backgroundPosition = 'center'
  }
  
  if (s.paddingTop) style.paddingTop = `${s.paddingTop}px`
  if (s.paddingBottom) style.paddingBottom = `${s.paddingBottom}px`
  if (s.paddingLeft) style.paddingLeft = `${s.paddingLeft}px`
  if (s.paddingRight) style.paddingRight = `${s.paddingRight}px`
  if (s.marginTop) style.marginTop = `${s.marginTop}px`
  if (s.marginBottom) style.marginBottom = `${s.marginBottom}px`
  
  if (s.maxWidth) {
    style.maxWidth = s.maxWidth
    style.marginLeft = 'auto'
    style.marginRight = 'auto'
  }
  
  if (s.borderRadius) style.borderRadius = `${s.borderRadius}px`
  if (s.borderWidth && s.borderColor) {
    style.border = `${s.borderWidth}px solid ${s.borderColor}`
  }
  if (s.boxShadow) style.boxShadow = s.boxShadow
  
  return style
}

export function DynamicPageContent({ locale = 'ru' }: { locale?: 'en' | 'ru' }) {
  const [blocks, setBlocks] = useState<PageBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ SMOOTH ANIMATIONS — re-observe after data loads
  useScrollReveal({ deps: [loading] })
  useSmoothAnchor(80)
  useLazyImages()

  useEffect(() => {
    const loadBlocks = async () => {
      try {
        const res = await fetch('/api/page-blocks?page=home')
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        setBlocks(data.blocks || [])
      } catch (err) {
        console.error('Failed to load page blocks:', err)
        setError('Failed to load content')
      } finally {
        setLoading(false)
      }
    }
    loadBlocks()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  if (error || blocks.length === 0) {
    return null
  }

  return (
    <div className="dynamic-page-content page-enter">
      {blocks
        .filter(block => block.visible)
        .map((block, i) => {
          const content = locale === 'ru' ? block.contentRu : block.contentEn
          // ✅ XSS PROTECTION: Sanitize style object and HTML content
          const safeStyle = sanitizeStyleObj(block.style || {})
          const sectionStyle = styleToCSS(safeStyle as any)
          
          // ✅ XSS PROTECTION: Sanitize htmlId
          const cleanHtmlId = (block.style.htmlId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || undefined
          // ✅ XSS PROTECTION: Sanitize cssClass
          const cleanCssClass = (block.style.cssClass || '').replace(/[^a-zA-Z0-9_ -]/g, '').slice(0, 200) || ''
          
          // ✅ SMOOTH ANIMATIONS: First block visible immediately, rest reveal on scroll
          const revealClass = i === 0 ? '' : 'reveal-up'
          
          return (
            <section
              key={block.id}
              id={cleanHtmlId}
              className={`${cleanCssClass} ${revealClass}`.trim()}
              style={sectionStyle}
            >
              {/* ✅ XSS PROTECTION: Sanitize HTML before rendering */}
              <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }} />
            </section>
          )
        })}
    </div>
  )
}
