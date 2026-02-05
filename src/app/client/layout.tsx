'use client'
import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, TrendingUp, User, Menu, X, LogOut, Bell, Trash2, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { t, locale } = useTranslation()
  const { user, profile, signOut } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const ru = locale === 'ru'

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U'

  const navigation = [
    { name: t('client.nav.home'), href: '/client/home', icon: Home },
    { name: t('client.nav.courses'), href: '/client/courses', icon: BookOpen },
    { name: t('client.nav.progress'), href: '/client/progress', icon: TrendingUp },
    { name: ru ? 'Поддержка' : 'Support', href: '/client/messages', icon: MessageCircle },
    { name: t('client.nav.profile'), href: '/client/profile', icon: User },
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
      toast.success(ru ? 'Аккаунт удалён' : 'Account deleted')
      await signOut()
    } catch (err: any) {
      toast.error(err.message || (ru ? 'Ошибка удаления' : 'Delete failed'))
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
                  <Link key={item.name} href={item.href} className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all', isActive ? 'bg-teal-500/10 text-teal-600' : 'text-zinc-600 hover:bg-zinc-100')}>
                    <Icon className="w-4 h-4" />{item.name}
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
                      {ru ? 'Выйти' : 'Sign Out'}
                    </button>

                    {/* Delete account */}
                    <div className="border-t border-zinc-100 mt-1 pt-1">
                      <button
                        onClick={() => { setShowUserMenu(false); setShowDeleteConfirm(true) }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        {ru ? 'Удалить аккаунт' : 'Delete Account'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="w-6 h-6 text-zinc-600" /> : <Menu className="w-6 h-6 text-zinc-600" />}
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
                    <Icon className="w-5 h-5" />{item.name}
                  </Link>
                )
              })}
              <div className="pt-4 border-t border-zinc-200 mt-4 space-y-1">
                <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-700 hover:bg-zinc-100">
                  <LogOut className="w-5 h-5" />
                  {ru ? 'Выйти' : 'Sign Out'}
                </button>
                <button onClick={() => { setIsMobileMenuOpen(false); setShowDeleteConfirm(true) }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50">
                  <Trash2 className="w-5 h-5" />
                  {ru ? 'Удалить аккаунт' : 'Delete Account'}
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
              {ru ? 'Удалить аккаунт?' : 'Delete Account?'}
            </h3>
            <p className="text-sm text-zinc-500 text-center mb-6">
              {ru
                ? 'Это действие необратимо. Все ваши данные, курсы и прогресс будут удалены навсегда.'
                : 'This action is irreversible. All your data, courses, and progress will be permanently deleted.'}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {ru ? 'Отмена' : 'Cancel'}
              </Button>
              <Button
                variant="gradient"
                className="flex-1 !bg-gradient-to-r !from-red-500 !to-red-600"
                onClick={handleDeleteAccount}
                isLoading={deleteLoading}
              >
                {ru ? 'Удалить' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
