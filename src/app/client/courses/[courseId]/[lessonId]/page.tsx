'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { fetchWithAuth } from '@/lib/api'
import { Play, CheckCircle2, ArrowLeft, ArrowRight, BookOpen, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type ContentBlock = {
  id: string
  type: 'heading' | 'text' | 'image' | 'video' | 'checklist'
  content: string
  content_secondary?: string
  items?: { id: string; text: string; text_secondary?: string }[]
}

type Lesson = {
  id: string
  title: string
  title_secondary: string | null
  type: 'video' | 'text' | 'task'
  duration_minutes: number
  completed: boolean
  watched_seconds: number
  video_url?: string | null
  video_url_secondary?: string | null
  content?: ContentBlock[]
  content_secondary?: ContentBlock[]
}

type Module = {
  id: string
  title: string
  title_secondary: string | null
  lessons: Lesson[]
}

type CourseProgress = {
  course_slug: string
  course_id: string
  course_title: string
  course_title_secondary: string | null
  modules: Module[]
}

// ✅ FIX: Resolve Vimeo / YouTube / direct video URLs into proper embed
function getVideoEmbed(url: string): React.ReactNode {
  if (!url) return null
  try {
    // Vimeo
    if (url.includes('vimeo.com')) {
      const id = url.replace(/https?:\/\/(www\.)?vimeo\.com\//, '').split('?')[0].split('/')[0]
      if (id) {
        return (
          <iframe
            src={`https://player.vimeo.com/video/${id}`}
            className="w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        )
      }
    }
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = ''
      if (url.includes('youtube.com/watch')) {
        videoId = new URL(url).searchParams.get('v') || ''
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/').pop()?.split('?')[0] || ''
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/').pop()?.split('?')[0] || ''
      }
      if (videoId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )
      }
    }
    // Direct video file
    return <video src={url} controls className="w-full h-full object-contain" />
  } catch {
    return <video src={url} controls className="w-full h-full object-contain" />
  }
}

// ✅ FIX: Render content blocks (heading / text / image / video / checklist)
function renderContentBlocks(blocks: ContentBlock[] | undefined, ru: boolean): React.ReactNode {
  if (!blocks || blocks.length === 0) return null
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          return (
            <h2 key={block.id || i} className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {block.content}
            </h2>
          )
        }
        if (block.type === 'text') {
          return (
            <p key={block.id || i} className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {block.content}
            </p>
          )
        }
        if (block.type === 'image') {
          return block.content ? (
            <img
              key={block.id || i}
              src={block.content}
              alt=""
              className="rounded-xl max-w-full object-cover"
            />
          ) : null
        }
        if (block.type === 'video') {
          return block.content ? (
            <div key={block.id || i} className="aspect-video bg-zinc-900 rounded-xl overflow-hidden">
              {getVideoEmbed(block.content)}
            </div>
          ) : null
        }
        if (block.type === 'checklist') {
          return (
            <div key={block.id || i} className="space-y-2">
              {(block.items || []).map((item, j) => (
                <div key={item.id || j} className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {ru ? (item.text_secondary || item.text) : item.text}
                  </span>
                </div>
              ))}
            </div>
          )
        }
        return null
      })}
    </div>
  )
}

export default function LessonPage() {
  const { t, locale, langConfig } = useTranslation()
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const courseSlug = params.courseId as string
  const lessonId = params.lessonId as string
  const ru = locale === langConfig.secondaryLanguage

  const [course, setCourse] = useState<CourseProgress | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prevLesson, setPrevLesson] = useState<Lesson | null>(null)
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null)
  const [lessonIndex, setLessonIndex] = useState(0)
  const [totalLessons, setTotalLessons] = useState(0)

  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      try {
        const res = await fetchWithAuth(`/api/progress?course_slug=${courseSlug}`)
        if (res.ok) {
          const data = await res.json()
          if (data.courses && data.courses.length > 0) {
            const courseData = data.courses[0]
            setCourse(courseData)

            // Find current lesson and neighbors
            const allLessons: Lesson[] = []
            courseData.modules.forEach((m: Module) => {
              m.lessons.forEach(l => allLessons.push(l))
            })

            setTotalLessons(allLessons.length)
            const currentIndex = allLessons.findIndex(l => l.id === lessonId)
            
            if (currentIndex >= 0) {
              setCurrentLesson(allLessons[currentIndex])
              setLessonIndex(currentIndex + 1)
              setPrevLesson(currentIndex > 0 ? allLessons[currentIndex - 1] : null)
              setNextLesson(currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load lesson:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, courseSlug, lessonId])

  const handleComplete = useCallback(async () => {
    if (!currentLesson || currentLesson.completed) return

    setSaving(true)
    try {
      const res = await fetchWithAuth('/api/progress', {
        method: 'POST',
        body: JSON.stringify({
          lesson_id: lessonId,
          completed: true,
          watched_seconds: (currentLesson.duration_minutes || 10) * 60,
        }),
      })

      if (!res.ok) throw new Error('Failed to save progress')

      setCurrentLesson(prev => prev ? { ...prev, completed: true } : null)
      toast.success(t('client.lesson.lessonMarkedComplete'))

      if (nextLesson) {
        setTimeout(() => {
          router.push(`/client/courses/${courseSlug}/${nextLesson.id}`)
        }, 1500)
      }
    } catch (err) {
      console.error('Failed to save progress:', err)
      toast.error(t('client.lesson.failedToSave'))
    } finally {
      setSaving(false)
    }
  }, [currentLesson, lessonId, nextLesson, courseSlug, router, t])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  if (!course || !currentLesson) {
    return (
      <div className="text-center py-20">
        <BookOpen className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
        <h2 className="text-xl font-semibold text-zinc-900 mb-2">
          {t('client.lesson.notFound')}
        </h2>
        <Link href={`/client/courses/${courseSlug}`}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('client.lesson.backToCourse')}
          </Button>
        </Link>
      </div>
    )
  }

  // Выбираем контент на нужном языке. Для secondary-блоков с пустыми
  // image/video URL делаем fallback на primary-блок с тем же id.
  const primaryBlocks: ContentBlock[] = currentLesson.content || []
  const secondaryBlocks: ContentBlock[] = currentLesson.content_secondary || []
  const contentBlocks: ContentBlock[] = ru
    ? (secondaryBlocks.length ? secondaryBlocks : primaryBlocks).map(block => {
        if ((block.type === 'image' || block.type === 'video') && !block.content) {
          const primary = primaryBlocks.find(p => p.id === block.id)
          if (primary?.content) return { ...block, content: primary.content }
        }
        return block
      })
    : primaryBlocks

  // Показываем видеоплеер только для уроков типа video или при наличии video_url
  const showVideoPlayer = currentLesson.type === 'video' || !!currentLesson.video_url

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href={`/client/courses/${courseSlug}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('client.lesson.backToCourse')}
          </Button>
        </Link>
        <div className="flex gap-2">
          {prevLesson ? (
            <Link href={`/client/courses/${courseSlug}/${prevLesson.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t('client.lesson.previousLesson')}
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('client.lesson.previousLesson')}
            </Button>
          )}
          {nextLesson ? (
            <Link href={`/client/courses/${courseSlug}/${nextLesson.id}`}>
              <Button variant="outline" size="sm">
                {t('client.lesson.nextLesson')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled>
              {t('client.lesson.nextLesson')}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* ✅ FIX: Video Player — only for video lessons, locale-aware URL, supports Vimeo/YouTube/direct */}
          {showVideoPlayer && (() => {
            const videoUrl = ru
              ? (currentLesson.video_url_secondary || currentLesson.video_url)
              : currentLesson.video_url
            return (
              <div className="aspect-video bg-zinc-900 rounded-2xl overflow-hidden flex items-center justify-center relative">
                {videoUrl ? (
                  getVideoEmbed(videoUrl)
                ) : (
                  <div className="text-center">
                    <Play className="w-16 h-16 text-white/50 mx-auto mb-4" />
                    <p className="text-white/50">{t('client.lesson.videoPlayer')}</p>
                    <p className="text-white/30 text-sm">{t('client.lesson.protectedContent')}</p>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Lesson Info */}
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge variant="secondary">
                {t('client.lesson.lessonNumber')} {lessonIndex}/{totalLessons}
              </Badge>
              <Badge variant="outline">
                {currentLesson.duration_minutes} {t('client.course.min')}
              </Badge>
              {currentLesson.completed && (
                <Badge variant="success">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {t('client.lesson.completed')}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              {ru ? currentLesson.title_secondary || currentLesson.title : currentLesson.title}
            </h1>
          </div>

          {/* ✅ FIX: Render content blocks (heading / text / image / checklist) */}
          {contentBlocks.length > 0 && (
            <Card>
              <CardContent className="p-6">
                {renderContentBlocks(contentBlocks, ru)}
              </CardContent>
            </Card>
          )}

          {/* Complete Button */}
          {!currentLesson.completed && (
            <Button 
              variant="gradient" 
              size="lg" 
              onClick={handleComplete}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5 mr-2" />
              )}
              {t('client.lesson.markComplete')}
            </Button>
          )}

          {currentLesson.completed && nextLesson && (
            <Link href={`/client/courses/${courseSlug}/${nextLesson.id}`}>
              <Button variant="gradient" size="lg">
                {t('client.lesson.nextLesson')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          )}

          {currentLesson.completed && !nextLesson && (
            <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
                {t('client.lesson.congratulations')}
              </h3>
              <p className="text-green-600 dark:text-green-500">
                {t('client.lesson.courseCompleted')}
              </p>
              <Link href={`/client/courses/${courseSlug}`}>
                <Button variant="outline" className="mt-4">
                  {t('client.course.backToCourses')}
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                {ru ? course.course_title_secondary : course.course_title}
              </h3>
              
              {/* Mini progress */}
              <div className="space-y-3">
                {course.modules.map((module) => {
                  const completedInModule = module.lessons.filter(l => l.completed).length
                  return (
                    <div key={module.id} className="text-sm">
                      <div className="flex justify-between text-zinc-600 dark:text-zinc-400 mb-1">
                        <span className="truncate">{ru ? module.title_secondary || module.title : module.title}</span>
                        <span>{completedInModule}/{module.lessons.length}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-teal-500 rounded-full transition-all"
                          style={{ width: `${module.lessons.length > 0 ? (completedInModule / module.lessons.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
