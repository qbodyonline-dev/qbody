'use client'
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import {
  Save, Bell, Mail, Smartphone, Clock, AlertTriangle,
  Calendar, CreditCard, Dumbbell, ClipboardCheck, MessageSquare,
  ChevronDown, ChevronRight, Settings, Zap, Send
} from 'lucide-react'
import { toast } from 'sonner'

interface NotifRule {
  id: string
  nameEn: string
  nameRu: string
  descEn: string
  descRu: string
  trigger: string
  icon: any
  color: string
  email: boolean
  push: boolean
  telegram: boolean
  enabled: boolean
  timing: string // e.g. "1h before", "immediately", "3 days before"
}

export default function NotificationsSettingsPage() {
  const { locale } = useTranslation()
  const ru = locale === 'ru'
  const [isSaving, setIsSaving] = useState(false)
  const [expandedRule, setExpandedRule] = useState<string | null>(null)

  const [rules, setRules] = useState<NotifRule[]>([
    { id: 'r1', nameEn: 'Missed Workout', nameRu: 'Пропущенная тренировка', descEn: 'When client misses a scheduled workout', descRu: 'Когда клиент пропускает запланированную тренировку', trigger: 'missed_workout', icon: Dumbbell, color: 'bg-red-100 text-red-600', email: true, push: true, telegram: false, enabled: true, timing: 'immediately' },
    { id: 'r2', nameEn: 'Check-in Reminder', nameRu: 'Напоминание о чек-ине', descEn: 'Remind client to submit weekly check-in', descRu: 'Напомнить клиенту о еженедельном чек-ине', trigger: 'checkin_due', icon: ClipboardCheck, color: 'bg-orange-100 text-orange-600', email: true, push: true, telegram: true, enabled: true, timing: '1h_before' },
    { id: 'r3', nameEn: 'Payment Due', nameRu: 'Оплата скоро', descEn: 'Remind about upcoming subscription renewal', descRu: 'Напоминание о предстоящем продлении подписки', trigger: 'payment_due', icon: CreditCard, color: 'bg-amber-100 text-amber-600', email: true, push: false, telegram: true, enabled: true, timing: '3d_before' },
    { id: 'r4', nameEn: 'Payment Overdue', nameRu: 'Просроченная оплата', descEn: 'When payment is overdue', descRu: 'Когда оплата просрочена', trigger: 'payment_overdue', icon: AlertTriangle, color: 'bg-red-100 text-red-600', email: true, push: true, telegram: true, enabled: true, timing: 'immediately' },
    { id: 'r5', nameEn: 'New Message', nameRu: 'Новое сообщение', descEn: 'When client sends a new message', descRu: 'Когда клиент отправляет новое сообщение', trigger: 'new_message', icon: MessageSquare, color: 'bg-blue-100 text-blue-600', email: false, push: true, telegram: true, enabled: true, timing: 'immediately' },
    { id: 'r6', nameEn: 'Program Starting', nameRu: 'Начало программы', descEn: 'Remind client that program starts soon', descRu: 'Напомнить клиенту о скором начале программы', trigger: 'program_start', icon: Calendar, color: 'bg-teal-100 text-teal-600', email: true, push: true, telegram: false, enabled: true, timing: '1d_before' },
    { id: 'r7', nameEn: 'Workout Completed', nameRu: 'Тренировка завершена', descEn: 'Notify trainer when client completes workout', descRu: 'Уведомить тренера о завершении тренировки клиентом', trigger: 'workout_done', icon: Dumbbell, color: 'bg-green-100 text-green-600', email: false, push: true, telegram: false, enabled: false, timing: 'immediately' },
    { id: 'r8', nameEn: 'Inactive Client', nameRu: 'Неактивный клиент', descEn: 'When client is inactive for 7+ days', descRu: 'Когда клиент неактивен 7+ дней', trigger: 'client_inactive', icon: Clock, color: 'bg-gray-100 text-gray-600', email: true, push: false, telegram: true, enabled: true, timing: '7d_after' },
  ])

  const updateRule = (id: string, patch: Partial<NotifRule>) => setRules(rules.map(r => r.id === id ? { ...r, ...patch } : r))
  const handleSave = async () => { setIsSaving(true); await new Promise(r => setTimeout(r, 800)); toast.success(ru ? 'Настройки уведомлений сохранены!' : 'Notification settings saved!'); setIsSaving(false) }

  const timingOptions = [
    { v: 'immediately', en: 'Immediately', ru: 'Сразу' },
    { v: '15m_before', en: '15 min before', ru: 'За 15 мин' },
    { v: '1h_before', en: '1 hour before', ru: 'За 1 час' },
    { v: '3h_before', en: '3 hours before', ru: 'За 3 часа' },
    { v: '1d_before', en: '1 day before', ru: 'За 1 день' },
    { v: '3d_before', en: '3 days before', ru: 'За 3 дня' },
    { v: '7d_after', en: '7 days after', ru: 'Через 7 дней' },
  ]

  const enabledCount = rules.filter(r => r.enabled).length

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{ru ? 'Уведомления' : 'Notifications'}</h1>
          <p className="text-zinc-500 mt-1">{ru ? 'Настройте автоматические уведомления для клиентов' : 'Configure automatic notifications for clients'}</p>
        </div>
        <Button variant="gradient" onClick={handleSave} disabled={isSaving}><Save className="w-4 h-4 mr-2" />{isSaving ? '...' : ru ? 'Сохранить' : 'Save'}</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center"><Zap className="w-5 h-5 text-teal-600" /></div>
          <div><div className="text-xl font-bold">{enabledCount}/{rules.length}</div><div className="text-xs text-zinc-500">{ru ? 'Активных' : 'Active'}</div></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Mail className="w-5 h-5 text-blue-600" /></div>
          <div><div className="text-xl font-bold">{rules.filter(r => r.enabled && r.email).length}</div><div className="text-xs text-zinc-500">Email</div></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><Send className="w-5 h-5 text-purple-600" /></div>
          <div><div className="text-xl font-bold">{rules.filter(r => r.enabled && r.telegram).length}</div><div className="text-xs text-zinc-500">Telegram</div></div>
        </CardContent></Card>
      </div>

      {/* Rules */}
      <div className="space-y-3">
        {rules.map(rule => {
          const Icon = rule.icon
          const isExpanded = expandedRule === rule.id
          return (
            <Card key={rule.id} className={!rule.enabled ? 'opacity-60' : ''}>
              <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpandedRule(isExpanded ? null : rule.id)}>
                <div className={`w-10 h-10 rounded-xl ${rule.color} flex items-center justify-center flex-shrink-0`}><Icon className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-zinc-900">{ru ? rule.nameRu : rule.nameEn}</p>
                  <p className="text-xs text-zinc-400 truncate">{ru ? rule.descRu : rule.descEn}</p>
                </div>
                <div className="flex items-center gap-2">
                  {rule.email && <Mail className="w-4 h-4 text-zinc-400" />}
                  {rule.push && <Smartphone className="w-4 h-4 text-zinc-400" />}
                  {rule.telegram && <Send className="w-4 h-4 text-zinc-400" />}
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${rule.enabled ? 'bg-teal-500' : 'bg-zinc-300'}`}
                  onClick={(e) => { e.stopPropagation(); updateRule(rule.id, { enabled: !rule.enabled }) }}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${rule.enabled ? 'translate-x-4' : ''}`} />
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </div>

              {isExpanded && (
                <CardContent className="pt-0 pb-4 px-4 border-t border-zinc-100">
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-zinc-700 mb-3 block">{ru ? 'Каналы доставки' : 'Delivery channels'}</label>
                      <div className="flex gap-3">
                        {[
                          { key: 'email' as const, icon: Mail, label: 'Email' },
                          { key: 'push' as const, icon: Smartphone, label: 'Push' },
                          { key: 'telegram' as const, icon: Send, label: 'Telegram' },
                        ].map(ch => (
                          <button key={ch.key} onClick={() => updateRule(rule.id, { [ch.key]: !rule[ch.key] })}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${rule[ch.key] ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-zinc-200 text-zinc-400'}`}>
                            <ch.icon className="w-4 h-4" />{ch.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-700 mb-1.5 block">{ru ? 'Когда отправлять' : 'When to send'}</label>
                      <select className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm" value={rule.timing}
                        onChange={e => updateRule(rule.id, { timing: e.target.value })}>
                        {timingOptions.map(o => <option key={o.v} value={o.v}>{ru ? o.ru : o.en}</option>)}
                      </select>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input label={ru ? 'Текст (EN)' : 'Message (EN)'} defaultValue={rule.nameEn} />
                      <Input label={ru ? 'Текст (RU)' : 'Message (RU)'} defaultValue={rule.nameRu} />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
