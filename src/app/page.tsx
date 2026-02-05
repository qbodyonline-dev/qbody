'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { 
  Menu, X, Play, Star, Users, Award, CheckCircle2, ArrowRight, Sparkles, LayoutDashboard,
  Clock, Dumbbell, Target, Zap, Heart, Baby, BookOpen, Lock, Video,
  Quote, ChevronLeft, ChevronRight, TrendingDown, Instagram, Send, MessageCircle,
  Mail, Phone, User, Trophy, Loader2
} from 'lucide-react'

/* ═══════════ TYPES ═══════════ */
interface PageBlock {
  id: string
  type: string
  label: string
  labelRu: string
  visible: boolean
  contentEn: string
  contentRu: string
  style: Record<string, any>
}

/* ═══════════ HEADER ═══════════ */
function Header() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.programs'), href: '#programs' },
    { name: t('nav.courses'), href: '#courses' },
    { name: t('nav.about'), href: '#about' },
    { name: t('nav.results'), href: '#results' },
    { name: t('nav.contacts'), href: '#contacts' },
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800' : 'bg-transparent'
    }`}>
      <nav className="container-custom">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-semibold text-lg">Qbody</span>
              <span className="text-teal-400 text-sm block -mt-1">by Khavanskaia</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href} className="text-zinc-300 hover:text-white transition-colors text-sm font-medium">
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher variant="dropdown" className="hidden sm:block" />
            {!authLoading && user ? (
              <Link href="/dashboard" className="hidden sm:block">
                <Button variant="gradient">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  {t('nav.dashboard') || 'Dashboard'}
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="hidden sm:block">
                  <Button variant="ghost" className="text-zinc-300 hover:text-white">
                    <User className="w-4 h-4 mr-2" />
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link href="#programs" className="hidden sm:block">
                  <Button variant="gradient">{t('nav.getStarted')}</Button>
                </Link>
              </>
            )}
            <button className="lg:hidden text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-zinc-800">
            <div className="flex flex-col gap-2">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                  className="text-zinc-300 hover:text-white hover:bg-zinc-800 px-4 py-3 rounded-xl">
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

/* ═══════════ DYNAMIC SECTION RENDERER ═══════════ */
function DynamicSection({ block, lang }: { block: PageBlock; lang: 'en' | 'ru' }) {
  const content = lang === 'ru' ? block.contentRu : block.contentEn
  const label = lang === 'ru' ? block.labelRu : block.label
  const style = block.style || {}

  // Parse custom styles
  const sectionStyle: React.CSSProperties = {
    backgroundColor: style.backgroundColor || undefined,
    backgroundImage: style.backgroundImage ? `url(${style.backgroundImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    paddingTop: style.paddingTop || undefined,
    paddingBottom: style.paddingBottom || undefined,
  }

  // Get section ID from block id (e.g., "hero" -> id="hero")
  const sectionId = block.id

  // Determine section classes based on type
  const getSectionClasses = () => {
    switch (block.type) {
      case 'hero':
        return 'relative min-h-screen flex items-center hero-gradient overflow-hidden'
      case 'header':
        return '' // Header is separate
      case 'footer':
        return 'bg-zinc-900 text-zinc-300'
      default:
        return 'section-padding'
    }
  }

  // Render content based on block type
  const renderContent = () => {
    switch (block.type) {
      case 'header':
        return null // Header is handled separately

      case 'hero':
        return <HeroContent content={content} lang={lang} />

      case 'programs':
        return <ProgramsContent content={content} lang={lang} />

      case 'courses':
        return <CoursesContent content={content} lang={lang} />

      case 'about':
        return <AboutContent content={content} lang={lang} />

      case 'results':
        return <ResultsContent content={content} lang={lang} />

      case 'footer':
        return <FooterContent content={content} lang={lang} />

      default:
        // Custom HTML block
        return (
          <div className="container-custom">
            <div 
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        )
    }
  }

  if (!block.visible) return null
  if (block.type === 'header') return null // Header rendered separately

  return (
    <section id={sectionId} className={getSectionClasses()} style={sectionStyle}>
      {renderContent()}
    </section>
  )
}

/* ═══════════ HERO CONTENT ═══════════ */
function HeroContent({ content, lang }: { content: string; lang: 'en' | 'ru' }) {
  const { t } = useTranslation()
  
  return (
    <>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container-custom relative z-10 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <Badge className="mb-6 bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              {lang === 'ru' ? 'Профессиональный фитнес' : 'Professional Fitness'}
            </Badge>

            {content ? (
              <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
            ) : (
              <>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                  {t('landing.hero.title')}{' '}
                  <span className="gradient-text">{t('landing.hero.titleHighlight')}</span>
                </h1>
                <p className="text-lg sm:text-xl text-zinc-300 mb-8 max-w-xl">
                  {t('landing.hero.subtitle')}
                </p>
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-8">
              <Link href="#programs">
                <Button size="lg" variant="gradient" className="w-full sm:w-auto group">
                  {lang === 'ru' ? 'Начать сейчас' : 'Get Started'}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#about">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-zinc-600 text-white hover:bg-zinc-800">
                  <Play className="w-4 h-4 mr-2" />
                  {lang === 'ru' ? 'Узнать больше' : 'Learn More'}
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-8 mt-12 justify-center lg:justify-start">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 border-2 border-zinc-900 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">{String.fromCharCode(64 + i)}</span>
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="text-white font-semibold">1000+</div>
                  <div className="text-zinc-400 text-xs">{lang === 'ru' ? 'клиентов' : 'clients'}</div>
                </div>
              </div>
              <div className="h-12 w-px bg-zinc-700" />
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <div className="text-left">
                  <div className="text-white font-semibold">4.9</div>
                  <div className="text-zinc-400 text-xs">{lang === 'ru' ? 'рейтинг' : 'rating'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="relative aspect-[3/4] max-w-md mx-auto">
              <div className="absolute -top-4 -right-4 w-full h-full rounded-3xl border-2 border-teal-500/20" />
              <div className="absolute -bottom-4 -left-4 w-full h-full rounded-3xl border-2 border-teal-400/10" />
              <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl shadow-teal-500/20">
                <img 
                  src="/images/hero-alexandra.jpg" 
                  alt="Aleksandra Khavanskaia"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                    <p className="text-white font-bold text-lg">Aleksandra Khavanskaia</p>
                    <p className="text-teal-300 text-sm">NASM CPT • CES • PBC • CAPT</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ═══════════ PROGRAMS CONTENT ═══════════ */
function ProgramsContent({ content, lang }: { content: string; lang: 'en' | 'ru' }) {
  const programs = [
    { id: 'weightLoss', slug: 'weight-loss', icon: Target, color: 'from-pink-500 to-rose-600', price: 49, popular: true },
    { id: 'muscleGain', slug: 'muscle-gain', icon: Dumbbell, color: 'from-blue-500 to-indigo-600', price: 49 },
    { id: 'beginner', slug: 'beginner', icon: Star, color: 'from-green-500 to-emerald-600', price: 39 },
    { id: 'endurance', slug: 'endurance', icon: Zap, color: 'from-orange-500 to-amber-600', price: 49 },
    { id: 'homeFitness', slug: 'home-fitness', icon: Clock, color: 'from-teal-500 to-teal-600', price: 39 },
  ]

  const titles: Record<string, { en: string; ru: string; desc_en: string; desc_ru: string }> = {
    weightLoss: { en: '8 weeks: Lose Weight', ru: '8 нед: Похудение', desc_en: 'Comprehensive weight loss program', desc_ru: 'Комплексная программа похудения' },
    muscleGain: { en: '8 weeks: Build Muscle', ru: '8 нед: Набор массы', desc_en: 'Build lean muscle mass', desc_ru: 'Набор мышечной массы' },
    beginner: { en: '8 weeks: Beginner', ru: '8 нед: Новичок', desc_en: 'Perfect start for beginners', desc_ru: 'Идеальный старт для новичков' },
    endurance: { en: '8 weeks: Endurance', ru: '8 нед: Выносливость', desc_en: 'Improve your stamina', desc_ru: 'Улучшение выносливости' },
    homeFitness: { en: '8 weeks: Home', ru: '8 нед: Дома', desc_en: 'Train at home effectively', desc_ru: 'Эффективные тренировки дома' },
  }

  return (
    <div className="container-custom bg-zinc-50 py-20">
      <div className="text-center mb-16">
        <Badge className="mb-4"><Video className="w-3 h-3 mr-1" />{lang === 'ru' ? 'Программы' : 'Programs'}</Badge>
        {content ? (
          <div className="prose max-w-none mx-auto" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 mb-4">
              {lang === 'ru' ? 'Выберите свою программу' : 'Choose Your Program'}
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              {lang === 'ru' ? 'Профессиональные программы для любого уровня подготовки' : 'Professional programs for any fitness level'}
            </p>
          </>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {programs.map((program) => {
          const Icon = program.icon
          const t = titles[program.id]
          return (
            <Card key={program.id} className={`relative overflow-hidden card-hover ${program.popular ? 'ring-2 ring-teal-500 ring-offset-2' : ''}`}>
              {program.popular && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-teal-500 text-white">{lang === 'ru' ? 'Хит' : 'Popular'}</Badge>
                </div>
              )}
              <div className="p-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${program.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">{lang === 'ru' ? t.ru : t.en}</h3>
                <p className="text-zinc-600 text-sm mb-4">{lang === 'ru' ? t.desc_ru : t.desc_en}</p>
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1 text-zinc-500"><Clock className="w-4 h-4" />8 {lang === 'ru' ? 'недель' : 'weeks'}</div>
                  <div className="flex items-center gap-1 text-zinc-500"><CheckCircle2 className="w-4 h-4" />24 {lang === 'ru' ? 'тренировки' : 'workouts'}</div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                  <div>
                    <span className="text-2xl font-bold text-zinc-900">${program.price}</span>
                    <span className="text-zinc-500 text-sm ml-1">{lang === 'ru' ? 'разово' : 'one-time'}</span>
                  </div>
                  <Link href={`/programs/${program.slug}`}>
                    <Button variant={program.popular ? 'gradient' : 'outline'} size="sm">{lang === 'ru' ? 'Подробнее' : 'Learn more'}</Button>
                  </Link>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════ COURSES CONTENT ═══════════ */
function CoursesContent({ content, lang }: { content: string; lang: 'en' | 'ru' }) {
  const courses = [
    { 
      id: 'breast', slug: 'breast-augmentation-recovery', icon: Heart, 
      color: 'from-pink-500 to-rose-500', price: 99, originalPrice: 149,
      title_en: 'Post-Mammoplasty Recovery', title_ru: 'После маммопластики',
      desc_en: 'Safe recovery and return to active lifestyle', desc_ru: 'Безопасное восстановление после операции'
    },
    { 
      id: 'cesarean', slug: 'cesarean-recovery', icon: Baby, 
      color: 'from-purple-500 to-violet-500', price: 99, originalPrice: 149,
      title_en: 'Post C-Section Recovery', title_ru: 'После кесарева',
      desc_en: 'Recovery program for new moms', desc_ru: 'Восстановление для молодых мам'
    },
  ]

  return (
    <div className="container-custom bg-white py-20">
      <div className="text-center mb-16">
        <Badge variant="outline" className="mb-4"><BookOpen className="w-3 h-3 mr-1" />{lang === 'ru' ? 'Курсы' : 'Courses'}</Badge>
        {content ? (
          <div className="prose max-w-none mx-auto" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 mb-4">
              {lang === 'ru' ? 'Специализированные курсы' : 'Specialized Courses'}
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              {lang === 'ru' ? 'Восстановление после операций с медицинским подходом' : 'Post-surgery recovery with medical approach'}
            </p>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {courses.map((course) => {
          const Icon = course.icon
          return (
            <Card key={course.id} className="overflow-hidden card-hover group">
              <div className={`relative h-64 bg-gradient-to-br ${course.color}`}>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-2">{lang === 'ru' ? course.title_ru : course.title_en}</h4>
                  <p className="text-white/90 text-sm">{lang === 'ru' ? course.desc_ru : course.desc_en}</p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-zinc-900">${course.price}</span>
                    <span className="text-lg text-zinc-400 line-through">${course.originalPrice}</span>
                  </div>
                  <Link href={`/courses/${course.slug}`}>
                    <Button variant="gradient">
                      {lang === 'ru' ? 'Купить' : 'Buy Now'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════ ABOUT CONTENT ═══════════ */
function AboutContent({ content, lang }: { content: string; lang: 'en' | 'ru' }) {
  const stats = [
    { icon: Clock, value: '17+', label: lang === 'ru' ? 'лет опыта' : 'years exp' },
    { icon: Users, value: '1000+', label: lang === 'ru' ? 'клиентов' : 'clients' },
    { icon: Award, value: '12', label: lang === 'ru' ? 'сертификатов' : 'certificates' },
    { icon: Heart, value: '100%', label: lang === 'ru' ? 'отдача' : 'dedication' },
  ]

  return (
    <div className="container-custom bg-zinc-50 py-20">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="relative">
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
            <img 
              src="/images/hero-alexandra.jpg" 
              alt="Aleksandra Khavanskaia"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="absolute -bottom-6 -right-6 left-6 grid grid-cols-4 gap-2">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="bg-white rounded-2xl p-3 text-center shadow-lg">
                  <Icon className="w-5 h-5 text-teal-500 mx-auto mb-1" />
                  <div className="text-xl font-bold text-zinc-900">{stat.value}</div>
                  <div className="text-xs text-zinc-500">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <Badge className="mb-4">{lang === 'ru' ? 'Обо мне' : 'About Me'}</Badge>
          {content ? (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-3">
                {lang === 'ru' ? 'Александра Хаванская' : 'Aleksandra Khavanskaia'}
              </h2>
              <p className="text-xl text-teal-600 font-medium mb-6">
                {lang === 'ru' ? 'NASM сертифицированный тренер' : 'NASM Certified Personal Trainer'}
              </p>
              <p className="text-zinc-600 mb-8">
                {lang === 'ru' 
                  ? '17+ лет опыта в фитнес-индустрии. Помогаю женщинам достигать их целей безопасно и эффективно.'
                  : '17+ years in fitness industry. Helping women achieve their goals safely and effectively.'
                }
              </p>
            </>
          )}
          <Button variant="gradient" size="lg">
            {lang === 'ru' ? 'Начать тренировки' : 'Start Training'}
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════ RESULTS CONTENT ═══════════ */
function ResultsContent({ content, lang }: { content: string; lang: 'en' | 'ru' }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const results = [
    { name: 'Elena', age: 34, start: 78, end: 62, duration: '4 months', quote_en: 'I finally feel like myself!', quote_ru: 'Я наконец чувствую себя собой!' },
    { name: 'Maria', age: 29, start: 72, end: 58, duration: '6 months', quote_en: 'This course helped me recover safely!', quote_ru: 'Этот курс помог мне безопасно восстановиться!' },
    { name: 'Anna', age: 41, start: 85, end: 67, duration: '5 months', quote_en: 'At 40, I\'m in the best shape!', quote_ru: 'В 40 я в лучшей форме!' },
  ]

  const current = results[currentIndex]

  return (
    <div className="container-custom bg-white py-20">
      <div className="text-center mb-16">
        <Badge className="mb-4">{lang === 'ru' ? 'Результаты' : 'Results'}</Badge>
        {content ? (
          <div className="prose max-w-none mx-auto" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 mb-4">
              {lang === 'ru' ? 'Реальные результаты' : 'Real Results'}
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              {lang === 'ru' ? 'Истории успеха наших клиентов' : 'Success stories from our clients'}
            </p>
          </>
        )}
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="relative bg-gradient-to-br from-teal-500/20 to-teal-600/10 min-h-[300px] flex items-center justify-center">
              <div className="text-center p-8">
                <div className="flex gap-4 justify-center mb-4">
                  <div className="w-24 h-32 rounded-xl bg-zinc-300 flex items-center justify-center">
                    <span className="text-xs text-zinc-500">{lang === 'ru' ? 'До' : 'Before'}</span>
                  </div>
                  <div className="w-24 h-32 rounded-xl bg-teal-500/30 flex items-center justify-center">
                    <span className="text-xs text-teal-600">{lang === 'ru' ? 'После' : 'After'}</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-4 left-4">
                <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                  <TrendingDown className="w-5 h-5 mr-2" />-{current.start - current.end} kg
                </Badge>
              </div>
            </div>
            <div className="p-8 flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-zinc-900 mb-2">{current.name}, {current.age}</h3>
              <div className="flex gap-8 mb-6">
                <div>
                  <div className="text-sm text-zinc-500">{lang === 'ru' ? 'Было' : 'Was'}</div>
                  <div className="text-xl font-semibold text-zinc-400 line-through">{current.start} kg</div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500">{lang === 'ru' ? 'Стало' : 'Now'}</div>
                  <div className="text-xl font-semibold text-teal-500">{current.end} kg</div>
                </div>
              </div>
              <div className="relative mb-6">
                <Quote className="absolute -top-2 -left-2 w-8 h-8 text-teal-500/20" />
                <p className="text-zinc-600 italic pl-6">"{lang === 'ru' ? current.quote_ru : current.quote_en}"</p>
              </div>
              <div className="flex">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between mt-8">
          <div className="flex gap-2">
            {results.map((_, i) => (
              <button key={i} onClick={() => setCurrentIndex(i)} className={`w-3 h-3 rounded-full transition-all ${i === currentIndex ? 'bg-teal-500 w-8' : 'bg-zinc-300'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentIndex((currentIndex - 1 + results.length) % results.length)} className="rounded-full"><ChevronLeft className="w-5 h-5" /></Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentIndex((currentIndex + 1) % results.length)} className="rounded-full"><ChevronRight className="w-5 h-5" /></Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════ FOOTER CONTENT ═══════════ */
function FooterContent({ content, lang }: { content: string; lang: 'en' | 'ru' }) {
  return (
    <>
      <div className="border-b border-zinc-800">
        <div className="container-custom py-16">
          <div className="max-w-3xl mx-auto text-center">
            {content ? (
              <div className="prose prose-invert max-w-none mx-auto" dangerouslySetInnerHTML={{ __html: content }} />
            ) : (
              <>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  {lang === 'ru' ? 'Готовы начать?' : 'Ready to Start?'}
                </h2>
                <p className="text-lg text-zinc-400 mb-8">
                  {lang === 'ru' ? 'Свяжитесь со мной прямо сейчас' : 'Contact me right now'}
                </p>
              </>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://t.me/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0088cc] text-white rounded-xl font-semibold hover:bg-[#0088cc]/90 transition-colors">
                <Send className="w-5 h-5" />Telegram
              </a>
              <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-xl font-semibold hover:bg-[#25D366]/90 transition-colors">
                <MessageCircle className="w-5 h-5" />WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <div>
                <span className="text-white font-semibold text-lg">Qbody</span>
                <span className="text-teal-400 text-sm block -mt-1">by Khavanskaia</span>
              </div>
            </Link>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-teal-500 hover:text-white transition-all"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-teal-500 hover:text-white transition-all"><Send className="w-5 h-5" /></a>
              <a href="#" className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-teal-500 hover:text-white transition-all"><MessageCircle className="w-5 h-5" /></a>
            </div>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{lang === 'ru' ? 'Программы' : 'Programs'}</h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="#programs" className="hover:text-teal-400">8 weeks: Lose Weight</Link></li>
              <li><Link href="#programs" className="hover:text-teal-400">8 weeks: Build Muscle</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{lang === 'ru' ? 'Курсы' : 'Courses'}</h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="/courses/breast-augmentation-recovery" className="hover:text-teal-400">Post-Mammoplasty</Link></li>
              <li><Link href="/courses/cesarean-recovery" className="hover:text-teal-400">C-Section Recovery</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{lang === 'ru' ? 'Контакты' : 'Contacts'}</h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><a href="mailto:info@qbody.app" className="flex items-center gap-2 hover:text-teal-400"><Mail className="w-4 h-4" />info@qbody.app</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800">
        <div className="container-custom py-6">
          <p className="text-sm text-zinc-500 text-center">© {new Date().getFullYear()} Qbody by Khavanskaia. All rights reserved.</p>
        </div>
      </div>
    </>
  )
}

/* ═══════════ DEFAULT BLOCKS (fallback) ═══════════ */
const defaultBlocks: PageBlock[] = [
  { id: 'header', type: 'header', label: 'Header', labelRu: 'Шапка', visible: true, contentEn: '', contentRu: '', style: {} },
  { id: 'hero', type: 'hero', label: 'Hero', labelRu: 'Главный баннер', visible: true, contentEn: '', contentRu: '', style: {} },
  { id: 'programs', type: 'programs', label: 'Programs', labelRu: 'Программы', visible: true, contentEn: '', contentRu: '', style: {} },
  { id: 'courses', type: 'courses', label: 'Courses', labelRu: 'Курсы', visible: true, contentEn: '', contentRu: '', style: {} },
  { id: 'about', type: 'about', label: 'About', labelRu: 'Обо мне', visible: true, contentEn: '', contentRu: '', style: {} },
  { id: 'results', type: 'results', label: 'Results', labelRu: 'Результаты', visible: true, contentEn: '', contentRu: '', style: {} },
  { id: 'footer', type: 'footer', label: 'Footer', labelRu: 'Подвал', visible: true, contentEn: '', contentRu: '', style: {} },
]

/* ═══════════ MAIN PAGE ═══════════ */
export default function HomePage() {
  const { locale } = useTranslation()
  const lang = (locale || 'ru') as 'en' | 'ru'
  const [blocks, setBlocks] = useState<PageBlock[]>(defaultBlocks)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBlocks = async () => {
      try {
        const res = await fetch('/api/page-blocks?page=home')
        if (res.ok) {
          const data = await res.json()
          if (data.blocks && data.blocks.length > 0) {
            setBlocks(data.blocks)
          }
        }
      } catch (err) {
        console.error('Failed to load page blocks:', err)
      } finally {
        setLoading(false)
      }
    }
    loadBlocks()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <Loader2 className="w-12 h-12 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {blocks.filter(b => b.visible).map((block) => (
          <DynamicSection key={block.id} block={block} lang={lang} />
        ))}
      </main>
    </>
  )
}
