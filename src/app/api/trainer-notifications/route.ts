import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

/**
 * GET — list trainer notifications (unread first, newest first)
 * PATCH — mark all as read
 */

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === '1'
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('trainer_notifications')
      .select('*, profiles:client_id(id, full_name, email, avatar_url)', { count: 'exact' })
      .order('is_read', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Notifications query error:', error)
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('trainer_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)

    return NextResponse.json({
      notifications: data || [],
      total: count || 0,
      unread: unreadCount || 0,
    })
  } catch (err: any) {
    console.error('GET /api/trainer-notifications error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH — mark all as read, or mark specific IDs as read
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { ids, mark_all_read } = body

    if (mark_all_read) {
      const { error } = await supabase
        .from('trainer_notifications')
        .update({ is_read: true })
        .eq('is_read', false)

      if (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (ids && Array.isArray(ids) && ids.length > 0) {
      const { error } = await supabase
        .from('trainer_notifications')
        .update({ is_read: true })
        .in('id', ids)

      if (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'ids or mark_all_read required' }, { status: 400 })
  } catch (err: any) {
    console.error('PATCH /api/trainer-notifications error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE — delete specific notifications by IDs, or old read notifications (>30 days)
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json().catch(() => ({}))
    const { ids } = body as { ids?: string[] }

    // Delete specific notifications by IDs
    if (ids && Array.isArray(ids) && ids.length > 0) {
      const { error } = await supabase
        .from('trainer_notifications')
        .delete()
        .in('id', ids)

      if (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
      }
      return NextResponse.json({ success: true, deleted: ids.length })
    }

    // Fallback: delete old read notifications (>30 days)
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { count: toDelete } = await supabase
      .from('trainer_notifications')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', cutoff)
      .eq('is_read', true)

    const { error } = await supabase
      .from('trainer_notifications')
      .delete()
      .lt('created_at', cutoff)
      .eq('is_read', true)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted: toDelete || 0 })
  } catch (err: any) {
    console.error('DELETE /api/trainer-notifications error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
