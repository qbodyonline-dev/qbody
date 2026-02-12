import type { ContactSectionData, ContactField } from './types'

/* ═══════════ CONTACT PRO RENDERER ═══════════ */

function uid(): string { return 'ct' + Math.random().toString(36).slice(2, 8) }

function bgCSS(s: ContactSectionData): string {
  if (s.bgType === 'image' && s.bgImage) return `background:url('${s.bgImage}') center/cover no-repeat;`
  if (s.bgType === 'gradient') return `background:${s.bgGradient};`
  return `background:${s.bgColor || '#0a0a0a'};`
}

function animCSS(id: string, anim: string): string {
  if (anim === 'none') return ''
  const kfs: Record<string, string> = {
    'fade-up': `@keyframes ${id}A{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}`,
    'slide-in': `@keyframes ${id}A{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}`,
    'scale-up': `@keyframes ${id}A{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}`,
  }
  return `${kfs[anim] || ''}\n#${id} .ct-anim{opacity:0;animation:${id}A 0.6s ease forwards;}\n#${id} .ct-anim:nth-child(2){animation-delay:0.15s;}#${id} .ct-anim:nth-child(3){animation-delay:0.25s;}`
}

function sectionHeader(s: ContactSectionData, lang: 'en' | 'ru', align: string = 'center'): string {
  const title = lang === 'ru' ? s.titleRu : s.title
  const sub = lang === 'ru' ? s.subtitleRu : s.subtitle
  const badge = lang === 'ru' ? s.badgeRu : s.badge
  const accent = s.accentColor || '#2dd4bf'
  const txt = s.textColor || '#fafafa'
  const v = s.titleVariant
  const bts = s.badgeStyle || {}, tts = s.titleStyle || {}, sts = s.subtitleStyle || {}
  const bSz = bts.size ? `font-size:${bts.size}px;` : 'font-size:13px;'
  const bCl = bts.color ? `color:${bts.color};` : `color:${accent};`
  const bAl = bts.align || align

  let badgeH = ''
  if (badge && v === 'badge') badgeH = `<div style="text-align:${bAl};"><div style="display:inline-block;padding:6px 16px;border-radius:50px;background:${accent}22;${bSz}font-weight:700;margin-bottom:12px;${bCl}">${badge}</div></div>`
  if (v === 'accent-line') badgeH = `<div style="width:48px;height:4px;background:${accent};border-radius:2px;margin-bottom:12px;${align === 'center' ? 'margin-left:auto;margin-right:auto;' : ''}"></div>`

  const tA = tts.align || align, sA = sts.align || align
  const tC = tts.color || txt, sC = sts.color || txt
  const tSz = tts.size ? `font-size:${tts.size}px;` : 'font-size:clamp(26px,4vw,40px);'
  const sSz = sts.size ? `font-size:${sts.size}px;` : 'font-size:clamp(14px,2vw,16px);'

  const titleCss = v === 'gradient-text'
    ? `background:linear-gradient(135deg,${tC},${accent});-webkit-background-clip:text;-webkit-text-fill-color:transparent;`
    : `color:${tC};`

  return `<div style="text-align:${align};margin-bottom:clamp(24px,4vw,40px);">
    ${badgeH}
    ${title ? `<h2 style="${tSz}font-weight:800;letter-spacing:-0.03em;line-height:1.15;${titleCss}text-align:${tA};">${title}</h2>` : ''}
    ${sub ? `<p style="${sSz}color:${sC};opacity:0.6;margin-top:10px;max-width:500px;text-align:${sA};${sA === 'center' ? 'margin-left:auto;margin-right:auto;' : ''}">${sub}</p>` : ''}
  </div>`
}

function fieldHTML(f: ContactField, s: ContactSectionData, lang: 'en' | 'ru'): string {
  const lbl = lang === 'ru' ? f.labelRu : f.label
  const ph = lang === 'ru' ? f.placeholderRu : f.placeholder
  const accent = s.accentColor || '#2dd4bf'
  const txt = s.textColor || '#fafafa'
  const inp = s.inputBg || '#1e1e1e'
  const base = `width:100%;padding:14px 16px;border:1px solid ${txt}15;border-radius:12px;background:${inp};color:${txt};font-size:14px;font-family:inherit;outline:none;transition:border-color 0.2s;`
  const req = f.required ? `<span style="color:${accent};"> *</span>` : ''

  let input = ''
  if (f.type === 'textarea') {
    input = `<textarea placeholder="${ph}" style="${base}min-height:120px;resize:vertical;" ${f.required ? 'required' : ''}></textarea>`
  } else if (f.type === 'select') {
    const opts = (lang === 'ru' && f.optionsRu ? f.optionsRu : f.options || '').split(',').filter(Boolean)
    const optHtml = opts.map(o => `<option value="${o.trim()}">${o.trim()}</option>`).join('')
    input = `<select style="${base}cursor:pointer;"><option value="">${ph}</option>${optHtml}</select>`
  } else {
    input = `<input type="${f.type === 'phone' ? 'tel' : f.type}" placeholder="${ph}" style="${base}" ${f.required ? 'required' : ''} />`
  }

  const lts = s.labelStyle || {}
  const lSz = lts.size ? `font-size:${lts.size}px;` : 'font-size:13px;'
  const lCl = lts.color ? `color:${lts.color};` : `color:${txt};`
  const lAl = lts.align ? `text-align:${lts.align};` : ''

  return `<div style="${f.type === 'textarea' ? '' : ''}">
    <label style="display:block;${lSz}font-weight:600;${lCl}margin-bottom:6px;${lAl}">${lbl}${req}</label>
    ${input}
  </div>`
}

function formHTML(s: ContactSectionData, lang: 'en' | 'ru', id: string): string {
  const accent = s.accentColor || '#2dd4bf'
  const btnT = lang === 'ru' ? s.btnTextRu : s.btnText
  const fields = s.fields.map(f => fieldHTML(f, s, lang)).join('')

  return `<form class="ct-form" onsubmit="event.preventDefault();var b=this.querySelector('.ct-btn');var m=this.closest('[id]').querySelector('.ct-success');b.disabled=true;b.textContent='...';setTimeout(function(){b.disabled=false;b.textContent='${btnT}';if(m){m.style.display='block';setTimeout(function(){m.style.display='none'},4000)}},800)" style="display:flex;flex-direction:column;gap:16px;">
    ${fields}
    <button type="submit" class="ct-btn" style="width:100%;padding:16px;border:none;border-radius:14px;background:${accent};color:${(s.btnStyle||{}).color||'#fff'};font-size:${(s.btnStyle||{}).size||15}px;font-weight:700;cursor:pointer;transition:opacity 0.2s;font-family:inherit;${(s.btnStyle||{}).align?'text-align:'+(s.btnStyle||{}).align+';':''}">${btnT}</button>
    <div class="ct-success" style="display:none;padding:12px 16px;border-radius:12px;background:${accent}22;color:${accent};font-size:14px;font-weight:500;text-align:center;">${lang === 'ru' ? s.successMsgRu : s.successMsg}</div>
  </form>`
}

function infoHTML(s: ContactSectionData, lang: 'en' | 'ru'): string {
  const txt = s.textColor || '#fafafa'
  const cardBg = s.cardBg || '#171717'
  const items = s.infoItems.map(it => {
    const lbl = lang === 'ru' ? it.labelRu : it.label
    const val = lang === 'ru' ? it.valueRu : it.value
    const inner = `<div style="display:flex;align-items:flex-start;gap:12px;padding:16px;border-radius:14px;background:${cardBg};border:1px solid ${txt}0a;">
      <span style="font-size:20px;flex-shrink:0;">${it.icon}</span>
      <div><p style="font-size:12px;font-weight:600;color:${txt}88;text-transform:uppercase;letter-spacing:0.05em;">${lbl}</p><p style="font-size:14px;font-weight:600;color:${txt};margin-top:2px;">${val}</p></div>
    </div>`
    return it.link ? `<a href="${it.link}" style="text-decoration:none;">${inner}</a>` : inner
  }).join('')
  return `<div style="display:flex;flex-direction:column;gap:10px;">${items}</div>`
}

function socialHTML(s: ContactSectionData): string {
  if (!s.showSocial || !s.socialLinks.length) return ''
  const accent = s.accentColor || '#2dd4bf'
  const links = s.socialLinks.map(sl =>
    `<a href="${sl.url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:${accent}15;font-size:18px;text-decoration:none;transition:background 0.2s;" title="${sl.label}">${sl.icon}</a>`
  ).join('')
  return `<div style="display:flex;gap:8px;margin-top:16px;">${links}</div>`
}

/* ─── CLASSIC ─── */
function renderClassic(s: ContactSectionData, lang: 'en' | 'ru', id: string): string {
  return `<div class="ct-anim" style="max-width:${Math.min(s.innerMaxWidth, 600)}px;margin:0 auto;">
    ${sectionHeader(s, lang, 'center')}
    ${formHTML(s, lang, id)}
  </div>`
}

/* ─── SPLIT ─── */
function renderSplit(s: ContactSectionData, lang: 'en' | 'ru', id: string): string {
  const txt = s.textColor || '#fafafa'
  return `<div class="ct-split" style="display:grid;grid-template-columns:1fr 1.2fr;gap:48px;max-width:${s.innerMaxWidth}px;margin:0 auto;align-items:start;">
    <div class="ct-anim">
      ${sectionHeader(s, lang, 'left')}
      ${infoHTML(s, lang)}
      ${socialHTML(s)}
    </div>
    <div class="ct-anim">
      <div style="padding:clamp(24px,4vw,40px);border-radius:24px;background:${s.cardBg || '#171717'};border:1px solid ${txt}08;">
        ${formHTML(s, lang, id)}
      </div>
    </div>
  </div>`
}

/* ─── MINIMAL ─── */
function renderMinimal(s: ContactSectionData, lang: 'en' | 'ru', id: string): string {
  const accent = s.accentColor || '#2dd4bf'
  const txt = s.textColor || '#fafafa'
  const inp = s.inputBg || '#1e1e1e'
  const emailPh = lang === 'ru' ? 'Ваш email' : 'Enter your email'
  const btnT = lang === 'ru' ? s.btnTextRu : s.btnText
  const succMsg = lang === 'ru' ? s.successMsgRu : s.successMsg

  return `<div class="ct-anim" style="max-width:${Math.min(s.innerMaxWidth, 700)}px;margin:0 auto;text-align:center;">
    ${sectionHeader(s, lang, 'center')}
    <form class="ct-minimal-form" onsubmit="event.preventDefault();var b=this.querySelector('.ct-btn');var m=this.closest('[id]').querySelector('.ct-success');b.disabled=true;b.textContent='...';setTimeout(function(){b.disabled=false;b.textContent='${btnT}';if(m){m.style.display='block';setTimeout(function(){m.style.display='none'},4000)}},800)" style="display:flex;gap:12px;max-width:500px;margin:0 auto;">
      <input type="email" required placeholder="${emailPh}" style="flex:1;padding:14px 18px;border:1px solid ${txt}15;border-radius:14px;background:${inp};color:${txt};font-size:14px;font-family:inherit;outline:none;" />
      <button type="submit" class="ct-btn" style="padding:14px 28px;border:none;border-radius:14px;background:${accent};color:#fff;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit;">${btnT}</button>
    </form>
    <div class="ct-success" style="display:none;margin-top:12px;padding:10px 16px;border-radius:12px;background:${accent}22;color:${accent};font-size:13px;font-weight:500;">${succMsg}</div>
    ${s.showSocial && s.socialLinks.length ? `<div style="margin-top:24px;">${socialHTML(s)}</div>` : ''}
  </div>`
}

/* ─── INFO CARDS ─── */
function renderInfocards(s: ContactSectionData, lang: 'en' | 'ru', id: string): string {
  const txt = s.textColor || '#fafafa'
  const cardBg = s.cardBg || '#171717'
  const accent = s.accentColor || '#2dd4bf'

  const cards = s.infoItems.map(it => {
    const lbl = lang === 'ru' ? it.labelRu : it.label
    const val = lang === 'ru' ? it.valueRu : it.value
    const inner = `<div class="ct-info-card" style="text-align:center;padding:clamp(20px,3vw,32px);border-radius:20px;background:${cardBg};border:1px solid ${txt}0a;transition:transform 0.3s,box-shadow 0.3s;">
      <div style="width:48px;height:48px;border-radius:14px;background:${accent}18;display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 12px;">${it.icon}</div>
      <p style="font-size:12px;font-weight:600;color:${txt}77;text-transform:uppercase;letter-spacing:0.05em;">${lbl}</p>
      <p style="font-size:15px;font-weight:700;color:${txt};margin-top:4px;">${val}</p>
    </div>`
    return it.link ? `<a href="${it.link}" style="text-decoration:none;">${inner}</a>` : inner
  }).join('')

  return `<div style="max-width:${s.innerMaxWidth}px;margin:0 auto;">
    ${sectionHeader(s, lang, 'center')}
    <div class="ct-anim ct-info-grid" style="display:grid;grid-template-columns:repeat(${Math.min(s.infoItems.length, 4)},1fr);gap:16px;margin-bottom:40px;">${cards}</div>
    <div class="ct-anim" style="max-width:600px;margin:0 auto;padding:clamp(24px,4vw,40px);border-radius:24px;background:${cardBg};border:1px solid ${txt}08;">
      ${formHTML(s, lang, id)}
    </div>
    ${s.showSocial && s.socialLinks.length ? `<div style="text-align:center;margin-top:24px;">${socialHTML(s)}</div>` : ''}
  </div>`
}

/* ═══════════ MAIN RENDER ═══════════ */
export function renderContact2HTML(section: ContactSectionData, lang: 'en' | 'ru'): string {
  const id = uid()
  const renderers: Record<string, (s: ContactSectionData, l: 'en' | 'ru', id: string) => string> = {
    classic: renderClassic,
    split: renderSplit,
    minimal: renderMinimal,
    infocards: renderInfocards,
  }
  const render = renderers[section.layout] || renderClassic
  const body = render(section, lang, id)

  const css = `<style>
${animCSS(id, section.animation)}
#${id} .ct-btn:hover{opacity:0.85;}
#${id} .ct-btn:disabled{opacity:0.5;cursor:not-allowed;}
#${id} input:focus,#${id} textarea:focus,#${id} select:focus{border-color:${section.accentColor || '#2dd4bf'} !important;}
#${id} .ct-info-card:hover{transform:translateY(-4px);box-shadow:0 16px 40px -12px rgba(0,0,0,0.4);}
@media(max-width:768px){
  #${id} .ct-split{grid-template-columns:1fr !important;}
  #${id} .ct-info-grid{grid-template-columns:1fr 1fr !important;}
  #${id} .ct-minimal-form{flex-direction:column !important;}
}
@media(max-width:480px){
  #${id} .ct-info-grid{grid-template-columns:1fr !important;}
}
</style>`

  return `${css}<div id="${id}" style="padding:clamp(48px,8vw,100px) clamp(16px,4vw,24px);${bgCSS(section)};color:${section.textColor || '#fafafa'};">${body}</div>`
}
