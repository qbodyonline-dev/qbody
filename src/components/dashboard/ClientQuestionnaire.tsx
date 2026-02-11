'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { fetchWithAuth } from '@/lib/api'
import {
  ClipboardList, Edit, Loader2, Save, Target, Activity,
  Dumbbell, Utensils, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

/* ═══════════ TYPES ═══════════ */
type Questionnaire = {
  id: string
  client_id: string
  primary_goal: string | null
  secondary_goals: string[]
  target_weight: number | null
  injuries: string | null
  medical_conditions: string | null
  medications: string | null
  allergies: string | null
  training_experience: string | null
  training_frequency: string | null
  preferred_training_time: string | null
  training_location: string | null
  available_equipment: string[]
  occupation: string | null
  activity_level: string | null
  sleep_hours_avg: number | null
  stress_level_avg: number | null
  dietary_restrictions: string[]
  meals_per_day: number | null
  water_intake: string | null
  supplements: string | null
  notes: string | null
  filled_at: string
  updated_at: string
}

type FormData = {
  primary_goal: string
  secondary_goals: string[]
  target_weight: string
  injuries: string
  medical_conditions: string
  medications: string
  allergies: string
  training_experience: string
  training_frequency: string
  preferred_training_time: string
  training_location: string
  available_equipment: string[]
  occupation: string
  activity_level: string
  sleep_hours_avg: string
  stress_level_avg: string
  dietary_restrictions: string[]
  meals_per_day: string
  water_intake: string
  supplements: string
  notes: string
}

const EMPTY: FormData = {
  primary_goal: '', secondary_goals: [], target_weight: '',
  injuries: '', medical_conditions: '', medications: '', allergies: '',
  training_experience: '', training_frequency: '', preferred_training_time: '',
  training_location: '', available_equipment: [],
  occupation: '', activity_level: '',
  sleep_hours_avg: '', stress_level_avg: '',
  dietary_restrictions: [], meals_per_day: '', water_intake: '', supplements: '',
  notes: '',
}

/* ═══════════ OPTIONS ═══════════ */
const GOALS = ['weight_loss', 'muscle_gain', 'endurance', 'recovery', 'toning', 'flexibility', 'general_health', 'postnatal', 'rehab']
const EXPERIENCE = ['none', 'beginner', 'intermediate', 'advanced']
const LOCATIONS = ['gym', 'home', 'both', 'outdoor']
const ACTIVITY = ['sedentary', 'light', 'moderate', 'active', 'very_active']
const EQUIPMENT = ['dumbbells', 'barbell', 'kettlebell', 'resistance_bands', 'pull_up_bar', 'bench', 'cables', 'machines', 'yoga_mat', 'foam_roller', 'trx', 'ball']
const DIETARY = ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'keto', 'halal', 'kosher', 'no_restrictions']
const TIMES = ['morning', 'afternoon', 'evening', 'flexible']

/* ═══════════ COMPONENT ═══════════ */
export default function ClientQuestionnaire({ clientId, ru }: { clientId: string; ru: boolean }) {
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<FormData>({ ...EMPTY })

  /* ─── Labels ─── */
  const goalLabels: Record<string, string> = ru
    ? { weight_loss: 'Похудение', muscle_gain: 'Набор массы', endurance: 'Выносливость', recovery: 'Восстановление', toning: 'Тонус', flexibility: 'Гибкость', general_health: 'Общее здоровье', postnatal: 'Послеродовое', rehab: 'Реабилитация' }
    : { weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', endurance: 'Endurance', recovery: 'Recovery', toning: 'Toning', flexibility: 'Flexibility', general_health: 'General Health', postnatal: 'Postnatal', rehab: 'Rehabilitation' }

  const expLabels: Record<string, string> = ru
    ? { none: 'Нет опыта', beginner: 'Начинающий', intermediate: 'Средний', advanced: 'Продвинутый' }
    : { none: 'None', beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }

  const locLabels: Record<string, string> = ru
    ? { gym: 'Зал', home: 'Дома', both: 'Зал + Дома', outdoor: 'Улица' }
    : { gym: 'Gym', home: 'Home', both: 'Both', outdoor: 'Outdoor' }

  const actLabels: Record<string, string> = ru
    ? { sedentary: 'Сидячий', light: 'Лёгкая', moderate: 'Умеренная', active: 'Активная', very_active: 'Очень активная' }
    : { sedentary: 'Sedentary', light: 'Light', moderate: 'Moderate', active: 'Active', very_active: 'Very Active' }

  const eqLabels: Record<string, string> = ru
    ? { dumbbells: 'Гантели', barbell: 'Штанга', kettlebell: 'Гиря', resistance_bands: 'Резинки', pull_up_bar: 'Турник', bench: 'Скамья', cables: 'Тросы', machines: 'Тренажёры', yoga_mat: 'Коврик', foam_roller: 'Ролл', trx: 'TRX', ball: 'Мяч' }
    : { dumbbells: 'Dumbbells', barbell: 'Barbell', kettlebell: 'Kettlebell', resistance_bands: 'Bands', pull_up_bar: 'Pull-up Bar', bench: 'Bench', cables: 'Cables', machines: 'Machines', yoga_mat: 'Yoga Mat', foam_roller: 'Foam Roller', trx: 'TRX', ball: 'Ball' }

  const dietLabels: Record<string, string> = ru
    ? { vegetarian: 'Вегетарианство', vegan: 'Веганство', gluten_free: 'Без глютена', dairy_free: 'Без лактозы', keto: 'Кето', halal: 'Халяль', kosher: 'Кошер', no_restrictions: 'Нет ограничений' }
    : { vegetarian: 'Vegetarian', vegan: 'Vegan', gluten_free: 'Gluten-free', dairy_free: 'Dairy-free', keto: 'Keto', halal: 'Halal', kosher: 'Kosher', no_restrictions: 'No restrictions' }

  const timeLabels: Record<string, string> = ru
    ? { morning: 'Утро', afternoon: 'День', evening: 'Вечер', flexible: 'Гибко' }
    : { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', flexible: 'Flexible' }

  /* ─── Fetch ─── */
  const fetchQ = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth(`/api/questionnaires/${clientId}`)
      if (res.ok) {
        const data = await res.json()
        setQuestionnaire(data)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [clientId])

  useEffect(() => { fetchQ() }, [fetchQ])

  /* ─── Open edit ─── */
  const openEdit = () => {
    const q = questionnaire
    setForm({
      primary_goal: q?.primary_goal || '',
      secondary_goals: q?.secondary_goals || [],
      target_weight: q?.target_weight?.toString() || '',
      injuries: q?.injuries || '',
      medical_conditions: q?.medical_conditions || '',
      medications: q?.medications || '',
      allergies: q?.allergies || '',
      training_experience: q?.training_experience || '',
      training_frequency: q?.training_frequency || '',
      preferred_training_time: q?.preferred_training_time || '',
      training_location: q?.training_location || '',
      available_equipment: q?.available_equipment || [],
      occupation: q?.occupation || '',
      activity_level: q?.activity_level || '',
      sleep_hours_avg: q?.sleep_hours_avg?.toString() || '',
      stress_level_avg: q?.stress_level_avg?.toString() || '',
      dietary_restrictions: q?.dietary_restrictions || [],
      meals_per_day: q?.meals_per_day?.toString() || '',
      water_intake: q?.water_intake || '',
      supplements: q?.supplements || '',
      notes: q?.notes || '',
    })
    setIsModalOpen(true)
  }

  /* ─── Save ─── */
  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        target_weight: form.target_weight ? parseFloat(form.target_weight) : null,
        sleep_hours_avg: form.sleep_hours_avg ? parseFloat(form.sleep_hours_avg) : null,
        stress_level_avg: form.stress_level_avg ? parseInt(form.stress_level_avg) : null,
        meals_per_day: form.meals_per_day ? parseInt(form.meals_per_day) : null,
      }
      const res = await fetchWithAuth(`/api/questionnaires/${clientId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success(ru ? 'Анкета сохранена' : 'Questionnaire saved')
      setIsModalOpen(false)
      fetchQ()
    } catch {
      toast.error(ru ? 'Ошибка сохранения' : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  /* ─── Toggle array helper ─── */
  const toggle = (field: 'secondary_goals' | 'available_equipment' | 'dietary_restrictions', val: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(val) ? prev[field].filter(v => v !== val) : [...prev[field], val]
    }))
  }

  const ChipSelect = ({ options, labels, selected, onToggle }: { options: string[]; labels: Record<string, string>; selected: string[]; onToggle: (v: string) => void }) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button key={o} type="button" onClick={() => onToggle(o)}
          className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${selected.includes(o) ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'}`}>
          {labels[o] || o}
        </button>
      ))}
    </div>
  )

  const RadioSelect = ({ options, labels, value, onChange }: { options: string[]; labels: Record<string, string>; value: string; onChange: (v: string) => void }) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${value === o ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'}`}>
          {labels[o] || o}
        </button>
      ))}
    </div>
  )

  /* ═══════════ RENDER ═══════════ */
  if (loading) {
    return <Card><CardContent className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-teal-500" /></CardContent></Card>
  }

  /* ─── Empty state ─── */
  if (!questionnaire) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <ClipboardList className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-zinc-600 dark:text-zinc-400 mb-2">{ru ? 'Анкета не заполнена' : 'No questionnaire'}</h3>
          <p className="text-zinc-400 text-sm mb-4">{ru ? 'Заполните анкету для этого клиента' : 'Fill out the questionnaire for this client'}</p>
          <Button variant="gradient" onClick={openEdit}><ClipboardList className="w-4 h-4 mr-2" />{ru ? 'Заполнить анкету' : 'Fill Questionnaire'}</Button>

          {renderModal()}
        </CardContent>
      </Card>
    )
  }

  const q = questionnaire

  /* ─── Filled state ─── */
  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{ru ? 'Анкета клиента' : 'Client Questionnaire'}</CardTitle>
            <Button variant="outline" size="sm" onClick={openEdit}><Edit className="w-3.5 h-3.5 mr-1" />{ru ? 'Редакт.' : 'Edit'}</Button>
          </div>
          <p className="text-xs text-zinc-400">
            {ru ? 'Обновлено' : 'Updated'}: {new Date(q.updated_at).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Goals */}
          {(q.primary_goal || q.secondary_goals?.length > 0) && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase mb-2 flex items-center gap-1"><Target className="w-3.5 h-3.5" />{ru ? 'Цели' : 'Goals'}</p>
              <div className="flex flex-wrap gap-1.5">
                {q.primary_goal && <Badge>{goalLabels[q.primary_goal] || q.primary_goal}</Badge>}
                {q.secondary_goals?.map(g => <Badge key={g} variant="secondary">{goalLabels[g] || g}</Badge>)}
              </div>
              {q.target_weight && <p className="text-xs text-zinc-500 mt-1">{ru ? 'Целевой вес' : 'Target weight'}: {q.target_weight} kg</p>}
            </div>
          )}

          {/* Health */}
          {(q.injuries || q.medical_conditions || q.medications || q.allergies) && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase mb-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{ru ? 'Здоровье' : 'Health'}</p>
              <div className="space-y-1 text-sm">
                {q.injuries && <p><span className="text-zinc-500">{ru ? 'Травмы:' : 'Injuries:'}</span> {q.injuries}</p>}
                {q.medical_conditions && <p><span className="text-zinc-500">{ru ? 'Заболевания:' : 'Conditions:'}</span> {q.medical_conditions}</p>}
                {q.medications && <p><span className="text-zinc-500">{ru ? 'Препараты:' : 'Medications:'}</span> {q.medications}</p>}
                {q.allergies && <p><span className="text-zinc-500">{ru ? 'Аллергии:' : 'Allergies:'}</span> {q.allergies}</p>}
              </div>
            </div>
          )}

          {/* Training */}
          {(q.training_experience || q.training_location || q.available_equipment?.length > 0) && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase mb-2 flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5" />{ru ? 'Тренировки' : 'Training'}</p>
              <div className="space-y-1 text-sm">
                {q.training_experience && <p><span className="text-zinc-500">{ru ? 'Опыт:' : 'Experience:'}</span> {expLabels[q.training_experience] || q.training_experience}</p>}
                {q.training_frequency && <p><span className="text-zinc-500">{ru ? 'Частота:' : 'Frequency:'}</span> {q.training_frequency}</p>}
                {q.training_location && <p><span className="text-zinc-500">{ru ? 'Место:' : 'Location:'}</span> {locLabels[q.training_location] || q.training_location}</p>}
                {q.preferred_training_time && <p><span className="text-zinc-500">{ru ? 'Время:' : 'Time:'}</span> {timeLabels[q.preferred_training_time] || q.preferred_training_time}</p>}
              </div>
              {q.available_equipment?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {q.available_equipment.map(e => <Badge key={e} variant="outline" className="text-xs">{eqLabels[e] || e}</Badge>)}
                </div>
              )}
            </div>
          )}

          {/* Lifestyle */}
          {(q.activity_level || q.occupation || q.sleep_hours_avg) && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase mb-2 flex items-center gap-1"><Activity className="w-3.5 h-3.5" />{ru ? 'Образ жизни' : 'Lifestyle'}</p>
              <div className="space-y-1 text-sm">
                {q.activity_level && <p><span className="text-zinc-500">{ru ? 'Активность:' : 'Activity:'}</span> {actLabels[q.activity_level] || q.activity_level}</p>}
                {q.occupation && <p><span className="text-zinc-500">{ru ? 'Профессия:' : 'Occupation:'}</span> {q.occupation}</p>}
                {q.sleep_hours_avg && <p><span className="text-zinc-500">{ru ? 'Сон:' : 'Sleep:'}</span> {q.sleep_hours_avg} {ru ? 'ч' : 'h'}</p>}
                {q.stress_level_avg && <p><span className="text-zinc-500">{ru ? 'Стресс:' : 'Stress:'}</span> {q.stress_level_avg}/10</p>}
              </div>
            </div>
          )}

          {/* Nutrition */}
          {(q.dietary_restrictions?.length > 0 || q.meals_per_day || q.water_intake) && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase mb-2 flex items-center gap-1"><Utensils className="w-3.5 h-3.5" />{ru ? 'Питание' : 'Nutrition'}</p>
              <div className="space-y-1 text-sm">
                {q.meals_per_day && <p><span className="text-zinc-500">{ru ? 'Приёмов пищи:' : 'Meals/day:'}</span> {q.meals_per_day}</p>}
                {q.water_intake && <p><span className="text-zinc-500">{ru ? 'Вода:' : 'Water:'}</span> {q.water_intake}</p>}
                {q.supplements && <p><span className="text-zinc-500">{ru ? 'Добавки:' : 'Supplements:'}</span> {q.supplements}</p>}
              </div>
              {q.dietary_restrictions?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {q.dietary_restrictions.map(d => <Badge key={d} variant="secondary" className="text-xs">{dietLabels[d] || d}</Badge>)}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {q.notes && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase mb-1">{ru ? 'Заметки' : 'Notes'}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg">{q.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {renderModal()}
    </>
  )

  /* ═══════════ MODAL ═══════════ */
  function renderModal() {
    return (
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={ru ? 'Анкета клиента' : 'Client Questionnaire'} size="lg">
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

          {/* Goals */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{ru ? 'Основная цель' : 'Primary Goal'}</label>
            <RadioSelect options={GOALS} labels={goalLabels} value={form.primary_goal} onChange={v => setForm({ ...form, primary_goal: v })} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{ru ? 'Доп. цели' : 'Secondary Goals'}</label>
            <ChipSelect options={GOALS} labels={goalLabels} selected={form.secondary_goals} onToggle={v => toggle('secondary_goals', v)} />
          </div>
          <Input label={ru ? 'Целевой вес (кг)' : 'Target Weight (kg)'} type="number" value={form.target_weight} onChange={e => setForm({ ...form, target_weight: e.target.value })} />

          {/* Health */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">{ru ? '🏥 Здоровье' : '🏥 Health'}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="block text-xs text-zinc-500 mb-1">{ru ? 'Травмы' : 'Injuries'}</label>
                <textarea className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-sm resize-none" rows={2} value={form.injuries} onChange={e => setForm({ ...form, injuries: e.target.value })} /></div>
              <div><label className="block text-xs text-zinc-500 mb-1">{ru ? 'Заболевания' : 'Medical Conditions'}</label>
                <textarea className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-sm resize-none" rows={2} value={form.medical_conditions} onChange={e => setForm({ ...form, medical_conditions: e.target.value })} /></div>
              <Input label={ru ? 'Препараты' : 'Medications'} value={form.medications} onChange={e => setForm({ ...form, medications: e.target.value })} />
              <Input label={ru ? 'Аллергии' : 'Allergies'} value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} />
            </div>
          </div>

          {/* Training */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">{ru ? '💪 Тренировки' : '💪 Training'}</p>
            <div className="space-y-3">
              <div><label className="block text-xs text-zinc-500 mb-1">{ru ? 'Опыт' : 'Experience'}</label>
                <RadioSelect options={EXPERIENCE} labels={expLabels} value={form.training_experience} onChange={v => setForm({ ...form, training_experience: v })} /></div>
              <Input label={ru ? 'Частота (напр. 3 раза/нед)' : 'Frequency (e.g. 3x/week)'} value={form.training_frequency} onChange={e => setForm({ ...form, training_frequency: e.target.value })} />
              <div><label className="block text-xs text-zinc-500 mb-1">{ru ? 'Время' : 'Preferred Time'}</label>
                <RadioSelect options={TIMES} labels={timeLabels} value={form.preferred_training_time} onChange={v => setForm({ ...form, preferred_training_time: v })} /></div>
              <div><label className="block text-xs text-zinc-500 mb-1">{ru ? 'Место' : 'Location'}</label>
                <RadioSelect options={LOCATIONS} labels={locLabels} value={form.training_location} onChange={v => setForm({ ...form, training_location: v })} /></div>
              <div><label className="block text-xs text-zinc-500 mb-1">{ru ? 'Оборудование' : 'Available Equipment'}</label>
                <ChipSelect options={EQUIPMENT} labels={eqLabels} selected={form.available_equipment} onToggle={v => toggle('available_equipment', v)} /></div>
            </div>
          </div>

          {/* Lifestyle */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">{ru ? '🏠 Образ жизни' : '🏠 Lifestyle'}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label={ru ? 'Профессия' : 'Occupation'} value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} />
              <div><label className="block text-xs text-zinc-500 mb-1">{ru ? 'Уровень активности' : 'Activity Level'}</label>
                <RadioSelect options={ACTIVITY} labels={actLabels} value={form.activity_level} onChange={v => setForm({ ...form, activity_level: v })} /></div>
              <Input label={ru ? 'Сон (часов)' : 'Sleep (hours)'} type="number" step="0.5" value={form.sleep_hours_avg} onChange={e => setForm({ ...form, sleep_hours_avg: e.target.value })} />
              <Input label={ru ? 'Уровень стресса (1-10)' : 'Stress Level (1-10)'} type="number" min="1" max="10" value={form.stress_level_avg} onChange={e => setForm({ ...form, stress_level_avg: e.target.value })} />
            </div>
          </div>

          {/* Nutrition */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">{ru ? '🍎 Питание' : '🍎 Nutrition'}</p>
            <div className="space-y-3">
              <div><label className="block text-xs text-zinc-500 mb-1">{ru ? 'Диета' : 'Dietary Restrictions'}</label>
                <ChipSelect options={DIETARY} labels={dietLabels} selected={form.dietary_restrictions} onToggle={v => toggle('dietary_restrictions', v)} /></div>
              <div className="grid sm:grid-cols-3 gap-3">
                <Input label={ru ? 'Приёмов пищи/день' : 'Meals/Day'} type="number" value={form.meals_per_day} onChange={e => setForm({ ...form, meals_per_day: e.target.value })} />
                <Input label={ru ? 'Вода (напр. 2л)' : 'Water (e.g. 2L)'} value={form.water_intake} onChange={e => setForm({ ...form, water_intake: e.target.value })} />
                <Input label={ru ? 'Добавки' : 'Supplements'} value={form.supplements} onChange={e => setForm({ ...form, supplements: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <label className="block text-xs text-zinc-500 mb-1">{ru ? 'Заметки' : 'Notes'}</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-sm resize-none" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>{ru ? 'Отмена' : 'Cancel'}</Button>
          <Button variant="gradient" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {ru ? 'Сохранить' : 'Save'}
          </Button>
        </div>
      </Modal>
    )
  }
}
