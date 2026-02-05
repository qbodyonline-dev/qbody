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
  Search, 
  MoreVertical, 
  Check, 
  CheckCheck,
  ArrowLeft,
  User,
  Clock
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
  client: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  }
  unread_count: number
  last_message?: Message
}

export default function MessagesPage() {
  const { locale } = useTranslation()
  const { session, user } = useAuth()
  const ru = locale === 'ru'
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileView, setIsMobileView] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  // Initialize Supabase client
  useEffect(() => {
    if (typeof window !== 'undefined' && !supabaseRef.current) {
      supabaseRef.current = createClient()
    }
  }, [])

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!session?.access_token) return
    
    try {
      const res = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setConversations(data || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
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
        
        // Update unread count in conversation list
        setConversations(prev => prev.map(c => 
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        ))
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }, [session?.access_token])

  // Initial fetch
  useEffect(() => {
    if (session?.access_token) {
      fetchConversations()
    }
  }, [session?.access_token, fetchConversations])

  // Fetch messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation, fetchMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time subscription for new messages
  useEffect(() => {
    if (!supabaseRef.current || !selectedConversation) return

    const channel = supabaseRef.current
      .channel(`messages:${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        async (payload) => {
          // Fetch the full message with sender info
          const res = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
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
  }, [selectedConversation, session?.access_token])

  // Real-time subscription for conversation updates
  useEffect(() => {
    if (!supabaseRef.current) return

    const channel = supabaseRef.current
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabaseRef.current?.removeChannel(channel)
    }
  }, [fetchConversations])

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !session?.access_token) return
    
    setSendingMessage(true)
    try {
      const res = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
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
        
        // Update conversation in list
        setConversations(prev => {
          const updated = prev.map(c => 
            c.id === selectedConversation.id 
              ? { ...c, last_message_at: new Date().toISOString(), last_message: message }
              : c
          )
          return updated.sort((a, b) => 
            new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
          )
        })
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

  // Select conversation
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv)
    if (isMobileView) {
      setShowMobileChat(true)
    }
  }

  // Back to list on mobile
  const handleBackToList = () => {
    setShowMobileChat(false)
    setSelectedConversation(null)
  }

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    const name = conv.client?.full_name || conv.client?.email || ''
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

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

  // Empty state
  if (conversations.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {ru ? 'Сообщения' : 'Messages'}
          </h1>
          <p className="text-zinc-500 mt-1">
            {ru ? 'Общение с клиентами' : 'Client communication'}
          </p>
        </div>

        <Card>
          <CardContent className="py-16 text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              {ru ? 'Сообщений пока нет' : 'No messages yet'}
            </h3>
            <p className="text-zinc-500">
              {ru ? 'Когда клиенты напишут вам, сообщения появятся здесь' : 'When clients message you, they will appear here'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {ru ? 'Сообщения' : 'Messages'}
        </h1>
        <p className="text-zinc-500 mt-1">
          {ru ? 'Общение с клиентами' : 'Client communication'}
        </p>
      </div>

      <Card className="h-[calc(100%-4rem)] overflow-hidden">
        <div className="flex h-full">
          {/* Conversations list */}
          <div className={cn(
            "w-full md:w-80 lg:w-96 border-r border-zinc-200 dark:border-zinc-700 flex flex-col",
            isMobileView && showMobileChat && "hidden"
          )}>
            {/* Search */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder={ru ? 'Поиск...' : 'Search...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={cn(
                    "w-full p-4 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left border-b border-zinc-100 dark:border-zinc-800",
                    selectedConversation?.id === conv.id && "bg-teal-50 dark:bg-teal-900/20"
                  )}
                >
                  <Avatar 
                    fallback={getInitials(conv.client?.full_name, conv.client?.email)} 
                    src={conv.client?.avatar_url || undefined}
                    size="md" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {conv.client?.full_name || conv.client?.email}
                      </span>
                      <span className="text-xs text-zinc-400 whitespace-nowrap">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-zinc-500 truncate">
                        {conv.last_message?.content || (ru ? 'Нет сообщений' : 'No messages')}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-teal-500 text-white rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className={cn(
            "flex-1 flex flex-col",
            isMobileView && !showMobileChat && "hidden"
          )}>
            {selectedConversation ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-3">
                  {isMobileView && (
                    <button onClick={handleBackToList} className="mr-2">
                      <ArrowLeft className="w-5 h-5 text-zinc-600" />
                    </button>
                  )}
                  <Avatar 
                    fallback={getInitials(selectedConversation.client?.full_name, selectedConversation.client?.email)} 
                    src={selectedConversation.client?.avatar_url || undefined}
                    size="md" 
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                      {selectedConversation.client?.full_name || selectedConversation.client?.email}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {selectedConversation.client?.email}
                    </p>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    selectedConversation.status === 'open' 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  )}>
                    {selectedConversation.status === 'open' 
                      ? (ru ? 'Открыт' : 'Open')
                      : (ru ? 'Закрыт' : 'Closed')
                    }
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-900/50">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400">
                      {ru ? 'Нет сообщений в этом чате' : 'No messages in this chat'}
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          <div className={cn(
                            "max-w-[75%] flex items-end gap-2",
                            isOwn && "flex-row-reverse"
                          )}>
                            {!isOwn && (
                              <Avatar 
                                fallback={getInitials(msg.sender?.full_name, msg.sender?.email)} 
                                src={msg.sender?.avatar_url || undefined}
                                size="sm" 
                              />
                            )}
                            <div>
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
                    })
                  )}
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
                  <p className="text-xs text-zinc-400 mt-2">
                    {ru ? 'Enter для отправки, Shift+Enter для новой строки' : 'Enter to send, Shift+Enter for new line'}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
                  <p className="text-zinc-500">
                    {ru ? 'Выберите чат для начала общения' : 'Select a chat to start messaging'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
