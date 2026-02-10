'use client'

/**
 * Client-side HTML Sanitizer for QBody
 * Uses browser DOMParser to safely strip dangerous elements
 * Applied before any dangerouslySetInnerHTML rendering
 */

// Dangerous tags that can execute scripts
const DANGEROUS_TAGS = new Set([
  'script', 'iframe', 'object', 'embed', 'applet', 'form',
  'input', 'textarea', 'select', 'button', 'meta', 'link',
  'base', 'noscript', 'template',
])

// Dangerous attributes that can execute code
const DANGEROUS_ATTRS = new Set([
  'onabort', 'onblur', 'onchange', 'onclick', 'ondblclick',
  'onerror', 'onfocus', 'onkeydown', 'onkeypress', 'onkeyup',
  'onload', 'onmousedown', 'onmousemove', 'onmouseout',
  'onmouseover', 'onmouseup', 'onreset', 'onresize', 'onscroll',
  'onselect', 'onsubmit', 'onunload', 'onbeforeunload',
  'oncontextmenu', 'ondrag', 'ondragend', 'ondragenter',
  'ondragleave', 'ondragover', 'ondragstart', 'ondrop',
  'oninput', 'oninvalid', 'onpointerdown', 'onpointermove',
  'onpointerup', 'ontouchstart', 'ontouchend', 'ontouchmove',
  'onanimationstart', 'onanimationend', 'ontransitionend',
  'onwheel', 'onpaste', 'oncopy', 'oncut',
  // Also block formaction, xlink, etc
  'formaction', 'xlink:href', 'data-bind',
])

// Allowed URL schemes
const SAFE_URL_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:', '#', '/']

/**
 * Check if a URL is safe (no javascript:, data:text/html, vbscript:, etc.)
 */
function isSafeUrl(url: string): boolean {
  if (!url) return true
  const trimmed = url.trim().toLowerCase()
  
  // Allow relative URLs and anchors
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('.')) return true
  
  // Block dangerous schemes
  if (trimmed.startsWith('javascript:')) return false
  if (trimmed.startsWith('vbscript:')) return false
  if (trimmed.startsWith('data:text/html')) return false
  if (trimmed.startsWith('data:application')) return false
  
  // Allow safe schemes
  if (SAFE_URL_SCHEMES.some(scheme => trimmed.startsWith(scheme))) return true
  
  // Allow schemeless URLs (e.g., "example.com")
  if (!trimmed.includes(':')) return true
  
  // Block data: URIs except images
  if (trimmed.startsWith('data:image/')) return true
  if (trimmed.startsWith('data:')) return false
  
  return true
}

/**
 * Sanitize a single DOM element — remove dangerous attrs and check URLs
 */
function sanitizeElement(el: Element): void {
  // Remove all event handler attributes
  const attrsToRemove: string[] = []
  
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i]
    const name = attr.name.toLowerCase()
    
    // Remove event handlers (on*)
    if (name.startsWith('on')) {
      attrsToRemove.push(attr.name)
      continue
    }
    
    // Remove dangerous attributes
    if (DANGEROUS_ATTRS.has(name)) {
      attrsToRemove.push(attr.name)
      continue
    }
    
    // Check URLs in href, src, action, data, poster, background
    if (['href', 'src', 'action', 'data', 'poster', 'background', 'formaction'].includes(name)) {
      if (!isSafeUrl(attr.value)) {
        attrsToRemove.push(attr.name)
      }
    }
    
    // Check style attribute for url() with javascript
    if (name === 'style') {
      const styleVal = attr.value.toLowerCase()
      if (styleVal.includes('javascript:') || 
          styleVal.includes('expression(') || 
          styleVal.includes('vbscript:') ||
          styleVal.includes('data:text/html') ||
          styleVal.includes('-moz-binding')) {
        attrsToRemove.push(attr.name)
      }
    }
  }
  
  attrsToRemove.forEach(name => el.removeAttribute(name))
}

/**
 * Recursively walk DOM tree and sanitize all elements
 */
function walkAndSanitize(node: Node): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element
    const tagName = el.tagName.toLowerCase()
    
    // Remove dangerous tags entirely
    if (DANGEROUS_TAGS.has(tagName)) {
      el.parentNode?.removeChild(el)
      return
    }
    
    // Sanitize this element's attributes
    sanitizeElement(el)
  }
  
  // Walk children (copy to array since DOM may change during iteration)
  const children = Array.from(node.childNodes)
  children.forEach(child => walkAndSanitize(child))
}

/**
 * Main sanitize function — takes HTML string, returns sanitized HTML string
 * Uses browser DOMParser for reliable parsing
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') return ''
  if (typeof window === 'undefined') return html // SSR fallback — use server sanitizer
  
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Sanitize body content
    walkAndSanitize(doc.body)
    
    return doc.body.innerHTML
  } catch {
    // If parsing fails, return escaped version
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }
}

/**
 * Sanitize inline style object (e.g., bgImage can contain javascript: URLs)
 */
export function sanitizeStyleObj(style: Record<string, any>): Record<string, any> {
  if (!style || typeof style !== 'object') return {}
  
  const clean: Record<string, any> = { ...style }
  
  // Check bgImage for dangerous URLs
  if (clean.bgImage) {
    const img = String(clean.bgImage).toLowerCase().trim()
    if (img.includes('javascript:') || img.includes('data:text/html') || img.includes('vbscript:')) {
      delete clean.bgImage
    }
  }
  
  // Check bgGradient for injection
  if (clean.bgGradient) {
    const grad = String(clean.bgGradient).toLowerCase()
    if (grad.includes('javascript:') || grad.includes('expression(') || grad.includes('url(')) {
      // Allow only safe gradient syntax
      if (!grad.match(/^(linear|radial|conic)-gradient\(/)) {
        delete clean.bgGradient
      }
    }
  }
  
  // Check boxShadow for injection
  if (clean.boxShadow) {
    const shadow = String(clean.boxShadow).toLowerCase()
    if (shadow.includes('expression(') || shadow.includes('javascript:')) {
      delete clean.boxShadow
    }
  }
  
  // Check customCss for dangerous content
  if (clean.customCss) {
    const css = String(clean.customCss).toLowerCase()
    if (css.includes('expression(') || css.includes('javascript:') || 
        css.includes('-moz-binding') || css.includes('behavior:') ||
        css.includes('url(data:')) {
      delete clean.customCss
    }
  }
  
  return clean
}
