'use client'
import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, Users, Dumbbell, BookOpen,
  MessageSquare, CreditCard, Settings, Menu, X, Bell, 
  Search, ChevronDown, Video, ListVideo,
  Target, Layers, FileText,
  Moon, Sun, FormInput, BellRing, LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'

type NavItem = {
  name: string; href: string; icon: any
  children?: { name: string; href: string; icon: any }[]
}

function SidebarNavItem({ item, isActive, isSidebarOpen, pathname, onNavigate }: { item: NavItem; isActive: boolean; isSidebarOpen: boolean; pathname: string; onNavigate?: () => void }) {
  const hasChildren = item.children && item.children.length > 0
  const isChildActive = hasChildren && item.children!.some(child => pathname === child.href || pathname.startsWith(child.href + '/'))
  const [isExpanded, setIsExpanded] = useState(isChildActive)
  const Icon = item.icon

  if (hasChildren) {
    return (
      <div>
        <button onClick={() => setIsExpanded(!isExpanded)}
          className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200', isChildActive ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800')}>
          <Icon className="w-5 h-5 flex-shrink-0" />
          {isSidebarOpen && (<><span className="font-medium flex-1 text-left">{item.name}</span><ChevronDown className={cn('w-4 h-4 transition-transform duration-200', isExpanded ? 'rotate-0' : '-rotate-90')} /></>)}
        </button>
        {isSidebarOpen && isExpanded && (
          <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-zinc-200 dark:border-zinc-700 pl-3">
            {item.children!.map((child) => {
              const ChildIcon = child.icon
              const childActive = pathname === child.href || pathname.startsWith(child.href + '/')
              return (
                <Link key={child.href + child.name} href={child.href} onClick={onNavigate}
                  className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200', childActive ? 'bg-teal-500 text-white shadow-md shadow-teal-500/25' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200')}>
                  <ChildIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium flex-1">{child.name}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link href={item.href} onClick={onNavigate}
      className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200', isActive ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800')}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      {isSidebarOpen && <span className="font-medium flex-1">{item.name}</span>}
    </Link>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t, locale } = useTranslation()
  const { profile, signOut, loading, isClient } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)

  // Redirect clients away from admin dashboard
  useEffect(() => {
    if (!loading && isClient) {
      router.replace('/client/home')
    }
  }, [loading, isClient, router])

  const ru = locale === 'ru'

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.slice(0, 2).toUpperCase() || 'U'

  useEffect(() => {
    const saved = localStorage.getItem('qbody-dark-mode')
    if (saved === 'true') setIsDark(true)
  }, [])

  useEffect(() => {
    const html = document.documentElement
    if (isDark) { html.classList.add('dark') } else { html.classList.remove('dark') }
    localStorage.setItem('qbody-dark-mode', String(isDark))
  }, [isDark])

  const navigation: NavItem[] = [
    { name: t('sidebar.overview'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('clients.title'), href: '/dashboard/clients', icon: Users },
    { 
      name: t('sidebar.coursesSection'), href: '#courses', icon: Video,
      children: [
        { name: ru ? 'Все курсы' : 'All Courses', href: '/dashboard/courses', icon: ListVideo },
      ]
    },
    { 
      name: t('sidebar.programsSection'), href: '#programs', icon: Target,
      children: [
        { name: t('sidebar.programsList'), href: '/dashboard/programs', icon: Layers },
        { name: t('sidebar.exercises'), href: '/dashboard/exercises', icon: Dumbbell },
      ]
    },
    { name: t('messages.title'), href: '/dashboard/messages', icon: MessageSquare },
    { name: t('payments.title'), href: '/dashboard/payments', icon: CreditCard },
    { name: ru ? 'Редактор страницы' : 'Page Editor', href: '/dashboard/page-editor', icon: FileText },
    { name: ru ? 'Конструктор форм' : 'Form Builder', href: '/dashboard/form-builder', icon: FormInput },
    { name: ru ? 'Уведомления' : 'Notifications', href: '/dashboard/notifications', icon: BellRing },
    { name: t('common.settings'), href: '/dashboard/settings', icon: Settings },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  const renderSidebar = (mobile: boolean) => (
    <>
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-700">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center"><span className="text-white font-bold text-lg">Q</span></div>
          {(mobile || isSidebarOpen) && <div><span className="font-semibold text-zinc-900 dark:text-zinc-100">Qbody</span><span className="text-teal-500 text-xs block -mt-0.5">Admin</span></div>}
        </Link>
        {mobile ? (
          <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"><X className="w-5 h-5" /></button>
        ) : (
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500"><Menu className="w-5 h-5" /></button>
        )}
      </div>
      <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-64px-100px)] custom-scrollbar">
        {navigation.map((item) => {
          const isActive = !item.children && (pathname === item.href)
          return <SidebarNavItem key={item.name} item={item} isActive={isActive} isSidebarOpen={mobile || isSidebarOpen} pathname={pathname} onNavigate={mobile ? () => setIsMobileSidebarOpen(false) : undefined} />
        })}
      </nav>
      {/* Profile + Sign Out */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <div className={cn('flex items-center gap-3 p-2 rounded-xl', !mobile && !isSidebarOpen && 'justify-center')}>
          <Avatar fallback={initials} size="sm" />
          {(mobile || isSidebarOpen) && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm truncate">{profile?.full_name || profile?.email || 'User'}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{profile?.role || 'user'}</p>
            </div>
          )}
          {(mobile || isSidebarOpen) && (
            <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 transition-colors" title={ru ? 'Выйти' : 'Sign Out'}>
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100">
      <aside className={cn('fixed left-0 top-0 bottom-0 z-40 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-700 transition-all duration-300 hidden lg:block', isSidebarOpen ? 'w-64' : 'w-20')}>
        {renderSidebar(false)}
      </aside>
      {isMobileSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />}
      <aside className={cn('fixed left-0 top-0 bottom-0 w-64 z-50 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-700 transition-transform duration-300 lg:hidden', isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        {renderSidebar(true)}
      </aside>
      <div className={cn('transition-all duration-300', isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20')}>
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-700">
          <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
            <button onClick={() => setIsMobileSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><Menu className="w-5 h-5" /></button>
            <div className="flex-1 max-w-md hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input type="text" placeholder={t('sidebar.search')} className="w-full h-10 pl-10 pr-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher variant="dropdown" />
              <Button variant="ghost" size="icon" onClick={() => setIsDark(!isDark)} title={isDark ? 'Light mode' : 'Dark mode'}>
                {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
              </Button>
              <div className="hidden sm:block h-8 w-px bg-zinc-200 dark:bg-zinc-700 mx-2" />
              <Link href="/" target="_blank"><Button variant="outline" size="sm" className="hidden sm:flex">{t('sidebar.viewSite')}</Button></Link>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
