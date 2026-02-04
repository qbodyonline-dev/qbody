'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import {
  ArrowLeft, Save, Plus, Trash2, GripVertical, Video, FileText,
  CheckCircle, Play, Clock, Lock, Unlock, ChevronDown, ChevronUp,
  Edit, Eye, Upload, Image, ListChecks, BookOpen
} from 'lucide-react'
import { toast } from 'sonner'

interface Lesson {
  id: string
  titleEn: string
  titleRu: string
  type: 'video' | 'text' | 'task'
  duration: number // minutes
  videoUrl?: string
  contentEn?: string
  contentRu?: string
  free: boolean
  published: boolean
}

interface Module {
  id: string
  titleEn: string
  titleRu: string
  lessons: Lesson[]
  expanded: boolean
}

let _lid = 100

export default function CourseLessonsPage({ params }: { params: { slug: string } }) {
  const { t, locale } = useTranslation()
  const ru = locale === 'ru'
  const [isSaving, setIsSaving] = useState(false)
  const [editingLesson, setEditingLesson] = useState<string | null>(null)

  const [courseName] = useState({ en: 'Breast Augmentation Recovery', ru: 'Восстановление после маммопластики' })

  const [modules, setModules] = useState<Module[]>([
    {
      id: 'm1', titleEn: 'Module 1: First Steps', titleRu: 'Модуль 1: Первые шаги', expanded: true,
      lessons: [
        { id: 'l1', titleEn: 'Welcome & Course Overview', titleRu: 'Приветствие и обзор курса', type: 'video', duration: 12, videoUrl: 'https://vimeo.com/example1', free: true, published: true, contentEn: 'Introduction to the recovery program. What to expect in the coming weeks.', contentRu: 'Введение в программу восстановления. Чего ожидать в ближайшие недели.' },
        { id: 'l2', titleEn: 'Understanding Your Body After Surgery', titleRu: 'Понимание тела после операции', type: 'text', duration: 8, free: true, published: true, contentEn: 'Detailed guide on what happens to your body after breast augmentation surgery.', contentRu: 'Подробное руководство о том, что происходит с телом после маммопластики.' },
        { id: 'l3', titleEn: 'Self-Assessment Questionnaire', titleRu: 'Анкета самооценки', type: 'task', duration: 5, free: false, published: true, contentEn: 'Complete the assessment to help us customize your recovery plan.', contentRu: 'Заполните анкету для составления индивидуального плана.' },
      ]
    },
    {
      id: 'm2', titleEn: 'Module 2: Gentle Movement', titleRu: 'Модуль 2: Мягкое движение', expanded: false,
      lessons: [
        { id: 'l4', titleEn: 'Breathing Exercises', titleRu: 'Дыхательные упражнения', type: 'video', duration: 15, videoUrl: 'https://vimeo.com/example2', free: false, published: true },
        { id: 'l5', titleEn: 'Gentle Stretching Routine', titleRu: 'Лёгкая растяжка', type: 'video', duration: 20, free: false, published: true },
        { id: 'l6', titleEn: 'Week 1 Progress Check', titleRu: 'Проверка прогресса (неделя 1)', type: 'task', duration: 5, free: false, published: false },
      ]
    },
    {
      id: 'm3', titleEn: 'Module 3: Building Strength', titleRu: 'Модуль 3: Укрепление', expanded: false,
      lessons: [
        { id: 'l7', titleEn: 'Core Activation Without Strain', titleRu: 'Активация кора без нагрузки', type: 'video', duration: 18, free: false, published: true },
        { id: 'l8', titleEn: 'Upper Body Mobility', titleRu: 'Мобильность верхней части тела', type: 'video', duration: 22, free: false, published: true },
        { id: 'l9', titleEn: 'Nutrition Guide for Recovery', titleRu: 'Гид по питанию для восстановления', type: 'text', duration: 10, free: false, published: true },
      ]
    },
  ])

  const toggleModule = (id: string) => setModules(modules.map(m => m.id === id ? { ...m, expanded: !m.expanded } : m))

  const addModule = () => {
    const num = modules.length + 1
    setModules([...modules, { id: `m${Date.now()}`, titleEn: `Module ${num}: New Module`, titleRu: `Модуль ${num}: Новый модуль`, lessons: [], expanded: true }])
  }

  const removeModule = (id: string) => setModules(modules.filter(m => m.id !== id))

  const addLesson = (moduleId: string, type: 'video' | 'text' | 'task') => {
    const id = `l${++_lid}`
    const lesson: Lesson = { id, titleEn: 'New lesson', titleRu: 'Новый урок', type, duration: 10, free: false, published: false }
    setModules(modules.map(m => m.id === moduleId ? { ...m, lessons: [...m.lessons, lesson], expanded: true } : m))
    setEditingLesson(id)
  }

  const updateLesson = (moduleId: string, lessonId: string, patch: Partial<Lesson>) => {
    setModules(modules.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, ...patch } : l) } : m))
  }

  const removeLesson = (moduleId: string, lessonId: string) => {
    setModules(modules.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m))
  }

  const moveLesson = (moduleId: string, i: number, dir: -1 | 1) => {
    setModules(modules.map(m => {
      if (m.id !== moduleId) return m
      const j = i + dir
      if (j < 0 || j >= m.lessons.length) return m
      const n = [...m.lessons]; [n[i], n[j]] = [n[j], n[i]]
      return { ...m, lessons: n }
    }))
  }

  const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0)
  const totalDuration = modules.reduce((a, m) => a + m.lessons.reduce((b, l) => b + l.duration, 0), 0)
  const publishedCount = modules.reduce((a, m) => a + m.lessons.filter(l => l.published).length, 0)

  const handleSave = async () => { setIsSaving(true); await new Promise(r => setTimeout(r, 800)); toast.success(ru ? 'Курс сохранён!' : 'Course saved!'); setIsSaving(false) }

  const typeIcon = (type: string) => type === 'video' ? <Video className="w-4 h-4" /> : type === 'text' ? <FileText className="w-4 h-4" /> : <ListChecks className="w-4 h-4" />
  const typeColor = (type: string) => type === 'video' ? 'bg-blue-100 text-blue-600' : type === 'text' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
  const typeLabel = (type: string) => type === 'video' ? (ru ? 'Видео' : 'Video') : type === 'text' ? (ru ? 'Текст' : 'Text') : (ru ? 'Задание' : 'Task')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/courses"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{ru ? courseName.ru : courseName.en}</h1>
            <p className="text-zinc-500 mt-1">{ru ? 'Управление уроками' : 'Manage Lessons'}</p>
          </div>
        </div>
        <Button variant="gradient" onClick={handleSave} disabled={isSaving}><Save className="w-4 h-4 mr-2" />{isSaving ? '...' : ru ? 'Сохранить' : 'Save'}</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-zinc-900">{totalLessons}</div>
          <div className="text-sm text-zinc-500">{ru ? 'Уроков' : 'Lessons'}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-zinc-900">{Math.round(totalDuration / 60 * 10) / 10}h</div>
          <div className="text-sm text-zinc-500">{ru ? 'Общая длительность' : 'Total duration'}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-teal-600">{publishedCount}/{totalLessons}</div>
          <div className="text-sm text-zinc-500">{ru ? 'Опубликовано' : 'Published'}</div>
        </CardContent></Card>
      </div>

      {/* Modules */}
      <div className="space-y-4">
        {modules.map((mod, mi) => (
          <Card key={mod.id}>
            {/* Module header */}
            <button onClick={() => toggleModule(mod.id)}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-zinc-50 transition-colors">
              <GripVertical className="w-4 h-4 text-zinc-300 cursor-grab" />
              <BookOpen className="w-5 h-5 text-teal-500" />
              <div className="flex-1">
                <h3 className="font-semibold text-zinc-900">{ru ? mod.titleRu : mod.titleEn}</h3>
                <p className="text-xs text-zinc-400">{mod.lessons.length} {ru ? 'уроков' : 'lessons'} • {mod.lessons.reduce((a, l) => a + l.duration, 0)} {ru ? 'мин' : 'min'}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeModule(mod.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              {mod.expanded ? <ChevronDown className="w-5 h-5 text-zinc-400" /> : <ChevronUp className="w-5 h-5 text-zinc-400 rotate-180" />}
            </button>

            {mod.expanded && (
              <CardContent className="pt-0 pb-4 px-4 space-y-2">
                {/* Module name edit */}
                <div className="grid sm:grid-cols-2 gap-3 mb-4 px-2">
                  <Input label={ru ? 'Название модуля (EN)' : 'Module name (EN)'} value={mod.titleEn} onChange={e => setModules(modules.map(m => m.id === mod.id ? { ...m, titleEn: e.target.value } : m))} />
                  <Input label={ru ? 'Название модуля (RU)' : 'Module name (RU)'} value={mod.titleRu} onChange={e => setModules(modules.map(m => m.id === mod.id ? { ...m, titleRu: e.target.value } : m))} />
                </div>

                {/* Lessons list */}
                {mod.lessons.map((lesson, li) => {
                  const isEditing = editingLesson === lesson.id
                  return (
                    <div key={lesson.id} className={`border rounded-xl overflow-hidden ${isEditing ? 'ring-2 ring-teal-500/30 border-teal-200' : 'border-zinc-200'}`}>
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <GripVertical className="w-3.5 h-3.5 text-zinc-300 cursor-grab" />
                        <span className="text-xs text-zinc-400 font-mono w-6">{li + 1}</span>
                        <div className={`w-7 h-7 rounded-lg ${typeColor(lesson.type)} flex items-center justify-center flex-shrink-0`}>{typeIcon(lesson.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">{ru ? lesson.titleRu : lesson.titleEn}</p>
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <Clock className="w-3 h-3" />{lesson.duration} {ru ? 'мин' : 'min'}
                            {lesson.free && <Badge variant="outline" className="text-[10px] py-0 px-1.5">{ru ? 'Бесплатный' : 'Free'}</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {lesson.published ? <CheckCircle className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-zinc-300" />}
                          <button onClick={() => moveLesson(mod.id, li, -1)} disabled={li === 0} className="p-1 rounded hover:bg-zinc-100 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                          <button onClick={() => moveLesson(mod.id, li, 1)} disabled={li === mod.lessons.length - 1} className="p-1 rounded hover:bg-zinc-100 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingLesson(isEditing ? null : lesson.id)} className={`p-1 rounded ${isEditing ? 'bg-teal-100' : 'hover:bg-zinc-100'}`}><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => removeLesson(mod.id, lesson.id)} className="p-1 rounded hover:bg-red-50 text-zinc-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="px-4 pb-4 pt-3 border-t border-zinc-100 bg-zinc-50/50 space-y-4">
                          <div className="grid sm:grid-cols-2 gap-3">
                            <Input label={ru ? 'Название (EN)' : 'Title (EN)'} value={lesson.titleEn} onChange={e => updateLesson(mod.id, lesson.id, { titleEn: e.target.value })} />
                            <Input label={ru ? 'Название (RU)' : 'Title (RU)'} value={lesson.titleRu} onChange={e => updateLesson(mod.id, lesson.id, { titleRu: e.target.value })} />
                          </div>
                          <div className="grid sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-sm font-medium text-zinc-700 mb-1.5 block">{ru ? 'Тип' : 'Type'}</label>
                              <select className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm" value={lesson.type} onChange={e => updateLesson(mod.id, lesson.id, { type: e.target.value as any })}>
                                <option value="video">{ru ? '📹 Видео' : '📹 Video'}</option>
                                <option value="text">{ru ? '📄 Текст' : '📄 Text'}</option>
                                <option value="task">{ru ? '✅ Задание' : '✅ Task'}</option>
                              </select>
                            </div>
                            <Input label={ru ? 'Длительность (мин)' : 'Duration (min)'} type="number" value={String(lesson.duration)} onChange={e => updateLesson(mod.id, lesson.id, { duration: Number(e.target.value) })} />
                            {lesson.type === 'video' && <Input label="Video URL" value={lesson.videoUrl || ''} onChange={e => updateLesson(mod.id, lesson.id, { videoUrl: e.target.value })} />}
                          </div>
                          {lesson.type === 'video' && (
                            <div className="border-2 border-dashed border-zinc-300 rounded-xl p-6 text-center">
                              <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                              <p className="text-sm text-zinc-500">{ru ? 'Перетащите видео или нажмите для загрузки' : 'Drag video or click to upload'}</p>
                              <Button variant="outline" size="sm" className="mt-3"><Upload className="w-4 h-4 mr-2" />{ru ? 'Загрузить' : 'Upload'}</Button>
                            </div>
                          )}
                          <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1.5 block">{ru ? 'Контент (EN)' : 'Content (EN)'}</label>
                            <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm" rows={4} value={lesson.contentEn || ''} onChange={e => updateLesson(mod.id, lesson.id, { contentEn: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1.5 block">{ru ? 'Контент (RU)' : 'Content (RU)'}</label>
                            <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm" rows={4} value={lesson.contentRu || ''} onChange={e => updateLesson(mod.id, lesson.id, { contentRu: e.target.value })} />
                          </div>
                          <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${lesson.free ? 'bg-teal-500' : 'bg-zinc-300'}`} onClick={() => updateLesson(mod.id, lesson.id, { free: !lesson.free })}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${lesson.free ? 'translate-x-4' : ''}`} />
                              </div>
                              <span className="text-sm text-zinc-700">{ru ? 'Бесплатный' : 'Free'}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${lesson.published ? 'bg-green-500' : 'bg-zinc-300'}`} onClick={() => updateLesson(mod.id, lesson.id, { published: !lesson.published })}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${lesson.published ? 'translate-x-4' : ''}`} />
                              </div>
                              <span className="text-sm text-zinc-700">{ru ? 'Опубликован' : 'Published'}</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Add lesson buttons */}
                <div className="flex gap-2 pt-2 px-2">
                  <button onClick={() => addLesson(mod.id, 'video')} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition-colors border border-blue-200">
                    <Video className="w-4 h-4" />{ru ? 'Видео' : 'Video'}
                  </button>
                  <button onClick={() => addLesson(mod.id, 'text')} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-green-600 hover:bg-green-50 transition-colors border border-green-200">
                    <FileText className="w-4 h-4" />{ru ? 'Текст' : 'Text'}
                  </button>
                  <button onClick={() => addLesson(mod.id, 'task')} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-purple-600 hover:bg-purple-50 transition-colors border border-purple-200">
                    <ListChecks className="w-4 h-4" />{ru ? 'Задание' : 'Task'}
                  </button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {/* Add module */}
        <button onClick={addModule}
          className="w-full p-4 border-2 border-dashed border-zinc-300 rounded-2xl text-center hover:border-teal-500 hover:bg-teal-50 transition-colors">
          <Plus className="w-6 h-6 text-zinc-400 mx-auto mb-1" />
          <span className="text-sm font-medium text-zinc-500">{ru ? 'Добавить модуль' : 'Add module'}</span>
        </button>
      </div>
    </div>
  )
}
