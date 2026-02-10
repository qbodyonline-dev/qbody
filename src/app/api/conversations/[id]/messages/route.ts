import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'
import { isValidUUID, sanitizeString, checkRateLimit } from '@/lib/security'
import { sendNewMessageToClient, sendNewMessageToAdmin } from '@/lib/email'

// GET - fetch messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ✅ AUTH: Centralized authentication
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const { id } = await params

    // ✅ VALIDATION: Check UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 })
    }

    const supabase = createServerClient()
    const isAdmin = auth.data.profile.role === 'admin' || auth.data.profile.role === 'trainer'
    
    // Verify access to conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('client_id')
      .eq('id', id)
      .single()
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // ✅ AUTHORIZATION: Check access
    if (!isAdmin && conversation.client_id !== auth.data.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, email, avatar_url, role)
      `)
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    return NextResponse.json(messages)
  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST - send a new message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ✅ AUTH: Centralized authentication
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  // ✅ RATE LIMIT: Max 30 messages per minute
  const rateCheck = checkRateLimit(`msg:${auth.data.user.id}`, 30, 60 * 1000)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many messages. Please wait.' }, { status: 429 })
  }

  try {
    const { id } = await params

    // ✅ VALIDATION: Check UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 })
    }

    const supabase = createServerClient()
    const isAdmin = auth.data.profile.role === 'admin' || auth.data.profile.role === 'trainer'

    const body = await request.json()
    const { content, attachments } = body
    
    // ✅ SANITIZE: Clean message content
    const cleanContent = content ? sanitizeString(content.trim(), 10000) : null

    // ✅ VALIDATION: Limit attachments
    const cleanAttachments = Array.isArray(attachments) ? attachments.slice(0, 10) : []
    
    if (!cleanContent && cleanAttachments.length === 0) {
      return NextResponse.json({ error: 'Message content or attachments required' }, { status: 400 })
    }
    
    // Verify access to conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('client_id')
      .eq('id', id)
      .single()
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }
    
    // ✅ AUTHORIZATION: Check access
    if (!isAdmin && conversation.client_id !== auth.data.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Create message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: id,
        sender_id: auth.data.user.id,
        content: cleanContent,
        attachments: cleanAttachments
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, email, avatar_url, role)
      `)
      .single()
    
    if (error) throw error
    
    // Update conversation status to open if it was closed
    await supabase
      .from('conversations')
      .update({ status: 'open' })
      .eq('id', id)
      .eq('status', 'closed')

    // Send email notification to the recipient
    const messagePreview = cleanContent || '[Attachment]'

    if (isAdmin) {
      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', conversation.client_id)
        .single()

      if (clientProfile?.email) {
        await sendNewMessageToClient(
          clientProfile.email,
          clientProfile.full_name || 'Client',
          {
            senderName: auth.data.profile.full_name || 'Your Trainer',
            messagePreview,
            conversationId: id,
          }
        )
      }
    } else {
      await sendNewMessageToAdmin({
        clientName: auth.data.profile.full_name || 'Client',
        clientEmail: auth.data.user.email || '',
        messagePreview,
        conversationId: id,
      })
    }
    
    return NextResponse.json(message)
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
