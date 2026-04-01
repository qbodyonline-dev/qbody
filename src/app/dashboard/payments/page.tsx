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
  DollarSign, Users, Clock, TrendingUp,
  Eye, X, Search, RefreshCw, CreditCard, ExternalLink,
  AlertCircle, Package, Loader2, Settings, ShoppingCart,
  Copy, CheckCircle2, XCircle, EyeOff, Shield, Zap
} from 'lucide-react'
import { toast } from 'sonner'
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
  course_title: string | null
  course_title_secondary: string | null
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

type StripeKeys = {
  publishableKey: string
  secretKey: string
  webhookSecret: string
}

const EMPTY_KEYS: StripeKeys = { publishableKey: '', secretKey: '', webhookSecret: '' }

export default function PaymentsPage() {
  const { t, locale } = useTranslation()
  const ru = locale === 'ru'

  // ─── Tab state ───
  const [activeTab, setActiveTab] = useState<'orders' | 'stripe'>('orders')

  // ─── Orders state ───
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [viewOrder, setViewOrder] = useState<Order | null>(null)

  // ─── Stripe settings state ───
  const [stripeMode, setStripeMode] = useState<'test' | 'live'>('test')
  const [testKeys, setTestKeys] = useState<StripeKeys>({ ...EMPTY_KEYS })
  const [liveKeys, setLiveKeys] = useState<StripeKeys>({ ...EMPTY_KEYS })
  const [stripeLoading, setStripeLoading] = useState(true)
  const [stripeSaving, setStripeSaving] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionResult, setConnectionResult] = useState<null | { success: boolean; error?: string }>(null)
  const [showTestSecret, setShowTestSecret] = useState(false)
  const [showTestWebhook, setShowTestWebhook] = useState(false)
  const [showLiveSecret, setShowLiveSecret] = useState(false)
  const [showLiveWebhook, setShowLiveWebhook] = useState(false)
  const [stripeSettingsLoaded, setStripeSettingsLoaded] = useState(false)

  // ─── Orders logic ───
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
      toast.error(ru ? 'Ошибка загрузки заказов' : 'Error loading orders')
    } finally {
      setLoading(false)
    }
  }

  // Load orders + minimal stripe mode on mount
  useEffect(() => {
    fetchOrders()
    // Fetch stripe mode so badge on Orders tab is accurate
    fetchWithAuth('/api/settings/stripe')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.mode) setStripeMode(data.mode) })
      .catch(() => {})
  }, [])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString(ru ? 'ru-RU' : 'en-US', {
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
    { label: ru ? 'Общий доход' : 'Total Revenue', value: formatAmount(totalRevenue), icon: DollarSign, color: 'bg-green-500' },
    { label: ru ? 'Оплаченных заказов' : 'Paid Orders', value: String(paidCount), icon: Users, color: 'bg-teal-500' },
    { label: ru ? 'Ожидают оплаты' : 'Pending', value: String(pendingCount), icon: Clock, color: 'bg-orange-500' },
    { label: ru ? 'За этот месяц' : 'This Month', value: formatAmount(thisMonthRevenue), icon: TrendingUp, color: 'bg-purple-500' },
  ]

  const getProductName = (order: Order) => {
    if (order.program_name) return order.program_name
    if (order.course_title) {
      return ru && order.course_title_secondary ? order.course_title_secondary : order.course_title
    }
    if (order.course_slug?.startsWith('program:')) {
      return ru ? 'Программа тренировок' : 'Training Program'
    }
    return order.course_slug
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
  }

  const hasFilters = search || statusFilter !== 'all'

  // ─── Stripe Settings logic ───
  const loadStripeSettings = async () => {
    setStripeLoading(true)
    try {
      const res = await fetchWithAuth('/api/settings/stripe')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setStripeMode(data.mode || 'test')
      setTestKeys(data.test || { ...EMPTY_KEYS })
      setLiveKeys(data.live || { ...EMPTY_KEYS })
      setStripeSettingsLoaded(true)
    } catch (err) {
      console.error('Error loading stripe settings:', err)
    } finally {
      setStripeLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'stripe' && !stripeSettingsLoaded) {
      loadStripeSettings()
    }
  }, [activeTab])

  const handleSaveStripe = async () => {
    setStripeSaving(true)
    setConnectionResult(null)
    try {
      const res = await fetchWithAuth('/api/settings/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          mode: stripeMode,
          test: testKeys,
          live: liveKeys,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || (ru ? 'Ошибка сохранения' : 'Save failed'))
        return
      }
      toast.success(ru ? 'Настройки Stripe сохранены' : 'Stripe settings saved')
      await loadStripeSettings()
    } catch {
      toast.error(ru ? 'Ошибка сохранения' : 'Save failed')
    } finally {
      setStripeSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    setConnectionResult(null)
    try {
      const activeKeys = stripeMode === 'live' ? liveKeys : testKeys
      const res = await fetchWithAuth('/api/settings/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          secretKey: activeKeys.secretKey,
          mode: stripeMode,
        }),
      })
      const data = await res.json()
      setConnectionResult(data)
      if (data.success) {
        toast.success(ru ? 'Подключение успешно!' : 'Connection successful!')
      } else {
        toast.error(data.error || (ru ? 'Ошибка подключения' : 'Connection failed'))
      }
    } catch {
      setConnectionResult({ success: false, error: ru ? 'Ошибка сети' : 'Network error' })
    } finally {
      setTestingConnection(false)
    }
  }

  const copyWebhookUrl = () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/stripe/webhook`
    navigator.clipboard.writeText(url)
    toast.success(ru ? 'URL скопирован' : 'URL copied')
  }

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/stripe/webhook` : '/api/stripe/webhook'

  // ─── Tabs ───
  const tabs = [
    { key: 'orders' as const, label: ru ? 'Заказы' : 'Orders', icon: ShoppingCart },
    { key: 'stripe' as const, label: ru ? 'Настройки Stripe' : 'Stripe Settings', icon: Settings },
  ]

  // ─── Stripe key input helper ───
  const renderKeyInput = (
    label: string,
    placeholder: string,
    value: string,
    onChange: (val: string) => void,
    isSecret: boolean,
    showValue: boolean,
    toggleShow: () => void
  ) => (
    <div>
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={isSecret && !showValue ? 'password' : 'text'}
          className="w-full h-11 px-4 pr-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition font-mono"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => {
            if (value.includes('••')) onChange('')
          }}
          autoComplete="off"
          spellCheck={false}
        />
        {isSecret && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            onClick={toggleShow}
            tabIndex={-1}
          >
            {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t('payments.title')}</h1>
          <p className="text-zinc-500 mt-1">{t('payments.subtitle')}</p>
        </div>
        {activeTab === 'orders' && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchOrders} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {ru ? 'Обновить' : 'Refresh'}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Tab: Orders                                        */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeTab === 'orders' && (
        <>
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
                <Input placeholder={ru ? 'Поиск по клиенту...' : 'Search client...'} className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select
                className="h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 text-sm"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
              >
                <option value="all">{ru ? 'Все статусы' : 'All statuses'}</option>
                <option value="paid">{ru ? 'Оплачен' : 'Paid'}</option>
                <option value="pending">{ru ? 'Ожидает' : 'Pending'}</option>
                <option value="expired">{ru ? 'Истёк' : 'Expired'}</option>
                <option value="refunded">{ru ? 'Возврат' : 'Refunded'}</option>
              </select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all') }} className="text-zinc-500">
                  <X className="w-4 h-4 mr-1" />{ru ? 'Сбросить' : 'Clear'}
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
                    <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{ru ? 'Продукт' : 'Product'}</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{t('payments.table.amount')}</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{t('payments.table.status')}</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{t('payments.table.date')}</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{t('common.actions')}</th>
                  </tr></thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr><td colSpan={6} className="py-16 text-center">
                        <Package className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                        <p className="text-zinc-400">{ru ? 'Заказов пока нет' : 'No orders yet'}</p>
                        <p className="text-zinc-300 text-sm mt-1">{ru ? 'Заказы появятся после первой покупки курса' : 'Orders will appear after the first course purchase'}</p>
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
                            {ru ? statusConfig[order.status]?.labelRu : statusConfig[order.status]?.label}
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

          {/* Stripe info card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Stripe</h3>
                  <p className="text-sm text-zinc-500">{ru ? 'Оплата курсов через Stripe Checkout' : 'Course payments via Stripe Checkout'}</p>
                </div>
                <Badge variant="outline" className={stripeMode === 'live' ? 'text-red-600 border-red-300' : 'text-green-600 border-green-300'}>
                  {stripeMode === 'live' ? (ru ? 'Боевой режим' : 'Live Mode') : (ru ? 'Тестовый режим' : 'Test Mode')}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('stripe')}>
                  <Settings className="w-4 h-4 mr-2" />{ru ? 'Настройки' : 'Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* Tab: Stripe Settings                               */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeTab === 'stripe' && (
        <>
          {stripeLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Mode Toggle */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        {ru ? 'Режим Stripe' : 'Stripe Mode'}
                      </h2>
                      <p className="text-sm text-zinc-500">
                        {ru ? 'Выберите режим для обработки платежей' : 'Choose the payment processing mode'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setStripeMode('test'); setConnectionResult(null) }}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        stripeMode === 'test'
                          ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      {ru ? 'Тестовый' : 'Test'}
                    </button>
                    <button
                      onClick={() => { setStripeMode('live'); setConnectionResult(null) }}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        stripeMode === 'live'
                          ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      {ru ? 'Боевой' : 'Live'}
                    </button>
                  </div>
                  {stripeMode === 'live' && (
                    <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {ru ? 'Боевой режим обрабатывает реальные платежи! Убедитесь, что ваши ключи корректны.' : 'Live mode processes real payments! Make sure your keys are correct.'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Test Keys */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-2 h-2 rounded-full ${stripeMode === 'test' ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      {ru ? 'Тестовые ключи' : 'Test Keys'}
                    </h3>
                    {stripeMode === 'test' && (
                      <Badge variant="outline" className="text-green-600 border-green-300 text-xs ml-auto">
                        {ru ? 'Активный' : 'Active'}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-4">
                    {renderKeyInput(
                      'Publishable Key',
                      'pk_test_...',
                      testKeys.publishableKey,
                      val => setTestKeys(prev => ({ ...prev, publishableKey: val })),
                      false, true, () => {}
                    )}
                    {renderKeyInput(
                      'Secret Key',
                      'sk_test_...',
                      testKeys.secretKey,
                      val => setTestKeys(prev => ({ ...prev, secretKey: val })),
                      true, showTestSecret, () => setShowTestSecret(!showTestSecret)
                    )}
                    {renderKeyInput(
                      'Webhook Secret',
                      'whsec_...',
                      testKeys.webhookSecret,
                      val => setTestKeys(prev => ({ ...prev, webhookSecret: val })),
                      true, showTestWebhook, () => setShowTestWebhook(!showTestWebhook)
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Live Keys */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-2 h-2 rounded-full ${stripeMode === 'live' ? 'bg-red-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      {ru ? 'Боевые ключи' : 'Live Keys'}
                    </h3>
                    {stripeMode === 'live' && (
                      <Badge variant="outline" className="text-red-600 border-red-300 text-xs ml-auto">
                        {ru ? 'Активный' : 'Active'}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-4">
                    {renderKeyInput(
                      'Publishable Key',
                      'pk_live_...',
                      liveKeys.publishableKey,
                      val => setLiveKeys(prev => ({ ...prev, publishableKey: val })),
                      false, true, () => {}
                    )}
                    {renderKeyInput(
                      'Secret Key',
                      'sk_live_...',
                      liveKeys.secretKey,
                      val => setLiveKeys(prev => ({ ...prev, secretKey: val })),
                      true, showLiveSecret, () => setShowLiveSecret(!showLiveSecret)
                    )}
                    {renderKeyInput(
                      'Webhook Secret',
                      'whsec_...',
                      liveKeys.webhookSecret,
                      val => setLiveKeys(prev => ({ ...prev, webhookSecret: val })),
                      true, showLiveWebhook, () => setShowLiveWebhook(!showLiveWebhook)
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Webhook URL */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                    Webhook URL
                  </h3>
                  <p className="text-sm text-zinc-500 mb-3">
                    {ru
                      ? 'Скопируйте этот URL и вставьте в настройки Webhook в Stripe Dashboard.'
                      : 'Copy this URL and paste it into your Stripe Dashboard webhook settings.'}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-11 px-4 flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono text-sm text-zinc-700 dark:text-zinc-300 overflow-hidden">
                      <span className="truncate">{webhookUrl}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={copyWebhookUrl} className="flex-shrink-0 h-11 px-4">
                      <Copy className="w-4 h-4 mr-2" />
                      {ru ? 'Копировать' : 'Copy'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Connection test result */}
              {connectionResult && (
                <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                  connectionResult.success
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                }`}>
                  {connectionResult.success
                    ? <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    : <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  }
                  <div>
                    <p className={`text-sm font-medium ${connectionResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                      {connectionResult.success
                        ? (ru ? 'Подключение успешно!' : 'Connection successful!')
                        : (ru ? 'Ошибка подключения' : 'Connection failed')
                      }
                    </p>
                    {connectionResult.error && (
                      <p className="text-xs text-red-500 mt-1">{connectionResult.error}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="flex items-center gap-2"
                >
                  {testingConnection ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  {ru ? 'Проверить подключение' : 'Test Connection'}
                </Button>
                <div className="flex-1" />
                <Button variant="outline" onClick={() => window.open(
                  stripeMode === 'live' ? 'https://dashboard.stripe.com/payments' : 'https://dashboard.stripe.com/test/payments',
                  '_blank'
                )}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Stripe Dashboard
                </Button>
                <Button
                  onClick={handleSaveStripe}
                  disabled={stripeSaving}
                  className="bg-teal-500 hover:bg-teal-600 text-white"
                >
                  {stripeSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {ru ? 'Сохранить' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* View Order Modal */}
      <Modal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} title={ru ? 'Детали заказа' : 'Order Details'}>
        {viewOrder && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar src={viewOrder.user_avatar_url || undefined} fallback={getInitials(viewOrder.user_name)} size="lg" />
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{viewOrder.user_name}</h3>
                <p className="text-sm text-zinc-500">{viewOrder.user_email}</p>
              </div>
              <Badge variant={statusConfig[viewOrder.status]?.color as any} className="ml-auto text-sm">
                {ru ? statusConfig[viewOrder.status]?.labelRu : statusConfig[viewOrder.status]?.label}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: ru ? 'Продукт' : 'Product', value: getProductName(viewOrder) },
                { label: ru ? 'Сумма' : 'Amount', value: formatAmount(viewOrder.amount) },
                { label: ru ? 'Создан' : 'Created', value: formatDate(viewOrder.created_at) },
                { label: ru ? 'Оплачен' : 'Paid', value: formatDate(viewOrder.paid_at) },
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
                <Button variant="outline" size="sm" onClick={() => window.open(
                  stripeMode === 'live'
                    ? `https://dashboard.stripe.com/payments/${viewOrder.stripe_payment_intent_id}`
                    : `https://dashboard.stripe.com/test/payments/${viewOrder.stripe_payment_intent_id}`,
                  '_blank'
                )}>
                  <ExternalLink className="w-4 h-4 mr-2" />{ru ? 'Открыть в Stripe' : 'View in Stripe'}
                </Button>
              )}
              <Button variant="ghost" onClick={() => setViewOrder(null)}>{ru ? 'Закрыть' : 'Close'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
