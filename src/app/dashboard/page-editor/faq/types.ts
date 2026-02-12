/* ═══════════ FAQ PRO TYPES ═══════════ */

export type FaqLayout = 'accordion' | 'cards' | 'twocol' | 'sidebyside'
export type FaqBgType = 'solid' | 'gradient' | 'image'
export type FaqAnimation = 'none' | 'fade-up' | 'slide-in' | 'scale-up'
export type FaqTitleVariant = 'simple' | 'badge' | 'accent-line' | 'gradient-text'

export interface FaqItem {
  id: string
  question: string
  questionRu: string
  answer: string
  answerRu: string
  icon?: string
}

export interface FaqSectionData {
  layout: FaqLayout
  animation: FaqAnimation
  titleVariant: FaqTitleVariant
  // Section header
  title: string
  titleRu: string
  subtitle: string
  subtitleRu: string
  badge: string
  badgeRu: string
  // Background
  bgType: FaqBgType
  bgColor: string
  bgGradient: string
  bgImage?: string
  // Colors
  textColor: string
  accentColor: string
  cardBg: string
  // Items
  items: FaqItem[]
  // Options
  showNumbers: boolean
  showIcons: boolean
  defaultOpen: number     // -1 = all closed, 0+ = index of open item
  columns: number         // for twocol: 1-3
  innerMaxWidth: number
}
