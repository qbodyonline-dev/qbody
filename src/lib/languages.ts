/**
 * Supported languages configuration.
 * primary_language — main site language (always shown)
 * secondary_language — optional second language (null = monolingual)
 *
 * The "_ru" columns in DB (name_ru, description_ru, etc.) serve as
 * secondary-language storage regardless of which language is chosen as secondary.
 */

export interface LanguageOption {
  code: string
  name: string       // English name
  nativeName: string // Name in that language
  flag: string       // Emoji flag
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English',    nativeName: 'English',    flag: '🇬🇧' },
  { code: 'ru', name: 'Russian',    nativeName: 'Русский',    flag: '🇷🇺' },
  { code: 'fr', name: 'French',     nativeName: 'Français',   flag: '🇫🇷' },
  { code: 'de', name: 'German',     nativeName: 'Deutsch',    flag: '🇩🇪' },
  { code: 'uk', name: 'Ukrainian',  nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'it', name: 'Italian',    nativeName: 'Italiano',   flag: '🇮🇹' },
  { code: 'es', name: 'Spanish',    nativeName: 'Español',    flag: '🇪🇸' },
  { code: 'ro', name: 'Romanian',   nativeName: 'Română',     flag: '🇷🇴' },
]

export const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map(l => l.code)

export const DEFAULT_PRIMARY_LANGUAGE = 'en'
export const DEFAULT_SECONDARY_LANGUAGE: string | null = 'ru'

export function getLanguageByCode(code: string): LanguageOption | undefined {
  return SUPPORTED_LANGUAGES.find(l => l.code === code)
}

export function isValidLanguageCode(code: string): boolean {
  return LANGUAGE_CODES.includes(code)
}

/** Language config as stored in site_settings */
export interface LanguageConfig {
  primaryLanguage: string
  secondaryLanguage: string | null
  isBilingual: boolean
}

/**
 * Field label helper for admin panel.
 * Returns label with language suffix, e.g. "Name (EN)" / "Name (RU)"
 */
export function fieldLabel(
  label: string,
  langCode: string,
  showSuffix: boolean = true
): string {
  if (!showSuffix) return label
  return `${label} (${langCode.toUpperCase()})`
}
