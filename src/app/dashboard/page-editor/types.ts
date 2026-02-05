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

export type StructuredItems = CourseItem[] | ProgramItem[] | ResultItem[]

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
