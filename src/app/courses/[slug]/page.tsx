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

const iconMap: Record<string, any> = {
  'breast-augmentation-recovery': { icon: Heart, color: 'from-pink-500 to-rose-500' },
  'cesarean-recovery': { icon: Baby, color: 'from-purple-500 to-violet-500' },
}

export default function CoursePage() {
  const { locale } = useTranslation()
  const ru = locale === 'ru'
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  
  const [course, setCourse] = useState<any>(null)
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
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-white"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-white">
        <h1 className="text-2xl font-bold mb-4">{ru ? 'Курс не найден' : 'Course not found'}</h1>
        <Link href="/"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />{ru ? 'На главную' : 'Home'}</Button></Link>
      </div>
    )
  }

  const visual = iconMap[slug] || { icon: BookOpen, color: 'from-teal-500 to-emerald-500' }
  const Icon = visual.icon
  const price = course.price / 100
  const originalPrice = course.original_price ? course.original_price / 100 : null
  const tags = ru ? (course.tags_ru || course.tags || []) : (course.tags || [])
  const features = ru ? (course.features_ru || course.features || []) : (course.features || [])
  const includes = ru ? (course.includes_ru || course.includes || []) : (course.includes || [])
  const guarantee = ru ? (course.guarantee_text_ru || course.guarantee_text) : (course.guarantee_text || '30-day money-back guarantee')

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
        body: JSON.stringify({ courseSlug: slug, userId: user.id, userEmail: user.email }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'Course already purchased') {
          toast.info(ru ? 'Вы уже купили этот курс!' : 'You already own this course!')
          router.push('/client/courses')
          return
        }
        throw new Error(data.error)
      }
      window.location.href = data.url
    } catch (error: any) {
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
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center"><span className="text-white font-bold text-lg">Q</span></div>
            <span className="font-semibold text-zinc-900">Qbody</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <Link href="/client/home"><Button variant="outline" size="sm">{ru ? 'Мой кабинет' : 'My Account'}</Button></Link>
            ) : (
              <Link href="/auth/login"><Button variant="outline" size="sm">{ru ? 'Войти' : 'Sign In'}</Button></Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className={`relative py-16 lg:py-24 bg-gradient-to-br ${visual.color} overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6"><ArrowLeft className="w-4 h-4" />{ru ? 'Назад' : 'Back'}</Link>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-white/20 text-white border-0">{course.duration_weeks} {ru ? 'недель' : 'weeks'}</Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">{ru && course.title_ru ? course.title_ru : course.title}</h1>
              <p className="text-xl text-white/90 mb-6">{ru && course.description_ru ? course.description_ru : course.description}</p>
              
              {course.rating && (
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className={`w-5 h-5 ${i <= Math.round(course.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'}`} />)}</div>
                  <span className="text-white font-medium">{course.rating}</span>
                  {course.reviews_count > 0 && <span className="text-white/70">({course.reviews_count}+ {ru ? 'отзывов' : 'reviews'})</span>}
                </div>
              )}

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">{tags.map((tag: string, i: number) => <Badge key={i} className="bg-white/20 text-white border-0"><CheckCircle2 className="w-3 h-3 mr-1" />{tag}</Badge>)}</div>
              )}
            </div>
            <div className="flex justify-center lg:justify-end">
              {course.hero_video_url || course.hero_image_url ? (
                <div className="w-full max-w-lg aspect-video rounded-2xl bg-white/10 backdrop-blur-sm overflow-hidden flex items-center justify-center">
                  {course.hero_image_url ? (
                    <img src={course.hero_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Play className="w-16 h-16 text-white/80" />
                  )}
                </div>
              ) : (
                <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Icon className="w-24 h-24 lg:w-32 lg:h-32 text-white/80" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Features */}
              {features.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">{ru ? 'Что вы узнаете' : "What you'll learn"}</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {features.map((f: string, i: number) => <div key={i} className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0" /><span className="text-zinc-700">{f}</span></div>)}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Curriculum */}
              {course.course_modules && course.course_modules.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">{ru ? 'Учебный план' : 'Curriculum'}</h2>
                    <div className="space-y-3">
                      {course.course_modules.map((mod: any, i: number) => (
                        <div key={mod.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center font-bold text-sm">{i + 1}</div>
                            <span className="font-medium text-zinc-900">{ru && mod.title_ru ? mod.title_ru : mod.title}</span>
                          </div>
                          <span className="text-sm text-zinc-500">{mod.course_lessons?.length || 0} {ru ? 'уроков' : 'lessons'}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Instructor */}
              {course.instructor_name && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">{ru ? 'Инструктор' : 'Instructor'}</h2>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                        {course.instructor_image_url ? (
                          <img src={course.instructor_image_url} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <User className="w-8 h-8 text-teal-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-900">{course.instructor_name}</h3>
                        {(course.instructor_title || course.instructor_title_ru) && (
                          <p className="text-sm text-zinc-500">{ru && course.instructor_title_ru ? course.instructor_title_ru : course.instructor_title}</p>
                        )}
                        {(course.instructor_bio || course.instructor_bio_ru) && (
                          <p className="text-zinc-600 mt-2">{ru && course.instructor_bio_ru ? course.instructor_bio_ru : course.instructor_bio}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="shadow-xl border-0 overflow-hidden">
                  <div className={`h-3 bg-gradient-to-r ${visual.color}`} />
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <span className="text-4xl font-bold text-zinc-900">${price}</span>
                        {originalPrice && <span className="text-xl text-zinc-400 line-through">${originalPrice}</span>}
                        {originalPrice && <Badge className="bg-green-100 text-green-700 border-0">-{Math.round((1 - price/originalPrice) * 100)}%</Badge>}
                      </div>
                      {guarantee && <p className="text-sm text-zinc-500">{guarantee}</p>}
                    </div>

                    <Button variant="gradient" className="w-full h-14 text-lg mb-4" onClick={handleBuy} disabled={isCheckoutLoading}>
                      {isCheckoutLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (ru ? 'Купить сейчас' : 'Buy Now')}
                    </Button>

                    {includes.length > 0 && (
                      <div className="space-y-3 text-sm text-zinc-600">
                        <p className="font-medium text-zinc-900">{ru ? 'Этот курс включает:' : 'This course includes:'}</p>
                        {includes.map((item: string, i: number) => (
                          <div key={i} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500" /><span>{item}</span></div>
                        ))}
                        <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-teal-500" /><span>{course.lessons_count || 0} {ru ? 'уроков' : 'lessons'}</span></div>
                        <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-teal-500" /><span>{course.total_hours || 0} {ru ? 'часов видео' : 'hours of video'}</span></div>
                      </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-zinc-200 flex items-center justify-center gap-2 text-sm text-zinc-500">
                      <Shield className="w-4 h-4" /><span>{ru ? 'Безопасная оплата через Stripe' : 'Secure payment via Stripe'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      {(course.cta_title || course.cta_title_ru) && (
        <section className="py-16 bg-zinc-900">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">{ru && course.cta_title_ru ? course.cta_title_ru : course.cta_title}</h2>
            {(course.cta_subtitle || course.cta_subtitle_ru) && (
              <p className="text-zinc-400 mb-8">{ru && course.cta_subtitle_ru ? course.cta_subtitle_ru : course.cta_subtitle}</p>
            )}
            <Button variant="gradient" size="lg" className="h-14 px-10 text-lg" onClick={handleBuy} disabled={isCheckoutLoading}>
              {isCheckoutLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (ru && course.cta_button_text_ru ? course.cta_button_text_ru : (course.cta_button_text || (ru ? 'Начать сейчас' : 'Start Now')))}
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
