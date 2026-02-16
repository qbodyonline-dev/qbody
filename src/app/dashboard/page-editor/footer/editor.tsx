'use client'
import React, { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Upload, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuthUpload } from '@/lib/api'
import { useLanguageConfig } from '@/lib/useLanguageConfig'
import { FOOTER_GRADIENTS } from './defaults'
import type { FooterSectionData, FooterLayout, FooterBgType, FooterNavColumn, FooterSocialLink, FooterContactItem } from './types'
import { TextStyleEditor } from '../shared'
import { SOCIAL_ICONS, CONTACT_ICONS, getIconSVG } from './icons'
import type { FooterIcon } from './icons'

const LAYOUTS: { value: FooterLayout; label: string; desc: string }[] = [
  { value: 'simple', label: '▣ Simple', desc: 'Centered' },
  { value: 'columns', label: '▤ Columns', desc: 'Multi-column' },
  { value: 'minimal', label: '▬ Minimal', desc: 'Single row' },
  { value: 'cta-footer', label: '🎯 CTA+Footer', desc: 'CTA bar top' },
  { value: 'big', label: '▥ Big', desc: 'Full featured' },
  { value: 'split', label: '◧ Split', desc: 'Two halves' },
]

/* ─── Reusable accordion ─── */
function Acc({ k, label, open, toggle, children }: { k: string; label: string; open: Record<string, boolean>; toggle: (k: string) => void; children: React.ReactNode }) {
  return (
    <Card>
      <div className="px-3 py-2 cursor-pointer select-none flex items-center justify-between bg-zinc-50 dark:bg-zinc-800 rounded-t-xl" onClick={() => toggle(k)}>
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{label}</span>
        <span className="text-zinc-400 text-xs">{open[k] ? '▲' : '▼'}</span>
      </div>
      {open[k] && <CardContent className="p-3 space-y-3">{children}</CardContent>}
    </Card>
  )
}

/* ─── Nav Column Editor ─── */
function NavColumnEditor({ col, onChange, onRemove, accentColor, L1, L2 }: { col: FooterNavColumn; onChange: (c: FooterNavColumn) => void; onRemove: () => void; accentColor: string; L1: string; L2: string }) {
  return (
    <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-zinc-500">Column</span>
        <button onClick={onRemove} className="p-0.5 text-red-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Input value={col.title} onChange={e => onChange({ ...col, title: e.target.value })} placeholder={`Title ${L1}`} className="text-xs h-7" />
        <Input value={col.titleRu} onChange={e => onChange({ ...col, titleRu: e.target.value })} placeholder={`Title ${L2}`} className="text-xs h-7" />
      </div>
      {col.links.map((link, li) => (
        <div key={link.id} className="flex gap-1 items-center">
          <div className="flex-1 grid grid-cols-2 gap-1">
            <Input value={link.label} onChange={e => {
              const links = [...col.links]; links[li] = { ...links[li], label: e.target.value }; onChange({ ...col, links })
            }} placeholder={L1} className="text-[10px] h-6" />
            <Input value={link.labelRu} onChange={e => {
              const links = [...col.links]; links[li] = { ...links[li], labelRu: e.target.value }; onChange({ ...col, links })
            }} placeholder={L2} className="text-[10px] h-6" />
          </div>
          <Input value={link.href} onChange={e => {
            const links = [...col.links]; links[li] = { ...links[li], href: e.target.value }; onChange({ ...col, links })
          }} placeholder="href" className="text-[10px] h-6 w-20" />
          <button onClick={() => { const links = col.links.filter((_, j) => j !== li); onChange({ ...col, links }) }} className="p-0.5"><Trash2 className="w-2.5 h-2.5 text-red-400" /></button>
        </div>
      ))}
      <button onClick={() => onChange({ ...col, links: [...col.links, { id: `l_${Date.now()}`, label: 'Link', labelRu: 'Ссылка', href: '#' }] })}
        className="text-[10px] font-medium flex items-center gap-1" style={{ color: accentColor }}><Plus className="w-3 h-3" /> Add Link</button>
    </div>
  )
}

/* ─── SVG Icon Picker ─── */
function IconPicker({ current, icons, onPick }: { current: string; icons: FooterIcon[]; onPick: (key: string, label: string) => void }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setShow(!show)}
        className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 flex items-center justify-center hover:border-teal-400 transition-colors flex-shrink-0"
        title="Pick icon"
        dangerouslySetInnerHTML={{ __html: getIconSVG(current, 18, '#71717a') }}
      />
      {show && (
        <div className="absolute z-50 top-10 left-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-xl shadow-xl p-2 w-[240px]">
          <div className="grid grid-cols-4 gap-1">
            {icons.map(ic => (
              <button key={ic.key} onClick={() => { onPick(ic.key, ic.label); setShow(false) }}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors ${current === ic.key ? 'bg-teal-50 dark:bg-teal-900/30 ring-1 ring-teal-400' : ''}`}
                title={ic.label}>
                <span dangerouslySetInnerHTML={{ __html: getIconSVG(ic.key, 20, current === ic.key ? '#14b8a6' : '#71717a') }} />
                <span className="text-[8px] text-zinc-400 leading-tight truncate w-full text-center">{ic.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Social Link Editor ─── */
function SocialEditor({ links, onChange, accentColor }: { links: FooterSocialLink[]; onChange: (l: FooterSocialLink[]) => void; accentColor: string }) {
  return (
    <div className="space-y-2">
      {links.map((s, i) => (
        <div key={s.id} className="flex gap-1.5 items-start p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
          <IconPicker current={s.icon} icons={SOCIAL_ICONS} onPick={(key, label) => {
            const n = [...links]; n[i] = { ...n[i], icon: key, ...(label && !n[i].label ? { label } : {}) }; onChange(n)
          }} />
          <div className="flex-1 space-y-1">
            <Input value={s.label} onChange={e => { const n = [...links]; n[i] = { ...n[i], label: e.target.value }; onChange(n) }} placeholder="Label" className="text-xs h-7" />
            <Input value={s.url} onChange={e => { const n = [...links]; n[i] = { ...n[i], url: e.target.value }; onChange(n) }} placeholder="https://..." className="text-xs h-7" />
          </div>
          <button onClick={() => onChange(links.filter((_, j) => j !== i))} className="p-1 mt-1 text-red-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <button onClick={() => onChange([...links, { id: `s_${Date.now()}`, icon: 'link', label: '', url: 'https://' }])}
        className="text-[11px] font-medium flex items-center gap-1" style={{ color: accentColor }}><Plus className="w-3.5 h-3.5" /> Add Social</button>
    </div>
  )
}

/* ─── Contact Item Editor ─── */
function ContactEditor({ items, onChange, accentColor, L1, L2 }: { items: FooterContactItem[]; onChange: (i: FooterContactItem[]) => void; accentColor: string; L1: string; L2: string }) {
  return (
    <div className="space-y-2">
      {items.map((c, i) => (
        <div key={c.id} className="flex gap-1.5 items-start p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
          <IconPicker current={c.icon} icons={CONTACT_ICONS} onPick={(key) => {
            const n = [...items]; n[i] = { ...n[i], icon: key }; onChange(n)
          }} />
          <div className="flex-1 space-y-1">
            <div className="grid grid-cols-2 gap-1">
              <Input value={c.text} onChange={e => { const n = [...items]; n[i] = { ...n[i], text: e.target.value }; onChange(n) }} placeholder={`Text ${L1}`} className="text-xs h-7" />
              <Input value={c.textRu} onChange={e => { const n = [...items]; n[i] = { ...n[i], textRu: e.target.value }; onChange(n) }} placeholder={`Text ${L2}`} className="text-xs h-7" />
            </div>
            <Input value={c.link || ''} onChange={e => { const n = [...items]; n[i] = { ...n[i], link: e.target.value }; onChange(n) }} placeholder="Link (optional)" className="text-xs h-7" />
          </div>
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="p-1 mt-1 text-red-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <button onClick={() => onChange([...items, { id: `c_${Date.now()}`, icon: 'location', text: '', textRu: '' }])}
        className="text-[11px] font-medium flex items-center gap-1" style={{ color: accentColor }}><Plus className="w-3.5 h-3.5" /> Add Contact</button>
    </div>
  )
}

/* ═══════════ MAIN EDITOR ═══════════ */
interface Props {
  section: FooterSectionData
  onChangeSection: (s: FooterSectionData) => void
  lang: 'en' | 'ru'
}

export function FooterSectionEditor({ section: s, onChangeSection, lang }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({ layout: true })
  const [logoUploading, setLogoUploading] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const { pCode, sCode, isBilingual: isBi } = useLanguageConfig()
  const L1 = pCode || 'EN'
  const L2 = sCode || 'RU'

  const upd = (key: keyof FooterSectionData, val: any) => onChangeSection({ ...s, [key]: val })
  const toggle = (k: string) => setOpen(p => ({ ...p, [k]: !p[k] }))

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Select an image'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
    setLogoUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('folder', 'footer')
      const res = await fetchWithAuthUpload('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      upd('logoImage', url)
      toast.success('Uploaded!')
    } catch (err: any) { toast.error(err.message) }
    finally { setLogoUploading(false); if (logoRef.current) logoRef.current.value = '' }
  }

  return (
    <div className="space-y-3">
      {/* Layout */}
      <Acc k="layout" label="📐 Layout" open={open} toggle={toggle}>
        <div className="grid grid-cols-3 gap-1.5">
          {LAYOUTS.map(l => (
            <button key={l.value} onClick={() => upd('layout', l.value)}
              className={`py-2 rounded-lg text-center transition-all ${s.layout === l.value ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
              <div className="text-xs font-medium">{l.label}</div>
              <div className="text-[9px] opacity-60">{l.desc}</div>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Padding Y</label>
            <Input type="number" value={s.paddingY} onChange={e => upd('paddingY', +e.target.value)} className="text-xs h-7" min={16} max={100} />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Max Width</label>
            <Input type="number" value={s.innerMaxWidth} onChange={e => upd('innerMaxWidth', +e.target.value)} className="text-xs h-7" min={600} max={1400} />
          </div>
        </div>
      </Acc>

      {/* Branding */}
      <Acc k="brand" label="🏷️ Branding" open={open} toggle={toggle}>
        <div className="grid grid-cols-3 gap-1.5">
          <Input value={s.logoIcon} onChange={e => upd('logoIcon', e.target.value)} placeholder="Icon" className="text-center text-xs h-7" maxLength={2} />
          <Input value={s.logoText} onChange={e => upd('logoText', e.target.value)} placeholder="Name" className="text-xs h-7 col-span-2" />
        </div>
        <Input value={s.logoGradient} onChange={e => upd('logoGradient', e.target.value)} placeholder="Logo gradient" className="text-xs h-7" />
        <div className="flex gap-1.5 flex-wrap">
          {FOOTER_GRADIENTS.map((g, i) => (
            <button key={i} onClick={() => upd('logoGradient', g)} className={`w-7 h-7 rounded-lg border-2 ${s.logoGradient === g ? 'border-white' : 'border-transparent'}`} style={{ background: g }} />
          ))}
        </div>
        {/* Logo image */}
        <div className="flex gap-2 items-center">
          {s.logoImage && (
            <div className="relative">
              <img src={s.logoImage} alt="" className="h-8 rounded" />
              <button onClick={() => upd('logoImage', '')} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="w-2.5 h-2.5" /></button>
            </div>
          )}
          <Input value={s.logoImage || ''} onChange={e => upd('logoImage', e.target.value)} placeholder="Logo URL" className="text-xs h-7 flex-1" />
          <button onClick={() => logoRef.current?.click()} disabled={logoUploading}
            className="h-7 px-3 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0">
            {logoUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload
          </button>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </div>
        <TextStyleEditor label="Logo" value={s.logoStyle} onChange={v => upd('logoStyle', v)} defaultColor={s.textColor} />
        {isBi ? (
          <div className="grid grid-cols-2 gap-1.5">
            <textarea value={s.description} onChange={e => upd('description', e.target.value)} placeholder={`Description ${L1}`} className="w-full p-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-12 resize-none" />
            <textarea value={s.descriptionRu} onChange={e => upd('descriptionRu', e.target.value)} placeholder={`Description ${L2}`} className="w-full p-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-12 resize-none" />
          </div>
        ) : (
          <textarea value={s.description} onChange={e => upd('description', e.target.value)} placeholder="Description" className="w-full p-2 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg h-12 resize-none" />
        )}
        <TextStyleEditor label="Desc" value={s.descStyle} onChange={v => upd('descStyle', v)} defaultColor={s.mutedColor} />
      </Acc>

      {/* Navigation */}
      <Acc k="nav" label="🔗 Navigation" open={open} toggle={toggle}>
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <input type="checkbox" checked={s.showNav} onChange={e => upd('showNav', e.target.checked)} className="rounded" />
          Show navigation columns
        </label>
        {s.showNav && (
          <div className="space-y-2">
            {s.navColumns.map((col, i) => (
              <NavColumnEditor
                key={col.id}
                col={col}
                onChange={c => { const n = [...s.navColumns]; n[i] = c; upd('navColumns', n) }}
                onRemove={() => upd('navColumns', s.navColumns.filter((_, j) => j !== i))}
                accentColor={s.accentColor}
                L1={L1} L2={L2}
              />
            ))}
            <button onClick={() => upd('navColumns', [...s.navColumns, { id: `nc_${Date.now()}`, title: 'Links', titleRu: 'Ссылки', links: [] }])}
              className="text-[10px] font-medium flex items-center gap-1 text-teal-500"><Plus className="w-3 h-3" /> Add Column</button>
          </div>
        )}
        <TextStyleEditor label="Headings" value={s.headingStyle} onChange={v => upd('headingStyle', v)} defaultColor={s.textColor} />
      </Acc>

      {/* Social */}
      <Acc k="social" label="📱 Social Links" open={open} toggle={toggle}>
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <input type="checkbox" checked={s.showSocial} onChange={e => upd('showSocial', e.target.checked)} className="rounded" />
          Show social links
        </label>
        {s.showSocial && <SocialEditor links={s.socialLinks} onChange={l => upd('socialLinks', l)} accentColor={s.accentColor} />}
      </Acc>

      {/* Contact */}
      <Acc k="contact" label="📧 Contact Info" open={open} toggle={toggle}>
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <input type="checkbox" checked={s.showContact} onChange={e => upd('showContact', e.target.checked)} className="rounded" />
          Show contact info
        </label>
        {s.showContact && <ContactEditor items={s.contactItems} onChange={i => upd('contactItems', i)} accentColor={s.accentColor} L1={L1} L2={L2} />}
      </Acc>

      {/* CTA */}
      <Acc k="cta" label="🎯 CTA Bar" open={open} toggle={toggle}>
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <input type="checkbox" checked={s.showCta} onChange={e => upd('showCta', e.target.checked)} className="rounded" />
          Show CTA bar {s.layout === 'cta-footer' && '(always on for this layout)'}
        </label>
        {(s.showCta || s.layout === 'cta-footer') && (
          <div className="space-y-2">
            {isBi ? (
              <div className="grid grid-cols-2 gap-1.5">
                <Input value={s.ctaTitle} onChange={e => upd('ctaTitle', e.target.value)} placeholder={`CTA Title ${L1}`} className="text-xs h-7" />
                <Input value={s.ctaTitleRu} onChange={e => upd('ctaTitleRu', e.target.value)} placeholder={`CTA Title ${L2}`} className="text-xs h-7" />
              </div>
            ) : (
              <Input value={s.ctaTitle} onChange={e => upd('ctaTitle', e.target.value)} placeholder="CTA Title" className="text-xs h-7" />
            )}
            {isBi ? (
              <div className="grid grid-cols-2 gap-1.5">
                <Input value={s.ctaSubtitle} onChange={e => upd('ctaSubtitle', e.target.value)} placeholder={`Subtitle ${L1}`} className="text-xs h-7" />
                <Input value={s.ctaSubtitleRu} onChange={e => upd('ctaSubtitleRu', e.target.value)} placeholder={`Subtitle ${L2}`} className="text-xs h-7" />
              </div>
            ) : (
              <Input value={s.ctaSubtitle} onChange={e => upd('ctaSubtitle', e.target.value)} placeholder="Subtitle" className="text-xs h-7" />
            )}
            {isBi ? (
              <div className="grid grid-cols-2 gap-1.5">
                <Input value={s.ctaBtnText} onChange={e => upd('ctaBtnText', e.target.value)} placeholder={`Btn ${L1}`} className="text-xs h-7" />
                <Input value={s.ctaBtnTextRu} onChange={e => upd('ctaBtnTextRu', e.target.value)} placeholder={`Btn ${L2}`} className="text-xs h-7" />
              </div>
            ) : (
              <Input value={s.ctaBtnText} onChange={e => upd('ctaBtnText', e.target.value)} placeholder="Button text" className="text-xs h-7" />
            )}
            <Input value={s.ctaBtnLink} onChange={e => upd('ctaBtnLink', e.target.value)} placeholder="/link" className="text-xs h-7" />
          </div>
        )}
      </Acc>

      {/* Copyright */}
      <Acc k="copy" label="©️ Copyright" open={open} toggle={toggle}>
        {isBi ? (
          <div className="grid grid-cols-2 gap-1.5">
            <Input value={s.copyrightText} onChange={e => upd('copyrightText', e.target.value)} placeholder={L1} className="text-xs h-7" />
            <Input value={s.copyrightTextRu} onChange={e => upd('copyrightTextRu', e.target.value)} placeholder={L2} className="text-xs h-7" />
          </div>
        ) : (
          <Input value={s.copyrightText} onChange={e => upd('copyrightText', e.target.value)} placeholder="Copyright text" className="text-xs h-7" />
        )}
      </Acc>

      {/* Background */}
      <Acc k="bg" label="🎨 Background" open={open} toggle={toggle}>
        <div className="flex gap-1">
          {([['solid', '🎨 Solid'], ['gradient', '🌈 Gradient']] as [FooterBgType, string][]).map(([v, l]) => (
            <button key={v} onClick={() => upd('bgType', v)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium ${s.bgType === v ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'}`}>
              {l}
            </button>
          ))}
        </div>
        {s.bgType === 'solid' && (
          <div className="flex gap-2 items-center">
            <input type="color" value={s.bgColor} onChange={e => upd('bgColor', e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer" />
            <Input value={s.bgColor} onChange={e => upd('bgColor', e.target.value)} className="text-xs h-7 flex-1" />
          </div>
        )}
        {s.bgType === 'gradient' && (
          <div className="space-y-2">
            <Input value={s.bgGradient} onChange={e => upd('bgGradient', e.target.value)} placeholder="linear-gradient(...)" className="text-xs h-7" />
            <div className="flex gap-1.5 flex-wrap">
              {FOOTER_GRADIENTS.map((g, i) => (
                <button key={i} onClick={() => upd('bgGradient', g)} className={`w-7 h-7 rounded-lg border-2 ${s.bgGradient === g ? 'border-white' : 'border-transparent'}`} style={{ background: g }} />
              ))}
            </div>
          </div>
        )}
      </Acc>

      {/* Colors */}
      <Acc k="colors" label="🎨 Colors" open={open} toggle={toggle}>
        <div className="grid grid-cols-2 gap-2">
          {([['textColor', 'Text'], ['mutedColor', 'Muted'], ['accentColor', 'Accent'], ['borderColor', 'Border']] as const).map(([key, label]) => (
            <div key={key}>
              <label className="text-[10px] text-zinc-500 block mb-1">{label}</label>
              <div className="flex gap-1 items-center">
                <input type="color" value={(s as any)[key]} onChange={e => upd(key, e.target.value)} className="w-6 h-6 rounded border-0 cursor-pointer" />
                <Input value={(s as any)[key]} onChange={e => upd(key, e.target.value)} className="text-[10px] h-6 flex-1" />
              </div>
            </div>
          ))}
        </div>
      </Acc>
    </div>
  )
}
