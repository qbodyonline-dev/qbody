'use client'
import { useCallback } from 'react'

const SITE_KEY = '6LdXxWIsAAAAAFPfnxtk-jMOIn79sr7sqUl-tSP3'

// Load reCAPTCHA script once
let scriptLoaded = false
function loadScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve()
  if (typeof window === 'undefined') return Promise.resolve()
  
  // Check if already in DOM
  if (document.querySelector(`script[src*="recaptcha/api.js"]`)) {
    scriptLoaded = true
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`
    script.async = true
    script.onload = () => { scriptLoaded = true; resolve() }
    script.onerror = () => reject(new Error('reCAPTCHA script failed to load'))
    document.head.appendChild(script)
  })
}

export function useRecaptcha() {
  const execute = useCallback(async (action: string): Promise<string> => {
    await loadScript()
    
    return new Promise((resolve, reject) => {
      const w = window as any
      if (!w.grecaptcha) { reject(new Error('reCAPTCHA not loaded')); return }
      
      w.grecaptcha.ready(() => {
        w.grecaptcha
          .execute(SITE_KEY, { action })
          .then((token: string) => resolve(token))
          .catch((err: any) => reject(err))
      })
    })
  }, [])

  return { execute }
}
