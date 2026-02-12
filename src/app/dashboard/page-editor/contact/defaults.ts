import type { ContactSectionData, ContactField, ContactInfoItem, ContactSocialLink } from './types'

export const defaultContactFields: ContactField[] = [
  { id: 'name', type: 'text', label: 'Name', labelRu: 'Имя', placeholder: 'Your name', placeholderRu: 'Ваше имя', required: true },
  { id: 'email', type: 'email', label: 'Email', labelRu: 'Email', placeholder: 'email@example.com', placeholderRu: 'email@example.com', required: true },
  { id: 'phone', type: 'phone', label: 'Phone', labelRu: 'Телефон', placeholder: '+1 (555) 000-0000', placeholderRu: '+7 (999) 000-00-00', required: false },
  { id: 'message', type: 'textarea', label: 'Message', labelRu: 'Сообщение', placeholder: 'How can we help you?', placeholderRu: 'Чем мы можем помочь?', required: true },
]

export const defaultContactInfo: ContactInfoItem[] = [
  { id: 'i1', icon: '📍', label: 'Location', labelRu: 'Адрес', value: 'Las Vegas, NV', valueRu: 'Лас-Вегас, Невада', link: '' },
  { id: 'i2', icon: '📧', label: 'Email', labelRu: 'Email', value: 'info@qbody.app', valueRu: 'info@qbody.app', link: 'mailto:info@qbody.app' },
  { id: 'i3', icon: '📱', label: 'Phone', labelRu: 'Телефон', value: '+1 (555) 000-0000', valueRu: '+1 (555) 000-0000', link: 'tel:+15550000000' },
  { id: 'i4', icon: '🕐', label: 'Hours', labelRu: 'Часы работы', value: 'Mon-Fri 9:00-18:00', valueRu: 'Пн-Пт 9:00-18:00', link: '' },
]

export const defaultSocialLinks: ContactSocialLink[] = [
  { id: 's1', icon: '📸', label: 'Instagram', url: 'https://instagram.com' },
  { id: 's2', icon: '💬', label: 'Telegram', url: 'https://t.me' },
  { id: 's3', icon: '📘', label: 'Facebook', url: 'https://facebook.com' },
]

export const defaultContactSectionData: ContactSectionData = {
  layout: 'classic',
  animation: 'fade-up',
  titleVariant: 'badge',
  title: 'Get in Touch',
  titleRu: 'Свяжитесь с нами',
  subtitle: 'Have questions? We\'d love to hear from you.',
  subtitleRu: 'Есть вопросы? Мы будем рады помочь.',
  badge: '✉️ Contact',
  badgeRu: '✉️ Контакты',
  fields: defaultContactFields,
  btnText: 'Send Message',
  btnTextRu: 'Отправить',
  successMsg: 'Thank you! We\'ll get back to you soon.',
  successMsgRu: 'Спасибо! Мы свяжемся с вами.',
  formAction: '',
  infoItems: defaultContactInfo,
  socialLinks: defaultSocialLinks,
  showSocial: true,
  bgType: 'solid',
  bgColor: '#0a0a0a',
  bgGradient: 'linear-gradient(135deg,#0a0a0a,#18181b)',
  textColor: '#fafafa',
  accentColor: '#2dd4bf',
  cardBg: '#171717',
  inputBg: '#1e1e1e',
  innerMaxWidth: 1000,
}
