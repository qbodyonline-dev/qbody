import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET - fetch all conversations (for admin) or user's conversation (for client)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const isAdmin = profile?.role === 'admin' || profile?.role === 'trainer'
    
    if (isAdmin) {
      // Admin: get all conversations with client info and last message
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          client:profiles!conversations_client_id_fkey(id, full_name, email, avatar_url),
          messages(id, content, sender_id, is_read, created_at)
        `)
        .order('last_message_at', { ascending: false })
      
      if (error) throw error
      
      // Process to get unread count and last message
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
          messages: undefined // Don't send all messages in list
        }
      })
      
      return NextResponse.json(processed)
    } else {
      // Client: get their own conversation
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages(id, content, sender_id, is_read, created_at)
        `)
        .eq('client_id', user.id)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
      
      if (conversation) {
        const messages = conversation.messages || []
        const unreadCount = messages.filter((m: any) => !m.is_read && m.sender_id !== user.id).length
        
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - create a new conversation (client or admin)
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const isAdmin = profile?.role === 'admin' || profile?.role === 'trainer'
    
    const body = await request.json()
    const { message, client_id, attachments } = body
    
    // Determine which client this conversation is for
    const targetClientId = isAdmin && client_id ? client_id : user.id
    
    // Check if conversation already exists for this client
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('client_id', targetClientId)
      .single()
    
    if (existing) {
      // Add message to existing conversation
      if (message || (attachments && attachments.length > 0)) {
        await supabase.from('messages').insert({
          conversation_id: existing.id,
          sender_id: user.id,
          content: message || null,
          attachments: attachments || []
        })
      }
      return NextResponse.json(existing)
    }
    
    // Create new conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        client_id: targetClientId,
        admin_id: isAdmin ? user.id : null,
        status: 'open'
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Add first message if provided
    if ((message || (attachments && attachments.length > 0)) && conversation) {
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        content: message || null,
        attachments: attachments || []
      })
    }
    
    return NextResponse.json(conversation)
  } catch (error: any) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
