'use client'

import { useEffect, useRef, ReactNode } from 'react'

type RevealDirection = 'up' | 'left' | 'right' | 'scale' | 'fade'

interface ScrollRevealProps {
  children: ReactNode
  direction?: RevealDirection
  delay?: number        // ms
  duration?: number     // ms  
  threshold?: number    // 0-1
  stagger?: boolean     // animate children sequentially
  className?: string
  once?: boolean        // only reveal once (default true)
  as?: keyof JSX.IntrinsicElements
}

const directionClass: Record<RevealDirection, string> = {
  up: 'reveal-up',
  left: 'reveal-left',
  right: 'reveal-right',
  scale: 'reveal-scale',
  fade: 'reveal',
}

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration,
  threshold = 0.15,
  stagger = false,
  className = '',
  once = true,
  as: Tag = 'div',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Check for prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible')
      return
    }

    // Custom delay
    if (delay > 0) {
      el.style.transitionDelay = `${delay}ms`
    }
    // Custom duration
    if (duration) {
      el.style.transitionDuration = `${duration}ms`
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            if (once) observer.unobserve(entry.target)
          } else if (!once) {
            entry.target.classList.remove('is-visible')
          }
        })
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px',
      }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, duration, threshold, once])

  const revealClass = directionClass[direction]
  const staggerClass = stagger ? 'stagger-parent' : ''

  return (
    <div
      ref={ref}
      className={`${revealClass} ${staggerClass} ${className}`.trim()}
    >
      {children}
    </div>
  )
}

/* ═══════════ HOOK: useScrollReveal ═══════════ */
/* For cases where you can't wrap in a component (e.g. dangerouslySetInnerHTML blocks) */
/* Supports dynamically rendered elements (e.g. after data fetch) via MutationObserver */
export function useScrollReveal(options?: {
  threshold?: number
  rootMargin?: string
  once?: boolean
  deps?: any[]
}) {
  const { threshold = 0.12, rootMargin = '0px 0px -60px 0px', once = true, deps = [] } = options || {}

  useEffect(() => {
    const revealSelector = '.reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-scale, .stagger-parent'

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Показать все текущие элементы
      document.querySelectorAll(revealSelector)
        .forEach(el => el.classList.add('is-visible'))
      // Следить за новыми элементами (динамический контент после загрузки данных)
      const mo = new MutationObserver(() => {
        document.querySelectorAll(revealSelector)
          .forEach(el => el.classList.add('is-visible'))
      })
      mo.observe(document.body, { childList: true, subtree: true })
      return () => mo.disconnect()
    }

    const observed = new WeakSet<Element>()

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            if (once) observer.unobserve(entry.target)
          } else if (!once) {
            entry.target.classList.remove('is-visible')
          }
        })
      },
      { threshold, rootMargin }
    )

    // Наблюдать за всеми reveal-элементами (текущими и новыми)
    const observeAll = () => {
      document.querySelectorAll(revealSelector).forEach(el => {
        if (!observed.has(el)) {
          observed.add(el)
          observer.observe(el)
        }
      })
    }

    observeAll()

    // MutationObserver для отслеживания динамически добавленных элементов
    // (например, после загрузки данных из API, когда reveal-элементы
    // появляются в DOM позже, чем IntersectionObserver был создан)
    const mutationObserver = new MutationObserver(observeAll)
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, rootMargin, once, ...deps])
}

/* ═══════════ HOOK: useSmoothAnchor ═══════════ */
/* Intercepts anchor clicks for smooth scroll with header offset */
export function useSmoothAnchor(headerHeight = 80) {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!anchor) return

      const id = anchor.getAttribute('href')?.slice(1)
      if (!id) return

      const section = document.getElementById(id)
      if (!section) return

      e.preventDefault()

      const top = section.getBoundingClientRect().top + window.scrollY - headerHeight
      window.scrollTo({ top, behavior: 'smooth' })

      // Update URL without scroll jump
      history.pushState(null, '', `#${id}`)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [headerHeight])
}

/* ═══════════ HOOK: useLazyImages ═══════════ */
/* Smoothly reveals lazy-loaded images when they finish loading */
export function useLazyImages() {
  useEffect(() => {
    const revealImg = (img: HTMLImageElement) => {
      img.classList.add('loaded')
    }

    // Handle already loaded images
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      const htmlImg = img as HTMLImageElement
      if (htmlImg.complete && htmlImg.naturalWidth > 0) {
        revealImg(htmlImg)
      }
    })

    // Handle future loads
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement && node.loading === 'lazy') {
            if (node.complete) {
              revealImg(node)
            } else {
              node.addEventListener('load', () => revealImg(node), { once: true })
            }
          }
          // Also check children
          if (node instanceof HTMLElement) {
            node.querySelectorAll('img[loading="lazy"]').forEach((img) => {
              const htmlImg = img as HTMLImageElement
              if (htmlImg.complete) {
                revealImg(htmlImg)
              } else {
                htmlImg.addEventListener('load', () => revealImg(htmlImg), { once: true })
              }
            })
          }
        })
      })
    })

    observer.observe(document.body, { childList: true, subtree: true })

    // Also listen for load events on existing images
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      img.addEventListener('load', () => (img as HTMLElement).classList.add('loaded'), { once: true })
    })

    return () => observer.disconnect()
  }, [])
}
