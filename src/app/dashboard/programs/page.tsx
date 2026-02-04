'use client'
import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { Plus, Edit, Trash2, Calendar, Users, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

const availableWorkouts = [
  { id: '1', name: 'Full Body Beginner', nameRu: 'Всё тело для начинающих' },
  { id: '2', name: 'Upper Body Strength', nameRu: 'Сила верха тела' },
  { id: '3', name: 'HIIT Cardio', nameRu: 'ВИИТ Кардио' },
  { id: '4', name: 'Core & Abs', nameRu: 'Пресс и кор' },
  { id: '5', name: 'Lower Body', nameRu: 'Низ тела' },
  { id: '6', name: 'Rest Day', nameRu: 'День отдыха' },
]

const initialPrograms = [
  { 
    id: '1', 
    name: '8 Weeks: Lose Weight', 
    nameRu: '8 недель: Похудей', 
    description: 'Comprehensive weight loss program',
    descriptionRu: 'Комплексная программа похудения',
    weeks: 8, 
    clients: 15,
    schedule: [
      { week: 1, days: ['Full Body Beginner', 'Rest Day', 'HIIT Cardio', 'Rest Day', 'Full Body Beginner', 'Rest Day', 'Rest Day'] },
      { week: 2, days: ['Full Body Beginner', 'Rest Day', 'HIIT Cardio', 'Rest Day', 'Full Body Beginner', 'HIIT Cardio', 'Rest Day'] },
    ]
  },
  { 
    id: '2', 
    name: '8 Weeks: Build Muscle', 
    nameRu: '8 недель: Набирай', 
    description: 'Muscle building program',
    descriptionRu: 'Программа набора массы',
    weeks: 8, 
    clients: 8,
    schedule: []
  },
  { 
    id: '3', 
    name: 'Home Fitness', 
    nameRu: 'Фитнес дома', 
    description: 'No equipment needed',
    descriptionRu: 'Без оборудования',
    weeks: 8, 
    clients: 12,
    schedule: []
  },
]

export default function ProgramsPage() {
  const { t, locale } = useTranslation()
  const [programs, setPrograms] = useState(initialPrograms)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<any>(null)
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '', nameRu: '', description: '', descriptionRu: '', weeks: 8, schedule: [] as any[]
  })

  const resetForm = () => {
    setFormData({ name: '', nameRu: '', description: '', descriptionRu: '', weeks: 8, schedule: [] })
    setEditingProgram(null)
    setExpandedWeek(null)
  }

  const openAddModal = () => {
    resetForm()
    // Initialize empty schedule
    const schedule = Array.from({ length: 8 }, (_, i) => ({
      week: i + 1,
      days: Array(7).fill('Rest Day')
    }))
    setFormData({ ...formData, schedule })
    setIsModalOpen(true)
  }

  const openEditModal = (program: any) => {
    setEditingProgram(program)
    // Ensure schedule has all weeks
    const schedule = Array.from({ length: program.weeks }, (_, i) => {
      const existing = program.schedule.find((s: any) => s.week === i + 1)
      return existing || { week: i + 1, days: Array(7).fill('Rest Day') }
    })
    setFormData({
      name: program.name,
      nameRu: program.nameRu,
      description: program.description || '',
      descriptionRu: program.descriptionRu || '',
      weeks: program.weeks,
      schedule
    })
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingProgram) {
      setPrograms(programs.map(p => p.id === editingProgram.id ? {
        ...p,
        ...formData,
      } : p))
      toast.success(t('settings.saved'))
    } else {
      const newProgram = {
        id: String(Date.now()),
        ...formData,
        clients: 0
      }
      setPrograms([newProgram, ...programs])
      toast.success(t('settings.saved'))
    }
    setIsModalOpen(false)
    resetForm()
  }

  const handleDelete = () => {
    if (!editingProgram) return
    setPrograms(programs.filter(p => p.id !== editingProgram.id))
    setIsDeleteModalOpen(false)
    setEditingProgram(null)
    toast.success(t('admin.clientDeleted'))
  }

  const updateWeeksCount = (newWeeks: number) => {
    const currentSchedule = [...formData.schedule]
    if (newWeeks > currentSchedule.length) {
      // Add new weeks
      for (let i = currentSchedule.length; i < newWeeks; i++) {
        currentSchedule.push({ week: i + 1, days: Array(7).fill('Rest Day') })
      }
    } else {
      // Remove weeks
      currentSchedule.length = newWeeks
    }
    setFormData({ ...formData, weeks: newWeeks, schedule: currentSchedule })
  }

  const updateDayWorkout = (weekIndex: number, dayIndex: number, workout: string) => {
    const newSchedule = [...formData.schedule]
    newSchedule[weekIndex].days[dayIndex] = workout
    setFormData({ ...formData, schedule: newSchedule })
  }

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dayNamesRu = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-zinc-900">{t('programs.title')}</h1><p className="text-zinc-500 mt-1">{t('programs.subtitle')}</p></div>
        <Button variant="gradient" onClick={openAddModal}><Plus className="w-4 h-4 mr-2" />{t('programs.addProgram')}</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <Card key={program.id} className="card-hover">
            <CardContent className="p-6">
              <h3 className="font-semibold text-zinc-900 text-lg mb-2">{locale === 'ru' ? program.nameRu : program.name}</h3>
              {program.description && <p className="text-sm text-zinc-500 mb-4">{locale === 'ru' ? program.descriptionRu : program.description}</p>}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 flex items-center gap-2"><Calendar className="w-4 h-4" />{t('programs.table.duration')}</span>
                  <span className="font-medium">{program.weeks} {t('programs.weeks')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 flex items-center gap-2"><Dumbbell className="w-4 h-4" />{t('programs.table.workouts')}</span>
                  <span className="font-medium">{program.schedule.reduce((acc, w) => acc + w.days.filter((d: string) => d !== 'Rest Day').length, 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 flex items-center gap-2"><Users className="w-4 h-4" />{t('programs.table.clients')}</span>
                  <Badge>{program.clients}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => openEditModal(program)}><Edit className="w-4 h-4 mr-2" />{t('common.edit')}</Button>
                <Button variant="ghost" onClick={() => { setEditingProgram(program); setIsDeleteModalOpen(true); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title={editingProgram ? t('programs.modal.editTitle') : t('programs.modal.addTitle')} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label={`${t('programs.modal.name')} (EN)`} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <Input label={`${t('programs.modal.name')} (RU)`} value={formData.nameRu} onChange={(e) => setFormData({...formData, nameRu: e.target.value})} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Description (EN)" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            <Input label="Description (RU)" value={formData.descriptionRu} onChange={(e) => setFormData({...formData, descriptionRu: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">{t('programs.modal.duration')}</label>
            <select className="w-full h-12 px-4 rounded-xl border border-zinc-200" value={formData.weeks} onChange={(e) => updateWeeksCount(parseInt(e.target.value))}>
              {[4, 6, 8, 10, 12].map(w => <option key={w} value={w}>{w} {t('programs.weeks')}</option>)}
            </select>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-4">{t('programs.modal.schedule')}</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {formData.schedule.map((week, weekIndex) => (
                <div key={week.week} className="border border-zinc-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedWeek(expandedWeek === weekIndex ? null : weekIndex)}
                    className="w-full flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 transition-colors"
                  >
                    <span className="font-medium">Week {week.week}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-500">{week.days.filter((d: string) => d !== 'Rest Day').length} workouts</span>
                      {expandedWeek === weekIndex ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>
                  {expandedWeek === weekIndex && (
                    <div className="p-4 grid grid-cols-7 gap-2">
                      {week.days.map((day: string, dayIndex: number) => (
                        <div key={dayIndex} className="text-center">
                          <p className="text-xs text-zinc-500 mb-1">{locale === 'ru' ? dayNamesRu[dayIndex] : dayNames[dayIndex]}</p>
                          <select
                            value={day}
                            onChange={(e) => updateDayWorkout(weekIndex, dayIndex, e.target.value)}
                            className="w-full text-xs p-2 border border-zinc-200 rounded-lg"
                          >
                            {availableWorkouts.map(w => (
                              <option key={w.id} value={w.name}>{locale === 'ru' ? w.nameRu : w.name}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>{t('common.cancel')}</Button>
            <Button type="submit" variant="gradient">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setEditingProgram(null); }} title={t('common.delete')} size="sm">
        <div className="space-y-4">
          <p className="text-zinc-600">{t('admin.deleteConfirm')} {editingProgram?.name}? {t('admin.deleteWarning')}</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white"><Trash2 className="w-4 h-4 mr-2" />{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
