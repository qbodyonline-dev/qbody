'use client'
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import {
  Plus, Trash2, GripVertical, Save, Eye, Copy, Settings,
  Type, Hash, Star, List, Camera, Calendar, ToggleLeft, AlignLeft,
  ChevronDown, ChevronUp, Edit, Check, X, FileText, ClipboardCheck
} from 'lucide-react'
import { toast } from 'sonner'

type FieldType = 'text' | 'textarea' | 'number' | 'scale' | 'select' | 'photo' | 'date' | 'toggle'

interface FormField {
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
}

interface FormTemplate {
  id: string
  nameEn: string
  nameRu: string
  type: 'checkin' | 'onboarding' | 'custom'
  fields: FormField[]
  active: boolean
}

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

const defaultCheckinFields: FormField[] = [
  { id: 'f1', type: 'scale', labelEn: 'Energy level', labelRu: 'Уровень энергии', required: true, min: 1, max: 10 },
  { id: 'f2', type: 'scale', labelEn: 'Sleep quality', labelRu: 'Качество сна', required: true, min: 1, max: 10 },
  { id: 'f3', type: 'scale', labelEn: 'Mood', labelRu: 'Настроение', required: true, min: 1, max: 10 },
  { id: 'f4', type: 'number', labelEn: 'Weight (kg)', labelRu: 'Вес (кг)', required: false },
  { id: 'f5', type: 'textarea', labelEn: 'How are you feeling?', labelRu: 'Как вы себя чувствуете?', required: false, placeholderEn: 'Describe your condition...', placeholderRu: 'Опишите своё самочувствие...' },
  { id: 'f6', type: 'photo', labelEn: 'Progress photo', labelRu: 'Фото прогресса', required: false },
  { id: 'f7', type: 'toggle', labelEn: 'Completed all workouts', labelRu: 'Выполнила все тренировки', required: true },
  { id: 'f8', type: 'select', labelEn: 'Nutrition compliance', labelRu: 'Соблюдение питания', required: true, options: [
    { en: 'Strict', ru: 'Строго' }, { en: 'Mostly', ru: 'В основном' }, { en: 'Some deviations', ru: 'Были отклонения' }, { en: 'Off track', ru: 'Не соблюдала' }
  ]},
]

const defaultOnboardingFields: FormField[] = [
  { id: 'o1', type: 'text', labelEn: 'Full name', labelRu: 'ФИО', required: true },
  { id: 'o2', type: 'date', labelEn: 'Date of birth', labelRu: 'Дата рождения', required: true },
  { id: 'o3', type: 'number', labelEn: 'Height (cm)', labelRu: 'Рост (см)', required: true },
  { id: 'o4', type: 'number', labelEn: 'Current weight (kg)', labelRu: 'Текущий вес (кг)', required: true },
  { id: 'o5', type: 'number', labelEn: 'Target weight (kg)', labelRu: 'Желаемый вес (кг)', required: true },
  { id: 'o6', type: 'select', labelEn: 'Fitness goal', labelRu: 'Цель', required: true, options: [
    { en: 'Weight loss', ru: 'Похудение' }, { en: 'Muscle gain', ru: 'Набор массы' }, { en: 'Recovery', ru: 'Восстановление' }, { en: 'General fitness', ru: 'Общий тонус' }
  ]},
  { id: 'o7', type: 'select', labelEn: 'Training experience', labelRu: 'Опыт тренировок', required: true, options: [
    { en: 'Beginner', ru: 'Новичок' }, { en: '1-3 years', ru: '1-3 года' }, { en: '3+ years', ru: '3+ лет' }
  ]},
  { id: 'o8', type: 'textarea', labelEn: 'Health conditions / injuries', labelRu: 'Состояние здоровья / травмы', required: false, placeholderEn: 'List any conditions...', placeholderRu: 'Перечислите проблемы со здоровьем...' },
  { id: 'o9', type: 'textarea', labelEn: 'Surgeries (if any)', labelRu: 'Операции (если были)', required: false },
  { id: 'o10', type: 'select', labelEn: 'Available equipment', labelRu: 'Доступное оборудование', required: true, options: [
    { en: 'Full gym', ru: 'Полный зал' }, { en: 'Home gym', ru: 'Домашний зал' }, { en: 'Minimal', ru: 'Минимальное' }, { en: 'None', ru: 'Нет' }
  ]},
  { id: 'o11', type: 'photo', labelEn: 'Starting photo (front)', labelRu: 'Фото до (фронт)', required: false },
  { id: 'o12', type: 'photo', labelEn: 'Starting photo (side)', labelRu: 'Фото до (бок)', required: false },
]

let _fid = 100

export default function FormBuilderPage() {
  const { t, locale } = useTranslation()
  const ru = locale === 'ru'
  const [isSaving, setIsSaving] = useState(false)

  const [templates, setTemplates] = useState<FormTemplate[]>([
    { id: 't1', nameEn: 'Weekly Check-in', nameRu: 'Еженедельный чек-ин', type: 'checkin', fields: defaultCheckinFields, active: true },
    { id: 't2', nameEn: 'Client Onboarding', nameRu: 'Анкета нового клиента', type: 'onboarding', fields: defaultOnboardingFields, active: true },
  ])

  const [activeTemplate, setActiveTemplate] = useState<string>('t1')
  const [editingField, setEditingField] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showAddField, setShowAddField] = useState(false)

  const template = templates.find(t => t.id === activeTemplate)!
  const fields = template.fields

  const setFields = (newFields: FormField[]) => {
    setTemplates(templates.map(t => t.id === activeTemplate ? { ...t, fields: newFields } : t))
  }

  const addField = (type: FieldType) => {
    const id = `f${++_fid}`
    const cfg = fieldTypeConfig[type]
    const f: FormField = { id, type, labelEn: cfg.labelEn, labelRu: cfg.labelRu, required: false }
    if (type === 'scale') { f.min = 1; f.max = 10 }
    if (type === 'select') { f.options = [{ en: 'Option 1', ru: 'Вариант 1' }] }
    setFields([...fields, f])
    setEditingField(id)
    setShowAddField(false)
  }

  const removeField = (id: string) => setFields(fields.filter(f => f.id !== id))
  const moveField = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= fields.length) return
    const n = [...fields]; [n[i], n[j]] = [n[j], n[i]]; setFields(n)
  }
  const updateField = (id: string, patch: Partial<FormField>) => setFields(fields.map(f => f.id === id ? { ...f, ...patch } : f))

  const handleSave = async () => { setIsSaving(true); await new Promise(r => setTimeout(r, 800)); toast.success(ru ? 'Форма сохранена!' : 'Form saved!'); setIsSaving(false) }

  const duplicateTemplate = () => {
    const nt: FormTemplate = { ...template, id: `t${Date.now()}`, nameEn: template.nameEn + ' (copy)', nameRu: template.nameRu + ' (копия)', fields: template.fields.map(f => ({ ...f, id: `f${++_fid}` })) }
    setTemplates([...templates, nt])
    setActiveTemplate(nt.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{ru ? 'Конструктор форм' : 'Form Builder'}</h1>
          <p className="text-zinc-500 mt-1">{ru ? 'Создавайте формы для чек-инов и анкет' : 'Create forms for check-ins and questionnaires'}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowPreview(true)}><Eye className="w-4 h-4 mr-2" />{ru ? 'Предпросмотр' : 'Preview'}</Button>
          <Button variant="gradient" onClick={handleSave} disabled={isSaving}><Save className="w-4 h-4 mr-2" />{isSaving ? '...' : ru ? 'Сохранить' : 'Save'}</Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left — template list */}
        <div className="lg:w-72 flex-shrink-0 space-y-3">
          <Card><CardContent className="p-3 space-y-2">
            {templates.map(tmpl => (
              <button key={tmpl.id} onClick={() => setActiveTemplate(tmpl.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTemplate === tmpl.id ? 'bg-teal-500 text-white' : 'text-zinc-700 hover:bg-zinc-100'}`}>
                {tmpl.type === 'checkin' ? <ClipboardCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-sm">{ru ? tmpl.nameRu : tmpl.nameEn}</div>
                  <div className={`text-xs ${activeTemplate === tmpl.id ? 'text-teal-100' : 'text-zinc-400'}`}>{tmpl.fields.length} {ru ? 'полей' : 'fields'}</div>
                </div>
                {tmpl.active && <div className={`w-2 h-2 rounded-full ${activeTemplate === tmpl.id ? 'bg-teal-200' : 'bg-green-400'}`} />}
              </button>
            ))}
            <button onClick={() => { const nt: FormTemplate = { id: `t${Date.now()}`, nameEn: 'New Form', nameRu: 'Новая форма', type: 'custom', fields: [], active: false }; setTemplates([...templates, nt]); setActiveTemplate(nt.id) }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-teal-600 hover:bg-teal-50 transition-all">
              <Plus className="w-5 h-5" /><span className="font-medium text-sm">{ru ? 'Новая форма' : 'New form'}</span>
            </button>
          </CardContent></Card>

          {/* Field palette */}
          <Card><CardHeader className="py-3 px-4"><CardTitle className="text-sm">{ru ? 'Добавить поле' : 'Add field'}</CardTitle></CardHeader>
            <CardContent className="p-3 pt-0 grid grid-cols-2 gap-2">
              {(Object.entries(fieldTypeConfig) as [FieldType, typeof fieldTypeConfig.text][]).map(([type, cfg]) => {
                const Icon = cfg.icon
                return (
                  <button key={type} onClick={() => addField(type)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-zinc-200 hover:border-teal-500 hover:bg-teal-50 transition-all text-center">
                    <div className={`w-8 h-8 rounded-lg ${cfg.color} flex items-center justify-center`}><Icon className="w-4 h-4" /></div>
                    <span className="text-xs font-medium text-zinc-600">{ru ? cfg.labelRu : cfg.labelEn}</span>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right — field editor */}
        <div className="flex-1 space-y-4">
          {/* Template name */}
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 grid sm:grid-cols-2 gap-3">
                <Input label={ru ? 'Название (EN)' : 'Name (EN)'} value={template.nameEn} onChange={e => setTemplates(templates.map(t => t.id === activeTemplate ? { ...t, nameEn: e.target.value } : t))} />
                <Input label={ru ? 'Название (RU)' : 'Name (RU)'} value={template.nameRu} onChange={e => setTemplates(templates.map(t => t.id === activeTemplate ? { ...t, nameRu: e.target.value } : t))} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={duplicateTemplate}><Copy className="w-4 h-4" /></Button>
                {templates.length > 1 && <Button variant="outline" size="sm" onClick={() => { setTemplates(templates.filter(t => t.id !== activeTemplate)); setActiveTemplate(templates[0].id === activeTemplate ? templates[1].id : templates[0].id) }}><Trash2 className="w-4 h-4 text-red-500" /></Button>}
              </div>
            </div>
          </CardContent></Card>

          {/* Fields list */}
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
                  {/* Field header */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <GripVertical className="w-4 h-4 text-zinc-300 cursor-grab flex-shrink-0" />
                    <div className={`w-8 h-8 rounded-lg ${cfg.color} flex items-center justify-center flex-shrink-0`}><Icon className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-zinc-900 truncate">{ru ? field.labelRu : field.labelEn}</p>
                      <p className="text-xs text-zinc-400">{ru ? cfg.labelRu : cfg.labelEn}{field.required ? ` • ${ru ? 'обязательное' : 'required'}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveField(i, -1)} disabled={i === 0} className="p-1.5 rounded-lg hover:bg-zinc-100 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                      <button onClick={() => moveField(i, 1)} disabled={i === fields.length - 1} className="p-1.5 rounded-lg hover:bg-zinc-100 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                      <button onClick={() => setEditingField(isEditing ? null : field.id)} className={`p-1.5 rounded-lg transition-colors ${isEditing ? 'bg-teal-100 text-teal-600' : 'hover:bg-zinc-100'}`}><Settings className="w-4 h-4" /></button>
                      <button onClick={() => removeField(field.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  {/* Field settings (expanded) */}
                  {isEditing && (
                    <div className="px-4 pb-4 pt-2 border-t border-zinc-100 space-y-4 bg-zinc-50/50">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <Input label={ru ? 'Метка (EN)' : 'Label (EN)'} value={field.labelEn} onChange={e => updateField(field.id, { labelEn: e.target.value })} />
                        <Input label={ru ? 'Метка (RU)' : 'Label (RU)'} value={field.labelRu} onChange={e => updateField(field.id, { labelRu: e.target.value })} />
                      </div>
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
                          <label className="text-sm font-medium text-zinc-700 mb-2 block">{ru ? 'Варианты' : 'Options'}</label>
                          <div className="space-y-2">
                            {(field.options || []).map((opt, j) => (
                              <div key={j} className="flex items-center gap-2">
                                <input className="flex-1 h-9 px-3 rounded-lg border border-zinc-200 text-sm" placeholder="EN" value={opt.en}
                                  onChange={e => { const opts = [...(field.options || [])]; opts[j] = { ...opts[j], en: e.target.value }; updateField(field.id, { options: opts }) }} />
                                <input className="flex-1 h-9 px-3 rounded-lg border border-zinc-200 text-sm" placeholder="RU" value={opt.ru}
                                  onChange={e => { const opts = [...(field.options || [])]; opts[j] = { ...opts[j], ru: e.target.value }; updateField(field.id, { options: opts }) }} />
                                <button onClick={() => updateField(field.id, { options: (field.options || []).filter((_, k) => k !== j) })} className="p-1.5 text-zinc-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            ))}
                            <button onClick={() => updateField(field.id, { options: [...(field.options || []), { en: '', ru: '' }] })}
                              className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"><Plus className="w-3.5 h-3.5" />{ru ? 'Добавить' : 'Add option'}</button>
                          </div>
                        </div>
                      )}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${field.required ? 'bg-teal-500' : 'bg-zinc-300'}`}
                          onClick={() => updateField(field.id, { required: !field.required })}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${field.required ? 'translate-x-4' : ''}`} />
                        </div>
                        <span className="text-sm text-zinc-700">{ru ? 'Обязательное поле' : 'Required field'}</span>
                      </label>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Preview modal */}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title={ru ? 'Предпросмотр формы' : 'Form Preview'} size="lg">
        <div className="space-y-5 p-2">
          <h2 className="text-xl font-bold text-zinc-900">{ru ? template.nameRu : template.nameEn}</h2>
          {fields.map(field => {
            const label = ru ? field.labelRu : field.labelEn
            return (
              <div key={field.id}>
                <label className="text-sm font-medium text-zinc-700 mb-1.5 block">{label}{field.required && <span className="text-red-500 ml-1">*</span>}</label>
                {field.type === 'text' && <input className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50" placeholder={ru ? field.placeholderRu : field.placeholderEn} disabled />}
                {field.type === 'textarea' && <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50" rows={3} placeholder={ru ? field.placeholderRu : field.placeholderEn} disabled />}
                {field.type === 'number' && <input type="number" className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50" disabled />}
                {field.type === 'date' && <input type="date" className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50" disabled />}
                {field.type === 'scale' && (
                  <div className="flex gap-2">{Array.from({ length: (field.max || 10) - (field.min || 1) + 1 }, (_, i) => (field.min || 1) + i).map(n => (
                    <button key={n} className="w-10 h-10 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-500 hover:bg-teal-50 hover:border-teal-500 hover:text-teal-600 transition-colors">{n}</button>
                  ))}</div>
                )}
                {field.type === 'select' && (
                  <select className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50" disabled>
                    <option>{ru ? '— выберите —' : '— select —'}</option>
                    {(field.options || []).map((opt, j) => <option key={j}>{ru ? opt.ru : opt.en}</option>)}
                  </select>
                )}
                {field.type === 'photo' && (
                  <div className="border-2 border-dashed border-zinc-300 rounded-xl p-6 text-center"><Camera className="w-8 h-8 text-zinc-300 mx-auto mb-2" /><p className="text-sm text-zinc-400">{ru ? 'Нажмите для загрузки' : 'Click to upload'}</p></div>
                )}
                {field.type === 'toggle' && (
                  <div className="flex items-center gap-3"><div className="w-12 h-7 rounded-full bg-zinc-200 flex items-center px-0.5"><div className="w-6 h-6 bg-white rounded-full shadow" /></div><span className="text-sm text-zinc-500">{ru ? 'Нет' : 'No'}</span></div>
                )}
              </div>
            )
          })}
          <Button variant="gradient" className="w-full" disabled>{ru ? 'Отправить' : 'Submit'}</Button>
        </div>
      </Modal>
    </div>
  )
}
