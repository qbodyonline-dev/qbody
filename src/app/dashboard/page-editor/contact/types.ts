/* ═══════════ CONTACT PRO TYPES ═══════════ */

export type ContactLayout = 'classic' | 'split' | 'minimal' | 'infocards'
export type ContactBgType = 'solid' | 'gradient' | 'image'
export type ContactAnimation = 'none' | 'fade-up' | 'slide-in' | 'scale-up'
export type ContactTitleVariant = 'simple' | 'badge' | 'accent-line' | 'gradient-text'
export type ContactFieldType = 'text' | 'email' | 'phone' | 'textarea' | 'select'

export interface ContactField {
  id: string
  type: ContactFieldType
  label: string
  labelRu: string
  placeholder: string
  placeholderRu: string
  required: boolean
  options?: string        // for select: "Option1,Option2,Option3"
  optionsRu?: string
}

export interface ContactInfoItem {
  id: string
  icon: string
  label: string
  labelRu: string
  value: string
  valueRu: string
  link?: string           // mailto:, tel:, https://
}

export interface ContactSocialLink {
  id: string
  icon: string
  label: string
  url: string
}

export interface ContactSectionData {
  layout: ContactLayout
  animation: ContactAnimation
  titleVariant: ContactTitleVariant
  // Header
  title: string
  titleRu: string
  subtitle: string
  subtitleRu: string
  badge: string
  badgeRu: string
  // Form
  fields: ContactField[]
  btnText: string
  btnTextRu: string
  successMsg: string
  successMsgRu: string
  formAction: string        // endpoint URL or mailto:
  // Info items (for split, infocards)
  infoItems: ContactInfoItem[]
  socialLinks: ContactSocialLink[]
  showSocial: boolean
  // Background
  bgType: ContactBgType
  bgColor: string
  bgGradient: string
  bgImage?: string
  // Colors
  textColor: string
  accentColor: string
  cardBg: string
  inputBg: string
  innerMaxWidth: number
}
