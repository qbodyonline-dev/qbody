'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { ArrowLeft, Play, Clock, BookOpen, CheckCircle2, Shield, Award, Heart, Baby, Star, User, Loader2, Video, FileText, ListChecks } from 'lucide-react'
import { toast } from 'sonner'

// Fallback data for courses that might not be in DB yet
const fallbackData: Record<string, any> = {
  'breast-augmentation-recovery': {
    icon: Heart, color: 'from-pink-500 to-rose-500',
    features: ['Phased recovery', 'Safe exercises', 'Nutrition tips', 'Scar care', 'Video instructions'],
    featuresRu: ['Поэтапное восстановление', 'Безопасные упражнения', 'Рекомендации по питанию', 'Уход за швами', 'Видео-инструкции'],
  },
  'cesarean-recovery': {
    icon: Baby, color: 'from-purple-500 to-violet-500',
    features: ['Core recovery', 'Pelvic floor', 'Diastasis work', 'Posture support', 'Exercises with baby'],
    featuresRu: ['Восстановление пресса', 'Тазовое дно', 'Работа с диастазом', 'Поддержка осанки', 'Занятия с малышом'],
  }
}

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
  lessons_count: number
  total_hours: number
  course_modules: {
    id: string
    title: string
    title_ru: string | null
    course_lessons: {
      id: string
      title: string
      title_ru: string | null
      type: string
      duration_minutes: number
      is_free: boolean
    }[]
  }[]
}

export default function CoursePage() {
  const { locale } = useTranslation()
  const ru = locale === 'ru'
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/public/courses/${slug}`)
        if (!res.ok) throw new Error('Not found')
        const data = await res.json()
        setCourse(data)
      } catch {
        setCourse(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-white">
        <h1 className="text-2xl font-bold mb-4">{ru ? 'Курс не найден' : 'Course not found'}</h1>
        <Link href="/"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />{ru ? 'На главную' : 'Home'}</Button></Link>
      </div>
    )
  }

  const fallback = fallbackData[slug] || { icon: BookOpen, color: 'from-teal-500 to-emerald-500', features: [], featuresRu: [] }
  const Icon = fallback.icon
  const features = ru ? fallback.featuresRu : fallback.features
  const price = course.price / 100
  const originalPrice = course.original_price ? course.original_price / 100 : null

  const handleBuy = async () => {
    if (!user) {
      router.push(`/auth/register?course=${slug}`)
      return
    }

    setIsCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseSlug: slug,
          userId: user.id,
          userEmail: user.email,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'Course already purchased') {
          toast.info(ru ? 'Вы уже купили этот курс!' : 'You already own this course!')
          router.push('/client/courses')
          return
        }
        throw new Error(data.error || 'Failed to create checkout')
      }

      window.location.href = data.url
    } catch (error: any) {
      console.error('Checkout error:', error)
      toast.error(ru ? 'Ошибка при создании платежа' : 'Error creating payment')
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <span className="font-semibold text-zinc-900">Qbody</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <Link href="/client/home">
                <Button variant="outline" size="sm">{ru ? 'Мой кабинет' : 'My Account'}</Button>
              </Link>
            ) : (
              <Link href="/auth/login">
                <Button variant="outline" size="sm">{ru ? 'Войти' : 'Sign In'}</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className={`relative py-16 lg:py-24 bg-gradient-to-br ${fallback.color} overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {ru ? 'Назад' : 'Back'}
          </Link>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-white/20 text-white border-0">
                {course.duration_weeks} {ru ? 'недель' : 'weeks'} • {course.lessons_count} {ru ? 'уроков' : 'lessons'}
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                {ru && course.title_ru ? course.title_ru : course.title}
              </h1>
              <p className="text-xl text-white/90 mb-8">
                {ru && course.description_ru ? course.description_ru : course.description}
              </p>
              <div className="flex flex-wrap gap-6 text-white/90">
                <div className="flex items-center gap-2"><Clock className="w-5 h-5" /><span>{course.total_hours}h {ru ? 'контента' : 'content'}</span></div>
                <div className="flex items-center gap-2"><BookOpen className="w-5 h-5" /><span>{course.lessons_count} {ru ? 'уроков' : 'lessons'}</span></div>
                <div className="flex items-center gap-2"><Award className="w-5 h-5" /><span>{ru ? 'Сертификат' : 'Certificate'}</span></div>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Icon className="w-24 h-24 lg:w-32 lg:h-32 text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Features */}
              {features.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">{ru ? 'Что включено' : "What's Included"}</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {features.map((feature: string, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0" />
                          <span className="text-zinc-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Curriculum */}
              {course.course_modules && course.course_modules.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">{ru ? 'Программа курса' : 'Course Curriculum'}</h2>
                    <div className="space-y-4">
                      {course.course_modules.map((mod, i) => (
                        <div key={mod.id} className="border border-zinc-200 rounded-xl overflow-hidden">
                          <div className="p-4 bg-zinc-50 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center font-bold text-sm">{i + 1}</div>
                            <div>
                              <h3 className="font-semibold text-zinc-900">{ru && mod.title_ru ? mod.title_ru : mod.title}</h3>
                              <p className="text-sm text-zinc-500">{mod.course_lessons?.length || 0} {ru ? 'уроков' : 'lessons'}</p>
                            </div>
                          </div>
                          {mod.course_lessons && mod.course_lessons.length > 0 && (
                            <div className="p-4 space-y-2">
                              {mod.course_lessons.map((lesson, li) => (
                                <div key={lesson.id} className="flex items-center gap-3 py-2 text-sm">
                                  <span className="text-zinc-400 w-6">{li + 1}.</span>
                                  <div className={`w-6 h-6 rounded flex items-center justify-center ${lesson.type === 'video' ? 'bg-blue-100 text-blue-600' : lesson.type === 'text' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                                    {lesson.type === 'video' ? <Video className="w-3 h-3" /> : lesson.type === 'text' ? <FileText className="w-3 h-3" /> : <ListChecks className="w-3 h-3" />}
                                  </div>
                                  <span className="flex-1 text-zinc-700">{ru && lesson.title_ru ? lesson.title_ru : lesson.title}</span>
                                  <span className="text-zinc-400">{lesson.duration_minutes} {ru ? 'мин' : 'min'}</span>
                                  {lesson.is_free && <Badge variant="outline" className="text-xs">{ru ? 'Бесплатно' : 'Free'}</Badge>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Guarantees */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">{ru ? 'Гарантии' : 'Guarantees'}</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-6 h-6 text-teal-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-zinc-900">{ru ? 'Безопасные платежи' : 'Secure Payments'}</p>
                        <p className="text-sm text-zinc-500">{ru ? 'Stripe защищает ваши данные' : 'Stripe protects your data'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Award className="w-6 h-6 text-teal-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-zinc-900">{ru ? 'Пожизненный доступ' : 'Lifetime Access'}</p>
                        <p className="text-sm text-zinc-500">{ru ? 'Курс навсегда ваш' : 'Course is yours forever'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Price Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="shadow-xl border-0 overflow-hidden">
                  <div className={`h-3 bg-gradient-to-r ${fallback.color}`} />
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <span className="text-4xl font-bold text-zinc-900">${price}</span>
                        {originalPrice && (
                          <span className="text-xl text-zinc-400 line-through">${originalPrice}</span>
                        )}
                      </div>
                      {originalPrice && (
                        <Badge className="bg-green-100 text-green-700 border-0">
                          {ru ? 'Скидка' : 'Save'} ${originalPrice - price}
                        </Badge>
                      )}
                    </div>

                    <Button 
                      variant="gradient" 
                      className="w-full h-14 text-lg mb-4" 
                      onClick={handleBuy}
                      disabled={isCheckoutLoading}
                    >
                      {isCheckoutLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        ru ? 'Купить курс' : 'Buy Course'
                      )}
                    </Button>

                    <div className="space-y-3 text-sm text-zinc-600">
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500" /><span>{ru ? 'Мгновенный доступ' : 'Instant access'}</span></div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500" /><span>{course.lessons_count} {ru ? 'видео уроков' : 'video lessons'}</span></div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500" /><span>{course.duration_weeks} {ru ? 'недель программы' : 'weeks program'}</span></div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500" /><span>{ru ? 'Пожизненный доступ' : 'Lifetime access'}</span></div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-zinc-200 flex items-center justify-center gap-2 text-sm text-zinc-500">
                      <Shield className="w-4 h-4" />
                      <span>{ru ? 'Безопасная оплата через Stripe' : 'Secure payment via Stripe'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {ru ? 'Готовы начать восстановление?' : 'Ready to Start Your Recovery?'}
          </h2>
          <p className="text-zinc-400 mb-8">
            {ru ? 'Присоединяйтесь к тысячам женщин, которые уже прошли этот путь' : 'Join thousands of women who have already completed this journey'}
          </p>
          <Button variant="gradient" size="lg" className="h-14 px-10 text-lg" onClick={handleBuy} disabled={isCheckoutLoading}>
            {isCheckoutLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (ru ? 'Начать сейчас' : 'Start Now')}
          </Button>
        </div>
      </section>
    </div>
  )
}
