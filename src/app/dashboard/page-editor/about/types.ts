/* ═══════════ ABOUT2 BLOCK TYPES ═══════════ */

export type AboutLayout = 'classic' | 'centered' | 'split'
export type AboutTitleVariant = 'simple' | 'badge' | 'accent-line' | 'gradient-text'
export type AboutBgType = 'solid' | 'gradient' | 'image'
export type AboutAnimation = 'none' | 'fade-up' | 'slide-in' | 'scale-up'
export type AboutBlockType = 'text' | 'list' | 'grid-list' | 'stats' | 'cta'

export interface AboutContentBlock {
  id: string
  type: AboutBlockType
  icon: string           // emoji or number
  title: string
  titleRu: string
  // For text blocks
  text: string
  textRu: string
  // For list / grid-list blocks
  items: string[]
  itemsRu: string[]
  // For stats blocks
  stats: { value: string; label: string; labelRu: string }[]
  // For CTA blocks
  ctaText: string
  ctaTextRu: string
  ctaLink: string
  // Style
  bgStyle: 'dark' | 'light' | 'accent' | 'transparent'
}

export interface AboutSectionData {
  layout: AboutLayout
  animation: AboutAnimation
  titleVariant: AboutTitleVariant
  // Photo
  image: string
  imagePosition: 'left' | 'right'   // for classic/split
  // Name & info
  name: string
  sectionLabel: string
  sectionLabelRu: string
  tagline: string
  taglineRu: string
  tags: string[]
  tagsRu: string[]
  // Section background
  bgType: AboutBgType
  bgColor: string
  bgGradient: string
  bgImage?: string
  // Colors
  textColor: string
  accentColor: string
  cardBg: string
  // Content blocks
  blocks: AboutContentBlock[]
}
