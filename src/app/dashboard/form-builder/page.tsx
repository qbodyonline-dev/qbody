'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { fetchWithAuth } from '@/lib/api'
import {
  Plus, Trash2, GripVertical, Save, Eye, Copy, Settings,
  Type, Hash, Star, List, Camera, Calendar, ToggleLeft, AlignLeft,
  ChevronDown, ChevronUp, Edit, Check, X, FileText, ClipboardCheck, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

import type { FieldType, FormField, FormTemplate } from '@/lib/form-types'
export type { FormField } from '@/lib/form-types'

const fieldTypeConfig: Record<FieldType, { icon: any; labelEn: string; labelRu: string; color: string }> = {
  text: { icon: Type, labelEn: 'Short text', labelRu: 'Короткий текст', color: 'bg-blue-100 text-blue-600' },
  textarea: { icon: AlignLeft, labelEn: 'Long text', labelRu: 'Длинный текст', color: 'bg-indigo-100 text-indigo-600' },
  number: { icon: Hash, labelEn: 'Number', labelRu: 'Число', color: 'bg-green-100 text-green-600' },
  scale: { icon: Star, labelEn: 'Scale 1-10', labelRu: 'Шкала 1-10', color: 'bg-amber-100 text-amber-600' },
  select: { icon: List, labelEn: 'Dropdown', labelRu: 'Выбор', color: 'bg-purple-100 text-purple-600' },
  photo: { icon: Camera, labelEn: 'Photo upload', labelRu: 'Загрузка фото', color: 'bg-pink-100 text-pink-600' },
  date: { icon: Calendar, labelEn: 'Date', labelRu: 'Дата', color: 'bg-teal-100 text-teal-600' },
  toggle: { icon: ToggleLeft, labelEn: 'Yes / No', labelRu: 'Да / Нет', color: 'bg-orange-100 text-orange-600' },
}

/* Default templates for initial seed */
const defaultCheckinFields: FormField[] = [
  { id: 'f1', type: 'number', labelEn: 'Weight (kg)', labelRu: 'Вес (кг)', required: true, dbField: 'weight' },
  { id: 'f2', type: 'number', labelEn: 'Waist (cm)', labelRu: 'Талия (см)', required: false, dbField: 'waist' },
  { id: 'f3', type: 'number', labelEn: 'Hips (cm)', labelRu: 'Бёдра (см)', required: false, dbField: 'hips' },
  { id: 'f4', type: 'number', labelEn: 'Chest (cm)', labelRu: 'Грудь (см)', required: false, dbField: 'chest' },
  { id: 'f5', type: 'number', labelEn: 'Thigh (cm)', labelRu: 'Бедро (см)', required: false, dbField: 'thigh' },
  { id: 'f6', type: 'number', labelEn: 'Arm (cm)', labelRu: 'Рука (см)', required: false, dbField: 'arm' },
  { id: 'f7', type: 'number', labelEn: 'Body fat %', labelRu: '% жира', required: false, dbField: 'body_fat_pct' },
  { id: 'f8', type: 'scale', labelEn: 'Sleep quality', labelRu: 'Качество сна', required: false, min: 1, max: 10, dbField: 'sleep_quality' },
  { id: 'f9', type: 'number', labelEn: 'Sleep hours', labelRu: 'Часов сна', required: false, dbField: 'sleep_hours' },
  { id: 'f10', type: 'scale', labelEn: 'Energy level', labelRu: 'Энергия', required: false, min: 1, max: 10, dbField: 'energy_level' },
  { id: 'f11', type: 'scale', labelEn: 'Stress level', labelRu: 'Стресс', required: false, min: 1, max: 10, dbField: 'stress_level' },
  { id: 'f12', type: 'scale', labelEn: 'Appetite', labelRu: 'Аппетит', required: false, min: 1, max: 10, dbField: 'appetite' },
  { id: 'f13', type: 'scale', labelEn: 'Soreness', labelRu: 'Болезненность', required: false, min: 1, max: 10, dbField: 'soreness' },
  { id: 'f14', type: 'number', labelEn: 'Cycle day', labelRu: 'День цикла', required: false, dbField: 'cycle_day' },
  { id: 'f15', type: 'textarea', labelEn: 'Cycle notes', labelRu: 'Заметки по циклу', required: false, dbField: 'cycle_notes' },
  { id: 'f16', type: 'textarea', labelEn: 'Comment', labelRu: 'Комментарий', required: false, dbField: 'comment' },
]

const defaultOnboardingFields: FormField[] = [
  { id: 'o1', type: 'text', labelEn: 'Full name', labelRu: 'ФИО', required: true, dbField: 'full_name' },
  { id: 'o2', type: 'date', labelEn: 'Date of birth', labelRu: 'Дата рождения', required: true, dbField: 'date_of_birth' },
  { id: 'o3', type: 'number', labelEn: 'Height (cm)', labelRu: 'Рост (см)', required: true, dbField: 'height' },
  { id: 'o4', type: 'number', labelEn: 'Current weight (kg)', labelRu: 'Текущий вес (кг)', required: true, dbField: 'current_weight' },
  { id: 'o5', type: 'number', labelEn: 'Target weight (kg)', labelRu: 'Желаемый вес (кг)', required: false, dbField: 'target_weight' },
  { id: 'o6', type: 'select', labelEn: 'Fitness goal', labelRu: 'Цель', required: true, dbField: 'primary_goal', options: [
    { en: 'Weight loss', ru: 'Похудение' }, { en: 'Muscle gain', ru: 'Набор массы' }, { en: 'Recovery', ru: 'Восстановление' }, { en: 'General fitness', ru: 'Общий тонус' }, { en: 'Postnatal', ru: 'Послеродовое' }
  ]},
  { id: 'o7', type: 'select', labelEn: 'Training experience', labelRu: 'Опыт тренировок', required: true, dbField: 'training_experience', options: [
    { en: 'None', ru: 'Нет' }, { en: 'Beginner (< 1 year)', ru: 'Новичок (< 1 года)' }, { en: '1-3 years', ru: '1-3 года' }, { en: '3+ years', ru: '3+ лет' }
  ]},
  { id: 'o8', type: 'select', labelEn: 'Training location', labelRu: 'Где тренируетесь', required: true, dbField: 'training_location', options: [
    { en: 'Gym', ru: 'Зал' }, { en: 'Home', ru: 'Дома' }, { en: 'Both', ru: 'Зал и дома' }, { en: 'Outdoor', ru: 'На улице' }
  ]},
  { id: 'o9', type: 'textarea', labelEn: 'Health conditions / injuries', labelRu: 'Состояние здоровья / травмы', required: false, dbField: 'medical_conditions', placeholderEn: 'List any conditions...', placeholderRu: 'Перечислите проблемы со здоровьем...' },
  { id: 'o10', type: 'textarea', labelEn: 'Surgeries (if any)', labelRu: 'Операции (если были)', required: false, dbField: 'injuries' },
  { id: 'o11', type: 'textarea', labelEn: 'Medications', labelRu: 'Лекарства', required: false, dbField: 'medications' },
  { id: 'o12', type: 'textarea', labelEn: 'Allergies', labelRu: 'Аллергии', required: false, dbField: 'allergies' },
  { id: 'o13', type: 'select', labelEn: 'Activity level', labelRu: 'Уровень активности', required: true, dbField: 'activity_level', options: [
    { en: 'Sedentary', ru: 'Сидячий' }, { en: 'Light', ru: 'Лёгкий' }, { en: 'Moderate', ru: 'Средний' }, { en: 'Active', ru: 'Активный' }, { en: 'Very active', ru: 'Очень активный' }
  ]},
  { id: 'o14', type: 'textarea', labelEn: 'Additional notes', labelRu: 'Дополнительно', required: false, dbField: 'notes' },
  { id: 'o15', type: 'photo', labelEn: 'Starting photo (front)', labelRu: 'Фото до (фронт)', required: false, dbField: 'photo_front' },
  { id: 'o16', type: 'photo', labelEn: 'Starting photo (side)', labelRu: 'Фото до (бок)', required: false, dbField: 'photo_side' },
]

/** Generate unique field ID using timestamp + random suffix (survives page reloads) */
function nextFieldId(): string {
  return `f${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export default function FormBuilderPage() {
  const { locale } = useTranslation()
  const ru = locale === 'ru'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  /* ─── Load from DB ─── */
  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/form-templates')
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (data.length > 0) {
        setTemplates(data)
        setActiveTemplate(data[0].id)
      } else {
        // Seed defaults if no templates exist
        await seedDefaults()
      }
    } catch {
      toast.error(ru ? 'Ошибка загрузки шаблонов' : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const seedDefaults = async () => {
    try {
      const r1 = await fetchWithAuth('/api/form-templates', {
        method: 'POST',
        body: JSON.stringify({ name_en: 'Weekly Check-in', name_ru: 'Еженедельный чек-ин', type: 'checkin', fields: defaultCheckinFields, active: true }),
      })
      const r2 = await fetchWithAuth('/api/form-templates', {
        method: 'POST',
        body: JSON.stringify({ name_en: 'Client Onboarding', name_ru: 'Анкета нового клиента', type: 'onboarding', fields: defaultOnboardingFields, active: true }),
      })
      const t1 = r1.ok ? await r1.json() : null
      const t2 = r2.ok ? await r2.json() : null
      const seeded = [t1, t2].filter(Boolean)
      setTemplates(seeded)
      if (seeded.length > 0) setActiveTemplate(seeded[0].id)
      toast.success(ru ? 'Шаблоны по умолчанию созданы' : 'Default templates created')
    } catch { /* ignore */ }
  }

  useEffect(() => { loadTemplates() }, [loadTemplates])

  const template = templates.find(t => t.id === activeTemplate)
  const fields = template?.fields || []

  const setFields = (newFields: FormField[]) => {
    setTemplates(templates.map(t => t.id === activeTemplate ? { ...t, fields: newFields } : t))
  }

  const addField = (type: FieldType) => {
    const id = nextFieldId()
    const cfg = fieldTypeConfig[type]
    const f: FormField = { id, type, labelEn: cfg.labelEn, labelRu: cfg.labelRu, required: false }
    if (type === 'scale') { f.min = 1; f.max = 10 }
    if (type === 'select') { f.options = [{ en: 'Option 1', ru: 'Вариант 1' }] }
    setFields([...fields, f])
    setEditingField(id)
  }

  const removeField = (id: string) => setFields(fields.filter(f => f.id !== id))
  const moveField = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= fields.length) return
    const n = [...fields]; [n[i], n[j]] = [n[j], n[i]]; setFields(n)
  }
  const updateField = (id: string, patch: Partial<FormField>) => setFields(fields.map(f => f.id === id ? { ...f, ...patch } : f))

  /* ─── Save to DB ─── */
  const handleSave = async () => {
    if (!template) return

    // Validate: filter out empty select options before saving
    const cleanedFields = template.fields.map(f => {
      if (f.type === 'select' && f.options) {
        return { ...f, options: f.options.filter(opt => opt.en.trim() || opt.ru.trim()) }
      }
      return f
    })

    setSaving(true)
    try {
      const res = await fetchWithAuth('/api/form-templates', {
        method: 'PUT',
        body: JSON.stringify({
          id: template.id,
          name_en: template.name_en,
          name_ru: template.name_ru,
          type: template.type,
          fields: cleanedFields,
          active: template.active,
        }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      // Sync server response back to local state
      setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t))
      toast.success(ru ? 'Форма сохранена!' : 'Form saved!')
    } catch { toast.error(ru ? 'Ошибка сохранения' : 'Failed to save') }
    finally { setSaving(false) }
  }

  /* ─── Create new template ─── */
  const addTemplate = async () => {
    try {
      const res = await fetchWithAuth('/api/form-templates', {
        method: 'POST',
        body: JSON.stringify({ name_en: 'New Form', name_ru: 'Новая форма', type: 'custom', fields: [], active: false }),
      })
      if (!res.ok) throw new Error()
      const nt = await res.json()
      setTemplates([...templates, nt])
      setActiveTemplate(nt.id)
    } catch { toast.error(ru ? 'Ошибка' : 'Failed') }
  }

  /* ─── Delete template (with confirmation) ─── */
  const deleteTemplate = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/form-templates?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      const remaining = templates.filter(t => t.id !== id)
      setTemplates(remaining)
      setActiveTemplate(remaining[0]?.id || null)
      setDeleteConfirm(null)
      toast.success(ru ? 'Удалено' : 'Deleted')
    } catch { toast.error(ru ? 'Ошибка' : 'Failed') }
  }

  /* ─── Duplicate template ─── */
  const duplicateTemplate = async () => {
    if (!template) return
    try {
      const res = await fetchWithAuth('/api/form-templates', {
        method: 'POST',
        body: JSON.stringify({
          name_en: template.name_en + ' (copy)',
          name_ru: template.name_ru + ' (копия)',
          type: template.type,
          fields: template.fields.map(f => ({ ...f, id: nextFieldId() })),
          active: false,
        }),
      })
      if (!res.ok) throw new Error()
      const nt = await res.json()
      setTemplates([...templates, nt])
      setActiveTemplate(nt.id)
    } catch { toast.error(ru ? 'Ошибка' : 'Failed') }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{ru ? 'Конструктор форм' : 'Form Builder'}</h1>
          <p className="text-zinc-500 mt-1">{ru ? 'Создавайте формы для чек-инов и анкет' : 'Create forms for check-ins and questionnaires'}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowPreview(true)} disabled={!template}><Eye className="w-4 h-4 mr-2" />{ru ? 'Предпросмотр' : 'Preview'}</Button>
          <Button variant="gradient" onClick={handleSave} disabled={saving || !template}><Save className="w-4 h-4 mr-2" />{saving ? '...' : ru ? 'Сохранить' : 'Save'}</Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left — template list */}
        <div className="lg:w-72 flex-shrink-0 space-y-3">
          <Card><CardContent className="p-3 space-y-2">
            {templates.map(tmpl => (
              <button key={tmpl.id} onClick={() => { setActiveTemplate(tmpl.id); setEditingField(null) }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTemplate === tmpl.id ? 'bg-teal-500 text-white' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                {tmpl.type === 'checkin' ? <ClipboardCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-sm">{ru ? tmpl.name_ru : tmpl.name_en}</div>
                  <div className={`text-xs ${activeTemplate === tmpl.id ? 'text-teal-100' : 'text-zinc-400'}`}>
                    {tmpl.fields.length} {ru ? 'полей' : 'fields'} • {tmpl.type}
                  </div>
                </div>
                {tmpl.active && <div className={`w-2 h-2 rounded-full ${activeTemplate === tmpl.id ? 'bg-teal-200' : 'bg-green-400'}`} />}
              </button>
            ))}
            <button onClick={addTemplate}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all">
              <Plus className="w-5 h-5" /><span className="font-medium text-sm">{ru ? 'Новая форма' : 'New form'}</span>
            </button>
          </CardContent></Card>

          {/* Field palette */}
          {template && (
            <Card><CardHeader className="py-3 px-4"><CardTitle className="text-sm">{ru ? 'Добавить поле' : 'Add field'}</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0 grid grid-cols-2 gap-2">
                {(Object.entries(fieldTypeConfig) as [FieldType, typeof fieldTypeConfig.text][]).map(([type, cfg]) => {
                  const Icon = cfg.icon
                  return (
                    <button key={type} onClick={() => addField(type)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all text-center">
                      <div className={`w-8 h-8 rounded-lg ${cfg.color} flex items-center justify-center`}><Icon className="w-4 h-4" /></div>
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{ru ? cfg.labelRu : cfg.labelEn}</span>
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — field editor */}
        <div className="flex-1 space-y-4">
          {template && (
            <>
              {/* Template name */}
              <Card><CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 grid sm:grid-cols-2 gap-3">
                    <Input label={ru ? 'Название (EN)' : 'Name (EN)'} value={template.name_en}
                      onChange={e => setTemplates(templates.map(t => t.id === activeTemplate ? { ...t, name_en: e.target.value } : t))} />
                    <Input label={ru ? 'Название (RU)' : 'Name (RU)'} value={template.name_ru}
                      onChange={e => setTemplates(templates.map(t => t.id === activeTemplate ? { ...t, name_ru: e.target.value } : t))} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={duplicateTemplate} title={ru ? 'Дублировать' : 'Duplicate'}><Copy className="w-4 h-4" /></Button>
                    {templates.length > 1 && (
                      <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(template.id)} title={ru ? 'Удалить' : 'Delete'}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setTemplates(templates.map(t => t.id === activeTemplate ? { ...t, active: !t.active } : t))}
                  >
                    <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${template.active ? 'bg-teal-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${template.active ? 'translate-x-4' : ''}`} />
                    </div>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400 select-none">{ru ? 'Активна' : 'Active'}</span>
                  </div>
                  <Badge variant="secondary">{template.type}</Badge>
                </div>
              </CardContent></Card>

              {/* Fields */}
              {fields.length === 0 && (
                <div className="text-center py-16 text-zinc-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                  <p>{ru ? 'Добавьте поля из панели слева' : 'Add fields from the left panel'}</p>
                </div>
              )}

              {fields.map((field, i) => {
                const cfg = fieldTypeConfig[field.type]
                const Icon = cfg.icon
                const isEditing = editingField === field.id

                return (
                  <Card key={field.id} className={isEditing ? 'ring-2 ring-teal-500/30' : ''}>
                    <CardContent className="p-0">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <GripVertical className="w-4 h-4 text-zinc-300 flex-shrink-0" />
                        <div className={`w-8 h-8 rounded-lg ${cfg.color} flex items-center justify-center flex-shrink-0`}><Icon className="w-4 h-4" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">{ru ? field.labelRu : field.labelEn}</p>
                          <p className="text-xs text-zinc-400">
                            {ru ? cfg.labelRu : cfg.labelEn}
                            {field.required ? ` • ${ru ? 'обяз.' : 'req.'}` : ''}
                            {field.dbField ? ` • ${field.dbField}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveField(i, -1)} disabled={i === 0} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                          <button onClick={() => moveField(i, 1)} disabled={i === fields.length - 1} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                          <button onClick={() => setEditingField(isEditing ? null : field.id)} className={`p-1.5 rounded-lg transition-colors ${isEditing ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/30' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}><Settings className="w-4 h-4" /></button>
                          <button onClick={() => removeField(field.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="px-4 pb-4 pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-4 bg-zinc-50/50 dark:bg-zinc-800/30">
                          <div className="grid sm:grid-cols-2 gap-3">
                            <Input label={ru ? 'Метка (EN)' : 'Label (EN)'} value={field.labelEn} onChange={e => updateField(field.id, { labelEn: e.target.value })} />
                            <Input label={ru ? 'Метка (RU)' : 'Label (RU)'} value={field.labelRu} onChange={e => updateField(field.id, { labelRu: e.target.value })} />
                          </div>
                          <Input label={ru ? 'Поле в БД (dbField)' : 'DB field name'} value={field.dbField || ''}
                            onChange={e => updateField(field.id, { dbField: e.target.value || undefined })}
                            placeholder="e.g. weight, sleep_quality" />
                          {(field.type === 'text' || field.type === 'textarea') && (
                            <div className="grid sm:grid-cols-2 gap-3">
                              <Input label="Placeholder (EN)" value={field.placeholderEn || ''} onChange={e => updateField(field.id, { placeholderEn: e.target.value })} />
                              <Input label="Placeholder (RU)" value={field.placeholderRu || ''} onChange={e => updateField(field.id, { placeholderRu: e.target.value })} />
                            </div>
                          )}
                          {field.type === 'scale' && (
                            <div className="grid grid-cols-2 gap-3">
                              <Input label="Min" type="number" value={String(field.min || 1)} onChange={e => updateField(field.id, { min: Number(e.target.value) })} />
                              <Input label="Max" type="number" value={String(field.max || 10)} onChange={e => updateField(field.id, { max: Number(e.target.value) })} />
                            </div>
                          )}
                          {field.type === 'select' && (
                            <div>
                              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">{ru ? 'Варианты' : 'Options'}</label>
                              <div className="space-y-2">
                                {(field.options || []).map((opt, j) => (
                                  <div key={j} className="flex items-center gap-2">
                                    <input className="flex-1 h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 text-sm" placeholder="EN" value={opt.en}
                                      onChange={e => { const opts = [...(field.options || [])]; opts[j] = { ...opts[j], en: e.target.value }; updateField(field.id, { options: opts }) }} />
                                    <input className="flex-1 h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 text-sm" placeholder="RU" value={opt.ru}
                                      onChange={e => { const opts = [...(field.options || [])]; opts[j] = { ...opts[j], ru: e.target.value }; updateField(field.id, { options: opts }) }} />
                                    <button onClick={() => updateField(field.id, { options: (field.options || []).filter((_, k) => k !== j) })} className="p-1.5 text-zinc-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                                ))}
                                <button onClick={() => updateField(field.id, { options: [...(field.options || []), { en: '', ru: '' }] })}
                                  className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"><Plus className="w-3.5 h-3.5" />{ru ? 'Добавить' : 'Add'}</button>
                              </div>
                            </div>
                          )}
                          <div
                            className="flex items-center gap-3 cursor-pointer select-none"
                            onClick={() => updateField(field.id, { required: !field.required })}
                          >
                            <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${field.required ? 'bg-teal-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${field.required ? 'translate-x-4' : ''}`} />
                            </div>
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">{ru ? 'Обязательное' : 'Required'}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {template && (
        <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title={ru ? 'Предпросмотр формы' : 'Form Preview'} size="lg">
          <div className="space-y-5 p-2">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{ru ? template.name_ru : template.name_en}</h2>
            {fields.map(field => {
              const label = ru ? field.labelRu : field.labelEn
              return (
                <div key={field.id}>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">{label}{field.required && <span className="text-red-500 ml-1">*</span>}</label>
                  {field.type === 'text' && <input className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-100" placeholder={ru ? field.placeholderRu : field.placeholderEn} disabled />}
                  {field.type === 'textarea' && <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-100" rows={3} placeholder={ru ? field.placeholderRu : field.placeholderEn} disabled />}
                  {field.type === 'number' && <input type="number" className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800" disabled />}
                  {field.type === 'date' && <input type="date" className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800" disabled />}
                  {field.type === 'scale' && (
                    <div className="flex gap-2 flex-wrap">{Array.from({ length: (field.max || 10) - (field.min || 1) + 1 }, (_, i) => (field.min || 1) + i).map(n => (
                      <button key={n} className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-500">{n}</button>
                    ))}</div>
                  )}
                  {field.type === 'select' && (
                    <select className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-100" disabled>
                      <option>{ru ? '— выберите —' : '— select —'}</option>
                      {(field.options || []).map((opt, j) => <option key={j}>{ru ? opt.ru : opt.en}</option>)}
                    </select>
                  )}
                  {field.type === 'photo' && (
                    <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl p-6 text-center"><Camera className="w-8 h-8 text-zinc-300 mx-auto mb-2" /><p className="text-sm text-zinc-400">{ru ? 'Нажмите для загрузки' : 'Click to upload'}</p></div>
                  )}
                  {field.type === 'toggle' && (
                    <div className="flex items-center gap-3"><div className="w-12 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center px-0.5"><div className="w-6 h-6 bg-white rounded-full shadow" /></div><span className="text-sm text-zinc-500">{ru ? 'Нет' : 'No'}</span></div>
                  )}
                </div>
              )
            })}
            <Button variant="gradient" className="w-full" disabled>{ru ? 'Отправить' : 'Submit'}</Button>
          </div>
        </Modal>
      )}

      {/* Delete confirmation modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={ru ? 'Удалить шаблон?' : 'Delete template?'} size="sm">
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          {ru
            ? 'Это действие нельзя отменить. Шаблон и все его поля будут удалены навсегда.'
            : 'This action cannot be undone. The template and all its fields will be permanently deleted.'}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>{ru ? 'Отмена' : 'Cancel'}</Button>
          <Button variant="gradient" className="!bg-red-500 hover:!bg-red-600" onClick={() => deleteConfirm && deleteTemplate(deleteConfirm)}>
            <Trash2 className="w-4 h-4 mr-2" />{ru ? 'Удалить' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
