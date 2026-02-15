/**
 * Shared types for dynamic form system.
 * Used by: form-builder, dynamic-form-renderer, client checkins, onboarding
 */

export type FieldType = 'text' | 'textarea' | 'number' | 'scale' | 'select' | 'photo' | 'date' | 'toggle'

export interface FormField {
  id: string
  type: FieldType
  labelEn: string
  labelRu: string
  required: boolean
  placeholderEn?: string
  placeholderRu?: string
  options?: { en: string; ru: string }[]
  min?: number
  max?: number
  dbField?: string // maps to DB column
}

export interface FormTemplate {
  id: string
  name_en: string
  name_ru: string
  type: 'checkin' | 'onboarding' | 'custom'
  fields: FormField[]
  active: boolean
  created_at?: string
  updated_at?: string
}
