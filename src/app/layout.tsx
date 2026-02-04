import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

const siteUrl = 'https://qbody.app'
const siteName = 'Qbody by Khavanskaia'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#18181b' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Qbody by Khavanskaia — Personal Fitness Training & Recovery Programs',
    template: '%s | Qbody by Khavanskaia'
  },
  description: 'Professional personal training, weight loss programs, and post-surgery recovery courses by NASM-certified trainer Aleksandra Khavanskaia. 17+ years experience, 1000+ clients transformed. Online & in-person training in Las Vegas.',
  keywords: [
    'personal trainer', 'fitness programs', 'weight loss program', 'online personal training',
    'post surgery recovery', 'breast augmentation recovery', 'c-section recovery',
    'NASM certified trainer', 'women fitness', 'Las Vegas personal trainer',
    'fitness coaching', 'muscle gain program', 'beginner workout program',
    'Aleksandra Khavanskaia', 'Qbody', 'QbodyFit',
    'персональный тренер', 'фитнес программы', 'похудение', 'восстановление после операции',
  ],
  authors: [{ name: 'Aleksandra Khavanskaia', url: siteUrl }],
  creator: 'Aleksandra Khavanskaia',
  publisher: siteName,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#14b8a6' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ru_RU',
    url: siteUrl,
    siteName,
    title: 'Qbody by Khavanskaia — Personal Fitness Training & Recovery Programs',
    description: 'Professional personal training, weight loss programs, and post-surgery recovery courses by NASM-certified trainer Aleksandra Khavanskaia. 17+ years experience.',
    images: [
      {
        url: `${siteUrl}/images/og-cover.jpg`,
        width: 1200,
        height: 630,
        alt: 'Qbody by Khavanskaia — Personal Fitness Training & Recovery Programs',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Qbody by Khavanskaia — Personal Fitness Training',
    description: 'Professional personal training, weight loss programs, and post-surgery recovery courses. 17+ years experience, 1000+ clients.',
    images: [`${siteUrl}/images/og-cover.jpg`],
    creator: '@qbody_fitness',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      'en': siteUrl,
      'ru': `${siteUrl}?lang=ru`,
    },
  },
  verification: {
    google: 'GOOGLE_SITE_VERIFICATION_CODE',
    yandex: 'YANDEX_VERIFICATION_CODE',
  },
  category: 'fitness',
  other: {
    'msapplication-TileColor': '#14b8a6',
    'apple-mobile-web-app-title': 'Qbody',
  },
}

function JsonLd() {
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Aleksandra Khavanskaia',
    jobTitle: 'Certified Personal Trainer',
    url: siteUrl,
    image: `${siteUrl}/images/hero-alexandra.jpg`,
    sameAs: ['https://instagram.com/qbody_fitness'],
    worksFor: { '@type': 'Organization', name: siteName, url: siteUrl },
    hasCredential: [
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'certification', name: 'NASM CPT' },
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'certification', name: 'NASM CES' },
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'certification', name: 'NASM PBC' },
    ],
    knowsAbout: ['Personal Training', 'Weight Loss', 'Post-Surgery Recovery', 'Nutrition'],
    address: { '@type': 'PostalAddress', addressLocality: 'Las Vegas', addressRegion: 'NV', addressCountry: 'US' },
  }

  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    image: `${siteUrl}/images/og-cover.jpg`,
    description: 'Professional personal fitness training, weight loss programs, and post-surgery recovery courses.',
    email: 'info@qbody.app',
    telephone: '+1234567890',
    address: { '@type': 'PostalAddress', addressLocality: 'Las Vegas', addressRegion: 'NV', addressCountry: 'US' },
    priceRange: '$$',
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '127', bestRating: '5', worstRating: '1' },
    founder: { '@type': 'Person', name: 'Aleksandra Khavanskaia' },
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    potentialAction: { '@type': 'SearchAction', target: `${siteUrl}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
    </>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <JsonLd />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
