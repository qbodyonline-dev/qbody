/* ═══════════ COURSES BLOCK TYPES ═══════════ */

import type { TextStyle } from '../shared'

export type CourseLayout = 'grid' | 'list' | 'slider'
export type CourseTitleVariant = 'simple' | 'badge' | 'accent-line' | 'gradient-text'
export type CourseBgType = 'solid' | 'gradient' | 'image'

export interface CourseButton {
  text: string
  textRu: string
  link: string
  style: 'primary' | 'outline' | 'ghost'
}

export interface CourseItem2 {
  id: string
  title: string
  titleRu: string
  description: string
  descriptionRu: string
  price: number
  oldPrice?: number
  currency: string
  duration: string
  durationRu: string
  lessons: number
  icon: string
  gradient: string
  image?: string          // uploaded course image
  features: string[]
  featuresRu: string[]
  btn1: CourseButton
  btn2: CourseButton
  badge?: string
  badgeRu?: string
  popular?: boolean
}

export interface CourseSectionData {
  layout: CourseLayout
  titleVariant: CourseTitleVariant
  // Section header
  sectionBadge: string
  sectionBadgeRu: string
  sectionTitle: string
  sectionTitleRu: string
  sectionSubtitle: string
  sectionSubtitleRu: string
  sectionDescription: string
  sectionDescriptionRu: string
  // Section background
  bgType: CourseBgType
  bgColor: string
  bgGradient: string
  bgImage?: string
  // Card style
  cardBg: string
  cardBorder: string
  textColor: string
  accentColor: string
  // Grid settings
  columns: number         // 1-4
  gap: number            // px
  // Slider settings
  autoplay: boolean
  slidesPerView: number
  // Text styles
  titleStyle?: TextStyle
  subtitleStyle?: TextStyle
  badgeStyle?: TextStyle
  courseTitleStyle?: TextStyle
  courseDescStyle?: TextStyle
  priceStyle?: TextStyle
}
