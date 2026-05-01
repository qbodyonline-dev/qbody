import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Providers } from './providers'
import { getSiteSettings } from '@/lib/site-settings'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

const FALLBACK_SITE_URL = 'https://qbody.app'
const FALLBACK_SITE_NAME = 'Qbody by Khavanskaia'
const FALLBACK_TITLE = 'Qbody by Khavanskaia — Personal Fitness Training & Recovery Programs'
const FALLBACK_DESCRIPTION =
  'Professional personal training, weight loss programs, and post-surgery recovery courses by NASM-certified trainer Aleksandra Khavanskaia. 17+ years experience, 1000+ clients transformed. Online & in-person training in Las Vegas.'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#18181b' },
  ],
}

export async function generateMetadata(): Promise<Metadata> {
  const { general, branding, seo } = await getSiteSettings()

  const siteUrl = (seo.canonicalUrl || FALLBACK_SITE_URL).replace(/\/$/, '')
  const siteName = general.siteName || FALLBACK_SITE_NAME
  const title = seo.seoTitle || FALLBACK_TITLE
  const description = seo.seoDescription || general.tagline || FALLBACK_DESCRIPTION

  // Keywords: comma-split EN + RU
  const keywordsEn = (seo.seoKeywords || '').split(',').map(k => k.trim()).filter(Boolean)
  const keywordsRu = (seo.seoKeywordsRu || '').split(',').map(k => k.trim()).filter(Boolean)
  const keywords = [...keywordsEn, ...keywordsRu]
  const finalKeywords = keywords.length > 0 ? keywords : [
    'personal trainer', 'fitness programs', 'weight loss program', 'online personal training',
    'post surgery recovery', 'Aleksandra Khavanskaia', 'Qbody', 'QbodyFit',
  ]

  const ogImage = seo.ogImageUrl || `${siteUrl}/images/og-cover.jpg`

  // Robots: respect enableIndexing toggle
  const allowIndex = seo.enableIndexing !== false
  const robots: Metadata['robots'] = allowIndex
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      }
    : {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
      }

  // Verification — only attach keys that admin actually filled in
  const verification: NonNullable<Metadata['verification']> = {}
  if (seo.googleVerification && seo.googleVerification.trim()) {
    verification.google = seo.googleVerification.trim()
  }
  if (seo.yandexVerification && seo.yandexVerification.trim()) {
    verification.yandex = seo.yandexVerification.trim()
  }

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: finalKeywords,
    authors: [{ name: 'Aleksandra Khavanskaia', url: siteUrl }],
    creator: 'Aleksandra Khavanskaia',
    publisher: siteName,
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    manifest: '/manifest.webmanifest',
    openGraph: {
      type: 'website',
      locale: 'en_US',
      alternateLocale: 'ru_RU',
      url: siteUrl,
      siteName,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@qbody_fitness',
    },
    robots,
    alternates: {
      canonical: siteUrl,
      languages: {
        en: siteUrl,
        ru: `${siteUrl}?lang=ru`,
      },
    },
    ...(Object.keys(verification).length > 0 ? { verification } : {}),
    category: 'fitness',
    other: {
      'msapplication-TileColor': branding.primaryColor || '#14b8a6',
      'apple-mobile-web-app-title': (general.siteName || 'Qbody').slice(0, 24),
    },
  }
}

function JsonLd({
  siteUrl,
  siteName,
  description,
  email,
  phone,
  social,
}: {
  siteUrl: string
  siteName: string
  description: string
  email?: string
  phone?: string
  social: { instagram?: string; telegram?: string; whatsapp?: string }
}) {
  const sameAs = [social.instagram, social.telegram, social.whatsapp].filter(
    (u): u is string => !!u && /^https?:\/\//.test(u)
  )

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Aleksandra Khavanskaia',
    jobTitle: 'Certified Personal Trainer',
    url: siteUrl,
    image: `${siteUrl}/images/hero-alexandra.jpg`,
    sameAs: sameAs.length > 0 ? sameAs : ['https://instagram.com/qbody_fitness'],
    worksFor: { '@type': 'Organization', name: siteName, url: siteUrl },
    hasCredential: [
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'certification', name: 'NASM CPT' },
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'certification', name: 'NASM CES' },
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'certification', name: 'NASM PBC' },
    ],
    knowsAbout: ['Personal Training', 'Weight Loss', 'Post-Surgery Recovery', 'Nutrition'],
    address: { '@type': 'PostalAddress', addressLocality: 'Las Vegas', addressRegion: 'NV', addressCountry: 'US' },
  }

  const businessSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    image: `${siteUrl}/images/og-cover.jpg`,
    description,
    address: { '@type': 'PostalAddress', addressLocality: 'Las Vegas', addressRegion: 'NV', addressCountry: 'US' },
    priceRange: '$$',
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '127', bestRating: '5', worstRating: '1' },
    founder: { '@type': 'Person', name: 'Aleksandra Khavanskaia' },
  }
  if (email) businessSchema.email = email
  if (phone) businessSchema.telephone = phone

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
    </>
  )
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { general, branding, social, seo } = await getSiteSettings()

  const siteUrl = (seo.canonicalUrl || FALLBACK_SITE_URL).replace(/\/$/, '')
  const siteName = general.siteName || FALLBACK_SITE_NAME
  const description = seo.seoDescription || general.tagline || FALLBACK_DESCRIPTION

  // CSS variable for primary color (consumed by globals.css / components opting in)
  const primaryColor = branding.primaryColor || '#14b8a6'
  const cssVars = `:root { --brand-primary: ${primaryColor}; }`

  const gaId = (seo.gaTrackingId || '').trim()
  const gtmId = (seo.gtmId || '').trim()

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <JsonLd
          siteUrl={siteUrl}
          siteName={siteName}
          description={description}
          email={general.email}
          phone={general.phone}
          social={social}
        />
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        <link rel="preconnect" href="https://crybeycjfpyyxjgszcpu.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://crybeycjfpyyxjgszcpu.supabase.co" />

        {/* GTM head snippet */}
        {gtmId && (
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
        )}

        {/* Google Analytics 4 */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
            </Script>
          </>
        )}
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* GTM noscript iframe */}
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
