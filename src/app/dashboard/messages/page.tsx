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
  Check, 
  CheckCheck,
  ArrowLeft,
  Clock,
  Users,
  MessageCirclePlus,
  X,
  Image as ImageIcon,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ru as ruLocale, enUS } from 'date-fns/locale'

type Attachment = {
  url: string
  type: string
  name?: string
}

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  attachments?: Attachment[]
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

type Client = {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  role: string
  created_at: string
}

export default function MessagesPage() {
  const { locale } = useTranslation()
  const { session, user } = useAuth()
  const ru = locale === 'ru'
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [allClients, setAllClients] = useState<Client[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileView, setIsMobileView] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'chats' | 'clients'>('chats')
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  // Fetch all clients
  const fetchClients = useCallback(async () => {
    if (!session?.access_token) return
    
    try {
      const res = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setAllClients(data || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }, [session?.access_token])

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
      fetchClients()
    }
  }, [session?.access_token, fetchConversations, fetchClients])

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
        async () => {
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

  // Start new chat with a client
  const startChatWithClient = async (client: Client) => {
    if (!session?.access_token) return
    
    // Check if conversation already exists
    const existingConv = conversations.find(c => c.client_id === client.id)
    if (existingConv) {
      setSelectedConversation(existingConv)
      setSelectedClient(null)
      setShowNewChatModal(false)
      setActiveTab('chats')
      if (isMobileView) setShowMobileChat(true)
      return
    }
    
    // Set selected client for new chat
    setSelectedClient(client)
    setSelectedConversation(null)
    setMessages([])
    setShowNewChatModal(false)
    setActiveTab('chats')
    if (isMobileView) setShowMobileChat(true)
  }

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(ru ? 'Можно загружать только изображения' : 'Only images are allowed')
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(ru ? 'Максимальный размер файла 5MB' : 'Maximum file size is 5MB')
      return
    }
    
    setUploadingImage(true)
    
    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'chat-attachments')
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: formData
      })
      
      if (res.ok) {
        const data = await res.json()
        setPendingAttachments(prev => [...prev, {
          url: data.url,
          type: file.type,
          name: file.name
        }])
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(ru ? 'Ошибка загрузки изображения' : 'Failed to upload image')
      setImagePreview(null)
    } finally {
      setUploadingImage(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Remove pending attachment
  const removePendingAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index))
    if (pendingAttachments.length === 1) {
      setImagePreview(null)
    }
  }

  // Send message
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && pendingAttachments.length === 0) || !session?.access_token) return
    if (!selectedConversation && !selectedClient) return
    
    setSendingMessage(true)
    try {
      if (selectedClient && !selectedConversation) {
        // Create new conversation with first message
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            client_id: selectedClient.id,
            message: newMessage.trim() || null,
            attachments: pendingAttachments
          })
        })
        
        if (res.ok) {
          const conversation = await res.json()
          setNewMessage('')
          setPendingAttachments([])
          setImagePreview(null)
          // Refresh conversations list
          await fetchConversations()
          // Find the new conversation and select it
          const newConv = {
            ...conversation,
            client: selectedClient,
            unread_count: 0
          }
          setSelectedConversation(newConv)
          setSelectedClient(null)
          // Fetch messages for new conversation
          setTimeout(() => fetchMessages(conversation.id), 500)
        }
      } else if (selectedConversation) {
        // Add message to existing conversation
        const res = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            content: newMessage.trim() || null,
            attachments: pendingAttachments
          })
        })
        
        if (res.ok) {
          const message = await res.json()
          setMessages(prev => [...prev, message])
          setNewMessage('')
          setPendingAttachments([])
          setImagePreview(null)
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
    setSelectedClient(null)
    if (isMobileView) {
      setShowMobileChat(true)
    }
  }

  // Back to list on mobile
  const handleBackToList = () => {
    setShowMobileChat(false)
    setSelectedConversation(null)
    setSelectedClient(null)
  }

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    const name = conv.client?.full_name || conv.client?.email || ''
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Filter clients by search (exclude those with existing conversations)
  const clientsWithoutChat = allClients.filter(client => {
    const hasConversation = conversations.some(c => c.client_id === client.id)
    return !hasConversation
  })

  const filteredClients = allClients.filter(client => {
    const name = client.full_name || client.email || ''
    return name.toLowerCase().includes(clientSearchQuery.toLowerCase())
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

  // Get current chat info
  const currentChatClient = selectedConversation?.client || selectedClient

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {ru ? 'Сообщения' : 'Messages'}
          </h1>
          <p className="text-zinc-500 mt-1">
            {ru ? 'Общение с клиентами' : 'Client communication'}
          </p>
        </div>
        <Button
          onClick={() => setShowNewChatModal(true)}
          className="gap-2"
        >
          <MessageCirclePlus className="w-4 h-4" />
          {ru ? 'Новый чат' : 'New Chat'}
        </Button>
      </div>

      <Card className="h-[calc(100%-4rem)] overflow-hidden">
        <div className="flex h-full">
          {/* Conversations/Clients list */}
          <div className={cn(
            "w-full md:w-80 lg:w-96 border-r border-zinc-200 dark:border-zinc-700 flex flex-col",
            isMobileView && showMobileChat && "hidden"
          )}>
            {/* Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setActiveTab('chats')}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === 'chats'
                    ? "text-teal-600 border-b-2 border-teal-500"
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                {ru ? 'Чаты' : 'Chats'}
                {conversations.length > 0 && (
                  <span className="ml-1 text-xs bg-zinc-200 dark:bg-zinc-700 px-1.5 rounded-full">
                    {conversations.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('clients')}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === 'clients'
                    ? "text-teal-600 border-b-2 border-teal-500"
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                <Users className="w-4 h-4 inline mr-2" />
                {ru ? 'Клиенты' : 'Clients'}
                <span className="ml-1 text-xs bg-zinc-200 dark:bg-zinc-700 px-1.5 rounded-full">
                  {allClients.length}
                </span>
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder={ru ? 'Поиск...' : 'Search...'}
                  value={activeTab === 'chats' ? searchQuery : clientSearchQuery}
                  onChange={(e) => activeTab === 'chats' 
                    ? setSearchQuery(e.target.value) 
                    : setClientSearchQuery(e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'chats' ? (
                // Conversations list
                filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-zinc-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{ru ? 'Нет активных чатов' : 'No active chats'}</p>
                    <p className="text-sm mt-1">
                      {ru ? 'Начните чат с клиентом' : 'Start a chat with a client'}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
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
                  ))
                )
              ) : (
                // Clients list
                filteredClients.length === 0 ? (
                  <div className="p-8 text-center text-zinc-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{ru ? 'Клиенты не найдены' : 'No clients found'}</p>
                  </div>
                ) : (
                  filteredClients.map((client) => {
                    const hasChat = conversations.some(c => c.client_id === client.id)
                    return (
                      <button
                        key={client.id}
                        onClick={() => startChatWithClient(client)}
                        className="w-full p-4 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left border-b border-zinc-100 dark:border-zinc-800"
                      >
                        <Avatar 
                          fallback={getInitials(client.full_name, client.email)} 
                          src={client.avatar_url || undefined}
                          size="md" 
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate block">
                            {client.full_name || client.email}
                          </span>
                          <span className="text-sm text-zinc-500 truncate block">
                            {client.email}
                          </span>
                        </div>
                        {hasChat ? (
                          <span className="text-xs bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 px-2 py-1 rounded-full">
                            {ru ? 'Есть чат' : 'Has chat'}
                          </span>
                        ) : (
                          <MessageCirclePlus className="w-5 h-5 text-zinc-400" />
                        )}
                      </button>
                    )
                  })
                )
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className={cn(
            "flex-1 flex flex-col",
            isMobileView && !showMobileChat && "hidden"
          )}>
            {currentChatClient ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-3">
                  {isMobileView && (
                    <button onClick={handleBackToList} className="mr-2">
                      <ArrowLeft className="w-5 h-5 text-zinc-600" />
                    </button>
                  )}
                  <Avatar 
                    fallback={getInitials(currentChatClient.full_name, currentChatClient.email)} 
                    src={currentChatClient.avatar_url || undefined}
                    size="md" 
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                      {currentChatClient.full_name || currentChatClient.email}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {currentChatClient.email}
                    </p>
                  </div>
                  {selectedConversation && (
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
                  )}
                  {selectedClient && !selectedConversation && (
                    <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {ru ? 'Новый чат' : 'New chat'}
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-900/50">
                  {messages.length === 0 && selectedClient && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-4">
                        <MessageCirclePlus className="w-8 h-8 text-teal-500" />
                      </div>
                      <h3 className="font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        {ru ? 'Начните диалог' : 'Start a conversation'}
                      </h3>
                      <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                        {ru 
                          ? `Напишите первое сообщение для ${selectedClient.full_name || selectedClient.email}`
                          : `Send the first message to ${selectedClient.full_name || selectedClient.email}`
                        }
                      </p>
                    </div>
                  )}
                  
                  {messages.length === 0 && selectedConversation && (
                    <div className="text-center py-8 text-zinc-400">
                      {ru ? 'Нет сообщений в этом чате' : 'No messages in this chat'}
                    </div>
                  )}
                  
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id
                    const hasAttachments = msg.attachments && msg.attachments.length > 0
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
                            {/* Attachments */}
                            {hasAttachments && (
                              <div className={cn(
                                "mb-1 space-y-1",
                                isOwn && "flex flex-col items-end"
                              )}>
                                {msg.attachments!.map((att, idx) => (
                                  <a 
                                    key={idx} 
                                    href={att.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <img 
                                      src={att.url} 
                                      alt={att.name || 'Attachment'} 
                                      className={cn(
                                        "max-w-[250px] max-h-[300px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity",
                                        isOwn ? "rounded-br-md" : "rounded-bl-md"
                                      )}
                                    />
                                  </a>
                                ))}
                              </div>
                            )}
                            {/* Text content */}
                            {msg.content && (
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
                            )}
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
                  {/* Pending attachments preview */}
                  {pendingAttachments.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {pendingAttachments.map((att, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={att.url} 
                            alt={att.name || 'Attachment'} 
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removePendingAttachment(idx)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {uploadingImage && (
                        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-end gap-2">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    
                    {/* Image upload button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="h-11 w-11 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 hover:text-teal-500 hover:border-teal-500 transition-colors disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <ImageIcon className="w-5 h-5" />
                      )}
                    </button>
                    
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
                      disabled={(!newMessage.trim() && pendingAttachments.length === 0) || sendingMessage}
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
                  <p className="text-zinc-500 mb-4">
                    {ru ? 'Выберите чат или начните новый' : 'Select a chat or start a new one'}
                  </p>
                  <Button onClick={() => setActiveTab('clients')} variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    {ru ? 'Посмотреть клиентов' : 'View clients'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowNewChatModal(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {ru ? 'Начать новый чат' : 'Start new chat'}
              </h3>
              <button onClick={() => setShowNewChatModal(false)}>
                <X className="w-5 h-5 text-zinc-400 hover:text-zinc-600" />
              </button>
            </div>
            
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder={ru ? 'Поиск клиента...' : 'Search client...'}
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {clientsWithoutChat.filter(c => {
                const name = c.full_name || c.email || ''
                return name.toLowerCase().includes(clientSearchQuery.toLowerCase())
              }).map(client => (
                <button
                  key={client.id}
                  onClick={() => startChatWithClient(client)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left border-b border-zinc-100 dark:border-zinc-800"
                >
                  <Avatar 
                    fallback={getInitials(client.full_name, client.email)} 
                    src={client.avatar_url || undefined}
                    size="md" 
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate block">
                      {client.full_name || client.email}
                    </span>
                    <span className="text-sm text-zinc-500 truncate block">
                      {client.email}
                    </span>
                  </div>
                  <MessageCirclePlus className="w-5 h-5 text-teal-500" />
                </button>
              ))}
              
              {clientsWithoutChat.length === 0 && (
                <div className="p-8 text-center text-zinc-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{ru ? 'Все клиенты уже имеют чаты' : 'All clients already have chats'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
