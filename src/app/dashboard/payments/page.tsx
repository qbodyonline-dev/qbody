'use client'
import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import {
  DollarSign, Users, Clock, TrendingUp, Download, MoreHorizontal, Bell,
  Eye, Edit, Trash2, X, Calendar, Filter, ChevronLeft, ChevronRight,
  CreditCard, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Search
} from 'lucide-react'
import { toast } from 'sonner'

// Types aligned with Stripe concepts
type PaymentStatus = 'active' | 'pending' | 'overdue' | 'canceled' | 'refunded'
type Payment = {
  id: string
  stripeCustomerId: string    // Stripe customer ID placeholder
  stripeSubscriptionId: string // Stripe subscription ID placeholder
  stripeInvoiceId: string      // Stripe invoice ID placeholder
  client: string; initials: string; email: string
  plan: string; planId: string
  amount: number; currency: string
  status: PaymentStatus
  date: string; nextBilling: string
  method: string
  notes: string
}

const initialPayments: Payment[] = [
  { id: 'pay_1', stripeCustomerId: 'cus_QbAK001', stripeSubscriptionId: 'sub_QbAK001', stripeInvoiceId: 'in_QbAK001', client: 'Anna K.', initials: 'AK', email: 'anna@email.com', plan: 'Premium', planId: 'price_premium', amount: 99, currency: 'USD', status: 'active', date: '2025-02-01', nextBilling: '2025-03-01', method: 'Visa •••• 4242', notes: '' },
  { id: 'pay_2', stripeCustomerId: 'cus_QbMS002', stripeSubscriptionId: 'sub_QbMS002', stripeInvoiceId: 'in_QbMS002', client: 'Maria S.', initials: 'MS', email: 'maria@email.com', plan: 'Basic', planId: 'price_basic', amount: 49, currency: 'USD', status: 'active', date: '2025-02-05', nextBilling: '2025-03-05', method: 'Mastercard •••• 8888', notes: '' },
  { id: 'pay_3', stripeCustomerId: 'cus_QbEP003', stripeSubscriptionId: 'sub_QbEP003', stripeInvoiceId: 'in_QbEP003', client: 'Elena P.', initials: 'EP', email: 'elena@email.com', plan: 'Premium', planId: 'price_premium', amount: 99, currency: 'USD', status: 'pending', date: '2025-02-10', nextBilling: '-', method: 'Pending...', notes: 'Awaiting first payment' },
  { id: 'pay_4', stripeCustomerId: 'cus_QbOV004', stripeSubscriptionId: 'sub_QbOV004', stripeInvoiceId: 'in_QbOV004', client: 'Olga V.', initials: 'OV', email: 'olga@email.com', plan: 'Basic', planId: 'price_basic', amount: 49, currency: 'USD', status: 'active', date: '2025-01-20', nextBilling: '2025-02-20', method: 'Visa •••• 1234', notes: '' },
  { id: 'pay_5', stripeCustomerId: 'cus_QbSM005', stripeSubscriptionId: 'sub_QbSM005', stripeInvoiceId: 'in_QbSM005', client: 'Svetlana M.', initials: 'SM', email: 'svetlana@email.com', plan: 'VIP', planId: 'price_vip', amount: 149, currency: 'USD', status: 'active', date: '2025-01-15', nextBilling: '2025-02-15', method: 'Visa •••• 5678', notes: 'VIP client, 6-month commitment' },
  { id: 'pay_6', stripeCustomerId: 'cus_QbNT006', stripeSubscriptionId: '', stripeInvoiceId: 'in_QbNT006', client: 'Natalia T.', initials: 'NT', email: 'natalia@email.com', plan: 'Basic', planId: 'price_basic', amount: 49, currency: 'USD', status: 'overdue', date: '2025-01-05', nextBilling: '2025-02-05', method: 'Visa •••• 9999', notes: 'Payment failed 2x' },
  { id: 'pay_7', stripeCustomerId: 'cus_QbIK007', stripeSubscriptionId: '', stripeInvoiceId: 'in_QbIK007', client: 'Irina K.', initials: 'IK', email: 'irina@email.com', plan: 'Premium', planId: 'price_premium', amount: 99, currency: 'USD', status: 'canceled', date: '2024-12-01', nextBilling: '-', method: 'Visa •••• 3333', notes: 'Canceled by client' },
  { id: 'pay_8', stripeCustomerId: 'cus_QbLM008', stripeSubscriptionId: '', stripeInvoiceId: 'in_QbLM008', client: 'Larisa M.', initials: 'LM', email: 'larisa@email.com', plan: 'Basic', planId: 'price_basic', amount: 49, currency: 'USD', status: 'refunded', date: '2025-01-25', nextBilling: '-', method: 'Mastercard •••• 7777', notes: 'Refund processed' },
]

const statusColors: Record<PaymentStatus, string> = {
  active: 'success',
  pending: 'warning',
  overdue: 'destructive',
  canceled: 'secondary',
  refunded: 'outline',
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const monthsRu = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

export default function PaymentsPage() {
  const { t, locale } = useTranslation()
  const [payments, setPayments] = useState(initialPayments)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null) // 0-11
  const [selectedYear, setSelectedYear] = useState(2025)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Modals
  const [viewPayment, setViewPayment] = useState<Payment | null>(null)
  const [editPayment, setEditPayment] = useState<Payment | null>(null)
  const [deletePayment, setDeletePayment] = useState<Payment | null>(null)

  const formatDate = (dateStr: string) => {
    if (dateStr === '-') return '-'
    return new Date(dateStr).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatCurrency = (amount: number) => `$${amount}`

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      // Search
      if (search && !p.client.toLowerCase().includes(search.toLowerCase()) && !p.email.toLowerCase().includes(search.toLowerCase())) return false
      // Status filter
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      // Month filter
      if (selectedMonth !== null) {
        const d = new Date(p.date)
        if (d.getMonth() !== selectedMonth || d.getFullYear() !== selectedYear) return false
      }
      // Date range
      if (dateFrom && new Date(p.date) < new Date(dateFrom)) return false
      if (dateTo && new Date(p.date) > new Date(dateTo)) return false
      return true
    })
  }, [payments, search, statusFilter, selectedMonth, selectedYear, dateFrom, dateTo])

  // Stats from filtered
  const totalRevenue = filteredPayments.filter(p => p.status === 'active').reduce((sum, p) => sum + p.amount, 0)
  const activeCount = filteredPayments.filter(p => p.status === 'active').length
  const pendingCount = filteredPayments.filter(p => p.status === 'pending' || p.status === 'overdue').length
  const monthRevenue = filteredPayments.filter(p => {
    const d = new Date(p.date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && p.status === 'active'
  }).reduce((sum, p) => sum + p.amount, 0)

  const stats = [
    { label: locale === 'ru' ? 'Общий доход' : 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'bg-green-500' },
    { label: locale === 'ru' ? 'Активные подписки' : 'Active Subscriptions', value: String(activeCount), icon: Users, color: 'bg-teal-500' },
    { label: locale === 'ru' ? 'Ожидают/Просрочены' : 'Pending/Overdue', value: String(pendingCount), icon: Clock, color: 'bg-orange-500' },
    { label: locale === 'ru' ? 'За этот месяц' : 'This Month', value: formatCurrency(monthRevenue), icon: TrendingUp, color: 'bg-purple-500' },
  ]

  const handleDelete = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id))
    setDeletePayment(null)
    toast.success(locale === 'ru' ? 'Платёж удалён' : 'Payment deleted')
  }

  const handleSaveEdit = () => {
    if (!editPayment) return
    setPayments(prev => prev.map(p => p.id === editPayment.id ? editPayment : p))
    setEditPayment(null)
    toast.success(locale === 'ru' ? 'Платёж обновлён' : 'Payment updated')
  }

  const clearFilters = () => {
    setSearch(''); setStatusFilter('all'); setSelectedMonth(null); setDateFrom(''); setDateTo('')
  }

  const hasFilters = search || statusFilter !== 'all' || selectedMonth !== null || dateFrom || dateTo
  const ml = locale === 'ru' ? monthsRu : months

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t('payments.title')}</h1>
          <p className="text-zinc-500 mt-1">{t('payments.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.success('CSV exported!')}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
          <Button variant="outline" onClick={() => toast.info(locale === 'ru' ? 'Синхронизация со Stripe...' : 'Syncing with Stripe...')}><RefreshCw className="w-4 h-4 mr-2" />Stripe Sync</Button>
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
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input placeholder={locale === 'ru' ? 'Поиск по клиенту...' : 'Search client...'} className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Status filter */}
          <select className="h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
            <option value="all">{locale === 'ru' ? 'Все статусы' : 'All statuses'}</option>
            <option value="active">{locale === 'ru' ? 'Активные' : 'Active'}</option>
            <option value="pending">{locale === 'ru' ? 'Ожидает' : 'Pending'}</option>
            <option value="overdue">{locale === 'ru' ? 'Просрочен' : 'Overdue'}</option>
            <option value="canceled">{locale === 'ru' ? 'Отменён' : 'Canceled'}</option>
            <option value="refunded">{locale === 'ru' ? 'Возврат' : 'Refunded'}</option>
          </select>

          {/* Month picker */}
          <div className="flex items-center gap-1">
            <button onClick={() => setSelectedYear(y => y - 1)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm font-medium min-w-[40px] text-center">{selectedYear}</span>
            <button onClick={() => setSelectedYear(y => y + 1)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-1 flex-wrap">
            {ml.map((m, i) => (
              <button key={m} onClick={() => setSelectedMonth(selectedMonth === i ? null : i)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedMonth === i ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
                {m}
              </button>
            ))}
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input type="date" className="h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span className="text-zinc-400">—</span>
            <input type="date" className="h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-zinc-500"><X className="w-4 h-4 mr-1" />{locale === 'ru' ? 'Сбросить' : 'Clear'}</Button>
          )}
        </div>
        {hasFilters && (
          <p className="text-xs text-zinc-400 mt-2">{locale === 'ru' ? `Найдено: ${filteredPayments.length}` : `Found: ${filteredPayments.length} payment(s)`}</p>
        )}
      </CardContent></Card>

      {/* Table */}
      <Card><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
              <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{t('payments.table.client')}</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{t('payments.table.plan')}</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{t('payments.table.amount')}</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{t('payments.table.status')}</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{t('payments.table.date')}</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{t('payments.table.nextBilling')}</th>
              <th className="text-right py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{t('common.actions')}</th>
            </tr></thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-zinc-400">{locale === 'ru' ? 'Платежей не найдено' : 'No payments found'}</td></tr>
              ) : filteredPayments.map((p) => (
                <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Avatar fallback={p.initials} size="sm" />
                      <div><span className="font-medium text-zinc-900 dark:text-zinc-100">{p.client}</span><p className="text-xs text-zinc-400">{p.email}</p></div>
                    </div>
                  </td>
                  <td className="py-4 px-6"><Badge variant="outline">{p.plan}</Badge></td>
                  <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(p.amount)}</td>
                  <td className="py-4 px-6"><Badge variant={statusColors[p.status] as any}>{p.status}</Badge></td>
                  <td className="py-4 px-6 text-sm text-zinc-500">{formatDate(p.date)}</td>
                  <td className="py-4 px-6 text-sm text-zinc-500">{formatDate(p.nextBilling)}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-teal-500" onClick={() => setViewPayment(p)} title={locale === 'ru' ? 'Подробности' : 'Details'}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-blue-500" onClick={() => setEditPayment({ ...p })} title={locale === 'ru' ? 'Редактировать' : 'Edit'}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-red-500" onClick={() => setDeletePayment(p)} title={locale === 'ru' ? 'Удалить' : 'Delete'}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent></Card>

      {/* Stripe info card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Stripe Integration</h3>
              <p className="text-sm text-zinc-500">{locale === 'ru' ? 'Подключите Stripe для автоматической обработки платежей' : 'Connect Stripe for automatic payment processing'}</p>
            </div>
            <Badge variant="outline" className="text-amber-600 border-amber-300">{locale === 'ru' ? 'Не подключен' : 'Not connected'}</Badge>
            <Button variant="outline" size="sm" onClick={() => toast.info(locale === 'ru' ? 'Добавьте STRIPE_SECRET_KEY в .env' : 'Add STRIPE_SECRET_KEY to .env')}>
              <ExternalLink className="w-4 h-4 mr-2" />{locale === 'ru' ? 'Подключить' : 'Connect'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* === VIEW MODAL === */}
      <Modal isOpen={!!viewPayment} onClose={() => setViewPayment(null)} title={locale === 'ru' ? 'Детали платежа' : 'Payment Details'}>
        {viewPayment && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar fallback={viewPayment.initials} size="lg" />
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{viewPayment.client}</h3>
                <p className="text-sm text-zinc-500">{viewPayment.email}</p>
              </div>
              <Badge variant={statusColors[viewPayment.status] as any} className="ml-auto text-sm">{viewPayment.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: locale === 'ru' ? 'Тарифный план' : 'Plan', value: viewPayment.plan },
                { label: locale === 'ru' ? 'Сумма' : 'Amount', value: formatCurrency(viewPayment.amount) + '/mo' },
                { label: locale === 'ru' ? 'Дата платежа' : 'Payment Date', value: formatDate(viewPayment.date) },
                { label: locale === 'ru' ? 'Следующий платёж' : 'Next Billing', value: formatDate(viewPayment.nextBilling) },
                { label: locale === 'ru' ? 'Способ оплаты' : 'Payment Method', value: viewPayment.method },
                { label: locale === 'ru' ? 'Валюта' : 'Currency', value: viewPayment.currency },
              ].map(item => (
                <div key={item.label} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <p className="text-xs text-zinc-500 mb-1">{item.label}</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Stripe IDs */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl space-y-2">
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400 flex items-center gap-2"><CreditCard className="w-4 h-4" />Stripe IDs</p>
              <div className="grid grid-cols-1 gap-1 text-xs font-mono">
                <div className="flex gap-2"><span className="text-zinc-500">Customer:</span><span className="text-zinc-700 dark:text-zinc-300">{viewPayment.stripeCustomerId}</span></div>
                <div className="flex gap-2"><span className="text-zinc-500">Subscription:</span><span className="text-zinc-700 dark:text-zinc-300">{viewPayment.stripeSubscriptionId || '—'}</span></div>
                <div className="flex gap-2"><span className="text-zinc-500">Invoice:</span><span className="text-zinc-700 dark:text-zinc-300">{viewPayment.stripeInvoiceId}</span></div>
              </div>
            </div>

            {viewPayment.notes && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">{locale === 'ru' ? 'Заметки' : 'Notes'}</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{viewPayment.notes}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setViewPayment(null); setEditPayment({ ...viewPayment }) }}><Edit className="w-4 h-4 mr-2" />{locale === 'ru' ? 'Редактировать' : 'Edit'}</Button>
              <Button variant="ghost" onClick={() => setViewPayment(null)}>{locale === 'ru' ? 'Закрыть' : 'Close'}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* === EDIT MODAL === */}
      <Modal isOpen={!!editPayment} onClose={() => setEditPayment(null)} title={locale === 'ru' ? 'Редактировать платёж' : 'Edit Payment'}>
        {editPayment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label={locale === 'ru' ? 'Клиент' : 'Client'} value={editPayment.client} onChange={e => setEditPayment({ ...editPayment, client: e.target.value })} />
              <Input label="Email" value={editPayment.email} onChange={e => setEditPayment({ ...editPayment, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{locale === 'ru' ? 'Тариф' : 'Plan'}</label>
                <select className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" value={editPayment.plan} onChange={e => {
                  const plan = e.target.value
                  const amount = plan === 'VIP' ? 149 : plan === 'Premium' ? 99 : 49
                  setEditPayment({ ...editPayment, plan, amount })
                }}>
                  <option value="Basic">Basic — $49</option>
                  <option value="Premium">Premium — $99</option>
                  <option value="VIP">VIP — $149</option>
                </select>
              </div>
              <Input label={locale === 'ru' ? 'Сумма ($)' : 'Amount ($)'} type="number" value={String(editPayment.amount)} onChange={e => setEditPayment({ ...editPayment, amount: Number(e.target.value) })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{locale === 'ru' ? 'Статус' : 'Status'}</label>
                <select className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" value={editPayment.status} onChange={e => setEditPayment({ ...editPayment, status: e.target.value as PaymentStatus })}>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="canceled">Canceled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <Input label={locale === 'ru' ? 'Дата платежа' : 'Payment Date'} type="date" value={editPayment.date} onChange={e => setEditPayment({ ...editPayment, date: e.target.value })} />
            </div>
            <Input label={locale === 'ru' ? 'Следующий платёж' : 'Next Billing'} type="date" value={editPayment.nextBilling === '-' ? '' : editPayment.nextBilling} onChange={e => setEditPayment({ ...editPayment, nextBilling: e.target.value || '-' })} />
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{locale === 'ru' ? 'Заметки' : 'Notes'}</label>
              <textarea className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 text-sm" rows={3} value={editPayment.notes} onChange={e => setEditPayment({ ...editPayment, notes: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setEditPayment(null)}>{locale === 'ru' ? 'Отмена' : 'Cancel'}</Button>
              <Button variant="gradient" onClick={handleSaveEdit}>{locale === 'ru' ? 'Сохранить' : 'Save'}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* === DELETE MODAL === */}
      <Modal isOpen={!!deletePayment} onClose={() => setDeletePayment(null)} title={locale === 'ru' ? 'Удалить платёж' : 'Delete Payment'}>
        {deletePayment && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-xl">
              <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-300">{locale === 'ru' ? 'Вы уверены?' : 'Are you sure?'}</p>
                <p className="text-sm text-red-600 dark:text-red-400">{locale === 'ru' ? `Платёж от ${deletePayment.client} на ${formatCurrency(deletePayment.amount)} будет удалён.` : `Payment from ${deletePayment.client} for ${formatCurrency(deletePayment.amount)} will be deleted.`}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setDeletePayment(null)}>{locale === 'ru' ? 'Отмена' : 'Cancel'}</Button>
              <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={() => handleDelete(deletePayment.id)}><Trash2 className="w-4 h-4 mr-2" />{locale === 'ru' ? 'Удалить' : 'Delete'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
