'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, TrendingUp, User, Menu, X, LogOut, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: t('client.nav.home'), href: '/client/home', icon: Home },
    { name: t('client.nav.courses'), href: '/client/courses', icon: BookOpen },
    { name: t('client.nav.progress'), href: '/client/progress', icon: TrendingUp },
    { name: t('client.nav.profile'), href: '/client/profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            <Link href="/client/home" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center"><span className="text-white font-bold">Q</span></div>
              <span className="font-semibold text-zinc-900 hidden sm:block">Qbody</span>
            </Link>
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
            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="dropdown" />
              <Button variant="ghost" size="icon" className="relative"><Bell className="w-5 h-5" /><span className="absolute top-1 right-1 w-2 h-2 bg-teal-500 rounded-full" /></Button>
              <Avatar fallback="AK" size="sm" className="hidden md:flex" />
              <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="w-6 h-6 text-zinc-600" /> : <Menu className="w-6 h-6 text-zinc-600" />}
              </button>
            </div>
          </div>
        </div>
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
              <div className="pt-4 border-t border-zinc-200 mt-4">
                <Link href="/auth/login" className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50"><LogOut className="w-5 h-5" />{t('common.logout')}</Link>
              </div>
            </nav>
          </div>
        )}
      </header>
      <main className="container-custom py-8">{children}</main>
    </div>
  )
}
