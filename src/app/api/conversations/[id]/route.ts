import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest, requireAdmin } from '@/lib/api-auth'
import { isValidUUID } from '@/lib/security'

// GET - fetch single conversation with messages
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
    
    // Get conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select(`
        *,
        client:profiles!conversations_client_id_fkey(id, full_name, email, avatar_url)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }
      throw error
    }
    
    // ✅ AUTHORIZATION: Check access
    if (!isAdmin && conversation.client_id !== auth.data.user.id) {
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
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 })
  }
}

// PATCH - update conversation (mark as read, close, etc.)
export async function PATCH(
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
    
    const body = await request.json()
    const { status, mark_read } = body
    
    // ✅ VALIDATION: Whitelist allowed status values
    const allowedStatuses = ['open', 'closed', 'archived']
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
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
    
    if (status) {
      await supabase
        .from('conversations')
        .update({ status })
        .eq('id', id)
    }
    
    if (mark_read) {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', id)
        .neq('sender_id', auth.data.user.id)
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating conversation:', error)
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 })
  }
}

// DELETE — delete conversation and its messages — admin only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Delete messages first
    const { error: msgError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', id)

    if (msgError) {
      console.error('Error deleting messages:', msgError)
      return NextResponse.json({ error: 'Failed to delete messages' }, { status: 500 })
    }

    // Delete conversation
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting conversation:', error)
      return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/conversations/[id] error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
