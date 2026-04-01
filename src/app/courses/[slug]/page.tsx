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
import { useScrollReveal, useSmoothAnchor, useLazyImages } from '@/components/ui/scroll-reveal'

const iconMap: Record<string, any> = {
  'breast-augmentation-recovery': { icon: Heart, color: 'from-pink-500 to-rose-500' },
  'cesarean-recovery': { icon: Baby, color: 'from-purple-500 to-violet-500' },
}

// ✅ FIX: Helper to resolve Vimeo / YouTube / direct video URLs
function getVideoEmbed(url: string): React.ReactNode {
  if (!url) return null
  try {
    // Vimeo: https://vimeo.com/123456789
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
    // YouTube: watch?v= or youtu.be/
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

export default function CoursePage() {
  const { locale, langConfig } = useTranslation()
  const ru = locale === langConfig.secondaryLanguage
  const { user, session } = useAuth()
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)

  // ✅ SMOOTH ANIMATIONS — re-observe after data loads
  useScrollReveal({ deps: [loading] })
  useSmoothAnchor(64)
  useLazyImages()

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
  const tags = ru ? (course.tags_secondary || course.tags || []) : (course.tags || [])
  const features = ru ? (course.features_secondary || course.features || []) : (course.features || [])
  const includes = ru ? (course.includes_secondary || course.includes || []) : (course.includes || [])
  const guarantee = ru ? (course.guarantee_text_secondary || course.guarantee_text) : (course.guarantee_text || '30-day money-back guarantee')

  const handleBuy = async () => {
    if (!user) {
      router.push(`/auth/register?course=${slug}`)
      return
    }
    setIsCheckoutLoading(true)
    try {
      const token = session?.access_token
      if (!token) {
        toast.error(ru ? 'Сессия истекла. Войдите снова.' : 'Session expired. Please sign in again.')
        router.push('/auth/login')
        return
      }
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ courseSlug: slug }),
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
          <nav className="hidden lg:flex items-center gap-6">
            {[
              { label: ru ? 'Программы' : 'Programs', href: '/#programs' },
              { label: ru ? 'Курсы' : 'Courses', href: '/#courses' },
              { label: ru ? 'О нас' : 'About', href: '/#about' },
              { label: ru ? 'Результаты' : 'Results', href: '/#results' },
            ].map(link => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-zinc-600 hover:text-teal-600 transition-colors">{link.label}</Link>
            ))}
          </nav>
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
      <section
        className="relative py-16 lg:py-24 overflow-hidden"
        style={{
          ...(course.hero_bg_image_url
            ? { backgroundImage: `url(${course.hero_bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : course.hero_bg_color
              ? (course.hero_bg_color.includes('gradient') || course.hero_bg_color.includes('linear')
                ? { backgroundImage: course.hero_bg_color }
                : { backgroundColor: course.hero_bg_color })
              : {}),
        }}
      >
        {/* Fallback gradient when no custom bg */}
        {!course.hero_bg_image_url && !course.hero_bg_color && (
          <div className={`absolute inset-0 bg-gradient-to-br ${visual.color}`} />
        )}
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6"><ArrowLeft className="w-4 h-4" />{ru ? 'Назад' : 'Back'}</Link>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-white/20 text-white border-0">{course.duration_weeks} {ru ? 'недель' : 'weeks'}</Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 break-all">{ru && course.title_secondary ? course.title_secondary : course.title}</h1>
              <p className="text-xl text-white/90 mb-6 break-all">{ru && course.description_secondary ? course.description_secondary : course.description}</p>
              
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

            {/* ✅ FIX: hero_video_url now actually renders a video player */}
            <div className="flex justify-center lg:justify-end">
              {course.hero_image_url || course.hero_video_url ? (
                <div className="w-full max-w-lg aspect-video rounded-2xl bg-black/20 backdrop-blur-sm overflow-hidden flex items-center justify-center">
                  {course.hero_image_url ? (
                    <img src={course.hero_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getVideoEmbed(course.hero_video_url)
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
      <section className="py-16 reveal-up">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Features */}
              {features.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">{ru ? 'Что вы узнаете' : "What you'll learn"}</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {features.map((f: string, i: number) => <div key={i} className="flex items-start gap-3 min-w-0"><CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" /><span className="text-zinc-700 break-all">{f}</span></div>)}
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
                        <div key={mod.id} className="flex items-center justify-between gap-3 p-4 bg-zinc-50 rounded-xl">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">{i + 1}</div>
                            <span className="font-medium text-zinc-900 break-all">{ru && mod.title_secondary ? mod.title_secondary : mod.title}</span>
                          </div>
                          <span className="text-sm text-zinc-500 flex-shrink-0">{mod.course_lessons?.length || 0} {ru ? 'уроков' : 'lessons'}</span>
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
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                        {course.instructor_image_url ? (
                          <img src={course.instructor_image_url} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <User className="w-8 h-8 text-teal-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-zinc-900 break-all">{course.instructor_name}</h3>
                        {(course.instructor_title || course.instructor_title_secondary) && (
                          <p className="text-sm text-zinc-500 break-all">{ru && course.instructor_title_secondary ? course.instructor_title_secondary : course.instructor_title}</p>
                        )}
                        {(course.instructor_bio || course.instructor_bio_secondary) && (
                          <p className="text-zinc-600 mt-2 break-all">{ru && course.instructor_bio_secondary ? course.instructor_bio_secondary : course.instructor_bio}</p>
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
                      {guarantee && <p className="text-sm text-zinc-500 break-all">{guarantee}</p>}
                    </div>

                    <Button variant="gradient" className="w-full h-14 text-lg mb-4" onClick={handleBuy} disabled={isCheckoutLoading}>
                      {isCheckoutLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (ru ? 'Купить сейчас' : 'Buy Now')}
                    </Button>

                    {includes.length > 0 && (
                      <div className="space-y-3 text-sm text-zinc-600">
                        <p className="font-medium text-zinc-900">{ru ? 'Этот курс включает:' : 'This course includes:'}</p>
                        {includes.map((item: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 min-w-0"><CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" /><span className="break-all">{item}</span></div>
                        ))}
                        <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-teal-500 flex-shrink-0" /><span>{course.lessons_count || 0} {ru ? 'уроков' : 'lessons'}</span></div>
                        <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-teal-500 flex-shrink-0" /><span>{course.total_hours || 0} {ru ? 'часов видео' : 'hours of video'}</span></div>
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
      {(course.cta_title || course.cta_title_secondary) && (
        <section className="py-16 bg-zinc-900 reveal-up">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4 break-all">{ru && course.cta_title_secondary ? course.cta_title_secondary : course.cta_title}</h2>
            {(course.cta_subtitle || course.cta_subtitle_secondary) && (
              <p className="text-zinc-400 mb-8 break-all">{ru && course.cta_subtitle_secondary ? course.cta_subtitle_secondary : course.cta_subtitle}</p>
            )}
            <Button variant="gradient" size="lg" className="h-14 px-10 text-lg" onClick={handleBuy} disabled={isCheckoutLoading}>
              {isCheckoutLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (ru && course.cta_button_text_secondary ? course.cta_button_text_secondary : (course.cta_button_text || (ru ? 'Начать сейчас' : 'Start Now')))}
            </Button>
          </div>
        </section>
      )}

      {/* Policy Footer */}
      <div className="bg-zinc-950 border-t border-zinc-800 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">© {new Date().getFullYear()} Qbody by Khavanskaia</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/privacy" className="text-zinc-500 hover:text-zinc-300 transition-colors">{ru ? 'Конфиденциальность' : 'Privacy Policy'}</Link>
            <Link href="/terms" className="text-zinc-500 hover:text-zinc-300 transition-colors">{ru ? 'Условия' : 'Terms of Service'}</Link>
            <Link href="/cookies" className="text-zinc-500 hover:text-zinc-300 transition-colors">{ru ? 'Cookie' : 'Cookie Policy'}</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
