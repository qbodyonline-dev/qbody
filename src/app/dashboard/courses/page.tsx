'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/lib/i18n'
import { getCourses } from '@/lib/api'
import { Plus, Edit, Eye, BookOpen, DollarSign, Clock, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function CoursesAdminPage() {
  const { t, locale } = useTranslation()
  const ru = locale === 'ru'
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', slug: '', description: '', price: '99', original_price: '', duration_weeks: '', is_published: true })

  const loadCourses = () => {
    const data = getCourses()
    setCourses(data)
    setLoading(false)
  }

  useEffect(() => { loadCourses() }, [])

  const resetForm = () => setForm({ title: '', slug: '', description: '', price: '99', original_price: '', duration_weeks: '', is_published: true })

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    toast.info(ru ? 'Курсы управляются через код. Свяжитесь с разработчиком.' : 'Courses are managed via code. Contact the developer.')
    setIsAddOpen(false)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    toast.info(ru ? 'Курсы управляются через код. Свяжитесь с разработчиком.' : 'Courses are managed via code. Contact the developer.')
    setIsEditOpen(false)
  }

  const handleDelete = async () => {
    toast.info(ru ? 'Курсы управляются через код. Свяжитесь с разработчиком.' : 'Courses are managed via code. Contact the developer.')
    setIsDeleteOpen(false)
  }

  const openEdit = (course: any) => {
    setSelectedCourse(course)
    setForm({
      title: course.title,
      slug: course.slug,
      description: course.description || '',
      price: String(course.price),
      original_price: course.original_price ? String(course.original_price) : '',
      duration_weeks: course.duration_weeks ? String(course.duration_weeks) : '',
      is_published: course.is_published,
    })
    setIsEditOpen(true)
  }

  const CourseForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void, submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input label={ru ? 'Название' : 'Title'} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || generateSlug(e.target.value) })} required />
      <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="course-url-slug" required />
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{ru ? 'Описание' : 'Description'}</label>
        <textarea className="w-full h-24 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input label={ru ? 'Цена ($)' : 'Price ($)'} type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <Input label={ru ? 'Старая цена' : 'Original price'} type="number" step="0.01" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} placeholder="149" />
        <Input label={ru ? 'Недель' : 'Weeks'} type="number" value={form.duration_weeks} onChange={(e) => setForm({ ...form, duration_weeks: e.target.value })} placeholder="8" />
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" className="w-5 h-5 rounded accent-teal-500" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{ru ? 'Опубликован' : 'Published'}</span>
      </label>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>{ru ? 'Отмена' : 'Cancel'}</Button>
        <Button type="submit" variant="gradient" isLoading={saving}>{submitLabel}</Button>
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
          <p className="text-zinc-500 mt-1">{courses.length} {ru ? 'курсов' : 'courses total'}</p>
        </div>
        <Button variant="gradient" onClick={() => { resetForm(); setIsAddOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />{ru ? 'Добавить курс' : 'Add Course'}
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
          {courses.map((course: any) => (
            <Card key={course.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  <div className="lg:w-48 h-32 lg:h-auto bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-white" />
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{ru && course.titleRu ? course.titleRu : course.title}</h3>
                        {course.description && <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{course.description}</p>}
                        <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
                          <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />${course.price}</span>
                          {course.original_price && <span className="line-through text-zinc-400">${course.original_price}</span>}
                          {course.duration_weeks && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{course.duration_weeks} {ru ? 'нед.' : 'weeks'}</span>}
                        </div>
                      </div>
                      <Badge variant={course.is_published ? 'success' : 'secondary'}>
                        {course.is_published ? (ru ? 'Опубликован' : 'Published') : (ru ? 'Черновик' : 'Draft')}
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => openEdit(course)}>
                        <Edit className="w-4 h-4 mr-1" />{ru ? 'Редактировать' : 'Edit'}
                      </Button>
                      <Link href={`/programs/${course.slug}`} target="_blank">
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4 mr-1" />{ru ? 'Просмотр' : 'View'}</Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedCourse(course); setIsDeleteOpen(true); }} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-1" />{ru ? 'Удалить' : 'Delete'}
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
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={ru ? 'Новый курс' : 'New Course'} size="md">
        <CourseForm onSubmit={handleAdd} submitLabel={ru ? 'Создать' : 'Create'} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setSelectedCourse(null); }} title={ru ? 'Редактировать курс' : 'Edit Course'} size="md">
        <CourseForm onSubmit={handleEdit} submitLabel={ru ? 'Сохранить' : 'Save'} />
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setSelectedCourse(null); }} title={ru ? 'Удалить курс' : 'Delete Course'} size="sm">
        <div className="space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400">
            {ru ? 'Вы уверены что хотите удалить курс' : 'Are you sure you want to delete'} <strong>{selectedCourse?.title}</strong>? {ru ? 'Это действие необратимо.' : 'This cannot be undone.'}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>{ru ? 'Отмена' : 'Cancel'}</Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={saving} className="bg-red-500 hover:bg-red-600 text-white">
              <Trash2 className="w-4 h-4 mr-2" />{ru ? 'Удалить' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
