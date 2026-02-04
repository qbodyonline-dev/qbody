'use client'
import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { Search, Plus, Play, Edit, Trash2, Upload, Video } from 'lucide-react'
import { toast } from 'sonner'

const initialExercises = [
  { id: '1', name: 'Squats', nameRu: 'Приседания', description: 'Basic lower body exercise', descriptionRu: 'Базовое упражнение на низ тела', muscleGroups: ['legs', 'core'], equipment: 'bodyweight', hasVideo: true, instructions: '1. Stand with feet shoulder-width apart\n2. Lower your body as if sitting back into a chair\n3. Keep your chest up and knees over toes\n4. Return to starting position' },
  { id: '2', name: 'Push-ups', nameRu: 'Отжимания', description: 'Upper body pushing exercise', descriptionRu: 'Толкающее упражнение на верх тела', muscleGroups: ['chest', 'arms'], equipment: 'bodyweight', hasVideo: true, instructions: '' },
  { id: '3', name: 'Deadlift', nameRu: 'Становая тяга', description: 'Compound pulling movement', descriptionRu: 'Комплексное тяговое движение', muscleGroups: ['back', 'legs'], equipment: 'barbell', hasVideo: false, instructions: '' },
  { id: '4', name: 'Plank', nameRu: 'Планка', description: 'Core stabilization exercise', descriptionRu: 'Упражнение на стабилизацию кора', muscleGroups: ['core'], equipment: 'bodyweight', hasVideo: true, instructions: '' },
  { id: '5', name: 'Lunges', nameRu: 'Выпады', description: 'Unilateral leg exercise', descriptionRu: 'Одностороннее упражнение на ноги', muscleGroups: ['legs'], equipment: 'bodyweight', hasVideo: false, instructions: '' },
  { id: '6', name: 'Bench Press', nameRu: 'Жим лёжа', description: 'Chest pressing movement', descriptionRu: 'Жимовое движение на грудь', muscleGroups: ['chest', 'arms', 'shoulders'], equipment: 'barbell', hasVideo: false, instructions: '' },
]

const muscleGroupOptions = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio']
const equipmentOptions = ['bodyweight', 'dumbbells', 'barbell', 'kettlebell', 'machine', 'cables', 'bands']

export default function ExercisesPage() {
  const { t, locale } = useTranslation()
  const [exercises, setExercises] = useState(initialExercises)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '', nameRu: '', description: '', descriptionRu: '', 
    muscleGroups: [] as string[], equipment: 'bodyweight', 
    instructions: '', instructionsRu: '', hasVideo: false
  })

  const filtered = exercises.filter(e => {
    const matchesSearch = (locale === 'ru' ? e.nameRu : e.name).toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || e.muscleGroups.includes(filter)
    return matchesSearch && matchesFilter
  })

  const resetForm = () => {
    setFormData({
      name: '', nameRu: '', description: '', descriptionRu: '', 
      muscleGroups: [], equipment: 'bodyweight', 
      instructions: '', instructionsRu: '', hasVideo: false
    })
    setEditingExercise(null)
  }

  const openAddModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (exercise: any) => {
    setEditingExercise(exercise)
    setFormData({
      name: exercise.name,
      nameRu: exercise.nameRu,
      description: exercise.description || '',
      descriptionRu: exercise.descriptionRu || '',
      muscleGroups: exercise.muscleGroups,
      equipment: exercise.equipment,
      instructions: exercise.instructions || '',
      instructionsRu: exercise.instructionsRu || '',
      hasVideo: exercise.hasVideo
    })
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingExercise) {
      setExercises(exercises.map(ex => ex.id === editingExercise.id ? { ...ex, ...formData } : ex))
      toast.success(t('settings.saved'))
    } else {
      const newExercise = { id: String(Date.now()), ...formData }
      setExercises([newExercise, ...exercises])
      toast.success(t('settings.saved'))
    }
    setIsModalOpen(false)
    resetForm()
  }

  const handleDelete = () => {
    if (!editingExercise) return
    setExercises(exercises.filter(ex => ex.id !== editingExercise.id))
    setIsDeleteModalOpen(false)
    setEditingExercise(null)
    toast.success(t('admin.clientDeleted'))
  }

  const toggleMuscleGroup = (group: string) => {
    if (formData.muscleGroups.includes(group)) {
      setFormData({ ...formData, muscleGroups: formData.muscleGroups.filter(g => g !== group) })
    } else {
      setFormData({ ...formData, muscleGroups: [...formData.muscleGroups, group] })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-zinc-900">{t('exercises.title')}</h1><p className="text-zinc-500 mt-1">{t('exercises.subtitle')}</p></div>
        <Button variant="gradient" onClick={openAddModal}><Plus className="w-4 h-4 mr-2" />{t('exercises.addExercise')}</Button>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" /><Input placeholder={t('exercises.searchPlaceholder')} className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'chest', 'back', 'legs', 'core', 'arms'].map((f) => (
              <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>{t(`exercises.filters.${f}`)}</Button>
            ))}
          </div>
        </div>
      </CardContent></Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((exercise) => (
          <Card key={exercise.id} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-zinc-900">{locale === 'ru' ? exercise.nameRu : exercise.name}</h3>
                  <p className="text-sm text-zinc-500 mt-1">{locale === 'ru' ? exercise.descriptionRu : exercise.description}</p>
                  <div className="flex gap-1 mt-3 flex-wrap">
                    {exercise.muscleGroups.map(mg => (
                      <Badge key={mg} variant="secondary" className="text-xs">{t(`exercises.filters.${mg}`)}</Badge>
                    ))}
                  </div>
                </div>
                {exercise.hasVideo && (
                  <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                    <Play className="w-4 h-4 text-teal-500" />
                  </div>
                )}
              </div>
              <p className="text-sm text-zinc-500 mb-4">
                <span className="font-medium">{t('exercises.table.equipment')}:</span> {t(`exercises.equipment.${exercise.equipment}`)}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(exercise)}>
                  <Edit className="w-4 h-4 mr-1" />{t('common.edit')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setEditingExercise(exercise); setIsDeleteModalOpen(true); }}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title={editingExercise ? t('exercises.modal.editTitle') : t('exercises.modal.addTitle')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label={`${t('exercises.modal.name')} (EN)`} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <Input label={`${t('exercises.modal.name')} (RU)`} value={formData.nameRu} onChange={(e) => setFormData({...formData, nameRu: e.target.value})} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label={`${t('exercises.modal.description')} (EN)`} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            <Input label={`${t('exercises.modal.description')} (RU)`} value={formData.descriptionRu} onChange={(e) => setFormData({...formData, descriptionRu: e.target.value})} />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">{t('exercises.modal.muscleGroups')}</label>
            <div className="flex flex-wrap gap-2">
              {muscleGroupOptions.map(group => (
                <button
                  key={group}
                  type="button"
                  onClick={() => toggleMuscleGroup(group)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    formData.muscleGroups.includes(group)
                      ? 'bg-teal-500 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {t(`exercises.filters.${group}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">{t('exercises.modal.equipment')}</label>
            <select className="w-full h-12 px-4 rounded-xl border border-zinc-200" value={formData.equipment} onChange={(e) => setFormData({...formData, equipment: e.target.value})}>
              {equipmentOptions.map(eq => (
                <option key={eq} value={eq}>{t(`exercises.equipment.${eq}`)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">{t('exercises.modal.instructions')} (EN)</label>
            <textarea 
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 resize-none" 
              rows={4}
              placeholder="Step by step instructions..."
              value={formData.instructions}
              onChange={(e) => setFormData({...formData, instructions: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">{t('exercises.modal.instructions')} (RU)</label>
            <textarea 
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 resize-none" 
              rows={4}
              placeholder="Пошаговые инструкции..."
              value={formData.instructionsRu}
              onChange={(e) => setFormData({...formData, instructionsRu: e.target.value})}
            />
          </div>

          <div className="p-4 border-2 border-dashed border-zinc-200 rounded-xl text-center">
            <Video className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <p className="text-sm text-zinc-500 mb-2">Upload exercise video</p>
            <Button type="button" variant="outline" size="sm"><Upload className="w-4 h-4 mr-2" />{t('exercises.modal.uploadVideo')}</Button>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>{t('common.cancel')}</Button>
            <Button type="submit" variant="gradient">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setEditingExercise(null); }} title={t('common.delete')} size="sm">
        <div className="space-y-4">
          <p className="text-zinc-600">{t('admin.deleteConfirm')} {editingExercise?.name}? {t('admin.deleteWarning')}</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white"><Trash2 className="w-4 h-4 mr-2" />{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
