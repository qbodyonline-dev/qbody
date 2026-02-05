'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Undo2, Redo2, Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Link2, Image,
  Type, Palette, Minus, ChevronDown, X, Heading1, Heading2, Heading3,
  Quote, Code2, Columns2, Columns3, LayoutGrid, Square, Rows3,
  PanelTop, ImagePlus, Play, MessageSquare, DollarSign, Hash, Camera, Eye
} from 'lucide-react'

import { FONTS, SIZES, PAL, GRADIENTS } from './constants'

/* ═══════════ RICH TEXT EDITOR ═══════════ */
export function RichEditor({ content, onChange, minH = '350px', lang }: {
  content: string; onChange: (h: string) => void; minH?: string; lang: 'en' | 'ru'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [htmlMode, setHtmlMode] = useState(false)
  const [src, setSrc] = useState(content)
  const latest = useRef(content)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const [dd, setDd] = useState<string | null>(null)
  const [linkModal, setLinkModal] = useState(false)
  const [lu, setLu] = useState('')
  const [lxt, setLxt] = useState('')
  const savedRange = useRef<Range | null>(null)

  /* Element inspector */
  const [pickedEl, setPickedEl] = useState<HTMLElement | null>(null)
  const pickedElRef = useRef<HTMLElement | null>(null)
  const [elStyle, setElStyle] = useState<Record<string, string>>({})
  const [inspTab, setInspTab] = useState<'style' | 'size' | 'border' | 'extra'>('style')

  useEffect(() => {
    latest.current = content
    if (ref.current && !htmlMode && ref.current.innerHTML !== content) ref.current.innerHTML = content
  }, [content]) // eslint-disable-line
  useEffect(() => { if (!htmlMode && ref.current) ref.current.innerHTML = latest.current }, [htmlMode])
  useEffect(() => {
    const h = (e: MouseEvent) => { if (dd && !(e.target as HTMLElement).closest('[data-dd]')) setDd(null) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [dd])

  /* Save & restore selection so toolbar clicks don't lose cursor */
  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      if (ref.current?.contains(range.commonAncestorContainer)) {
        savedRange.current = range.cloneRange()
      }
    }
  }
  const restoreSelection = () => {
    if (savedRange.current && ref.current) {
      ref.current.focus()
      const sel = window.getSelection()
      if (sel) { sel.removeAllRanges(); sel.addRange(savedRange.current) }
    } else if (ref.current) {
      ref.current.focus()
      const sel = window.getSelection()
      if (sel) { sel.selectAllChildren(ref.current); sel.collapseToEnd() }
    }
  }

  const sync = () => {
    if (ref.current) {
      const pel = pickedElRef.current
      const savedOutline = pel?.style.outline
      if (pel) pel.style.outline = ''
      const h = ref.current.innerHTML
      if (pel && savedOutline) pel.style.outline = savedOutline
      latest.current = h
      onChangeRef.current(h)
    }
  }

  const exec = (c: string, v?: string) => {
    restoreSelection()
    document.execCommand(c, false, v)
    saveSelection()
    sync()
  }

  /* ── Element Inspector ── */
  const readElStyle = (el: HTMLElement) => {
    const s = el.style
    setElStyle({
      background: s.background || s.backgroundColor || '',
      color: s.color || '',
      fontSize: s.fontSize || '',
      fontWeight: s.fontWeight || '',
      padding: s.padding || '',
      paddingTop: s.paddingTop || '', paddingBottom: s.paddingBottom || '',
      paddingLeft: s.paddingLeft || '', paddingRight: s.paddingRight || '',
      margin: s.margin || '',
      marginTop: s.marginTop || '', marginBottom: s.marginBottom || '',
      marginLeft: s.marginLeft || '', marginRight: s.marginRight || '',
      borderRadius: s.borderRadius || '',
      border: s.border || '',
      borderColor: s.borderColor || '',
      borderWidth: s.borderWidth || '',
      borderStyle: s.borderStyle || '',
      boxShadow: s.boxShadow || '',
      width: s.width || '', height: s.height || '',
      maxWidth: s.maxWidth || '', minHeight: s.minHeight || '',
      opacity: s.opacity || '',
      gap: s.gap || '',
      textAlign: s.textAlign || '',
      display: s.display || '',
    })
  }
  const applyElStyle = (key: string, val: string) => {
    if (!pickedEl) return
    ; (pickedEl.style as any)[key] = val
    setElStyle(prev => ({ ...prev, [key]: val }))
    sync()
  }
  const pickElement = (e: React.MouseEvent) => {
    if (!e.altKey && e.detail < 2) return
    const target = e.target as HTMLElement
    if (!target || target === ref.current) { unpickEl(); return }
    let el = target
    if (el.tagName === 'SPAN' && el.parentElement && el.parentElement !== ref.current) el = el.parentElement
    e.preventDefault()
    e.stopPropagation()
    if (pickedElRef.current) pickedElRef.current.style.outline = ''
    el.style.outline = '2px dashed #14b8a6'
    pickedElRef.current = el
    setPickedEl(el)
    readElStyle(el)
    setInspTab('style')
  }
  const unpickEl = () => {
    if (pickedElRef.current) pickedElRef.current.style.outline = ''
    pickedElRef.current = null
    setPickedEl(null)
    setElStyle({})
  }
  useEffect(() => () => { if (pickedElRef.current) pickedElRef.current.style.outline = '' }, [])

  /* Prettify HTML for readable code view */
  const prettifyHtml = (html: string): string => {
    if (!html) return ''
    let out = html
      .replace(/></g, '>\n<')
      .replace(/(<\/div>)/gi, '$1\n')
      .replace(/(<\/p>)/gi, '$1\n')
      .replace(/(<\/h[1-6]>)/gi, '$1\n')
      .replace(/(<\/ul>)/gi, '$1\n')
      .replace(/(<\/li>)/gi, '$1\n')
      .replace(/(<\/section>)/gi, '$1\n')
      .replace(/(<br\s*\/?>)/gi, '$1\n')
      .replace(/(<hr[^>]*\/?>)/gi, '\n$1\n')
    out = out.replace(/\n{3,}/g, '\n\n').trim()
    const lines = out.split('\n')
    let indent = 0
    const result: string[] = []
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) { result.push(''); continue }
      if (/^<\//.test(trimmed) && indent > 0) indent--
      result.push('  '.repeat(indent) + trimmed)
      if (/^<[a-zA-Z][^>]*[^\/]>$/.test(trimmed) && !/^<(br|hr|img|input|meta|link)/i.test(trimmed)) {
        indent++
      }
      if (/<\/[^>]+>$/.test(trimmed) && /^<[^\/]/.test(trimmed)) {
        if (indent > 0 && /^<[a-zA-Z][^>]*>.*<\/[a-zA-Z]+>$/.test(trimmed)) indent--
      }
    }
    return result.join('\n')
  }

  const toHtml = () => {
    unpickEl()
    if (ref.current) {
      const c = ref.current.innerHTML
      latest.current = c
      setSrc(prettifyHtml(c))
    }
    setHtmlMode(true)
  }
  const toVis = () => {
    const raw = src.replace(/\n\s*/g, '')
    setHtmlMode(false)
    onChangeRef.current(raw)
    latest.current = raw
  }

  const insImg = () => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'
    i.onchange = e => {
      const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return
      const r = new FileReader()
      r.onload = ev => exec('insertHTML', `<img src="${ev.target?.result}" alt="" style="max-width:100%;border-radius:12px;margin:8px 0;" />`)
      r.readAsDataURL(f)
    }; i.click()
  }
  const insLink = () => { if (!lu) return; exec('insertHTML', `<a href="${lu}" target="_blank" style="color:#14b8a6;text-decoration:underline;">${lxt || lu}</a>`); setLinkModal(false); setLu(''); setLxt('') }
  const insCols = (n: number) => { const c = Array.from({ length: n }, () => `<div style="flex:1;padding:16px;border:2px dashed #d4d4d8;border-radius:12px;min-height:80px;"><p style="color:#999;">Column content</p></div>`).join(''); exec('insertHTML', `<div style="display:flex;gap:16px;margin:16px 0;">${c}</div>`); setDd(null) }
  const insBtn = () => { exec('insertHTML', `<a href="#" style="display:inline-block;padding:14px 32px;border-radius:14px;background:#14b8a6;color:white;font-weight:600;text-decoration:none;margin:8px 4px;">Button</a>`); setDd(null) }
  const insCard = () => { exec('insertHTML', `<div style="background:white;border:1px solid #e4e4e7;border-radius:16px;padding:24px;margin:12px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);"><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">Card Title</h3><p style="color:#52525b;font-size:14px;">Card description.</p></div>`); setDd(null) }
  const insVideo = () => { exec('insertHTML', `<div style="position:relative;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:20px;padding:60px;text-align:center;color:white;margin:12px 0;cursor:pointer;"><div style="width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;box-shadow:0 4px 20px rgba(0,0,0,0.2);"><span style="font-size:28px;color:#18181b;margin-left:4px;">▶</span></div><p style="font-size:14px;opacity:0.9;">Click to play video</p></div>`); setDd(null) }
  const insSpacer = () => { exec('insertHTML', `<div style="height:48px;"></div>`); setDd(null) }
  const insDivider = () => { exec('insertHTML', `<hr style="border:0;border-top:2px solid #e4e4e7;margin:24px 0;" />`); setDd(null) }
  const insTestimonial = () => { exec('insertHTML', `<div style="background:#fafafa;border-radius:16px;padding:24px;margin:12px 0;"><p style="font-style:italic;color:#52525b;font-size:15px;margin-bottom:12px;">"Amazing experience! Highly recommended."</p><div style="display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#14b8a6,#0d9488);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">A</div><div><p style="font-weight:600;font-size:14px;color:#18181b;">Anna Smith</p><p style="font-size:12px;color:#71717a;">Client</p></div></div></div>`); setDd(null) }
  const insPricing = () => { exec('insertHTML', `<div style="border:2px solid #14b8a6;border-radius:20px;padding:32px;text-align:center;margin:12px 0;max-width:300px;"><div style="background:#14b8a6;color:white;padding:4px 16px;border-radius:20px;display:inline-block;font-size:12px;font-weight:600;margin-bottom:16px;">POPULAR</div><h3 style="font-size:24px;font-weight:800;color:#18181b;margin-bottom:4px;">Pro Plan</h3><div style="margin:16px 0;"><span style="font-size:48px;font-weight:800;color:#18181b;">$49</span><span style="color:#71717a;font-size:14px;">/month</span></div><ul style="list-style:none;padding:0;margin:0 0 24px;text-align:left;"><li style="padding:8px 0;font-size:14px;color:#52525b;border-bottom:1px solid #f4f4f5;">✅ Feature one</li><li style="padding:8px 0;font-size:14px;color:#52525b;border-bottom:1px solid #f4f4f5;">✅ Feature two</li><li style="padding:8px 0;font-size:14px;color:#52525b;">✅ Feature three</li></ul><a href="#" style="display:block;padding:14px;border-radius:14px;background:#14b8a6;color:white;font-weight:600;text-decoration:none;">Get started</a></div>`); setDd(null) }
  const insCounter = () => { exec('insertHTML', `<div style="display:flex;gap:24px;justify-content:center;margin:24px 0;"><div style="text-align:center;"><p style="font-size:42px;font-weight:800;color:#14b8a6;">1000+</p><p style="font-size:14px;color:#52525b;">Clients</p></div><div style="text-align:center;"><p style="font-size:42px;font-weight:800;color:#14b8a6;">17+</p><p style="font-size:14px;color:#52525b;">Years</p></div><div style="text-align:center;"><p style="font-size:42px;font-weight:800;color:#14b8a6;">5×</p><p style="font-size:14px;color:#52525b;">Champion</p></div></div>`); setDd(null) }
  const insGallery = () => { exec('insertHTML', `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0;"><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#999;font-size:24px;">📷</div><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#999;font-size:24px;">📷</div><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#999;font-size:24px;">📷</div></div>`); setDd(null) }

  /* ── Toolbar buttons use onMouseDown to prevent focus loss ── */
  const TBtn = ({ icon: I, onAction, title, active: a }: { icon: any; onAction: () => void; title?: string; active?: boolean }) => (
    <button onMouseDown={e => { e.preventDefault(); onAction() }} title={title} className={`p-1.5 rounded-lg transition-colors ${a ? 'bg-teal-100 dark:bg-teal-900 text-teal-600' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}><I className="w-4 h-4" /></button>)
  const DD = ({ name, label, icon: I, children }: { name: string; label: string; icon?: any; children: React.ReactNode }) => (
    <div className="relative" data-dd>
      <button onMouseDown={e => { e.preventDefault(); saveSelection(); setDd(dd === name ? null : name) }} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700">
        {I && <I className="w-3.5 h-3.5" />}{label}<ChevronDown className="w-3 h-3" /></button>
      {dd === name && <div className="absolute top-full left-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-40 py-1">{children}</div>}
    </div>)
  const Sep = () => <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-600 mx-0.5" />
  const IBtn = ({ icon: I, label: lb, onAction }: { icon: any; label: string; onAction: () => void }) => (
    <button onMouseDown={e => { e.preventDefault(); onAction() }} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-300 transition-all">
      <I className="w-3.5 h-3.5" />{lb}</button>)

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900">
      {/* Row 1: Format */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
        <TBtn icon={Undo2} onAction={() => exec('undo')} title="Undo" />
        <TBtn icon={Redo2} onAction={() => exec('redo')} title="Redo" />
        <Sep />
        <TBtn icon={Bold} onAction={() => exec('bold')} title="Bold" />
        <TBtn icon={Italic} onAction={() => exec('italic')} title="Italic" />
        <TBtn icon={Underline} onAction={() => exec('underline')} title="Underline" />
        <TBtn icon={Strikethrough} onAction={() => exec('strikethrough')} title="Strike" />
        <Sep />
        <TBtn icon={Heading1} onAction={() => exec('formatBlock', 'h1')} title="H1" />
        <TBtn icon={Heading2} onAction={() => exec('formatBlock', 'h2')} title="H2" />
        <TBtn icon={Heading3} onAction={() => exec('formatBlock', 'h3')} title="H3" />
        <TBtn icon={Type} onAction={() => exec('formatBlock', 'p')} title="P" />
        <TBtn icon={Quote} onAction={() => exec('formatBlock', 'blockquote')} title="Quote" />
        <Sep />
        <TBtn icon={AlignLeft} onAction={() => exec('justifyLeft')} />
        <TBtn icon={AlignCenter} onAction={() => exec('justifyCenter')} />
        <TBtn icon={AlignRight} onAction={() => exec('justifyRight')} />
        <Sep />
        <TBtn icon={List} onAction={() => exec('insertUnorderedList')} />
        <TBtn icon={ListOrdered} onAction={() => exec('insertOrderedList')} />
      </div>
      {/* Row 2: Styles */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50">
        <DD name="font" label={lang === 'ru' ? 'Шрифт' : 'Font'} icon={Type}>
          <div className="min-w-[170px]">{FONTS.map(f => (<button key={f.v} onMouseDown={e => { e.preventDefault(); exec('fontName', f.v); setDd(null) }} className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700" style={{ fontFamily: f.v }}>{f.l}</button>))}</div>
        </DD>
        <DD name="size" label={lang === 'ru' ? 'Размер' : 'Size'}>
          <div className="min-w-[90px] max-h-48 overflow-y-auto">{SIZES.map(s => (<button key={s} onMouseDown={e => { e.preventDefault(); exec('fontSize', '7'); setTimeout(() => { ref.current?.querySelectorAll('font[size="7"]').forEach(el => { (el as HTMLElement).removeAttribute('size'); (el as HTMLElement).style.fontSize = s }); sync() }, 10); setDd(null) }} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700">{s}</button>))}</div>
        </DD>
        <DD name="color" label={lang === 'ru' ? 'Цвет' : 'Color'} icon={Palette}>
          <div className="p-3 w-[260px]"><p className="text-xs text-zinc-500 mb-2">{lang === 'ru' ? 'Цвет текста' : 'Text color'}</p>
            <div className="grid grid-cols-8 gap-1">{PAL.map(c => (<button key={c} onMouseDown={e => { e.preventDefault(); exec('foreColor', c); setDd(null) }} className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-600 hover:scale-110 transition-transform" style={{ backgroundColor: c }} />))}</div>
            <input type="color" className="w-full h-8 mt-2 rounded cursor-pointer" onInput={e => { exec('foreColor', (e.target as HTMLInputElement).value) }} /></div>
        </DD>
        <DD name="bg" label={lang === 'ru' ? 'Фон' : 'BG'}>
          <div className="p-3 w-[260px]"><p className="text-xs text-zinc-500 mb-2">{lang === 'ru' ? 'Фон текста' : 'Background'}</p>
            <div className="grid grid-cols-8 gap-1">{PAL.map(c => (<button key={c} onMouseDown={e => { e.preventDefault(); exec('hiliteColor', c); setDd(null) }} className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-600 hover:scale-110 transition-transform" style={{ backgroundColor: c }} />))}</div>
            <input type="color" className="w-full h-8 mt-2 rounded cursor-pointer" onInput={e => { exec('hiliteColor', (e.target as HTMLInputElement).value) }} /></div>
        </DD>
        <Sep />
        <TBtn icon={Link2} onAction={() => { saveSelection(); setLinkModal(true) }} title="Link" />
        <TBtn icon={Image} onAction={insImg} title="Image" />
        <div className="flex-1" />
        <button onClick={htmlMode ? toVis : toHtml} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${htmlMode ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'}`}>
          {htmlMode ? <><Eye className="w-3.5 h-3.5" />{lang === 'ru' ? 'Визуально' : 'Visual'}</> : <><Code2 className="w-3.5 h-3.5" />HTML</>}</button>
      </div>
      {/* Row 3: Elements (Elementor-style) */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-700 bg-gradient-to-r from-teal-50/30 to-indigo-50/30 dark:from-teal-900/5 dark:to-indigo-900/5">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mr-1">{lang === 'ru' ? 'Элементы' : 'Elements'}</span>
        <IBtn icon={Columns2} label="2col" onAction={() => insCols(2)} />
        <IBtn icon={Columns3} label="3col" onAction={() => insCols(3)} />
        <IBtn icon={LayoutGrid} label="4col" onAction={() => insCols(4)} />
        <Sep />
        <IBtn icon={Square} label={lang === 'ru' ? 'Кнопка' : 'Button'} onAction={insBtn} />
        <IBtn icon={PanelTop} label={lang === 'ru' ? 'Карточка' : 'Card'} onAction={insCard} />
        <IBtn icon={Play} label={lang === 'ru' ? 'Видео' : 'Video'} onAction={insVideo} />
        <IBtn icon={ImagePlus} label={lang === 'ru' ? 'Фото' : 'Photo'} onAction={insImg} />
        <IBtn icon={MessageSquare} label={lang === 'ru' ? 'Отзыв' : 'Review'} onAction={insTestimonial} />
        <IBtn icon={DollarSign} label={lang === 'ru' ? 'Цена' : 'Pricing'} onAction={insPricing} />
        <IBtn icon={Hash} label={lang === 'ru' ? 'Счётчик' : 'Counter'} onAction={insCounter} />
        <IBtn icon={Camera} label={lang === 'ru' ? 'Галерея' : 'Gallery'} onAction={insGallery} />
        <IBtn icon={Rows3} label={lang === 'ru' ? 'Отступ' : 'Spacer'} onAction={insSpacer} />
        <IBtn icon={Minus} label={lang === 'ru' ? 'Линия' : 'Divider'} onAction={insDivider} />
      </div>
      {/* Content */}
      {htmlMode ? (
        <textarea className="w-full p-4 text-sm font-mono leading-relaxed bg-zinc-950 text-green-400 focus:outline-none resize-y whitespace-pre" style={{ minHeight: minH, tabSize: 2 }} value={src}
          onChange={e => { const v = e.target.value; setSrc(v); const raw = v.replace(/\n\s*/g, ''); latest.current = raw; onChangeRef.current(raw) }} />
      ) : (
        <div className="relative">
          <div ref={ref} contentEditable suppressContentEditableWarning className="p-4 focus:outline-none" style={{ minHeight: minH }}
            onInput={sync} onBlur={() => { saveSelection(); sync() }} onMouseUp={e => { saveSelection(); pickElement(e) }} onKeyUp={saveSelection} />
          {!pickedEl && <div className="absolute bottom-2 right-3 text-[10px] text-zinc-400/60 pointer-events-none select-none">
            Alt+{lang === 'ru' ? 'клик — стили элемента' : 'click — element styles'}
          </div>}
        </div>
      )}
      {/* ── Element Inspector Panel ── */}
      {pickedEl && !htmlMode && (
        <div className="border-t border-teal-200 dark:border-teal-800 bg-gradient-to-r from-teal-50/50 to-zinc-50 dark:from-teal-950/20 dark:to-zinc-900">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{lang === 'ru' ? 'Элемент' : 'Element'}</span>
            <code className="text-[10px] text-zinc-500 bg-zinc-200/80 dark:bg-zinc-700 px-1.5 py-0.5 rounded">&lt;{pickedEl.tagName.toLowerCase()}&gt;</code>
            <div className="flex-1" />
            <div className="flex gap-0.5 bg-zinc-200/80 dark:bg-zinc-700 rounded-lg p-0.5">
              {(['style', 'size', 'border', 'extra'] as const).map(t => (
                <button key={t} onClick={() => setInspTab(t)} className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${inspTab === t ? 'bg-white dark:bg-zinc-600 shadow text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700'}`}>
                  {t === 'style' ? (lang === 'ru' ? 'Стиль' : 'Style') : t === 'size' ? (lang === 'ru' ? 'Размер' : 'Size') : t === 'border' ? (lang === 'ru' ? 'Рамка' : 'Border') : (lang === 'ru' ? 'Ещё' : 'Extra')}
                </button>
              ))}
            </div>
            <button onClick={unpickEl} className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="px-3 py-2.5">
            {inspTab === 'style' && (
              <div className="flex flex-wrap gap-x-4 gap-y-2 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang === 'ru' ? 'Фон' : 'BG'}</label>
                  <div className="flex gap-1 items-center">
                    <input type="color" value={(elStyle.background || '').startsWith('#') ? elStyle.background : '#ffffff'} onChange={e => applyElStyle('background', e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-zinc-200" />
                    <input className="w-32 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.background || ''} onChange={e => applyElStyle('background', e.target.value)} placeholder="color / gradient" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang === 'ru' ? 'Текст' : 'Color'}</label>
                  <div className="flex gap-1 items-center">
                    <input type="color" value={(elStyle.color || '').startsWith('#') ? elStyle.color : '#000000'} onChange={e => applyElStyle('color', e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-zinc-200" />
                    <input className="w-20 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.color || ''} onChange={e => applyElStyle('color', e.target.value)} placeholder="#000" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang === 'ru' ? 'Шрифт' : 'Font'}</label>
                  <input className="w-16 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.fontSize || ''} onChange={e => applyElStyle('fontSize', e.target.value)} placeholder="16px" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang === 'ru' ? 'Жирн.' : 'Wt'}</label>
                  <select className="px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-[26px]" value={elStyle.fontWeight || ''} onChange={e => applyElStyle('fontWeight', e.target.value)}>
                    <option value="">—</option><option value="400">400</option><option value="500">500</option><option value="600">600</option><option value="700">700</option><option value="800">800</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang === 'ru' ? 'Выравн.' : 'Align'}</label>
                  <select className="px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-[26px]" value={elStyle.textAlign || ''} onChange={e => applyElStyle('textAlign', e.target.value)}>
                    <option value="">—</option><option value="left">←</option><option value="center">↔</option><option value="right">→</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang === 'ru' ? 'Прозр.' : 'α'}</label>
                  <input className="w-12 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.opacity || ''} onChange={e => applyElStyle('opacity', e.target.value)} placeholder="1" />
                </div>
              </div>
            )}
            {inspTab === 'size' && (
              <div className="flex flex-wrap gap-x-5 gap-y-2 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">Padding ↑ → ↓ ←</label>
                  <div className="flex gap-1">
                    <input className="w-[52px] px-1.5 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg text-center" value={elStyle.paddingTop || ''} onChange={e => applyElStyle('paddingTop', e.target.value)} placeholder="↑" />
                    <input className="w-[52px] px-1.5 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg text-center" value={elStyle.paddingRight || ''} onChange={e => applyElStyle('paddingRight', e.target.value)} placeholder="→" />
                    <input className="w-[52px] px-1.5 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg text-center" value={elStyle.paddingBottom || ''} onChange={e => applyElStyle('paddingBottom', e.target.value)} placeholder="↓" />
                    <input className="w-[52px] px-1.5 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg text-center" value={elStyle.paddingLeft || ''} onChange={e => applyElStyle('paddingLeft', e.target.value)} placeholder="←" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">Margin ↑ → ↓ ←</label>
                  <div className="flex gap-1">
                    <input className="w-[52px] px-1.5 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg text-center" value={elStyle.marginTop || ''} onChange={e => applyElStyle('marginTop', e.target.value)} placeholder="↑" />
                    <input className="w-[52px] px-1.5 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg text-center" value={elStyle.marginRight || ''} onChange={e => applyElStyle('marginRight', e.target.value)} placeholder="→" />
                    <input className="w-[52px] px-1.5 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg text-center" value={elStyle.marginBottom || ''} onChange={e => applyElStyle('marginBottom', e.target.value)} placeholder="↓" />
                    <input className="w-[52px] px-1.5 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg text-center" value={elStyle.marginLeft || ''} onChange={e => applyElStyle('marginLeft', e.target.value)} placeholder="←" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang === 'ru' ? 'Шир.' : 'W'}</label>
                  <input className="w-[68px] px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.width || ''} onChange={e => applyElStyle('width', e.target.value)} placeholder="auto" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang === 'ru' ? 'Выс.' : 'H'}</label>
                  <input className="w-[68px] px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.height || ''} onChange={e => applyElStyle('height', e.target.value)} placeholder="auto" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">Gap</label>
                  <input className="w-14 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.gap || ''} onChange={e => applyElStyle('gap', e.target.value)} placeholder="16px" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">Display</label>
                  <select className="px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-[26px]" value={elStyle.display || ''} onChange={e => applyElStyle('display', e.target.value)}>
                    <option value="">—</option><option value="block">block</option><option value="flex">flex</option><option value="grid">grid</option><option value="inline-block">i-block</option><option value="none">none</option>
                  </select>
                </div>
              </div>
            )}
            {inspTab === 'border' && (
              <div className="flex flex-wrap gap-x-4 gap-y-2 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang === 'ru' ? 'Скругл.' : 'Radius'}</label>
                  <input className="w-[68px] px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.borderRadius || ''} onChange={e => applyElStyle('borderRadius', e.target.value)} placeholder="12px" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang === 'ru' ? 'Толщ.' : 'Bdr W'}</label>
                  <input className="w-14 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.borderWidth || ''} onChange={e => applyElStyle('borderWidth', e.target.value)} placeholder="1px" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang === 'ru' ? 'Стиль' : 'Bdr S'}</label>
                  <select className="px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-[26px]" value={elStyle.borderStyle || ''} onChange={e => applyElStyle('borderStyle', e.target.value)}>
                    <option value="">—</option><option value="solid">solid</option><option value="dashed">dashed</option><option value="dotted">dotted</option><option value="none">none</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang === 'ru' ? 'Цвет рамки' : 'Bdr Color'}</label>
                  <div className="flex gap-1 items-center">
                    <input type="color" value={(elStyle.borderColor || '').startsWith('#') ? elStyle.borderColor : '#e4e4e7'} onChange={e => applyElStyle('borderColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-zinc-200" />
                    <input className="w-20 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.borderColor || ''} onChange={e => applyElStyle('borderColor', e.target.value)} placeholder="#e4e4e7" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang === 'ru' ? 'Тень' : 'Shadow'}</label>
                  <select className="px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-[26px] w-24" value={elStyle.boxShadow || ''} onChange={e => applyElStyle('boxShadow', e.target.value)}>
                    <option value="">{lang === 'ru' ? 'Нет' : 'None'}</option>
                    <option value="0 1px 3px rgba(0,0,0,0.1)">{lang === 'ru' ? 'Мягкая' : 'Soft'}</option>
                    <option value="0 4px 12px rgba(0,0,0,0.1)">{lang === 'ru' ? 'Средняя' : 'Med'}</option>
                    <option value="0 8px 30px rgba(0,0,0,0.15)">{lang === 'ru' ? 'Сильная' : 'Strong'}</option>
                    <option value="0 20px 60px rgba(0,0,0,0.2)">{lang === 'ru' ? 'Глубокая' : 'Deep'}</option>
                  </select>
                </div>
              </div>
            )}
            {inspTab === 'extra' && (
              <div className="space-y-2.5">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-zinc-500 mr-1">{lang === 'ru' ? 'Градиенты' : 'Gradients'}:</span>
                  {GRADIENTS.map(g => (<button key={g} onClick={() => applyElStyle('background', g)} className="w-7 h-7 rounded-lg border border-zinc-200 hover:scale-110 transition-transform" style={{ background: g }} />))}
                  <button onClick={() => applyElStyle('background', '')} className="text-[10px] text-zinc-400 hover:text-red-500 ml-1">✕</button>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <button onClick={() => { if (pickedEl) { pickedEl.removeAttribute('style'); pickedEl.style.outline = '2px dashed #14b8a6'; readElStyle(pickedEl); sync() } }} className="px-2.5 py-1 text-[10px] bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                    {lang === 'ru' ? 'Сбросить стили' : 'Reset styles'}
                  </button>
                  <button onClick={() => { if (pickedEl) { const el = pickedEl; unpickEl(); el.remove(); sync() } }} className="px-2.5 py-1 text-[10px] bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                    {lang === 'ru' ? 'Удалить' : 'Delete'}
                  </button>
                </div>
                {pickedEl.tagName === 'A' && (
                  <div className="flex gap-2 items-end">
                    <div className="space-y-0.5"><label className="text-[10px] text-zinc-500">href</label>
                      <input className="w-48 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={pickedEl.getAttribute('href') || ''} onChange={e => { pickedEl.setAttribute('href', e.target.value); sync() }} /></div>
                    <div className="space-y-0.5"><label className="text-[10px] text-zinc-500">target</label>
                      <select className="px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-[26px]" value={pickedEl.getAttribute('target') || ''} onChange={e => { pickedEl.setAttribute('target', e.target.value); sync() }}><option value="">—</option><option value="_blank">_blank</option><option value="_self">_self</option></select></div>
                  </div>
                )}
                {pickedEl.tagName === 'IMG' && (
                  <div className="flex gap-2 items-end">
                    <div className="space-y-0.5"><label className="text-[10px] text-zinc-500">src</label>
                      <input className="w-56 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={pickedEl.getAttribute('src') || ''} onChange={e => { pickedEl.setAttribute('src', e.target.value); sync() }} /></div>
                    <div className="space-y-0.5"><label className="text-[10px] text-zinc-500">alt</label>
                      <input className="w-28 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={pickedEl.getAttribute('alt') || ''} onChange={e => { pickedEl.setAttribute('alt', e.target.value); sync() }} /></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Link modal */}
      {linkModal && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setLinkModal(false)}>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
          <h3 className="font-semibold mb-4 text-zinc-900 dark:text-zinc-100">{lang === 'ru' ? 'Вставить ссылку' : 'Insert Link'}</h3>
          <Input placeholder="https://..." className="mb-3" value={lu} onChange={e => setLu(e.target.value)} />
          <Input placeholder={lang === 'ru' ? 'Текст' : 'Text'} className="mb-4" value={lxt} onChange={e => setLxt(e.target.value)} />
          <div className="flex gap-2 justify-end"><Button variant="ghost" onClick={() => setLinkModal(false)}>{lang === 'ru' ? 'Отмена' : 'Cancel'}</Button>
            <Button variant="gradient" onClick={insLink}>{lang === 'ru' ? 'Вставить' : 'Insert'}</Button></div></div></div>)}
    </div>
  )
}
