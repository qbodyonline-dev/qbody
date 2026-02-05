'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, TrendingUp, User, Menu, X, LogOut, Bell, Trash2, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { t, locale } = useTranslation()
  const { user, profile, signOut, session } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
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

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete account')
      }
      toast.success(t('client.profile.accountDeleted'))
      await signOut()
    } catch (err: any) {
      toast.error(err.message || t('client.profile.deleteFailed'))
    } finally {
      setDeleteLoading(false)
      setShowDeleteConfirm(false)
    }
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
            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="dropdown" />

              {/* User menu (desktop) */}
              <div className="relative hidden md:block" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-zinc-100 transition-colors"
                >
                  <Avatar fallback={initials} size="sm" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-zinc-200 py-2 z-50">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-zinc-100">
                      <p className="font-medium text-zinc-900 text-sm truncate">{profile?.full_name || user?.email}</p>
                      <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                    </div>

                    {/* Sign out */}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('common.logout')}
                    </button>

                    {/* Delete account */}
                    <div className="border-t border-zinc-100 mt-1 pt-1">
                      <button
                        onClick={() => { setShowUserMenu(false); setShowDeleteConfirm(true) }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('client.profile.deleteAccount')}
                      </button>
                    </div>
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
              <div className="pt-4 border-t border-zinc-200 mt-4 space-y-1">
                <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-700 hover:bg-zinc-100">
                  <LogOut className="w-5 h-5" />
                  {t('common.logout')}
                </button>
                <button onClick={() => { setIsMobileMenuOpen(false); setShowDeleteConfirm(true) }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50">
                  <Trash2 className="w-5 h-5" />
                  {t('client.profile.deleteAccount')}
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="container-custom py-8">{children}</main>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 text-center mb-2">
              {t('client.profile.deleteConfirmTitle')}
            </h3>
            <p className="text-sm text-zinc-500 text-center mb-6">
              {t('client.profile.deleteConfirmMessage')}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="gradient"
                className="flex-1 !bg-gradient-to-r !from-red-500 !to-red-600"
                onClick={handleDeleteAccount}
                isLoading={deleteLoading}
              >
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
