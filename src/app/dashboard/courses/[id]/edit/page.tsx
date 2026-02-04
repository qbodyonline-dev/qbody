'use client'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { 
  ArrowLeft, Plus, Trash2, Video, FileText, 
  ChevronDown, ChevronUp, Edit, BookOpen, Loader2, Clock, Eye, EyeOff,
  ListChecks, Save, Upload, Image, GripVertical, X, Check
} from 'lucide-react'
import { toast } from 'sonner'

type ContentBlock = {
  id: string
  type: 'heading' | 'text' | 'image' | 'video' | 'checklist'
  content: string
  content_ru?: string
  items?: { id: string; text: string; text_ru?: string }[]
}

type Lesson = {
  id: string
  title: string
  title_ru: string | null
  type: 'video' | 'text' | 'task'
  duration_minutes: number
  video_url: string | null
  content: ContentBlock[]
  content_ru: ContentBlock[]
  is_free: boolean
  is_published: boolean
  sort_order: number
}

type Module = {
  id: string
  title: string
  title_ru: string | null
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
  const [draggedLesson, setDraggedLesson] = useState<{ lessonId: string; moduleId: string } | null>(null)
  
  // Module modal
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [moduleForm, setModuleForm] = useState({ title: '', title_ru: '' })

  // Lesson modal
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<{ lesson: Lesson; moduleId: string } | null>(null)
  const [lessonForm, setLessonForm] = useState({
    title: '', title_ru: '', type: 'video' as 'video' | 'text' | 'task',
    duration_minutes: '10', video_url: '', is_free: false,
    content: [] as ContentBlock[],
    content_ru: [] as ContentBlock[]
  })
  const [addingToModuleId, setAddingToModuleId] = useState<string | null>(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const loadCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`)
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      setCourse(data)
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

  // === UPLOAD FUNCTIONS ===
  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      return data.url
    } catch (err) {
      toast.error(ru ? 'Ошибка загрузки' : 'Upload failed')
      return null
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('video/')) {
      toast.error(ru ? 'Выберите видео файл' : 'Please select a video file')
      return
    }
    
    setUploadingVideo(true)
    const url = await uploadFile(file, 'videos')
    if (url) {
      setLessonForm({ ...lessonForm, video_url: url })
      toast.success(ru ? 'Видео загружено!' : 'Video uploaded!')
    }
    setUploadingVideo(false)
  }

  const handleImageUpload = async (file: File, blockId: string) => {
    setUploadingImage(blockId)
    const url = await uploadFile(file, 'images')
    if (url) {
      const newContent = lessonForm.content.map(b => 
        b.id === blockId ? { ...b, content: url } : b
      )
      setLessonForm({ ...lessonForm, content: newContent })
      toast.success(ru ? 'Изображение загружено!' : 'Image uploaded!')
    }
    setUploadingImage(null)
  }

  // === CONTENT BLOCKS ===
  const addContentBlock = (type: ContentBlock['type']) => {
    const id = `block-${Date.now()}`
    const newBlock: ContentBlock = {
      id,
      type,
      content: '',
      content_ru: '',
      items: type === 'checklist' ? [{ id: `item-${Date.now()}`, text: '', text_ru: '' }] : undefined
    }
    setLessonForm({
      ...lessonForm,
      content: [...lessonForm.content, newBlock],
      content_ru: [...lessonForm.content_ru, { ...newBlock }]
    })
  }

  const updateContentBlock = (blockId: string, field: 'content' | 'content_ru', value: string) => {
    const targetArray = field === 'content' ? 'content' : 'content_ru'
    const newContent = lessonForm[targetArray].map(b => 
      b.id === blockId ? { ...b, content: value } : b
    )
    setLessonForm({ ...lessonForm, [targetArray]: newContent })
  }

  const removeContentBlock = (blockId: string) => {
    setLessonForm({
      ...lessonForm,
      content: lessonForm.content.filter(b => b.id !== blockId),
      content_ru: lessonForm.content_ru.filter(b => b.id !== blockId)
    })
  }

  const addChecklistItem = (blockId: string) => {
    const newContent = lessonForm.content.map(b => {
      if (b.id === blockId && b.items) {
        return { ...b, items: [...b.items, { id: `item-${Date.now()}`, text: '', text_ru: '' }] }
      }
      return b
    })
    setLessonForm({ ...lessonForm, content: newContent })
  }

  const updateChecklistItem = (blockId: string, itemId: string, field: 'text' | 'text_ru', value: string) => {
    const newContent = lessonForm.content.map(b => {
      if (b.id === blockId && b.items) {
        return {
          ...b,
          items: b.items.map(item => 
            item.id === itemId ? { ...item, [field]: value } : item
          )
        }
      }
      return b
    })
    setLessonForm({ ...lessonForm, content: newContent })
  }

  const removeChecklistItem = (blockId: string, itemId: string) => {
    const newContent = lessonForm.content.map(b => {
      if (b.id === blockId && b.items) {
        return { ...b, items: b.items.filter(item => item.id !== itemId) }
      }
      return b
    })
    setLessonForm({ ...lessonForm, content: newContent })
  }

  // === MODULE CRUD ===
  const openAddModule = () => {
    setEditingModule(null)
    setModuleForm({ title: '', title_ru: '' })
    setIsModuleModalOpen(true)
  }

  const openEditModule = (mod: Module) => {
    setEditingModule(mod)
    setModuleForm({ title: mod.title, title_ru: mod.title_ru || '' })
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
        const res = await fetch(`/api/modules/${editingModule.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(moduleForm),
        })
        if (!res.ok) throw new Error('Failed')
        toast.success(ru ? 'Модуль обновлён' : 'Module updated')
      } else {
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
  const openAddLesson = (moduleId: string, type: 'video' | 'text' | 'task') => {
    setEditingLesson(null)
    setAddingToModuleId(moduleId)
    setLessonForm({ 
      title: '', title_ru: '', type, 
      duration_minutes: '10', video_url: '', is_free: false,
      content: [], content_ru: []
    })
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
      content: Array.isArray(lesson.content) ? lesson.content : [],
      content_ru: Array.isArray(lesson.content_ru) ? lesson.content_ru : []
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
      const payload = {
        title: lessonForm.title,
        title_ru: lessonForm.title_ru || null,
        type: lessonForm.type,
        duration_minutes: parseInt(lessonForm.duration_minutes) || 10,
        video_url: lessonForm.video_url || null,
        is_free: lessonForm.is_free,
        content: lessonForm.content,
        content_ru: lessonForm.content_ru,
      }

      if (editingLesson) {
        const res = await fetch(`/api/lessons/${editingLesson.lesson.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed')
        toast.success(ru ? 'Урок сохранён!' : 'Lesson saved!')
      } else if (addingToModuleId) {
        const res = await fetch(`/api/modules/${addingToModuleId}/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed')
        toast.success(ru ? 'Урок создан!' : 'Lesson created!')
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

  // === DRAG & DROP ===
  const handleDragStart = (lessonId: string, moduleId: string) => {
    setDraggedLesson({ lessonId, moduleId })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (targetLessonId: string, targetModuleId: string) => {
    if (!draggedLesson || draggedLesson.moduleId !== targetModuleId) {
      setDraggedLesson(null)
      return
    }
    
    const module = course?.course_modules.find(m => m.id === targetModuleId)
    if (!module) return

    const lessons = [...module.course_lessons]
    const draggedIndex = lessons.findIndex(l => l.id === draggedLesson.lessonId)
    const targetIndex = lessons.findIndex(l => l.id === targetLessonId)
    
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      setDraggedLesson(null)
      return
    }

    // Reorder
    const [removed] = lessons.splice(draggedIndex, 1)
    lessons.splice(targetIndex, 0, removed)

    // Update sort_order for all lessons
    try {
      await Promise.all(lessons.map((lesson, index) => 
        fetch(`/api/lessons/${lesson.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: index }),
        })
      ))
      loadCourse()
      toast.success(ru ? 'Порядок обновлён' : 'Order updated')
    } catch {
      toast.error(ru ? 'Ошибка' : 'Error')
    }
    
    setDraggedLesson(null)
  }

  const typeIcon = (type: string) => type === 'video' ? <Video className="w-4 h-4" /> : type === 'text' ? <FileText className="w-4 h-4" /> : <ListChecks className="w-4 h-4" />
  const typeColor = (type: string) => type === 'video' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : type === 'text' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
  }

  if (!course) return null

  const totalLessons = course.course_modules?.reduce((sum, m) => sum + (m.course_lessons?.length || 0), 0) || 0
  const totalDuration = course.course_modules?.reduce((sum, m) => 
    sum + (m.course_lessons?.reduce((s, l) => s + l.duration_minutes, 0) || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/courses"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{ru && course.title_ru ? course.title_ru : course.title}</h1>
              <Badge variant={course.is_published ? 'success' : 'secondary'}>{course.is_published ? (ru ? 'Опубликован' : 'Published') : (ru ? 'Черновик' : 'Draft')}</Badge>
            </div>
            <p className="text-zinc-500 mt-1">{ru ? 'Редактор уроков' : 'Lesson Editor'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/courses/${courseId}/page-editor`}><Button variant="outline"><FileText className="w-4 h-4 mr-2" />{ru ? 'Редактор страницы' : 'Page Editor'}</Button></Link>
          <Link href={`/courses/${course.slug}`} target="_blank"><Button variant="outline"><Eye className="w-4 h-4 mr-2" />{ru ? 'Просмотр' : 'Preview'}</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{course.course_modules?.length || 0}</div><div className="text-sm text-zinc-500">{ru ? 'Модулей' : 'Modules'}</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{totalLessons}</div><div className="text-sm text-zinc-500">{ru ? 'Уроков' : 'Lessons'}</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{Math.round(totalDuration / 60 * 10) / 10}h</div><div className="text-sm text-zinc-500">{ru ? 'Всего' : 'Total'}</div></CardContent></Card>
      </div>

      <div className="space-y-4">
        {course.course_modules?.map((mod, mi) => (
          <Card key={mod.id} className="overflow-hidden">
            <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
              <button onClick={() => toggleModule(mod.id)} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded">
                {expandedModules.has(mod.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5 rotate-180" />}
              </button>
              <BookOpen className="w-5 h-5 text-teal-500" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{ru ? 'Модуль' : 'Module'} {mi + 1}: {ru && mod.title_ru ? mod.title_ru : mod.title}</h3>
                <p className="text-xs text-zinc-500">{mod.course_lessons?.length || 0} {ru ? 'уроков' : 'lessons'}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => openEditModule(mod)}><Edit className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => deleteModule(mod.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
            </div>

            {expandedModules.has(mod.id) && (
              <CardContent className="p-4 space-y-2">
                {mod.course_lessons?.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">{ru ? 'Нет уроков' : 'No lessons'}</p>
                ) : (
                  mod.course_lessons?.map((lesson, li) => (
                    <div 
                      key={lesson.id} 
                      draggable
                      onDragStart={() => handleDragStart(lesson.id, mod.id)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(lesson.id, mod.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-move ${draggedLesson?.lessonId === lesson.id ? 'opacity-50' : ''}`}
                    >
                      <GripVertical className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                      <span className="text-xs text-zinc-400 font-mono w-6">{li + 1}</span>
                      <div className={`w-8 h-8 rounded-lg ${typeColor(lesson.type)} flex items-center justify-center`}>{typeIcon(lesson.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ru && lesson.title_ru ? lesson.title_ru : lesson.title}</p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Clock className="w-3 h-3" />{lesson.duration_minutes} {ru ? 'мин' : 'min'}
                          {lesson.is_free && <Badge variant="outline" className="text-[10px] py-0 px-1.5">{ru ? 'Бесплатный' : 'Free'}</Badge>}
                        </div>
                      </div>
                      <button onClick={() => toggleLessonPublished(lesson)} className={`p-1.5 rounded-lg ${lesson.is_published ? 'text-green-500' : 'text-zinc-400'}`}>
                        {lesson.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <Button variant="ghost" size="sm" onClick={() => openEditLesson(lesson, mod.id)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteLesson(lesson.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))
                )}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => openAddLesson(mod.id, 'video')} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-blue-600 hover:bg-blue-50 border border-blue-200"><Video className="w-4 h-4" />{ru ? 'Видео' : 'Video'}</button>
                  <button onClick={() => openAddLesson(mod.id, 'text')} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-green-600 hover:bg-green-50 border border-green-200"><FileText className="w-4 h-4" />{ru ? 'Текст' : 'Text'}</button>
                  <button onClick={() => openAddLesson(mod.id, 'task')} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-purple-600 hover:bg-purple-50 border border-purple-200"><ListChecks className="w-4 h-4" />{ru ? 'Задание' : 'Task'}</button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        <button onClick={openAddModule} className="w-full p-6 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-2xl text-center hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/10">
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
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsModuleModalOpen(false)}>{ru ? 'Отмена' : 'Cancel'}</Button>
            <Button variant="gradient" onClick={saveModule} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<Save className="w-4 h-4 mr-2" />{ru ? 'Сохранить' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lesson Modal */}
      <Modal isOpen={isLessonModalOpen} onClose={() => setIsLessonModalOpen(false)} title={editingLesson ? (ru ? 'Редактировать урок' : 'Edit Lesson') : (ru ? 'Новый урок' : 'New Lesson')} size="xl">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <Input label={ru ? 'Название (EN)' : 'Title (EN)'} value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} />
            <Input label={ru ? 'Название (RU)' : 'Title (RU)'} value={lessonForm.title_ru} onChange={(e) => setLessonForm({ ...lessonForm, title_ru: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{ru ? 'Тип' : 'Type'}</label>
              <select className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800" value={lessonForm.type} onChange={(e) => setLessonForm({ ...lessonForm, type: e.target.value as any })}>
                <option value="video">📹 {ru ? 'Видео' : 'Video'}</option>
                <option value="text">📄 {ru ? 'Текст' : 'Text'}</option>
                <option value="task">✅ {ru ? 'Задание' : 'Task'}</option>
              </select>
            </div>
            <Input label={ru ? 'Длительность (мин)' : 'Duration (min)'} type="number" value={lessonForm.duration_minutes} onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })} />
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer h-12">
                <input type="checkbox" className="w-5 h-5 rounded accent-teal-500" checked={lessonForm.is_free} onChange={(e) => setLessonForm({ ...lessonForm, is_free: e.target.checked })} />
                <span className="text-sm">{ru ? 'Бесплатный' : 'Free'}</span>
              </label>
            </div>
          </div>

          {/* Video Upload */}
          {lessonForm.type === 'video' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium">{ru ? 'Видео' : 'Video'}</label>
              <div className="flex gap-3">
                <Input 
                  placeholder={ru ? 'URL видео или загрузите файл' : 'Video URL or upload file'}
                  value={lessonForm.video_url} 
                  onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} 
                  className="flex-1"
                />
                <input type="file" ref={videoInputRef} accept="video/*" className="hidden" onChange={handleVideoUpload} />
                <Button variant="outline" onClick={() => videoInputRef.current?.click()} disabled={uploadingVideo}>
                  {uploadingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {ru ? 'Загрузить' : 'Upload'}
                </Button>
              </div>
              {lessonForm.video_url && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <p className="text-sm text-zinc-600 truncate">{lessonForm.video_url}</p>
                </div>
              )}
            </div>
          )}

          {/* Content Blocks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">{ru ? 'Контент урока' : 'Lesson Content'}</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => addContentBlock('heading')}><span className="font-bold mr-1">H</span>{ru ? 'Заголовок' : 'Heading'}</Button>
                <Button variant="outline" size="sm" onClick={() => addContentBlock('text')}><FileText className="w-4 h-4 mr-1" />{ru ? 'Текст' : 'Text'}</Button>
                <Button variant="outline" size="sm" onClick={() => addContentBlock('image')}><Image className="w-4 h-4 mr-1" />{ru ? 'Фото' : 'Image'}</Button>
                <Button variant="outline" size="sm" onClick={() => addContentBlock('checklist')}><ListChecks className="w-4 h-4 mr-1" />{ru ? 'Чеклист' : 'Checklist'}</Button>
              </div>
            </div>

            {lessonForm.content.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-zinc-300 rounded-xl text-center">
                <p className="text-zinc-500">{ru ? 'Добавьте блоки контента с помощью кнопок выше' : 'Add content blocks using the buttons above'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lessonForm.content.map((block, index) => (
                  <div key={block.id} className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline">
                        {block.type === 'heading' && (ru ? 'Заголовок' : 'Heading')}
                        {block.type === 'text' && (ru ? 'Текст' : 'Text')}
                        {block.type === 'image' && (ru ? 'Изображение' : 'Image')}
                        {block.type === 'checklist' && (ru ? 'Чеклист' : 'Checklist')}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => removeContentBlock(block.id)} className="text-red-500"><X className="w-4 h-4" /></Button>
                    </div>

                    {block.type === 'heading' && (
                      <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="Heading (EN)" value={block.content} onChange={(e) => updateContentBlock(block.id, 'content', e.target.value)} />
                        <Input placeholder="Заголовок (RU)" value={lessonForm.content_ru.find(b => b.id === block.id)?.content || ''} onChange={(e) => updateContentBlock(block.id, 'content_ru', e.target.value)} />
                      </div>
                    )}

                    {block.type === 'text' && (
                      <div className="grid grid-cols-2 gap-3">
                        <textarea className="w-full h-24 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none" placeholder="Text content (EN)" value={block.content} onChange={(e) => updateContentBlock(block.id, 'content', e.target.value)} />
                        <textarea className="w-full h-24 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none" placeholder="Текстовый контент (RU)" value={lessonForm.content_ru.find(b => b.id === block.id)?.content || ''} onChange={(e) => updateContentBlock(block.id, 'content_ru', e.target.value)} />
                      </div>
                    )}

                    {block.type === 'image' && (
                      <div className="space-y-3">
                        {block.content ? (
                          <div className="relative">
                            <img src={block.content} alt="" className="max-h-48 rounded-lg" />
                            <Button variant="ghost" size="sm" onClick={() => updateContentBlock(block.id, 'content', '')} className="absolute top-2 right-2 bg-white/80"><X className="w-4 h-4" /></Button>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <Input placeholder={ru ? 'URL изображения' : 'Image URL'} value={block.content} onChange={(e) => updateContentBlock(block.id, 'content', e.target.value)} className="flex-1" />
                            <input type="file" id={`img-${block.id}`} accept="image/*" className="hidden" onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageUpload(file, block.id)
                            }} />
                            <Button variant="outline" onClick={() => document.getElementById(`img-${block.id}`)?.click()} disabled={uploadingImage === block.id}>
                              {uploadingImage === block.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                              {ru ? 'Загрузить' : 'Upload'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {block.type === 'checklist' && (
                      <div className="space-y-2">
                        {block.items?.map((item, i) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-zinc-400" />
                            <Input placeholder={`Item ${i + 1} (EN)`} value={item.text} onChange={(e) => updateChecklistItem(block.id, item.id, 'text', e.target.value)} className="flex-1" />
                            <Input placeholder={`Пункт ${i + 1} (RU)`} value={item.text_ru || ''} onChange={(e) => updateChecklistItem(block.id, item.id, 'text_ru', e.target.value)} className="flex-1" />
                            <Button variant="ghost" size="sm" onClick={() => removeChecklistItem(block.id, item.id)} className="text-red-500"><X className="w-4 h-4" /></Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => addChecklistItem(block.id)}><Plus className="w-4 h-4 mr-1" />{ru ? 'Добавить пункт' : 'Add item'}</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700 sticky bottom-0 bg-white dark:bg-zinc-900 py-4">
            <Button variant="outline" onClick={() => setIsLessonModalOpen(false)}>{ru ? 'Отмена' : 'Cancel'}</Button>
            <Button variant="gradient" onClick={saveLesson} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              {ru ? 'Сохранить урок' : 'Save Lesson'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
