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

/* ═══════════ HOOK: useSliderControls ═══════════ */
/* Wires up event delegation for slider arrows / dots rendered via dangerouslySetInnerHTML.
   Inline onclick is stripped by sanitize-html, so the renderer emits data-* attributes
   (data-slider-prev / data-slider-next / data-slider-dot) and this hook handles clicks. */
export function useSliderControls() {
  useEffect(() => {
    const findTrack = (sliderId: string): HTMLElement | null => {
      const root = document.getElementById(sliderId)
      if (!root) return null
      return root.querySelector(`.${sliderId}-track`) as HTMLElement | null
    }

    const updateDots = (sliderId: string, activeIndex: number) => {
      const dots = document.querySelectorAll<HTMLElement>(`[data-slider-dot="${sliderId}"]`)
      dots.forEach((d, j) => {
        d.style.background = j === activeIndex ? '#14b8a6' : 'rgba(255,255,255,0.3)'
      })
    }

    const handler = (e: Event) => {
      const target = e.target as HTMLElement
      if (!target) return

      const prev = target.closest<HTMLElement>('[data-slider-prev]')
      if (prev) {
        const id = prev.getAttribute('data-slider-prev') || ''
        const track = findTrack(id)
        if (track) track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' })
        return
      }

      const next = target.closest<HTMLElement>('[data-slider-next]')
      if (next) {
        const id = next.getAttribute('data-slider-next') || ''
        const track = findTrack(id)
        if (track) track.scrollBy({ left: track.clientWidth, behavior: 'smooth' })
        return
      }

      const dot = target.closest<HTMLElement>('[data-slider-dot]')
      if (dot) {
        const id = dot.getAttribute('data-slider-dot') || ''
        const idx = Number(dot.getAttribute('data-slider-index') || 0)
        const track = findTrack(id)
        if (track) {
          track.scrollTo({ left: track.clientWidth * idx, behavior: 'smooth' })
          updateDots(id, idx)
        }
      }
    }

    // Sync dots while user scrolls / swipes the track
    const trackHandlers = new WeakMap<HTMLElement, () => void>()
    const attachTrackListeners = () => {
      document.querySelectorAll<HTMLElement>('[class$="-track"]').forEach((track) => {
        if (trackHandlers.has(track)) return
        const root = track.closest<HTMLElement>('[id]')
        if (!root) return
        const sliderId = root.id
        const onScroll = () => {
          const idx = Math.round(track.scrollLeft / track.clientWidth)
          updateDots(sliderId, idx)
        }
        track.addEventListener('scroll', onScroll, { passive: true })
        trackHandlers.set(track, onScroll)
      })
    }
    attachTrackListeners()
    const mo = new MutationObserver(attachTrackListeners)
    mo.observe(document.body, { childList: true, subtree: true })

    document.addEventListener('click', handler)
    return () => {
      document.removeEventListener('click', handler)
      mo.disconnect()
    }
  }, [])
}

/* ═══════════ HOOK: useFaqAccordion ═══════════ */
/* Wires up FAQ accordion expand/collapse via event delegation.
   Renderer outputs <button data-faq-toggle="1">...</button> inside .fq-acc containers
   with .fq-acc-body and .fq-acc-icon children. Inline onclick is stripped by sanitizer. */
export function useFaqAccordion() {
  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const btn = target.closest<HTMLElement>('[data-faq-toggle]')
      if (!btn) return
      const wrap = btn.closest<HTMLElement>('.fq-acc')
      if (!wrap) return
      const body = wrap.querySelector<HTMLElement>('.fq-acc-body')
      const icon = wrap.querySelector<HTMLElement>('.fq-acc-icon')
      if (!body) return
      const isOpen = body.style.maxHeight && body.style.maxHeight !== '0px'
      if (isOpen) {
        body.style.maxHeight = '0px'
        body.style.opacity = '0'
        if (icon) icon.style.transform = 'rotate(0deg)'
      } else {
        body.style.maxHeight = body.scrollHeight + 'px'
        body.style.opacity = '1'
        if (icon) icon.style.transform = 'rotate(45deg)'
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])
}

/* ═══════════ HOOK: useContactForm ═══════════ */
/* Intercepts submit on <form data-contact-form>. POSTs the form data to /api/public/contact
   and shows .ct-success on success. Inline onsubmit is stripped by sanitizer. */
export function useContactForm() {
  useEffect(() => {
    const handler = async (e: Event) => {
      const form = e.target as HTMLElement | null
      if (!form || !(form instanceof HTMLFormElement)) return
      if (!form.hasAttribute('data-contact-form')) return
      e.preventDefault()

      const btn = form.querySelector<HTMLButtonElement>('.ct-btn')
      const origText = btn?.textContent || ''
      const successEl = form.querySelector<HTMLElement>('.ct-success')
        || form.closest<HTMLElement>('[id]')?.querySelector<HTMLElement>('.ct-success')
        || null

      if (btn) { btn.disabled = true; btn.textContent = '…' }

      const payload: Record<string, string> = {}
      const inputs = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        'input, textarea, select'
      )
      inputs.forEach((el) => {
        const name = el.getAttribute('name') || el.getAttribute('placeholder') || el.getAttribute('type') || 'field'
        payload[name] = (el as any).value || ''
      })
      payload._page = typeof window !== 'undefined' ? window.location.pathname : ''

      try {
        const res = await fetch('/api/public/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          form.reset()
          if (successEl) {
            successEl.style.display = 'block'
            setTimeout(() => { successEl.style.display = 'none' }, 4000)
          }
        }
      } catch {
        // silent fail — show button restore below
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = origText }
      }
    }
    document.addEventListener('submit', handler)
    return () => document.removeEventListener('submit', handler)
  }, [])
}
