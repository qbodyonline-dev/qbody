/* ═══════════ PROGRAMS BLOCK TYPES ═══════════ */

import type { TextStyle } from '../shared/text-style'

/** grid — columns · slider — scroll-snap with arrows · carousel — continuous CSS marquee */
export type ProgramLayout = 'grid' | 'slider' | 'carousel'
export type ProgramTitleVariant = 'simple' | 'badge' | 'accent-line' | 'gradient-text'
export type ProgramBgType = 'solid' | 'gradient' | 'image'
export type ProgramSort = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'duration_asc' | 'duration_desc' | 'name'

export interface ProgramButton {
  text: string
  textRu: string
  link: string
  style: 'primary' | 'outline' | 'ghost'
}

/** One card. In the Pro block every field is typed by hand; in the auto block
 *  the same shape is built from a training_programs row. */
export interface ProgramItem2 {
  id: string
  title: string
  titleRu: string
  description: string
  descriptionRu: string
  price: number          // cents, 0 = no price shown
  oldPrice?: number      // cents
  currency: string
  duration: string       // "8 weeks"
  durationRu: string     // "8 недель"
  workouts?: number
  goal: string
  goalRu: string
  difficulty: string
  difficultyRu: string
  icon: string           // emoji, used when there is no image
  gradient: string
  image?: string
  features: string[]
  featuresRu: string[]
  btn1: ProgramButton
  btn2: ProgramButton
  badge?: string
  badgeRu?: string
  popular?: boolean
}

export interface ProgramSectionData {
  layout: ProgramLayout
  titleVariant: ProgramTitleVariant
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
  bgType: ProgramBgType
  bgColor: string
  bgGradient: string
  bgImage?: string
  // Card style
  cardBg: string
  cardBorder: string
  textColor: string
  accentColor: string
  // Grid
  columns: number        // 1-4
  gap: number            // px
  // Slider
  slidesPerView: number
  showArrows: boolean
  showDots: boolean
  // Carousel (CSS marquee)
  carouselSpeed: number  // seconds for one full loop
  carouselCardWidth: number // px
  // Card elements
  showImage: boolean
  showBadges: boolean
  showMeta: boolean
  showFeatures: boolean
  showPrice: boolean
  showButton: boolean
  featuresLimit: number
  // Text styles
  titleStyle?: TextStyle
  subtitleStyle?: TextStyle
  badgeStyle?: TextStyle
  cardTitleStyle?: TextStyle
  cardDescStyle?: TextStyle
  priceStyle?: TextStyle
}

/** Data of the auto block — no items, they come from the database. */
export interface ProgramAutoData {
  section: ProgramSectionData
  limit: number          // 0 = all
  sort: ProgramSort
  ctaText: string
  ctaTextRu: string
}

/** Data of the Pro block — everything is typed by hand. */
export interface Programs2Data {
  section: ProgramSectionData
  items: ProgramItem2[]
}

/** A training_programs row as the renderer needs it. */
export interface DbProgram {
  id: string
  slug: string | null
  name: string
  name_secondary: string | null
  description: string | null
  description_secondary: string | null
  hero_image_url: string | null
  duration_weeks: number | null
  goal: string | null
  difficulty: string | null
  price: number | null
  original_price: number | null
  features?: string[] | null
  features_secondary?: string[] | null
  includes?: string[] | null
  includes_secondary?: string[] | null
  created_at?: string | null
  program_days?: { is_rest_day: boolean; workout_id: string | null }[] | null
}

export const GOAL_LABELS: Record<string, { en: string; ru: string }> = {
  weight_loss: { en: 'Weight Loss', ru: 'Похудение' },
  muscle_gain: { en: 'Muscle Gain', ru: 'Набор массы' },
  endurance: { en: 'Endurance', ru: 'Выносливость' },
  recovery: { en: 'Recovery', ru: 'Восстановление' },
  general: { en: 'General', ru: 'Общая' },
  beginner: { en: 'Beginner', ru: 'Для новичков' },
  home: { en: 'Home', ru: 'Дома' },
}

export const DIFF_LABELS: Record<string, { en: string; ru: string }> = {
  beginner: { en: 'Beginner', ru: 'Начинающий' },
  intermediate: { en: 'Intermediate', ru: 'Средний' },
  advanced: { en: 'Advanced', ru: 'Продвинутый' },
}
