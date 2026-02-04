'use client'
import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, Users, Dumbbell, BookOpen, Calendar, 
  MessageSquare, CreditCard, Settings, Menu, X, Bell, 
  Search, ChevronDown, Video, ListVideo, PlusCircle, TrendingUp,
  Target, Layers, ClipboardCheck, Check, CheckCheck, FileText,
  Moon, Sun, FormInput, BellRing, UserPlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'

type NavItem = {
  name: string; href: string; icon: any; badge?: number
  children?: { name: string; href: string; icon: any; badge?: number }[]
}

type Notification = {
  id: string; client: string; initials: string; type: string
  time: string; timeRu: string; read: boolean; href: string
}

const mockNotifications: Notification[] = [
  { id: '1', client: 'Olga V.', initials: 'OV', type: 'newCheckin', time: '30m ago', timeRu: '30м назад', read: false, href: '/dashboard/checkins/1' },
  { id: '2', client: 'Anna K.', initials: 'AK', type: 'newMessage', time: '1h ago', timeRu: '1ч назад', read: false, href: '/dashboard/messages' },
  { id: '3', client: 'Elena P.', initials: 'EP', type: 'subscriptionExpiring', time: '3 days', timeRu: '3 дня', read: false, href: '/dashboard/clients/3' },
  { id: '4', client: 'Maria S.', initials: 'MS', type: 'workoutCompleted', time: '2h ago', timeRu: '2ч назад', read: true, href: '/dashboard/clients/2' },
  { id: '5', client: 'Svetlana M.', initials: 'SM', type: 'paymentReceived', time: '5h ago', timeRu: '5ч назад', read: true, href: '/dashboard/payments' },
  { id: '6', client: 'Irina K.', initials: 'IK', type: 'missedCheckin', time: '1d ago', timeRu: '1д назад', read: true, href: '/dashboard/clients/1' },
]

function NotificationsDropdown({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, locale } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState(mockNotifications)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    if (isOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })))

  const notifColors: Record<string, string> = {
    newCheckin: 'bg-blue-100 text-blue-600',
    newMessage: 'bg-purple-100 text-purple-600',
    subscriptionExpiring: 'bg-orange-100 text-orange-600',
    workoutCompleted: 'bg-green-100 text-green-600',
    paymentReceived: 'bg-teal-100 text-teal-600',
    missedCheckin: 'bg-red-100 text-red-600',
  }

  const notifIcons: Record<string, any> = {
    newCheckin: ClipboardCheck,
    newMessage: MessageSquare,
    subscriptionExpiring: CreditCard,
    workoutCompleted: Dumbbell,
    paymentReceived: CreditCard,
    missedCheckin: ClipboardCheck,
  }

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-xl border border-zinc-200 z-50 overflow-hidden">
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-zinc-900">{t('notifications.title')}</h3>
          {unreadCount > 0 && <Badge className="bg-red-500 text-white">{unreadCount}</Badge>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
            <CheckCheck className="w-4 h-4" />{t('notifications.markAllRead')}
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">{t('notifications.noNew')}</div>
        ) : (
          notifications.map((notif) => {
            const Icon = notifIcons[notif.type]
            const color = notifColors[notif.type]
            return (
              <Link key={notif.id} href={notif.href} onClick={onClose}
                className={cn('flex items-start gap-3 p-4 hover:bg-zinc-50 transition-colors border-b border-zinc-50', !notif.read && 'bg-teal-50/30')}>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold text-zinc-900">{notif.client}</span>{' '}
                    <span className="text-zinc-600">{t(`notifications.types.${notif.type}`)}</span>
                    {notif.type === 'subscriptionExpiring' && <span className="text-zinc-600"> {locale === 'ru' ? notif.timeRu : notif.time}</span>}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">{locale === 'ru' ? notif.timeRu : notif.time}</p>
                </div>
                {!notif.read && <div className="w-2.5 h-2.5 rounded-full bg-teal-500 flex-shrink-0 mt-1.5" />}
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
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
                  {child.badge && <Badge variant={childActive ? 'secondary' : 'default'} className={cn('h-5 min-w-[20px] justify-center text-xs', childActive && 'bg-white/20 text-white')}>{child.badge}</Badge>}
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
      {isSidebarOpen && (<><span className="font-medium flex-1">{item.name}</span>{item.badge && <Badge variant={isActive ? 'secondary' : 'default'} className={cn('h-5 min-w-[20px] justify-center', isActive && 'bg-white/20 text-white')}>{item.badge}</Badge>}</>)}
    </Link>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t, locale } = useTranslation()
  const { profile, signOut, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.slice(0, 2).toUpperCase() || 'U'

  // Dark mode: sync with <html> class and localStorage
  useEffect(() => {
    const saved = localStorage.getItem('qbody-dark-mode')
    if (saved === 'true') setIsDark(true)
  }, [])

  useEffect(() => {
    const html = document.documentElement
    if (isDark) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
    localStorage.setItem('qbody-dark-mode', String(isDark))
  }, [isDark])

  const unreadNotifs = mockNotifications.filter(n => !n.read).length

  const navigation: NavItem[] = [
    { name: t('sidebar.overview'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('clients.title'), href: '/dashboard/clients', icon: Users, badge: 12 },
    { 
      name: t('sidebar.coursesSection'), href: '#courses', icon: Video,
      children: [
        { name: t('sidebar.coursesList'), href: '/dashboard/courses', icon: ListVideo },
        { name: t('sidebar.courseLessons'), href: '/dashboard/checkins', icon: BookOpen, badge: 3 },
        { name: t('sidebar.courseAnalytics'), href: '/dashboard/analytics', icon: TrendingUp },
        { name: t('sidebar.createCourse'), href: '/dashboard/courses/new', icon: PlusCircle },
      ]
    },
    { 
      name: t('sidebar.programsSection'), href: '#programs', icon: Target,
      children: [
        { name: t('sidebar.programsList'), href: '/dashboard/programs', icon: Layers },
        { name: t('sidebar.exercises'), href: '/dashboard/exercises', icon: Dumbbell },
        { name: t('sidebar.workouts'), href: '/dashboard/workouts', icon: Calendar },
        { name: locale === 'ru' ? 'Назначить' : 'Assign', href: '/dashboard/programs/assign', icon: UserPlus },
        { name: t('sidebar.createProgram'), href: '/dashboard/programs/new', icon: PlusCircle },
      ]
    },
    { name: t('messages.title'), href: '/dashboard/messages', icon: MessageSquare, badge: 5 },
    { name: t('payments.title'), href: '/dashboard/payments', icon: CreditCard },
    { name: t('calendar.title'), href: '/dashboard/calendar', icon: Calendar },
    { name: locale === 'ru' ? 'Редактор страницы' : 'Page Editor', href: '/dashboard/page-editor', icon: FileText },
    { name: locale === 'ru' ? 'Конструктор форм' : 'Form Builder', href: '/dashboard/form-builder', icon: FormInput },
    { name: locale === 'ru' ? 'Уведомления' : 'Notifications', href: '/dashboard/notifications', icon: BellRing },
    { name: t('common.settings'), href: '/dashboard/settings', icon: Settings },
  ]

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
      <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-64px-80px)] custom-scrollbar">
        {navigation.map((item) => {
          const isActive = !item.children && (pathname === item.href)
          return <SidebarNavItem key={item.name} item={item} isActive={isActive} isSidebarOpen={mobile || isSidebarOpen} pathname={pathname} onNavigate={mobile ? () => setIsMobileSidebarOpen(false) : undefined} />
        })}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <Link href="/dashboard/profile">
        <div className={cn('flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer', !mobile && !isSidebarOpen && 'justify-center')}>
          <Avatar fallback={initials} size="sm" />
          {(mobile || isSidebarOpen) && <div className="flex-1 min-w-0"><p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm truncate">{profile?.full_name || profile?.email || 'User'}</p><p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{profile?.role || 'user'}</p></div>}
        </div>
        </Link>
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
              {/* Notifications bell with dropdown */}
              <div className="relative">
                <Button variant="ghost" size="icon" className="relative" onClick={() => setIsNotifOpen(!isNotifOpen)}>
                  <Bell className="w-5 h-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-medium">{unreadNotifs}</span>
                  )}
                </Button>
                <NotificationsDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
              </div>
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
