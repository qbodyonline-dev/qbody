import type { MetadataRoute } from 'next'
import { getSiteSettings } from '@/lib/site-settings'

const FALLBACK_NAME = 'Qbody by Khavanskaia'
const FALLBACK_SHORT = 'Qbody'
const FALLBACK_DESCRIPTION = 'Professional personal fitness training & recovery programs'
const FALLBACK_THEME = '#14b8a6'

export const revalidate = 60

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { app, branding, general, seo } = await getSiteSettings()

  const name = (app.appName || general.siteName || FALLBACK_NAME).trim()
  const shortName = (app.appName || FALLBACK_SHORT).trim()
  const themeColor = (app.appColor || branding.primaryColor || FALLBACK_THEME).trim()
  // Background can be either app.appColor or white
  const backgroundColor = '#ffffff'
  const description = (seo.seoDescription || general.tagline || FALLBACK_DESCRIPTION).trim()

  const icons: MetadataRoute.Manifest['icons'] = []

  // If admin uploaded a custom app icon — put it first (sizes 'any' since dimensions are unknown).
  if (app.appIconUrl) {
    icons.push({
      src: app.appIconUrl,
      sizes: 'any',
      type: 'image/png',
      purpose: 'any',
    })
    icons.push({
      src: app.appIconUrl,
      sizes: 'any',
      type: 'image/png',
      purpose: 'maskable',
    })
  }

  // Static fallbacks (always present so PWA install works even without admin upload).
  icons.push(
    { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
  )

  return {
    name,
    short_name: shortName.slice(0, 12),
    description,
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: backgroundColor,
    theme_color: themeColor,
    icons,
  }
}
