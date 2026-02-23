import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest, requireAdmin } from '@/lib/api-auth'

/**
 * GET /api/nutrition/targets
 * Trainer: all clients with targets + 7-day compliance.
 * Client: own targets only.
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const isTrainer = ['admin', 'trainer'].includes(auth.data.profile.role)
  const supabase = createServerClient()

  if (isTrainer) {
    // Get all clients with active programs
    const { data: clients } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .eq('role', 'client')
      .order('full_name')

    if (!clients) return NextResponse.json({ clients: [] })

    // Get all nutrition targets
    const { data: targets } = await supabase
      .from('nutrition_targets')
      .select('*')

    const targetMap = new Map((targets || []).map(t => [t.client_id, t]))

    // Get last 7 days of nutrition logs for compliance calc
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: logs } = await supabase
      .from('nutrition_logs')
      .select('client_id, calories_hit, protein_hit, carbs_hit, fat_hit, log_date')
      .gte('log_date', sevenDaysAgo.toISOString().split('T')[0])

    // Group logs by client
    const logsByClient = new Map<string, any[]>()
    for (const log of (logs || [])) {
      const arr = logsByClient.get(log.client_id) || []
      arr.push(log)
      logsByClient.set(log.client_id, arr)
    }

    const result = clients.map(c => {
      const target = targetMap.get(c.id)
      const clientLogs = logsByClient.get(c.id) || []

      // Compliance = % of logged days where all 4 macros hit
      let compliance = 0
      if (clientLogs.length > 0) {
        const fullyCompliant = clientLogs.filter(l =>
          l.calories_hit && l.protein_hit && l.carbs_hit && l.fat_hit
        ).length
        compliance = Math.round((fullyCompliant / clientLogs.length) * 100)
      }

      return {
        id: c.id,
        name: c.full_name || c.email || 'Unknown',
        email: c.email,
        avatar_url: c.avatar_url,
        calories: target?.calories || null,
        protein: target?.protein || null,
        carbs: target?.carbs || null,
        fat: target?.fat || null,
        notes: target?.notes || null,
        has_target: !!target,
        logged_days_7d: clientLogs.length,
        compliance_7d: compliance,
      }
    })

    return NextResponse.json({ clients: result })
  } else {
    // Client: get own target
    const { data: target } = await supabase
      .from('nutrition_targets')
      .select('*')
      .eq('client_id', auth.data.user.id)
      .maybeSingle()

    return NextResponse.json({ target: target || null })
  }
}

/**
 * POST /api/nutrition/targets
 * Trainer: set/update nutrition targets for a client.
 * Body: { client_id, calories, protein, carbs, fat, notes? }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const body = await request.json()
    const { client_id, calories, protein, carbs, fat, notes } = body

    if (!client_id) {
      return NextResponse.json({ error: 'client_id required' }, { status: 400 })
    }
    if (calories == null || protein == null || carbs == null || fat == null) {
      return NextResponse.json({ error: 'All macros (calories, protein, carbs, fat) required' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('nutrition_targets')
      .upsert({
        client_id,
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat),
        notes: notes || null,
        set_by: auth.data.user.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'client_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Upsert nutrition target error:', error)
      return NextResponse.json({ error: 'Failed to save targets' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('POST /api/nutrition/targets error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
