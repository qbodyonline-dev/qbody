import {
  Globe, Layout, Target, Video, Users, Trophy, FileText, Settings2
} from 'lucide-react'

/* ═══════════ TYPES ═══════════ */

export interface SectionStyle {
  bgColor?: string
  bgGradient?: string
  bgImage?: string
  paddingTop?: string
  paddingBottom?: string
  paddingLeft?: string
  paddingRight?: string
  marginTop?: string
  marginBottom?: string
  maxWidth?: string
  borderRadius?: string
  borderWidth?: string
  borderColor?: string
  boxShadow?: string
  cssClass?: string
  htmlId?: string
  customCss?: string
}

/* ═══════════ STRUCTURED ITEM TYPES ═══════════ */

export interface CourseItem {
  id: string
  title: string
  titleRu: string
  description: string
  descriptionRu: string
  price: number
  oldPrice?: number
  duration: string
  lessons: number
  icon: string  // emoji
  gradient: string
  features: string[]
  featuresRu: string[]
  link: string
}

export interface ProgramItem {
  id: string
  title: string
  titleRu: string
  description: string
  descriptionRu: string
  price: number
  duration: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'any'
  icon: string
  gradient: string
  features: string[]
  featuresRu: string[]
  link: string
  popular?: boolean
  soon?: boolean
}

export interface ResultItem {
  id: string
  name: string
  nameRu: string
  age: number
  result: string
  resultRu: string
  quote: string
  quoteRu: string
  icon: string
}

/* ═══════════ SECTION DATA TYPES ═══════════ */

export interface NavLink {
  id: string
  label: string
  labelRu: string
  href: string
}

export interface HeaderData {
  logoText: string
  logoIcon: string  // emoji or letter
  logoGradient: string
  logoImage?: string  // uploaded logo image URL
  navLinks: NavLink[]
  loginText: string
  loginTextRu: string
  loginLink: string
  ctaText: string
  ctaTextRu: string
  ctaLink: string
}

export interface HeroData {
  badge: string
  badgeRu: string
  title: string
  titleRu: string
  subtitle: string
  subtitleRu: string
  description: string
  descriptionRu: string
  primaryBtnText: string
  primaryBtnTextRu: string
  primaryBtnLink: string
  secondaryBtnText: string
  secondaryBtnTextRu: string
  secondaryBtnLink: string
  features: string[]
  featuresRu: string[]
  gradient: string
  heroImage?: string  // Optional hero image for two-column layout
  // Image style settings
  imageMaxWidth?: string   // e.g., "480px", "100%"
  imageMaxHeight?: string  // e.g., "600px", "auto"
  imagePaddingTop?: string
  imagePaddingBottom?: string
  imagePaddingLeft?: string
  imagePaddingRight?: string
  imageBorderRadius?: string  // e.g., "24px"
  imageObjectFit?: 'cover' | 'contain' | 'fill' | 'none'
}

export interface AboutStat {
  value: string
  label: string
  labelRu: string
}

export interface AboutData {
  image: string
  sectionLabel: string
  sectionLabelRu: string
  name: string
  tagline: string
  taglineRu: string
  tags?: string[]
  tagsRu?: string[]
  certificationsTitle: string
  certificationsTitleRu: string
  certifications: string[]
  certificationsRu: string[]
  careerTitle: string
  careerTitleRu: string
  career: string[]
  careerRu: string[]
  footer: string
  footerRu: string
  personalJourneyTitle?: string
  personalJourneyTitleRu?: string
  stats?: AboutStat[]
}

export type StructuredItems = CourseItem[] | ProgramItem[] | ResultItem[]
export type SectionData = HeaderData | HeroData | AboutData

export type BlockType = 'header' | 'hero' | 'programs' | 'courses' | 'about' | 'results' | 'footer' | 'custom'

export interface PageBlock {
  id: string
  type: BlockType
  label: string
  labelRu: string
  visible: boolean
  contentEn: string
  contentRu: string
  style: SectionStyle
  // Structured items for courses, programs, results blocks
  items?: StructuredItems
  // Section data for header, hero, about blocks
  data?: SectionData
}

/* Block type → icon mapping */
export const BLOCK_ICONS: Record<BlockType, any> = {
  header: Globe,
  hero: Layout,
  programs: Target,
  courses: Video,
  about: Users,
  results: Trophy,
  footer: FileText,
  custom: Settings2
}
