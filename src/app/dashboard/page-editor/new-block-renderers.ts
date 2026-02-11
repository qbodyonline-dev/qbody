import type { HtmlBlockData, SliderData, SliderSlide, HeroTemplateData, AnimationType } from './types'

/* ═══════════ ANIMATION CSS ═══════════ */
const ANIM_CSS: Record<AnimationType, string> = {
  none: '',
  fadeIn: 'opacity:0;animation:nbFadeIn 0.8s ease forwards;',
  slideUp: 'opacity:0;transform:translateY(40px);animation:nbSlideUp 0.8s ease forwards;',
  slideDown: 'opacity:0;transform:translateY(-40px);animation:nbSlideDown 0.8s ease forwards;',
  slideLeft: 'opacity:0;transform:translateX(40px);animation:nbSlideLeft 0.8s ease forwards;',
  slideRight: 'opacity:0;transform:translateX(-40px);animation:nbSlideRight 0.8s ease forwards;',
  scaleIn: 'opacity:0;transform:scale(0.9);animation:nbScaleIn 0.8s ease forwards;',
  bounce: 'opacity:0;animation:nbBounce 1s ease forwards;',
}

function animKeyframes(): string {
  return `
@keyframes nbFadeIn{to{opacity:1}}
@keyframes nbSlideUp{to{opacity:1;transform:translateY(0)}}
@keyframes nbSlideDown{to{opacity:1;transform:translateY(0)}}
@keyframes nbSlideLeft{to{opacity:1;transform:translateX(0)}}
@keyframes nbSlideRight{to{opacity:1;transform:translateX(0)}}
@keyframes nbScaleIn{to{opacity:1;transform:scale(1)}}
@keyframes nbBounce{0%{opacity:0;transform:translateY(40px)}60%{opacity:1;transform:translateY(-8px)}100%{opacity:1;transform:translateY(0)}}
`
}

function uid(): string { return 'nb' + Math.random().toString(36).slice(2, 8) }

/* ═══════════ HTML BLOCK RENDERER ═══════════ */
export function renderHtmlBlockHTML(data: HtmlBlockData, lang: 'en' | 'ru'): string {
  const id = uid()
  const content = lang === 'ru' ? data.contentRu : data.contentEn
  const maxW = data.layout === 'narrow' ? '800px' : data.layout === 'boxed' ? '1200px' : '100%'
  const anim = ANIM_CSS[data.animation || 'none']
  const delay = data.animationDelay ? `animation-delay:${data.animationDelay}ms;` : ''

  let bgStyle = ''
  if (data.bgType === 'gradient' && data.bgGradient) bgStyle = `background:${data.bgGradient};`
  else if (data.bgType === 'color' && data.bgColor) bgStyle = `background-color:${data.bgColor};`
  else if (data.bgType === 'image' && data.bgImage) bgStyle = `background-image:url(${data.bgImage});background-size:cover;background-position:center;`

  const hasOverlay = (data.bgType === 'image' || data.bgType === 'video') && data.overlayOpacity > 0
  const overlayDiv = hasOverlay
    ? `<div style="position:absolute;inset:0;background:${data.overlayColor || '#000'};opacity:${data.overlayOpacity};z-index:1;"></div>`
    : ''

  const videoDiv = data.bgType === 'video' && data.bgVideo
    ? `<video autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;"><source src="${data.bgVideo}" type="video/mp4"></video>`
    : ''

  return `<style>${animKeyframes()}</style>
<div id="${id}" style="position:relative;overflow:hidden;${bgStyle}min-height:${data.minHeight || 'auto'};padding:${data.paddingY || '60px'} ${data.paddingX || '20px'};text-align:${data.textAlign || 'center'};">
  ${videoDiv}${overlayDiv}
  <div style="position:relative;z-index:2;max-width:${maxW};margin:0 auto;${anim}${delay}">
    ${content || `<p style="color:#71717a;">Empty block — add content in the editor</p>`}
  </div>
</div>`
}

/* ═══════════ SLIDER RENDERER ═══════════ */
export function renderSliderHTML(data: SliderData, lang: 'en' | 'ru'): string {
  const id = uid()
  const slides = data.slides || []
  if (!slides.length) return `<div style="padding:60px 20px;text-align:center;color:#71717a;">No slides — add slides in the editor</div>`

  const title = lang === 'ru' ? data.titleRu : data.titleEn
  const subtitle = lang === 'ru' ? data.subtitleRu : data.subtitleEn
  const h = data.height || '500px'
  const perView = data.slidesPerView || 1
  const gap = data.gap || 0

  const headerHtml = (title || subtitle) ? `
    <div style="text-align:center;margin-bottom:40px;">
      ${subtitle ? `<p style="color:#2dd4bf;font-weight:600;font-size:14px;margin-bottom:12px;">${subtitle}</p>` : ''}
      ${title ? `<h2 style="font-size:36px;font-weight:800;color:#fafafa;letter-spacing:-0.02em;">${title}</h2>` : ''}
    </div>` : ''

  // Generate CSS for the slider
  let slidesHtml = ''
  let css = ''

  if (data.variant === 'testimonial') {
    slidesHtml = renderTestimonialSlides(slides, lang, id)
    css = testimonialCSS(id, slides.length, perView, gap, data.autoplay, data.autoplayInterval)
  } else if (data.variant === 'logo') {
    slidesHtml = renderLogoSlides(slides, id)
    css = logoCSS(id, slides.length, data.autoplayInterval)
  } else if (data.variant === 'fullscreen') {
    slidesHtml = renderFullscreenSlides(slides, lang, id)
    css = fullscreenCSS(id, slides.length, h, data.autoplay, data.autoplayInterval)
  } else if (data.variant === 'content') {
    slidesHtml = renderContentSlides(slides, lang, id)
    css = contentCSS(id, slides.length, perView, gap, data.autoplay, data.autoplayInterval)
  } else {
    // image carousel (default)
    slidesHtml = renderImageSlides(slides, lang, id)
    css = imageCSS(id, slides.length, h, data.autoplay, data.autoplayInterval)
  }

  const dots = data.showDots ? renderDots(slides.length, id) : ''
  const arrows = data.showArrows ? renderArrows(id) : ''

  return `<style>${css}${animKeyframes()}</style>
<div id="${id}" style="background:${data.bgColor || '#09090b'};padding:${data.variant === 'fullscreen' ? '0' : '60px 20px'};position:relative;overflow:hidden;">
  ${headerHtml}
  <div class="${id}-wrapper" style="position:relative;overflow:hidden;max-width:1200px;margin:0 auto;">
    <div class="${id}-track">
      ${slidesHtml}
    </div>
    ${arrows}
  </div>
  ${dots}
</div>
<script>
(function(){
  var el=document.getElementById('${id}');if(!el)return;
  var track=el.querySelector('.${id}-track');if(!track)return;
  var total=${slides.length},current=0,perView=${perView};
  var gap=${gap};
  function go(n){
    current=((n%total)+total)%total;
    var w=track.parentElement.offsetWidth;
    var slideW=(w-gap*(perView-1))/perView;
    track.style.transform='translateX(-'+(current*(slideW+gap))+'px)';
    // update dots
    el.querySelectorAll('.${id}-dot').forEach(function(d,i){
      d.style.background=i===current?'#14b8a6':'rgba(255,255,255,0.3)';
      d.style.width=i===current?'24px':'8px';
    });
  }
  var prev=el.querySelector('.${id}-prev'),next=el.querySelector('.${id}-next');
  if(prev)prev.onclick=function(){go(current-1)};
  if(next)next.onclick=function(){go(current+1)};
  ${data.autoplay ? `var iv=setInterval(function(){go(current+1)},${data.autoplayInterval || 4000});
  ${data.pauseOnHover ? `el.onmouseenter=function(){clearInterval(iv)};el.onmouseleave=function(){iv=setInterval(function(){go(current+1)},${data.autoplayInterval || 4000})};` : ''}` : ''}
  go(0);
})();
</script>`
}

function renderImageSlides(slides: SliderSlide[], lang: 'en' | 'ru', id: string): string {
  return slides.map((s, i) => {
    const t = lang === 'ru' ? s.titleRu : s.title
    const d = lang === 'ru' ? s.descriptionRu : s.description
    const btn = lang === 'ru' ? s.buttonTextRu : s.buttonText
    return `<div class="${id}-slide" style="flex-shrink:0;width:100%;position:relative;border-radius:16px;overflow:hidden;">
      ${s.image ? `<img src="${s.image}" alt="${t}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;" loading="${i === 0 ? 'eager' : 'lazy'}">` : ''}
      <div style="position:absolute;inset:0;background:linear-gradient(transparent 40%,rgba(0,0,0,0.8));z-index:1;"></div>
      <div style="position:relative;z-index:2;padding:40px;display:flex;flex-direction:column;justify-content:flex-end;min-height:100%;">
        ${t ? `<h3 style="font-size:32px;font-weight:800;color:#fff;margin-bottom:12px;">${t}</h3>` : ''}
        ${d ? `<p style="font-size:16px;color:rgba(255,255,255,0.8);margin-bottom:20px;max-width:600px;">${d}</p>` : ''}
        ${btn && s.buttonLink ? `<a href="${s.buttonLink}" style="display:inline-block;padding:12px 28px;border-radius:12px;background:#14b8a6;color:#fff;font-weight:600;text-decoration:none;width:fit-content;">${btn}</a>` : ''}
      </div>
    </div>`
  }).join('')
}

function renderTestimonialSlides(slides: SliderSlide[], lang: 'en' | 'ru', id: string): string {
  return slides.map(s => {
    const q = lang === 'ru' ? s.descriptionRu : s.description
    const name = lang === 'ru' ? (s.authorRu || s.author) : s.author
    const role = lang === 'ru' ? (s.authorRoleRu || s.authorRole) : s.authorRole
    const stars = '⭐'.repeat(s.rating || 5)
    return `<div class="${id}-slide" style="flex-shrink:0;background:#171717;border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:32px;">
      <div style="color:#eab308;font-size:14px;margin-bottom:16px;">${stars}</div>
      <p style="font-size:16px;color:#d4d4d8;line-height:1.7;margin-bottom:24px;font-style:italic;">"${q}"</p>
      <div style="display:flex;align-items:center;gap:12px;">
        ${s.image ? `<img src="${s.image}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;" alt="${name}">` : `<div style="width:44px;height:44px;border-radius:50%;background:#27272a;display:flex;align-items:center;justify-content:center;color:#71717a;font-weight:700;">${(name || '?')[0]}</div>`}
        <div>
          <p style="font-weight:600;color:#fafafa;font-size:14px;">${name}</p>
          ${role ? `<p style="color:#71717a;font-size:13px;">${role}</p>` : ''}
        </div>
      </div>
    </div>`
  }).join('')
}

function renderContentSlides(slides: SliderSlide[], lang: 'en' | 'ru', id: string): string {
  return slides.map(s => {
    const t = lang === 'ru' ? s.titleRu : s.title
    const d = lang === 'ru' ? s.descriptionRu : s.description
    const btn = lang === 'ru' ? s.buttonTextRu : s.buttonText
    return `<div class="${id}-slide" style="flex-shrink:0;display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:center;background:#171717;border:1px solid rgba(255,255,255,0.06);border-radius:20px;overflow:hidden;">
      ${s.image ? `<div style="height:100%;min-height:300px;"><img src="${s.image}" style="width:100%;height:100%;object-fit:cover;" alt="${t}" loading="lazy"></div>` : '<div style="min-height:300px;background:#27272a;"></div>'}
      <div style="padding:32px 32px 32px 0;">
        ${t ? `<h3 style="font-size:24px;font-weight:800;color:#fafafa;margin-bottom:12px;">${t}</h3>` : ''}
        ${d ? `<p style="font-size:15px;color:#a1a1aa;line-height:1.7;margin-bottom:24px;">${d}</p>` : ''}
        ${btn && s.buttonLink ? `<a href="${s.buttonLink}" style="display:inline-block;padding:10px 24px;border-radius:12px;background:#14b8a6;color:#fff;font-weight:600;text-decoration:none;">${btn}</a>` : ''}
      </div>
    </div>`
  }).join('')
}

function renderLogoSlides(slides: SliderSlide[], id: string): string {
  return slides.map(s => {
    return `<div class="${id}-slide" style="flex-shrink:0;display:flex;align-items:center;justify-content:center;padding:20px 32px;">
      ${s.image ? `<img src="${s.image}" style="max-height:48px;max-width:140px;object-fit:contain;filter:grayscale(1) brightness(2);opacity:0.5;transition:all 0.3s;" alt="${s.title}" loading="lazy">` : `<div style="color:#52525b;font-size:14px;font-weight:600;">${s.title}</div>`}
    </div>`
  }).join('')
}

function renderFullscreenSlides(slides: SliderSlide[], lang: 'en' | 'ru', id: string): string {
  return slides.map((s, i) => {
    const t = lang === 'ru' ? s.titleRu : s.title
    const d = lang === 'ru' ? s.descriptionRu : s.description
    const btn = lang === 'ru' ? s.buttonTextRu : s.buttonText
    const bg = s.bgGradient || s.bgColor || '#09090b'
    return `<div class="${id}-slide" style="flex-shrink:0;width:100%;min-height:100%;position:relative;">
      ${s.image ? `<img src="${s.image}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" alt="${t}" loading="${i === 0 ? 'eager' : 'lazy'}">` : `<div style="position:absolute;inset:0;background:${bg};"></div>`}
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.5);z-index:1;"></div>
      <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 20px;min-height:inherit;">
        ${t ? `<h2 style="font-size:48px;font-weight:800;color:#fff;margin-bottom:16px;max-width:800px;">${t}</h2>` : ''}
        ${d ? `<p style="font-size:18px;color:rgba(255,255,255,0.8);margin-bottom:32px;max-width:600px;">${d}</p>` : ''}
        ${btn && s.buttonLink ? `<a href="${s.buttonLink}" style="padding:14px 36px;border-radius:14px;background:#14b8a6;color:#fff;font-weight:600;font-size:16px;text-decoration:none;">${btn}</a>` : ''}
      </div>
    </div>`
  }).join('')
}

function renderDots(count: number, id: string): string {
  const dots = Array.from({ length: count }, (_, i) =>
    `<button class="${id}-dot" style="width:${i === 0 ? '24px' : '8px'};height:8px;border-radius:4px;background:${i === 0 ? '#14b8a6' : 'rgba(255,255,255,0.3)'};border:none;cursor:pointer;transition:all 0.3s;"></button>`
  ).join('')
  return `<div style="display:flex;justify-content:center;gap:6px;margin-top:24px;">${dots}</div>`
}

function renderArrows(id: string): string {
  return `
    <button class="${id}-prev" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);z-index:10;width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.1);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;backdrop-filter:blur(8px);transition:all 0.2s;">‹</button>
    <button class="${id}-next" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);z-index:10;width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.1);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;backdrop-filter:blur(8px);transition:all 0.2s;">›</button>`
}

function imageCSS(id: string, count: number, h: string, auto: boolean, interval: number): string {
  return `.${id}-track{display:flex;transition:transform 0.5s cubic-bezier(0.4,0,0.2,1);height:${h};}.${id}-slide{width:100%;}`
}

function testimonialCSS(id: string, count: number, perView: number, gap: number, auto: boolean, interval: number): string {
  return `.${id}-track{display:flex;gap:${gap}px;transition:transform 0.5s cubic-bezier(0.4,0,0.2,1);}`
}

function contentCSS(id: string, count: number, perView: number, gap: number, auto: boolean, interval: number): string {
  return `.${id}-track{display:flex;gap:${gap}px;transition:transform 0.5s cubic-bezier(0.4,0,0.2,1);}`
}

function logoCSS(id: string, count: number, interval: number): string {
  return `.${id}-track{display:flex;gap:0;animation:${id}Scroll ${(count * 3)}s linear infinite;}@keyframes ${id}Scroll{0%{transform:translateX(0)}100%{transform:translateX(-${count * 200}px)}}`
}

function fullscreenCSS(id: string, count: number, h: string, auto: boolean, interval: number): string {
  return `.${id}-wrapper{height:${h};}.${id}-track{display:flex;transition:transform 0.6s cubic-bezier(0.4,0,0.2,1);height:100%;}.${id}-slide{width:100%;min-height:${h};}`
}

/* ═══════════ HERO TEMPLATE RENDERER ═══════════ */
export function renderHeroTemplateHTML(data: HeroTemplateData, lang: 'en' | 'ru'): string {
  const id = uid()
  const v = data.variant || 'centered'
  const badge = lang === 'ru' ? data.badgeRu : data.badge
  const title = lang === 'ru' ? data.titleRu : data.title
  const subtitle = lang === 'ru' ? data.subtitleRu : data.subtitle
  const desc = lang === 'ru' ? data.descriptionRu : data.description
  const feats = lang === 'ru' ? data.featuresRu : data.features
  const accent = data.accentColor || '#2dd4bf'
  const txtColor = data.textColor || '#ffffff'
  const minH = data.minHeight || '100vh'
  const anim = ANIM_CSS[data.animation || 'fadeIn']

  const buttonsHtml = (data.buttons || []).map(btn => {
    const text = lang === 'ru' ? btn.textRu : btn.text
    if (!text) return ''
    const style = btn.variant === 'primary'
      ? `background:${accent};color:#fff;font-weight:600;`
      : btn.variant === 'outline'
      ? `border:1px solid rgba(255,255,255,0.3);color:${txtColor};`
      : btn.variant === 'ghost'
      ? `color:${txtColor};`
      : `background:rgba(255,255,255,0.1);color:${txtColor};`
    return `<a href="${btn.link}" style="display:inline-flex;align-items:center;padding:14px 32px;border-radius:14px;font-size:16px;text-decoration:none;transition:all 0.2s;${style}">${text}</a>`
  }).filter(Boolean).join('')

  const featHtml = feats?.length ? `<div style="display:flex;flex-wrap:wrap;gap:16px;${v === 'centered' ? 'justify-content:center;' : ''}margin-top:12px;">${feats.map(f => `<span style="font-size:14px;color:${accent};">✓ ${f}</span>`).join('')}</div>` : ''

  // Background
  let bgStyle = ''
  if (data.bgType === 'gradient') bgStyle = `background:${data.bgGradient || 'linear-gradient(135deg,#0f766e,#18181b)'};`
  else if (data.bgType === 'color') bgStyle = `background:${data.bgColor || '#09090b'};`
  else if (data.bgType === 'image') bgStyle = `background-image:url(${data.bgImage});background-size:cover;background-position:center;`

  const overlay = (data.bgType === 'image' || data.bgType === 'video') && data.overlayOpacity > 0
    ? `<div style="position:absolute;inset:0;background:${data.overlayColor || '#000'};opacity:${data.overlayOpacity};z-index:1;"></div>` : ''

  const video = data.bgType === 'video' && data.bgVideo
    ? `<video autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;"><source src="${data.bgVideo}" type="video/mp4"></video>` : ''

  const textBlock = `
    ${badge ? `<p style="color:${accent};font-weight:600;font-size:14px;letter-spacing:0.05em;margin-bottom:16px;">⭐ ${badge}</p>` : ''}
    ${title ? `<h1 style="font-size:clamp(32px,5vw,56px);font-weight:800;color:${txtColor};letter-spacing:-0.02em;line-height:1.1;margin-bottom:8px;">${title}</h1>` : ''}
    ${subtitle ? `<h2 style="font-size:clamp(28px,4vw,48px);font-weight:800;color:${accent};letter-spacing:-0.02em;line-height:1.1;margin-bottom:24px;">${subtitle}</h2>` : ''}
    ${desc ? `<p style="font-size:18px;color:rgba(255,255,255,0.7);max-width:600px;line-height:1.7;margin-bottom:32px;${v === 'centered' ? 'margin-left:auto;margin-right:auto;' : ''}">${desc}</p>` : ''}
    ${buttonsHtml ? `<div style="display:flex;gap:12px;flex-wrap:wrap;${v === 'centered' ? 'justify-content:center;' : ''}">${buttonsHtml}</div>` : ''}
    ${featHtml}`

  if (v === 'split') {
    const imgSide = data.sideImage
      ? `<div style="flex:1;min-width:300px;"><img src="${data.sideImage}" style="width:100%;max-height:600px;object-fit:cover;border-radius:24px;" alt="" loading="eager"></div>`
      : ''
    const order = data.sideImagePosition === 'left' ? 'flex-direction:row-reverse;' : ''
    return `<style>${animKeyframes()}</style>
<div id="${id}" style="position:relative;overflow:hidden;${bgStyle}min-height:${minH};display:flex;align-items:center;">
  ${video}${overlay}
  <div style="position:relative;z-index:2;max-width:1200px;margin:0 auto;padding:80px 24px 60px;display:flex;gap:48px;align-items:center;flex-wrap:wrap;${order}${anim}">
    <div style="flex:1;min-width:320px;">${textBlock}</div>
    ${imgSide}
  </div>
</div>`
  }

  // centered, fullimage, videobg, minimal
  const align = v === 'minimal' ? 'text-align:left;' : 'text-align:center;'
  const padding = v === 'minimal' ? 'padding:80px 24px 60px;max-width:800px;' : 'padding:80px 24px 60px;'

  return `<style>${animKeyframes()}</style>
<div id="${id}" style="position:relative;overflow:hidden;${bgStyle}min-height:${minH};display:flex;align-items:center;justify-content:center;">
  ${video}${overlay}
  <div style="position:relative;z-index:2;${padding}${align}width:100%;${anim}">
    ${textBlock}
  </div>
</div>`
}

/* ═══════════ DEFAULT DATA FACTORIES ═══════════ */
export function defaultHtmlBlockData(): HtmlBlockData {
  return {
    contentEn: '<h2 style="font-size:36px;font-weight:800;color:#fafafa;margin-bottom:16px;">Your Content Here</h2><p style="font-size:16px;color:#a1a1aa;max-width:600px;margin:0 auto;">Add any custom HTML content with full styling control.</p>',
    contentRu: '<h2 style="font-size:36px;font-weight:800;color:#fafafa;margin-bottom:16px;">Ваш контент</h2><p style="font-size:16px;color:#a1a1aa;max-width:600px;margin:0 auto;">Добавьте HTML-контент с полным контролем стилей.</p>',
    bgType: 'color', bgColor: '#09090b', bgGradient: 'linear-gradient(135deg,#0f766e,#18181b)',
    bgImage: '', bgVideo: '', overlayColor: '#000000', overlayOpacity: 0.5,
    layout: 'boxed', textAlign: 'center', minHeight: 'auto',
    animation: 'fadeIn', animationDelay: 0, paddingY: '60px', paddingX: '20px',
  }
}

export function defaultSliderSlide(): SliderSlide {
  return {
    id: 'sl_' + Date.now() + Math.random().toString(36).slice(2, 6),
    title: 'Slide Title', titleRu: 'Заголовок слайда',
    description: 'Description text', descriptionRu: 'Описание слайда',
    image: '', buttonText: 'Learn More', buttonTextRu: 'Подробнее', buttonLink: '#',
    bgColor: '#171717', bgGradient: '',
    author: '', authorRu: '', authorRole: '', authorRoleRu: '', rating: 5,
  }
}

export function defaultSliderData(): SliderData {
  return {
    variant: 'image',
    slides: [defaultSliderSlide(), { ...defaultSliderSlide(), id: 'sl_' + Date.now() + 'b', title: 'Second Slide', titleRu: 'Второй слайд' }],
    autoplay: true, autoplayInterval: 4000,
    showArrows: true, showDots: true,
    slidesPerView: 1, gap: 20, animation: 'slide',
    titleEn: '', titleRu: '', subtitleEn: '', subtitleRu: '',
    bgColor: '#09090b', height: '500px', loop: true, pauseOnHover: true,
  }
}

export function defaultHeroTemplateData(): HeroTemplateData {
  return {
    variant: 'centered',
    badge: 'NEW SECTION', badgeRu: 'НОВЫЙ РАЗДЕЛ',
    title: 'Your Amazing Title', titleRu: 'Ваш заголовок',
    subtitle: 'Colored Subtitle', subtitleRu: 'Цветной подзаголовок',
    description: 'Compelling description that makes visitors take action.',
    descriptionRu: 'Описание, которое заставляет посетителей действовать.',
    buttons: [
      { text: 'Get Started', textRu: 'Начать', link: '/auth/register', variant: 'primary' },
      { text: 'Learn More', textRu: 'Подробнее', link: '#about', variant: 'outline' },
    ],
    bgType: 'gradient', bgGradient: 'linear-gradient(135deg,#0f766e 0%,#18181b 100%)',
    bgColor: '#09090b', bgImage: '', bgVideo: '',
    overlayColor: '#000000', overlayOpacity: 0.5,
    sideImage: '', sideImagePosition: 'right',
    textColor: '#ffffff', accentColor: '#2dd4bf',
    animation: 'slideUp', minHeight: '80vh',
    features: ['Feature one', 'Feature two', 'Feature three'],
    featuresRu: ['Преимущество 1', 'Преимущество 2', 'Преимущество 3'],
  }
}
