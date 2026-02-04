'use client'
import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { Search, Plus, Edit, Trash2, Clock, Dumbbell, GripVertical } from 'lucide-react'
import { toast } from 'sonner'

const initialWorkouts = [
  { id: '1', name: 'Full Body Beginner', nameRu: 'Всё тело для начинающих', exercises: [
    { id: 1, name: 'Squats', sets: 3, reps: 12, rest: 60 },
    { id: 2, name: 'Push-ups', sets: 3, reps: 10, rest: 60 },
    { id: 3, name: 'Plank', sets: 3, reps: 30, rest: 45 },
  ], duration: '45 min', difficulty: 'easy' },
  { id: '2', name: 'Upper Body Strength', nameRu: 'Сила верха тела', exercises: [
    { id: 1, name: 'Bench Press', sets: 4, reps: 8, rest: 90 },
    { id: 2, name: 'Rows', sets: 4, reps: 10, rest: 90 },
  ], duration: '50 min', difficulty: 'medium' },
  { id: '3', name: 'HIIT Cardio', nameRu: 'ВИИТ Кардио', exercises: [], duration: '30 min', difficulty: 'hard' },
  { id: '4', name: 'Core & Abs', nameRu: 'Пресс и кор', exercises: [], duration: '25 min', difficulty: 'medium' },
]

const availableExercises = [
  { id: 1, name: 'Squats', nameRu: 'Приседания' },
  { id: 2, name: 'Push-ups', nameRu: 'Отжимания' },
  { id: 3, name: 'Plank', nameRu: 'Планка' },
  { id: 4, name: 'Lunges', nameRu: 'Выпады' },
  { id: 5, name: 'Deadlift', nameRu: 'Становая тяга' },
  { id: 6, name: 'Bench Press', nameRu: 'Жим лёжа' },
  { id: 7, name: 'Rows', nameRu: 'Тяга' },
  { id: 8, name: 'Shoulder Press', nameRu: 'Жим плечами' },
]

export default function WorkoutsPage() {
  const { t, locale } = useTranslation()
  const [workouts, setWorkouts] = useState(initialWorkouts)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '', nameRu: '', difficulty: 'medium', exercises: [] as any[]
  })

  const filtered = workouts.filter(w => {
    const name = locale === 'ru' ? w.nameRu : w.name
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const resetForm = () => {
    setFormData({ name: '', nameRu: '', difficulty: 'medium', exercises: [] })
    setEditingWorkout(null)
  }

  const openAddModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (workout: any) => {
    setEditingWorkout(workout)
    setFormData({
      name: workout.name,
      nameRu: workout.nameRu,
      difficulty: workout.difficulty,
      exercises: [...workout.exercises]
    })
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingWorkout) {
      setWorkouts(workouts.map(w => w.id === editingWorkout.id ? {
        ...w,
        ...formData,
        duration: `${formData.exercises.length * 5 + 15} min`
      } : w))
      toast.success(t('settings.saved'))
    } else {
      const newWorkout = {
        id: String(Date.now()),
        ...formData,
        duration: `${formData.exercises.length * 5 + 15} min`
      }
      setWorkouts([newWorkout, ...workouts])
      toast.success(t('settings.saved'))
    }
    setIsModalOpen(false)
    resetForm()
  }

  const handleDelete = () => {
    if (!editingWorkout) return
    setWorkouts(workouts.filter(w => w.id !== editingWorkout.id))
    setIsDeleteModalOpen(false)
    setEditingWorkout(null)
    toast.success(t('admin.clientDeleted'))
  }

  const addExerciseToWorkout = (exercise: any) => {
    const newExercise = {
      id: Date.now(),
      name: exercise.name,
      nameRu: exercise.nameRu,
      sets: 3,
      reps: 10,
      rest: 60
    }
    setFormData({ ...formData, exercises: [...formData.exercises, newExercise] })
  }

  const updateExercise = (index: number, field: string, value: number) => {
    const updated = [...formData.exercises]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, exercises: updated })
  }

  const removeExercise = (index: number) => {
    setFormData({ ...formData, exercises: formData.exercises.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-zinc-900">{t('workouts.title')}</h1><p className="text-zinc-500 mt-1">{t('workouts.subtitle')}</p></div>
        <Button variant="gradient" onClick={openAddModal}><Plus className="w-4 h-4 mr-2" />{t('workouts.addWorkout')}</Button>
      </div>

      <Card><CardContent className="p-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" /><Input placeholder={t('workouts.searchPlaceholder')} className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
      </CardContent></Card>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((workout) => (
          <Card key={workout.id} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-zinc-900 text-lg">{locale === 'ru' ? workout.nameRu : workout.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500">
                    <span className="flex items-center gap-1"><Dumbbell className="w-4 h-4" />{workout.exercises.length} {t('workouts.table.exercises')}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{workout.duration}</span>
                  </div>
                </div>
                <Badge variant={workout.difficulty === 'easy' ? 'success' : workout.difficulty === 'medium' ? 'warning' : 'destructive'}>
                  {t(`workouts.difficulty.${workout.difficulty}`)}
                </Badge>
              </div>
              {workout.exercises.length > 0 && (
                <div className="mb-4 p-3 bg-zinc-50 rounded-xl">
                  <p className="text-xs text-zinc-500 mb-2">Exercises:</p>
                  <div className="flex flex-wrap gap-1">
                    {workout.exercises.slice(0, 4).map((ex: any, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{locale === 'ru' ? ex.nameRu || ex.name : ex.name}</Badge>
                    ))}
                    {workout.exercises.length > 4 && <Badge variant="secondary" className="text-xs">+{workout.exercises.length - 4}</Badge>}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(workout)}><Edit className="w-4 h-4 mr-1" />{t('common.edit')}</Button>
                <Button variant="ghost" size="sm" onClick={() => { setEditingWorkout(workout); setIsDeleteModalOpen(true); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title={editingWorkout ? t('workouts.modal.editTitle') : t('workouts.modal.addTitle')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label={`${t('workouts.modal.name')} (EN)`} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <Input label={`${t('workouts.modal.name')} (RU)`} value={formData.nameRu} onChange={(e) => setFormData({...formData, nameRu: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">{t('workouts.modal.difficulty')}</label>
            <select className="w-full h-12 px-4 rounded-xl border border-zinc-200" value={formData.difficulty} onChange={(e) => setFormData({...formData, difficulty: e.target.value})}>
              <option value="easy">{t('workouts.difficulty.easy')}</option>
              <option value="medium">{t('workouts.difficulty.medium')}</option>
              <option value="hard">{t('workouts.difficulty.hard')}</option>
            </select>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t('workouts.modal.exercises')}</h3>
            </div>
            
            {/* Exercise selector */}
            <div className="mb-4 p-4 bg-zinc-50 rounded-xl">
              <p className="text-sm text-zinc-500 mb-3">{t('workouts.modal.addExercise')}:</p>
              <div className="flex flex-wrap gap-2">
                {availableExercises.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => addExerciseToWorkout(ex)}
                    className="px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-colors"
                  >
                    + {locale === 'ru' ? ex.nameRu : ex.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Added exercises */}
            {formData.exercises.length > 0 ? (
              <div className="space-y-3">
                {formData.exercises.map((ex, index) => (
                  <div key={ex.id} className="flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-xl">
                    <GripVertical className="w-4 h-4 text-zinc-400 cursor-move" />
                    <span className="font-medium flex-1">{locale === 'ru' ? ex.nameRu || ex.name : ex.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <input type="number" value={ex.sets} onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))} className="w-14 h-8 px-2 text-center border border-zinc-200 rounded-lg text-sm" />
                        <span className="text-xs text-zinc-500">{t('workouts.modal.sets')}</span>
                      </div>
                      <span className="text-zinc-300">×</span>
                      <div className="flex items-center gap-1">
                        <input type="number" value={ex.reps} onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value))} className="w-14 h-8 px-2 text-center border border-zinc-200 rounded-lg text-sm" />
                        <span className="text-xs text-zinc-500">{t('workouts.modal.reps')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input type="number" value={ex.rest} onChange={(e) => updateExercise(index, 'rest', parseInt(e.target.value))} className="w-14 h-8 px-2 text-center border border-zinc-200 rounded-lg text-sm" />
                        <span className="text-xs text-zinc-500">{t('workouts.modal.rest')}</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeExercise(index)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500 border-2 border-dashed border-zinc-200 rounded-xl">
                Click exercises above to add them to this workout
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>{t('common.cancel')}</Button>
            <Button type="submit" variant="gradient">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setEditingWorkout(null); }} title={t('common.delete')} size="sm">
        <div className="space-y-4">
          <p className="text-zinc-600">{t('admin.deleteConfirm')} {editingWorkout?.name}? {t('admin.deleteWarning')}</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white"><Trash2 className="w-4 h-4 mr-2" />{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
