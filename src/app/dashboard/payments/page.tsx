'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import {
  DollarSign, Users, Clock, TrendingUp, Download, 
  Eye, X, Search, RefreshCw, CreditCard, ExternalLink,
  AlertCircle, Package, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { COURSES } from '@/lib/stripe'
import { fetchWithAuth } from '@/lib/api'

type OrderStatus = 'pending' | 'paid' | 'expired' | 'refunded'

type Order = {
  id: string
  user_id: string
  user_email: string
  user_name: string
  user_avatar_url: string | null
  course_slug: string
  program_id: string | null
  program_name: string | null
  amount: number
  currency: string
  status: OrderStatus
  stripe_session_id: string
  stripe_customer_id: string
  stripe_payment_intent_id: string | null
  created_at: string
  paid_at: string | null
}

const statusConfig: Record<OrderStatus, { color: string; label: string; labelRu: string }> = {
  paid: { color: 'success', label: 'Paid', labelRu: 'Оплачен' },
  pending: { color: 'warning', label: 'Pending', labelRu: 'Ожидает' },
  expired: { color: 'secondary', label: 'Expired', labelRu: 'Истёк' },
  refunded: { color: 'outline', label: 'Refunded', labelRu: 'Возврат' },
}

const courseNames: Record<string, { en: string; ru: string }> = {
  'breast-augmentation-recovery': {
    en: 'Breast Augmentation Recovery',
    ru: 'Восстановление после увеличения груди',
  },
  'cesarean-recovery': {
    en: 'C-Section Recovery',
    ru: 'Восстановление после кесарева сечения',
  },
}

export default function PaymentsPage() {
  const { t, locale } = useTranslation()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [viewOrder, setViewOrder] = useState<Order | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/orders')
      const data = await res.json()
      if (data.orders) {
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error(locale === 'ru' ? 'Ошибка загрузки заказов' : 'Error loading orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  const formatAmount = (amount: number) => `$${(amount / 100).toFixed(2)}`

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (search) {
        const q = search.toLowerCase()
        if (!o.user_name.toLowerCase().includes(q) && !o.user_email.toLowerCase().includes(q)) return false
      }
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      return true
    })
  }, [orders, search, statusFilter])

  // Stats
  const totalRevenue = orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.amount, 0)
  const paidCount = orders.filter(o => o.status === 'paid').length
  const pendingCount = orders.filter(o => o.status === 'pending').length
  const thisMonthRevenue = orders.filter(o => {
    if (o.status !== 'paid' || !o.paid_at) return false
    const d = new Date(o.paid_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((sum, o) => sum + o.amount, 0)

  const stats = [
    { label: locale === 'ru' ? 'Общий доход' : 'Total Revenue', value: formatAmount(totalRevenue), icon: DollarSign, color: 'bg-green-500' },
    { label: locale === 'ru' ? 'Оплаченных заказов' : 'Paid Orders', value: String(paidCount), icon: Users, color: 'bg-teal-500' },
    { label: locale === 'ru' ? 'Ожидают оплаты' : 'Pending', value: String(pendingCount), icon: Clock, color: 'bg-orange-500' },
    { label: locale === 'ru' ? 'За этот месяц' : 'This Month', value: formatAmount(thisMonthRevenue), icon: TrendingUp, color: 'bg-purple-500' },
  ]

  // ✅ Bug 6 fix: Resolve product names for both courses and programs
  const getProductName = (order: Order) => {
    // Program: use resolved program_name from API
    if (order.program_name) {
      return order.program_name
    }
    // Course: use hardcoded names map
    const names = courseNames[order.course_slug]
    if (names) return locale === 'ru' ? names.ru : names.en
    // Fallback: clean up slug
    if (order.course_slug?.startsWith('program:')) {
      return locale === 'ru' ? 'Программа тренировок' : 'Training Program'
    }
    return order.course_slug
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
  }

  const hasFilters = search || statusFilter !== 'all'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t('payments.title')}</h1>
          <p className="text-zinc-500 mt-1">{t('payments.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchOrders} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {locale === 'ru' ? 'Обновить' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}><CardContent className="p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${s.color} flex items-center justify-center`}><s.icon className="w-6 h-6 text-white" /></div>
            <div><p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{s.value}</p><p className="text-sm text-zinc-500">{s.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      {/* Filters */}
      <Card><CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input placeholder={locale === 'ru' ? 'Поиск по клиенту...' : 'Search client...'} className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select
            className="h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
          >
            <option value="all">{locale === 'ru' ? 'Все статусы' : 'All statuses'}</option>
            <option value="paid">{locale === 'ru' ? 'Оплачен' : 'Paid'}</option>
            <option value="pending">{locale === 'ru' ? 'Ожидает' : 'Pending'}</option>
            <option value="expired">{locale === 'ru' ? 'Истёк' : 'Expired'}</option>
            <option value="refunded">{locale === 'ru' ? 'Возврат' : 'Refunded'}</option>
          </select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all') }} className="text-zinc-500">
              <X className="w-4 h-4 mr-1" />{locale === 'ru' ? 'Сбросить' : 'Clear'}
            </Button>
          )}
        </div>
      </CardContent></Card>

      {/* Table */}
      <Card><CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{t('payments.table.client')}</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{locale === 'ru' ? 'Продукт' : 'Product'}</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{t('payments.table.amount')}</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{t('payments.table.status')}</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{t('payments.table.date')}</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{t('common.actions')}</th>
              </tr></thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={6} className="py-16 text-center">
                    <Package className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                    <p className="text-zinc-400">{locale === 'ru' ? 'Заказов пока нет' : 'No orders yet'}</p>
                    <p className="text-zinc-300 text-sm mt-1">{locale === 'ru' ? 'Заказы появятся после первой покупки курса' : 'Orders will appear after the first course purchase'}</p>
                  </td></tr>
                ) : filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar src={order.user_avatar_url || undefined} fallback={getInitials(order.user_name)} size="sm" />
                        <div>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{order.user_name}</span>
                          <p className="text-xs text-zinc-400">{order.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{getProductName(order)}</span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-zinc-100">{formatAmount(order.amount)}</td>
                    <td className="py-4 px-6">
                      <Badge variant={statusConfig[order.status]?.color as any}>
                        {locale === 'ru' ? statusConfig[order.status]?.labelRu : statusConfig[order.status]?.label}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-sm text-zinc-500">{formatDate(order.paid_at || order.created_at)}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end">
                        <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-teal-500" onClick={() => setViewOrder(order)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent></Card>

      {/* Stripe info */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Stripe</h3>
              <p className="text-sm text-zinc-500">{locale === 'ru' ? 'Оплата курсов через Stripe Checkout' : 'Course payments via Stripe Checkout'}</p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-300">
              {locale === 'ru' ? 'Тестовый режим' : 'Test Mode'}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => window.open('https://dashboard.stripe.com/test/payments', '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" />Stripe Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* View Order Modal */}
      <Modal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} title={locale === 'ru' ? 'Детали заказа' : 'Order Details'}>
        {viewOrder && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar src={viewOrder.user_avatar_url || undefined} fallback={getInitials(viewOrder.user_name)} size="lg" />
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{viewOrder.user_name}</h3>
                <p className="text-sm text-zinc-500">{viewOrder.user_email}</p>
              </div>
              <Badge variant={statusConfig[viewOrder.status]?.color as any} className="ml-auto text-sm">
                {locale === 'ru' ? statusConfig[viewOrder.status]?.labelRu : statusConfig[viewOrder.status]?.label}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: locale === 'ru' ? 'Продукт' : 'Product', value: getProductName(viewOrder) },
                { label: locale === 'ru' ? 'Сумма' : 'Amount', value: formatAmount(viewOrder.amount) },
                { label: locale === 'ru' ? 'Создан' : 'Created', value: formatDate(viewOrder.created_at) },
                { label: locale === 'ru' ? 'Оплачен' : 'Paid', value: formatDate(viewOrder.paid_at) },
              ].map(item => (
                <div key={item.label} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <p className="text-xs text-zinc-500 mb-1">{item.label}</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Stripe IDs */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl space-y-2">
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400 flex items-center gap-2"><CreditCard className="w-4 h-4" />Stripe</p>
              <div className="grid grid-cols-1 gap-1 text-xs font-mono">
                <div className="flex gap-2"><span className="text-zinc-500">Session:</span><span className="text-zinc-700 dark:text-zinc-300 break-all">{viewOrder.stripe_session_id}</span></div>
                <div className="flex gap-2"><span className="text-zinc-500">Customer:</span><span className="text-zinc-700 dark:text-zinc-300">{viewOrder.stripe_customer_id}</span></div>
                <div className="flex gap-2"><span className="text-zinc-500">Payment:</span><span className="text-zinc-700 dark:text-zinc-300">{viewOrder.stripe_payment_intent_id || '—'}</span></div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              {viewOrder.stripe_payment_intent_id && (
                <Button variant="outline" size="sm" onClick={() => window.open(`https://dashboard.stripe.com/test/payments/${viewOrder.stripe_payment_intent_id}`, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />{locale === 'ru' ? 'Открыть в Stripe' : 'View in Stripe'}
                </Button>
              )}
              <Button variant="ghost" onClick={() => setViewOrder(null)}>{locale === 'ru' ? 'Закрыть' : 'Close'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
