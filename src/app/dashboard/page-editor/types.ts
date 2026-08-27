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

export type HeaderVariant = 'classic' | 'centered' | 'minimal' | 'split'
export type HeaderLogoPosition = 'left' | 'center'
export type HeaderNavPosition = 'left' | 'center' | 'right'

export interface HeaderTopBar {
  enabled: boolean
  text: string
  textRu: string
  link: string
  bgColor: string
  textColor: string
}

export interface HeaderData {
  variant: HeaderVariant
  logoText: string
  logoSubtext: string
  logoSubtextRu: string
  logoIcon: string
  logoGradient: string
  logoImage?: string
  logoPosition: HeaderLogoPosition
  navLinks: NavLink[]
  navPosition: HeaderNavPosition
  loginText: string
  loginTextRu: string
  loginLink: string
  ctaText: string
  ctaTextRu: string
  ctaLink: string
  bgColor: string
  bgOpacity: number
  textColor: string
  accentColor: string
  sticky: boolean
  topBar: HeaderTopBar
  // Text styles
  logoStyle?: import('./shared').TextStyle
  navStyle?: import('./shared').TextStyle
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
  // Badge photo (above badge text)
  badgeImage?: string
  badgeImageMaxWidth?: string
  badgeImageMaxHeight?: string
  badgeImageBorderRadius?: string
  badgeImageObjectFit?: 'cover' | 'contain' | 'fill' | 'none'
  badgeImagePaddingTop?: string
  badgeImagePaddingRight?: string
  badgeImagePaddingBottom?: string
  badgeImagePaddingLeft?: string
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
export type SectionData = HeaderData | HeroData | AboutData | HtmlBlockData | SliderData | HeroTemplateData

export type BlockType = 'header' | 'hero' | 'programs' | 'programsauto' | 'programs2' | 'courses' | 'courses2' | 'about' | 'about2' | 'cta2' | 'faq2' | 'contact2' | 'results' | 'footer' | 'footer2' | 'custom' | 'htmlblock' | 'slider' | 'herotemplate'

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

/* ═══════════ HTML BLOCK DATA ═══════════ */
export type AnimationType = 'none' | 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'bounce'

export interface HtmlBlockData {
  contentEn: string
  contentRu: string
  bgType: 'color' | 'gradient' | 'image' | 'video'
  bgColor: string
  bgGradient: string
  bgImage: string
  bgVideo: string
  overlayColor: string
  overlayOpacity: number
  layout: 'full' | 'boxed' | 'narrow'
  textAlign: 'left' | 'center' | 'right'
  minHeight: string
  animation: AnimationType
  animationDelay: number
  paddingY: string
  paddingX: string
}

/* ═══════════ SLIDER DATA ═══════════ */
export type SliderVariant = 'image' | 'testimonial' | 'content' | 'logo' | 'fullscreen'

export interface SliderSlide {
  id: string
  title: string
  titleRu: string
  description: string
  descriptionRu: string
  image: string
  buttonText: string
  buttonTextRu: string
  buttonLink: string
  bgColor: string
  bgGradient: string
  // Testimonial fields
  author: string
  authorRu: string
  authorRole: string
  authorRoleRu: string
  rating: number
}

export interface SliderData {
  variant: SliderVariant
  slides: SliderSlide[]
  autoplay: boolean
  autoplayInterval: number
  showArrows: boolean
  showDots: boolean
  slidesPerView: number
  gap: number
  animation: 'slide' | 'fade'
  titleEn: string
  titleRu: string
  subtitleEn: string
  subtitleRu: string
  bgColor: string
  height: string
  loop: boolean
  pauseOnHover: boolean
}

/* ═══════════ HERO TEMPLATE DATA ═══════════ */
export type HeroTemplateVariant = 'centered' | 'split' | 'videobg' | 'fullimage' | 'minimal'

export interface HeroTemplateButton {
  text: string
  textRu: string
  link: string
  variant: 'primary' | 'secondary' | 'outline' | 'ghost'
}

export interface HeroTemplateData {
  variant: HeroTemplateVariant
  badge: string
  badgeRu: string
  title: string
  titleRu: string
  subtitle: string
  subtitleRu: string
  description: string
  descriptionRu: string
  buttons: HeroTemplateButton[]
  bgType: 'gradient' | 'image' | 'video' | 'color'
  bgGradient: string
  bgColor: string
  bgImage: string
  bgVideo: string
  overlayColor: string
  overlayOpacity: number
  sideImage: string
  sideImagePosition: 'right' | 'left'
  textColor: string
  accentColor: string
  animation: AnimationType
  minHeight: string
  features: string[]
  featuresRu: string[]
  // Text styles
  titleStyle?: import('./shared').TextStyle
  subtitleStyle?: import('./shared').TextStyle
  descriptionStyle?: import('./shared').TextStyle
  badgeStyle?: import('./shared').TextStyle
}

/* Block type → icon mapping */
import { Code2, SlidersHorizontal, Sparkles, HelpCircle, Mail, Dumbbell } from 'lucide-react'
export const BLOCK_ICONS: Record<BlockType, any> = {
  header: Globe,
  hero: Layout,
  programs: Target,
  programsauto: Dumbbell,
  programs2: Dumbbell,
  courses: Video,
  courses2: Video,
  about: Users,
  about2: Users,
  cta2: Target,
  faq2: HelpCircle,
  contact2: Mail,
  results: Trophy,
  footer: FileText,
  footer2: FileText,
  custom: Settings2,
  htmlblock: Code2,
  slider: SlidersHorizontal,
  herotemplate: Sparkles,
}
