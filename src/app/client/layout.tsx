'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, BookOpen, TrendingUp, User, Menu, X, LogOut, MessageCircle, Dumbbell, Scale, Globe } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { t, locale } = useTranslation()
  const { user, profile, signOut, session, loading: authLoading, isClient } = useAuth()
  const ru = locale === 'ru'
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Redirect to onboarding if not completed (only for clients, not on onboarding page)
  useEffect(() => {
    if (!authLoading && user && isClient && profile && !pathname.startsWith('/client/onboarding')) {
      if (profile.onboarding_completed === false) {
        router.replace('/client/onboarding')
      }
    }
  }, [authLoading, user, isClient, profile, pathname, router])
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U'

  // Initialize Supabase client
  useEffect(() => {
    if (typeof window !== 'undefined' && !supabaseRef.current) {
      supabaseRef.current = createClient()
    }
  }, [])

  // Fetch unread messages count
  const fetchUnreadCount = useCallback(async () => {
    if (!session?.access_token) return
    
    try {
      const res = await fetch('/api/conversations', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (res.ok) {
        const conversation = await res.json()
        if (conversation && conversation.unread_count !== undefined) {
          setUnreadMessages(conversation.unread_count)
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }, [session?.access_token])

  // Fetch unread count on mount
  useEffect(() => {
    if (session?.access_token) {
      fetchUnreadCount()
    }
  }, [session?.access_token, fetchUnreadCount])

  // Real-time subscription for new messages
  useEffect(() => {
    if (!supabaseRef.current || !session?.access_token) return

    const channel = supabaseRef.current
      .channel('client-messages-count')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          fetchUnreadCount()
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabaseRef.current?.removeChannel(channel)
    }
  }, [session?.access_token, fetchUnreadCount])

  const navigation = [
    { name: t('client.nav.home'), href: '/client/home', icon: Home, badge: 0 },
    { name: ru ? 'Тренировки' : 'Training', href: '/client/training', icon: Dumbbell, badge: 0 },
    { name: ru ? 'Чекины' : 'Check-ins', href: '/client/checkins', icon: Scale, badge: 0 },
    { name: t('client.nav.courses'), href: '/client/courses', icon: BookOpen, badge: 0 },
    { name: t('client.nav.progress'), href: '/client/progress', icon: TrendingUp, badge: 0 },
    { name: t('client.nav.support'), href: '/client/messages', icon: MessageCircle, badge: unreadMessages },
    { name: t('client.nav.profile'), href: '/client/profile', icon: User, badge: 0 },
  ]

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = async () => {
    setShowUserMenu(false)
    await signOut()
  }

  // Onboarding page — render without layout chrome
  if (pathname.startsWith('/client/onboarding')) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            <Link href="/client/home" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center"><span className="text-white font-bold">Q</span></div>
              <span className="font-semibold text-zinc-900 hidden sm:block">Qbody</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link key={item.name} href={item.href} className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all relative', isActive ? 'bg-teal-500/10 text-teal-600' : 'text-zinc-600 hover:bg-zinc-100')}>
                    <div className="relative">
                      <Icon className="w-4 h-4" />
                      {item.badge > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </div>
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Back to site — desktop */}
              <Link href="/" target="_blank" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
                <Globe className="w-3.5 h-3.5" />
                {ru ? 'На сайт' : 'View Site'}
              </Link>

              <LanguageSwitcher variant="dropdown" />

              {/* User menu (desktop) */}
              <div className="relative hidden md:block" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-zinc-100 transition-colors"
                >
                  <Avatar src={profile?.avatar_url || undefined} fallback={initials} size="sm" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-zinc-200 py-2 z-50">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-zinc-100">
                      <p className="font-medium text-zinc-900 text-sm truncate">{profile?.full_name || user?.email}</p>
                      <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                    </div>

                    {/* Back to site */}
                    <Link href="/" target="_blank"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors">
                      <Globe className="w-4 h-4" />
                      {ru ? 'Вернуться на сайт' : 'Back to Site'}
                    </Link>

                    {/* Sign out */}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('common.logout')}
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button className="md:hidden p-2 relative" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="w-6 h-6 text-zinc-600" /> : <Menu className="w-6 h-6 text-zinc-600" />}
                {unreadMessages > 0 && !isMobileMenuOpen && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200">
            <nav className="container-custom py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={cn('flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all', isActive ? 'bg-teal-500/10 text-teal-600' : 'text-zinc-600 hover:bg-zinc-100')}>
                    <div className="relative">
                      <Icon className="w-5 h-5" />
                      {item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </div>
                    {item.name}
                    {item.badge > 0 && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}

              {/* Back to site — mobile */}
              <div className="pt-3 mt-3 border-t border-zinc-200">
                <Link href="/" target="_blank" onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-600 hover:bg-zinc-100 font-medium transition-all">
                  <Globe className="w-5 h-5" />
                  {ru ? 'Вернуться на сайт' : 'Back to Site'}
                </Link>
              </div>

              <div className="pt-3 border-t border-zinc-200 mt-1">
                <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-700 hover:bg-zinc-100">
                  <LogOut className="w-5 h-5" />
                  {t('common.logout')}
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="container-custom py-8">{children}</main>
    </div>
  )
}
