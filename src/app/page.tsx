'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { 
  Menu, X, Play, Star, Users, Award, CheckCircle2, ArrowRight, Sparkles,
  Clock, Dumbbell, Target, Zap, Heart, Baby, BookOpen, Lock, Video,
  Quote, ChevronLeft, ChevronRight, TrendingDown, Instagram, Send, MessageCircle,
  Mail, Phone, User, Trophy
} from 'lucide-react'

// Header Component
function Header() {
  const { t } = useTranslation()
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
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
    <header role="banner" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800' : 'bg-transparent'
    }`}>
      <nav aria-label="Main navigation" className="container-custom">
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
            <Link href="/auth/login" className="hidden sm:block">
              <Button variant="ghost" className="text-zinc-300 hover:text-white">
                <User className="w-4 h-4 mr-2" />
                {t('nav.login')}
              </Button>
            </Link>
            <Link href="#programs" className="hidden sm:block">
              <Button variant="gradient">{t('nav.getStarted')}</Button>
            </Link>
            <button className="lg:hidden text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-zinc-800 animate-in slide-in-from-top">
            <div className="flex flex-col gap-2">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                  className="text-zinc-300 hover:text-white hover:bg-zinc-800 px-4 py-3 rounded-xl">
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-zinc-800 mt-2">
                <LanguageSwitcher className="mb-4 mx-4" />
                <Link href="/auth/login"><Button variant="ghost" className="w-full justify-start text-zinc-300"><User className="w-4 h-4 mr-2" />{t('nav.login')}</Button></Link>
                <Link href="#programs"><Button variant="gradient" className="w-full mt-2">{t('nav.getStarted')}</Button></Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

// Hero Section
function HeroSection() {
  const { t } = useTranslation()
  const features = t('landing.hero.features') as unknown as string[]
  
  return (
    <section className="relative min-h-screen flex items-center hero-gradient overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container-custom relative z-10 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Text */}
          <div className="text-center lg:text-left">
          <Badge className="mb-6 bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <Sparkles className="w-3 h-3 mr-1" />
            {t('landing.hero.badge')}
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            {t('landing.hero.title')}{' '}
            <span className="gradient-text">{t('landing.hero.titleHighlight')}</span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-300 mb-8 max-w-xl">
            {t('landing.hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center lg:justify-start">
            {Array.isArray(features) && features.map((feature: string) => (
              <div key={feature} className="flex items-center gap-2 text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-teal-400" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link href="#programs">
              <Button size="lg" variant="gradient" className="w-full sm:w-auto group">
                {t('landing.hero.cta')}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#about">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-zinc-600 text-white hover:bg-zinc-800">
                <Play className="w-4 h-4 mr-2" />
                {t('landing.hero.learnMore')}
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
                <div className="text-zinc-400 text-xs">{t('landing.hero.clients')}</div>
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
                <div className="text-zinc-400 text-xs">{t('landing.hero.rating')}</div>
              </div>
            </div>
          </div>
          </div>

          {/* Right — Hero Photo */}
          <div className="hidden lg:block relative">
            <div className="relative aspect-[3/4] max-w-md mx-auto">
              {/* Decorative borders */}
              <div className="absolute -top-4 -right-4 w-full h-full rounded-3xl border-2 border-teal-500/20" />
              <div className="absolute -bottom-4 -left-4 w-full h-full rounded-3xl border-2 border-teal-400/10" />
              {/* Photo */}
              <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl shadow-teal-500/20">
                <img 
                  src="/images/hero-alexandra.jpg" 
                  alt="Aleksandra Khavanskaia — NASM Certified Personal Trainer, fitness coach with 17 years of experience helping women achieve their body goals"
                  width={800}
                  height={1000}
                  loading="eager"
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
    </section>
  )
}

// Programs Section
function ProgramsSection() {
  const { t } = useTranslation()
  
  const programs = [
    { id: 'weightLoss', slug: 'weight-loss', icon: Target, color: 'from-pink-500 to-rose-600', price: 49, popular: true, level: 'any' },
    { id: 'muscleGain', slug: 'muscle-gain', icon: Dumbbell, color: 'from-blue-500 to-indigo-600', price: 49, popular: false, level: 'intermediate' },
    { id: 'beginner', slug: 'beginner', icon: Star, color: 'from-green-500 to-emerald-600', price: 39, popular: false, level: 'beginner' },
    { id: 'endurance', slug: 'endurance', icon: Zap, color: 'from-orange-500 to-amber-600', price: 49, popular: false, level: 'intermediate' },
    { id: 'homeFitness', slug: 'home-fitness', icon: Clock, color: 'from-teal-500 to-teal-600', price: 39, popular: false, level: 'any' },
  ]

  return (
    <section id="programs" className="section-padding bg-zinc-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <Badge className="mb-4"><Video className="w-3 h-3 mr-1" />{t('landing.programs.badge')}</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 mb-4">{t('landing.programs.title')}</h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">{t('landing.programs.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {programs.map((program) => {
            const Icon = program.icon
            const programData = t(`landing.programs.programs.${program.id}`) as any
            const features = programData?.features || []
            const levelKey = program.level as 'any' | 'beginner' | 'intermediate'
            
            return (
              <Card key={program.id} className={`relative overflow-hidden card-hover ${program.popular ? 'ring-2 ring-teal-500 ring-offset-2' : ''}`}>
                {program.popular && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-teal-500 text-white">{t('landing.programs.popular')}</Badge>
                  </div>
                )}
                <div className="p-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${program.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">{programData?.title}</h3>
                  <p className="text-zinc-600 text-sm mb-4">{programData?.description}</p>
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1 text-zinc-500"><Clock className="w-4 h-4" />8 {t('landing.programs.duration')}</div>
                    <div className="flex items-center gap-1 text-zinc-500"><Target className="w-4 h-4" />{t(`landing.programs.levels.${levelKey}`)}</div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {Array.isArray(features) && features.map((feature: string) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-zinc-600">
                        <CheckCircle2 className="w-4 h-4 text-teal-500" />{feature}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                    <div>
                      <span className="text-2xl font-bold text-zinc-900">${program.price}</span>
                      <span className="text-zinc-500 text-sm ml-1">{t('landing.programs.price')}</span>
                    </div>
                    <Link href={`/programs/${program.slug}`}>
                      <Button variant={program.popular ? 'gradient' : 'outline'} size="sm">{t('landing.programs.learnMore')}</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Courses Section
function CoursesSection() {
  const { t, locale } = useTranslation()
  
  const courses = [
    { 
      id: 'breastRecovery', 
      slug: 'breast-augmentation-recovery', 
      icon: Heart, 
      color: 'from-pink-500 to-rose-500', 
      price: 99, 
      originalPrice: 149, 
      weeks: 6, 
      lessons: 18,
      shortTitle: locale === 'ru' ? 'После маммопластики' : 'Post-Mammoplasty',
      shortDesc: locale === 'ru' ? 'Безопасное восстановление и возврат к активной жизни' : 'Safe recovery and return to active lifestyle'
    },
    { 
      id: 'cesareanRecovery', 
      slug: 'cesarean-recovery', 
      icon: Baby, 
      color: 'from-purple-500 to-violet-500', 
      price: 99, 
      originalPrice: 149, 
      weeks: 8, 
      lessons: 24,
      shortTitle: locale === 'ru' ? 'После кесарева' : 'Post C-Section',
      shortDesc: locale === 'ru' ? 'Восстановление для молодых мам после операции' : 'Recovery program for new moms after surgery'
    },
  ]

  return (
    <section id="courses" className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4"><Video className="w-3 h-3 mr-1" />{t('landing.courses.badge')}</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 mb-4">{t('landing.courses.title')}</h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">{t('landing.courses.subtitle')}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {courses.map((course) => {
            const Icon = course.icon
            const courseData = t(`landing.courses.items.${course.id}`) as any
            const features = courseData?.features || []
            
            return (
              <Card key={course.id} className="overflow-hidden card-hover group">
                <div className={`relative h-64 bg-gradient-to-br ${course.color} overflow-hidden`}>
                  {/* Title and description overlay on image */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg">{course.shortTitle}</h4>
                    <p className="text-white/90 text-sm sm:text-base max-w-xs drop-shadow">{course.shortDesc}</p>
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-8 h-8 text-zinc-900 ml-1" />
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-white/90 text-zinc-900"><Clock className="w-3 h-3 mr-1" />{course.weeks} {t('landing.courses.duration')}</Badge>
                    <Badge className="bg-white/90 text-zinc-900"><BookOpen className="w-3 h-3 mr-1" />{course.lessons} {t('landing.courses.lessons')}</Badge>
                  </div>
                </div>
                <div className="p-6 lg:p-8">
                  <h3 className="text-2xl font-bold text-zinc-900 mb-3">{courseData?.title}</h3>
                  <p className="text-zinc-600 mb-6">{courseData?.description}</p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {Array.isArray(features) && features.map((feature: string) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-zinc-600">
                        <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" /><span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-zinc-200">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-zinc-900">${course.price}</span>
                      <span className="text-lg text-zinc-400 line-through">${course.originalPrice}</span>
                    </div>
                    <Link href={`/courses/${course.slug}`}>
                      <Button variant="gradient" className="group/btn">
                        {t('landing.courses.buyNow')}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="mt-16 p-6 lg:p-8 rounded-3xl bg-gradient-to-r from-teal-500/10 to-teal-600/5 border border-teal-500/20">
          <div className="flex flex-col lg:flex-row items-center gap-6 text-center lg:text-left">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
              <Lock className="w-8 h-8 text-teal-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-zinc-900 mb-2">{t('landing.courses.accessInfo.title')}</h3>
              <p className="text-zinc-600">{t('landing.courses.accessInfo.description')}</p>
            </div>
            <Link href="/auth/login"><Button variant="outline" className="flex-shrink-0">{t('landing.courses.accessInfo.loginButton')}</Button></Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// About Section
function AboutSection() {
  const { t } = useTranslation()
  const block1 = t('landing.about.block1items') as string[]
  const block2 = t('landing.about.block2items') as string[]
  const block3 = t('landing.about.block3items') as string[]

  const stats = [
    { icon: Clock, value: '17+', label: t('landing.about.stats.experience') },
    { icon: Users, value: '1000+', label: t('landing.about.stats.clients') },
    { icon: Award, value: '12', label: t('landing.about.stats.certificates') },
    { icon: Heart, value: '100%', label: t('landing.about.stats.dedication') },
  ]

  return (
    <section id="about" className="section-padding bg-zinc-50">
      <div className="container-custom">
        {/* Top: Photo + Name + Stats */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-16">
          {/* Photo */}
          <div className="relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-200 shadow-2xl">
              <img 
                src="/images/hero-alexandra.jpg" 
                alt="Personal trainer Aleksandra Khavanskaia demonstrating proper exercise form — certified NASM CPT trainer in Las Vegas"
                width={800}
                height={1000}
                loading="lazy"
                className="w-full h-full object-cover object-top"
              />
              {/* Gradient overlay bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            {/* Stats bar */}
            <div className="absolute -bottom-6 -right-6 left-6 grid grid-cols-4 gap-2">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="bg-white rounded-2xl p-3 text-center shadow-lg border border-zinc-200">
                    <Icon className="w-5 h-5 text-teal-500 mx-auto mb-1" />
                    <div className="text-xl font-bold text-zinc-900">{stat.value}</div>
                    <div className="text-xs text-zinc-500">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Name + subtitle + CTA */}
          <div className="lg:pl-8">
            <Badge className="mb-4">{t('landing.about.badge')}</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 mb-3">{t('landing.about.title')}</h2>
            <p className="text-xl text-teal-600 font-medium mb-8">{t('landing.about.subtitle')}</p>

            {/* Block 1 — Education & Certifications */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900">{t('landing.about.block1title')}</h3>
              </div>
              <ul className="space-y-2 ml-2">
                {Array.isArray(block1) && block1.map((item: string) => (
                  <li key={item} className="flex items-start gap-3 text-zinc-600 text-sm leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />{item}
                  </li>
                ))}
              </ul>
            </div>

            <Button variant="gradient" size="lg">{t('landing.about.cta')}</Button>
          </div>
        </div>

        {/* Bottom: Two blocks side by side */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Block 2 — Athletic Career */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">{t('landing.about.block2title')}</h3>
            </div>
            <ul className="space-y-3">
              {Array.isArray(block2) && block2.map((item: string) => (
                <li key={item} className="flex items-start gap-3 text-zinc-700">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Block 3 — Personal */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">{t('landing.about.block3title')}</h3>
            </div>
            <ul className="space-y-4">
              {Array.isArray(block3) && block3.map((item: string, i: number) => (
                <li key={item} className="flex items-start gap-4 text-zinc-700">
                  <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-rose-500 text-lg">{['💪', '👶', '🏥'][i]}</span>
                  </div>
                  <span className="text-lg leading-relaxed pt-1.5">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

// Results Section
function ResultsSection() {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = React.useState(0)
  
  const results = [
    { id: 1, name: 'Elena', age: 34, goal: 'weightLoss', startWeight: 78, currentWeight: 62, duration: '4 months', quote: 'I finally feel like myself! The program changed not only my body but my outlook on life.' },
    { id: 2, name: 'Maria', age: 29, goal: 'postpartum', startWeight: 72, currentWeight: 58, duration: '6 months', quote: 'After my C-section, I thought I\'d never get back in shape. This course helped me recover safely!' },
    { id: 3, name: 'Anna', age: 41, goal: 'weightLoss', startWeight: 85, currentWeight: 67, duration: '5 months', quote: 'At 40, I\'m in the best shape of my life. The personalized approach is what sets this program apart.' },
  ]

  const current = results[currentIndex]
  const goalKey = current.goal as 'weightLoss' | 'postpartum' | 'muscleGain'

  return (
    <section id="results" className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <Badge className="mb-4">{t('landing.results.badge')}</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 mb-4">{t('landing.results.title')}</h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">{t('landing.results.subtitle')}</p>
        </div>

        <div className="max-w-5xl mx-auto">
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="relative bg-gradient-to-br from-teal-500/20 to-teal-600/10 min-h-[400px]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="flex gap-4 justify-center mb-4">
                      <div className="w-24 h-32 rounded-xl bg-zinc-300 flex items-center justify-center"><span className="text-xs text-zinc-500">Before</span></div>
                      <div className="w-24 h-32 rounded-xl bg-teal-500/30 flex items-center justify-center"><span className="text-xs text-teal-600">After</span></div>
                    </div>
                    <p className="text-zinc-500 text-sm">{current.name}'s photos</p>
                  </div>
                </div>
                <div className="absolute top-4 left-4">
                  <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                    <TrendingDown className="w-5 h-5 mr-2" />-{current.startWeight - current.currentWeight} kg
                  </Badge>
                </div>
              </div>
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline"><Target className="w-3 h-3 mr-1" />{t(`landing.results.goals.${goalKey}`)}</Badge>
                  <Badge variant="secondary">{current.duration}</Badge>
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-2">{current.name}, {current.age}</h3>
                <div className="flex gap-8 mb-6">
                  <div><div className="text-sm text-zinc-500">{t('landing.results.was')}</div><div className="text-xl font-semibold text-zinc-400 line-through">{current.startWeight} kg</div></div>
                  <div><div className="text-sm text-zinc-500">{t('landing.results.now')}</div><div className="text-xl font-semibold text-teal-500">{current.currentWeight} kg</div></div>
                </div>
                <div className="relative mb-8">
                  <Quote className="absolute -top-2 -left-2 w-8 h-8 text-teal-500/20" />
                  <p className="text-zinc-600 italic pl-6">"{current.quote}"</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}</div>
                  <span className="text-zinc-500 text-sm">5.0</span>
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

        <div className="text-center mt-16">
          <Button variant="gradient" size="lg">{t('landing.results.cta')}</Button>
        </div>
      </div>
    </section>
  )
}

// Footer
function Footer() {
  const { t } = useTranslation()
  
  return (
    <footer id="contacts" className="bg-zinc-900 text-zinc-300">
      <div className="border-b border-zinc-800">
        <div className="container-custom py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t('landing.footer.cta.title')}</h2>
            <p className="text-lg text-zinc-400 mb-8">{t('landing.footer.cta.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://t.me/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0088cc] text-white rounded-xl font-semibold hover:bg-[#0088cc]/90 transition-colors">
                <Send className="w-5 h-5" />{t('landing.footer.cta.telegram')}
              </a>
              <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-xl font-semibold hover:bg-[#25D366]/90 transition-colors">
                <MessageCircle className="w-5 h-5" />{t('landing.footer.cta.whatsapp')}
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
            <p className="text-zinc-400 text-sm mb-6">{t('landing.footer.description')}</p>
            <div className="flex gap-3">
              <a href="#" aria-label="Follow Qbody on Instagram" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-teal-500 hover:text-white transition-all"><Instagram className="w-5 h-5" /></a>
              <a href="#" aria-label="Join Qbody Telegram channel" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-teal-500 hover:text-white transition-all"><Send className="w-5 h-5" /></a>
              <a href="#" aria-label="Contact Qbody on WhatsApp" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-teal-500 hover:text-white transition-all"><MessageCircle className="w-5 h-5" /></a>
            </div>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{t('landing.footer.sections.programs')}</h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="#programs" className="hover:text-teal-400 transition-colors">8 weeks: Lose Weight</Link></li>
              <li><Link href="#programs" className="hover:text-teal-400 transition-colors">8 weeks: Build Muscle</Link></li>
              <li><Link href="#programs" className="hover:text-teal-400 transition-colors">8 weeks: Beginner</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{t('landing.footer.sections.courses')}</h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="/courses/breast-augmentation-recovery" className="hover:text-teal-400 transition-colors">Breast Augmentation Recovery</Link></li>
              <li><Link href="/courses/cesarean-recovery" className="hover:text-teal-400 transition-colors">C-Section Recovery</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{t('landing.footer.sections.contacts')}</h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><a href="mailto:info@qbody.app" className="flex items-center gap-2 hover:text-teal-400 transition-colors"><Mail className="w-4 h-4" />info@qbody.app</a></li>
              <li><a href="tel:+1234567890" className="flex items-center gap-2 hover:text-teal-400 transition-colors"><Phone className="w-4 h-4" />+1 234 567 890</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-zinc-500">© {new Date().getFullYear()} Qbody by Khavanskaia. {t('landing.footer.copyright')}</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">{t('landing.footer.legal.privacy')}</Link>
              <Link href="/terms" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">{t('landing.footer.legal.terms')}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Main Page
export default function HomePage() {
  return (
    <>
      {/* Skip to main content — accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-teal-500 focus:text-white focus:rounded-lg">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="min-h-screen">
        <HeroSection />
        <ProgramsSection />
        <CoursesSection />
        <AboutSection />
        <ResultsSection />
      </main>
      <Footer />
    </>
  )
}
