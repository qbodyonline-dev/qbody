import { MetadataRoute } from 'next'
import { getSiteSettings } from '@/lib/site-settings'

const FALLBACK_SITE_URL = 'https://qbody.app'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { seo } = await getSiteSettings()

  // If admin disabled sitemap generation — return an empty index.
  if (seo.enableSitemap === false) {
    return []
  }

  const siteUrl = (seo.canonicalUrl || FALLBACK_SITE_URL).replace(/\/$/, '')
  const now = new Date().toISOString()

  return [
    { url: siteUrl, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${siteUrl}/programs/weight-loss`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${siteUrl}/programs/muscle-gain`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${siteUrl}/programs/beginner`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${siteUrl}/courses/breast-augmentation-recovery`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/courses/cesarean-recovery`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
