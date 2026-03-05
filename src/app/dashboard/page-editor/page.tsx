'use client'
import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import {
  Save, Eye, EyeOff, Monitor, Smartphone, Undo2, Redo2,
  ChevronDown, ChevronUp, GripVertical, Trash2, Copy,
  Layout, X, Tablet, Download, Upload, Paintbrush,
  Maximize2, Minimize2, Plus, Loader2, LayoutList,
  ArrowLeft, Globe, FileText, Home, ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuth } from '@/lib/api'
import { useLanguageConfig } from '@/lib/useLanguageConfig'

// Local modules
import { TEMPLATES, initBlocks, defaultCourseItems, defaultProgramItems, defaultResultItems, defaultHeaderData, defaultHeroData, defaultAboutData } from './default-content'
import { BLOCK_ICONS, type PageBlock, type CourseItem, type ProgramItem, type ResultItem, type HeaderData, type HeroData, type AboutData } from './types'
import { styleToCSS, styleAttrs, parseCSStoObj } from './utils'
import { RichEditor } from './rich-editor'
import { StylePanel } from './style-panel'
import { CoursesBlockEditor, ProgramsBlockEditor, ResultsBlockEditor, HeaderEditor, HeroEditor, AboutEditor } from './item-editors'
import { renderCoursesHTML, renderProgramsHTML, renderResultsHTML, renderHeaderHTML, renderHeroHTML, renderAboutHTML } from './renderers'
import { HtmlBlockEditor, SliderEditor, HeroTemplateEditor } from './new-block-editors'
import { renderHtmlBlockHTML, renderSliderHTML, renderHeroTemplateHTML, defaultHtmlBlockData, defaultSliderData, defaultHeroTemplateData } from './new-block-renderers'
import type { HtmlBlockData, SliderData, HeroTemplateData } from './types'
import { CoursesSectionEditor, renderCourses2HTML, defaultCourseItems2, defaultCourseSectionData } from './courses'
import type { CourseItem2, CourseSectionData } from './courses'
import { AboutSectionEditor, renderAbout2HTML, defaultAboutSectionData } from './about'
import type { AboutSectionData } from './about'
import { CtaSectionEditor, renderCta2HTML, defaultCtaSectionData } from './cta'
import type { CtaSectionData } from './cta'
import { FaqSectionEditor, renderFaq2HTML, defaultFaqSectionData } from './faq'
import type { FaqSectionData } from './faq'
import { ContactSectionEditor, renderContact2HTML, defaultContactSectionData } from './contact'
import type { ContactSectionData } from './contact'
import { FooterSectionEditor, renderFooter2HTML, defaultFooterSectionData } from './footer'
import type { FooterSectionData } from './footer'

/* ═══════════ PAGE TYPE ═══════════ */
interface PageSettings {
  bgColor?: string
}

interface SitePage {
  id: string; slug: string; title: string; title_secondary: string
  is_published: boolean; is_homepage: boolean; settings?: PageSettings
}

/* ═══════════ MAIN EDITOR ═══════════ */
export default function PageEditorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>}>
      <PageEditorInner />
    </Suspense>
  )
}

function PageEditorInner() {
  const { locale } = useTranslation()
  const lang = locale as 'en' | 'ru'
  const langConfig = useLanguageConfig()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Page management
  const [pages, setPages] = useState<SitePage[]>([])
  const [pageSlug, setPageSlug] = useState<string | null>(searchParams.get('page'))
  const [pagesLoading, setPagesLoading] = useState(true)

  const [blocks, setBlocks] = useState<PageBlock[]>(initBlocks)
  const [active, setActive] = useState('hero')
  const [loading, setLoading] = useState(true)
  const [pageSettings, setPageSettings] = useState<PageSettings>({})

  // Load pages list (admin mode — see all pages including drafts)
  const fetchPages = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/pages?admin=1')
      if (res.ok) {
        const data = await res.json()
        setPages(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Failed to load pages:', err)
    } finally {
      setPagesLoading(false)
    }
  }, [])

  useEffect(() => { fetchPages() }, [fetchPages])

  // Load page settings when pages list arrives and we have a slug from URL
  useEffect(() => {
    if (pageSlug && pages.length > 0) {
      const p = pages.find(x => x.slug === pageSlug)
      if (p?.settings) setPageSettings(p.settings)
    }
  }, [pages, pageSlug])

  // Select page from URL or default
  const selectPage = useCallback((slug: string) => {
    setPageSlug(slug)
    setLoading(true)
    const p = pages.find(x => x.slug === slug)
    setPageSettings(p?.settings || {})
    router.replace(`/dashboard/page-editor?page=${slug}`, { scroll: false })
  }, [router, pages])

  const goBackToPages = useCallback(() => {
    setPageSlug(null)
    setBlocks([])
    router.replace('/dashboard/page-editor', { scroll: false })
  }, [router])

  // Load blocks when pageSlug changes
  useEffect(() => {
    if (!pageSlug) { setLoading(false); return }
    const loadBlocks = async () => {
      setLoading(true)
      try {
        const res = await fetchWithAuth(`/api/page-blocks?page=${pageSlug}`)
        if (res.ok) {
          const data = await res.json()
          if (data.blocks && data.blocks.length > 0) {
            const migratedBlocks = data.blocks.map((block: PageBlock) => {
              if (block.type === 'courses' && !block.items) return { ...block, items: defaultCourseItems }
              if (block.type === 'programs' && !block.items) return { ...block, items: defaultProgramItems }
              if (block.type === 'results' && !block.items) return { ...block, items: defaultResultItems }
              if (block.type === 'header' && !block.data) return { ...block, data: defaultHeaderData }
              if (block.type === 'hero' && !block.data) return { ...block, data: defaultHeroData }
              if (block.type === 'about' && !block.data) return { ...block, data: defaultAboutData }
              if (block.type === 'htmlblock' && !block.data) return { ...block, data: defaultHtmlBlockData() }
              if (block.type === 'slider' && !block.data) return { ...block, data: defaultSliderData() }
              if (block.type === 'herotemplate' && !block.data) return { ...block, data: defaultHeroTemplateData() }
              if (block.type === 'courses2' && !block.data) return { ...block, data: { section: defaultCourseSectionData, items: defaultCourseItems2 } }
              if (block.type === 'about2' && !block.data) return { ...block, data: { section: defaultAboutSectionData } }
              if (block.type === 'cta2' && !block.data) return { ...block, data: { section: defaultCtaSectionData } }
              if (block.type === 'faq2' && !block.data) return { ...block, data: { section: defaultFaqSectionData } }
              if (block.type === 'contact2' && !block.data) return { ...block, data: { section: defaultContactSectionData } }
              if (block.type === 'footer2' && !block.data) return { ...block, data: { section: defaultFooterSectionData } }
              return block
            })
            setBlocks(migratedBlocks)
            setHistory([migratedBlocks])
            setHistIdx(0)
            setActive(migratedBlocks.find((b: any) => b.type === 'hero')?.id || migratedBlocks[0]?.id || 'hero')
          } else {
            // New page — start with default blocks only for home
            if (pageSlug === 'home') {
              await saveBlocksToDB(initBlocks)
              setBlocks(initBlocks)
              setActive('hero')
            } else {
              setBlocks([])
              setActive('')
            }
          }
        }
      } catch (err) {
        console.error('Failed to load page blocks:', err)
      } finally {
        setLoading(false)
      }
    }
    loadBlocks()
  }, [pageSlug]) // eslint-disable-line

  // Helper to save blocks to DB
  const saveBlocksToDB = async (blocksToSave: PageBlock[]) => {
    try {
      const res = await fetchWithAuth('/api/page-blocks', {
        method: 'POST',
        body: JSON.stringify({ pageSlug: pageSlug || 'home', blocks: blocksToSave })
      })
      if (!res.ok) {
        const err = await res.json()
        console.error('Save failed:', err)
      } else {
        console.log('Blocks saved to DB successfully')
      }
    } catch (err) {
      console.error('Save error:', err)
    }
  }

  // Save page-level settings (bgColor etc.) — debounced API call
  const pageSettingsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savePageSettings = (newSettings: PageSettings) => {
    setPageSettings(newSettings)
    if (pageSettingsTimer.current) clearTimeout(pageSettingsTimer.current)
    pageSettingsTimer.current = setTimeout(async () => {
      const currentPage = pages.find(p => p.slug === pageSlug)
      if (!currentPage) return
      try {
        await fetchWithAuth('/api/pages', {
          method: 'PATCH',
          body: JSON.stringify({ id: currentPage.id, settings: newSettings })
        })
      } catch (err) {
        console.error('Save page settings error:', err)
      }
    }, 500)
  }

  const [preview, setPreview] = useState(false)
  const [device, setDevice] = useState<'desktop' | 'mobile' | 'tablet'>('desktop')
  const [lt, setLt] = useState<'en' | 'ru'>(lang)
  const [addModal, setAddModal] = useState(false)
  const [insertIdx, setInsertIdx] = useState(-1)
  const [dragId, setDragId] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [showStyle, setShowStyle] = useState(false)
  const [history, setHistory] = useState<PageBlock[][]>([initBlocks])
  const [histIdx, setHistIdx] = useState(0)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  // editMode removed — structured blocks always use Items editor, custom blocks use RichEditor

  const ab = blocks.find(b => b.id === active) || null
  
  // Migration: add default items/data to blocks that don't have them
  const migrateBlock = (block: PageBlock): PageBlock => {
    if (block.type === 'courses' && !block.items) {
      return { ...block, items: defaultCourseItems, contentEn: renderCoursesHTML(defaultCourseItems, 'en'), contentRu: renderCoursesHTML(defaultCourseItems, 'ru') }
    }
    if (block.type === 'programs' && !block.items) {
      return { ...block, items: defaultProgramItems, contentEn: renderProgramsHTML(defaultProgramItems, 'en'), contentRu: renderProgramsHTML(defaultProgramItems, 'ru') }
    }
    if (block.type === 'results' && !block.items) {
      return { ...block, items: defaultResultItems, contentEn: renderResultsHTML(defaultResultItems, 'en'), contentRu: renderResultsHTML(defaultResultItems, 'ru') }
    }
    if (block.type === 'header' && !block.data) {
      return { ...block, data: defaultHeaderData, contentEn: renderHeaderHTML(defaultHeaderData, 'en', headerLC), contentRu: renderHeaderHTML(defaultHeaderData, 'ru', headerLC) }
    }
    if (block.type === 'hero' && !block.data) {
      return { ...block, data: defaultHeroData, contentEn: renderHeroHTML(defaultHeroData, 'en'), contentRu: renderHeroHTML(defaultHeroData, 'ru') }
    }
    if (block.type === 'about' && !block.data) {
      return { ...block, data: defaultAboutData, contentEn: renderAboutHTML(defaultAboutData, 'en'), contentRu: renderAboutHTML(defaultAboutData, 'ru') }
    }
    return block
  }
  
  const migrateAllBlocks = () => {
    const migrated = blocks.map(migrateBlock)
    const changed = migrated.some((b, i) => b !== blocks[i])
    if (changed) {
      push(migrated)
      toast.success(lang === 'ru' ? 'Блоки обновлены до структурированного формата!' : 'Blocks migrated to structured format!')
    } else {
      toast.info(lang === 'ru' ? 'Все блоки уже в структурированном формате' : 'All blocks already have structured data')
    }
  }

  const MAX_HISTORY = 50
  const push = (next: PageBlock[]) => {
    let h = history.slice(0, histIdx + 1)
    h.push(next)
    if (h.length > MAX_HISTORY) { h = h.slice(h.length - MAX_HISTORY) }
    setHistory(h)
    setHistIdx(h.length - 1)
    setBlocks(next)
  }
  const undo = () => { if (histIdx > 0) { const i = histIdx - 1; setHistIdx(i); setBlocks(history[i]) } }
  const redo = () => { if (histIdx < history.length - 1) { const i = histIdx + 1; setHistIdx(i); setBlocks(history[i]) } }

  const upd = (id: string, u: Partial<PageBlock>) => { const n = blocks.map(b => b.id === id ? { ...b, ...u } : b); push(n) }
  const updSilent = (id: string, u: Partial<PageBlock>) => setBlocks(p => p.map(b => b.id === id ? { ...b, ...u } : b)) // For typing — no history push

  /* ── Debounced commit for structured editors ──
     updSilent updates UI instantly (no history/no renderHTML),
     then after 400ms of idle, renderHTML + push to history */
  const blocksRef = useRef(blocks)
  blocksRef.current = blocks
  const historyRef = useRef(history)
  historyRef.current = history
  const histIdxRef = useRef(histIdx)
  histIdxRef.current = histIdx
  const commitTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      commitTimers.current.forEach(timer => clearTimeout(timer))
      commitTimers.current.clear()
    }
  }, [])

  const pushStable = (next: PageBlock[]) => {
    let h = historyRef.current.slice(0, histIdxRef.current + 1)
    h.push(next)
    if (h.length > MAX_HISTORY) { h = h.slice(h.length - MAX_HISTORY) }
    setHistory(h)
    setHistIdx(h.length - 1)
    setBlocks(next)
  }

  /** Flush all pending debounce timers — call before save to ensure contentEn/contentRu are fresh */
  const pendingRenders = useRef<Map<string, (block: PageBlock) => Partial<PageBlock>>>(new Map())

  const flushPendingCommits = () => {
    commitTimers.current.forEach((timer) => clearTimeout(timer))
    commitTimers.current.clear()
    const fns = pendingRenders.current
    if (fns.size === 0) return blocksRef.current
    let cur = blocksRef.current
    fns.forEach((renderFn, id) => {
      const block = cur.find(b => b.id === id)
      if (!block) return
      const rendered = renderFn(block)
      cur = cur.map(b => b.id === id ? { ...b, ...rendered } : b)
    })
    fns.clear()
    pushStable(cur)
    return cur
  }

  /** Update block data instantly (no re-render lag), debounce heavy renderHTML + history push */
  const updStructured = (id: string, dataUpdate: Partial<PageBlock>, renderFn: (block: PageBlock) => Partial<PageBlock>) => {
    updSilent(id, dataUpdate)
    pendingRenders.current.set(id, renderFn)
    const prev = commitTimers.current.get(id)
    if (prev) clearTimeout(prev)
    commitTimers.current.set(id, setTimeout(() => {
      commitTimers.current.delete(id)
      pendingRenders.current.delete(id)
      const cur = blocksRef.current
      const block = cur.find(b => b.id === id)
      if (!block) return
      const rendered = renderFn(block)
      const next = cur.map(b => b.id === id ? { ...b, ...rendered } : b)
      pushStable(next)
    }, 400))
  }
  const mv = (id: string, d: -1 | 1) => { const arr = [...blocks]; const i = arr.findIndex(b => b.id === id); const n = i + d; if (n < 0 || n >= arr.length) return;[arr[i], arr[n]] = [arr[n], arr[i]]; push(arr) }
  const rm = (id: string) => { const filtered = blocks.filter(b => b.id !== id); push(filtered); if (active === id) setActive(filtered[0]?.id || '') }
  const dup = (id: string) => { const i = blocks.findIndex(b => b.id === id); if (i < 0) return; const s = blocks[i]; const d: PageBlock = { ...s, id: `c_${Date.now()}`, label: s.label + ' ⊕', labelRu: s.labelRu + ' ⊕', style: { ...s.style } }; const a = [...blocks]; a.splice(i + 1, 0, d); push(a) }

  const addFromTemplate = (tpl: typeof TEMPLATES[0], idx?: number) => {
    const nid = `t_${Date.now()}`
    let nb: PageBlock

    // Structured block types
    if (tpl.en.startsWith('__STRUCTURED__')) {
      const structType = tpl.en.replace('__STRUCTURED__', '') as any
      if (structType === 'header') {
        const d = { ...defaultHeaderData }
        nb = { id: nid, type: 'header', label: tpl.l, labelRu: tpl.lr, visible: true, contentEn: renderHeaderHTML(d, 'en', headerLC), contentRu: renderHeaderHTML(d, 'ru', headerLC), style: {}, data: d }
      } else if (structType === 'htmlblock') {
        const d = defaultHtmlBlockData()
        nb = { id: nid, type: 'htmlblock', label: tpl.l, labelRu: tpl.lr, visible: true, contentEn: renderHtmlBlockHTML(d, 'en'), contentRu: renderHtmlBlockHTML(d, 'ru'), style: {}, data: d as any }
      } else if (structType === 'slider') {
        const d = defaultSliderData()
        nb = { id: nid, type: 'slider', label: tpl.l, labelRu: tpl.lr, visible: true, contentEn: renderSliderHTML(d, 'en'), contentRu: renderSliderHTML(d, 'ru'), style: {}, data: d as any }
      } else if (structType === 'herotemplate') {
        const d = defaultHeroTemplateData()
        nb = { id: nid, type: 'herotemplate', label: tpl.l, labelRu: tpl.lr, visible: true, contentEn: renderHeroTemplateHTML(d, 'en'), contentRu: renderHeroTemplateHTML(d, 'ru'), style: {}, data: d as any }
      } else if (structType === 'courses2') {
        const sec = { ...defaultCourseSectionData }
        const items = defaultCourseItems2.map(i => ({ ...i }))
        nb = { id: nid, type: 'courses2', label: tpl.l, labelRu: tpl.lr, visible: true, contentEn: renderCourses2HTML(items, sec, 'en'), contentRu: renderCourses2HTML(items, sec, 'ru'), style: {}, data: { section: sec, items } as any }
      } else if (structType === 'about2') {
        const sec = { ...defaultAboutSectionData, blocks: defaultAboutSectionData.blocks.map(b => ({ ...b })) }
        nb = { id: nid, type: 'about2', label: tpl.l, labelRu: tpl.lr, visible: true, contentEn: renderAbout2HTML(sec, 'en'), contentRu: renderAbout2HTML(sec, 'ru'), style: {}, data: { section: sec } as any }
      } else if (structType === 'cta2') {
        const sec = { ...defaultCtaSectionData, features: defaultCtaSectionData.features.map(f => ({ ...f })), btn1: { ...defaultCtaSectionData.btn1 }, btn2: { ...defaultCtaSectionData.btn2 } }
        nb = { id: nid, type: 'cta2', label: tpl.l, labelRu: tpl.lr, visible: true, contentEn: renderCta2HTML(sec, 'en'), contentRu: renderCta2HTML(sec, 'ru'), style: {}, data: { section: sec } as any }
      } else if (structType === 'faq2') {
        const sec = { ...defaultFaqSectionData, items: defaultFaqSectionData.items.map(i => ({ ...i })) }
        nb = { id: nid, type: 'faq2', label: tpl.l, labelRu: tpl.lr, visible: true, contentEn: renderFaq2HTML(sec, 'en'), contentRu: renderFaq2HTML(sec, 'ru'), style: {}, data: { section: sec } as any }
      } else if (structType === 'contact2') {
        const sec = { ...defaultContactSectionData, fields: defaultContactSectionData.fields.map(f => ({ ...f })), infoItems: defaultContactSectionData.infoItems.map(i => ({ ...i })), socialLinks: defaultContactSectionData.socialLinks.map(s => ({ ...s })) }
        nb = { id: nid, type: 'contact2', label: tpl.l, labelRu: tpl.lr, visible: true, contentEn: renderContact2HTML(sec, 'en'), contentRu: renderContact2HTML(sec, 'ru'), style: {}, data: { section: sec } as any }
      } else if (structType === 'footer2') {
        const sec = { ...defaultFooterSectionData, navColumns: defaultFooterSectionData.navColumns.map(c => ({ ...c, links: c.links.map(l => ({ ...l })) })), socialLinks: defaultFooterSectionData.socialLinks.map(s => ({ ...s })), contactItems: defaultFooterSectionData.contactItems.map(c => ({ ...c })) }
        nb = { id: nid, type: 'footer2', label: tpl.l, labelRu: tpl.lr, visible: true, contentEn: renderFooter2HTML(sec, 'en'), contentRu: renderFooter2HTML(sec, 'ru'), style: {}, data: { section: sec } as any }
      } else {
        nb = { id: nid, type: 'custom', label: tpl.l, labelRu: tpl.lr, visible: true, contentEn: '', contentRu: '', style: {} }
      }
    } else {
      nb = { id: nid, type: 'custom', label: tpl.l, labelRu: tpl.lr, visible: true, contentEn: tpl.en, contentRu: tpl.ru, style: {} }
    }

    const a = [...blocks]
    if (idx !== undefined && idx >= 0) a.splice(idx, 0, nb); else a.push(nb)
    push(a)
    setActive(nid)
    setAddModal(false)
    setInsertIdx(-1)
  }

  const onDragStart = (id: string) => setDragId(id)
  const onDragOver = (e: React.DragEvent, tid: string) => {
    e.preventDefault()
    if (!dragId || dragId === tid) return
    const a = [...blocks]
    const f = a.findIndex(b => b.id === dragId)
    const t = a.findIndex(b => b.id === tid)
    if (f < 0 || t < 0) return
    const [item] = a.splice(f, 1)
    a.splice(t, 0, item)
    setBlocks(a)
  }
  const onDragEnd = () => { setDragId(null); push(blocksRef.current) }

  const exportJSON = () => {
    const data = JSON.stringify(blocks, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'page-builder.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success(lang === 'ru' ? 'Экспорт готов' : 'Exported!')
  }
  const importJSON = () => {
    const i = document.createElement('input')
    i.type = 'file'
    i.accept = '.json'
    i.onchange = e => {
      const f = (e.target as HTMLInputElement).files?.[0]
      if (!f) return
      if (f.size > 5 * 1024 * 1024) { toast.error(lang === 'ru' ? 'Файл слишком большой (макс 5MB)' : 'File too large (max 5MB)'); return }
      const r = new FileReader()
      r.onload = ev => {
        try {
          const d = JSON.parse(ev.target?.result as string)
          if (!Array.isArray(d) || d.length > 50) { toast.error(lang === 'ru' ? 'Неверный формат (массив до 50 блоков)' : 'Invalid format (array of up to 50 blocks)'); return }
          const valid = d.every((b: any) => b && typeof b.id === 'string' && typeof b.type === 'string')
          if (!valid) { toast.error(lang === 'ru' ? 'Блоки должны иметь id и type' : 'Blocks must have id and type'); return }
          push(d); toast.success(lang === 'ru' ? 'Импорт!' : 'Imported!')
        } catch { toast.error('Invalid JSON') }
      }
      r.readAsText(f)
    }
    i.click()
  }

  const headerLC = { isBilingual: langConfig.isBilingual, primaryLanguage: langConfig.primaryLanguage, secondaryLanguage: langConfig.secondaryLanguage || null }

  const ph = blocks.filter(b => b.visible).map(b => {
    // Structured blocks: always render from data/items for latest dark theme
    let c: string
    if (b.type === 'header' && b.data) c = renderHeaderHTML(b.data as HeaderData, lt, headerLC)
    else if (b.type === 'about' && b.data) c = renderAboutHTML(b.data as AboutData, lt)
    else if (b.type === 'courses' && b.items) c = renderCoursesHTML(b.items as any[], lt)
    else if (b.type === 'programs' && b.items) c = renderProgramsHTML(b.items as any[], lt)
    else if (b.type === 'results' && b.items) c = renderResultsHTML(b.items as any[], lt)
    else if (b.type === 'htmlblock' && b.data) c = renderHtmlBlockHTML(b.data as any as HtmlBlockData, lt)
    else if (b.type === 'slider' && b.data) c = renderSliderHTML(b.data as any as SliderData, lt)
    else if (b.type === 'herotemplate' && b.data) c = renderHeroTemplateHTML(b.data as any as HeroTemplateData, lt)
    else if (b.type === 'courses2' && b.data) { const dd = b.data as any; c = renderCourses2HTML(dd.items || [], dd.section || defaultCourseSectionData, lt) }
    else if (b.type === 'about2' && b.data) { const dd = b.data as any; c = renderAbout2HTML(dd.section || defaultAboutSectionData, lt) }
    else if (b.type === 'cta2' && b.data) { const dd = b.data as any; c = renderCta2HTML(dd.section || defaultCtaSectionData, lt) }
    else if (b.type === 'faq2' && b.data) { const dd = b.data as any; c = renderFaq2HTML(dd.section || defaultFaqSectionData, lt) }
    else if (b.type === 'contact2' && b.data) { const dd = b.data as any; c = renderContact2HTML(dd.section || defaultContactSectionData, lt) }
    else if (b.type === 'footer2' && b.data) { const dd = b.data as any; c = renderFooter2HTML(dd.section || defaultFooterSectionData, lt) }
    else c = lt === 'ru' ? b.contentRu : b.contentEn
    const s = styleToCSS(b.style)
    const a = styleAttrs(b.style)
    return s || a ? `<div${a} style="${s}">${c}</div>` : c
  }).join('')

  const wrapClass = fullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-zinc-950 overflow-auto p-4' : 'space-y-4'
  const dw = device === 'mobile' ? 'max-w-[390px]' : device === 'tablet' ? 'max-w-[768px]' : 'w-full'

  if (loading && pageSlug) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
  }

  // ═══ PAGE SELECTION VIEW ═══
  const currentPage = pages.find(p => p.slug === pageSlug)
  if (!pageSlug) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-500" />
            {lang === 'ru' ? 'Конструктор страниц' : 'Page Builder'}
          </h1>
        </div>
        {pagesLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-teal-500" /></div>
        ) : pages.length === 0 ? (
          <div className="text-center py-20">
            <Globe className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
            <p className="text-zinc-500 mb-4">{lang === 'ru' ? 'Нет страниц. Создайте первую в разделе' : 'No pages yet. Create one in'} <a href="/dashboard/pages" className="text-teal-500 underline">{lang === 'ru' ? 'Страницы' : 'Pages'}</a></p>
          </div>
        ) : (
          <div className="space-y-2">
            {pages.map(page => (
              <button
                key={page.slug}
                onClick={() => selectPage(page.slug)}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex items-center gap-4 group hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-sm transition-all text-left"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${page.is_homepage ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-400'}`}>
                  {page.is_homepage ? <Home className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{lang === 'ru' ? page.title_secondary : page.title}</span>
                    {page.is_homepage && <span className="text-[10px] font-bold uppercase text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-1.5 py-0.5 rounded">{lang === 'ru' ? 'Главная' : 'Home'}</span>}
                    {!page.is_published && <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">{lang === 'ru' ? 'Черновик' : 'Draft'}</span>}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">/{page.slug}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-teal-500 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={wrapClass}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {fullscreen && <button onClick={() => setFullscreen(false)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><Minimize2 className="w-5 h-5" /></button>}
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-0.5">
              <button onClick={goBackToPages} className="hover:text-teal-500 transition-colors flex items-center gap-1"><ArrowLeft className="w-3 h-3" />{lang === 'ru' ? 'Страницы' : 'Pages'}</button>
              <span>/</span>
              <span className="text-zinc-600 dark:text-zinc-300">{currentPage ? (lang === 'ru' ? currentPage.title_secondary : currentPage.title) : pageSlug}</span>
            </div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{lang === 'ru' ? 'Конструктор' : 'Page Builder'}</h1>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          <div className="flex items-center gap-0.5 mr-2">
            <button onClick={undo} disabled={histIdx <= 0} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30" title="Undo"><Undo2 className="w-4 h-4" /></button>
            <button onClick={redo} disabled={histIdx >= history.length - 1} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30" title="Redo"><Redo2 className="w-4 h-4" /></button>
          </div>
          {langConfig.isBilingual && <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
            {[langConfig.primaryLanguage, langConfig.secondaryLanguage].filter(Boolean).map(l => (<button key={l} onClick={() => setLt(l as 'en' | 'ru')} className={`px-3 py-1 text-xs font-medium rounded-md ${lt === l ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`}>{(l as string).toUpperCase()}</button>))}
          </div>}
          <Button variant="outline" size="sm" onClick={() => setPreview(!preview)}>
            {preview ? <><EyeOff className="w-3.5 h-3.5 mr-1.5" />{lang === 'ru' ? 'Ред.' : 'Edit'}</> : <><Eye className="w-3.5 h-3.5 mr-1.5" />{lang === 'ru' ? 'Превью' : 'Preview'}</>}
          </Button>
          {preview && <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
            <button onClick={() => setDevice('desktop')} className={`p-1.5 rounded-md ${device === 'desktop' ? 'bg-white dark:bg-zinc-700 shadow' : ''}`}><Monitor className="w-3.5 h-3.5" /></button>
            <button onClick={() => setDevice('tablet')} className={`p-1.5 rounded-md ${device === 'tablet' ? 'bg-white dark:bg-zinc-700 shadow' : ''}`}><Tablet className="w-3.5 h-3.5" /></button>
            <button onClick={() => setDevice('mobile')} className={`p-1.5 rounded-md ${device === 'mobile' ? 'bg-white dark:bg-zinc-700 shadow' : ''}`}><Smartphone className="w-3.5 h-3.5" /></button>
          </div>}
          <button onClick={() => setFullscreen(!fullscreen)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Fullscreen"><Maximize2 className="w-4 h-4" /></button>
          <button onClick={exportJSON} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Export JSON"><Download className="w-4 h-4" /></button>
          <button onClick={importJSON} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Import JSON"><Upload className="w-4 h-4" /></button>
          <button onClick={migrateAllBlocks} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" title={lang === 'ru' ? 'Мигрировать в структуру' : 'Migrate to structured'}><LayoutList className="w-4 h-4" /></button>
          <Button variant="outline" size="sm" onClick={() => setShowResetConfirm(true)}>{lang === 'ru' ? 'Сброс' : 'Reset'}</Button>
          <Button variant="gradient" size="sm" onClick={async () => {
            try {
              const fresh = flushPendingCommits()
              await saveBlocksToDB(fresh)
              toast.success(lang === 'ru' ? 'Сохранено в базу!' : 'Saved to database!')
            } catch { toast.error(lang === 'ru' ? 'Ошибка сохранения' : 'Save failed') }
          }}><Save className="w-3.5 h-3.5 mr-1.5" />{lang === 'ru' ? 'Сохранить' : 'Save'}</Button>
        </div>
      </div>

      {preview ? (
        <Card><CardContent className="p-0"><div className={`mx-auto transition-all ${dw} ${device !== 'desktop' ? 'border-x border-zinc-200' : ''}`}>
          <div className="overflow-hidden" style={{ backgroundColor: pageSettings.bgColor || '#09090b' }} dangerouslySetInnerHTML={{ __html: ph }} />
        </div></CardContent></Card>
      ) : (
        <div className="grid lg:grid-cols-[280px_1fr] gap-4">
          {/* Sidebar */}
          <div className="space-y-3">
            <Card className="h-fit lg:sticky lg:top-4">
              <CardContent className="p-2.5">
                {/* Back to pages */}
                <button onClick={goBackToPages} className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-teal-500 transition-colors mb-2 -mt-0.5">
                  <ArrowLeft className="w-3 h-3" />
                  {lang === 'ru' ? 'Все страницы' : 'All pages'}
                </button>
                {/* Page background color */}
                <div className="flex items-center gap-2 mb-2.5 px-1 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                  <Paintbrush className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                  <span className="text-[10px] text-zinc-500 font-medium flex-1">{lang === 'ru' ? 'Фон страницы' : 'Page BG'}</span>
                  <div className="flex items-center gap-1">
                    <input type="color" value={pageSettings.bgColor || '#09090b'}
                      onChange={e => savePageSettings({ ...pageSettings, bgColor: e.target.value })}
                      className="w-5 h-5 rounded border-0 cursor-pointer bg-transparent flex-shrink-0" />
                    <span className="text-[9px] text-zinc-400 font-mono w-[52px]">{pageSettings.bgColor || '#09090b'}</span>
                    {pageSettings.bgColor && (
                      <button onClick={() => savePageSettings({ ...pageSettings, bgColor: undefined })}
                        className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400" title="Reset">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{lang === 'ru' ? 'Блоки' : 'Blocks'} ({blocks.length})</p>
                  <button onClick={() => { setInsertIdx(-1); setAddModal(true) }} className="p-1 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 text-teal-500" title="Add"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="space-y-0.5 max-h-[50vh] overflow-y-auto">
                  {blocks.length === 0 && (
                    <div className="text-center py-8">
                      <LayoutList className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
                      <p className="text-xs text-zinc-400 mb-3">{lang === 'ru' ? 'Пустая страница' : 'Empty page'}</p>
                      <button onClick={() => { setInsertIdx(-1); setAddModal(true) }} className="text-xs text-teal-500 hover:text-teal-600 font-medium">
                        <Plus className="w-3 h-3 inline mr-1" />{lang === 'ru' ? 'Добавить первый блок' : 'Add first block'}
                      </button>
                    </div>
                  )}
                  {blocks.map((b, idx) => {
                    const I = BLOCK_ICONS[b.type]
                    const isA = active === b.id
                    return (
                      <React.Fragment key={b.id}>
                        <div draggable onDragStart={() => onDragStart(b.id)} onDragOver={e => onDragOver(e, b.id)} onDragEnd={onDragEnd}
                          onClick={() => setActive(b.id)}
                          className={`flex items-center gap-1.5 p-2 rounded-xl cursor-pointer transition-all group select-none ${dragId === b.id ? 'opacity-40' : ''} ${isA ? 'bg-teal-50 dark:bg-teal-900/20 ring-1 ring-teal-300' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'} ${!b.visible ? 'opacity-30' : ''}`}>
                          <GripVertical className="w-3.5 h-3.5 text-zinc-300 cursor-grab flex-shrink-0" />
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${isA ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}><I className="w-3 h-3" /></div>
                          <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate flex-1">{lt === 'ru' ? b.labelRu : b.label}</span>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
                            <button onClick={e => { e.stopPropagation(); mv(b.id, -1) }} className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"><ChevronUp className="w-2.5 h-2.5" /></button>
                            <button onClick={e => { e.stopPropagation(); mv(b.id, 1) }} className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"><ChevronDown className="w-2.5 h-2.5" /></button>
                            <button onClick={e => { e.stopPropagation(); upd(b.id, { visible: !b.visible }) }} className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700">{b.visible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}</button>
                            <button onClick={e => { e.stopPropagation(); dup(b.id) }} className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"><Copy className="w-2.5 h-2.5" /></button>
                            <button onClick={e => { e.stopPropagation(); rm(b.id) }} className="p-0.5 rounded hover:bg-red-100 text-red-500"><Trash2 className="w-2.5 h-2.5" /></button>
                          </div>
                        </div>
                        {/* Between-block inserter */}
                        <div className="flex justify-center py-0.5 opacity-0 hover:opacity-100 transition-opacity">
                          <button onClick={() => { setInsertIdx(idx + 1); setAddModal(true) }} className="p-0.5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-500 hover:bg-teal-200"><Plus className="w-3 h-3" /></button>
                        </div>
                      </React.Fragment>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            {/* Section Style Panel */}
            {ab && showStyle && <StylePanel style={ab.style} onChange={s => updSilent(ab.id, { style: s })} onCommit={s => upd(ab.id, { style: s })} lang={lt} />}
          </div>

          {/* Editor */}
          <div className="space-y-3">
            {ab ? (<>
              <Card><CardContent className="p-2.5 flex items-center gap-2 flex-wrap">
                <input type="text" className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 text-sm font-medium flex-1 min-w-[120px]"
                  value={lang === 'ru' ? ab.labelRu : ab.label} onChange={e => updSilent(ab.id, lang === 'ru' ? { labelRu: e.target.value } : { label: e.target.value })} />
                <Badge variant={ab.visible ? 'success' : 'secondary'} className="cursor-pointer text-xs" onClick={() => upd(ab.id, { visible: !ab.visible })}>
                  {ab.visible ? (lang === 'ru' ? 'Виден' : 'On') : (lang === 'ru' ? 'Скрыт' : 'Off')}
                </Badge>
                <Badge variant="outline" className="text-[10px]">{ab.type}</Badge>

                <button onClick={() => setShowStyle(!showStyle)} className={`p-1.5 rounded-lg transition-colors ${showStyle ? 'bg-teal-100 text-teal-600 dark:bg-teal-900' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500'}`} title={lang === 'ru' ? 'Настройки' : 'Settings'}>
                  <Paintbrush className="w-4 h-4" /></button>
              </CardContent></Card>

              {/* Structured Editor for courses/programs/results */}
              {ab.type === 'courses' ? (
                <>
                  <CoursesBlockEditor
                    items={(ab.items as CourseItem[]) || defaultCourseItems}
                    onChange={(items) => {
                      updStructured(ab.id, { items, label: `Video Courses (${items.length})`, labelRu: `Видеокурсы (${items.length})` }, (b) => ({
                        contentEn: renderCoursesHTML(b.items as any[], 'en'),
                        contentRu: renderCoursesHTML(b.items as any[], 'ru')
                      }))
                    }}
                    lang={lt}
                  />
                  {/* Live preview for structured editor */}
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-zinc-50 dark:from-teal-900/20 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                        <Eye className="w-3 h-3 text-teal-500" />
                        <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{lang === 'ru' ? 'Превью' : 'Live Preview'}</span>
                      </div>
                      <div className="bg-zinc-950 max-h-[400px] overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: renderCoursesHTML((ab.items as CourseItem[]) || defaultCourseItems, lt) }} className="pointer-events-none" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : ab.type === 'programs' ? (
                <>
                  <ProgramsBlockEditor
                    items={(ab.items as ProgramItem[]) || defaultProgramItems}
                    onChange={(items) => {
                      updStructured(ab.id, { items, label: `Programs (${items.length})`, labelRu: `Программы (${items.length})` }, (b) => ({
                        contentEn: renderProgramsHTML(b.items as any[], 'en'),
                        contentRu: renderProgramsHTML(b.items as any[], 'ru')
                      }))
                    }}
                    lang={lt}
                  />
                  {/* Live preview for structured editor */}
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-zinc-50 dark:from-teal-900/20 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                        <Eye className="w-3 h-3 text-teal-500" />
                        <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{lang === 'ru' ? 'Превью' : 'Live Preview'}</span>
                      </div>
                      <div className="bg-zinc-950 max-h-[400px] overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: renderProgramsHTML((ab.items as ProgramItem[]) || defaultProgramItems, lt) }} className="pointer-events-none" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : ab.type === 'results' ? (
                <>
                  <ResultsBlockEditor
                    items={(ab.items as ResultItem[]) || defaultResultItems}
                    onChange={(items) => {
                      updStructured(ab.id, { items, label: `Results (${items.length})`, labelRu: `Результаты (${items.length})` }, (b) => ({
                        contentEn: renderResultsHTML(b.items as any[], 'en'),
                        contentRu: renderResultsHTML(b.items as any[], 'ru')
                      }))
                    }}
                    lang={lt}
                  />
                  {/* Live preview for structured editor */}
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-zinc-50 dark:from-teal-900/20 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                        <Eye className="w-3 h-3 text-teal-500" />
                        <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{lang === 'ru' ? 'Превью' : 'Live Preview'}</span>
                      </div>
                      <div className="bg-zinc-950 max-h-[400px] overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: renderResultsHTML((ab.items as ResultItem[]) || defaultResultItems, lt) }} className="pointer-events-none" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : ab.type === 'header' ? (
                <>
                  <HeaderEditor
                    data={(ab.data as HeaderData) || defaultHeaderData}
                    onChange={(data) => {
                      updStructured(ab.id, { data }, (b) => ({
                        contentEn: renderHeaderHTML(b.data as HeaderData, 'en', headerLC),
                        contentRu: renderHeaderHTML(b.data as HeaderData, 'ru', headerLC)
                      }))
                    }}
                    lang={lt}
                  />
                  {/* Live preview for structured editor */}
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-zinc-50 dark:from-teal-900/20 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                        <Eye className="w-3 h-3 text-teal-500" />
                        <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{lang === 'ru' ? 'Превью' : 'Live Preview'}</span>
                      </div>
                      <div className="bg-zinc-950 max-h-[400px] overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: renderHeaderHTML((ab.data as HeaderData) || defaultHeaderData, lt, headerLC) }} className="pointer-events-none" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : ab.type === 'hero' ? (
                <>
                  <HeroEditor
                    data={(ab.data as HeroData) || defaultHeroData}
                    onChange={(data) => {
                      updStructured(ab.id, { data }, (b) => ({
                        contentEn: renderHeroHTML(b.data as HeroData, 'en'),
                        contentRu: renderHeroHTML(b.data as HeroData, 'ru')
                      }))
                    }}
                    lang={lt}
                  />
                  {/* Live preview for structured editor */}
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-zinc-50 dark:from-teal-900/20 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                        <Eye className="w-3 h-3 text-teal-500" />
                        <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{lang === 'ru' ? 'Превью' : 'Live Preview'}</span>
                      </div>
                      <div className="bg-zinc-950 max-h-[400px] overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: renderHeroHTML((ab.data as HeroData) || defaultHeroData, lt) }} className="pointer-events-none" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : ab.type === 'about' ? (
                <>
                  <AboutEditor
                    data={(ab.data as AboutData) || defaultAboutData}
                    onChange={(data) => {
                      updStructured(ab.id, { data }, (b) => ({
                        contentEn: renderAboutHTML(b.data as AboutData, 'en'),
                        contentRu: renderAboutHTML(b.data as AboutData, 'ru')
                      }))
                    }}
                    lang={lt}
                  />
                  <Card className="overflow-hidden"><CardContent className="p-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-zinc-50 dark:from-teal-900/20 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <Eye className="w-3 h-3 text-teal-500" /><span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{lang === 'ru' ? 'Превью' : 'Live Preview'}</span>
                    </div>
                    <div className="bg-zinc-950 max-h-[600px] overflow-y-auto"><div dangerouslySetInnerHTML={{ __html: renderAboutHTML((ab.data as AboutData) || defaultAboutData, lt) }} className="pointer-events-none" /></div>
                  </CardContent></Card>
                </>
              ) : ab.type === 'htmlblock' ? (
                <>
                  <HtmlBlockEditor
                    data={(ab.data as any as HtmlBlockData) || defaultHtmlBlockData()}
                    onChange={(data) => {
                      updStructured(ab.id, { data: data as any }, (b) => ({
                        contentEn: renderHtmlBlockHTML(b.data as any as HtmlBlockData, 'en'),
                        contentRu: renderHtmlBlockHTML(b.data as any as HtmlBlockData, 'ru')
                      }))
                    }}
                    lang={lt}
                  />
                  <Card className="overflow-hidden"><CardContent className="p-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-zinc-50 dark:from-teal-900/20 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <Eye className="w-3 h-3 text-teal-500" /><span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{lang === 'ru' ? 'Превью' : 'Live Preview'}</span>
                    </div>
                    <div className="bg-zinc-950 max-h-[500px] overflow-y-auto"><div dangerouslySetInnerHTML={{ __html: renderHtmlBlockHTML((ab.data as any as HtmlBlockData) || defaultHtmlBlockData(), lt) }} className="pointer-events-none" /></div>
                  </CardContent></Card>
                </>
              ) : ab.type === 'slider' ? (
                <>
                  <SliderEditor
                    data={(ab.data as any as SliderData) || defaultSliderData()}
                    onChange={(data) => {
                      updStructured(ab.id, { data: data as any }, (b) => ({
                        contentEn: renderSliderHTML(b.data as any as SliderData, 'en'),
                        contentRu: renderSliderHTML(b.data as any as SliderData, 'ru')
                      }))
                    }}
                    lang={lt}
                  />
                  <Card className="overflow-hidden"><CardContent className="p-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-zinc-50 dark:from-teal-900/20 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <Eye className="w-3 h-3 text-teal-500" /><span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{lang === 'ru' ? 'Превью' : 'Live Preview'}</span>
                    </div>
                    <div className="bg-zinc-950 max-h-[500px] overflow-y-auto"><div dangerouslySetInnerHTML={{ __html: renderSliderHTML((ab.data as any as SliderData) || defaultSliderData(), lt) }} className="pointer-events-none" /></div>
                  </CardContent></Card>
                </>
              ) : ab.type === 'herotemplate' ? (
                <>
                  <HeroTemplateEditor
                    data={(ab.data as any as HeroTemplateData) || defaultHeroTemplateData()}
                    onChange={(data) => {
                      updStructured(ab.id, { data: data as any }, (b) => ({
                        contentEn: renderHeroTemplateHTML(b.data as any as HeroTemplateData, 'en'),
                        contentRu: renderHeroTemplateHTML(b.data as any as HeroTemplateData, 'ru')
                      }))
                    }}
                    lang={lt}
                  />
                  <Card className="overflow-hidden"><CardContent className="p-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-zinc-50 dark:from-teal-900/20 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <Eye className="w-3 h-3 text-teal-500" /><span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{lang === 'ru' ? 'Превью' : 'Live Preview'}</span>
                    </div>
                    <div className="bg-zinc-950 max-h-[600px] overflow-y-auto"><div dangerouslySetInnerHTML={{ __html: renderHeroTemplateHTML((ab.data as any as HeroTemplateData) || defaultHeroTemplateData(), lt) }} className="pointer-events-none" /></div>
                  </CardContent></Card>
                </>
              ) : ab.type === 'courses2' ? (
                <>
                  <CoursesSectionEditor
                    items={((ab.data as any)?.items as CourseItem2[]) || defaultCourseItems2}
                    section={((ab.data as any)?.section as CourseSectionData) || defaultCourseSectionData}
                    onChangeItems={(items) => {
                      const sec = ((ab.data as any)?.section as CourseSectionData) || defaultCourseSectionData
                      updStructured(ab.id, { data: { section: sec, items } as any, label: `Courses (${items.length})`, labelRu: `Курсы (${items.length})` }, (b) => {
                        const d = b.data as any; return { contentEn: renderCourses2HTML(d.items || [], d.section || defaultCourseSectionData, 'en'), contentRu: renderCourses2HTML(d.items || [], d.section || defaultCourseSectionData, 'ru') }
                      })
                    }}
                    onChangeSection={(sec) => {
                      const items = ((ab.data as any)?.items as CourseItem2[]) || defaultCourseItems2
                      updStructured(ab.id, { data: { section: sec, items } as any }, (b) => {
                        const d = b.data as any; return { contentEn: renderCourses2HTML(d.items || [], d.section || defaultCourseSectionData, 'en'), contentRu: renderCourses2HTML(d.items || [], d.section || defaultCourseSectionData, 'ru') }
                      })
                    }}
                    lang={lt}
                  />
                  <Card className="overflow-hidden"><CardContent className="p-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-zinc-50 dark:from-teal-900/20 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <Eye className="w-3 h-3 text-teal-500" /><span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{lang === 'ru' ? 'Превью' : 'Live Preview'}</span>
                    </div>
                    <div className="bg-zinc-950 max-h-[400px] overflow-y-auto"><div dangerouslySetInnerHTML={{ __html: renderCourses2HTML(((ab.data as any)?.items as CourseItem2[]) || defaultCourseItems2, ((ab.data as any)?.section as CourseSectionData) || defaultCourseSectionData, lt) }} className="pointer-events-none" /></div>
                  </CardContent></Card>
                </>
              ) : ab.type === 'about2' ? (
                <>
                  <AboutSectionEditor
                    section={((ab.data as any)?.section as AboutSectionData) || defaultAboutSectionData}
                    onChangeSection={(sec) => {
                      updStructured(ab.id, { data: { section: sec } as any }, (b) => {
                        const d = (b.data as any)?.section || defaultAboutSectionData
                        return { contentEn: renderAbout2HTML(d, 'en'), contentRu: renderAbout2HTML(d, 'ru') }
                      })
                    }}
                    lang={lt}
                  />
                  <Card className="overflow-hidden"><CardContent className="p-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-zinc-50 dark:from-teal-900/20 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <Eye className="w-3 h-3 text-teal-500" /><span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{lang === 'ru' ? 'Превью' : 'Live Preview'}</span>
                    </div>
                    <div className="bg-zinc-950 max-h-[400px] overflow-y-auto"><div dangerouslySetInnerHTML={{ __html: renderAbout2HTML(((ab.data as any)?.section as AboutSectionData) || defaultAboutSectionData, lt) }} className="pointer-events-none" /></div>
                  </CardContent></Card>
                </>
              ) : ab.type === 'cta2' ? (
                <>
                  <CtaSectionEditor
                    section={((ab.data as any)?.section as CtaSectionData) || defaultCtaSectionData}
                    onChangeSection={(sec) => {
                      updStructured(ab.id, { data: { section: sec } as any }, (b) => {
                        const d = (b.data as any)?.section || defaultCtaSectionData
                        return { contentEn: renderCta2HTML(d, 'en'), contentRu: renderCta2HTML(d, 'ru') }
                      })
                    }}
                    lang={lt}
                  />
                  <Card className="overflow-hidden"><CardContent className="p-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-zinc-50 dark:from-teal-900/20 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <Eye className="w-3 h-3 text-teal-500" /><span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{lang === 'ru' ? 'Превью' : 'Live Preview'}</span>
                    </div>
                    <div className="bg-zinc-950 max-h-[400px] overflow-y-auto"><div dangerouslySetInnerHTML={{ __html: renderCta2HTML(((ab.data as any)?.section as CtaSectionData) || defaultCtaSectionData, lt) }} className="pointer-events-none" /></div>
                  </CardContent></Card>
                </>
              ) : ab.type === 'faq2' ? (
                <>
                  <FaqSectionEditor
                    section={((ab.data as any)?.section as FaqSectionData) || defaultFaqSectionData}
                    onChangeSection={(sec) => {
                      updStructured(ab.id, { data: { section: sec } as any }, (b) => {
                        const d = (b.data as any)?.section || defaultFaqSectionData
                        return { contentEn: renderFaq2HTML(d, 'en'), contentRu: renderFaq2HTML(d, 'ru') }
                      })
                    }}
                    lang={lt}
                  />
                  <Card className="overflow-hidden"><CardContent className="p-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-zinc-50 dark:from-teal-900/20 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <Eye className="w-3 h-3 text-teal-500" /><span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{lang === 'ru' ? 'Превью' : 'Live Preview'}</span>
                    </div>
                    <div className="bg-zinc-950 max-h-[400px] overflow-y-auto"><div dangerouslySetInnerHTML={{ __html: renderFaq2HTML(((ab.data as any)?.section as FaqSectionData) || defaultFaqSectionData, lt) }} className="pointer-events-none" /></div>
                  </CardContent></Card>
                </>
              ) : ab.type === 'contact2' ? (
                <>
                  <ContactSectionEditor
                    section={((ab.data as any)?.section as ContactSectionData) || defaultContactSectionData}
                    onChangeSection={(sec) => {
                      updStructured(ab.id, { data: { section: sec } as any }, (b) => {
                        const d = (b.data as any)?.section || defaultContactSectionData
                        return { contentEn: renderContact2HTML(d, 'en'), contentRu: renderContact2HTML(d, 'ru') }
                      })
                    }}
                    lang={lt}
                  />
                  <Card className="overflow-hidden"><CardContent className="p-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-zinc-50 dark:from-teal-900/20 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <Eye className="w-3 h-3 text-teal-500" /><span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{lang === 'ru' ? 'Превью' : 'Live Preview'}</span>
                    </div>
                    <div className="bg-zinc-950 max-h-[400px] overflow-y-auto"><div dangerouslySetInnerHTML={{ __html: renderContact2HTML(((ab.data as any)?.section as ContactSectionData) || defaultContactSectionData, lt) }} className="pointer-events-none" /></div>
                  </CardContent></Card>
                </>
              ) : ab.type === 'footer2' ? (
                <>
                  <FooterSectionEditor
                    section={((ab.data as any)?.section as FooterSectionData) || defaultFooterSectionData}
                    onChangeSection={(sec) => {
                      updStructured(ab.id, { data: { section: sec } as any }, (b) => {
                        const d = (b.data as any)?.section || defaultFooterSectionData
                        return { contentEn: renderFooter2HTML(d, 'en'), contentRu: renderFooter2HTML(d, 'ru') }
                      })
                    }}
                    lang={lt}
                  />
                  <Card className="overflow-hidden"><CardContent className="p-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-zinc-50 dark:from-teal-900/20 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <Eye className="w-3 h-3 text-teal-500" /><span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{lang === 'ru' ? 'Превью' : 'Live Preview'}</span>
                    </div>
                    <div className="bg-zinc-950 max-h-[400px] overflow-y-auto"><div dangerouslySetInnerHTML={{ __html: renderFooter2HTML(((ab.data as any)?.section as FooterSectionData) || defaultFooterSectionData, lt) }} className="pointer-events-none" /></div>
                  </CardContent></Card>
                </>
              ) : (
                <RichEditor key={`${ab.id}__${lt}`} content={lt === 'ru' ? ab.contentRu : ab.contentEn}
                  onChange={h => {
                    updSilent(ab.id, lt === 'ru' ? { contentRu: h } : { contentEn: h })
                    // Debounced history push for undo/redo
                    const timerKey = `rich_${ab.id}`
                    const prev = commitTimers.current.get(timerKey)
                    if (prev) clearTimeout(prev)
                    commitTimers.current.set(timerKey, setTimeout(() => {
                      commitTimers.current.delete(timerKey)
                      pushStable(blocksRef.current)
                    }, 1000))
                  }} minH="450px" lang={lt} />
              )}

              {/* Live section style preview */}
              {styleToCSS(ab.style) && (
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <Eye className="w-3 h-3 text-zinc-400" />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{lang === 'ru' ? 'Превью стилей секции' : 'Section style preview'}</span>
                    </div>
                    <div style={parseCSStoObj(styleToCSS(ab.style))} className="transition-all">
                      <div dangerouslySetInnerHTML={{ __html: lt === 'ru' ? ab.contentRu : ab.contentEn }} className="pointer-events-none" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </>) : (
              <Card><CardContent className="p-16 text-center">
                <Layout className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-500">{lang === 'ru' ? 'Выберите блок' : 'Select a block'}</h3>
              </CardContent></Card>
            )}
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowResetConfirm(false)}>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">{lang === 'ru' ? 'Сбросить блоки?' : 'Reset blocks?'}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">{lang === 'ru' ? 'Все блоки будут заменены на исходные. Несохранённые правки будут потеряны.' : 'All blocks will be replaced with defaults. Unsaved changes will be lost.'}</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowResetConfirm(false)}>{lang === 'ru' ? 'Отмена' : 'Cancel'}</Button>
            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" onClick={async () => {
              setShowResetConfirm(false)
              const isHome = pageSlug === 'home'
              const resetBlocks = isHome ? initBlocks : []
              push(resetBlocks)
              await saveBlocksToDB(resetBlocks)
              setActive(isHome ? 'hero' : '')
              toast.success(lang === 'ru' ? 'Сброшено к дефолтам' : 'Reset to defaults!')
            }}>{lang === 'ru' ? 'Сбросить' : 'Reset'}</Button>
          </div>
        </div>
      </div>)}

      {/* Add Block modal */}
      {addModal && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setAddModal(false); setInsertIdx(-1) }}>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{lang === 'ru' ? 'Добавить блок' : 'Add Block'}{insertIdx >= 0 && <span className="text-sm font-normal text-zinc-500 ml-2">→ {lang === 'ru' ? `позиция ${insertIdx + 1}` : `position ${insertIdx + 1}`}</span>}</h2>
            <button onClick={() => { setAddModal(false); setInsertIdx(-1) }} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {TEMPLATES.map(tpl => {
              const I = tpl.icon
              return (
                <button key={tpl.id} onClick={() => addFromTemplate(tpl, insertIdx >= 0 ? insertIdx : undefined)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 group-hover:bg-teal-100 flex items-center justify-center"><I className="w-5 h-5 text-zinc-500 group-hover:text-teal-500" /></div>
                  <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{lang === 'ru' ? tpl.lr : tpl.l}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>)}
    </div>
  )
}
