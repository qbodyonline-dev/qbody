'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/lib/i18n'
import { 
  ArrowLeft, Save, Loader2, Eye, Image, Video, Star, User, 
  MessageSquare, DollarSign, BookOpen, Plus, Trash2, Upload, Palette, X
} from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuth, fetchWithAuthUpload } from '@/lib/api'

export default function CoursePageEditorPage() {
  const { locale } = useTranslation()
  const ru = locale === 'ru'
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const [form, setForm] = useState<any>({})
  const [uploading, setUploading] = useState<string | null>(null)

  const handleFileUpload = async (field: string, accept: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      setUploading(field)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', `courses/${courseId}`)
        const res = await fetchWithAuthUpload('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) throw new Error('Upload failed')
        const data = await res.json()
        setForm((prev: any) => ({ ...prev, [field]: data.url }))
        toast.success(ru ? 'Файл загружен!' : 'File uploaded!')
      } catch {
        toast.error(ru ? 'Ошибка загрузки' : 'Upload failed')
      } finally {
        setUploading(null)
      }
    }
    input.click()
  }

  const loadCourse = async () => {
    try {
      const res = await fetchWithAuth(`/api/courses/${courseId}`)
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      setCourse(data)
      setForm({
        title: data.title || '',
        title_ru: data.title_ru || '',
        description: data.description || '',
        description_ru: data.description_ru || '',
        price: data.price ? data.price / 100 : 99,
        original_price: data.original_price ? data.original_price / 100 : '',
        duration_weeks: data.duration_weeks || 8,
        hero_video_url: data.hero_video_url || '',
        hero_image_url: data.hero_image_url || '',
        hero_bg_color: data.hero_bg_color || '',
        hero_bg_image_url: data.hero_bg_image_url || '',
        rating: data.rating || 4.9,
        reviews_count: data.reviews_count || 0,
        features: data.features || [],
        features_ru: data.features_ru || [],
        tags: data.tags || [],
        tags_ru: data.tags_ru || [],
        instructor_name: data.instructor_name || '',
        instructor_title: data.instructor_title || '',
        instructor_title_ru: data.instructor_title_ru || '',
        instructor_bio: data.instructor_bio || '',
        instructor_bio_ru: data.instructor_bio_ru || '',
        instructor_image_url: data.instructor_image_url || '',
        cta_title: data.cta_title || '',
        cta_title_ru: data.cta_title_ru || '',
        cta_subtitle: data.cta_subtitle || '',
        cta_subtitle_ru: data.cta_subtitle_ru || '',
        cta_button_text: data.cta_button_text || 'Start Now',
        cta_button_text_ru: data.cta_button_text_ru || 'Начать сейчас',
        guarantee_text: data.guarantee_text || '',
        guarantee_text_ru: data.guarantee_text_ru || '',
        includes: data.includes || [],
        includes_ru: data.includes_ru || [],
        is_published: data.is_published || false,
      })
    } catch {
      toast.error(ru ? 'Курс не найден' : 'Course not found')
      router.push('/dashboard/courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCourse() }, [courseId])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetchWithAuth(`/api/courses/${courseId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price) || 99,
          original_price: form.original_price ? parseFloat(form.original_price) : null,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(ru ? 'Сохранено!' : 'Saved!')
      loadCourse()
    } catch {
      toast.error(ru ? 'Ошибка сохранения' : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const addToArray = (field: string) => {
    setForm({ ...form, [field]: [...(form[field] || []), ''] })
  }

  const removeFromArray = (field: string, index: number) => {
    setForm({ ...form, [field]: form[field].filter((_: any, i: number) => i !== index) })
  }

  const updateArrayItem = (field: string, index: number, value: string) => {
    const arr = [...form[field]]
    arr[index] = value
    setForm({ ...form, [field]: arr })
  }

  const sections = [
    { id: 'hero', label: ru ? 'Hero секция' : 'Hero Section', icon: Image },
    { id: 'features', label: ru ? 'Что включено' : 'What\'s Included', icon: BookOpen },
    { id: 'pricing', label: ru ? 'Цены' : 'Pricing', icon: DollarSign },
    { id: 'instructor', label: ru ? 'Инструктор' : 'Instructor', icon: User },
    { id: 'cta', label: ru ? 'CTA секция' : 'CTA Section', icon: MessageSquare },
  ]

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
  }

  if (!course) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/courses"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{ru ? 'Редактор страницы' : 'Page Editor'}</h1>
            <p className="text-zinc-500">{ru && course.title_ru ? course.title_ru : course.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/courses/${course.slug}`} target="_blank"><Button variant="outline"><Eye className="w-4 h-4 mr-2" />{ru ? 'Просмотр' : 'Preview'}</Button></Link>
          <Button variant="gradient" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}{ru ? 'Сохранить' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-2">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button key={section.id} onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${activeSection === section.id ? 'bg-teal-500 text-white' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}>
                    <Icon className="w-5 h-5" /><span className="font-medium">{section.label}</span>
                  </button>
                )
              })}
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardContent className="p-4 space-y-3">
              <Link href={`/dashboard/courses/${courseId}/edit`}><Button variant="outline" className="w-full justify-start"><BookOpen className="w-4 h-4 mr-2" />{ru ? 'Редактор уроков' : 'Lesson Editor'}</Button></Link>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded accent-teal-500" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
                <span className="text-sm font-medium">{ru ? 'Опубликован' : 'Published'}</span>
              </label>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {activeSection === 'hero' && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Image className="w-5 h-5" />{ru ? 'Hero секция' : 'Hero Section'}</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {/* Background Settings */}
                <div>
                  <label className="block text-sm font-medium mb-3 flex items-center gap-2"><Palette className="w-4 h-4" />{ru ? 'Фон секции' : 'Section Background'}</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5">{ru ? 'Цвет фона (CSS gradient или цвет)' : 'Background color (CSS gradient or color)'}</label>
                      <div className="flex gap-2">
                        <input type="color" value={form.hero_bg_color?.startsWith('#') ? form.hero_bg_color : '#667eea'} onChange={(e) => setForm({ ...form, hero_bg_color: e.target.value })} className="w-11 h-11 rounded-lg border border-zinc-200 cursor-pointer p-1" />
                        <Input value={form.hero_bg_color} onChange={(e) => setForm({ ...form, hero_bg_color: e.target.value })} placeholder="#667eea or linear-gradient(...)" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5">{ru ? 'Фоновое изображение' : 'Background image'}</label>
                      <div className="flex gap-2">
                        <Input value={form.hero_bg_image_url} onChange={(e) => setForm({ ...form, hero_bg_image_url: e.target.value })} placeholder="URL..." />
                        <Button variant="outline" size="icon" onClick={() => handleFileUpload('hero_bg_image_url', 'image/*')} disabled={uploading === 'hero_bg_image_url'}>
                          {uploading === 'hero_bg_image_url' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        </Button>
                      </div>
                      {form.hero_bg_image_url && (
                        <div className="mt-2 relative inline-block">
                          <img src={form.hero_bg_image_url} alt="" className="h-16 rounded-lg object-cover" />
                          <button onClick={() => setForm({ ...form, hero_bg_image_url: '' })} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">{ru ? 'Если задано фоновое изображение, оно будет использовано вместо цвета.' : 'If background image is set, it will be used instead of color.'}</p>
                </div>

                <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input label={ru ? 'Заголовок (EN)' : 'Title (EN)'} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  <Input label={ru ? 'Заголовок (RU)' : 'Title (RU)'} value={form.title_ru} onChange={(e) => setForm({ ...form, title_ru: e.target.value })} />
                </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-2">{ru ? 'Описание (EN)' : 'Description (EN)'}</label><textarea className="w-full h-24 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                  <div><label className="block text-sm font-medium mb-2">{ru ? 'Описание (RU)' : 'Description (RU)'}</label><textarea className="w-full h-24 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none" value={form.description_ru} onChange={(e) => setForm({ ...form, description_ru: e.target.value })} /></div>
                </div>

                {/* Video & Image with upload */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{ru ? 'Видео' : 'Video'}</label>
                    <div className="flex gap-2">
                      <Input value={form.hero_video_url} onChange={(e) => setForm({ ...form, hero_video_url: e.target.value })} placeholder="https://vimeo.com/..." />
                      <Button variant="outline" size="icon" onClick={() => handleFileUpload('hero_video_url', 'video/*')} disabled={uploading === 'hero_video_url'}>
                        {uploading === 'hero_video_url' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      </Button>
                    </div>
                    {form.hero_video_url && <p className="text-xs text-teal-500 mt-1 truncate">{form.hero_video_url}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{ru ? 'Изображение' : 'Image'}</label>
                    <div className="flex gap-2">
                      <Input value={form.hero_image_url} onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })} placeholder="URL..." />
                      <Button variant="outline" size="icon" onClick={() => handleFileUpload('hero_image_url', 'image/*')} disabled={uploading === 'hero_image_url'}>
                        {uploading === 'hero_image_url' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      </Button>
                    </div>
                    {form.hero_image_url && (
                      <div className="mt-2 relative inline-block">
                        <img src={form.hero_image_url} alt="" className="h-16 rounded-lg object-cover" />
                        <button onClick={() => setForm({ ...form, hero_image_url: '' })} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input label={ru ? 'Недель' : 'Weeks'} type="number" value={form.duration_weeks} onChange={(e) => setForm({ ...form, duration_weeks: e.target.value })} />
                  <Input label={ru ? 'Рейтинг' : 'Rating'} type="number" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
                  <Input label={ru ? 'Отзывов' : 'Reviews'} type="number" value={form.reviews_count} onChange={(e) => setForm({ ...form, reviews_count: e.target.value })} />
                </div>
                <div><label className="block text-sm font-medium mb-2">{ru ? 'Теги (EN)' : 'Tags (EN)'}</label>
                  <div className="space-y-2">{(form.tags || []).map((tag: string, i: number) => (<div key={i} className="flex gap-2"><Input value={tag} onChange={(e) => updateArrayItem('tags', i, e.target.value)} /><Button variant="ghost" size="icon" onClick={() => removeFromArray('tags', i)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button></div>))}<Button variant="outline" size="sm" onClick={() => addToArray('tags')}><Plus className="w-4 h-4 mr-2" />{ru ? 'Добавить' : 'Add'}</Button></div>
                </div>
                <div><label className="block text-sm font-medium mb-2">{ru ? 'Теги (RU)' : 'Tags (RU)'}</label>
                  <div className="space-y-2">{(form.tags_ru || []).map((tag: string, i: number) => (<div key={i} className="flex gap-2"><Input value={tag} onChange={(e) => updateArrayItem('tags_ru', i, e.target.value)} /><Button variant="ghost" size="icon" onClick={() => removeFromArray('tags_ru', i)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button></div>))}<Button variant="outline" size="sm" onClick={() => addToArray('tags_ru')}><Plus className="w-4 h-4 mr-2" />{ru ? 'Добавить' : 'Add'}</Button></div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'features' && (
            <Card>
              <CardHeader><CardTitle>{ru ? 'Что вы узнаете' : "What You'll Learn"}</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div><label className="block text-sm font-medium mb-2">{ru ? 'Особенности (EN)' : 'Features (EN)'}</label>
                  <div className="space-y-2">{(form.features || []).map((f: string, i: number) => (<div key={i} className="flex gap-2"><Input value={f} onChange={(e) => updateArrayItem('features', i, e.target.value)} /><Button variant="ghost" size="icon" onClick={() => removeFromArray('features', i)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button></div>))}<Button variant="outline" size="sm" onClick={() => addToArray('features')}><Plus className="w-4 h-4 mr-2" />{ru ? 'Добавить' : 'Add'}</Button></div>
                </div>
                <div><label className="block text-sm font-medium mb-2">{ru ? 'Особенности (RU)' : 'Features (RU)'}</label>
                  <div className="space-y-2">{(form.features_ru || []).map((f: string, i: number) => (<div key={i} className="flex gap-2"><Input value={f} onChange={(e) => updateArrayItem('features_ru', i, e.target.value)} /><Button variant="ghost" size="icon" onClick={() => removeFromArray('features_ru', i)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button></div>))}<Button variant="outline" size="sm" onClick={() => addToArray('features_ru')}><Plus className="w-4 h-4 mr-2" />{ru ? 'Добавить' : 'Add'}</Button></div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'pricing' && (
            <Card>
              <CardHeader><CardTitle>{ru ? 'Цены и гарантии' : 'Pricing & Guarantees'}</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input label={ru ? 'Цена ($)' : 'Price ($)'} type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  <Input label={ru ? 'Старая цена ($)' : 'Original Price ($)'} type="number" step="0.01" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label={ru ? 'Гарантия (EN)' : 'Guarantee (EN)'} value={form.guarantee_text} onChange={(e) => setForm({ ...form, guarantee_text: e.target.value })} />
                  <Input label={ru ? 'Гарантия (RU)' : 'Guarantee (RU)'} value={form.guarantee_text_ru} onChange={(e) => setForm({ ...form, guarantee_text_ru: e.target.value })} />
                </div>
                <div><label className="block text-sm font-medium mb-2">{ru ? 'Включает (EN)' : 'Includes (EN)'}</label>
                  <div className="space-y-2">{(form.includes || []).map((f: string, i: number) => (<div key={i} className="flex gap-2"><Input value={f} onChange={(e) => updateArrayItem('includes', i, e.target.value)} /><Button variant="ghost" size="icon" onClick={() => removeFromArray('includes', i)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button></div>))}<Button variant="outline" size="sm" onClick={() => addToArray('includes')}><Plus className="w-4 h-4 mr-2" />{ru ? 'Добавить' : 'Add'}</Button></div>
                </div>
                <div><label className="block text-sm font-medium mb-2">{ru ? 'Включает (RU)' : 'Includes (RU)'}</label>
                  <div className="space-y-2">{(form.includes_ru || []).map((f: string, i: number) => (<div key={i} className="flex gap-2"><Input value={f} onChange={(e) => updateArrayItem('includes_ru', i, e.target.value)} /><Button variant="ghost" size="icon" onClick={() => removeFromArray('includes_ru', i)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button></div>))}<Button variant="outline" size="sm" onClick={() => addToArray('includes_ru')}><Plus className="w-4 h-4 mr-2" />{ru ? 'Добавить' : 'Add'}</Button></div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'instructor' && (
            <Card>
              <CardHeader><CardTitle>{ru ? 'Инструктор' : 'Instructor'}</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input label={ru ? 'Имя' : 'Name'} value={form.instructor_name} onChange={(e) => setForm({ ...form, instructor_name: e.target.value })} />
                  <Input label={ru ? 'Фото URL' : 'Photo URL'} value={form.instructor_image_url} onChange={(e) => setForm({ ...form, instructor_image_url: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label={ru ? 'Должность (EN)' : 'Title (EN)'} value={form.instructor_title} onChange={(e) => setForm({ ...form, instructor_title: e.target.value })} />
                  <Input label={ru ? 'Должность (RU)' : 'Title (RU)'} value={form.instructor_title_ru} onChange={(e) => setForm({ ...form, instructor_title_ru: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-2">{ru ? 'Биография (EN)' : 'Bio (EN)'}</label><textarea className="w-full h-24 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none" value={form.instructor_bio} onChange={(e) => setForm({ ...form, instructor_bio: e.target.value })} /></div>
                  <div><label className="block text-sm font-medium mb-2">{ru ? 'Биография (RU)' : 'Bio (RU)'}</label><textarea className="w-full h-24 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none" value={form.instructor_bio_ru} onChange={(e) => setForm({ ...form, instructor_bio_ru: e.target.value })} /></div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'cta' && (
            <Card>
              <CardHeader><CardTitle>{ru ? 'CTA секция' : 'CTA Section'}</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input label={ru ? 'Заголовок (EN)' : 'Title (EN)'} value={form.cta_title} onChange={(e) => setForm({ ...form, cta_title: e.target.value })} />
                  <Input label={ru ? 'Заголовок (RU)' : 'Title (RU)'} value={form.cta_title_ru} onChange={(e) => setForm({ ...form, cta_title_ru: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label={ru ? 'Подзаголовок (EN)' : 'Subtitle (EN)'} value={form.cta_subtitle} onChange={(e) => setForm({ ...form, cta_subtitle: e.target.value })} />
                  <Input label={ru ? 'Подзаголовок (RU)' : 'Subtitle (RU)'} value={form.cta_subtitle_ru} onChange={(e) => setForm({ ...form, cta_subtitle_ru: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label={ru ? 'Текст кнопки (EN)' : 'Button (EN)'} value={form.cta_button_text} onChange={(e) => setForm({ ...form, cta_button_text: e.target.value })} />
                  <Input label={ru ? 'Текст кнопки (RU)' : 'Button (RU)'} value={form.cta_button_text_ru} onChange={(e) => setForm({ ...form, cta_button_text_ru: e.target.value })} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
