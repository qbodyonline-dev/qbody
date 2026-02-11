import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin, authenticateRequest } from '@/lib/api-auth'

// GET — single checkin with photos, responses, previous data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('checkins')
      .select(`
        *,
        profiles:client_id ( id, full_name, email, avatar_url, phone ),
        checkin_photos ( id, photo_url, photo_type, created_at ),
        checkin_responses (
          id, message, attachment_url, created_at,
          profiles:trainer_id ( id, full_name, avatar_url )
        )
      `)
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Checkin not found' }, { status: 404 })
    }

    // Auth check: clients can only see own
    const isAdmin = ['admin', 'trainer'].includes(auth.data.profile.role)
    if (!isAdmin && data.client_id !== auth.data.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get previous checkin for comparison
    const { data: prev } = await supabase
      .from('checkins')
      .select('weight, waist, hips, chest, thigh, arm, body_fat_pct, checkin_date')
      .eq('client_id', data.client_id)
      .lt('checkin_date', data.checkin_date)
      .order('checkin_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Sort responses by date
    if (data.checkin_responses) {
      data.checkin_responses.sort((a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    }

    return NextResponse.json({
      ...data,
      previous: prev || null,
    })
  } catch (err: any) {
    console.error('GET /api/checkins/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT — update checkin (admin: status/flag, client: own data)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const isAdmin = ['admin', 'trainer'].includes(auth.data.profile.role)

    // Check ownership for clients
    if (!isAdmin) {
      const { data: existing } = await supabase
        .from('checkins')
        .select('client_id')
        .eq('id', params.id)
        .single()

      if (!existing || existing.client_id !== auth.data.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const updates: Record<string, any> = {}

    // Admin-only fields
    if (isAdmin) {
      if (body.status !== undefined) updates.status = body.status
      if (body.flagged !== undefined) updates.flagged = body.flagged
      if (body.flag_reason !== undefined) updates.flag_reason = body.flag_reason
    }

    // Client-editable fields
    const clientFields = [
      'weight', 'body_fat_pct', 'waist', 'hips', 'chest', 'thigh', 'arm',
      'sleep_hours', 'sleep_quality', 'stress_level', 'energy_level',
      'appetite', 'soreness', 'cycle_day', 'cycle_notes', 'comment'
    ]

    for (const field of clientFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('checkins')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Update checkin error:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('PUT /api/checkins/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE — delete checkin (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('checkins')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Delete checkin error:', error)
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/checkins/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
