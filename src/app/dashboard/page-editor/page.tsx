'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/lib/i18n'
import {
  Save, Eye, EyeOff, Monitor, Smartphone, Undo2, Redo2,
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link2, Image, Type, Palette, Minus, Plus,
  ChevronDown, ChevronUp, GripVertical, Trash2, Copy, Settings2,
  Layout, FileText, Users, Target, MessageSquare, Trophy,
  X, Heading1, Heading2, Heading3, Quote, Code2, Tablet,
  Zap, Video,
  Mail, Play, Globe, Columns2, Columns3,
  LayoutGrid, Square, Rows3, PanelTop, ImagePlus, Maximize2, Minimize2,
  Download, Upload, Paintbrush, Hash,
  DollarSign, Heart, Camera, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

/* ═══════════ CONSTANTS ═══════════ */
const FONTS = [
  { l:'Inter', v:'Inter,sans-serif' }, { l:'Arial', v:'Arial,sans-serif' },
  { l:'Georgia', v:'Georgia,serif' }, { l:'Courier', v:'Courier New,monospace' },
  { l:'Helvetica', v:'Helvetica,sans-serif' }, { l:'Verdana', v:'Verdana,sans-serif' },
  { l:'Playfair', v:'Playfair Display,serif' }, { l:'Roboto', v:'Roboto,sans-serif' },
]
const SIZES = ['12px','14px','16px','18px','20px','24px','28px','32px','36px','42px','48px','56px','64px']
const PAL = [
  '#000000','#1a1a2e','#16213e','#333333','#52525b','#71717a','#999999','#CCCCCC','#e4e4e7','#f4f4f5','#fafafa','#FFFFFF',
  '#14b8a6','#0d9488','#0f766e','#115e59','#2dd4bf','#5eead4',
  '#ef4444','#dc2626','#f97316','#ea580c','#eab308','#ca8a04',
  '#22c55e','#16a34a','#3b82f6','#2563eb','#6366f1','#4f46e5',
  '#8b5cf6','#7c3aed','#ec4899','#db2777','#f43f5e','#e11d48',
]
const GRADIENTS = [
  'linear-gradient(135deg,#14b8a6,#0d9488)',
  'linear-gradient(135deg,#0f766e,#115e59,#18181b)',
  'linear-gradient(135deg,#3b82f6,#6366f1)',
  'linear-gradient(135deg,#8b5cf6,#7c3aed)',
  'linear-gradient(135deg,#ec4899,#f43f5e)',
  'linear-gradient(135deg,#f97316,#eab308)',
  'linear-gradient(135deg,#22c55e,#14b8a6)',
  'linear-gradient(135deg,#18181b,#27272a)',
  'linear-gradient(180deg,#fafafa,#fff)',
  'linear-gradient(135deg,#667eea,#764ba2)',
]

/* ═══════════ RICH TEXT EDITOR ═══════════ */
function RichEditor({ content, onChange, minH = '350px', lang }: {
  content: string; onChange: (h: string) => void; minH?: string; lang: 'en'|'ru'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [htmlMode, setHtmlMode] = useState(false)
  const [src, setSrc] = useState(content)
  const latest = useRef(content)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const [dd, setDd] = useState<string|null>(null)
  const [linkModal, setLinkModal] = useState(false)
  const [lu, setLu] = useState('')
  const [lxt, setLxt] = useState('')
  const savedRange = useRef<Range|null>(null)
  /* Element inspector */
  const [pickedEl, setPickedEl] = useState<HTMLElement|null>(null)
  const pickedElRef = useRef<HTMLElement|null>(null)
  const [elStyle, setElStyle] = useState<Record<string,string>>({})
  const [inspTab, setInspTab] = useState<'style'|'size'|'border'|'extra'>('style')

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
      // Place cursor at end if no saved selection
      const sel = window.getSelection()
      if (sel) { sel.selectAllChildren(ref.current); sel.collapseToEnd() }
    }
  }

  const sync = () => {
    if (ref.current) {
      // Temporarily remove inspector outline before reading innerHTML
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
    ;(pickedEl.style as any)[key] = val
    setElStyle(prev => ({ ...prev, [key]: val }))
    sync()
  }
  const pickElement = (e: React.MouseEvent) => {
    // Alt+Click or double-click to pick element for styling
    if (!e.altKey && e.detail < 2) return
    const target = e.target as HTMLElement
    if (!target || target === ref.current) { unpickEl(); return }
    // Find the meaningful parent element (skip text nodes / spans inside)
    let el = target
    if (el.tagName === 'SPAN' && el.parentElement && el.parentElement !== ref.current) el = el.parentElement
    e.preventDefault()
    e.stopPropagation()
    // Remove old highlight
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
  // Cleanup on unmount
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
    // Remove excessive blank lines
    out = out.replace(/\n{3,}/g, '\n\n').trim()
    // Indent nested tags
    const lines = out.split('\n')
    let indent = 0
    const result: string[] = []
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) { result.push(''); continue }
      // Decrease indent for closing tags
      if (/^<\//.test(trimmed) && indent > 0) indent--
      result.push('  '.repeat(indent) + trimmed)
      // Increase indent for opening tags (not self-closing, not closing)
      if (/^<[a-zA-Z][^>]*[^\/]>$/.test(trimmed) && !/^<(br|hr|img|input|meta|link)/i.test(trimmed)) {
        indent++
      }
      // Self-closing on same line with content — don't change indent
      if (/<\/[^>]+>$/.test(trimmed) && /^<[^\/]/.test(trimmed)) {
        // Opening + closing on same line — no indent change, undo the increment
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
    // Convert prettified back to single-line for rendering
    const raw = src.replace(/\n\s*/g, '')
    setHtmlMode(false)
    onChangeRef.current(raw)
    latest.current = raw
  }

  const insImg = () => { const i = document.createElement('input'); i.type='file'; i.accept='image/*'
    i.onchange = e => { const f=(e.target as HTMLInputElement).files?.[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>exec('insertHTML',`<img src="${ev.target?.result}" alt="" style="max-width:100%;border-radius:12px;margin:8px 0;" />`); r.readAsDataURL(f) }; i.click() }
  const insLink = () => { if(!lu)return; exec('insertHTML',`<a href="${lu}" target="_blank" style="color:#14b8a6;text-decoration:underline;">${lxt||lu}</a>`); setLinkModal(false); setLu(''); setLxt('') }
  const insCols = (n:number) => { const c=Array.from({length:n},()=>`<div style="flex:1;padding:16px;border:2px dashed #d4d4d8;border-radius:12px;min-height:80px;"><p style="color:#999;">Column content</p></div>`).join(''); exec('insertHTML',`<div style="display:flex;gap:16px;margin:16px 0;">${c}</div>`); setDd(null) }
  const insBtn = () => { exec('insertHTML',`<a href="#" style="display:inline-block;padding:14px 32px;border-radius:14px;background:#14b8a6;color:white;font-weight:600;text-decoration:none;margin:8px 4px;">Button</a>`); setDd(null) }
  const insCard = () => { exec('insertHTML',`<div style="background:white;border:1px solid #e4e4e7;border-radius:16px;padding:24px;margin:12px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);"><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">Card Title</h3><p style="color:#52525b;font-size:14px;">Card description.</p></div>`); setDd(null) }
  const insVideo = () => { exec('insertHTML',`<div style="position:relative;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:20px;padding:60px;text-align:center;color:white;margin:12px 0;cursor:pointer;"><div style="width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;box-shadow:0 4px 20px rgba(0,0,0,0.2);"><span style="font-size:28px;color:#18181b;margin-left:4px;">▶</span></div><p style="font-size:14px;opacity:0.9;">Click to play video</p></div>`); setDd(null) }
  const insSpacer = () => { exec('insertHTML',`<div style="height:48px;"></div>`); setDd(null) }
  const insDivider = () => { exec('insertHTML',`<hr style="border:0;border-top:2px solid #e4e4e7;margin:24px 0;" />`); setDd(null) }
  const insTestimonial = () => { exec('insertHTML',`<div style="background:#fafafa;border-radius:16px;padding:24px;margin:12px 0;"><p style="font-style:italic;color:#52525b;font-size:15px;margin-bottom:12px;">"Amazing experience! Highly recommended."</p><div style="display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#14b8a6,#0d9488);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">A</div><div><p style="font-weight:600;font-size:14px;color:#18181b;">Anna Smith</p><p style="font-size:12px;color:#71717a;">Client</p></div></div></div>`); setDd(null) }
  const insPricing = () => { exec('insertHTML',`<div style="border:2px solid #14b8a6;border-radius:20px;padding:32px;text-align:center;margin:12px 0;max-width:300px;"><div style="background:#14b8a6;color:white;padding:4px 16px;border-radius:20px;display:inline-block;font-size:12px;font-weight:600;margin-bottom:16px;">POPULAR</div><h3 style="font-size:24px;font-weight:800;color:#18181b;margin-bottom:4px;">Pro Plan</h3><div style="margin:16px 0;"><span style="font-size:48px;font-weight:800;color:#18181b;">$49</span><span style="color:#71717a;font-size:14px;">/month</span></div><ul style="list-style:none;padding:0;margin:0 0 24px;text-align:left;"><li style="padding:8px 0;font-size:14px;color:#52525b;border-bottom:1px solid #f4f4f5;">✅ Feature one</li><li style="padding:8px 0;font-size:14px;color:#52525b;border-bottom:1px solid #f4f4f5;">✅ Feature two</li><li style="padding:8px 0;font-size:14px;color:#52525b;">✅ Feature three</li></ul><a href="#" style="display:block;padding:14px;border-radius:14px;background:#14b8a6;color:white;font-weight:600;text-decoration:none;">Get started</a></div>`); setDd(null) }
  const insCounter = () => { exec('insertHTML',`<div style="display:flex;gap:24px;justify-content:center;margin:24px 0;"><div style="text-align:center;"><p style="font-size:42px;font-weight:800;color:#14b8a6;">1000+</p><p style="font-size:14px;color:#52525b;">Clients</p></div><div style="text-align:center;"><p style="font-size:42px;font-weight:800;color:#14b8a6;">17+</p><p style="font-size:14px;color:#52525b;">Years</p></div><div style="text-align:center;"><p style="font-size:42px;font-weight:800;color:#14b8a6;">5×</p><p style="font-size:14px;color:#52525b;">Champion</p></div></div>`); setDd(null) }
  const insGallery = () => { exec('insertHTML',`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0;"><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#999;font-size:24px;">📷</div><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#999;font-size:24px;">📷</div><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#999;font-size:24px;">📷</div></div>`); setDd(null) }

  /* ── Toolbar buttons use onMouseDown to prevent focus loss ── */
  const TBtn = ({icon:I,onAction,title,active:a}:{icon:any;onAction:()=>void;title?:string;active?:boolean}) => (
    <button onMouseDown={e=>{e.preventDefault();onAction()}} title={title} className={`p-1.5 rounded-lg transition-colors ${a?'bg-teal-100 dark:bg-teal-900 text-teal-600':'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}><I className="w-4 h-4" /></button>)
  const DD = ({name,label,icon:I,children}:{name:string;label:string;icon?:any;children:React.ReactNode}) => (
    <div className="relative" data-dd>
      <button onMouseDown={e=>{e.preventDefault();saveSelection();setDd(dd===name?null:name)}} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700">
        {I&&<I className="w-3.5 h-3.5" />}{label}<ChevronDown className="w-3 h-3" /></button>
      {dd===name&&<div className="absolute top-full left-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-40 py-1">{children}</div>}
    </div>)
  const Sep = () => <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-600 mx-0.5" />
  const IBtn = ({icon:I,label:lb,onAction}:{icon:any;label:string;onAction:()=>void}) => (
    <button onMouseDown={e=>{e.preventDefault();onAction()}} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-300 transition-all">
      <I className="w-3.5 h-3.5" />{lb}</button>)

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900">
      {/* Row 1: Format */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
        <TBtn icon={Undo2} onAction={()=>exec('undo')} title="Undo" />
        <TBtn icon={Redo2} onAction={()=>exec('redo')} title="Redo" />
        <Sep />
        <TBtn icon={Bold} onAction={()=>exec('bold')} title="Bold" />
        <TBtn icon={Italic} onAction={()=>exec('italic')} title="Italic" />
        <TBtn icon={Underline} onAction={()=>exec('underline')} title="Underline" />
        <TBtn icon={Strikethrough} onAction={()=>exec('strikethrough')} title="Strike" />
        <Sep />
        <TBtn icon={Heading1} onAction={()=>exec('formatBlock','h1')} title="H1" />
        <TBtn icon={Heading2} onAction={()=>exec('formatBlock','h2')} title="H2" />
        <TBtn icon={Heading3} onAction={()=>exec('formatBlock','h3')} title="H3" />
        <TBtn icon={Type} onAction={()=>exec('formatBlock','p')} title="P" />
        <TBtn icon={Quote} onAction={()=>exec('formatBlock','blockquote')} title="Quote" />
        <Sep />
        <TBtn icon={AlignLeft} onAction={()=>exec('justifyLeft')} />
        <TBtn icon={AlignCenter} onAction={()=>exec('justifyCenter')} />
        <TBtn icon={AlignRight} onAction={()=>exec('justifyRight')} />
        <Sep />
        <TBtn icon={List} onAction={()=>exec('insertUnorderedList')} />
        <TBtn icon={ListOrdered} onAction={()=>exec('insertOrderedList')} />
      </div>
      {/* Row 2: Styles */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50">
        <DD name="font" label={lang==='ru'?'Шрифт':'Font'} icon={Type}>
          <div className="min-w-[170px]">{FONTS.map(f=>(<button key={f.v} onMouseDown={e=>{e.preventDefault();exec('fontName',f.v);setDd(null)}} className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700" style={{fontFamily:f.v}}>{f.l}</button>))}</div>
        </DD>
        <DD name="size" label={lang==='ru'?'Размер':'Size'}>
          <div className="min-w-[90px] max-h-48 overflow-y-auto">{SIZES.map(s=>(<button key={s} onMouseDown={e=>{e.preventDefault();exec('fontSize','7');setTimeout(()=>{ref.current?.querySelectorAll('font[size="7"]').forEach(el=>{(el as HTMLElement).removeAttribute('size');(el as HTMLElement).style.fontSize=s});sync()},10);setDd(null)}} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700">{s}</button>))}</div>
        </DD>
        <DD name="color" label={lang==='ru'?'Цвет':'Color'} icon={Palette}>
          <div className="p-3 w-[260px]"><p className="text-xs text-zinc-500 mb-2">{lang==='ru'?'Цвет текста':'Text color'}</p>
            <div className="grid grid-cols-8 gap-1">{PAL.map(c=>(<button key={c} onMouseDown={e=>{e.preventDefault();exec('foreColor',c);setDd(null)}} className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-600 hover:scale-110 transition-transform" style={{backgroundColor:c}} />))}</div>
            <input type="color" className="w-full h-8 mt-2 rounded cursor-pointer" onInput={e=>{exec('foreColor',(e.target as HTMLInputElement).value)}} /></div>
        </DD>
        <DD name="bg" label={lang==='ru'?'Фон':'BG'}>
          <div className="p-3 w-[260px]"><p className="text-xs text-zinc-500 mb-2">{lang==='ru'?'Фон текста':'Background'}</p>
            <div className="grid grid-cols-8 gap-1">{PAL.map(c=>(<button key={c} onMouseDown={e=>{e.preventDefault();exec('hiliteColor',c);setDd(null)}} className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-600 hover:scale-110 transition-transform" style={{backgroundColor:c}} />))}</div>
            <input type="color" className="w-full h-8 mt-2 rounded cursor-pointer" onInput={e=>{exec('hiliteColor',(e.target as HTMLInputElement).value)}} /></div>
        </DD>
        <Sep />
        <TBtn icon={Link2} onAction={()=>{saveSelection();setLinkModal(true)}} title="Link" />
        <TBtn icon={Image} onAction={insImg} title="Image" />
        <div className="flex-1" />
        <button onClick={htmlMode?toVis:toHtml} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${htmlMode?'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300':'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'}`}>
          {htmlMode?<><Eye className="w-3.5 h-3.5" />{lang==='ru'?'Визуально':'Visual'}</>:<><Code2 className="w-3.5 h-3.5" />HTML</>}</button>
      </div>
      {/* Row 3: Elements (Elementor-style) */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-700 bg-gradient-to-r from-teal-50/30 to-indigo-50/30 dark:from-teal-900/5 dark:to-indigo-900/5">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mr-1">{lang==='ru'?'Элементы':'Elements'}</span>
        <IBtn icon={Columns2} label="2col" onAction={()=>insCols(2)} />
        <IBtn icon={Columns3} label="3col" onAction={()=>insCols(3)} />
        <IBtn icon={LayoutGrid} label="4col" onAction={()=>insCols(4)} />
        <Sep />
        <IBtn icon={Square} label={lang==='ru'?'Кнопка':'Button'} onAction={insBtn} />
        <IBtn icon={PanelTop} label={lang==='ru'?'Карточка':'Card'} onAction={insCard} />
        <IBtn icon={Play} label={lang==='ru'?'Видео':'Video'} onAction={insVideo} />
        <IBtn icon={ImagePlus} label={lang==='ru'?'Фото':'Photo'} onAction={insImg} />
        <IBtn icon={MessageSquare} label={lang==='ru'?'Отзыв':'Review'} onAction={insTestimonial} />
        <IBtn icon={DollarSign} label={lang==='ru'?'Цена':'Pricing'} onAction={insPricing} />
        <IBtn icon={Hash} label={lang==='ru'?'Счётчик':'Counter'} onAction={insCounter} />
        <IBtn icon={Camera} label={lang==='ru'?'Галерея':'Gallery'} onAction={insGallery} />
        <IBtn icon={Rows3} label={lang==='ru'?'Отступ':'Spacer'} onAction={insSpacer} />
        <IBtn icon={Minus} label={lang==='ru'?'Линия':'Divider'} onAction={insDivider} />
      </div>
      {/* Content */}
      {htmlMode ? (
        <textarea className="w-full p-4 text-sm font-mono leading-relaxed bg-zinc-950 text-green-400 focus:outline-none resize-y whitespace-pre" style={{minHeight:minH,tabSize:2}} value={src}
          onChange={e=>{const v=e.target.value; setSrc(v); const raw=v.replace(/\n\s*/g,''); latest.current=raw; onChangeRef.current(raw)}} />
      ) : (
        <div className="relative">
          <div ref={ref} contentEditable suppressContentEditableWarning className="p-4 focus:outline-none" style={{minHeight:minH}}
            onInput={sync} onBlur={()=>{saveSelection();sync()}} onMouseUp={e=>{saveSelection();pickElement(e)}} onKeyUp={saveSelection} />
          {!pickedEl && <div className="absolute bottom-2 right-3 text-[10px] text-zinc-400/60 pointer-events-none select-none">
            Alt+{lang==='ru'?'клик — стили элемента':'click — element styles'}
          </div>}
        </div>
      )}
      {/* ── Element Inspector Panel ── */}
      {pickedEl && !htmlMode && (
        <div className="border-t border-teal-200 dark:border-teal-800 bg-gradient-to-r from-teal-50/50 to-zinc-50 dark:from-teal-950/20 dark:to-zinc-900">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{lang==='ru'?'Элемент':'Element'}</span>
            <code className="text-[10px] text-zinc-500 bg-zinc-200/80 dark:bg-zinc-700 px-1.5 py-0.5 rounded">&lt;{pickedEl.tagName.toLowerCase()}&gt;</code>
            <div className="flex-1" />
            <div className="flex gap-0.5 bg-zinc-200/80 dark:bg-zinc-700 rounded-lg p-0.5">
              {(['style','size','border','extra'] as const).map(t=>(
                <button key={t} onClick={()=>setInspTab(t)} className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${inspTab===t?'bg-white dark:bg-zinc-600 shadow text-zinc-900 dark:text-zinc-100':'text-zinc-500 hover:text-zinc-700'}`}>
                  {t==='style'?(lang==='ru'?'Стиль':'Style'):t==='size'?(lang==='ru'?'Размер':'Size'):t==='border'?(lang==='ru'?'Рамка':'Border'):(lang==='ru'?'Ещё':'Extra')}
                </button>
              ))}
            </div>
            <button onClick={unpickEl} className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="px-3 py-2.5">
            {inspTab==='style' && (
              <div className="flex flex-wrap gap-x-4 gap-y-2 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang==='ru'?'Фон':'BG'}</label>
                  <div className="flex gap-1 items-center">
                    <input type="color" value={(elStyle.background||'').startsWith('#')?elStyle.background:'#ffffff'} onChange={e=>applyElStyle('background',e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-zinc-200" />
                    <input className="w-32 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.background||''} onChange={e=>applyElStyle('background',e.target.value)} placeholder="color / gradient" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang==='ru'?'Текст':'Color'}</label>
                  <div className="flex gap-1 items-center">
                    <input type="color" value={(elStyle.color||'').startsWith('#')?elStyle.color:'#000000'} onChange={e=>applyElStyle('color',e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-zinc-200" />
                    <input className="w-20 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.color||''} onChange={e=>applyElStyle('color',e.target.value)} placeholder="#000" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang==='ru'?'Шрифт':'Font'}</label>
                  <input className="w-16 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.fontSize||''} onChange={e=>applyElStyle('fontSize',e.target.value)} placeholder="16px" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang==='ru'?'Жирн.':'Wt'}</label>
                  <select className="px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-[26px]" value={elStyle.fontWeight||''} onChange={e=>applyElStyle('fontWeight',e.target.value)}>
                    <option value="">—</option><option value="400">400</option><option value="500">500</option><option value="600">600</option><option value="700">700</option><option value="800">800</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang==='ru'?'Выравн.':'Align'}</label>
                  <select className="px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-[26px]" value={elStyle.textAlign||''} onChange={e=>applyElStyle('textAlign',e.target.value)}>
                    <option value="">—</option><option value="left">←</option><option value="center">↔</option><option value="right">→</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang==='ru'?'Прозр.':'α'}</label>
                  <input className="w-12 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.opacity||''} onChange={e=>applyElStyle('opacity',e.target.value)} placeholder="1" />
                </div>
              </div>
            )}
            {inspTab==='size' && (
              <div className="flex flex-wrap gap-x-5 gap-y-2 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">Padding ↑ → ↓ ←</label>
                  <div className="flex gap-1">
                    <input className="w-[52px] px-1.5 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg text-center" value={elStyle.paddingTop||''} onChange={e=>applyElStyle('paddingTop',e.target.value)} placeholder="↑" />
                    <input className="w-[52px] px-1.5 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg text-center" value={elStyle.paddingRight||''} onChange={e=>applyElStyle('paddingRight',e.target.value)} placeholder="→" />
                    <input className="w-[52px] px-1.5 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg text-center" value={elStyle.paddingBottom||''} onChange={e=>applyElStyle('paddingBottom',e.target.value)} placeholder="↓" />
                    <input className="w-[52px] px-1.5 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg text-center" value={elStyle.paddingLeft||''} onChange={e=>applyElStyle('paddingLeft',e.target.value)} placeholder="←" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">Margin ↑ → ↓ ←</label>
                  <div className="flex gap-1">
                    <input className="w-[52px] px-1.5 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg text-center" value={elStyle.marginTop||''} onChange={e=>applyElStyle('marginTop',e.target.value)} placeholder="↑" />
                    <input className="w-[52px] px-1.5 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg text-center" value={elStyle.marginRight||''} onChange={e=>applyElStyle('marginRight',e.target.value)} placeholder="→" />
                    <input className="w-[52px] px-1.5 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg text-center" value={elStyle.marginBottom||''} onChange={e=>applyElStyle('marginBottom',e.target.value)} placeholder="↓" />
                    <input className="w-[52px] px-1.5 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg text-center" value={elStyle.marginLeft||''} onChange={e=>applyElStyle('marginLeft',e.target.value)} placeholder="←" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang==='ru'?'Шир.':'W'}</label>
                  <input className="w-[68px] px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.width||''} onChange={e=>applyElStyle('width',e.target.value)} placeholder="auto" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang==='ru'?'Выс.':'H'}</label>
                  <input className="w-[68px] px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.height||''} onChange={e=>applyElStyle('height',e.target.value)} placeholder="auto" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">Gap</label>
                  <input className="w-14 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.gap||''} onChange={e=>applyElStyle('gap',e.target.value)} placeholder="16px" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">Display</label>
                  <select className="px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-[26px]" value={elStyle.display||''} onChange={e=>applyElStyle('display',e.target.value)}>
                    <option value="">—</option><option value="block">block</option><option value="flex">flex</option><option value="grid">grid</option><option value="inline-block">i-block</option><option value="none">none</option>
                  </select>
                </div>
              </div>
            )}
            {inspTab==='border' && (
              <div className="flex flex-wrap gap-x-4 gap-y-2 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang==='ru'?'Скругл.':'Radius'}</label>
                  <input className="w-[68px] px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.borderRadius||''} onChange={e=>applyElStyle('borderRadius',e.target.value)} placeholder="12px" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang==='ru'?'Толщ.':'Bdr W'}</label>
                  <input className="w-14 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.borderWidth||''} onChange={e=>applyElStyle('borderWidth',e.target.value)} placeholder="1px" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang==='ru'?'Стиль':'Bdr S'}</label>
                  <select className="px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-[26px]" value={elStyle.borderStyle||''} onChange={e=>applyElStyle('borderStyle',e.target.value)}>
                    <option value="">—</option><option value="solid">solid</option><option value="dashed">dashed</option><option value="dotted">dotted</option><option value="none">none</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang==='ru'?'Цвет рамки':'Bdr Color'}</label>
                  <div className="flex gap-1 items-center">
                    <input type="color" value={(elStyle.borderColor||'').startsWith('#')?elStyle.borderColor:'#e4e4e7'} onChange={e=>applyElStyle('borderColor',e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-zinc-200" />
                    <input className="w-20 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={elStyle.borderColor||''} onChange={e=>applyElStyle('borderColor',e.target.value)} placeholder="#e4e4e7" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">{lang==='ru'?'Тень':'Shadow'}</label>
                  <select className="px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-[26px] w-24" value={elStyle.boxShadow||''} onChange={e=>applyElStyle('boxShadow',e.target.value)}>
                    <option value="">{lang==='ru'?'Нет':'None'}</option>
                    <option value="0 1px 3px rgba(0,0,0,0.1)">{lang==='ru'?'Мягкая':'Soft'}</option>
                    <option value="0 4px 12px rgba(0,0,0,0.1)">{lang==='ru'?'Средняя':'Med'}</option>
                    <option value="0 8px 30px rgba(0,0,0,0.15)">{lang==='ru'?'Сильная':'Strong'}</option>
                    <option value="0 20px 60px rgba(0,0,0,0.2)">{lang==='ru'?'Глубокая':'Deep'}</option>
                  </select>
                </div>
              </div>
            )}
            {inspTab==='extra' && (
              <div className="space-y-2.5">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-zinc-500 mr-1">{lang==='ru'?'Градиенты':'Gradients'}:</span>
                  {GRADIENTS.map(g=>(<button key={g} onClick={()=>applyElStyle('background',g)} className="w-7 h-7 rounded-lg border border-zinc-200 hover:scale-110 transition-transform" style={{background:g}} />))}
                  <button onClick={()=>applyElStyle('background','')} className="text-[10px] text-zinc-400 hover:text-red-500 ml-1">✕</button>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <button onClick={()=>{if(pickedEl){pickedEl.removeAttribute('style');pickedEl.style.outline='2px dashed #14b8a6';readElStyle(pickedEl);sync()}}} className="px-2.5 py-1 text-[10px] bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                    {lang==='ru'?'Сбросить стили':'Reset styles'}
                  </button>
                  <button onClick={()=>{if(pickedEl){const el=pickedEl;unpickEl();el.remove();sync()}}} className="px-2.5 py-1 text-[10px] bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                    {lang==='ru'?'Удалить':'Delete'}
                  </button>
                </div>
                {pickedEl.tagName==='A' && (
                  <div className="flex gap-2 items-end">
                    <div className="space-y-0.5"><label className="text-[10px] text-zinc-500">href</label>
                      <input className="w-48 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={pickedEl.getAttribute('href')||''} onChange={e=>{pickedEl.setAttribute('href',e.target.value);sync()}} /></div>
                    <div className="space-y-0.5"><label className="text-[10px] text-zinc-500">target</label>
                      <select className="px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-[26px]" value={pickedEl.getAttribute('target')||''} onChange={e=>{pickedEl.setAttribute('target',e.target.value);sync()}}><option value="">—</option><option value="_blank">_blank</option><option value="_self">_self</option></select></div>
                  </div>
                )}
                {pickedEl.tagName==='IMG' && (
                  <div className="flex gap-2 items-end">
                    <div className="space-y-0.5"><label className="text-[10px] text-zinc-500">src</label>
                      <input className="w-56 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={pickedEl.getAttribute('src')||''} onChange={e=>{pickedEl.setAttribute('src',e.target.value);sync()}} /></div>
                    <div className="space-y-0.5"><label className="text-[10px] text-zinc-500">alt</label>
                      <input className="w-28 px-2 py-1 text-[11px] border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg" value={pickedEl.getAttribute('alt')||''} onChange={e=>{pickedEl.setAttribute('alt',e.target.value);sync()}} /></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Link modal */}
      {linkModal&&(<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={()=>setLinkModal(false)}>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-96 shadow-2xl" onClick={e=>e.stopPropagation()}>
          <h3 className="font-semibold mb-4 text-zinc-900 dark:text-zinc-100">{lang==='ru'?'Вставить ссылку':'Insert Link'}</h3>
          <Input placeholder="https://..." className="mb-3" value={lu} onChange={e=>setLu(e.target.value)} />
          <Input placeholder={lang==='ru'?'Текст':'Text'} className="mb-4" value={lxt} onChange={e=>setLxt(e.target.value)} />
          <div className="flex gap-2 justify-end"><Button variant="ghost" onClick={()=>setLinkModal(false)}>{lang==='ru'?'Отмена':'Cancel'}</Button>
          <Button variant="gradient" onClick={insLink}>{lang==='ru'?'Вставить':'Insert'}</Button></div></div></div>)}
    </div>
  )
}

/* ═══════════ SECTION STYLE PANEL (Elementor-like) ═══════════ */
function StylePanel({ style, onChange, onCommit, lang }: { style: SectionStyle; onChange: (s: SectionStyle) => void; onCommit: (s: SectionStyle) => void; lang: 'en'|'ru' }) {
  const [tab, setTab] = useState<'bg'|'spacing'|'border'|'css'>('bg')
  const localRef = useRef(style)
  localRef.current = style
  const u = (k: keyof SectionStyle, v: string) => { const next = { ...localRef.current, [k]: v }; localRef.current = next; onChange(next) }
  const commit = () => onCommit(localRef.current)

  return (
    <Card><CardContent className="p-3 space-y-3" onBlur={commit}>
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{lang==='ru'?'Настройки секции':'Section Settings'}</p>
      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
        {(['bg','spacing','border','css'] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${tab===t?'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-zinc-100':'text-zinc-500'}`}>
            {t==='bg'?(lang==='ru'?'Фон':'BG'):t==='spacing'?(lang==='ru'?'Отступы':'Spacing'):t==='border'?(lang==='ru'?'Рамка':'Border'):'CSS'}
          </button>
        ))}
      </div>

      {tab==='bg' && (<div className="space-y-3">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">{lang==='ru'?'Цвет фона':'Background color'}</label>
          <div className="flex items-center gap-2">
            <input type="color" value={style.bgColor||'#ffffff'} onChange={e=>{u('bgColor',e.target.value);commit()}} className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-200" />
            <Input value={style.bgColor||''} onChange={e=>u('bgColor',e.target.value)} placeholder="#ffffff" className="flex-1 text-xs h-10" />
            <button onClick={()=>{u('bgColor','');setTimeout(commit,0)}} className="text-xs text-zinc-400 hover:text-red-500">✕</button>
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-2 block">{lang==='ru'?'Градиент':'Gradient'}</label>
          <div className="grid grid-cols-5 gap-1.5">
            {GRADIENTS.map(g=>(<button key={g} onClick={()=>{u('bgGradient',g);setTimeout(commit,0)}} className={`h-8 rounded-lg border-2 transition-all ${style.bgGradient===g?'border-teal-500 scale-105':'border-zinc-200 dark:border-zinc-700'}`} style={{background:g}} />))}
          </div>
          {style.bgGradient && <button onClick={()=>{u('bgGradient','');setTimeout(commit,0)}} className="text-xs text-zinc-400 hover:text-red-500 mt-1">✕ {lang==='ru'?'Убрать градиент':'Clear gradient'}</button>}
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">{lang==='ru'?'Фоновое изображение':'Background image URL'}</label>
          <Input value={style.bgImage||''} onChange={e=>u('bgImage',e.target.value)} placeholder="https://..." className="text-xs h-9" />
        </div>
      </div>)}

      {tab==='spacing' && (<div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-500 mb-1 block">{lang==='ru'?'Верх':'Top'} (px)</label><Input type="number" value={style.paddingTop||''} onChange={e=>u('paddingTop',e.target.value)} className="text-xs h-9" placeholder="60" /></div>
          <div><label className="text-xs text-zinc-500 mb-1 block">{lang==='ru'?'Низ':'Bottom'} (px)</label><Input type="number" value={style.paddingBottom||''} onChange={e=>u('paddingBottom',e.target.value)} className="text-xs h-9" placeholder="60" /></div>
          <div><label className="text-xs text-zinc-500 mb-1 block">{lang==='ru'?'Лево':'Left'} (px)</label><Input type="number" value={style.paddingLeft||''} onChange={e=>u('paddingLeft',e.target.value)} className="text-xs h-9" placeholder="20" /></div>
          <div><label className="text-xs text-zinc-500 mb-1 block">{lang==='ru'?'Право':'Right'} (px)</label><Input type="number" value={style.paddingRight||''} onChange={e=>u('paddingRight',e.target.value)} className="text-xs h-9" placeholder="20" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-500 mb-1 block">{lang==='ru'?'Отступ сверху':'Margin top'} (px)</label><Input type="number" value={style.marginTop||''} onChange={e=>u('marginTop',e.target.value)} className="text-xs h-9" placeholder="0" /></div>
          <div><label className="text-xs text-zinc-500 mb-1 block">{lang==='ru'?'Отступ снизу':'Margin bottom'} (px)</label><Input type="number" value={style.marginBottom||''} onChange={e=>u('marginBottom',e.target.value)} className="text-xs h-9" placeholder="0" /></div>
        </div>
        <div><label className="text-xs text-zinc-500 mb-1 block">{lang==='ru'?'Макс. ширина':'Max width'}</label><Input value={style.maxWidth||''} onChange={e=>u('maxWidth',e.target.value)} className="text-xs h-9" placeholder="1200px" /></div>
      </div>)}

      {tab==='border' && (<div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-500 mb-1 block">{lang==='ru'?'Скругление':'Radius'} (px)</label><Input type="number" value={style.borderRadius||''} onChange={e=>u('borderRadius',e.target.value)} className="text-xs h-9" placeholder="0" /></div>
          <div><label className="text-xs text-zinc-500 mb-1 block">{lang==='ru'?'Толщина':'Width'} (px)</label><Input type="number" value={style.borderWidth||''} onChange={e=>u('borderWidth',e.target.value)} className="text-xs h-9" placeholder="0" /></div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500">{lang==='ru'?'Цвет рамки':'Border color'}</label>
          <input type="color" value={style.borderColor||'#e4e4e7'} onChange={e=>{u('borderColor',e.target.value);commit()}} className="w-8 h-8 rounded cursor-pointer" />
          <Input value={style.borderColor||''} onChange={e=>u('borderColor',e.target.value)} className="flex-1 text-xs h-9" />
        </div>
        <div><label className="text-xs text-zinc-500 mb-1 block">{lang==='ru'?'Тень':'Shadow'}</label>
          <select value={style.boxShadow||''} onChange={e=>{u('boxShadow',e.target.value);setTimeout(commit,0)}} className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-xs">
            <option value="">{lang==='ru'?'Нет':'None'}</option>
            <option value="0 1px 3px rgba(0,0,0,0.1)">{lang==='ru'?'Мягкая':'Soft'}</option>
            <option value="0 4px 12px rgba(0,0,0,0.1)">{lang==='ru'?'Средняя':'Medium'}</option>
            <option value="0 8px 30px rgba(0,0,0,0.15)">{lang==='ru'?'Сильная':'Strong'}</option>
            <option value="0 20px 60px rgba(0,0,0,0.2)">{lang==='ru'?'Глубокая':'Deep'}</option>
          </select>
        </div>
      </div>)}

      {tab==='css' && (<div className="space-y-3">
        <div><label className="text-xs text-zinc-500 mb-1 block">{lang==='ru'?'CSS класс':'CSS class'}</label><Input value={style.cssClass||''} onChange={e=>u('cssClass',e.target.value)} className="text-xs h-9" placeholder="my-section" /></div>
        <div><label className="text-xs text-zinc-500 mb-1 block">{lang==='ru'?'ID (якорь)':'HTML ID (anchor)'}</label><Input value={style.htmlId||''} onChange={e=>u('htmlId',e.target.value)} className="text-xs h-9" placeholder="section-about" /></div>
        <div><label className="text-xs text-zinc-500 mb-1 block">{lang==='ru'?'Кастомный CSS':'Custom CSS'}</label>
          <textarea value={style.customCss||''} onChange={e=>u('customCss',e.target.value)} className="w-full p-2 text-xs font-mono border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-xl h-24 resize-y" placeholder=".my-section { opacity: 0.9; }" /></div>
      </div>)}
    </CardContent></Card>
  )
}

/* ═══════════ TYPES ═══════════ */
interface SectionStyle { bgColor?:string; bgGradient?:string; bgImage?:string; paddingTop?:string; paddingBottom?:string; paddingLeft?:string; paddingRight?:string; marginTop?:string; marginBottom?:string; maxWidth?:string; borderRadius?:string; borderWidth?:string; borderColor?:string; boxShadow?:string; cssClass?:string; htmlId?:string; customCss?:string }
type BT = 'header'|'hero'|'programs'|'courses'|'about'|'results'|'footer'|'custom'
interface PB { id:string; type:BT; label:string; labelRu:string; visible:boolean; contentEn:string; contentRu:string; style:SectionStyle }
const BI: Record<BT,any> = { header:Globe, hero:Layout, programs:Target, courses:Video, about:Users, results:Trophy, footer:FileText, custom:Settings2 }

/* Block style → inline CSS string + attributes */
const styleToCSS = (s: SectionStyle): string => {
  const p: string[] = []
  if(s.bgGradient) p.push(`background:${s.bgGradient}`)
  else if(s.bgColor) p.push(`background-color:${s.bgColor}`)
  if(s.bgImage) p.push(`background-image:url(${s.bgImage});background-size:cover;background-position:center`)
  if(s.paddingTop) p.push(`padding-top:${s.paddingTop}px`)
  if(s.paddingBottom) p.push(`padding-bottom:${s.paddingBottom}px`)
  if(s.paddingLeft) p.push(`padding-left:${s.paddingLeft}px`)
  if(s.paddingRight) p.push(`padding-right:${s.paddingRight}px`)
  if(s.marginTop) p.push(`margin-top:${s.marginTop}px`)
  if(s.marginBottom) p.push(`margin-bottom:${s.marginBottom}px`)
  if(s.maxWidth) {
    p.push(`max-width:${s.maxWidth}`)
    if(!s.marginTop && !s.marginBottom) p.push('margin-left:auto;margin-right:auto')
    else p.push('margin-left:auto;margin-right:auto')
  }
  if(s.borderRadius) p.push(`border-radius:${s.borderRadius}px`)
  if(s.borderWidth&&s.borderColor) p.push(`border:${s.borderWidth}px solid ${s.borderColor}`)
  if(s.boxShadow) p.push(`box-shadow:${s.boxShadow}`)
  return p.join(';')
}
const styleAttrs = (s: SectionStyle): string => {
  let a = ''
  if(s.htmlId) a += ` id="${s.htmlId}"`
  if(s.cssClass) a += ` class="${s.cssClass}"`
  return a
}

/* Convert CSS string like "background-color:#fff;padding-top:60px" to React CSSProperties object */
const parseCSStoObj = (css: string): React.CSSProperties => {
  const obj: Record<string, string> = {}
  css.split(';').forEach(pair => {
    const [k, ...rest] = pair.split(':')
    if (!k?.trim() || rest.length === 0) return
    const key = k.trim()
    const val = rest.join(':').trim()
    // Convert kebab-case to camelCase
    const camel = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    obj[camel] = val
  })
  return obj as React.CSSProperties
}

/* ═══════════ BLOCK CONTENT DATA ═══════════ */
// NOTE: B_EN and B_RU contain the full HTML for each default section — programs has all 5, courses have video overlay, etc.
// Keeping the template strings from v13 — they haven't changed. Wrapping in a function to keep file readable.
function getDefaultContent(): { en: Record<string,string>; ru: Record<string,string> } {
const en: Record<string,string> = {
header:`<div style="padding:16px 24px;display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e4e4e7;"><div style="display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#2dd4bf,#0d9488);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:18px;">Q</div><span style="font-weight:600;font-size:16px;color:#18181b;">Qbody</span></div><div style="display:flex;gap:24px;font-size:14px;"><a href="#programs" style="color:#52525b;text-decoration:none;">Programs</a><a href="#courses" style="color:#52525b;text-decoration:none;">Courses</a><a href="#about" style="color:#52525b;text-decoration:none;">About</a><a href="#results" style="color:#52525b;text-decoration:none;">Results</a></div><div style="display:flex;gap:8px;"><a href="/auth/login" style="padding:8px 16px;border-radius:12px;border:1px solid #e4e4e7;font-size:14px;color:#18181b;text-decoration:none;">Log in</a><a href="/auth/register" style="padding:8px 16px;border-radius:12px;background:#14b8a6;color:white;font-size:14px;text-decoration:none;">Get started</a></div></div>`,
hero:`<div style="text-align:center;padding:60px 20px;background:linear-gradient(135deg,#0f766e 0%,#115e59 25%,#134e4a 50%,#18181b 100%);color:white;"><p style="color:#2dd4bf;font-weight:600;font-size:14px;margin-bottom:16px;">⭐ NASM CERTIFIED PERSONAL TRAINER</p><h1 style="font-size:48px;font-weight:800;margin-bottom:8px;">Transform Your Body</h1><h1 style="font-size:48px;font-weight:800;color:#2dd4bf;margin-bottom:24px;">Transform Your Life</h1><p style="color:#d4d4d8;font-size:18px;max-width:600px;margin:0 auto 32px;">17+ years of experience. 1000+ clients. Personalized programs and recovery courses for women of any fitness level.</p><div style="display:flex;gap:12px;justify-content:center;margin-bottom:24px;"><a href="/auth/register" style="padding:12px 32px;border-radius:16px;background:#14b8a6;color:white;font-weight:600;font-size:16px;text-decoration:none;">Start training</a><a href="#programs" style="padding:12px 32px;border-radius:16px;border:1px solid rgba(255,255,255,0.3);color:white;font-size:16px;text-decoration:none;">View programs →</a></div><p style="font-size:14px;color:#a1a1aa;">✓ Personal approach&nbsp;✓ Online &amp; in-person&nbsp;✓ Proven results</p></div>`,
programs:`<div style="padding:60px 20px;"><div style="text-align:center;margin-bottom:40px;"><p style="color:#14b8a6;font-weight:600;font-size:14px;margin-bottom:12px;">📱 Available in QbodyFit app</p><h2 style="font-size:36px;font-weight:800;color:#18181b;margin-bottom:8px;">Ready-made training programs</h2><p style="color:#52525b;font-size:16px;">Choose a program for your goal and start training today.</p></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:1100px;margin:0 auto;"><div style="background:white;border:2px solid #14b8a6;border-radius:16px;padding:24px;position:relative;"><div style="position:absolute;top:12px;right:12px;background:#14b8a6;color:white;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Popular</div><div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#ec4899,#f43f5e);display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:20px;">🎯</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">8 weeks: Lose Weight</h3><p style="color:#52525b;font-size:14px;margin-bottom:12px;">Comprehensive weight loss program with workouts and nutrition</p><p style="font-size:13px;color:#71717a;margin-bottom:16px;">⏱ 8 weeks · Any level</p><ul style="list-style:none;padding:0;margin:0 0 16px;"><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ 24 workouts</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Meal plan</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ In-app support</li></ul><div style="border-top:1px solid #e4e4e7;padding-top:16px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:24px;font-weight:700;color:#18181b;">$49</span><a href="/programs/weight-loss" style="padding:8px 16px;border-radius:12px;background:#14b8a6;color:white;font-size:13px;text-decoration:none;font-weight:600;">Details</a></div></div><div style="background:white;border:1px solid #e4e4e7;border-radius:16px;padding:24px;"><div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#3b82f6,#6366f1);display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:20px;">💪</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">8 weeks: Build Muscle</h3><p style="color:#52525b;font-size:14px;margin-bottom:12px;">Muscle building with progressive overload</p><p style="font-size:13px;color:#71717a;margin-bottom:16px;">⏱ 8 weeks · Intermediate</p><ul style="list-style:none;padding:0;margin:0 0 16px;"><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ 32 workouts</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Strength gains</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Weight progression</li></ul><div style="border-top:1px solid #e4e4e7;padding-top:16px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:24px;font-weight:700;color:#18181b;">$49</span><a href="/programs/muscle-gain" style="padding:8px 16px;border-radius:12px;border:1px solid #e4e4e7;color:#18181b;font-size:13px;text-decoration:none;">Details</a></div></div><div style="background:white;border:1px solid #e4e4e7;border-radius:16px;padding:24px;"><div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#22c55e,#10b981);display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:20px;">⭐</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">8 weeks: Beginner</h3><p style="color:#52525b;font-size:14px;margin-bottom:12px;">Perfect start for fitness beginners</p><p style="font-size:13px;color:#71717a;margin-bottom:16px;">⏱ 8 weeks · Beginner</p><ul style="list-style:none;padding:0;margin:0 0 16px;"><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Basic exercises</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Technique focus</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Gradual progression</li></ul><div style="border-top:1px solid #e4e4e7;padding-top:16px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:24px;font-weight:700;color:#18181b;">$39</span><a href="/programs/beginner" style="padding:8px 16px;border-radius:12px;border:1px solid #e4e4e7;color:#18181b;font-size:13px;text-decoration:none;">Details</a></div></div></div><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;max-width:730px;margin:20px auto 0;"><div style="background:white;border:1px solid #e4e4e7;border-radius:16px;padding:24px;"><div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#f97316,#eab308);display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:20px;">⚡</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">8 weeks: Endurance</h3><p style="color:#52525b;font-size:14px;margin-bottom:12px;">Develop endurance &amp; cardiovascular health</p><p style="font-size:13px;color:#71717a;margin-bottom:16px;">⏱ 8 weeks · Intermediate</p><ul style="list-style:none;padding:0;margin:0 0 16px;"><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Cardio + strength</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Interval training</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ All-day energy</li></ul><div style="border-top:1px solid #e4e4e7;padding-top:16px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:24px;font-weight:700;color:#18181b;">$49</span><a href="/programs/endurance" style="padding:8px 16px;border-radius:12px;border:1px solid #e4e4e7;color:#18181b;font-size:13px;text-decoration:none;">Details</a></div></div><div style="background:white;border:1px solid #e4e4e7;border-radius:16px;padding:24px;"><div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#14b8a6,#0d9488);display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:20px;">🏠</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">8 weeks: Home Fitness</h3><p style="color:#52525b;font-size:14px;margin-bottom:12px;">Effective home workouts, no equipment</p><p style="font-size:13px;color:#71717a;margin-bottom:16px;">⏱ 8 weeks · Any level</p><ul style="list-style:none;padding:0;margin:0 0 16px;"><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ No equipment</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ 30-40 min</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Home or travel</li></ul><div style="border-top:1px solid #e4e4e7;padding-top:16px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:24px;font-weight:700;color:#18181b;">$39</span><a href="/programs/home" style="padding:8px 16px;border-radius:12px;border:1px solid #e4e4e7;color:#18181b;font-size:13px;text-decoration:none;">Details</a></div></div></div></div>`,
courses:`<div style="padding:60px 20px;"><div style="text-align:center;margin-bottom:40px;"><p style="color:#14b8a6;font-weight:600;font-size:14px;margin-bottom:12px;">🎬 Video courses</p><h2 style="font-size:36px;font-weight:800;color:#18181b;margin-bottom:8px;">Specialized courses</h2><p style="color:#52525b;font-size:16px;">Recovery programs for women.</p></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:900px;margin:0 auto;"><div style="border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;"><div style="background:linear-gradient(135deg,#ec4899,#f43f5e);padding:40px;text-align:center;color:white;position:relative;"><div style="position:absolute;top:8px;left:8px;display:flex;gap:6px;"><span style="background:rgba(255,255,255,0.9);color:#18181b;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;">⏱ 6 weeks</span><span style="background:rgba(255,255,255,0.9);color:#18181b;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;">📖 18 lessons</span></div><div style="font-size:40px;margin-bottom:12px;">💗</div><h3 style="font-size:22px;font-weight:700;margin-bottom:8px;">Post-Mammoplasty Recovery</h3><p style="font-size:14px;opacity:0.9;">Safe recovery and active lifestyle</p><div style="position:absolute;inset:0;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s;" onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0'"><div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,0.2);"><span style="font-size:28px;color:#18181b;margin-left:4px;">▶</span></div></div></div><div style="padding:24px;"><ul style="list-style:none;padding:0;margin:0 0 16px;"><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Safe scar exercises</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Posture correction</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Return to training</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Expert guidance</li></ul><div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e4e4e7;padding-top:16px;"><div><span style="font-size:24px;font-weight:700;color:#18181b;">$99</span> <span style="font-size:14px;color:#a1a1aa;text-decoration:line-through;">$149</span></div><a href="/courses/mammoplasty" style="padding:10px 20px;border-radius:12px;background:#14b8a6;color:white;font-size:14px;text-decoration:none;font-weight:600;">Buy →</a></div></div></div><div style="border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;"><div style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);padding:40px;text-align:center;color:white;position:relative;"><div style="position:absolute;top:8px;left:8px;display:flex;gap:6px;"><span style="background:rgba(255,255,255,0.9);color:#18181b;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;">⏱ 8 weeks</span><span style="background:rgba(255,255,255,0.9);color:#18181b;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;">📖 24 lessons</span></div><div style="font-size:40px;margin-bottom:12px;">👶</div><h3 style="font-size:22px;font-weight:700;margin-bottom:8px;">Post C-Section Recovery</h3><p style="font-size:14px;opacity:0.9;">For new moms after surgery</p><div style="position:absolute;inset:0;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s;" onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0'"><div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,0.2);"><span style="font-size:28px;color:#18181b;margin-left:4px;">▶</span></div></div></div><div style="padding:24px;"><ul style="list-style:none;padding:0;margin:0 0 16px;"><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Core rehab</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Diastasis recovery</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Pelvic floor</li><li style="padding:3px 0;font-size:13px;color:#52525b;">✅ Safe return</li></ul><div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e4e4e7;padding-top:16px;"><div><span style="font-size:24px;font-weight:700;color:#18181b;">$99</span> <span style="font-size:14px;color:#a1a1aa;text-decoration:line-through;">$149</span></div><a href="/courses/csection" style="padding:10px 20px;border-radius:12px;background:#14b8a6;color:white;font-size:14px;text-decoration:none;font-weight:600;">Buy →</a></div></div></div></div></div>`,
about:`<div style="padding:60px 20px;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;max-width:1000px;margin:0 auto;"><div><img src="/images/hero-alexandra.jpg" alt="Coach" style="width:100%;border-radius:24px;aspect-ratio:4/5;object-fit:cover;" /></div><div><p style="color:#14b8a6;font-weight:600;font-size:14px;margin-bottom:12px;">ABOUT THE TRAINER</p><h2 style="font-size:36px;font-weight:800;color:#18181b;margin-bottom:4px;">Aleksandra Khavanskaia</h2><p style="font-size:18px;color:#14b8a6;font-weight:500;margin-bottom:24px;">Coach. Athlete. Mom.</p><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:12px;">🏆 Certifications</h3><ul style="list-style:none;padding:0;margin:0 0 24px;"><li style="padding:4px 0;color:#52525b;font-size:14px;">✅ Master's Physical Culture</li><li style="padding:4px 0;color:#52525b;font-size:14px;">✅ NASM CPT</li><li style="padding:4px 0;color:#52525b;font-size:14px;">✅ CES, PBC, CNSC</li><li style="padding:4px 0;color:#52525b;font-size:14px;">✅ Pre/Post-Natal Fitness</li><li style="padding:4px 0;color:#52525b;font-size:14px;">✅ Rehabilitation</li></ul><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:12px;">🏅 Career</h3><ul style="list-style:none;padding:0;margin:0 0 24px;"><li style="padding:4px 0;color:#52525b;font-size:14px;">🥈 Olympia &amp; Arnold Amateur</li><li style="padding:4px 0;color:#52525b;font-size:14px;">🏆 5× NPC Champion</li><li style="padding:4px 0;color:#52525b;font-size:14px;">🥇 NPC National Gold</li></ul><p style="font-size:14px;color:#52525b;">📍 Las Vegas · 👶 Mom of 2 · 💪 17+ years</p></div></div></div>`,
results:`<div style="padding:60px 20px;"><div style="text-align:center;margin-bottom:40px;"><p style="color:#14b8a6;font-weight:600;font-size:14px;margin-bottom:12px;">⭐ Real transformations</p><h2 style="font-size:36px;font-weight:800;color:#18181b;margin-bottom:8px;">Client Results</h2></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:1000px;margin:0 auto;"><div style="background:#fafafa;border-radius:16px;padding:24px;text-align:center;"><div style="font-size:40px;margin-bottom:12px;">📉</div><h3 style="font-size:20px;font-weight:700;color:#18181b;">Elena, 34</h3><p style="color:#14b8a6;font-weight:600;margin-bottom:8px;">-16 kg in 4 months</p><p style="color:#71717a;font-size:13px;font-style:italic;">"Changed my body &amp; outlook!"</p><div style="color:#eab308;margin-top:8px;">⭐⭐⭐⭐⭐</div></div><div style="background:#fafafa;border-radius:16px;padding:24px;text-align:center;"><div style="font-size:40px;margin-bottom:12px;">👶</div><h3 style="font-size:20px;font-weight:700;color:#18181b;">Maria, 29</h3><p style="color:#14b8a6;font-weight:600;margin-bottom:8px;">-14 kg in 6 months</p><p style="color:#71717a;font-size:13px;font-style:italic;">"Back in shape after C-section!"</p><div style="color:#eab308;margin-top:8px;">⭐⭐⭐⭐⭐</div></div><div style="background:#fafafa;border-radius:16px;padding:24px;text-align:center;"><div style="font-size:40px;margin-bottom:12px;">💪</div><h3 style="font-size:20px;font-weight:700;color:#18181b;">Anna, 41</h3><p style="color:#14b8a6;font-weight:600;margin-bottom:8px;">-18 kg in 5 months</p><p style="color:#71717a;font-size:13px;font-style:italic;">"Best shape at 40!"</p><div style="color:#eab308;margin-top:8px;">⭐⭐⭐⭐⭐</div></div></div><div style="text-align:center;margin-top:40px;"><a href="/auth/register" style="padding:14px 36px;border-radius:16px;background:linear-gradient(135deg,#14b8a6,#0d9488);color:white;font-weight:600;font-size:16px;text-decoration:none;">Start →</a></div></div>`,
footer:`<div style="padding:40px 20px;background:#18181b;color:#a1a1aa;text-align:center;"><div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:16px;"><div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#2dd4bf,#0d9488);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:18px;">Q</div><span style="font-weight:600;font-size:16px;color:white;">Qbody</span></div><p style="font-size:14px;margin-bottom:12px;">Personal Fitness Training &amp; Recovery</p><p style="font-size:14px;">📍 Las Vegas, NV · 📧 info@qbody.app</p><div style="margin-top:16px;padding-top:16px;border-top:1px solid #27272a;font-size:13px;">© 2025 Qbody. All rights reserved.</div></div>`,
}
// Russian versions via replacements
const ru: Record<string,string> = {}
ru.header = en.header.replace('Programs','Программы').replace('Courses','Курсы').replace('About','О тренере').replace('Results','Результаты').replace('Log in','Вход').replace('Get started','Начать')
ru.hero = en.hero.replace('NASM CERTIFIED PERSONAL TRAINER','СЕРТИФИЦИРОВАННЫЙ NASM ТРЕНЕР').replace('Transform Your Body','Преобрази тело').replace('Transform Your Life','Преобрази жизнь').replace(/17\+.*fitness level\./,'17+ лет опыта. 1000+ клиентов. Персональные программы для женщин.').replace('Start training','Начать').replace('View programs →','Программы →').replace('Personal approach','Инд. подход').replace('Online &amp; in-person','Онлайн и офлайн').replace('Proven results','Результаты')
ru.programs = en.programs.replace('Available in QbodyFit app','В приложении QbodyFit').replace('Ready-made training programs','Программы тренировок').replace('Choose a program for your goal and start training today.','Выберите программу.').replace('8 weeks: Lose Weight','8 нед: Похудение').replace('Comprehensive weight loss program with workouts and nutrition','Комплексная программа похудения').replace(/Any level/g,'Любой').replace('24 workouts','24 тренировки').replace('Meal plan','Питание').replace('In-app support','Поддержка').replace('8 weeks: Build Muscle','8 нед: Масса').replace('Muscle building with progressive overload','Набор мышечной массы').replace(/Intermediate/g,'Средний').replace('32 workouts','32 тренировки').replace('Strength gains','Рост силы').replace('Weight progression','Прогрессия').replace('8 weeks: Beginner','8 нед: Новичок').replace('Perfect start for fitness beginners','Для начинающих').replace(/Beginner/g,'Новичок').replace('Basic exercises','Базовые').replace('Technique focus','Техника').replace('Gradual progression','Постепенно').replace('8 weeks: Endurance','8 нед: Выносливость').replace('Develop endurance &amp; cardiovascular health','Кардио и выносливость').replace('Cardio + strength','Кардио+сила').replace('Interval training','Интервалы').replace('All-day energy','Энергия').replace('8 weeks: Home Fitness','8 нед: Дома').replace('Effective home workouts, no equipment','Тренировки дома').replace('No equipment','Без инвентаря').replace('30-40 min','30-40 мин').replace('Home or travel','Дома/в поездке').replace(/Details/g,'Подробнее').replace('Popular','Хит')
ru.courses = en.courses.replace('Video courses','Видеокурсы').replace('Specialized courses','Специализированные курсы').replace('Recovery programs for women.','Программы восстановления.').replace('Post-Mammoplasty Recovery','Восстановление после маммопластики').replace('Safe recovery and active lifestyle','Безопасное восстановление').replace('Safe scar exercises','Работа с рубцом').replace('Posture correction','Осанка').replace('Return to training','Возврат к тренировкам').replace('Expert guidance','Эксперт').replace('Post C-Section Recovery','После кесарева').replace('For new moms after surgery','Для мам после операции').replace('Core rehab','Реабилитация кора').replace('Diastasis recovery','Диастаз').replace('Pelvic floor','Тазовое дно').replace('Safe return','Безопасный возврат').replace(/Buy →/g,'Купить →')
ru.about = en.about.replace('ABOUT THE TRAINER','О ТРЕНЕРЕ').replace('Coach. Athlete. Mom.','Тренер. Спортсменка. Мама.').replace('Certifications','Сертификаты').replace("Master's Physical Culture",'Магистр физкультуры').replace('Pre/Post-Natal Fitness','Пре/постнатальный').replace('Rehabilitation','Реабилитация').replace('Career','Карьера').replace('Olympia &amp; Arnold Amateur','Олимпия и Арнольд').replace('5× NPC Champion','5× чемпион NPC').replace('NPC National Gold','Золото NPC').replace('Las Vegas','Лас-Вегас').replace('Mom of 2','Мама 2 детей').replace('17+ years','17+ лет')
ru.results = en.results.replace('Real transformations','Реальные результаты').replace('Client Results','Результаты клиентов').replace(/in (\d+) months/g,'за $1 мес').replace('Changed my body &amp; outlook!','Изменила тело и взгляд на жизнь!').replace('Back in shape after C-section!','Вернулась в форму после кесарева!').replace('Best shape at 40!','Лучшая форма в 40!').replace('Start →','Начать →')
ru.footer = en.footer.replace('Personal Fitness Training &amp; Recovery','Тренировки и восстановление').replace('All rights reserved','Все права защищены')
return { en, ru }
}

/* TEMPLATES for Add Block modal */
const TEMPLATES: {id:string;l:string;lr:string;icon:any;en:string;ru:string}[] = [
  {id:'blank',l:'Empty Section',lr:'Пустой раздел',icon:Square,en:`<div style="padding:60px 20px;text-align:center;"><h2 style="font-size:36px;font-weight:800;color:#18181b;">New Section</h2><p style="color:#52525b;">Your content here.</p></div>`,ru:`<div style="padding:60px 20px;text-align:center;"><h2 style="font-size:36px;font-weight:800;color:#18181b;">Новый раздел</h2><p style="color:#52525b;">Контент.</p></div>`},
  {id:'cta',l:'Call to Action',lr:'Призыв к действию',icon:Zap,en:`<div style="padding:60px 20px;text-align:center;background:linear-gradient(135deg,#14b8a6,#0d9488);color:white;border-radius:24px;margin:20px;"><h2 style="font-size:32px;font-weight:800;margin-bottom:12px;">Ready to start?</h2><p style="margin-bottom:24px;opacity:0.9;">Join 1000+ women</p><a href="/auth/register" style="display:inline-block;padding:14px 36px;background:white;color:#0d9488;border-radius:14px;font-weight:700;text-decoration:none;">Get started →</a></div>`,ru:`<div style="padding:60px 20px;text-align:center;background:linear-gradient(135deg,#14b8a6,#0d9488);color:white;border-radius:24px;margin:20px;"><h2 style="font-size:32px;font-weight:800;margin-bottom:12px;">Готовы начать?</h2><p style="margin-bottom:24px;opacity:0.9;">1000+ женщин уже с нами</p><a href="/auth/register" style="display:inline-block;padding:14px 36px;background:white;color:#0d9488;border-radius:14px;font-weight:700;text-decoration:none;">Начать →</a></div>`},
  {id:'features',l:'Features Grid',lr:'Преимущества',icon:LayoutGrid,en:`<div style="padding:60px 20px;"><h2 style="text-align:center;font-size:32px;font-weight:800;color:#18181b;margin-bottom:40px;">Why choose us</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:900px;margin:0 auto;"><div style="text-align:center;padding:24px;"><div style="font-size:36px;margin-bottom:12px;">🎯</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">Personal approach</h3><p style="font-size:14px;color:#52525b;">Tailored to your goals</p></div><div style="text-align:center;padding:24px;"><div style="font-size:36px;margin-bottom:12px;">📱</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">Mobile app</h3><p style="font-size:14px;color:#52525b;">Train anywhere</p></div><div style="text-align:center;padding:24px;"><div style="font-size:36px;margin-bottom:12px;">💪</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">Proven results</h3><p style="font-size:14px;color:#52525b;">1000+ transformations</p></div></div></div>`,ru:`<div style="padding:60px 20px;"><h2 style="text-align:center;font-size:32px;font-weight:800;color:#18181b;margin-bottom:40px;">Почему мы</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:900px;margin:0 auto;"><div style="text-align:center;padding:24px;"><div style="font-size:36px;margin-bottom:12px;">🎯</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">Индивидуально</h3><p style="font-size:14px;color:#52525b;">Под ваши цели</p></div><div style="text-align:center;padding:24px;"><div style="font-size:36px;margin-bottom:12px;">📱</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">Приложение</h3><p style="font-size:14px;color:#52525b;">Тренируйтесь везде</p></div><div style="text-align:center;padding:24px;"><div style="font-size:36px;margin-bottom:12px;">💪</div><h3 style="font-size:18px;font-weight:700;color:#18181b;margin-bottom:8px;">Результаты</h3><p style="font-size:14px;color:#52525b;">1000+ клиентов</p></div></div></div>`},
  {id:'cols2',l:'Two Columns',lr:'Две колонки',icon:Columns2,en:`<div style="display:flex;gap:24px;padding:40px 20px;"><div style="flex:1;"><h2 style="font-size:28px;font-weight:700;color:#18181b;margin-bottom:12px;">Left</h2><p style="color:#52525b;">Content</p></div><div style="flex:1;"><h2 style="font-size:28px;font-weight:700;color:#18181b;margin-bottom:12px;">Right</h2><p style="color:#52525b;">Content</p></div></div>`,ru:`<div style="display:flex;gap:24px;padding:40px 20px;"><div style="flex:1;"><h2 style="font-size:28px;font-weight:700;color:#18181b;margin-bottom:12px;">Лево</h2><p style="color:#52525b;">Контент</p></div><div style="flex:1;"><h2 style="font-size:28px;font-weight:700;color:#18181b;margin-bottom:12px;">Право</h2><p style="color:#52525b;">Контент</p></div></div>`},
  {id:'video',l:'Video Section',lr:'Видео',icon:Play,en:`<div style="padding:60px 20px;text-align:center;"><h2 style="font-size:32px;font-weight:800;color:#18181b;margin-bottom:24px;">Watch training</h2><div style="max-width:700px;margin:0 auto;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:20px;padding:80px 40px;cursor:pointer;position:relative;"><div style="width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;margin:0 auto;box-shadow:0 4px 20px rgba(0,0,0,0.2);"><span style="font-size:32px;color:#18181b;margin-left:6px;">▶</span></div><p style="color:white;margin-top:16px;">Click to play</p></div></div>`,ru:`<div style="padding:60px 20px;text-align:center;"><h2 style="font-size:32px;font-weight:800;color:#18181b;margin-bottom:24px;">Посмотрите тренировку</h2><div style="max-width:700px;margin:0 auto;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:20px;padding:80px 40px;cursor:pointer;"><div style="width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;margin:0 auto;"><span style="font-size:32px;color:#18181b;margin-left:6px;">▶</span></div><p style="color:white;margin-top:16px;">Нажмите ▶</p></div></div>`},
  {id:'faq',l:'FAQ',lr:'Вопросы',icon:MessageSquare,en:`<div style="padding:60px 20px;max-width:700px;margin:0 auto;"><h2 style="text-align:center;font-size:32px;font-weight:800;color:#18181b;margin-bottom:40px;">FAQ</h2><div style="border-top:1px solid #e4e4e7;"><div style="padding:20px 0;border-bottom:1px solid #e4e4e7;"><h3 style="font-size:16px;font-weight:600;color:#18181b;margin-bottom:8px;">How to start?</h3><p style="font-size:14px;color:#52525b;">Register, choose a program, start training.</p></div><div style="padding:20px 0;border-bottom:1px solid #e4e4e7;"><h3 style="font-size:16px;font-weight:600;color:#18181b;margin-bottom:8px;">Need equipment?</h3><p style="font-size:14px;color:#52525b;">Home Fitness needs none. Others may require gym.</p></div><div style="padding:20px 0;border-bottom:1px solid #e4e4e7;"><h3 style="font-size:16px;font-weight:600;color:#18181b;margin-bottom:8px;">Refund?</h3><p style="font-size:14px;color:#52525b;">14-day money-back guarantee.</p></div></div></div>`,ru:`<div style="padding:60px 20px;max-width:700px;margin:0 auto;"><h2 style="text-align:center;font-size:32px;font-weight:800;color:#18181b;margin-bottom:40px;">Вопросы</h2><div style="border-top:1px solid #e4e4e7;"><div style="padding:20px 0;border-bottom:1px solid #e4e4e7;"><h3 style="font-size:16px;font-weight:600;color:#18181b;margin-bottom:8px;">Как начать?</h3><p style="font-size:14px;color:#52525b;">Регистрация → программа → старт.</p></div><div style="padding:20px 0;border-bottom:1px solid #e4e4e7;"><h3 style="font-size:16px;font-weight:600;color:#18181b;margin-bottom:8px;">Нужен инвентарь?</h3><p style="font-size:14px;color:#52525b;">Домашний фитнес — нет. Остальное — зал.</p></div><div style="padding:20px 0;border-bottom:1px solid #e4e4e7;"><h3 style="font-size:16px;font-weight:600;color:#18181b;margin-bottom:8px;">Возврат?</h3><p style="font-size:14px;color:#52525b;">14 дней гарантия.</p></div></div></div>`},
  {id:'testimonials',l:'Testimonials',lr:'Отзывы',icon:Heart,en:`<div style="padding:60px 20px;"><h2 style="text-align:center;font-size:32px;font-weight:800;color:#18181b;margin-bottom:40px;">What clients say</h2><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;max-width:800px;margin:0 auto;"><div style="background:#fafafa;border-radius:16px;padding:24px;"><p style="font-style:italic;color:#52525b;margin-bottom:12px;">"Best trainer! Incredible results in 3 months."</p><div style="display:flex;align-items:center;gap:10px;"><div style="width:36px;height:36px;border-radius:50%;background:#14b8a6;color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;">O</div><div><p style="font-weight:600;font-size:13px;">Olga, 38</p><p style="font-size:12px;color:#eab308;">⭐⭐⭐⭐⭐</p></div></div></div><div style="background:#fafafa;border-radius:16px;padding:24px;"><p style="font-style:italic;color:#52525b;margin-bottom:12px;">"Finally found a coach who understands women's needs!"</p><div style="display:flex;align-items:center;gap:10px;"><div style="width:36px;height:36px;border-radius:50%;background:#8b5cf6;color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;">S</div><div><p style="font-weight:600;font-size:13px;">Svetlana, 32</p><p style="font-size:12px;color:#eab308;">⭐⭐⭐⭐⭐</p></div></div></div></div></div>`,ru:`<div style="padding:60px 20px;"><h2 style="text-align:center;font-size:32px;font-weight:800;color:#18181b;margin-bottom:40px;">Отзывы</h2><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;max-width:800px;margin:0 auto;"><div style="background:#fafafa;border-radius:16px;padding:24px;"><p style="font-style:italic;color:#52525b;margin-bottom:12px;">"Лучший тренер! Результат за 3 месяца."</p><div style="display:flex;align-items:center;gap:10px;"><div style="width:36px;height:36px;border-radius:50%;background:#14b8a6;color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;">О</div><div><p style="font-weight:600;font-size:13px;">Ольга, 38</p><p style="font-size:12px;color:#eab308;">⭐⭐⭐⭐⭐</p></div></div></div><div style="background:#fafafa;border-radius:16px;padding:24px;"><p style="font-style:italic;color:#52525b;margin-bottom:12px;">"Нашла тренера, который понимает женщин!"</p><div style="display:flex;align-items:center;gap:10px;"><div style="width:36px;height:36px;border-radius:50%;background:#8b5cf6;color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;">С</div><div><p style="font-weight:600;font-size:13px;">Светлана, 32</p><p style="font-size:12px;color:#eab308;">⭐⭐⭐⭐⭐</p></div></div></div></div></div>`},
  {id:'stats',l:'Stats Counter',lr:'Счётчики',icon:Hash,en:`<div style="padding:60px 20px;background:linear-gradient(135deg,#18181b,#27272a);"><div style="display:flex;gap:32px;justify-content:center;flex-wrap:wrap;"><div style="text-align:center;"><p style="font-size:48px;font-weight:800;color:#2dd4bf;">1000+</p><p style="font-size:14px;color:#a1a1aa;">Clients</p></div><div style="text-align:center;"><p style="font-size:48px;font-weight:800;color:#2dd4bf;">17+</p><p style="font-size:14px;color:#a1a1aa;">Years</p></div><div style="text-align:center;"><p style="font-size:48px;font-weight:800;color:#2dd4bf;">5×</p><p style="font-size:14px;color:#a1a1aa;">Champion</p></div><div style="text-align:center;"><p style="font-size:48px;font-weight:800;color:#2dd4bf;">100%</p><p style="font-size:14px;color:#a1a1aa;">Dedication</p></div></div></div>`,ru:`<div style="padding:60px 20px;background:linear-gradient(135deg,#18181b,#27272a);"><div style="display:flex;gap:32px;justify-content:center;flex-wrap:wrap;"><div style="text-align:center;"><p style="font-size:48px;font-weight:800;color:#2dd4bf;">1000+</p><p style="font-size:14px;color:#a1a1aa;">Клиентов</p></div><div style="text-align:center;"><p style="font-size:48px;font-weight:800;color:#2dd4bf;">17+</p><p style="font-size:14px;color:#a1a1aa;">Лет</p></div><div style="text-align:center;"><p style="font-size:48px;font-weight:800;color:#2dd4bf;">5×</p><p style="font-size:14px;color:#a1a1aa;">Чемпион</p></div><div style="text-align:center;"><p style="font-size:48px;font-weight:800;color:#2dd4bf;">100%</p><p style="font-size:14px;color:#a1a1aa;">Отдача</p></div></div></div>`},
  {id:'contact',l:'Contact Form',lr:'Контакты',icon:Mail,en:`<div style="padding:60px 20px;max-width:600px;margin:0 auto;text-align:center;"><h2 style="font-size:32px;font-weight:800;color:#18181b;margin-bottom:8px;">Get in touch</h2><p style="color:#52525b;margin-bottom:32px;">Have questions? Send us a message.</p><div style="text-align:left;display:flex;flex-direction:column;gap:12px;"><div style="padding:14px 16px;border:1px solid #e4e4e7;border-radius:12px;color:#999;">Your name</div><div style="padding:14px 16px;border:1px solid #e4e4e7;border-radius:12px;color:#999;">Email</div><div style="padding:14px 16px;border:1px solid #e4e4e7;border-radius:12px;color:#999;min-height:100px;">Message</div><a href="#" style="display:block;padding:14px;border-radius:14px;background:#14b8a6;color:white;font-weight:600;text-decoration:none;text-align:center;">Send message</a></div></div>`,ru:`<div style="padding:60px 20px;max-width:600px;margin:0 auto;text-align:center;"><h2 style="font-size:32px;font-weight:800;color:#18181b;margin-bottom:8px;">Связаться</h2><p style="color:#52525b;margin-bottom:32px;">Напишите нам.</p><div style="text-align:left;display:flex;flex-direction:column;gap:12px;"><div style="padding:14px 16px;border:1px solid #e4e4e7;border-radius:12px;color:#999;">Имя</div><div style="padding:14px 16px;border:1px solid #e4e4e7;border-radius:12px;color:#999;">Email</div><div style="padding:14px 16px;border:1px solid #e4e4e7;border-radius:12px;color:#999;min-height:100px;">Сообщение</div><a href="#" style="display:block;padding:14px;border-radius:14px;background:#14b8a6;color:white;font-weight:600;text-decoration:none;text-align:center;">Отправить</a></div></div>`},
  {id:'gallery',l:'Photo Gallery',lr:'Фотогалерея',icon:Camera,en:`<div style="padding:60px 20px;"><h2 style="text-align:center;font-size:32px;font-weight:800;color:#18181b;margin-bottom:32px;">Gallery</h2><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:900px;margin:0 auto;"><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;">📷</div><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;">📷</div><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;">📷</div><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;">📷</div></div></div>`,ru:`<div style="padding:60px 20px;"><h2 style="text-align:center;font-size:32px;font-weight:800;color:#18181b;margin-bottom:32px;">Галерея</h2><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:900px;margin:0 auto;"><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;">📷</div><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;">📷</div><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;">📷</div><div style="aspect-ratio:1;background:#e4e4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;">📷</div></div></div>`},
]

/* ═══════════ INIT BLOCKS ═══════════ */
const D = getDefaultContent()
const S0: SectionStyle = {}
const initBlocks: PB[] = [
  {id:'header',type:'header',label:'Header',labelRu:'Шапка',visible:true,contentEn:D.en.header,contentRu:D.ru.header,style:S0},
  {id:'hero',type:'hero',label:'Hero',labelRu:'Баннер',visible:true,contentEn:D.en.hero,contentRu:D.ru.hero,style:S0},
  {id:'programs',type:'programs',label:'Programs (5)',labelRu:'Программы (5)',visible:true,contentEn:D.en.programs,contentRu:D.ru.programs,style:{bgColor:'#fafafa'}},
  {id:'courses',type:'courses',label:'Video Courses',labelRu:'Видеокурсы',visible:true,contentEn:D.en.courses,contentRu:D.ru.courses,style:S0},
  {id:'about',type:'about',label:'About',labelRu:'О тренере',visible:true,contentEn:D.en.about,contentRu:D.ru.about,style:{bgColor:'#fafafa'}},
  {id:'results',type:'results',label:'Results',labelRu:'Результаты',visible:true,contentEn:D.en.results,contentRu:D.ru.results,style:S0},
  {id:'footer',type:'footer',label:'Footer',labelRu:'Подвал',visible:true,contentEn:D.en.footer,contentRu:D.ru.footer,style:S0},
]

/* ═══════════ MAIN EDITOR ═══════════ */
export default function PageEditorPage() {
  const {locale} = useTranslation()
  const lang = locale as 'en'|'ru'
  const [blocks, setBlocks] = useState<PB[]>(initBlocks)
  const [active, setActive] = useState('hero')
  const [loading, setLoading] = useState(true)

  // Load blocks from database on mount
  useEffect(() => {
    const loadBlocks = async () => {
      try {
        const res = await fetch('/api/page-blocks?page=home')
        if (res.ok) {
          const data = await res.json()
          if (data.blocks && data.blocks.length > 0) {
            setBlocks(data.blocks)
            setActive(data.blocks[0]?.id || 'hero')
          }
        }
      } catch (err) {
        console.error('Failed to load page blocks:', err)
      } finally {
        setLoading(false)
      }
    }
    loadBlocks()
  }, [])
  const [preview, setPreview] = useState(false)
  const [device, setDevice] = useState<'desktop'|'mobile'|'tablet'>('desktop')
  const [lt, setLt] = useState<'en'|'ru'>('ru')
  const [addModal, setAddModal] = useState(false)
  const [insertIdx, setInsertIdx] = useState(-1)
  const [dragId, setDragId] = useState<string|null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [showStyle, setShowStyle] = useState(false)
  const [history, setHistory] = useState<PB[][]>([initBlocks])
  const [histIdx, setHistIdx] = useState(0)

  const ab = blocks.find(b => b.id===active) || null
  const push = (next: PB[]) => { const h = history.slice(0, histIdx+1); h.push(next); setHistory(h); setHistIdx(h.length-1); setBlocks(next) }
  const undo = () => { if(histIdx>0) { const i=histIdx-1; setHistIdx(i); setBlocks(history[i]) } }
  const redo = () => { if(histIdx<history.length-1) { const i=histIdx+1; setHistIdx(i); setBlocks(history[i]) } }

  const upd = (id:string, u:Partial<PB>) => { const n = blocks.map(b=>b.id===id?{...b,...u}:b); push(n) }
  const updSilent = (id:string, u:Partial<PB>) => setBlocks(p=>p.map(b=>b.id===id?{...b,...u}:b)) // For typing — no history push
  const mv = (id:string, d:-1|1) => { const arr=[...blocks]; const i=arr.findIndex(b=>b.id===id); const n=i+d; if(n<0||n>=arr.length)return;[arr[i],arr[n]]=[arr[n],arr[i]]; push(arr) }
  const rm = (id:string) => { const filtered = blocks.filter(b=>b.id!==id); push(filtered); if(active===id) setActive(filtered[0]?.id||'') }
  const dup = (id:string) => { const i=blocks.findIndex(b=>b.id===id); if(i<0)return; const s=blocks[i]; const d:PB={...s,id:`c_${Date.now()}`,label:s.label+' ⊕',labelRu:s.labelRu+' ⊕',style:{...s.style}}; const a=[...blocks]; a.splice(i+1,0,d); push(a) }

  const addFromTemplate = (tpl: typeof TEMPLATES[0], idx?: number) => {
    const nid = `t_${Date.now()}`; const nb: PB = {id:nid,type:'custom',label:tpl.l,labelRu:tpl.lr,visible:true,contentEn:tpl.en,contentRu:tpl.ru,style:{}}
    const a = [...blocks]; if(idx!==undefined && idx>=0) a.splice(idx,0,nb); else a.push(nb); push(a); setActive(nid); setAddModal(false); setInsertIdx(-1)
  }

  const onDragStart = (id:string) => setDragId(id)
  const onDragOver = (e:React.DragEvent, tid:string) => { e.preventDefault(); if(!dragId||dragId===tid)return; const a=[...blocks]; const f=a.findIndex(b=>b.id===dragId); const t=a.findIndex(b=>b.id===tid); if(f<0||t<0)return; const[item]=a.splice(f,1); a.splice(t,0,item); setBlocks(a) }
  const onDragEnd = () => { setDragId(null); push(blocks) }

  const exportJSON = () => {
    const data = JSON.stringify(blocks, null, 2)
    const blob = new Blob([data], {type:'application/json'})
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='page-builder.json'; a.click(); URL.revokeObjectURL(url)
    toast.success(lang==='ru'?'Экспорт готов':'Exported!')
  }
  const importJSON = () => {
    const i = document.createElement('input'); i.type='file'; i.accept='.json'
    i.onchange = e => { const f=(e.target as HTMLInputElement).files?.[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>{
      try { const d=JSON.parse(ev.target?.result as string); if(Array.isArray(d)) { push(d); toast.success(lang==='ru'?'Импорт!':'Imported!') } } catch { toast.error('Invalid JSON') } }; r.readAsText(f) }; i.click()
  }

  const ph = blocks.filter(b=>b.visible).map(b => {
    const c = lt==='ru'?b.contentRu:b.contentEn; const s = styleToCSS(b.style); const a = styleAttrs(b.style)
    return s||a ? `<div${a} style="${s}">${c}</div>` : c
  }).join('')

  const wrapClass = fullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-zinc-950 overflow-auto p-4' : 'space-y-4'
  const dw = device==='mobile'?'max-w-[390px]':device==='tablet'?'max-w-[768px]':'w-full'

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
  }

  return (
    <div className={wrapClass}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {fullscreen && <button onClick={()=>setFullscreen(false)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><Minimize2 className="w-5 h-5" /></button>}
          <div><h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{lang==='ru'?'Конструктор':'Page Builder'}</h1></div>
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          <div className="flex items-center gap-0.5 mr-2">
            <button onClick={undo} disabled={histIdx<=0} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30" title="Undo"><Undo2 className="w-4 h-4" /></button>
            <button onClick={redo} disabled={histIdx>=history.length-1} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30" title="Redo"><Redo2 className="w-4 h-4" /></button>
          </div>
          <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
            {(['en','ru'] as const).map(l=>(<button key={l} onClick={()=>setLt(l)} className={`px-3 py-1 text-xs font-medium rounded-md ${lt===l?'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-zinc-100':'text-zinc-500'}`}>{l.toUpperCase()}</button>))}
          </div>
          <Button variant="outline" size="sm" onClick={()=>setPreview(!preview)}>
            {preview?<><EyeOff className="w-3.5 h-3.5 mr-1.5" />{lang==='ru'?'Ред.':'Edit'}</>:<><Eye className="w-3.5 h-3.5 mr-1.5" />{lang==='ru'?'Превью':'Preview'}</>}
          </Button>
          {preview && <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
            <button onClick={()=>setDevice('desktop')} className={`p-1.5 rounded-md ${device==='desktop'?'bg-white dark:bg-zinc-700 shadow':''}`}><Monitor className="w-3.5 h-3.5" /></button>
            <button onClick={()=>setDevice('tablet')} className={`p-1.5 rounded-md ${device==='tablet'?'bg-white dark:bg-zinc-700 shadow':''}`}><Tablet className="w-3.5 h-3.5" /></button>
            <button onClick={()=>setDevice('mobile')} className={`p-1.5 rounded-md ${device==='mobile'?'bg-white dark:bg-zinc-700 shadow':''}`}><Smartphone className="w-3.5 h-3.5" /></button>
          </div>}
          <button onClick={()=>setFullscreen(!fullscreen)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Fullscreen"><Maximize2 className="w-4 h-4" /></button>
          <button onClick={exportJSON} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Export JSON"><Download className="w-4 h-4" /></button>
          <button onClick={importJSON} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Import JSON"><Upload className="w-4 h-4" /></button>
          <Button variant="gradient" size="sm" onClick={async()=>{
            try {
              const res = await fetch('/api/page-blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageSlug: 'home', blocks })
              })
              if (!res.ok) throw new Error('Save failed')
              toast.success(lang==='ru'?'Сохранено в базу!':'Saved to database!')
            } catch { toast.error(lang==='ru'?'Ошибка сохранения':'Save failed') }
          }}><Save className="w-3.5 h-3.5 mr-1.5" />{lang==='ru'?'Сохранить':'Save'}</Button>
        </div>
      </div>

      {preview ? (
        <Card><CardContent className="p-0"><div className={`mx-auto transition-all ${dw} ${device!=='desktop'?'border-x border-zinc-200':''}`}>
          <div className="bg-white overflow-hidden" dangerouslySetInnerHTML={{__html:ph}} />
        </div></CardContent></Card>
      ) : (
        <div className="grid lg:grid-cols-[280px_1fr] gap-4">
          {/* Sidebar */}
          <div className="space-y-3">
            <Card className="h-fit lg:sticky lg:top-4">
              <CardContent className="p-2.5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{lang==='ru'?'Блоки':'Blocks'} ({blocks.length})</p>
                  <button onClick={()=>{setInsertIdx(-1);setAddModal(true)}} className="p-1 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 text-teal-500" title="Add"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="space-y-0.5 max-h-[50vh] overflow-y-auto">
                  {blocks.map((b,idx) => {
                    const I=BI[b.type]; const isA=active===b.id
                    return (
                      <React.Fragment key={b.id}>
                        <div draggable onDragStart={()=>onDragStart(b.id)} onDragOver={e=>onDragOver(e,b.id)} onDragEnd={onDragEnd}
                          onClick={()=>setActive(b.id)}
                          className={`flex items-center gap-1.5 p-2 rounded-xl cursor-pointer transition-all group select-none ${dragId===b.id?'opacity-40':''} ${isA?'bg-teal-50 dark:bg-teal-900/20 ring-1 ring-teal-300':'hover:bg-zinc-50 dark:hover:bg-zinc-800'} ${!b.visible?'opacity-30':''}`}>
                          <GripVertical className="w-3.5 h-3.5 text-zinc-300 cursor-grab flex-shrink-0" />
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${isA?'bg-teal-500 text-white':'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}><I className="w-3 h-3" /></div>
                          <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate flex-1">{lang==='ru'?b.labelRu:b.label}</span>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
                            <button onClick={e=>{e.stopPropagation();mv(b.id,-1)}} className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"><ChevronUp className="w-2.5 h-2.5" /></button>
                            <button onClick={e=>{e.stopPropagation();mv(b.id,1)}} className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"><ChevronDown className="w-2.5 h-2.5" /></button>
                            <button onClick={e=>{e.stopPropagation();upd(b.id,{visible:!b.visible})}} className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700">{b.visible?<Eye className="w-2.5 h-2.5"/>:<EyeOff className="w-2.5 h-2.5"/>}</button>
                            <button onClick={e=>{e.stopPropagation();dup(b.id)}} className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"><Copy className="w-2.5 h-2.5" /></button>
                            <button onClick={e=>{e.stopPropagation();rm(b.id)}} className="p-0.5 rounded hover:bg-red-100 text-red-500"><Trash2 className="w-2.5 h-2.5" /></button>
                          </div>
                        </div>
                        {/* Between-block inserter */}
                        <div className="flex justify-center py-0.5 opacity-0 hover:opacity-100 transition-opacity">
                          <button onClick={()=>{setInsertIdx(idx+1);setAddModal(true)}} className="p-0.5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-500 hover:bg-teal-200"><Plus className="w-3 h-3" /></button>
                        </div>
                      </React.Fragment>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            {/* Section Style Panel */}
            {ab && showStyle && <StylePanel style={ab.style} onChange={s=>updSilent(ab.id,{style:s})} onCommit={s=>upd(ab.id,{style:s})} lang={lt} />}
          </div>

          {/* Editor */}
          <div className="space-y-3">
            {ab ? (<>
              <Card><CardContent className="p-2.5 flex items-center gap-2 flex-wrap">
                <input type="text" className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 text-sm font-medium flex-1 min-w-[120px]"
                  value={lang==='ru'?ab.labelRu:ab.label} onChange={e=>updSilent(ab.id, lang==='ru'?{labelRu:e.target.value}:{label:e.target.value})} />
                <Badge variant={ab.visible?'success':'secondary'} className="cursor-pointer text-xs" onClick={()=>upd(ab.id,{visible:!ab.visible})}>
                  {ab.visible?(lang==='ru'?'Виден':'On'):(lang==='ru'?'Скрыт':'Off')}
                </Badge>
                <Badge variant="outline" className="text-[10px]">{ab.type}</Badge>
                <button onClick={()=>setShowStyle(!showStyle)} className={`p-1.5 rounded-lg transition-colors ${showStyle?'bg-teal-100 text-teal-600 dark:bg-teal-900':'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500'}`} title={lang==='ru'?'Настройки':'Settings'}>
                  <Paintbrush className="w-4 h-4" /></button>
              </CardContent></Card>
              <RichEditor key={`${ab.id}__${lt}`} content={lt==='ru'?ab.contentRu:ab.contentEn}
                onChange={h=>updSilent(ab.id, lt==='ru'?{contentRu:h}:{contentEn:h})} minH="450px" lang={lt} />
              {/* Live section style preview */}
              {styleToCSS(ab.style) && (
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <Eye className="w-3 h-3 text-zinc-400" />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{lang==='ru'?'Превью стилей секции':'Section style preview'}</span>
                    </div>
                    <div style={parseCSStoObj(styleToCSS(ab.style))} className="transition-all">
                      <div dangerouslySetInnerHTML={{__html: lt==='ru'?ab.contentRu:ab.contentEn}} className="pointer-events-none" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </>) : (
              <Card><CardContent className="p-16 text-center">
                <Layout className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-500">{lang==='ru'?'Выберите блок':'Select a block'}</h3>
              </CardContent></Card>
            )}
          </div>
        </div>
      )}

      {/* Add Block modal */}
      {addModal&&(<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>{setAddModal(false);setInsertIdx(-1)}}>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{lang==='ru'?'Добавить блок':'Add Block'}{insertIdx>=0&&<span className="text-sm font-normal text-zinc-500 ml-2">→ {lang==='ru'?`позиция ${insertIdx+1}`:`position ${insertIdx+1}`}</span>}</h2>
            <button onClick={()=>{setAddModal(false);setInsertIdx(-1)}} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {TEMPLATES.map(tpl=>{const I=tpl.icon; return (
              <button key={tpl.id} onClick={()=>addFromTemplate(tpl,insertIdx>=0?insertIdx:undefined)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 group-hover:bg-teal-100 flex items-center justify-center"><I className="w-5 h-5 text-zinc-500 group-hover:text-teal-500" /></div>
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{lang==='ru'?tpl.lr:tpl.l}</span>
              </button>
            )})}
          </div>
        </div>
      </div>)}
    </div>
  )
}
