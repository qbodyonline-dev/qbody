'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import {
  Save, Bell, Mail, Smartphone, Clock,
  CreditCard, BookOpen, MessageSquare, UserPlus, UserX,
  ChevronDown, ChevronRight, Zap, Send, Key, ShieldCheck,
  CheckCircle2, XCircle, RefreshCw, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuth } from '@/lib/api'

interface NotifRule {
  id: string
  nameEn: string
  nameRu: string
  descEn: string
  descRu: string
  category: 'auth' | 'payment' | 'course' | 'message' | 'account'
  icon: any
  color: string
  email: boolean
  emailConfigurable: boolean // Can this be toggled?
  push: boolean
  telegram: boolean
  enabled: boolean
  adminOnly?: boolean // Only sent to admin
  clientOnly?: boolean // Only sent to client
}

export default function NotificationsSettingsPage() {
  const { locale } = useTranslation()
  const ru = locale === 'ru'
  const [isSaving, setIsSaving] = useState(false)
  const [expandedRule, setExpandedRule] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const [loading, setLoading] = useState(true)

  const defaultRules: NotifRule[] = [
    // Authentication
    {
      id: 'welcome',
      nameEn: 'Welcome Email',
      nameRu: 'Приветственное письмо',
      descEn: 'Sent when a new user registers',
      descRu: 'Отправляется при регистрации нового пользователя',
      category: 'auth',
      icon: UserPlus,
      color: 'bg-green-100 text-green-600',
      email: true,
      emailConfigurable: false,
      push: false,
      telegram: false,
      enabled: true,
      clientOnly: true,
    },
    {
      id: 'password_reset',
      nameEn: 'Password Reset',
      nameRu: 'Сброс пароля',
      descEn: 'Sent when user requests password reset',
      descRu: 'Отправляется при запросе сброса пароля',
      category: 'auth',
      icon: Key,
      color: 'bg-amber-100 text-amber-600',
      email: true,
      emailConfigurable: false,
      push: false,
      telegram: false,
      enabled: true,
      clientOnly: true,
    },
    {
      id: 'password_changed',
      nameEn: 'Password Changed by Admin',
      nameRu: 'Пароль изменён админом',
      descEn: 'Sent when admin resets client password',
      descRu: 'Отправляется когда админ сбрасывает пароль клиента',
      category: 'auth',
      icon: ShieldCheck,
      color: 'bg-purple-100 text-purple-600',
      email: true,
      emailConfigurable: false,
      push: false,
      telegram: false,
      enabled: true,
      clientOnly: true,
    },
    // Payments
    {
      id: 'payment_success_client',
      nameEn: 'Payment Confirmation',
      nameRu: 'Подтверждение оплаты',
      descEn: 'Sent to client after successful payment',
      descRu: 'Отправляется клиенту после успешной оплаты',
      category: 'payment',
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-600',
      email: true,
      emailConfigurable: true,
      push: false,
      telegram: false,
      enabled: true,
      clientOnly: true,
    },
    {
      id: 'payment_success_admin',
      nameEn: 'New Payment (Admin)',
      nameRu: 'Новый платёж (Админ)',
      descEn: 'Notify admin about new payment',
      descRu: 'Уведомление админа о новом платеже',
      category: 'payment',
      icon: CreditCard,
      color: 'bg-teal-100 text-teal-600',
      email: true,
      emailConfigurable: true,
      push: false,
      telegram: false,
      enabled: true,
      adminOnly: true,
    },
    {
      id: 'payment_refund_client',
      nameEn: 'Refund Confirmation',
      nameRu: 'Подтверждение возврата',
      descEn: 'Sent to client when payment is refunded',
      descRu: 'Отправляется клиенту при возврате платежа',
      category: 'payment',
      icon: RefreshCw,
      color: 'bg-orange-100 text-orange-600',
      email: true,
      emailConfigurable: true,
      push: false,
      telegram: false,
      enabled: true,
      clientOnly: true,
    },
    {
      id: 'payment_refund_admin',
      nameEn: 'Refund Processed (Admin)',
      nameRu: 'Возврат обработан (Админ)',
      descEn: 'Notify admin about processed refund',
      descRu: 'Уведомление админа об обработанном возврате',
      category: 'payment',
      icon: RefreshCw,
      color: 'bg-red-100 text-red-600',
      email: true,
      emailConfigurable: true,
      push: false,
      telegram: false,
      enabled: true,
      adminOnly: true,
    },
    // Course Access
    {
      id: 'course_access_granted',
      nameEn: 'Course Access Granted',
      nameRu: 'Доступ к курсу открыт',
      descEn: 'Sent when client gets access to a course',
      descRu: 'Отправляется когда клиент получает доступ к курсу',
      category: 'course',
      icon: BookOpen,
      color: 'bg-blue-100 text-blue-600',
      email: true,
      emailConfigurable: true,
      push: false,
      telegram: false,
      enabled: true,
      clientOnly: true,
    },
    {
      id: 'course_access_revoked',
      nameEn: 'Course Access Revoked',
      nameRu: 'Доступ к курсу закрыт',
      descEn: 'Sent when course access is revoked',
      descRu: 'Отправляется когда доступ к курсу отозван',
      category: 'course',
      icon: XCircle,
      color: 'bg-red-100 text-red-600',
      email: true,
      emailConfigurable: true,
      push: false,
      telegram: false,
      enabled: true,
      clientOnly: true,
    },
    // Messages
    {
      id: 'new_message_client',
      nameEn: 'New Message (Client)',
      nameRu: 'Новое сообщение (Клиент)',
      descEn: 'Sent to client when trainer sends a message',
      descRu: 'Отправляется клиенту когда тренер пишет сообщение',
      category: 'message',
      icon: MessageSquare,
      color: 'bg-blue-100 text-blue-600',
      email: true,
      emailConfigurable: true,
      push: false,
      telegram: false,
      enabled: true,
      clientOnly: true,
    },
    {
      id: 'new_message_admin',
      nameEn: 'New Message (Admin)',
      nameRu: 'Новое сообщение (Админ)',
      descEn: 'Sent to admin when client sends a message',
      descRu: 'Отправляется админу когда клиент пишет сообщение',
      category: 'message',
      icon: MessageSquare,
      color: 'bg-purple-100 text-purple-600',
      email: true,
      emailConfigurable: true,
      push: false,
      telegram: false,
      enabled: true,
      adminOnly: true,
    },
    // Account
    {
      id: 'new_client_admin',
      nameEn: 'New Client Registration',
      nameRu: 'Регистрация нового клиента',
      descEn: 'Notify admin about new client registration',
      descRu: 'Уведомление админа о регистрации нового клиента',
      category: 'account',
      icon: UserPlus,
      color: 'bg-teal-100 text-teal-600',
      email: true,
      emailConfigurable: true,
      push: false,
      telegram: false,
      enabled: true,
      adminOnly: true,
    },
    {
      id: 'client_onboarded',
      nameEn: 'Client Onboarded',
      nameRu: 'Клиент добавлен',
      descEn: 'Welcome email when admin creates a client',
      descRu: 'Приветственное письмо когда админ создаёт клиента',
      category: 'account',
      icon: UserPlus,
      color: 'bg-green-100 text-green-600',
      email: true,
      emailConfigurable: false,
      push: false,
      telegram: false,
      enabled: true,
      clientOnly: true,
    },
    {
      id: 'account_deleted',
      nameEn: 'Account Deleted',
      nameRu: 'Аккаунт удалён',
      descEn: 'Confirmation when account is deleted',
      descRu: 'Подтверждение удаления аккаунта',
      category: 'account',
      icon: UserX,
      color: 'bg-red-100 text-red-600',
      email: true,
      emailConfigurable: false,
      push: false,
      telegram: false,
      enabled: true,
    },
  ]

  const [rules, setRules] = useState<NotifRule[]>(defaultRules)

  // Load saved notification settings from DB on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const settings = await res.json()
          const saved = settings.notification_settings
          if (saved && typeof saved === 'object') {
            setRules(prev => prev.map(rule => {
              const override = saved[rule.id]
              if (override) {
                return {
                  ...rule,
                  email: override.email ?? rule.email,
                  push: override.push ?? rule.push,
                  telegram: override.telegram ?? rule.telegram,
                  enabled: override.enabled ?? rule.enabled,
                }
              }
              return rule
            }))
          }
        }
      } catch (err) {
        console.error('Failed to load notification settings:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const categories = [
    { id: 'all', nameEn: 'All', nameRu: 'Все', icon: Bell },
    { id: 'auth', nameEn: 'Authentication', nameRu: 'Аутентификация', icon: Key },
    { id: 'payment', nameEn: 'Payments', nameRu: 'Платежи', icon: CreditCard },
    { id: 'course', nameEn: 'Courses', nameRu: 'Курсы', icon: BookOpen },
    { id: 'message', nameEn: 'Messages', nameRu: 'Сообщения', icon: MessageSquare },
    { id: 'account', nameEn: 'Account', nameRu: 'Аккаунт', icon: UserPlus },
  ]

  const filteredRules = activeCategory === 'all' 
    ? rules 
    : rules.filter(r => r.category === activeCategory)

  const updateRule = (id: string, patch: Partial<NotifRule>) => {
    setRules(rules.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        notification_settings: rules.reduce((acc, r) => ({
          ...acc,
          [r.id]: { email: r.email, push: r.push, telegram: r.telegram, enabled: r.enabled }
        }), {} as Record<string, any>)
      }
      const response = await fetchWithAuth('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('Failed to save')
      toast.success(ru ? 'Настройки уведомлений сохранены!' : 'Notification settings saved!')
    } catch (error) {
      toast.error(ru ? 'Ошибка сохранения' : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const enabledCount = rules.filter(r => r.enabled).length
  const emailCount = rules.filter(r => r.enabled && r.email).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{ru ? 'Уведомления' : 'Notifications'}</h1>
          <p className="text-zinc-500 mt-1">{ru ? 'Настройте email-уведомления для клиентов и админа' : 'Configure email notifications for clients and admin'}</p>
        </div>
        <Button variant="gradient" onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />{isSaving ? '...' : ru ? 'Сохранить' : 'Save'}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="text-xl font-bold">{enabledCount}/{rules.length}</div>
              <div className="text-xs text-zinc-500">{ru ? 'Активных' : 'Active'}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-bold">{emailCount}</div>
              <div className="text-xs text-zinc-500">Email</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-xl font-bold flex items-center gap-1">
                <span className="text-zinc-300">—</span>
              </div>
              <div className="text-xs text-zinc-400">Push <Badge variant="outline" className="ml-1 text-[10px] px-1">Soon</Badge></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
              <Send className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <div className="text-xl font-bold flex items-center gap-1">
                <span className="text-zinc-300">—</span>
              </div>
              <div className="text-xs text-zinc-400">Telegram <Badge variant="outline" className="ml-1 text-[10px] px-1">Soon</Badge></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => {
          const Icon = cat.icon
          const isActive = activeCategory === cat.id
          const count = cat.id === 'all' ? rules.length : rules.filter(r => r.category === cat.id).length
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-zinc-900 text-white' 
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {ru ? cat.nameRu : cat.nameEn}
              <span className={`text-xs ${isActive ? 'text-zinc-400' : 'text-zinc-400'}`}>({count})</span>
            </button>
          )
        })}
      </div>

      {/* Rules */}
      <div className="space-y-3">
        {filteredRules.map(rule => {
          const Icon = rule.icon
          const isExpanded = expandedRule === rule.id
          return (
            <Card key={rule.id} className={!rule.enabled ? 'opacity-60' : ''}>
              <div 
                className="flex items-center gap-4 p-4 cursor-pointer" 
                onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
              >
                <div className={`w-10 h-10 rounded-xl ${rule.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-zinc-900">{ru ? rule.nameRu : rule.nameEn}</p>
                    {rule.adminOnly && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Admin</Badge>
                    )}
                    {rule.clientOnly && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-teal-200 text-teal-600">Client</Badge>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{ru ? rule.descRu : rule.descEn}</p>
                </div>
                <div className="flex items-center gap-2">
                  {rule.email && rule.enabled && <Mail className="w-4 h-4 text-blue-500" />}
                  {rule.push && rule.enabled && <Smartphone className="w-4 h-4 text-zinc-300" />}
                  {rule.telegram && rule.enabled && <Send className="w-4 h-4 text-zinc-300" />}
                </div>
                {rule.emailConfigurable && (
                  <div 
                    className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${
                      rule.enabled ? 'bg-teal-500' : 'bg-zinc-300'
                    }`}
                    onClick={(e) => { e.stopPropagation(); updateRule(rule.id, { enabled: !rule.enabled }) }}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${rule.enabled ? 'translate-x-4' : ''}`} />
                  </div>
                )}
                {!rule.emailConfigurable && (
                  <Badge variant="outline" className="text-[10px]">{ru ? 'Обязат.' : 'Required'}</Badge>
                )}
                {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </div>

              {isExpanded && (
                <CardContent className="pt-0 pb-4 px-4 border-t border-zinc-100">
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-zinc-700 mb-3 block">
                        {ru ? 'Каналы доставки' : 'Delivery channels'}
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {/* Email - always available */}
                        <button 
                          onClick={() => rule.emailConfigurable && updateRule(rule.id, { email: !rule.email })}
                          disabled={!rule.emailConfigurable}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            rule.email 
                              ? 'border-blue-500 bg-blue-50 text-blue-700' 
                              : 'border-zinc-200 text-zinc-400'
                          } ${!rule.emailConfigurable ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                          <Mail className="w-4 h-4" />
                          Email
                          {rule.email && <CheckCircle2 className="w-3 h-3" />}
                        </button>
                        
                        {/* Push - coming soon */}
                        <button 
                          disabled
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium border-zinc-100 text-zinc-300 cursor-not-allowed"
                        >
                          <Smartphone className="w-4 h-4" />
                          Push
                          <Badge variant="outline" className="text-[10px] px-1 ml-1">Soon</Badge>
                        </button>
                        
                        {/* Telegram - coming soon */}
                        <button 
                          disabled
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium border-zinc-100 text-zinc-300 cursor-not-allowed"
                        >
                          <Send className="w-4 h-4" />
                          Telegram
                          <Badge variant="outline" className="text-[10px] px-1 ml-1">Soon</Badge>
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-zinc-50 rounded-xl">
                      <p className="text-xs text-zinc-500">
                        {ru 
                          ? 'Push-уведомления и Telegram будут доступны после запуска мобильного приложения.' 
                          : 'Push notifications and Telegram will be available after the mobile app launch.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm text-zinc-900">{ru ? 'О системе уведомлений' : 'About notifications'}</p>
              <p className="text-xs text-zinc-500 mt-1">
                {ru 
                  ? 'Email-уведомления отправляются автоматически через Resend. Все письма на английском языке. Push-уведомления и интеграция с Telegram будут добавлены в будущих версиях.' 
                  : 'Email notifications are sent automatically via Resend. All emails are in English. Push notifications and Telegram integration will be added in future versions.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
