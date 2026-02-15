'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { fetchWithAuth } from '@/lib/api'
import {
  Search, Plus, Edit, Trash2, Clock, Dumbbell, GripVertical,
  Loader2, Copy, ChevronDown, ChevronUp, Flame, Snowflake, Zap, X
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguageConfig } from '@/lib/useLanguageConfig'

/* ═══════════ TYPES ═══════════ */
type ExerciseRef = {
  id: string
  name: string
  name_ru: string | null
  muscle_groups: string[]
  equipment: string | null
  video_url: string | null
}

type WorkoutExercise = {
  id?: string
  exercise_id: string
  exercises?: ExerciseRef
  section: 'warmup' | 'main' | 'cooldown'
  position: number
  sets: number
  reps: string
  weight: string
  tempo: string
  rest_seconds: number
  notes: string
  notes_ru: string
  superset_group: string
}

type Workout = {
  id: string
  name: string
  name_ru: string | null
  description: string | null
  description_ru: string | null
  type: string
  difficulty: string
  estimated_duration: number
  workout_exercises: WorkoutExercise[]
  created_at: string
}

type FormExercise = {
  _key: string // local key for react
  exercise_id: string
  exercise_name: string
  exercise_name_ru: string
  section: 'warmup' | 'main' | 'cooldown'
  position: number
  sets: number
  reps: string
  weight: string
  tempo: string
  rest_seconds: number
  notes: string
  notes_ru: string
  superset_group: string
}

/* ═══════════ CONSTANTS ═══════════ */
const TYPES = ['strength', 'cardio', 'mobility', 'mixed', 'hiit', 'recovery'] as const
const DIFFS = ['beginner', 'intermediate', 'advanced'] as const

const SECTION_ICONS: Record<string, React.ReactNode> = {
  warmup: <Flame className="w-4 h-4 text-orange-500" />,
  main: <Dumbbell className="w-4 h-4 text-blue-500" />,
  cooldown: <Snowflake className="w-4 h-4 text-cyan-500" />,
}

/* ═══════════ COMPONENT ═══════════ */
export default function WorkoutsPage() {
  const { t, locale } = useTranslation()
  const ru = locale === 'ru'
  const lang = useLanguageConfig()

  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Form
  const [formName, setFormName] = useState('')
  const [formNameRu, setFormNameRu] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formDescRu, setFormDescRu] = useState('')
  const [formType, setFormType] = useState('strength')
  const [formDiff, setFormDiff] = useState('intermediate')
  const [formDuration, setFormDuration] = useState(45)
  const [formExercises, setFormExercises] = useState<FormExercise[]>([])

  // Exercise picker
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSection, setPickerSection] = useState<'warmup' | 'main' | 'cooldown'>('main')
  const [pickerSearch, setPickerSearch] = useState('')
  const [allExercises, setAllExercises] = useState<ExerciseRef[]>([])
  const [loadingExercises, setLoadingExercises] = useState(false)

  /* ─── Labels ─── */
  const typeLabels: Record<string, string> = ru
    ? { strength: 'Сила', cardio: 'Кардио', mobility: 'Мобильность', mixed: 'Смешанная', hiit: 'ВИИТ', recovery: 'Восстановление' }
    : { strength: 'Strength', cardio: 'Cardio', mobility: 'Mobility', mixed: 'Mixed', hiit: 'HIIT', recovery: 'Recovery' }
  const diffLabels: Record<string, string> = ru
    ? { beginner: 'Начинающий', intermediate: 'Средний', advanced: 'Продвинутый' }
    : { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }
  const diffColors: Record<string, string> = { beginner: 'bg-green-100 text-green-700', intermediate: 'bg-yellow-100 text-yellow-700', advanced: 'bg-red-100 text-red-700' }
  const sectionLabels: Record<string, string> = ru
    ? { warmup: 'Разминка', main: 'Основная часть', cooldown: 'Заминка' }
    : { warmup: 'Warm-up', main: 'Main', cooldown: 'Cool-down' }

  /* ─── FETCH WORKOUTS ─── */
  const fetchWorkouts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetchWithAuth(`/api/workouts?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setWorkouts(data.workouts || [])
      setTotal(data.total || 0)
    } catch {
      toast.error(ru ? 'Ошибка загрузки' : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, ru])

  useEffect(() => {
    const t = setTimeout(fetchWorkouts, 300)
    return () => clearTimeout(t)
  }, [fetchWorkouts])

  /* ─── FETCH EXERCISES (for picker) ─── */
  const fetchExercises = useCallback(async (search: string) => {
    setLoadingExercises(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (search) params.set('search', search)
      const res = await fetchWithAuth(`/api/exercises?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAllExercises(data.exercises || [])
    } catch { /* ignore */ }
    finally { setLoadingExercises(false) }
  }, [])

  useEffect(() => {
    if (pickerOpen) {
      const t = setTimeout(() => fetchExercises(pickerSearch), 300)
      return () => clearTimeout(t)
    }
  }, [pickerOpen, pickerSearch, fetchExercises])

  /* ─── MODAL HELPERS ─── */
  const resetForm = () => {
    setFormName(''); setFormNameRu(''); setFormDesc(''); setFormDescRu('')
    setFormType('strength'); setFormDiff('intermediate'); setFormDuration(45)
    setFormExercises([]); setEditingId(null)
  }

  const openAdd = () => { resetForm(); setIsModalOpen(true) }

  const openEdit = (w: Workout) => {
    setEditingId(w.id)
    setFormName(w.name); setFormNameRu(w.name_ru || '')
    setFormDesc(w.description || ''); setFormDescRu(w.description_ru || '')
    setFormType(w.type); setFormDiff(w.difficulty); setFormDuration(w.estimated_duration)
    setFormExercises((w.workout_exercises || []).map((we, i) => ({
      _key: `${we.exercise_id}-${i}-${Date.now()}`,
      exercise_id: we.exercise_id,
      exercise_name: we.exercises?.name || '',
      exercise_name_ru: we.exercises?.name_ru || '',
      section: we.section as any || 'main',
      position: we.position ?? i,
      sets: we.sets ?? 3,
      reps: we.reps ?? '12',
      weight: we.weight || '',
      tempo: we.tempo || '',
      rest_seconds: we.rest_seconds ?? 60,
      notes: we.notes || '',
      notes_ru: we.notes_ru || '',
      superset_group: we.superset_group || '',
    })))
    setIsModalOpen(true)
  }

  const duplicateWorkout = async (w: Workout) => {
    setSaving(true)
    try {
      const payload = {
        name: `${w.name} (copy)`,
        name_ru: w.name_ru ? `${w.name_ru} (копия)` : null,
        description: w.description, description_ru: w.description_ru,
        type: w.type, difficulty: w.difficulty, estimated_duration: w.estimated_duration,
        exercises: (w.workout_exercises || []).map((we, i) => ({
          exercise_id: we.exercise_id,
          section: we.section, position: i,
          sets: we.sets, reps: we.reps, weight: we.weight,
          tempo: we.tempo, rest_seconds: we.rest_seconds,
          notes: we.notes, notes_ru: we.notes_ru, superset_group: we.superset_group,
        }))
      }
      const res = await fetchWithAuth('/api/workouts', { method: 'POST', body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      toast.success(ru ? 'Дублировано' : 'Duplicated')
      fetchWorkouts()
    } catch { toast.error(ru ? 'Ошибка' : 'Failed') }
    finally { setSaving(false) }
  }

  /* ─── EXERCISE PICKER ─── */
  const addExercise = (ex: ExerciseRef) => {
    const sectionExercises = formExercises.filter(fe => fe.section === pickerSection)
    const newEx: FormExercise = {
      _key: `${ex.id}-${Date.now()}`,
      exercise_id: ex.id,
      exercise_name: ex.name,
      exercise_name_ru: ex.name_ru || '',
      section: pickerSection,
      position: sectionExercises.length,
      sets: 3, reps: '12', weight: '', tempo: '',
      rest_seconds: 60, notes: '', notes_ru: '', superset_group: '',
    }
    setFormExercises(prev => [...prev, newEx])
  }

  const removeExercise = (key: string) => {
    setFormExercises(prev => prev.filter(e => e._key !== key))
  }

  const updateExercise = (key: string, field: keyof FormExercise, value: any) => {
    setFormExercises(prev => prev.map(e => e._key === key ? { ...e, [field]: value } : e))
  }

  const moveExercise = (key: string, direction: 'up' | 'down') => {
    setFormExercises(prev => {
      const idx = prev.findIndex(e => e._key === key)
      if (idx < 0) return prev
      const section = prev[idx].section
      const sectionItems = prev.filter(e => e.section === section)
      const sectionIdx = sectionItems.findIndex(e => e._key === key)
      const swapIdx = direction === 'up' ? sectionIdx - 1 : sectionIdx + 1
      if (swapIdx < 0 || swapIdx >= sectionItems.length) return prev
      // Swap positions
      const newArr = [...prev]
      const globalIdx1 = newArr.findIndex(e => e._key === sectionItems[sectionIdx]._key)
      const globalIdx2 = newArr.findIndex(e => e._key === sectionItems[swapIdx]._key)
      ;[newArr[globalIdx1], newArr[globalIdx2]] = [newArr[globalIdx2], newArr[globalIdx1]]
      return newArr
    })
  }

  /* ─── SAVE ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) { toast.error(ru ? 'Введите название' : 'Name required'); return }
    setSaving(true)

    // Recalculate positions per section
    const exercises = (['warmup', 'main', 'cooldown'] as const).flatMap(section =>
      formExercises
        .filter(fe => fe.section === section)
        .map((fe, idx) => ({
          exercise_id: fe.exercise_id,
          section,
          position: idx,
          sets: fe.sets,
          reps: fe.reps,
          weight: fe.weight || null,
          tempo: fe.tempo || null,
          rest_seconds: fe.rest_seconds,
          notes: fe.notes || null,
          notes_ru: fe.notes_ru || null,
          superset_group: fe.superset_group || null,
        }))
    )

    const payload = {
      name: formName.trim(),
      name_ru: formNameRu.trim() || null,
      description: formDesc.trim() || null,
      description_ru: formDescRu.trim() || null,
      type: formType,
      difficulty: formDiff,
      estimated_duration: formDuration,
      exercises,
    }

    try {
      const url = editingId ? `/api/workouts/${editingId}` : '/api/workouts'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetchWithAuth(url, { method, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      toast.success(ru ? 'Сохранено' : 'Saved')
      setIsModalOpen(false)
      resetForm()
      fetchWorkouts()
    } catch { toast.error(ru ? 'Ошибка' : 'Failed') }
    finally { setSaving(false) }
  }

  /* ─── DELETE ─── */
  const handleDelete = async () => {
    if (!deleteId) return
    setSaving(true)
    try {
      const res = await fetchWithAuth(`/api/workouts/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(ru ? 'Удалено' : 'Deleted')
      setIsDeleteModalOpen(false); setDeleteId(null)
      fetchWorkouts()
    } catch { toast.error(ru ? 'Ошибка' : 'Failed') }
    finally { setSaving(false) }
  }

  /* ─── Exercise count by section ─── */
  const sectionCount = (w: Workout, s: string) => (w.workout_exercises || []).filter(e => e.section === s).length
  const totalExCount = (w: Workout) => (w.workout_exercises || []).length

  /* ═══════════ RENDER ═══════════ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{ru ? 'Конструктор тренировок' : 'Workout Builder'}</h1>
          <p className="text-zinc-500 mt-1">{total} {ru ? 'тренировок' : 'workouts'}</p>
        </div>
        <Button variant="gradient" onClick={openAdd}><Plus className="w-4 h-4 mr-2" />{ru ? 'Создать' : 'Create Workout'}</Button>
      </div>

      {/* Search */}
      <Card><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input placeholder={ru ? 'Поиск тренировок...' : 'Search workouts...'} className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </CardContent></Card>

      {/* Loading */}
      {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>}

      {/* Empty */}
      {!loading && workouts.length === 0 && (
        <div className="text-center py-16">
          <Dumbbell className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-600 mb-2">{ru ? 'Нет тренировок' : 'No workouts yet'}</h3>
          <p className="text-zinc-400 mb-6">{ru ? 'Создайте первую тренировку' : 'Create your first workout'}</p>
          <Button variant="gradient" onClick={openAdd}><Plus className="w-4 h-4 mr-2" />{ru ? 'Создать' : 'Create'}</Button>
        </div>
      )}

      {/* Workout Cards */}
      {!loading && workouts.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {workouts.map(w => (
            <Card key={w.id} className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">{ru ? (w.name_ru || w.name) : w.name}</h3>
                    {(w.description || w.description_ru) && (
                      <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{ru ? (w.description_ru || w.description) : w.description}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ml-3 whitespace-nowrap ${diffColors[w.difficulty] || 'bg-zinc-100 text-zinc-600'}`}>
                    {diffLabels[w.difficulty] || w.difficulty}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-zinc-500 mb-3">
                  <span className="flex items-center gap-1"><Dumbbell className="w-4 h-4" />{totalExCount(w)} {ru ? 'упр.' : 'ex.'}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{w.estimated_duration} {ru ? 'мин' : 'min'}</span>
                  <Badge variant="secondary" className="text-xs">{typeLabels[w.type] || w.type}</Badge>
                </div>

                {/* Section breakdown */}
                {totalExCount(w) > 0 && (
                  <div className="flex gap-3 mb-4 text-xs text-zinc-500">
                    {(['warmup', 'main', 'cooldown'] as const).map(s => {
                      const c = sectionCount(w, s)
                      if (!c) return null
                      return (
                        <span key={s} className="flex items-center gap-1">
                          {SECTION_ICONS[s]} {sectionLabels[s]}: {c}
                        </span>
                      )
                    })}
                  </div>
                )}

                {/* Exercise preview */}
                {totalExCount(w) > 0 && (
                  <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                    <div className="flex flex-wrap gap-1">
                      {(w.workout_exercises || []).slice(0, 5).map((we, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{ru ? (we.exercises?.name_ru || we.exercises?.name) : we.exercises?.name}</Badge>
                      ))}
                      {totalExCount(w) > 5 && <Badge variant="secondary" className="text-xs">+{totalExCount(w) - 5}</Badge>}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(w)}>
                    <Edit className="w-4 h-4 mr-1" />{ru ? 'Редакт.' : 'Edit'}
                  </Button>
                  <Button variant="ghost" size="sm" title={ru ? 'Дублировать' : 'Duplicate'} onClick={() => duplicateWorkout(w)}>
                    <Copy className="w-4 h-4 text-zinc-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setDeleteId(w.id); setIsDeleteModalOpen(true) }}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ═══════════ ADD/EDIT MODAL ═══════════ */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm() }}
        title={editingId ? (ru ? 'Редактировать тренировку' : 'Edit Workout') : (ru ? 'Новая тренировка' : 'New Workout')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Basic info */}
          <div className={`grid ${lang.isBilingual ? 'sm:grid-cols-2' : ''} gap-4`}>
            <Input label={`${lang.pl(ru ? 'Название' : 'Name')} *`} value={formName} onChange={e => setFormName(e.target.value)} required />
            {lang.isBilingual && <Input label={lang.sl(ru ? 'Название' : 'Name')} value={formNameRu} onChange={e => setFormNameRu(e.target.value)} />}
          </div>
          <div className={`grid ${lang.isBilingual ? 'sm:grid-cols-2' : ''} gap-4`}>
            <Input label={lang.pl(ru ? 'Описание' : 'Description')} value={formDesc} onChange={e => setFormDesc(e.target.value)} />
            {lang.isBilingual && <Input label={lang.sl(ru ? 'Описание' : 'Description')} value={formDescRu} onChange={e => setFormDescRu(e.target.value)} />}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{ru ? 'Тип' : 'Type'}</label>
              <select className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-sm" value={formType} onChange={e => setFormType(e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{typeLabels[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{ru ? 'Сложность' : 'Difficulty'}</label>
              <select className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-sm" value={formDiff} onChange={e => setFormDiff(e.target.value)}>
                {DIFFS.map(d => <option key={d} value={d}>{diffLabels[d]}</option>)}
              </select>
            </div>
            <div>
              <Input label={ru ? 'Длительность (мин)' : 'Duration (min)'} type="number" value={formDuration} onChange={e => setFormDuration(parseInt(e.target.value) || 0)} min={1} />
            </div>
          </div>

          {/* ─── EXERCISES BY SECTION ─── */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            {(['warmup', 'main', 'cooldown'] as const).map(section => {
              const sectionExercises = formExercises.filter(fe => fe.section === section)
              return (
                <div key={section} className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      {SECTION_ICONS[section]} {sectionLabels[section]}
                      <span className="text-zinc-400 font-normal">({sectionExercises.length})</span>
                    </h4>
                    <Button type="button" variant="outline" size="sm" onClick={() => { setPickerSection(section); setPickerOpen(true); setPickerSearch('') }}>
                      <Plus className="w-3 h-3 mr-1" />{ru ? 'Добавить' : 'Add'}
                    </Button>
                  </div>

                  {sectionExercises.length === 0 && (
                    <div className="text-center py-4 text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg">
                      {ru ? 'Нет упражнений' : 'No exercises'}
                    </div>
                  )}

                  {sectionExercises.map((fe, idx) => (
                    <div key={fe._key} className="flex items-center gap-2 p-2.5 mb-1.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                      {/* Drag handle + order buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button type="button" onClick={() => moveExercise(fe._key, 'up')} className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded" disabled={idx === 0}>
                          <ChevronUp className="w-3 h-3 text-zinc-400" />
                        </button>
                        <button type="button" onClick={() => moveExercise(fe._key, 'down')} className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded" disabled={idx === sectionExercises.length - 1}>
                          <ChevronDown className="w-3 h-3 text-zinc-400" />
                        </button>
                      </div>

                      {/* Name */}
                      <span className="font-medium text-sm flex-1 min-w-0 truncate">{ru ? (fe.exercise_name_ru || fe.exercise_name) : fe.exercise_name}</span>

                      {/* Config */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="flex items-center gap-0.5">
                          <input type="number" value={fe.sets} min={1} onChange={e => updateExercise(fe._key, 'sets', parseInt(e.target.value) || 1)}
                            className="w-12 h-7 px-1 text-center border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded text-xs" />
                          <span className="text-[10px] text-zinc-400">{ru ? 'подх' : 'sets'}</span>
                        </div>
                        <span className="text-zinc-300">×</span>
                        <div className="flex items-center gap-0.5">
                          <input type="text" value={fe.reps} onChange={e => updateExercise(fe._key, 'reps', e.target.value)}
                            className="w-14 h-7 px-1 text-center border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded text-xs" placeholder="12" />
                          <span className="text-[10px] text-zinc-400">{ru ? 'повт' : 'reps'}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <input type="text" value={fe.weight} onChange={e => updateExercise(fe._key, 'weight', e.target.value)}
                            className="w-14 h-7 px-1 text-center border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded text-xs" placeholder={ru ? 'вес' : 'wt'} />
                          <span className="text-[10px] text-zinc-400">{ru ? 'кг' : 'kg'}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <input type="number" value={fe.rest_seconds} min={0} step={15} onChange={e => updateExercise(fe._key, 'rest_seconds', parseInt(e.target.value) || 0)}
                            className="w-14 h-7 px-1 text-center border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded text-xs" />
                          <span className="text-[10px] text-zinc-400">{ru ? 'отд' : 'rest'}</span>
                        </div>
                      </div>

                      <button type="button" onClick={() => removeExercise(fe._key)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex-shrink-0">
                        <X className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 sticky bottom-0 bg-white dark:bg-zinc-900 pb-1">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); resetForm() }}>{ru ? 'Отмена' : 'Cancel'}</Button>
            <Button type="submit" variant="gradient" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {ru ? 'Сохранить' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ═══════════ EXERCISE PICKER MODAL ═══════════ */}
      <Modal isOpen={pickerOpen} onClose={() => setPickerOpen(false)}
        title={`${ru ? 'Добавить в' : 'Add to'}: ${sectionLabels[pickerSection]}`} size="md">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input placeholder={ru ? 'Поиск упражнений...' : 'Search exercises...'} className="pl-10" value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} autoFocus />
          </div>

          {loadingExercises && <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-teal-500" /></div>}

          <div className="max-h-[50vh] overflow-y-auto space-y-1">
            {allExercises.map(ex => {
              const alreadyAdded = formExercises.some(fe => fe.exercise_id === ex.id && fe.section === pickerSection)
              return (
                <button key={ex.id} type="button" disabled={alreadyAdded}
                  onClick={() => { addExercise(ex); /* keep picker open */ }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors ${alreadyAdded ? 'opacity-40 cursor-not-allowed bg-zinc-50 dark:bg-zinc-800' : 'hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-200'} border border-zinc-100 dark:border-zinc-800`}>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{ru ? (ex.name_ru || ex.name) : ex.name}</div>
                    <div className="flex gap-1 mt-1">
                      {ex.muscle_groups?.slice(0, 3).map(mg => <Badge key={mg} variant="secondary" className="text-[10px]">{mg}</Badge>)}
                      {ex.equipment && <Badge variant="outline" className="text-[10px]">{ex.equipment}</Badge>}
                    </div>
                  </div>
                  {alreadyAdded
                    ? <span className="text-xs text-zinc-400 flex-shrink-0">{ru ? 'Добавлено' : 'Added'}</span>
                    : <Plus className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  }
                </button>
              )
            })}
            {!loadingExercises && allExercises.length === 0 && (
              <div className="text-center py-8 text-zinc-400 text-sm">{ru ? 'Упражнения не найдены' : 'No exercises found'}</div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setPickerOpen(false)}>{ru ? 'Готово' : 'Done'}</Button>
          </div>
        </div>
      </Modal>

      {/* ═══════════ DELETE MODAL ═══════════ */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setDeleteId(null) }}
        title={ru ? 'Удалить тренировку' : 'Delete Workout'} size="sm">
        <div className="space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400">{ru ? 'Вы уверены? Это действие нельзя отменить.' : 'Are you sure? This cannot be undone.'}</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>{ru ? 'Отмена' : 'Cancel'}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving} className="bg-red-500 hover:bg-red-600 text-white">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-2" />{ru ? 'Удалить' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
