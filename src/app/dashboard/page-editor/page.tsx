'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import {
  Save, Eye, EyeOff, Monitor, Smartphone, Undo2, Redo2,
  ChevronDown, ChevronUp, GripVertical, Trash2, Copy,
  Layout, X, Tablet, Download, Upload, Paintbrush,
  Maximize2, Minimize2, Plus, Loader2, Code2, LayoutList
} from 'lucide-react'
import { toast } from 'sonner'

// Local modules
import { TEMPLATES, initBlocks, defaultCourseItems, defaultProgramItems, defaultResultItems, defaultHeaderData, defaultHeroData, defaultAboutData } from './default-content'
import { BLOCK_ICONS, type PageBlock, type CourseItem, type ProgramItem, type ResultItem, type HeaderData, type HeroData, type AboutData } from './types'
import { styleToCSS, styleAttrs, parseCSStoObj } from './utils'
import { RichEditor } from './rich-editor'
import { StylePanel } from './style-panel'
import { CoursesBlockEditor, ProgramsBlockEditor, ResultsBlockEditor, HeaderEditor, HeroEditor, AboutEditor } from './item-editors'
import { renderCoursesHTML, renderProgramsHTML, renderResultsHTML, renderHeaderHTML, renderHeroHTML, renderAboutHTML } from './renderers'

/* ═══════════ MAIN EDITOR ═══════════ */
export default function PageEditorPage() {
  const { locale } = useTranslation()
  const lang = locale as 'en' | 'ru'
  const [blocks, setBlocks] = useState<PageBlock[]>(initBlocks)
  const [active, setActive] = useState('hero')
  const [loading, setLoading] = useState(true)

  // Load blocks from database on mount, or save defaults if DB is empty
  useEffect(() => {
    const loadBlocks = async () => {
      try {
        const res = await fetch('/api/page-blocks?page=home')
        if (res.ok) {
          const data = await res.json()
          if (data.blocks && data.blocks.length > 0) {
            // Auto-migrate blocks that don't have items/data
            const migratedBlocks = data.blocks.map((block: PageBlock) => {
              if (block.type === 'courses' && !block.items) {
                return { ...block, items: defaultCourseItems }
              }
              if (block.type === 'programs' && !block.items) {
                return { ...block, items: defaultProgramItems }
              }
              if (block.type === 'results' && !block.items) {
                return { ...block, items: defaultResultItems }
              }
              if (block.type === 'header' && !block.data) {
                return { ...block, data: defaultHeaderData }
              }
              if (block.type === 'hero' && !block.data) {
                return { ...block, data: defaultHeroData }
              }
              if (block.type === 'about' && !block.data) {
                return { ...block, data: defaultAboutData }
              }
              return block
            })
            setBlocks(migratedBlocks)
            setActive(migratedBlocks.find((b: any) => b.type === 'hero')?.id || migratedBlocks[0]?.id || 'hero')
          } else {
            // No blocks in DB — save defaults
            console.log('No blocks in DB, saving defaults...')
            await saveBlocksToDB(initBlocks)
            setActive('hero')
          }
        }
      } catch (err) {
        console.error('Failed to load page blocks:', err)
      } finally {
        setLoading(false)
      }
    }
    loadBlocks()
  }, []) // eslint-disable-line

  // Helper to save blocks to DB
  const saveBlocksToDB = async (blocksToSave: PageBlock[]) => {
    try {
      const res = await fetch('/api/page-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageSlug: 'home', blocks: blocksToSave })
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
  const [editMode, setEditMode] = useState<'structured' | 'html'>('structured') // For blocks with items

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
      return { ...block, data: defaultHeaderData, contentEn: renderHeaderHTML(defaultHeaderData, 'en'), contentRu: renderHeaderHTML(defaultHeaderData, 'ru') }
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

  const push = (next: PageBlock[]) => {
    const h = history.slice(0, histIdx + 1)
    h.push(next)
    setHistory(h)
    setHistIdx(h.length - 1)
    setBlocks(next)
  }
  const undo = () => { if (histIdx > 0) { const i = histIdx - 1; setHistIdx(i); setBlocks(history[i]) } }
  const redo = () => { if (histIdx < history.length - 1) { const i = histIdx + 1; setHistIdx(i); setBlocks(history[i]) } }

  const upd = (id: string, u: Partial<PageBlock>) => { const n = blocks.map(b => b.id === id ? { ...b, ...u } : b); push(n) }
  const updSilent = (id: string, u: Partial<PageBlock>) => setBlocks(p => p.map(b => b.id === id ? { ...b, ...u } : b)) // For typing — no history push
  const mv = (id: string, d: -1 | 1) => { const arr = [...blocks]; const i = arr.findIndex(b => b.id === id); const n = i + d; if (n < 0 || n >= arr.length) return;[arr[i], arr[n]] = [arr[n], arr[i]]; push(arr) }
  const rm = (id: string) => { const filtered = blocks.filter(b => b.id !== id); push(filtered); if (active === id) setActive(filtered[0]?.id || '') }
  const dup = (id: string) => { const i = blocks.findIndex(b => b.id === id); if (i < 0) return; const s = blocks[i]; const d: PageBlock = { ...s, id: `c_${Date.now()}`, label: s.label + ' ⊕', labelRu: s.labelRu + ' ⊕', style: { ...s.style } }; const a = [...blocks]; a.splice(i + 1, 0, d); push(a) }

  const addFromTemplate = (tpl: typeof TEMPLATES[0], idx?: number) => {
    const nid = `t_${Date.now()}`
    const nb: PageBlock = { id: nid, type: 'custom', label: tpl.l, labelRu: tpl.lr, visible: true, contentEn: tpl.en, contentRu: tpl.ru, style: {} }
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
  const onDragEnd = () => { setDragId(null); push(blocks) }

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
      const r = new FileReader()
      r.onload = ev => {
        try {
          const d = JSON.parse(ev.target?.result as string)
          if (Array.isArray(d)) { push(d); toast.success(lang === 'ru' ? 'Импорт!' : 'Imported!') }
        } catch { toast.error('Invalid JSON') }
      }
      r.readAsText(f)
    }
    i.click()
  }

  const ph = blocks.filter(b => b.visible).map(b => {
    const c = lt === 'ru' ? b.contentRu : b.contentEn
    const s = styleToCSS(b.style)
    const a = styleAttrs(b.style)
    return s || a ? `<div${a} style="${s}">${c}</div>` : c
  }).join('')

  const wrapClass = fullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-zinc-950 overflow-auto p-4' : 'space-y-4'
  const dw = device === 'mobile' ? 'max-w-[390px]' : device === 'tablet' ? 'max-w-[768px]' : 'w-full'

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
  }

  return (
    <div className={wrapClass}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {fullscreen && <button onClick={() => setFullscreen(false)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><Minimize2 className="w-5 h-5" /></button>}
          <div><h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{lang === 'ru' ? 'Конструктор' : 'Page Builder'}</h1></div>
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          <div className="flex items-center gap-0.5 mr-2">
            <button onClick={undo} disabled={histIdx <= 0} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30" title="Undo"><Undo2 className="w-4 h-4" /></button>
            <button onClick={redo} disabled={histIdx >= history.length - 1} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30" title="Redo"><Redo2 className="w-4 h-4" /></button>
          </div>
          <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
            {(['en', 'ru'] as const).map(l => (<button key={l} onClick={() => setLt(l)} className={`px-3 py-1 text-xs font-medium rounded-md ${lt === l ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`}>{l.toUpperCase()}</button>))}
          </div>
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
          <Button variant="outline" size="sm" onClick={async () => {
            if (!confirm(lang === 'ru' ? 'Сбросить все блоки к исходным? Несохранённые правки будут потеряны.' : 'Reset all blocks to defaults? Unsaved changes will be lost.')) return
            push(initBlocks)
            await saveBlocksToDB(initBlocks)
            setActive('hero')
            toast.success(lang === 'ru' ? 'Сброшено к дефолтам' : 'Reset to defaults!')
          }}>{lang === 'ru' ? 'Сброс' : 'Reset'}</Button>
          <Button variant="gradient" size="sm" onClick={async () => {
            try {
              const res = await fetch('/api/page-blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageSlug: 'home', blocks })
              })
              if (!res.ok) throw new Error('Save failed')
              toast.success(lang === 'ru' ? 'Сохранено в базу!' : 'Saved to database!')
            } catch { toast.error(lang === 'ru' ? 'Ошибка сохранения' : 'Save failed') }
          }}><Save className="w-3.5 h-3.5 mr-1.5" />{lang === 'ru' ? 'Сохранить' : 'Save'}</Button>
        </div>
      </div>

      {preview ? (
        <Card><CardContent className="p-0"><div className={`mx-auto transition-all ${dw} ${device !== 'desktop' ? 'border-x border-zinc-200' : ''}`}>
          <div className="bg-white overflow-hidden" dangerouslySetInnerHTML={{ __html: ph }} />
        </div></CardContent></Card>
      ) : (
        <div className="grid lg:grid-cols-[280px_1fr] gap-4">
          {/* Sidebar */}
          <div className="space-y-3">
            <Card className="h-fit lg:sticky lg:top-4">
              <CardContent className="p-2.5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{lang === 'ru' ? 'Блоки' : 'Blocks'} ({blocks.length})</p>
                  <button onClick={() => { setInsertIdx(-1); setAddModal(true) }} className="p-1 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 text-teal-500" title="Add"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="space-y-0.5 max-h-[50vh] overflow-y-auto">
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
                {/* Mode toggle for structured blocks */}
                {(ab.type === 'courses' || ab.type === 'programs' || ab.type === 'results' || ab.type === 'header' || ab.type === 'hero' || ab.type === 'about') && (
                  <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
                    <button onClick={() => setEditMode('structured')} className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${editMode === 'structured' ? 'bg-white dark:bg-zinc-700 shadow text-teal-600' : 'text-zinc-500'}`}>
                      <LayoutList className="w-3 h-3" />{lang === 'ru' ? 'Элементы' : 'Items'}
                    </button>
                    <button onClick={() => setEditMode('html')} className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${editMode === 'html' ? 'bg-white dark:bg-zinc-700 shadow text-amber-600' : 'text-zinc-500'}`}>
                      <Code2 className="w-3 h-3" />HTML
                    </button>
                  </div>
                )}
                <button onClick={() => setShowStyle(!showStyle)} className={`p-1.5 rounded-lg transition-colors ${showStyle ? 'bg-teal-100 text-teal-600 dark:bg-teal-900' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500'}`} title={lang === 'ru' ? 'Настройки' : 'Settings'}>
                  <Paintbrush className="w-4 h-4" /></button>
              </CardContent></Card>

              {/* Structured Editor for courses/programs/results */}
              {ab.type === 'courses' && editMode === 'structured' ? (
                <>
                  <CoursesBlockEditor
                    items={(ab.items as CourseItem[]) || defaultCourseItems}
                    onChange={(items) => {
                      const contentEn = renderCoursesHTML(items, 'en')
                      const contentRu = renderCoursesHTML(items, 'ru')
                      upd(ab.id, { items, contentEn, contentRu, label: `Video Courses (${items.length})`, labelRu: `Видеокурсы (${items.length})` })
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
                      <div className="bg-white dark:bg-zinc-950 max-h-[400px] overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: lt === 'ru' ? ab.contentRu : ab.contentEn }} className="pointer-events-none" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : ab.type === 'programs' && editMode === 'structured' ? (
                <>
                  <ProgramsBlockEditor
                    items={(ab.items as ProgramItem[]) || defaultProgramItems}
                    onChange={(items) => {
                      const contentEn = renderProgramsHTML(items, 'en')
                      const contentRu = renderProgramsHTML(items, 'ru')
                      upd(ab.id, { items, contentEn, contentRu, label: `Programs (${items.length})`, labelRu: `Программы (${items.length})` })
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
                      <div className="bg-white dark:bg-zinc-950 max-h-[400px] overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: lt === 'ru' ? ab.contentRu : ab.contentEn }} className="pointer-events-none" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : ab.type === 'results' && editMode === 'structured' ? (
                <>
                  <ResultsBlockEditor
                    items={(ab.items as ResultItem[]) || defaultResultItems}
                    onChange={(items) => {
                      const contentEn = renderResultsHTML(items, 'en')
                      const contentRu = renderResultsHTML(items, 'ru')
                      upd(ab.id, { items, contentEn, contentRu, label: `Results (${items.length})`, labelRu: `Результаты (${items.length})` })
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
                      <div className="bg-white dark:bg-zinc-950 max-h-[400px] overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: lt === 'ru' ? ab.contentRu : ab.contentEn }} className="pointer-events-none" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : ab.type === 'header' && editMode === 'structured' ? (
                <>
                  <HeaderEditor
                    data={(ab.data as HeaderData) || defaultHeaderData}
                    onChange={(data) => {
                      const contentEn = renderHeaderHTML(data, 'en')
                      const contentRu = renderHeaderHTML(data, 'ru')
                      upd(ab.id, { data, contentEn, contentRu })
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
                      <div className="bg-white dark:bg-zinc-950 max-h-[400px] overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: lt === 'ru' ? ab.contentRu : ab.contentEn }} className="pointer-events-none" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : ab.type === 'hero' && editMode === 'structured' ? (
                <>
                  <HeroEditor
                    data={(ab.data as HeroData) || defaultHeroData}
                    onChange={(data) => {
                      const contentEn = renderHeroHTML(data, 'en')
                      const contentRu = renderHeroHTML(data, 'ru')
                      upd(ab.id, { data, contentEn, contentRu })
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
                      <div className="bg-white dark:bg-zinc-950 max-h-[400px] overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: lt === 'ru' ? ab.contentRu : ab.contentEn }} className="pointer-events-none" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : ab.type === 'about' && editMode === 'structured' ? (
                <>
                  <AboutEditor
                    data={(ab.data as AboutData) || defaultAboutData}
                    onChange={(data) => {
                      const contentEn = renderAboutHTML(data, 'en')
                      const contentRu = renderAboutHTML(data, 'ru')
                      upd(ab.id, { data, contentEn, contentRu })
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
                      <div className="bg-white dark:bg-zinc-950 max-h-[400px] overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: lt === 'ru' ? ab.contentRu : ab.contentEn }} className="pointer-events-none" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <RichEditor key={`${ab.id}__${lt}`} content={lt === 'ru' ? ab.contentRu : ab.contentEn}
                  onChange={h => updSilent(ab.id, lt === 'ru' ? { contentRu: h } : { contentEn: h })} minH="450px" lang={lt} />
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
