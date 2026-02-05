import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { sendNewMessageToClient, sendNewMessageToAdmin } from '@/lib/email'

// GET - fetch messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const isAdmin = profile?.role === 'admin' || profile?.role === 'trainer'
    
    // Verify access to conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('client_id')
      .eq('id', id)
      .single()
    
    if (!isAdmin && conversation?.client_id !== user.id) {
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - send a new message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    
    const body = await request.json()
    const { content, attachments } = body
    
    // Message must have content or attachments
    if (!content?.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Message content or attachments required' }, { status: 400 })
    }
    
    // Get sender profile
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('role, full_name, email')
      .eq('id', user.id)
      .single()
    
    const isAdmin = senderProfile?.role === 'admin' || senderProfile?.role === 'trainer'
    
    // Verify access to conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('client_id')
      .eq('id', id)
      .single()
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }
    
    if (!isAdmin && conversation.client_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Create message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: id,
        sender_id: user.id,
        content: content?.trim() || null,
        attachments: attachments || []
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
    const messagePreview = content?.trim() || '[Attachment]'

    if (isAdmin) {
      // Admin sent message → notify client
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
            senderName: senderProfile?.full_name || 'Your Trainer',
            messagePreview,
            conversationId: id,
          }
        )
      }
    } else {
      // Client sent message → notify admin
      await sendNewMessageToAdmin({
        clientName: senderProfile?.full_name || 'Client',
        clientEmail: senderProfile?.email || '',
        messagePreview,
        conversationId: id,
      })
    }
    
    return NextResponse.json(message)
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
