'use client'
import React, { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useTranslation } from '@/lib/i18n'
import { Search, Send, CheckCheck, Image as ImageIcon, Paperclip, X, File, Camera } from 'lucide-react'
import { toast } from 'sonner'

type Message = { id: number; from: 'client' | 'trainer'; text: string; time: string; attachment?: { name: string; type: 'file' | 'image'; url?: string } }
type Conversation = { id: string; client: string; initials: string; lastMessage: string; time: string; unread: number; online: boolean }

const messagesEn: Record<string, Message[]> = {
  '1': [
    { id: 1, from: 'client', text: 'Hi! I did the workout today, it was really tough 💪', time: '09:15' },
    { id: 2, from: 'trainer', text: 'Great job, Anna! How did you feel after the squats? Any knee discomfort?', time: '09:20' },
    { id: 3, from: 'client', text: 'No pain at all! I think the warm-up routine you suggested really helps', time: '09:45' },
    { id: 4, from: 'trainer', text: "Perfect! Keep doing 3x12 this week. Next week we'll increase to 3x15. Don't forget your check-in on Friday 📋", time: '10:00' },
    { id: 5, from: 'client', text: 'Got it! Also, quick question about nutrition — can I replace chicken with fish in the meal plan?', time: '10:15' },
    { id: 6, from: 'client', text: 'Thank you for the feedback! 🙏', time: '10:30' },
  ],
  '2': [
    { id: 1, from: 'client', text: 'Good evening! I have a question about the recovery program.', time: '18:00' },
    { id: 2, from: 'trainer', text: 'Hi Maria! Of course, what would you like to know?', time: '18:30' },
  ],
  '3': [
    { id: 1, from: 'client', text: 'When is our next session?', time: '14:00' },
  ],
}

const messagesRu: Record<string, Message[]> = {
  '1': [
    { id: 1, from: 'client', text: 'Привет! Сегодня сделала тренировку, было тяжело 💪', time: '09:15' },
    { id: 2, from: 'trainer', text: 'Молодец, Анна! Как себя чувствуешь после приседаний? Колени не беспокоят?', time: '09:20' },
    { id: 3, from: 'client', text: 'Боли нет совсем! Думаю, разминка, которую вы предложили, очень помогает', time: '09:45' },
    { id: 4, from: 'trainer', text: 'Отлично! Продолжай 3x12 на этой неделе. На следующей увеличим до 3x15. Не забудь чек-ин в пятницу 📋', time: '10:00' },
    { id: 5, from: 'client', text: 'Поняла! И ещё вопрос по питанию — можно заменить курицу на рыбу в плане?', time: '10:15' },
    { id: 6, from: 'client', text: 'Спасибо за обратную связь! 🙏', time: '10:30' },
  ],
  '2': [
    { id: 1, from: 'client', text: 'Добрый вечер! У меня вопрос по программе восстановления.', time: '18:00' },
    { id: 2, from: 'trainer', text: 'Привет, Мария! Конечно, что именно интересует?', time: '18:30' },
  ],
  '3': [
    { id: 1, from: 'client', text: 'Когда наша следующая тренировка?', time: '14:00' },
  ],
}

const baseConversations: Conversation[] = [
  { id: '1', client: 'Anna K.', initials: 'AK', lastMessage: '', time: '10:30', unread: 2, online: true },
  { id: '2', client: 'Maria S.', initials: 'MS', lastMessage: '', time: 'Yesterday', unread: 0, online: false },
  { id: '3', client: 'Elena P.', initials: 'EP', lastMessage: '', time: 'Yesterday', unread: 1, online: true },
]

export default function MessagesPage() {
  const { t, locale } = useTranslation()
  const [selected, setSelected] = useState(baseConversations[0])
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>(locale === 'ru' ? messagesRu : messagesEn)
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; type: 'file' | 'image'; preview?: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const currentMsgs = locale === 'ru' ? messagesRu : messagesEn

  // Localized conversations with last message
  const localizedConversations = baseConversations.map(c => ({
    ...c,
    lastMessage: (currentMsgs[c.id]?.slice(-1)[0]?.text || '').slice(0, 40) + '...',
    time: c.id === '1' ? '10:30' : (locale === 'ru' ? 'Вчера' : 'Yesterday'),
  }))

  // Search filter
  const filteredConversations = searchQuery
    ? localizedConversations.filter(c =>
        c.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : localizedConversations

  const currentMessages = chatMessages[selected.id] || currentMsgs[selected.id] || []

  // Handle file attachment
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const item: { name: string; type: 'file' | 'image'; preview?: string } = { name: file.name, type }
      if (type === 'image' && file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          item.preview = ev.target?.result as string
          setAttachedFiles(prev => [...prev, item])
        }
        reader.readAsDataURL(file)
      } else {
        setAttachedFiles(prev => [...prev, item])
      }
    })
    e.target.value = ''
  }

  const removeAttachment = (idx: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSend = () => {
    if (!message.trim() && attachedFiles.length === 0) return
    const newMsg: Message = {
      id: Date.now(),
      from: 'trainer',
      text: message.trim() || (attachedFiles.length > 0 ? `📎 ${attachedFiles.map(f => f.name).join(', ')}` : ''),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...(attachedFiles.length > 0 ? { attachment: { name: attachedFiles[0].name, type: attachedFiles[0].type } } : {}),
    }
    setChatMessages(prev => ({
      ...prev,
      [selected.id]: [...(prev[selected.id] || currentMsgs[selected.id] || []), newMsg],
    }))
    setMessage('')
    setAttachedFiles([])
    toast.success(locale === 'ru' ? 'Сообщение отправлено' : 'Message sent')
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-zinc-900">{t('messages.title')}</h1><p className="text-zinc-500 mt-1">{t('messages.subtitle')}</p></div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" className="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" onChange={e => handleFileSelect(e, 'file')} />
      <input ref={imageInputRef} type="file" className="hidden" multiple accept="image/*" onChange={e => handleFileSelect(e, 'image')} />

      <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversation list */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardContent className="p-4 flex-1 flex flex-col">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder={t('messages.searchPlaceholder')}
                className="pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {filteredConversations.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
                {locale === 'ru' ? 'Ничего не найдено' : 'No conversations found'}
              </div>
            )}
            <div className="space-y-2 flex-1 overflow-y-auto">
              {filteredConversations.map((conv) => (
                <div key={conv.id} onClick={() => setSelected(conv)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selected.id === conv.id ? 'bg-teal-50 border border-teal-200' : 'hover:bg-zinc-50'}`}>
                  <div className="relative">
                    <Avatar fallback={conv.initials} size="md" />
                    {conv.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-900">{conv.client}</span>
                      <span className="text-xs text-zinc-500">{conv.time}</span>
                    </div>
                    <p className="text-sm text-zinc-500 truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && <Badge className="bg-teal-500 text-white">{conv.unread}</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="lg:col-span-2 flex flex-col">
          <div className="p-4 border-b border-zinc-200 flex items-center gap-3">
            <Avatar fallback={selected.initials} />
            <div>
              <p className="font-semibold text-zinc-900">{selected.client}</p>
              <p className="text-sm text-zinc-500">{selected.online ? t('messages.online') : t('messages.offline')}</p>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {currentMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from === 'trainer' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  msg.from === 'trainer' 
                    ? 'bg-teal-500 text-white rounded-br-md' 
                    : 'bg-zinc-100 text-zinc-900 rounded-bl-md'
                }`}>
                  {msg.attachment?.type === 'image' && (
                    <div className="mb-2 rounded-lg overflow-hidden bg-black/10">
                      <div className="w-48 h-32 flex items-center justify-center">
                        <Camera className={`w-8 h-8 ${msg.from === 'trainer' ? 'text-teal-200' : 'text-zinc-400'}`} />
                      </div>
                    </div>
                  )}
                  {msg.attachment?.type === 'file' && (
                    <div className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-lg ${msg.from === 'trainer' ? 'bg-teal-600' : 'bg-zinc-200'}`}>
                      <File className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs truncate">{msg.attachment.name}</span>
                    </div>
                  )}
                  <p className="text-sm">{msg.text}</p>
                  <div className={`flex items-center gap-1 mt-1 ${msg.from === 'trainer' ? 'justify-end' : ''}`}>
                    <span className={`text-xs ${msg.from === 'trainer' ? 'text-teal-100' : 'text-zinc-400'}`}>{msg.time}</span>
                    {msg.from === 'trainer' && <CheckCheck className="w-3.5 h-3.5 text-teal-100" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Attached files preview */}
          {attachedFiles.length > 0 && (
            <div className="px-4 pt-3 flex gap-2 flex-wrap">
              {attachedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg text-sm">
                  {file.type === 'image' ? (
                    file.preview ? (
                      <img src={file.preview} alt="" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-teal-500" />
                    )
                  ) : (
                    <File className="w-4 h-4 text-zinc-500" />
                  )}
                  <span className="text-zinc-700 max-w-[120px] truncate">{file.name}</span>
                  <button onClick={() => removeAttachment(i)} className="text-zinc-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="p-4 border-t border-zinc-200">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-teal-500" onClick={() => fileInputRef.current?.click()} title={locale === 'ru' ? 'Прикрепить файл' : 'Attach file'}>
                <Paperclip className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-teal-500" onClick={() => imageInputRef.current?.click()} title={locale === 'ru' ? 'Отправить фото' : 'Send photo'}>
                <ImageIcon className="w-5 h-5" />
              </Button>
              <Input 
                placeholder={t('messages.typeMessage')} 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1" 
              />
              <Button variant="gradient" onClick={handleSend} disabled={!message.trim() && attachedFiles.length === 0}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
