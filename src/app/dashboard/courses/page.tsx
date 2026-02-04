'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/lib/i18n'
import { Plus, Edit, Eye, BookOpen, DollarSign, Clock, Trash2, Loader2, Layers, FileText } from 'lucide-react'
import { toast } from 'sonner'

type Course = {
  id: string
  slug: string
  title: string
  title_ru: string | null
  description: string | null
  description_ru: string | null
  price: number
  original_price: number | null
  duration_weeks: number
  image_url: string | null
  is_published: boolean
  created_at: string
  modules_count?: number
  lessons_count?: number
}

export default function CoursesAdminPage() {
  const { locale } = useTranslation()
  const ru = locale === 'ru'
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', title_ru: '', slug: '',
    description: '', description_ru: '',
    price: '99', original_price: '', duration_weeks: '8',
    is_published: false
  })

  const loadCourses = async () => {
    try {
      const res = await fetch('/api/courses')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setCourses(data)
    } catch (err) {
      toast.error(ru ? 'Ошибка загрузки курсов' : 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCourses() }, [])

  const resetForm = () => setForm({
    title: '', title_ru: '', slug: '',
    description: '', description_ru: '',
    price: '99', original_price: '', duration_weeks: '8',
    is_published: false
  })

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error(ru ? 'Введите название' : 'Enter title')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          title_ru: form.title_ru || null,
          slug: form.slug || generateSlug(form.title),
          description: form.description || null,
          description_ru: form.description_ru || null,
          price: parseFloat(form.price) || 99,
          original_price: form.original_price ? parseFloat(form.original_price) : null,
          duration_weeks: parseInt(form.duration_weeks) || 8,
          is_published: form.is_published,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      toast.success(ru ? 'Курс создан!' : 'Course created!')
      setIsAddOpen(false)
      resetForm()
      loadCourses()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourse) return
    setSaving(true)
    try {
      const res = await fetch(`/api/courses/${selectedCourse.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          title_ru: form.title_ru || null,
          slug: form.slug,
          description: form.description || null,
          description_ru: form.description_ru || null,
          price: parseFloat(form.price) || 99,
          original_price: form.original_price ? parseFloat(form.original_price) : null,
          duration_weeks: parseInt(form.duration_weeks) || 8,
          is_published: form.is_published,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(ru ? 'Курс обновлён!' : 'Course updated!')
      setIsEditOpen(false)
      setSelectedCourse(null)
      resetForm()
      loadCourses()
    } catch {
      toast.error(ru ? 'Ошибка обновления' : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCourse) return
    setSaving(true)
    try {
      const res = await fetch(`/api/courses/${selectedCourse.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success(ru ? 'Курс удалён' : 'Course deleted')
      setIsDeleteOpen(false)
      setSelectedCourse(null)
      loadCourses()
    } catch {
      toast.error(ru ? 'Ошибка удаления' : 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (course: Course) => {
    setSelectedCourse(course)
    setForm({
      title: course.title,
      title_ru: course.title_ru || '',
      slug: course.slug,
      description: course.description || '',
      description_ru: course.description_ru || '',
      price: String(course.price / 100),
      original_price: course.original_price ? String(course.original_price / 100) : '',
      duration_weeks: String(course.duration_weeks || 8),
      is_published: course.is_published,
    })
    setIsEditOpen(true)
  }

  const CourseForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void, submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label={ru ? 'Название (EN)' : 'Title (EN)'} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || generateSlug(e.target.value) })} required />
        <Input label={ru ? 'Название (RU)' : 'Title (RU)'} value={form.title_ru} onChange={(e) => setForm({ ...form, title_ru: e.target.value })} />
      </div>
      <Input label="Slug (URL)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="course-url-slug" />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{ru ? 'Описание (EN)' : 'Description (EN)'}</label>
          <textarea className="w-full h-20 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{ru ? 'Описание (RU)' : 'Description (RU)'}</label>
          <textarea className="w-full h-20 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500" value={form.description_ru} onChange={(e) => setForm({ ...form, description_ru: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input label={ru ? 'Цена ($)' : 'Price ($)'} type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <Input label={ru ? 'Старая цена ($)' : 'Original price ($)'} type="number" step="0.01" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} placeholder="149" />
        <Input label={ru ? 'Недель' : 'Weeks'} type="number" value={form.duration_weeks} onChange={(e) => setForm({ ...form, duration_weeks: e.target.value })} />
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" className="w-5 h-5 rounded accent-teal-500" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{ru ? 'Опубликован (виден клиентам)' : 'Published (visible to clients)'}</span>
      </label>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>{ru ? 'Отмена' : 'Cancel'}</Button>
        <Button type="submit" variant="gradient" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{ru ? 'Курсы' : 'Courses'}</h1>
          <p className="text-zinc-500 mt-1">{courses.length} {ru ? 'курсов' : 'courses'}</p>
        </div>
        <Button variant="gradient" onClick={() => { resetForm(); setIsAddOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />{ru ? 'Создать курс' : 'Create Course'}
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{ru ? 'Курсов пока нет' : 'No courses yet'}</h3>
          <p className="text-zinc-500 mb-4">{ru ? 'Создайте первый курс' : 'Create your first course'}</p>
          <Button variant="gradient" onClick={() => { resetForm(); setIsAddOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />{ru ? 'Создать курс' : 'Create Course'}
          </Button>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  <div className="lg:w-48 h-32 lg:h-auto bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center relative">
                    <BookOpen className="w-12 h-12 text-white/80" />
                    {!course.is_published && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-black/50 text-white">{ru ? 'Черновик' : 'Draft'}</Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                          {ru && course.title_ru ? course.title_ru : course.title}
                        </h3>
                        {(ru ? course.description_ru : course.description) && (
                          <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                            {ru ? course.description_ru : course.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />${(course.price / 100).toFixed(0)}
                          </span>
                          {course.original_price && (
                            <span className="line-through text-zinc-400">${(course.original_price / 100).toFixed(0)}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />{course.duration_weeks} {ru ? 'нед.' : 'weeks'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-4 h-4" />{course.modules_count || 0} {ru ? 'модулей' : 'modules'}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />{course.lessons_count || 0} {ru ? 'уроков' : 'lessons'}
                          </span>
                        </div>
                      </div>
                      <Badge variant={course.is_published ? 'success' : 'secondary'}>
                        {course.is_published ? (ru ? 'Опубликован' : 'Published') : (ru ? 'Черновик' : 'Draft')}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Link href={`/dashboard/courses/${course.id}/page-editor`}>
                        <Button variant="gradient" size="sm">
                          <FileText className="w-4 h-4 mr-1" />{ru ? 'Редактор страницы' : 'Page Editor'}
                        </Button>
                      </Link>
                      <Link href={`/dashboard/courses/${course.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <BookOpen className="w-4 h-4 mr-1" />{ru ? 'Уроки' : 'Lessons'}
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => openEdit(course)}>
                        <Edit className="w-4 h-4 mr-1" />{ru ? 'Настройки' : 'Settings'}
                      </Button>
                      <Link href={`/courses/${course.slug}`} target="_blank">
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4 mr-1" />{ru ? 'Просмотр' : 'View'}</Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedCourse(course); setIsDeleteOpen(true); }} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={ru ? 'Новый курс' : 'New Course'} size="lg">
        <CourseForm onSubmit={handleAdd} submitLabel={ru ? 'Создать' : 'Create'} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setSelectedCourse(null); }} title={ru ? 'Настройки курса' : 'Course Settings'} size="lg">
        <CourseForm onSubmit={handleEdit} submitLabel={ru ? 'Сохранить' : 'Save'} />
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setSelectedCourse(null); }} title={ru ? 'Удалить курс' : 'Delete Course'} size="sm">
        <div className="space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400">
            {ru ? 'Вы уверены что хотите удалить курс' : 'Are you sure you want to delete'} <strong>{selectedCourse?.title}</strong>? 
            {ru ? ' Все модули и уроки также будут удалены. Это действие необратимо.' : ' All modules and lessons will also be deleted. This cannot be undone.'}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>{ru ? 'Отмена' : 'Cancel'}</Button>
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
