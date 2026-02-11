import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin, authenticateRequest } from '@/lib/api-auth'

// GET — list checkins (admin: all clients, client: own only)
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const clientId = searchParams.get('client_id') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const isAdmin = ['admin', 'trainer'].includes(auth.data.profile.role)
    const countOnly = searchParams.get('count_only') === '1'

    // Fast path: just return count (for sidebar badge)
    if (countOnly && isAdmin) {
      let countQuery = supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
      if (status && status !== 'all') {
        countQuery = countQuery.eq('status', status)
      }
      const { count: total, error } = await countQuery
      if (error) return NextResponse.json({ error: 'Failed to count' }, { status: 500 })
      return NextResponse.json({ count: total ?? 0 })
    }

    let query = supabase
      .from('checkins')
      .select(`
        *,
        profiles:client_id ( id, full_name, email, avatar_url ),
        checkin_photos ( id, photo_url, photo_type ),
        checkin_responses ( id, message, created_at, profiles:trainer_id ( full_name ) )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Clients can only see own checkins
    if (!isAdmin) {
      query = query.eq('client_id', auth.data.user.id)
    } else if (clientId) {
      query = query.eq('client_id', clientId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Checkins query error:', error)
      return NextResponse.json({ error: 'Failed to fetch checkins' }, { status: 500 })
    }

    // Get previous weight for each client to compute change
    const checkins = data || []
    const enriched = await Promise.all(
      checkins.map(async (ci: any) => {
        // Find previous checkin weight
        const { data: prev } = await supabase
          .from('checkins')
          .select('weight')
          .eq('client_id', ci.client_id)
          .lt('checkin_date', ci.checkin_date)
          .not('weight', 'is', null)
          .order('checkin_date', { ascending: false })
          .limit(1)
          .maybeSingle()

        return {
          ...ci,
          previous_weight: prev?.weight ?? null,
          weight_change: prev?.weight && ci.weight ? +(ci.weight - prev.weight).toFixed(1) : null,
          photos_count: (ci.checkin_photos || []).length,
          has_response: (ci.checkin_responses || []).length > 0,
        }
      })
    )

    return NextResponse.json({ checkins: enriched, total: count || 0 })
  } catch (err: any) {
    console.error('GET /api/checkins error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST — create checkin (client submits)
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()

    const isAdmin = ['admin', 'trainer'].includes(auth.data.profile.role)
    const clientId = isAdmin ? (body.client_id || auth.data.user.id) : auth.data.user.id

    const { data, error } = await supabase
      .from('checkins')
      .insert({
        client_id: clientId,
        checkin_date: body.checkin_date || new Date().toISOString().split('T')[0],
        weight: body.weight || null,
        body_fat_pct: body.body_fat_pct || null,
        waist: body.waist || null,
        hips: body.hips || null,
        chest: body.chest || null,
        thigh: body.thigh || null,
        arm: body.arm || null,
        sleep_hours: body.sleep_hours || null,
        sleep_quality: body.sleep_quality || null,
        stress_level: body.stress_level || null,
        energy_level: body.energy_level || null,
        appetite: body.appetite || null,
        soreness: body.soreness || null,
        cycle_day: body.cycle_day || null,
        cycle_notes: body.cycle_notes || null,
        comment: body.comment || null,
        status: 'new',
      })
      .select()
      .single()

    if (error) {
      console.error('Create checkin error:', error)
      return NextResponse.json({ error: 'Failed to create checkin' }, { status: 500 })
    }

    // Insert photos if provided
    if (body.photos && Array.isArray(body.photos) && body.photos.length > 0) {
      const photoRows = body.photos.map((p: any) => ({
        checkin_id: data.id,
        photo_url: p.photo_url,
        photo_type: p.photo_type || 'front',
      }))

      await supabase.from('checkin_photos').insert(photoRows)
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/checkins error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
