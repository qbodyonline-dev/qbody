'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { ArrowLeft, Play, Clock, BookOpen, CheckCircle2, Shield, Award, Heart, Baby, Star, User, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const coursesData = {
  'breast-augmentation-recovery': {
    title: 'Breast Augmentation Recovery', titleRu: 'Восстановление после увеличения груди',
    description: 'Safe recovery and strengthening program after mammoplasty. Specially designed exercises for returning to active life.',
    descriptionRu: 'Безопасная программа восстановления и укрепления после маммопластики. Специально разработанные упражнения для возвращения к активной жизни.',
    icon: Heart, color: 'from-pink-500 to-rose-500', price: 99, originalPrice: 149, weeks: 6, lessons: 18, hours: 4.5,
    features: ['Phased recovery', 'Safe exercises', 'Nutrition tips', 'Scar care', 'Video instructions'],
    featuresRu: ['Поэтапное восстановление', 'Безопасные упражнения', 'Рекомендации по питанию', 'Уход за швами', 'Видео-инструкции'],
    curriculum: [
      { week: 1, title: 'Week 1: Getting Started', titleRu: 'Неделя 1: Начало', lessons: 3 },
      { week: 2, title: 'Week 2: Gentle Movements', titleRu: 'Неделя 2: Мягкие движения', lessons: 3 },
      { week: 3, title: 'Week 3: Building Strength', titleRu: 'Неделя 3: Укрепление', lessons: 3 },
      { week: 4, title: 'Week 4: Posture Work', titleRu: 'Неделя 4: Работа с осанкой', lessons: 3 },
      { week: 5, title: 'Week 5: Full Integration', titleRu: 'Неделя 5: Полная интеграция', lessons: 3 },
      { week: 6, title: 'Week 6: Maintenance', titleRu: 'Неделя 6: Поддержание', lessons: 3 },
    ]
  },
  'cesarean-recovery': {
    title: 'C-Section Recovery', titleRu: 'Восстановление после кесарева сечения',
    description: 'Comprehensive program for new moms. Recovery of abdominal muscles, pelvic floor, and getting back in shape after surgery.',
    descriptionRu: 'Комплексная программа для молодых мам. Восстановление мышц живота, тазового дна и возвращение формы после операции.',
    icon: Baby, color: 'from-purple-500 to-violet-500', price: 99, originalPrice: 149, weeks: 8, lessons: 24, hours: 6,
    features: ['Core recovery', 'Pelvic floor', 'Diastasis work', 'Posture support', 'Exercises with baby'],
    featuresRu: ['Восстановление пресса', 'Тазовое дно', 'Работа с диастазом', 'Поддержка осанки', 'Занятия с малышом'],
    curriculum: [
      { week: 1, title: 'Week 1-2: Foundation', titleRu: 'Недели 1-2: Основа', lessons: 6 },
      { week: 3, title: 'Week 3-4: Building', titleRu: 'Недели 3-4: Построение', lessons: 6 },
      { week: 5, title: 'Week 5-6: Strengthening', titleRu: 'Недели 5-6: Укрепление', lessons: 6 },
      { week: 7, title: 'Week 7-8: Integration', titleRu: 'Недели 7-8: Интеграция', lessons: 6 },
    ]
  }
}

export default function CoursePage() {
  const { t, locale } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const course = coursesData[slug as keyof typeof coursesData]
  const [isLoading, setIsLoading] = useState(false)

  if (!course) return <div className="min-h-screen flex items-center justify-center">Course not found</div>

  const Icon = course.icon

  const handleBuy = async () => {
    // If not logged in, redirect to register with course param
    if (!user) {
      router.push(`/auth/register?course=${slug}`)
      return
    }

    setIsLoading(true)
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
          toast.info(locale === 'ru' ? 'Вы уже купили этот курс!' : 'You already own this course!')
          router.push('/client/courses')
          return
        }
        throw new Error(data.error || 'Failed to create checkout')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error: any) {
      console.error('Checkout error:', error)
      toast.error(locale === 'ru' ? 'Ошибка при создании платежа' : 'Error creating payment')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-zinc-200">
        <div className="container-custom h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center"><span className="text-white font-bold">Q</span></div>
            <span className="font-semibold text-zinc-900 hidden sm:block">Qbody</span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher variant="dropdown" />
            {user ? (
              <Link href="/client"><Button variant="outline" size="sm">{locale === 'ru' ? 'Мой кабинет' : 'My Account'}</Button></Link>
            ) : (
              <Link href="/auth/login"><Button variant="outline" size="sm">{t('nav.login')}</Button></Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className={`bg-gradient-to-br ${course.color} py-16 lg:py-24`}>
        <div className="container-custom">
          <Link href="/#courses" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6"><ArrowLeft className="w-4 h-4" />{t('common.back')}</Link>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-white/20 text-white border-0 mb-4"><Clock className="w-3 h-3 mr-1" />{course.weeks} {t('landing.courses.duration')}</Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">{locale === 'ru' ? course.titleRu : course.title}</h1>
              <p className="text-lg text-white/80 mb-6">{locale === 'ru' ? course.descriptionRu : course.description}</p>
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-1">{[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}</div>
                <span className="text-white/80">4.9 (120+ reviews)</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {(locale === 'ru' ? course.featuresRu : course.features).map((f) => (
                  <Badge key={f} className="bg-white/10 text-white border-white/20"><CheckCircle2 className="w-3 h-3 mr-1" />{f}</Badge>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video bg-black/20 rounded-2xl flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-zinc-900 ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {/* What you'll learn */}
            <section>
              <h2 className="text-2xl font-bold text-zinc-900 mb-6">{t('coursePage.whatYouLearn')}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {(locale === 'ru' ? course.featuresRu : course.features).map((f) => (
                  <div key={f} className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 mt-0.5" /><span className="text-zinc-700">{f}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Curriculum */}
            <section>
              <h2 className="text-2xl font-bold text-zinc-900 mb-6">{t('coursePage.curriculum')}</h2>
              <div className="space-y-3">
                {course.curriculum.map((week) => (
                  <div key={week.week} className="p-4 border border-zinc-200 rounded-xl hover:border-teal-500 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 font-semibold text-sm">{week.week}</div>
                        <span className="font-medium text-zinc-900">{locale === 'ru' ? week.titleRu : week.title}</span>
                      </div>
                      <Badge variant="secondary">{week.lessons} {t('coursePage.lessons')}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Instructor */}
            <section>
              <h2 className="text-2xl font-bold text-zinc-900 mb-6">{t('coursePage.instructor')}</h2>
              <div className="flex items-start gap-4 p-6 bg-zinc-50 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center"><User className="w-8 h-8 text-teal-500" /></div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Aleksandra Khavanskaia</h3>
                  <p className="text-zinc-500 text-sm mb-2">NASM CPT • CES • PBC • CAPT</p>
                  <p className="text-zinc-600">{locale === 'ru' ? 'Практикующий тренер с 17-летним опытом, специалист по восстановлению и коррекции.' : '17 years of experience. Specializing in recovery programs and body correction.'}</p>
                </div>
              </div>
            </section>
          </div>

          {/* Sticky Purchase Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="shadow-xl border-2">
                <CardContent className="p-6">
                  <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-4xl font-bold text-zinc-900">${course.price}</span>
                    <span className="text-xl text-zinc-400 line-through">${course.originalPrice}</span>
                    <Badge variant="success">-{Math.round((1 - course.price/course.originalPrice)*100)}%</Badge>
                  </div>
                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full mb-4"
                    onClick={handleBuy}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{locale === 'ru' ? 'Перенаправление...' : 'Redirecting...'}</>
                    ) : (
                      t('coursePage.buyNow')
                    )}
                  </Button>
                  <p className="text-center text-sm text-zinc-500 mb-6">{t('coursePage.guarantee')}</p>
                  <div className="space-y-3 pt-4 border-t">
                    <p className="font-medium text-zinc-900">{t('coursePage.includes')}</p>
                    <div className="space-y-2 text-sm text-zinc-600">
                      <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-teal-500" />{course.lessons} {t('coursePage.lessons')}</div>
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-teal-500" />{course.hours} {t('coursePage.hours')}</div>
                      <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-teal-500" />{t('coursePage.lifetime')}</div>
                      <div className="flex items-center gap-2"><Award className="w-4 h-4 text-teal-500" />{t('coursePage.certificate')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
