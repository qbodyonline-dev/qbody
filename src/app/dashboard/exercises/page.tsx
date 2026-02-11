'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { fetchWithAuth } from '@/lib/api'
import { Search, Plus, Play, Edit, Trash2, Video, Loader2, Dumbbell, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

/* ═══════════ TYPES ═══════════ */
type Exercise = {
  id: string
  name: string
  name_ru: string | null
  description: string | null
  description_ru: string | null
  muscle_groups: string[]
  equipment: string | null
  category: string | null
  difficulty: string | null
  instructions: string | null
  instructions_ru: string | null
  common_mistakes: string | null
  common_mistakes_ru: string | null
  regressions: string | null
  regressions_ru: string | null
  progressions: string | null
  progressions_ru: string | null
  video_url: string | null
  thumbnail_url: string | null
  created_at: string
}

type FormData = {
  name: string
  name_ru: string
  description: string
  description_ru: string
  muscle_groups: string[]
  equipment: string
  category: string
  difficulty: string
  instructions: string
  instructions_ru: string
  common_mistakes: string
  common_mistakes_ru: string
  regressions: string
  regressions_ru: string
  progressions: string
  progressions_ru: string
  video_url: string
}

const EMPTY_FORM: FormData = {
  name: '', name_ru: '', description: '', description_ru: '',
  muscle_groups: [], equipment: 'bodyweight', category: 'strength', difficulty: 'intermediate',
  instructions: '', instructions_ru: '',
  common_mistakes: '', common_mistakes_ru: '',
  regressions: '', regressions_ru: '',
  progressions: '', progressions_ru: '',
  video_url: ''
}

const MUSCLE_GROUPS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'glutes', 'cardio']
const EQUIPMENT = ['bodyweight', 'dumbbells', 'barbell', 'kettlebell', 'machine', 'cables', 'bands', 'ball', 'bench', 'other']
const CATEGORIES = ['strength', 'cardio', 'mobility', 'stretching', 'warmup', 'plyometric', 'balance']
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

/* ═══════════ COMPONENT ═══════════ */
export default function ExercisesPage() {
  const { t, locale } = useTranslation()
  const ru = locale === 'ru'

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [muscleFilter, setMuscleFilter] = useState('')
  const [equipmentFilter, setEquipmentFilter] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({ ...EMPTY_FORM })
  const [activeTab, setActiveTab] = useState<'basic' | 'technique' | 'video'>('basic')

  /* ─── FETCH ─── */
  const fetchExercises = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (muscleFilter) params.set('muscle', muscleFilter)
      if (equipmentFilter) params.set('equipment', equipmentFilter)

      const res = await fetchWithAuth(`/api/exercises?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setExercises(data.exercises || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error(err)
      toast.error(ru ? 'Ошибка загрузки' : 'Failed to load exercises')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, muscleFilter, equipmentFilter, ru])

  useEffect(() => {
    const timer = setTimeout(fetchExercises, 300)
    return () => clearTimeout(timer)
  }, [fetchExercises])

  /* ─── MODAL ─── */
  const openAdd = () => {
    setEditingId(null)
    setFormData({ ...EMPTY_FORM })
    setActiveTab('basic')
    setIsModalOpen(true)
  }

  const openEdit = (ex: Exercise) => {
    setEditingId(ex.id)
    setFormData({
      name: ex.name || '',
      name_ru: ex.name_ru || '',
      description: ex.description || '',
      description_ru: ex.description_ru || '',
      muscle_groups: ex.muscle_groups || [],
      equipment: ex.equipment || 'bodyweight',
      category: ex.category || 'strength',
      difficulty: ex.difficulty || 'intermediate',
      instructions: ex.instructions || '',
      instructions_ru: ex.instructions_ru || '',
      common_mistakes: ex.common_mistakes || '',
      common_mistakes_ru: ex.common_mistakes_ru || '',
      regressions: ex.regressions || '',
      regressions_ru: ex.regressions_ru || '',
      progressions: ex.progressions || '',
      progressions_ru: ex.progressions_ru || '',
      video_url: ex.video_url || '',
    })
    setActiveTab('basic')
    setIsModalOpen(true)
  }

  /* ─── SAVE ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error(ru ? 'Введите название' : 'Name is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: formData.name.trim(),
        name_ru: formData.name_ru.trim() || null,
        description: formData.description.trim() || null,
        description_ru: formData.description_ru.trim() || null,
        muscle_groups: formData.muscle_groups,
        equipment: formData.equipment,
        category: formData.category,
        difficulty: formData.difficulty,
        instructions: formData.instructions.trim() || null,
        instructions_ru: formData.instructions_ru.trim() || null,
        common_mistakes: formData.common_mistakes.trim() || null,
        common_mistakes_ru: formData.common_mistakes_ru.trim() || null,
        regressions: formData.regressions.trim() || null,
        regressions_ru: formData.regressions_ru.trim() || null,
        progressions: formData.progressions.trim() || null,
        progressions_ru: formData.progressions_ru.trim() || null,
        video_url: formData.video_url.trim() || null,
      }

      let res: Response
      if (editingId) {
        res = await fetchWithAuth(`/api/exercises/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetchWithAuth('/api/exercises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) throw new Error('Save failed')

      toast.success(ru ? 'Сохранено' : 'Saved')
      setIsModalOpen(false)
      fetchExercises()
    } catch (err) {
      toast.error(ru ? 'Ошибка сохранения' : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  /* ─── DELETE ─── */
  const handleDelete = async () => {
    if (!editingId) return
    setSaving(true)
    try {
      const res = await fetchWithAuth(`/api/exercises/${editingId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success(ru ? 'Удалено' : 'Deleted')
      setIsDeleteModalOpen(false)
      setEditingId(null)
      fetchExercises()
    } catch (err) {
      toast.error(ru ? 'Ошибка удаления' : 'Failed to delete')
    } finally {
      setSaving(false)
    }
  }

  const toggleMuscle = (g: string) => {
    setFormData(prev => ({
      ...prev,
      muscle_groups: prev.muscle_groups.includes(g)
        ? prev.muscle_groups.filter(x => x !== g)
        : [...prev.muscle_groups, g]
    }))
  }

  const label = (key: string) => {
    try { return t(`exercises.${key}`) } catch { return key }
  }
  const mgLabel = (g: string) => {
    try { return t(`exercises.filters.${g}`) } catch { return g }
  }
  const eqLabel = (e: string) => {
    try { return t(`exercises.equipment.${e}`) } catch { return e }
  }

  const catLabels: Record<string, string> = ru
    ? { strength: 'Сила', cardio: 'Кардио', mobility: 'Мобильность', stretching: 'Растяжка', warmup: 'Разминка', plyometric: 'Плиометрика', balance: 'Баланс' }
    : { strength: 'Strength', cardio: 'Cardio', mobility: 'Mobility', stretching: 'Stretching', warmup: 'Warm-up', plyometric: 'Plyometric', balance: 'Balance' }

  const diffLabels: Record<string, string> = ru
    ? { beginner: 'Начинающий', intermediate: 'Средний', advanced: 'Продвинутый' }
    : { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }

  const diffColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700'
  }

  /* ═══════════ RENDER ═══════════ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{ru ? 'Библиотека упражнений' : 'Exercise Library'}</h1>
          <p className="text-zinc-500 mt-1">{total} {ru ? 'упражнений' : 'exercises'}</p>
        </div>
        <Button variant="gradient" onClick={openAdd}><Plus className="w-4 h-4 mr-2" />{ru ? 'Добавить' : 'Add Exercise'}</Button>
      </div>

      {/* Filters */}
      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input placeholder={ru ? 'Поиск упражнений...' : 'Search exercises...'} className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant={!muscleFilter ? 'default' : 'outline'} size="sm" onClick={() => setMuscleFilter('')}>{ru ? 'Все' : 'All'}</Button>
            {['chest', 'back', 'legs', 'core', 'arms', 'glutes', 'shoulders'].map((f) => (
              <Button key={f} variant={muscleFilter === f ? 'default' : 'outline'} size="sm" onClick={() => setMuscleFilter(muscleFilter === f ? '' : f)}>{mgLabel(f)}</Button>
            ))}
          </div>
        </div>
        {/* Equipment filter */}
        <div className="flex gap-2 flex-wrap mt-3">
          <span className="text-sm text-zinc-500 py-1">{ru ? 'Инвентарь:' : 'Equipment:'}</span>
          {['bodyweight', 'dumbbells', 'barbell', 'kettlebell', 'machine', 'bands'].map(eq => (
            <Button key={eq} variant={equipmentFilter === eq ? 'default' : 'outline'} size="sm" onClick={() => setEquipmentFilter(equipmentFilter === eq ? '' : eq)}>{eqLabel(eq)}</Button>
          ))}
        </div>
      </CardContent></Card>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      )}

      {/* Empty state */}
      {!loading && exercises.length === 0 && (
        <div className="text-center py-16">
          <Dumbbell className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-600 mb-2">{ru ? 'Нет упражнений' : 'No exercises yet'}</h3>
          <p className="text-zinc-400 mb-6">{ru ? 'Добавьте первое упражнение в библиотеку' : 'Add your first exercise to the library'}</p>
          <Button variant="gradient" onClick={openAdd}><Plus className="w-4 h-4 mr-2" />{ru ? 'Добавить' : 'Add Exercise'}</Button>
        </div>
      )}

      {/* Grid */}
      {!loading && exercises.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => (
            <Card key={ex.id} className="card-hover group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{ru ? (ex.name_ru || ex.name) : ex.name}</h3>
                    <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{ru ? (ex.description_ru || ex.description) : ex.description}</p>
                  </div>
                  {ex.video_url && (
                    <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center flex-shrink-0 ml-3">
                      <Play className="w-4 h-4 text-teal-500" />
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex gap-1 flex-wrap mb-3">
                  {ex.muscle_groups?.map(mg => (
                    <Badge key={mg} variant="secondary" className="text-xs">{mgLabel(mg)}</Badge>
                  ))}
                  {ex.difficulty && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColors[ex.difficulty] || 'bg-zinc-100 text-zinc-600'}`}>
                      {diffLabels[ex.difficulty] || ex.difficulty}
                    </span>
                  )}
                </div>

                <p className="text-sm text-zinc-500 mb-4">
                  <span className="font-medium">{ru ? 'Инвентарь' : 'Equipment'}:</span> {eqLabel(ex.equipment || 'bodyweight')}
                  {ex.category && <> · {catLabels[ex.category] || ex.category}</>}
                </p>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(ex)}>
                    <Edit className="w-4 h-4 mr-1" />{ru ? 'Редакт.' : 'Edit'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setEditingId(ex.id); setIsDeleteModalOpen(true) }}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ═══════════ ADD/EDIT MODAL ═══════════ */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? (ru ? 'Редактировать упражнение' : 'Edit Exercise') : (ru ? 'Новое упражнение' : 'New Exercise')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            {(['basic', 'technique', 'video'] as const).map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700'}`}>
                {tab === 'basic' ? (ru ? 'Основное' : 'Basic') : tab === 'technique' ? (ru ? 'Техника' : 'Technique') : (ru ? 'Видео' : 'Video')}
              </button>
            ))}
          </div>

          {/* TAB: Basic */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label={`${ru ? 'Название' : 'Name'} (EN) *`} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                <Input label={`${ru ? 'Название' : 'Name'} (RU)`} value={formData.name_ru} onChange={(e) => setFormData({...formData, name_ru: e.target.value})} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label={`${ru ? 'Описание' : 'Description'} (EN)`} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                <Input label={`${ru ? 'Описание' : 'Description'} (RU)`} value={formData.description_ru} onChange={(e) => setFormData({...formData, description_ru: e.target.value})} />
              </div>

              {/* Muscle groups */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{ru ? 'Группы мышц' : 'Muscle Groups'}</label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_GROUPS.map(g => (
                    <button key={g} type="button" onClick={() => toggleMuscle(g)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${formData.muscle_groups.includes(g) ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'}`}>
                      {mgLabel(g)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment, Category, Difficulty */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{ru ? 'Инвентарь' : 'Equipment'}</label>
                  <select className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 text-sm" value={formData.equipment} onChange={e => setFormData({...formData, equipment: e.target.value})}>
                    {EQUIPMENT.map(eq => <option key={eq} value={eq}>{eqLabel(eq)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{ru ? 'Категория' : 'Category'}</label>
                  <select className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{catLabels[c] || c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{ru ? 'Сложность' : 'Difficulty'}</label>
                  <select className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 text-sm" value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{diffLabels[d] || d}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Technique */}
          {activeTab === 'technique' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{ru ? 'Инструкция' : 'Instructions'} (EN)</label>
                  <textarea className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 resize-none text-sm" rows={4} placeholder="Step by step..." value={formData.instructions} onChange={e => setFormData({...formData, instructions: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{ru ? 'Инструкция' : 'Instructions'} (RU)</label>
                  <textarea className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 resize-none text-sm" rows={4} placeholder="Пошагово..." value={formData.instructions_ru} onChange={e => setFormData({...formData, instructions_ru: e.target.value})} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{ru ? 'Типичные ошибки' : 'Common Mistakes'} (EN)</label>
                  <textarea className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 resize-none text-sm" rows={3} value={formData.common_mistakes} onChange={e => setFormData({...formData, common_mistakes: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{ru ? 'Типичные ошибки' : 'Common Mistakes'} (RU)</label>
                  <textarea className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 resize-none text-sm" rows={3} value={formData.common_mistakes_ru} onChange={e => setFormData({...formData, common_mistakes_ru: e.target.value})} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{ru ? 'Регрессии (упрощения)' : 'Regressions'} (EN)</label>
                  <textarea className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 resize-none text-sm" rows={2} placeholder={ru ? 'Облегчённые варианты...' : 'Easier alternatives...'} value={formData.regressions} onChange={e => setFormData({...formData, regressions: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{ru ? 'Регрессии (упрощения)' : 'Regressions'} (RU)</label>
                  <textarea className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 resize-none text-sm" rows={2} value={formData.regressions_ru} onChange={e => setFormData({...formData, regressions_ru: e.target.value})} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{ru ? 'Прогрессии (усложнения)' : 'Progressions'} (EN)</label>
                  <textarea className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 resize-none text-sm" rows={2} placeholder={ru ? 'Усложнённые варианты...' : 'Harder variations...'} value={formData.progressions} onChange={e => setFormData({...formData, progressions: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{ru ? 'Прогрессии (усложнения)' : 'Progressions'} (RU)</label>
                  <textarea className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 resize-none text-sm" rows={2} value={formData.progressions_ru} onChange={e => setFormData({...formData, progressions_ru: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {/* TAB: Video */}
          {activeTab === 'video' && (
            <div className="space-y-4">
              <Input label={ru ? 'Ссылка на видео (YouTube / Vimeo / CDN)' : 'Video URL (YouTube / Vimeo / CDN)'} placeholder="https://youtube.com/watch?v=..." value={formData.video_url} onChange={e => setFormData({...formData, video_url: e.target.value})} />
              
              {formData.video_url && (
                <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                  {formData.video_url.includes('youtube.com') || formData.video_url.includes('youtu.be') ? (
                    <iframe
                      className="w-full aspect-video"
                      src={`https://www.youtube.com/embed/${extractYouTubeId(formData.video_url)}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : formData.video_url.includes('vimeo.com') ? (
                    <iframe
                      className="w-full aspect-video"
                      src={`https://player.vimeo.com/video/${formData.video_url.split('/').pop()}`}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="p-6 text-center">
                      <Video className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                      <a href={formData.video_url} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline inline-flex items-center gap-1">
                        {ru ? 'Открыть видео' : 'Open video'} <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {!formData.video_url && (
                <div className="p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-center">
                  <Video className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">{ru ? 'Вставьте ссылку на видео выше' : 'Paste a video URL above'}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{ru ? 'Отмена' : 'Cancel'}</Button>
            <Button type="submit" variant="gradient" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {ru ? 'Сохранить' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setEditingId(null) }} title={ru ? 'Удалить упражнение' : 'Delete Exercise'} size="sm">
        <div className="space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400">{ru ? 'Вы уверены? Это действие нельзя отменить.' : 'Are you sure? This action cannot be undone.'}</p>
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

/* ─── Helper ─── */
function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/)
  return match?.[1] || ''
}
