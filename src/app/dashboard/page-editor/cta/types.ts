/* ═══════════ CTA PRO TYPES ═══════════ */
import type { TextStyle } from '../shared'

export type CtaLayout = 'banner' | 'split' | 'minimal' | 'fullwidth'
export type CtaBgType = 'solid' | 'gradient' | 'image'
export type CtaAnimation = 'none' | 'fade-up' | 'pulse' | 'slide-in'
export type CtaBtnStyle = 'solid-white' | 'solid-dark' | 'solid-accent' | 'outline-white' | 'outline-accent' | 'ghost'

export interface CtaButton {
  text: string
  textRu: string
  link: string
  style: CtaBtnStyle
}

export interface CtaFeature {
  icon: string
  text: string
  textRu: string
}

export interface CtaSectionData {
  layout: CtaLayout
  animation: CtaAnimation
  // Titles
  title: string
  titleRu: string
  subtitle: string
  subtitleRu: string
  description: string
  descriptionRu: string
  // Badge / eyebrow
  badge: string
  badgeRu: string
  // Buttons
  btn1: CtaButton
  btn2: CtaButton
  showBtn2: boolean
  // Features / trust signals
  features: CtaFeature[]
  showFeatures: boolean
  // Image (for split / fullwidth)
  image: string
  imagePosition: 'left' | 'right'
  // Background
  bgType: CtaBgType
  bgColor: string
  bgGradient: string
  bgImage?: string
  overlayOpacity: number       // 0-1 for fullwidth
  // Colors
  textColor: string
  accentColor: string
  // Text styles
  titleStyle?: TextStyle
  subtitleStyle?: TextStyle
  descriptionStyle?: TextStyle
  badgeStyle?: TextStyle
  // Spacing
  borderRadius: number         // px
  paddingY: number             // px
  innerMaxWidth: number        // px
}
