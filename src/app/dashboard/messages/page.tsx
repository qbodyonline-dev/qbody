'use client'
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n'
import { MessageSquare } from 'lucide-react'

export default function MessagesPage() {
  const { locale } = useTranslation()
  const ru = locale === 'ru'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{ru ? 'Сообщения' : 'Messages'}</h1>
        <p className="text-zinc-500 mt-1">{ru ? 'Общение с клиентами' : 'Client communication'}</p>
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            {ru ? 'Сообщений пока нет' : 'No messages yet'}
          </h3>
          <p className="text-zinc-500">
            {ru ? 'Здесь будут отображаться сообщения от клиентов' : 'Client messages will appear here'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
