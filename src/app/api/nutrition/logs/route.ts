import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/nutrition/logs
 * Client: get own logs (default last 30 days).
 * Trainer: get logs for a specific client via ?client_id=xxx
 * Optional: ?days=N to control range.
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const isTrainer = ['admin', 'trainer'].includes(auth.data.profile.role)
  const { searchParams } = new URL(request.url)
  const requestedClientId = searchParams.get('client_id')

  // Trainer must specify client_id; client always sees own
  const clientId = isTrainer ? (requestedClientId || null) : auth.data.user.id
  if (!clientId) {
    return NextResponse.json({ error: 'client_id query parameter required' }, { status: 400 })
  }

  const days = Math.min(Number(searchParams.get('days')) || 30, 90)

  const supabase = createServerClient()

  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data: logs, error } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('client_id', clientId)
    .gte('log_date', since.toISOString().split('T')[0])
    .order('log_date', { ascending: false })

  if (error) {
    console.error('Get nutrition logs error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }

  // Also return target for context
  const { data: target } = await supabase
    .from('nutrition_targets')
    .select('calories, protein, carbs, fat, notes')
    .eq('client_id', clientId)
    .maybeSingle()

  return NextResponse.json({
    logs: logs || [],
    target: target || null,
  })
}

/**
 * POST /api/nutrition/logs
 * Client: log daily nutrition compliance.
 * Body: {
 *   log_date?: string (YYYY-MM-DD, defaults to today),
 *   calories_hit, protein_hit, carbs_hit, fat_hit (booleans),
 *   calories_actual?, protein_actual?, carbs_actual?, fat_actual? (optional numbers),
 *   water_liters?, rating?, notes?
 * }
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const body = await request.json()
    const logDate = body.log_date || new Date().toISOString().split('T')[0]
    const clientId = auth.data.user.id
    const supabase = createServerClient()

    const record: any = {
      client_id: clientId,
      log_date: logDate,
      calories_hit: !!body.calories_hit,
      protein_hit: !!body.protein_hit,
      carbs_hit: !!body.carbs_hit,
      fat_hit: !!body.fat_hit,
      updated_at: new Date().toISOString(),
    }

    // Optional fields — always include if key exists in body (even null) to allow clearing
    if ('calories_actual' in body) record.calories_actual = body.calories_actual != null ? Number(body.calories_actual) : null
    if ('protein_actual' in body) record.protein_actual = body.protein_actual != null ? Number(body.protein_actual) : null
    if ('carbs_actual' in body) record.carbs_actual = body.carbs_actual != null ? Number(body.carbs_actual) : null
    if ('fat_actual' in body) record.fat_actual = body.fat_actual != null ? Number(body.fat_actual) : null
    if ('water_liters' in body) record.water_liters = body.water_liters != null ? Number(body.water_liters) : null
    if ('rating' in body) record.rating = body.rating != null ? Number(body.rating) : null
    if ('notes' in body) record.notes = body.notes || null

    const { data, error } = await supabase
      .from('nutrition_logs')
      .upsert(record, { onConflict: 'client_id,log_date' })
      .select()
      .single()

    if (error) {
      console.error('Upsert nutrition log error:', error)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('POST /api/nutrition/logs error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
