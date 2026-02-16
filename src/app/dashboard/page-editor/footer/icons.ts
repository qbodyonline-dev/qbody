/* ═══════════ FOOTER SVG ICONS ═══════════ */

export interface FooterIcon {
  key: string
  label: string
  svg: string
  category: 'social' | 'contact'
}

/** Get SVG string by key, with fallback to emoji/text */
export function getIconSVG(key: string, size = 18, color = 'currentColor'): string {
  const icon = ALL_ICONS.find(i => i.key === key)
  if (!icon) return `<span style="font-size:${size}px;line-height:1;">${key}</span>`
  return icon.svg.replace(/\{\{SIZE\}\}/g, String(size)).replace(/\{\{COLOR\}\}/g, color)
}

/** All available icons */
export const ALL_ICONS: FooterIcon[] = [
  // ─── Social ───
  {
    key: 'instagram',
    label: 'Instagram',
    category: 'social',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="5" stroke="{{COLOR}}" stroke-width="1.8"/><circle cx="12" cy="12" r="4.5" stroke="{{COLOR}}" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1.2" fill="{{COLOR}}"/></svg>`,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    category: 'social',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" stroke="{{COLOR}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    key: 'youtube',
    label: 'YouTube',
    category: 'social',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33 2.78 2.78 0 001.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.41z" stroke="{{COLOR}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" stroke="{{COLOR}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    key: 'telegram',
    label: 'Telegram',
    category: 'social',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.2 4.4L2.4 11.5c-.6.2-.6.7 0 .9l4.8 1.5 1.9 5.9c.1.4.6.5.9.3l2.7-2.2 5.3 3.9c.5.3 1.1.1 1.2-.5L22.4 5.3c.2-.7-.5-1.2-1.2-.9z" stroke="{{COLOR}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.1 13.9l-.3 4.1M9.1 13.9L18 7.2" stroke="{{COLOR}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    category: 'social',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21l1.65-3.8a9 9 0 113.15 2.85L3 21z" stroke="{{COLOR}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 10a1.5 1.5 0 001 1.5 6 6 0 002.5 2.5 1.5 1.5 0 001.5 1h.5a1 1 0 001-1v-.5a.5.5 0 00-.3-.5l-1.7-.7a.5.5 0 00-.6.1l-.4.5a.5.5 0 01-.6.1 6 6 0 01-2.4-2.4.5.5 0 01.1-.6l.5-.4a.5.5 0 00.1-.6l-.7-1.7A.5.5 0 009.5 7H9a1 1 0 00-1 1v.5a1.5 1.5 0 001 1.5z" stroke="{{COLOR}}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    key: 'twitter',
    label: 'X / Twitter',
    category: 'social',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4l6.6 8.5M4 4h4l12 16h-4M4 4l16 16M20 4L13.4 12.5M20 4h-4" stroke="{{COLOR}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    category: 'social',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" stroke="{{COLOR}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><rect x="2" y="9" width="4" height="12" stroke="{{COLOR}}" stroke-width="1.8"/><circle cx="4" cy="4" r="2" stroke="{{COLOR}}" stroke-width="1.8"/></svg>`,
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    category: 'social',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12a4 4 0 104 4V4a5 5 0 005 5" stroke="{{COLOR}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    key: 'pinterest',
    label: 'Pinterest',
    category: 'social',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="{{COLOR}}" stroke-width="1.8"/><path d="M8 21c1.1-3 2-5.5 2.5-7.5.5-1.8.3-3.2 1.5-3.2s2 1.3 1.5 3.2c-.3 1.2-.8 2.4-1 3 0 0 .5 1.5 2.5 1.5 3 0 4-3 4-5.5 0-3-2.5-5.5-6-5.5-4 0-6.5 3-6.5 5.8 0 1.5.7 2.5 1 3" stroke="{{COLOR}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    key: 'github',
    label: 'GitHub',
    category: 'social',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" stroke="{{COLOR}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    key: 'discord',
    label: 'Discord',
    category: 'social',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.3 4.6A18 18 0 0015.9 3a12 12 0 00-.6 1.2 16.7 16.7 0 00-6.6 0A12 12 0 008.1 3a18 18 0 00-4.4 1.6A19 19 0 001 18.6 18 18 0 006.6 21a13 13 0 001.1-1.8 12 12 0 01-1.8-.9l.5-.4a13 13 0 0011.2 0l.5.4a12 12 0 01-1.8.9A13 13 0 0017.4 21a18 18 0 005.6-12.4A18 18 0 0020.3 4.6z" stroke="{{COLOR}}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="13" r="1.5" fill="{{COLOR}}"/><circle cx="15" cy="13" r="1.5" fill="{{COLOR}}"/></svg>`,
  },
  {
    key: 'threads',
    label: 'Threads',
    category: 'social',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 7.5C17.5 4 14.5 2.5 12 2.5S6.5 4 5 7.5C4 9.5 3.5 12 4 14.5c.5 2.5 2 4.5 4 5.5 1 .5 2.5 1 4 1s3-.5 4-1c2-1 3.5-3 4-5.5.5-2.5 0-5-1-7z" stroke="{{COLOR}}" stroke-width="1.8"/><path d="M15.5 11.5c0 2-1.5 3.5-3.5 3.5s-3.5-1.5-3.5-3.5c0-1.5 1-2.8 2.3-3.3" stroke="{{COLOR}}" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  },
  {
    key: 'vk',
    label: 'VK',
    category: 'social',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="20" height="16" rx="4" stroke="{{COLOR}}" stroke-width="1.8"/><path d="M6.5 8.5h1.2s.2 3.8 1.8 4c0-1.3 0-3.2.1-4h1.5v5.5s1.5-.4 2-2.5h1.5c-.3 1.7-1.2 2.8-1.8 3.2.6.4 1.8 1.3 2.2 3.3h-1.7c-.3-1.5-1.3-2.5-2.2-2.8v2.8H9.8s0-3.5-1.5-3.7c0 1.2 0 2.5-.1 3.7H6.5V8.5z" stroke="{{COLOR}}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  // ─── Contact ───
  {
    key: 'email',
    label: 'Email',
    category: 'contact',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="20" height="16" rx="2" stroke="{{COLOR}}" stroke-width="1.8"/><path d="M22 4L12 13 2 4" stroke="{{COLOR}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    key: 'phone',
    label: 'Phone',
    category: 'contact',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="{{COLOR}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    key: 'location',
    label: 'Location',
    category: 'contact',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="{{COLOR}}" stroke-width="1.8"/><circle cx="12" cy="10" r="3" stroke="{{COLOR}}" stroke-width="1.8"/></svg>`,
  },
  {
    key: 'clock',
    label: 'Hours',
    category: 'contact',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="{{COLOR}}" stroke-width="1.8"/><path d="M12 6v6l4 2" stroke="{{COLOR}}" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  },
  {
    key: 'globe',
    label: 'Website',
    category: 'contact',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="{{COLOR}}" stroke-width="1.8"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="{{COLOR}}" stroke-width="1.8"/></svg>`,
  },
  {
    key: 'building',
    label: 'Office',
    category: 'contact',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="2" width="16" height="20" rx="1" stroke="{{COLOR}}" stroke-width="1.8"/><path d="M9 22v-4h6v4M8 6h2M14 6h2M8 10h2M14 10h2M8 14h2M14 14h2" stroke="{{COLOR}}" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  },
  {
    key: 'chat',
    label: 'Chat',
    category: 'contact',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="{{COLOR}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    key: 'link',
    label: 'Link',
    category: 'contact',
    svg: `<svg width="{{SIZE}}" height="{{SIZE}}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="{{COLOR}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="{{COLOR}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
]

export const SOCIAL_ICONS = ALL_ICONS.filter(i => i.category === 'social')
export const CONTACT_ICONS = ALL_ICONS.filter(i => i.category === 'contact')
