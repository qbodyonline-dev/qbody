import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'
import { sanitizeString, checkRateLimit, isValidUUID } from '@/lib/security'

// GET - fetch all conversations (for admin) or user's conversation (for client)
export async function GET(request: NextRequest) {
  // ✅ AUTH: Centralized authentication
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const isAdmin = auth.data.profile.role === 'admin' || auth.data.profile.role === 'trainer'
    
    if (isAdmin) {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          client:profiles!conversations_client_id_fkey(id, full_name, email, avatar_url),
          messages(id, content, sender_id, is_read, created_at)
        `)
        .order('last_message_at', { ascending: false })
      
      if (error) throw error
      
      const processed = conversations?.map(conv => {
        const messages = conv.messages || []
        const unreadCount = messages.filter((m: any) => !m.is_read && m.sender_id === conv.client_id).length
        const lastMessage = messages.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
        
        return {
          ...conv,
          unread_count: unreadCount,
          last_message: lastMessage,
          messages: undefined
        }
      })
      
      return NextResponse.json(processed)
    } else {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages(id, content, sender_id, is_read, created_at)
        `)
        .eq('client_id', auth.data.user.id)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      
      if (conversation) {
        const messages = conversation.messages || []
        const unreadCount = messages.filter((m: any) => !m.is_read && m.sender_id !== auth.data.user.id).length
        
        return NextResponse.json({
          ...conversation,
          unread_count: unreadCount,
          messages: undefined
        })
      }
      
      return NextResponse.json(null)
    }
  } catch (error: any) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

// POST - create a new conversation (client or admin)
export async function POST(request: NextRequest) {
  // ✅ AUTH: Centralized authentication
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  // ✅ RATE LIMIT: Max 10 new conversations per minute
  const rateCheck = await checkRateLimit(`conv:${auth.data.user.id}`, 10, 60 * 1000)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 })
  }

  try {
    const supabase = createServerClient()
    const isAdmin = auth.data.profile.role === 'admin' || auth.data.profile.role === 'trainer'
    
    const body = await request.json()
    const { message, client_id, attachments } = body
    
    // ✅ SANITIZE: Clean message content
    const cleanMessage = message ? sanitizeString(message, 5000) : null

    // ✅ VALIDATION: Limit attachments
    const cleanAttachments = Array.isArray(attachments) ? attachments.slice(0, 10) : []

    // ✅ VALIDATION: Validate admin-provided client_id
    if (isAdmin && client_id) {
      if (!isValidUUID(client_id)) {
        return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
      }
      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', client_id)
        .eq('role', 'client')
        .maybeSingle()
      if (!clientProfile) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
    }

    const targetClientId = isAdmin && client_id ? client_id : auth.data.user.id
    
    // Check if conversation already exists for this client
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('client_id', targetClientId)
      .single()
    
    if (existing) {
      if (cleanMessage || cleanAttachments.length > 0) {
        await supabase.from('messages').insert({
          conversation_id: existing.id,
          sender_id: auth.data.user.id,
          content: cleanMessage,
          attachments: cleanAttachments
        })
      }
      return NextResponse.json(existing)
    }
    
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        client_id: targetClientId,
        admin_id: isAdmin ? auth.data.user.id : null,
        status: 'open'
      })
      .select()
      .single()
    
    if (error) throw error
    
    if ((cleanMessage || cleanAttachments.length > 0) && conversation) {
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: auth.data.user.id,
        content: cleanMessage,
        attachments: cleanAttachments
      })
    }
    
    return NextResponse.json(conversation)
  } catch (error: any) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}
