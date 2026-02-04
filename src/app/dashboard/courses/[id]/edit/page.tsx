'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { 
  ArrowLeft, Plus, Save, Trash2, GripVertical, Video, FileText, 
  ChevronDown, ChevronUp, Edit, BookOpen, Loader2, Clock, Eye, EyeOff,
  Image, Type, ListChecks, Play
} from 'lucide-react'
import { toast } from 'sonner'

type Lesson = {
  id: string
  title: string
  title_ru: string | null
  type: 'video' | 'text' | 'task'
  duration_minutes: number
  video_url: string | null
  content: any[]
  content_ru: any[]
  is_free: boolean
  is_published: boolean
  sort_order: number
}

type Module = {
  id: string
  title: string
  title_ru: string | null
  description: string | null
  description_ru: string | null
  sort_order: number
  is_published: boolean
  course_lessons: Lesson[]
}

type Course = {
  id: string
  title: string
  title_ru: string | null
  slug: string
  is_published: boolean
  course_modules: Module[]
}

export default function CourseEditorPage() {
  const { locale } = useTranslation()
  const ru = locale === 'ru'
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  
  // Module modal
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [moduleForm, setModuleForm] = useState({ title: '', title_ru: '', description: '', description_ru: '' })

  // Lesson modal
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<{ lesson: Lesson; moduleId: string } | null>(null)
  const [lessonForm, setLessonForm] = useState({
    title: '', title_ru: '', type: 'video' as 'video' | 'text' | 'task',
    duration_minutes: '10', video_url: '', is_free: false
  })
  const [addingToModuleId, setAddingToModuleId] = useState<string | null>(null)

  const loadCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`)
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      setCourse(data)
      // Expand all modules by default
      setExpandedModules(new Set(data.course_modules?.map((m: Module) => m.id) || []))
    } catch {
      toast.error(ru ? 'Курс не найден' : 'Course not found')
      router.push('/dashboard/courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCourse() }, [courseId])

  const toggleModule = (id: string) => {
    const next = new Set(expandedModules)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedModules(next)
  }

  // === MODULE CRUD ===
  const openAddModule = () => {
    setEditingModule(null)
    setModuleForm({ title: '', title_ru: '', description: '', description_ru: '' })
    setIsModuleModalOpen(true)
  }

  const openEditModule = (mod: Module) => {
    setEditingModule(mod)
    setModuleForm({
      title: mod.title,
      title_ru: mod.title_ru || '',
      description: mod.description || '',
      description_ru: mod.description_ru || '',
    })
    setIsModuleModalOpen(true)
  }

  const saveModule = async () => {
    if (!moduleForm.title.trim()) {
      toast.error(ru ? 'Введите название' : 'Enter title')
      return
    }
    setSaving(true)
    try {
      if (editingModule) {
        // Update
        const res = await fetch(`/api/modules/${editingModule.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(moduleForm),
        })
        if (!res.ok) throw new Error('Failed')
        toast.success(ru ? 'Модуль обновлён' : 'Module updated')
      } else {
        // Create
        const res = await fetch(`/api/courses/${courseId}/modules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(moduleForm),
        })
        if (!res.ok) throw new Error('Failed')
        toast.success(ru ? 'Модуль создан' : 'Module created')
      }
      setIsModuleModalOpen(false)
      loadCourse()
    } catch {
      toast.error(ru ? 'Ошибка сохранения' : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const deleteModule = async (id: string) => {
    if (!confirm(ru ? 'Удалить модуль и все его уроки?' : 'Delete module and all its lessons?')) return
    try {
      const res = await fetch(`/api/modules/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success(ru ? 'Модуль удалён' : 'Module deleted')
      loadCourse()
    } catch {
      toast.error(ru ? 'Ошибка удаления' : 'Delete failed')
    }
  }

  // === LESSON CRUD ===
  const openAddLesson = (moduleId: string) => {
    setEditingLesson(null)
    setAddingToModuleId(moduleId)
    setLessonForm({ title: '', title_ru: '', type: 'video', duration_minutes: '10', video_url: '', is_free: false })
    setIsLessonModalOpen(true)
  }

  const openEditLesson = (lesson: Lesson, moduleId: string) => {
    setEditingLesson({ lesson, moduleId })
    setAddingToModuleId(null)
    setLessonForm({
      title: lesson.title,
      title_ru: lesson.title_ru || '',
      type: lesson.type,
      duration_minutes: String(lesson.duration_minutes),
      video_url: lesson.video_url || '',
      is_free: lesson.is_free,
    })
    setIsLessonModalOpen(true)
  }

  const saveLesson = async () => {
    if (!lessonForm.title.trim()) {
      toast.error(ru ? 'Введите название' : 'Enter title')
      return
    }
    setSaving(true)
    try {
      if (editingLesson) {
        // Update
        const res = await fetch(`/api/lessons/${editingLesson.lesson.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...lessonForm,
            duration_minutes: parseInt(lessonForm.duration_minutes) || 10,
          }),
        })
        if (!res.ok) throw new Error('Failed')
        toast.success(ru ? 'Урок обновлён' : 'Lesson updated')
      } else if (addingToModuleId) {
        // Create
        const res = await fetch(`/api/modules/${addingToModuleId}/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...lessonForm,
            duration_minutes: parseInt(lessonForm.duration_minutes) || 10,
          }),
        })
        if (!res.ok) throw new Error('Failed')
        toast.success(ru ? 'Урок создан' : 'Lesson created')
      }
      setIsLessonModalOpen(false)
      loadCourse()
    } catch {
      toast.error(ru ? 'Ошибка сохранения' : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const deleteLesson = async (id: string) => {
    if (!confirm(ru ? 'Удалить урок?' : 'Delete lesson?')) return
    try {
      const res = await fetch(`/api/lessons/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success(ru ? 'Урок удалён' : 'Lesson deleted')
      loadCourse()
    } catch {
      toast.error(ru ? 'Ошибка удаления' : 'Delete failed')
    }
  }

  const toggleLessonPublished = async (lesson: Lesson) => {
    try {
      await fetch(`/api/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !lesson.is_published }),
      })
      loadCourse()
    } catch {
      toast.error(ru ? 'Ошибка' : 'Error')
    }
  }

  const typeIcon = (type: string) => type === 'video' ? <Video className="w-4 h-4" /> : type === 'text' ? <FileText className="w-4 h-4" /> : <ListChecks className="w-4 h-4" />
  const typeColor = (type: string) => type === 'video' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : type === 'text' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  if (!course) return null

  const totalLessons = course.course_modules?.reduce((sum, m) => sum + (m.course_lessons?.length || 0), 0) || 0
  const totalDuration = course.course_modules?.reduce((sum, m) => 
    sum + (m.course_lessons?.reduce((s, l) => s + l.duration_minutes, 0) || 0), 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/courses">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {ru && course.title_ru ? course.title_ru : course.title}
              </h1>
              <Badge variant={course.is_published ? 'success' : 'secondary'}>
                {course.is_published ? (ru ? 'Опубликован' : 'Published') : (ru ? 'Черновик' : 'Draft')}
              </Badge>
            </div>
            <p className="text-zinc-500 mt-1">{ru ? 'Редактор контента' : 'Content Editor'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/courses/${course.slug}`} target="_blank">
            <Button variant="outline"><Eye className="w-4 h-4 mr-2" />{ru ? 'Просмотр' : 'Preview'}</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{course.course_modules?.length || 0}</div>
          <div className="text-sm text-zinc-500">{ru ? 'Модулей' : 'Modules'}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalLessons}</div>
          <div className="text-sm text-zinc-500">{ru ? 'Уроков' : 'Lessons'}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{Math.round(totalDuration / 60 * 10) / 10}h</div>
          <div className="text-sm text-zinc-500">{ru ? 'Всего времени' : 'Total time'}</div>
        </CardContent></Card>
      </div>

      {/* Modules */}
      <div className="space-y-4">
        {course.course_modules?.map((mod, mi) => (
          <Card key={mod.id} className="overflow-hidden">
            {/* Module header */}
            <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
              <button onClick={() => toggleModule(mod.id)} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded">
                {expandedModules.has(mod.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5 rotate-180" />}
              </button>
              <BookOpen className="w-5 h-5 text-teal-500" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {ru ? 'Модуль' : 'Module'} {mi + 1}: {ru && mod.title_ru ? mod.title_ru : mod.title}
                </h3>
                <p className="text-xs text-zinc-500">
                  {mod.course_lessons?.length || 0} {ru ? 'уроков' : 'lessons'} • {mod.course_lessons?.reduce((s, l) => s + l.duration_minutes, 0) || 0} {ru ? 'мин' : 'min'}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => openEditModule(mod)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteModule(mod.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Lessons */}
            {expandedModules.has(mod.id) && (
              <CardContent className="p-4 space-y-2">
                {mod.course_lessons?.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">{ru ? 'Нет уроков в этом модуле' : 'No lessons in this module'}</p>
                ) : (
                  mod.course_lessons?.map((lesson, li) => (
                    <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <span className="text-xs text-zinc-400 font-mono w-6">{li + 1}</span>
                      <div className={`w-8 h-8 rounded-lg ${typeColor(lesson.type)} flex items-center justify-center flex-shrink-0`}>
                        {typeIcon(lesson.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {ru && lesson.title_ru ? lesson.title_ru : lesson.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Clock className="w-3 h-3" />{lesson.duration_minutes} {ru ? 'мин' : 'min'}
                          {lesson.is_free && <Badge variant="outline" className="text-[10px] py-0 px-1.5">{ru ? 'Бесплатный' : 'Free'}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => toggleLessonPublished(lesson)}
                          className={`p-1.5 rounded-lg transition-colors ${lesson.is_published ? 'text-green-500 hover:bg-green-50' : 'text-zinc-400 hover:bg-zinc-100'}`}
                          title={lesson.is_published ? (ru ? 'Опубликован' : 'Published') : (ru ? 'Скрыт' : 'Hidden')}
                        >
                          {lesson.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <Button variant="ghost" size="sm" onClick={() => openEditLesson(lesson, mod.id)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteLesson(lesson.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}

                {/* Add lesson buttons */}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setLessonForm(f => ({ ...f, type: 'video' })); openAddLesson(mod.id) }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-blue-200 dark:border-blue-800">
                    <Video className="w-4 h-4" />{ru ? 'Видео' : 'Video'}
                  </button>
                  <button onClick={() => { setLessonForm(f => ({ ...f, type: 'text' })); openAddLesson(mod.id) }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors border border-green-200 dark:border-green-800">
                    <FileText className="w-4 h-4" />{ru ? 'Текст' : 'Text'}
                  </button>
                  <button onClick={() => { setLessonForm(f => ({ ...f, type: 'task' })); openAddLesson(mod.id) }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border border-purple-200 dark:border-purple-800">
                    <ListChecks className="w-4 h-4" />{ru ? 'Задание' : 'Task'}
                  </button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {/* Add module button */}
        <button onClick={openAddModule}
          className="w-full p-6 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-2xl text-center hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-colors">
          <Plus className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <span className="text-sm font-medium text-zinc-500">{ru ? 'Добавить модуль' : 'Add Module'}</span>
        </button>
      </div>

      {/* Module Modal */}
      <Modal isOpen={isModuleModalOpen} onClose={() => setIsModuleModalOpen(false)} title={editingModule ? (ru ? 'Редактировать модуль' : 'Edit Module') : (ru ? 'Новый модуль' : 'New Module')} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={ru ? 'Название (EN)' : 'Title (EN)'} value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} />
            <Input label={ru ? 'Название (RU)' : 'Title (RU)'} value={moduleForm.title_ru} onChange={(e) => setModuleForm({ ...moduleForm, title_ru: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{ru ? 'Описание (EN)' : 'Description (EN)'}</label>
              <textarea className="w-full h-20 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none" value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{ru ? 'Описание (RU)' : 'Description (RU)'}</label>
              <textarea className="w-full h-20 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none" value={moduleForm.description_ru} onChange={(e) => setModuleForm({ ...moduleForm, description_ru: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsModuleModalOpen(false)}>{ru ? 'Отмена' : 'Cancel'}</Button>
            <Button variant="gradient" onClick={saveModule} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {ru ? 'Сохранить' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lesson Modal */}
      <Modal isOpen={isLessonModalOpen} onClose={() => setIsLessonModalOpen(false)} title={editingLesson ? (ru ? 'Редактировать урок' : 'Edit Lesson') : (ru ? 'Новый урок' : 'New Lesson')} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={ru ? 'Название (EN)' : 'Title (EN)'} value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} />
            <Input label={ru ? 'Название (RU)' : 'Title (RU)'} value={lessonForm.title_ru} onChange={(e) => setLessonForm({ ...lessonForm, title_ru: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{ru ? 'Тип' : 'Type'}</label>
              <select className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800" value={lessonForm.type} onChange={(e) => setLessonForm({ ...lessonForm, type: e.target.value as any })}>
                <option value="video">📹 {ru ? 'Видео' : 'Video'}</option>
                <option value="text">📄 {ru ? 'Текст' : 'Text'}</option>
                <option value="task">✅ {ru ? 'Задание' : 'Task'}</option>
              </select>
            </div>
            <Input label={ru ? 'Длительность (мин)' : 'Duration (min)'} type="number" value={lessonForm.duration_minutes} onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })} />
            {lessonForm.type === 'video' && (
              <Input label="Video URL" value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} placeholder="https://vimeo.com/..." />
            )}
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 rounded accent-teal-500" checked={lessonForm.is_free} onChange={(e) => setLessonForm({ ...lessonForm, is_free: e.target.checked })} />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{ru ? 'Бесплатный урок (доступен без покупки)' : 'Free lesson (available without purchase)'}</span>
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsLessonModalOpen(false)}>{ru ? 'Отмена' : 'Cancel'}</Button>
            <Button variant="gradient" onClick={saveLesson} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {ru ? 'Сохранить' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
