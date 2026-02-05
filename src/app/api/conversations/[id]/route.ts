import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET - fetch single conversation with messages
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
    
    // Get conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select(`
        *,
        client:profiles!conversations_client_id_fkey(id, full_name, email, avatar_url)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    // Check access
    if (!isAdmin && conversation.client_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, email, avatar_url, role)
      `)
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
    
    if (msgError) throw msgError
    
    return NextResponse.json({
      ...conversation,
      messages
    })
  } catch (error: any) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - update conversation (mark as read, close, etc.)
export async function PATCH(
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
    const { status, mark_read } = body
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const isAdmin = profile?.role === 'admin' || profile?.role === 'trainer'
    
    // Get conversation to verify access
    const { data: conversation } = await supabase
      .from('conversations')
      .select('client_id')
      .eq('id', id)
      .single()
    
    if (!isAdmin && conversation?.client_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Update conversation status if provided
    if (status) {
      await supabase
        .from('conversations')
        .update({ status })
        .eq('id', id)
    }
    
    // Mark messages as read
    if (mark_read) {
      // Mark messages from the other party as read
      if (isAdmin) {
        // Admin marking client messages as read
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', id)
          .neq('sender_id', user.id)
      } else {
        // Client marking admin messages as read
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', id)
          .neq('sender_id', user.id)
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating conversation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
