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
