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
import {
  ArrowLeft, Dumbbell, Clock, Calendar, CheckCircle2, Shield,
  Flame, Target, TrendingUp, Loader2, ChevronDown, ChevronUp,
  Menu, X, LayoutDashboard, User
} from 'lucide-react'
import { BlockRenderer } from '@/components/ui/block-renderer'
import { toast } from 'sonner'

const goalConfig: Record<string, { label: string; labelRu: string; color: string }> = {
  weight_loss: { label: 'Weight Loss', labelRu: 'Похудение', color: 'from-orange-500 to-red-500' },
  muscle_gain: { label: 'Muscle Gain', labelRu: 'Набор массы', color: 'from-blue-500 to-indigo-500' },
  endurance: { label: 'Endurance', labelRu: 'Выносливость', color: 'from-green-500 to-emerald-500' },
  recovery: { label: 'Recovery', labelRu: 'Восстановление', color: 'from-purple-500 to-violet-500' },
  general: { label: 'General Fitness', labelRu: 'Общая форма', color: 'from-teal-500 to-cyan-500' },
  beginner: { label: 'Beginner', labelRu: 'Для новичков', color: 'from-sky-500 to-blue-500' },
  home: { label: 'Home Workout', labelRu: 'Дома', color: 'from-amber-500 to-orange-500' },
}

const diffLabels: Record<string, { en: string; ru: string }> = {
  beginner: { en: 'Beginner', ru: 'Начинающий' },
  intermediate: { en: 'Intermediate', ru: 'Средний' },
  advanced: { en: 'Advanced', ru: 'Продвинутый' },
}

const dayNames = { en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] }

export default function ProgramPage() {
  const { locale, langConfig } = useTranslation()
  const ru = locale === langConfig.secondaryLanguage
  const { user, session, isAdmin, isTrainer, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [program, setProgram] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedWeek, setExpandedWeek] = useState<number | null>(0)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  const navLinks = ru
    ? [{ name: 'Главная', href: '/' }, { name: 'Программы', href: '/#programs' }, { name: 'Курсы', href: '/#courses' }, { name: 'О нас', href: '/#about' }, { name: 'Контакты', href: '/#contacts' }]
    : [{ name: 'Home', href: '/' }, { name: 'Programs', href: '/#programs' }, { name: 'Courses', href: '/#courses' }, { name: 'About', href: '/#about' }, { name: 'Contacts', href: '/#contacts' }]

  const dashLink = (isAdmin || isTrainer) ? '/dashboard' : '/client/home'
  const dashLabel = (isAdmin || isTrainer) ? (ru ? 'Админ панель' : 'Dashboard') : (ru ? 'Мой кабинет' : 'My Account')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/public/programs/${slug}`)
        if (!res.ok) throw new Error()
        setProgram(await res.json())
      } catch { setProgram(null) }
      finally { setLoading(false) }
    }
    load()
  }, [slug])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-white"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
  }

  if (!program) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-white">
        <h1 className="text-2xl font-bold mb-4">{ru ? 'Программа не найдена' : 'Program not found'}</h1>
        <Link href="/"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />{ru ? 'На главную' : 'Home'}</Button></Link>
      </div>
    )
  }

  const gc = goalConfig[program.goal] || goalConfig.general
  const price = program.price ? program.price / 100 : null
  const originalPrice = program.original_price ? program.original_price / 100 : null
  const features = ru ? (program.features_secondary || program.features || []) : (program.features || [])
  const includes = ru ? (program.includes_secondary || program.includes || []) : (program.includes || [])

  // Group days by week
  const weekGroups: Record<number, any[]> = {}
  for (const d of (program.program_days || [])) {
    if (!weekGroups[d.week_number]) weekGroups[d.week_number] = []
    weekGroups[d.week_number].push(d)
  }
  const weeks = Object.keys(weekGroups).map(Number).sort((a, b) => a - b)

  const handleBuy = async () => {
    if (!user) {
      router.push(`/auth/register?program=${slug}`)
      return
    }
    setIsCheckoutLoading(true)
    try {
      const token = session?.access_token
      if (!token) {
        toast.error(ru ? 'Войдите в аккаунт' : 'Please sign in')
        router.push('/auth/login')
        return
      }
      const res = await fetch('/api/stripe/program-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ programId: program.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error?.includes('already')) {
          toast.info(ru ? 'Вы уже купили эту программу!' : 'You already own this program!')
          return
        }
        throw new Error(data.error)
      }
      window.location.href = data.url
    } catch {
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
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center"><span className="text-white font-bold text-base">Q</span></div>
            <span className="font-semibold text-zinc-900">Qbody</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-zinc-600 hover:text-teal-600 transition-colors">{link.name}</Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="dropdown" className="hidden sm:block" />
            {!authLoading && user ? (
              <Link href={dashLink} className="hidden lg:block">
                <Button variant="gradient" size="sm">
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />{dashLabel}
                </Button>
              </Link>
            ) : (
              <Link href="/auth/login" className="hidden lg:block">
                <Button variant="outline" size="sm"><User className="w-4 h-4 mr-1.5" />{ru ? 'Войти' : 'Sign In'}</Button>
              </Link>
            )}
            {/* Mobile menu toggle */}
            <button className="lg:hidden p-2 text-zinc-700" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="lg:hidden border-t border-zinc-100 bg-white px-4 py-4 space-y-3">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMobileMenu(false)}
                className="block text-sm font-medium text-zinc-700 hover:text-teal-600 py-1.5">{link.name}</Link>
            ))}
            <div className="pt-3 border-t border-zinc-100 flex items-center gap-2">
              <LanguageSwitcher variant="dropdown" className="sm:hidden" />
              {!authLoading && user ? (
                <Link href={dashLink} className="flex-1">
                  <Button variant="gradient" size="sm" className="w-full"><LayoutDashboard className="w-4 h-4 mr-1.5" />{dashLabel}</Button>
                </Link>
              ) : (
                <Link href="/auth/login" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full"><User className="w-4 h-4 mr-1.5" />{ru ? 'Войти' : 'Sign In'}</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative py-16 lg:py-24 overflow-hidden"
        style={program.hero_image_url
          ? { backgroundImage: `url(${program.hero_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : {}
        }>
        {!program.hero_image_url && <div className={`absolute inset-0 bg-gradient-to-br ${gc.color}`} />}
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative max-w-7xl mx-auto px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6"><ArrowLeft className="w-4 h-4" />{ru ? 'Назад' : 'Back'}</Link>
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-white/20 text-white border-0"><Calendar className="w-3 h-3 mr-1" />{program.duration_weeks} {ru ? 'недель' : 'weeks'}</Badge>
              <Badge className="bg-white/20 text-white border-0"><Dumbbell className="w-3 h-3 mr-1" />{program.total_workouts} {ru ? 'тренировок' : 'workouts'}</Badge>
              <Badge className="bg-white/20 text-white border-0"><TrendingUp className="w-3 h-3 mr-1" />{diffLabels[program.difficulty]?.[ru ? 'ru' : 'en'] || program.difficulty}</Badge>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">{ru && program.name_secondary ? program.name_secondary : program.name}</h1>
            {(program.description || program.description_secondary) && (
              <p className="text-xl text-white/90 mb-6">{ru && program.description_secondary ? program.description_secondary : program.description}</p>
            )}
            <Badge className="bg-white/20 text-white border-0 text-base px-4 py-1">
              <Target className="w-4 h-4 mr-2" />{ru ? gc.labelRu : gc.label}
            </Badge>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">

              {/* Full Description */}
              {(() => {
                const fullDesc = ru ? (program.full_description_secondary || program.full_description) : (program.full_description)
                return fullDesc && fullDesc.length > 0 ? (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-bold mb-4">{ru ? 'О программе' : 'About the Program'}</h2>
                      <BlockRenderer blocks={fullDesc} />
                    </CardContent>
                  </Card>
                ) : null
              })()}

              {/* Features */}
              {features.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">{ru ? 'Что входит в программу' : "What's included"}</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {features.map((f: string, i: number) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                          <span className="text-zinc-700 dark:text-zinc-300">{f}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Schedule */}
              {weeks.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">{ru ? 'Расписание тренировок' : 'Training Schedule'}</h2>
                    <div className="space-y-2">
                      {weeks.map(weekNum => {
                        const days = weekGroups[weekNum]
                        const workoutCount = days.filter((d: any) => !d.is_rest_day && d.workouts).length
                        const isExpanded = expandedWeek === weekNum

                        return (
                          <div key={weekNum} className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                            <button onClick={() => setExpandedWeek(isExpanded ? null : weekNum)}
                              className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 transition-colors">
                              <span className="font-medium">{ru ? 'Неделя' : 'Week'} {weekNum}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-zinc-500">{workoutCount} {ru ? 'трен.' : 'workouts'}</span>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="p-4 grid grid-cols-7 gap-2">
                                {days.sort((a: any, b: any) => a.day_of_week - b.day_of_week).map((day: any, di: number) => (
                                  <div key={di} className="text-center">
                                    <p className="text-xs font-medium text-zinc-500 mb-1">{dayNames[ru ? 'ru' : 'en'][day.day_of_week - 1]}</p>
                                    {day.is_rest_day || !day.workouts ? (
                                      <div className="text-xs text-zinc-400 py-2 px-1 border border-zinc-100 rounded-lg bg-zinc-50">
                                        {ru ? 'Отдых' : 'Rest'}
                                      </div>
                                    ) : (
                                      <div className="text-xs py-2 px-1 border border-teal-200 rounded-lg bg-teal-50 text-teal-700 font-medium">
                                        {ru && day.workouts.name_secondary ? day.workouts.name_secondary : day.workouts.name}
                                        {day.workouts.estimated_duration && (
                                          <p className="text-[10px] text-teal-500 mt-0.5">{day.workouts.estimated_duration} {ru ? 'мин' : 'min'}</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="shadow-xl border-0 overflow-hidden">
                  <div className={`h-3 bg-gradient-to-r ${gc.color}`} />
                  <CardContent className="p-6">
                    {price && (
                      <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-3 mb-2">
                          <span className="text-4xl font-bold text-zinc-900">${price}</span>
                          {originalPrice && <span className="text-xl text-zinc-400 line-through">${originalPrice}</span>}
                          {originalPrice && originalPrice > price && <Badge className="bg-green-100 text-green-700 border-0">-{Math.round((1 - price / originalPrice) * 100)}%</Badge>}
                        </div>
                      </div>
                    )}

                    <Button variant="gradient" className="w-full h-14 text-lg mb-4" onClick={handleBuy} disabled={isCheckoutLoading}>
                      {isCheckoutLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (ru ? 'Купить программу' : 'Buy Program')}
                    </Button>

                    {/* Program stats */}
                    <div className="space-y-3 text-sm text-zinc-600 mb-4">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-teal-500" /><span>{program.duration_weeks} {ru ? 'недель' : 'weeks'}</span></div>
                      <div className="flex items-center gap-2"><Dumbbell className="w-4 h-4 text-teal-500" /><span>{program.total_workouts} {ru ? 'тренировок' : 'workouts'}</span></div>
                      <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-teal-500" /><span>{diffLabels[program.difficulty]?.[ru ? 'ru' : 'en'] || program.difficulty}</span></div>
                      <div className="flex items-center gap-2"><Flame className="w-4 h-4 text-teal-500" /><span>{ru ? gc.labelRu : gc.label}</span></div>
                    </div>

                    {includes.length > 0 && (
                      <div className="space-y-2 text-sm text-zinc-600 pt-4 border-t border-zinc-200">
                        <p className="font-medium text-zinc-900">{ru ? 'Программа включает:' : 'This program includes:'}</p>
                        {includes.map((item: string, i: number) => (
                          <div key={i} className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" /><span>{item}</span></div>
                        ))}
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

      {/* Footer */}
      <div className="bg-zinc-950 border-t border-zinc-800 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">&copy; {new Date().getFullYear()} Qbody by Khavanskaia</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/privacy" className="text-zinc-500 hover:text-zinc-300 transition-colors">{ru ? 'Конфиденциальность' : 'Privacy Policy'}</Link>
            <Link href="/terms" className="text-zinc-500 hover:text-zinc-300 transition-colors">{ru ? 'Условия' : 'Terms of Service'}</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
