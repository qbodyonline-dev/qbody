'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useTranslation } from '@/lib/i18n'
import { getClients } from '@/lib/api'
import { Search, Plus, Eye, Users, Loader2 } from 'lucide-react'

export default function ClientsPage() {
  const { t, locale } = useTranslation()
  const ru = locale === 'ru'
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    getClients().then((data) => {
      setClients(data)
      setLoading(false)
    })
  }, [])

  const filteredClients = clients.filter(c => {
    const name = (c.full_name || '').toLowerCase()
    const email = (c.email || '').toLowerCase()
    const q = searchQuery.toLowerCase()
    return name.includes(q) || email.includes(q)
  })

  const getInitials = (client: any) => {
    if (client.full_name) return client.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    return client.email?.slice(0, 2).toUpperCase() || 'U'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t('clients.title')}</h1>
          <p className="text-zinc-500 mt-1">{clients.length} {ru ? 'клиентов' : 'clients total'}</p>
        </div>
      </div>

      <Card><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input placeholder={ru ? 'Поиск по имени или email...' : 'Search by name or email...'} className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </CardContent></Card>

      {filteredClients.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <Users className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            {searchQuery ? (ru ? 'Ничего не найдено' : 'No results found') : (ru ? 'Клиентов пока нет' : 'No clients yet')}
          </h3>
          <p className="text-zinc-500 mb-4">
            {searchQuery 
              ? (ru ? 'Попробуйте изменить поисковый запрос' : 'Try a different search query')
              : (ru ? 'Клиенты появятся здесь после регистрации на сайте' : 'Clients will appear here after they register on the site')
            }
          </p>
        </CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{ru ? 'Клиент' : 'Client'}</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">Email</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{ru ? 'Телефон' : 'Phone'}</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{ru ? 'Роль' : 'Role'}</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{ru ? 'Дата регистрации' : 'Registered'}</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{ru ? 'Действия' : 'Actions'}</th>
              </tr></thead>
              <tbody>
                {filteredClients.map((client: any) => (
                  <tr key={client.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar src={client.avatar_url || undefined} fallback={getInitials(client)} size="sm" />
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{client.full_name || (ru ? 'Без имени' : 'No name')}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-zinc-500">{client.email}</td>
                    <td className="py-4 px-6 text-sm text-zinc-500">{client.phone || '—'}</td>
                    <td className="py-4 px-6">
                      <Badge variant={client.role === 'admin' ? 'destructive' : client.role === 'trainer' ? 'warning' : 'secondary'}>
                        {client.role}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-sm text-zinc-500">
                      {new Date(client.created_at).toLocaleDateString(ru ? 'ru-RU' : 'en-US')}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link href={`/dashboard/clients/${client.id}`}>
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      )}
    </div>
  )
}
