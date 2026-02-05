'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { 
  MessageSquare, 
  Send, 
  Check, 
  CheckCheck,
  Clock,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ru as ruLocale, enUS } from 'date-fns/locale'

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
    role: string
  }
}

type Conversation = {
  id: string
  client_id: string
  admin_id: string | null
  status: string
  last_message_at: string
  created_at: string
  unread_count: number
}

export default function ClientMessagesPage() {
  const { locale } = useTranslation()
  const { session, user, profile } = useAuth()
  const ru = locale === 'ru'
  
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  // Initialize Supabase client
  useEffect(() => {
    if (typeof window !== 'undefined' && !supabaseRef.current) {
      supabaseRef.current = createClient()
    }
  }, [])

  // Fetch conversation
  const fetchConversation = useCallback(async () => {
    if (!session?.access_token) return
    
    try {
      const res = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setConversation(data)
        if (data?.id) {
          fetchMessages(data.id)
        }
      }
    } catch (error) {
      console.error('Error fetching conversation:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  // Fetch messages
  const fetchMessages = async (conversationId: string) => {
    if (!session?.access_token) return
    
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        
        // Mark messages as read
        await fetch(`/api/conversations/${conversationId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ mark_read: true })
        })
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  // Initial fetch
  useEffect(() => {
    if (session?.access_token) {
      fetchConversation()
    }
  }, [session?.access_token, fetchConversation])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time subscription for new messages
  useEffect(() => {
    if (!supabaseRef.current || !conversation) return

    const channel = supabaseRef.current
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        async () => {
          // Fetch the full message with sender info
          const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
            headers: {
              'Authorization': `Bearer ${session?.access_token}`
            }
          })
          if (res.ok) {
            const data = await res.json()
            setMessages(data || [])
          }
        }
      )
      .subscribe()

    return () => {
      supabaseRef.current?.removeChannel(channel)
    }
  }, [conversation, session?.access_token])

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session?.access_token) return
    
    setSendingMessage(true)
    try {
      // If no conversation exists, create one
      if (!conversation) {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: newMessage.trim() })
        })
        
        if (res.ok) {
          const data = await res.json()
          setConversation(data)
          setNewMessage('')
          // Fetch messages for new conversation
          setTimeout(() => fetchMessages(data.id), 500)
        }
      } else {
        // Add message to existing conversation
        const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: newMessage.trim() })
        })
        
        if (res.ok) {
          const message = await res.json()
          setMessages(prev => [...prev, message])
          setNewMessage('')
          inputRef.current?.focus()
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Format time
  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true,
      locale: ru ? ruLocale : enUS
    })
  }

  // Get initials
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {ru ? 'Поддержка' : 'Support'}
        </h1>
        <p className="text-zinc-500 mt-1">
          {ru ? 'Напишите нам, мы поможем!' : 'Message us, we are here to help!'}
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col h-[60vh] min-h-[400px]">
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-3 bg-gradient-to-r from-teal-500 to-teal-600">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">
                {ru ? 'Служба поддержки' : 'Support Team'}
              </h3>
              <p className="text-xs text-white/80">
                {ru ? 'Обычно отвечаем в течение нескольких часов' : 'Usually reply within a few hours'}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-900/50">
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-teal-500" />
                </div>
                <h3 className="font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  {ru ? 'Добро пожаловать в чат поддержки!' : 'Welcome to support chat!'}
                </h3>
                <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                  {ru 
                    ? 'Напишите ваш вопрос и мы ответим как можно скорее.'
                    : 'Send your question and we will respond as soon as possible.'
                  }
                </p>
              </div>
            )}
            
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id
              const isAdmin = msg.sender?.role === 'admin' || msg.sender?.role === 'trainer'
              
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    isOwn ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[80%] flex items-end gap-2",
                    isOwn && "flex-row-reverse"
                  )}>
                    {!isOwn && (
                      <Avatar 
                        fallback={isAdmin ? 'QS' : getInitials(msg.sender?.full_name, msg.sender?.email)} 
                        src={msg.sender?.avatar_url || undefined}
                        size="sm" 
                        className={isAdmin ? "bg-teal-500" : undefined}
                      />
                    )}
                    <div>
                      {!isOwn && (
                        <p className="text-xs text-zinc-500 mb-1 ml-1">
                          {isAdmin ? (ru ? 'Поддержка' : 'Support') : msg.sender?.full_name || msg.sender?.email}
                        </p>
                      )}
                      <div className={cn(
                        "rounded-2xl px-4 py-2",
                        isOwn 
                          ? "bg-teal-500 text-white rounded-br-md"
                          : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-md shadow-sm"
                      )}>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 mt-1 text-xs text-zinc-400",
                        isOwn && "justify-end"
                      )}>
                        <Clock className="w-3 h-3" />
                        {formatTime(msg.created_at)}
                        {isOwn && (
                          msg.is_read 
                            ? <CheckCheck className="w-3 h-3 text-teal-500" />
                            : <Check className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={ru ? 'Введите сообщение...' : 'Type a message...'}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 max-h-32"
                style={{ minHeight: '44px' }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendingMessage}
                className="h-11 w-11 p-0 rounded-xl"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-zinc-400 mt-2 text-center">
              {ru ? 'Enter для отправки' : 'Press Enter to send'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
