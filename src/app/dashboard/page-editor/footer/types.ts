/* ═══════════ FOOTER PRO TYPES ═══════════ */
import type { TextStyle } from '../shared'

export type FooterLayout = 'simple' | 'columns' | 'minimal' | 'cta-footer' | 'big' | 'split'
export type FooterBgType = 'solid' | 'gradient'

export interface FooterNavLink {
  id: string
  label: string
  labelRu: string
  href: string
}

export interface FooterNavColumn {
  id: string
  title: string
  titleRu: string
  links: FooterNavLink[]
}

export interface FooterSocialLink {
  id: string
  icon: string
  label: string
  url: string
}

export interface FooterContactItem {
  id: string
  icon: string
  text: string
  textRu: string
  link?: string
}

export interface FooterSectionData {
  layout: FooterLayout
  // Branding
  logoText: string
  logoIcon: string
  logoGradient: string
  logoImage?: string
  description: string
  descriptionRu: string
  // Navigation columns
  navColumns: FooterNavColumn[]
  showNav: boolean
  // Contact info
  contactItems: FooterContactItem[]
  showContact: boolean
  // Social links
  socialLinks: FooterSocialLink[]
  showSocial: boolean
  // CTA section (for cta-footer layout)
  ctaTitle: string
  ctaTitleRu: string
  ctaSubtitle: string
  ctaSubtitleRu: string
  ctaBtnText: string
  ctaBtnTextRu: string
  ctaBtnLink: string
  showCta: boolean
  // Copyright
  copyrightText: string
  copyrightTextRu: string
  // Background
  bgType: FooterBgType
  bgColor: string
  bgGradient: string
  // Colors
  textColor: string
  mutedColor: string
  accentColor: string
  borderColor: string
  // Spacing
  paddingY: number
  innerMaxWidth: number
  // Text styles
  logoStyle?: TextStyle
  descStyle?: TextStyle
  headingStyle?: TextStyle
}
