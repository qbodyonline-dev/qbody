import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin, authenticateRequest } from '@/lib/api-auth'
import { sanitizeString, isValidUUID } from '@/lib/security'

export const dynamic = 'force-dynamic'

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
      if (!isValidUUID(clientId)) return NextResponse.json({ error: 'Invalid client_id' }, { status: 400 })
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

    // Compute weight change in-memory (avoids N+1 DB queries)
    const checkins = data || []

    // Group checkins by client and sort by date ascending to find "previous" weights
    const byClient = new Map<string, any[]>()
    for (const ci of checkins) {
      const arr = byClient.get(ci.client_id) || []
      arr.push(ci)
      byClient.set(ci.client_id, arr)
    }

    // For each client group, sort by date asc and build prev-weight map
    const prevWeightMap = new Map<string, number | null>() // checkin.id -> previous weight
    for (const [, group] of byClient) {
      const sorted = [...group].sort((a, b) => a.checkin_date.localeCompare(b.checkin_date))
      let lastWeight: number | null = null
      for (const ci of sorted) {
        prevWeightMap.set(ci.id, lastWeight)
        if (ci.weight != null) lastWeight = ci.weight
      }
    }

    const enriched = checkins.map((ci: any) => {
      const prevWeight = prevWeightMap.get(ci.id) ?? null
      return {
        ...ci,
        previous_weight: prevWeight,
        weight_change: prevWeight != null && ci.weight != null ? +(ci.weight - prevWeight).toFixed(1) : null,
        photos_count: (ci.checkin_photos || []).length,
        has_response: (ci.checkin_responses || []).length > 0,
      }
    })

    return NextResponse.json({ checkins: enriched, total: count || 0 })
  } catch (err: any) {
    console.error('GET /api/checkins error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Known DB columns for checkins
const CHECKIN_DB_COLUMNS = new Set([
  'weight', 'body_fat_pct', 'waist', 'hips', 'chest', 'thigh', 'arm',
  'sleep_hours', 'sleep_quality', 'stress_level', 'energy_level',
  'appetite', 'soreness', 'cycle_day', 'cycle_notes', 'comment'
])

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
    const rawClientId = isAdmin ? (body.client_id || auth.data.user.id) : auth.data.user.id
    if (!isValidUUID(rawClientId)) return NextResponse.json({ error: 'Invalid client_id' }, { status: 400 })
    const clientId = rawClientId

    // Separate known DB columns from custom data
    const insert: Record<string, any> = {
      client_id: clientId,
      checkin_date: body.checkin_date || new Date().toISOString().split('T')[0],
      status: 'new',
    }
    const customData: Record<string, any> = {}

    // Process form values
    const formValues = body.values || body // support both old {weight:x} and new {values:{weight:x}} format
    for (const [key, val] of Object.entries(formValues)) {
      if (['client_id', 'checkin_date', 'status', 'photos', 'values'].includes(key)) continue
      if (val === null || val === undefined || val === '') continue
      
      if (CHECKIN_DB_COLUMNS.has(key)) {
        if (typeof val === 'string') {
          const num = Number(val)
          insert[key] = isNaN(num) ? sanitizeString(val, 2000) : num
        } else {
          insert[key] = val
        }
      } else {
        customData[key] = typeof val === 'string' ? sanitizeString(val, 2000) : val
      }
    }

    if (Object.keys(customData).length > 0) {
      insert.custom_data = customData
    }

    const { data, error } = await supabase
      .from('checkins')
      .insert(insert)
      .select()
      .single()

    if (error) {
      console.error('Create checkin error:', error)
      return NextResponse.json({ error: 'Failed to create checkin' }, { status: 500 })
    }

    // Insert photos if provided
    const photos = body.photos || []
    if (Array.isArray(photos) && photos.length > 0 && photos.length <= 20) {
      const allowedTypes = ['front', 'side', 'back', 'progress', 'other']
      const photoRows = photos.map((p: any) => {
        const url = typeof p === 'string' ? p : p.photo_url
        const type = typeof p === 'string' ? 'progress' : (p.photo_type || 'front')
        return {
          checkin_id: data.id,
          photo_url: sanitizeString(url || '', 2000),
          photo_type: allowedTypes.includes(type) ? type : 'other',
        }
      })
      await supabase.from('checkin_photos').insert(photoRows)
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/checkins error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
