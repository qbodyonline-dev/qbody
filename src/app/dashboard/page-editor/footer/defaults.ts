import type { FooterSectionData } from './types'

export const defaultFooterSectionData: FooterSectionData = {
  layout: 'columns',
  // Branding
  logoText: 'Qbody',
  logoIcon: 'Q',
  logoGradient: 'linear-gradient(135deg,#2dd4bf,#0d9488)',
  description: 'Personal Fitness Training & Recovery Programs for Women',
  descriptionRu: 'Персональные тренировки и программы восстановления для женщин',
  // Navigation
  navColumns: [
    {
      id: 'nav1',
      title: 'Programs',
      titleRu: 'Программы',
      links: [
        { id: 'l1', label: 'Weight Loss', labelRu: 'Похудение', href: '#programs' },
        { id: 'l2', label: 'Muscle Gain', labelRu: 'Набор массы', href: '#programs' },
        { id: 'l3', label: 'Home Fitness', labelRu: 'Дома', href: '#programs' },
        { id: 'l4', label: 'Beginner', labelRu: 'Новичок', href: '#programs' },
      ]
    },
    {
      id: 'nav2',
      title: 'Courses',
      titleRu: 'Курсы',
      links: [
        { id: 'l5', label: 'Post-Surgery Recovery', labelRu: 'Восстановление', href: '#courses' },
        { id: 'l6', label: 'Post C-Section', labelRu: 'После кесарева', href: '#courses' },
      ]
    },
    {
      id: 'nav3',
      title: 'Company',
      titleRu: 'Компания',
      links: [
        { id: 'l7', label: 'About', labelRu: 'О нас', href: '#about' },
        { id: 'l8', label: 'Results', labelRu: 'Результаты', href: '#results' },
        { id: 'l9', label: 'Contact', labelRu: 'Контакты', href: '#contact' },
      ]
    },
  ],
  showNav: true,
  // Contact
  contactItems: [
    { id: 'c1', icon: 'email', text: 'info@qbody.app', textRu: 'info@qbody.app', link: 'mailto:info@qbody.app' },
    { id: 'c2', icon: 'location', text: 'Las Vegas, NV', textRu: 'Лас-Вегас, Невада' },
    { id: 'c3', icon: 'phone', text: '+1 (555) 123-4567', textRu: '+1 (555) 123-4567', link: 'tel:+15551234567' },
  ],
  showContact: true,
  // Social
  socialLinks: [
    { id: 's1', icon: 'instagram', label: 'Instagram', url: 'https://instagram.com' },
    { id: 's2', icon: 'facebook', label: 'Facebook', url: 'https://facebook.com' },
    { id: 's3', icon: 'youtube', label: 'YouTube', url: 'https://youtube.com' },
    { id: 's4', icon: 'telegram', label: 'Telegram', url: 'https://t.me' },
  ],
  showSocial: true,
  // CTA
  ctaTitle: 'Ready to Start Your Journey?',
  ctaTitleRu: 'Готовы начать свой путь?',
  ctaSubtitle: 'Join 1000+ women who transformed their bodies',
  ctaSubtitleRu: 'Присоединяйтесь к 1000+ женщинам',
  ctaBtnText: 'Get Started →',
  ctaBtnTextRu: 'Начать →',
  ctaBtnLink: '/auth/register',
  showCta: false,
  // Copyright
  copyrightText: '© 2025 Qbody. All rights reserved.',
  copyrightTextRu: '© 2025 Qbody. Все права защищены.',
  // Background
  bgType: 'solid',
  bgColor: '#0a0a0a',
  bgGradient: 'linear-gradient(180deg,#18181b,#0a0a0a)',
  // Colors
  textColor: '#ffffff',
  mutedColor: '#a1a1aa',
  accentColor: '#14b8a6',
  borderColor: '#27272a',
  // Spacing
  paddingY: 48,
  innerMaxWidth: 1100,
}

export const FOOTER_GRADIENTS = [
  'linear-gradient(180deg,#18181b,#0a0a0a)',
  'linear-gradient(180deg,#1e293b,#0f172a)',
  'linear-gradient(180deg,#1c1917,#0c0a09)',
  'linear-gradient(180deg,#172554,#0c1220)',
  'linear-gradient(180deg,#134e4a,#042f2e)',
  'linear-gradient(180deg,#3b0764,#1e0533)',
  'linear-gradient(180deg,#450a0a,#220505)',
  'linear-gradient(180deg,#0c4a6e,#082f49)',
]
