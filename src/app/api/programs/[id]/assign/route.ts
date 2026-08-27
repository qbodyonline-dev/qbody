import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { isValidUUID } from '@/lib/security'
import { ASSIGNED_STATUSES, type AssignmentMode } from '@/lib/visibility'

export const dynamic = 'force-dynamic'

/**
 * Assigning a training program to clients — admin only.
 *
 * client_assignments = who may see the program and on what terms
 *   mode 'free' — enrolled right away (a client_programs row is written too)
 *   mode 'paid' — the client sees it and buys it; the Stripe webhook enrolls them
 * client_programs = the actual enrollment
 */

function parseMode(value: any): AssignmentMode {
  return value === 'paid' ? 'paid' : 'free'
}

function today() {
  return new Date().toISOString().split('T')[0]
}

async function endDateFor(supabase: any, programId: string, startDt: string): Promise<string | null> {
  const { data: program } = await supabase
    .from('training_programs')
    .select('duration_weeks')
    .eq('id', programId)
    .maybeSingle()

  if (!program?.duration_weeks) return null
  const end = new Date(startDt)
  end.setDate(end.getDate() + program.duration_weeks * 7)
  return end.toISOString().split('T')[0]
}

// GET — clients who may see / are enrolled in this program
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()

    const { data: program } = await supabase
      .from('training_programs')
      .select('id, is_private')
      .eq('id', params.id)
      .maybeSingle()

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    const [{ data: assignments }, { data: enrollments }] = await Promise.all([
      supabase
        .from('client_assignments')
        .select('client_id, mode')
        .eq('program_id', params.id),
      supabase
        .from('client_programs')
        .select('id, client_id, status, start_date, end_date')
        .eq('program_id', params.id)
        .in('status', ASSIGNED_STATUSES)
        .order('created_at', { ascending: false }),
    ])

    const modeByClient = new Map<string, AssignmentMode>(
      (assignments || []).map((a: any) => [a.client_id, a.mode as AssignmentMode])
    )
    const enrollmentByClient = new Map<string, any>(
      (enrollments || []).map((e: any) => [e.client_id, e])
    )

    const userIds = Array.from(new Set(
      Array.from(modeByClient.keys()).concat(Array.from(enrollmentByClient.keys()))
    ))
    let profiles: any[] = []
    if (userIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds)
      profiles = data || []
    }
    const byId = new Map(profiles.map((p: any) => [p.id, p]))

    return NextResponse.json({
      is_private: !!program.is_private,
      clients: userIds.map((userId) => {
        const enrollment = enrollmentByClient.get(userId)
        return {
          user_id: userId,
          client_program_id: enrollment?.id || null,
          full_name: byId.get(userId)?.full_name || null,
          email: byId.get(userId)?.email || null,
          avatar_url: byId.get(userId)?.avatar_url || null,
          mode: modeByClient.get(userId) || 'paid',
          assigned: modeByClient.has(userId),
          has_access: !!enrollment,
          status: enrollment?.status || null,
          start_date: enrollment?.start_date || null,
          end_date: enrollment?.end_date || null,
        }
      }),
    })
  } catch (err: any) {
    console.error('GET /api/programs/[id]/assign error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST — assign program to client(s)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { client_id, start_date, notes } = body

    // ─── Bulk path: assign to several clients at once ───
    // Used by the dashboard "Access" dialog. Unlike the single-client path
    // below it does NOT cancel the clients' other active programs — a personal
    // program is granted on top of whatever they are already doing.
    if (Array.isArray(body.client_ids)) {
      const mode = parseMode(body.mode)
      const clientIds: string[] = Array.from(new Set(
        body.client_ids.filter((id: any) => typeof id === 'string' && isValidUUID(id))
      ))

      if (clientIds.length === 0) {
        return NextResponse.json({ error: 'client_ids is required' }, { status: 400 })
      }

      const { data: program } = await supabase
        .from('training_programs')
        .select('id')
        .eq('id', params.id)
        .maybeSingle()

      if (!program) {
        return NextResponse.json({ error: 'Program not found' }, { status: 404 })
      }

      const { error: aError } = await supabase
        .from('client_assignments')
        .upsert(
          clientIds.map(clientId => ({
            client_id: clientId,
            program_id: params.id,
            mode,
            assigned_by: auth.data.user.id,
          })),
          { onConflict: 'client_id,program_id' }
        )

      if (aError) {
        console.error('Assign program error:', aError)
        return NextResponse.json({ error: 'Failed to assign program' }, { status: 500 })
      }

      // Paid offer: the client buys it themselves, the webhook enrolls them
      if (mode === 'paid') {
        return NextResponse.json({ success: true, assigned: clientIds.length, mode }, { status: 201 })
      }

      const { data: alreadyEnrolled } = await supabase
        .from('client_programs')
        .select('client_id')
        .eq('program_id', params.id)
        .in('client_id', clientIds)
        .neq('status', 'cancelled')

      const skip = new Set((alreadyEnrolled || []).map((a: any) => a.client_id))
      const toInsert = clientIds.filter(id => !skip.has(id))

      const startDt = start_date || today()
      const endDt = await endDateFor(supabase, params.id, startDt)

      if (toInsert.length > 0) {
        const { error } = await supabase.from('client_programs').insert(
          toInsert.map(clientId => ({
            client_id: clientId,
            program_id: params.id,
            start_date: startDt,
            end_date: endDt,
            status: 'active',
            current_week: 1,
            assigned_by: auth.data.user.id,
            notes: notes || null,
          }))
        )
        if (error) {
          console.error('Bulk enroll error:', error)
          return NextResponse.json({ error: 'Failed to assign program' }, { status: 500 })
        }
      }

      return NextResponse.json(
        { success: true, assigned: toInsert.length, skipped: skip.size, mode },
        { status: 201 }
      )
    }

    // ─── Single-client path (unchanged): one active program at a time ───
    if (!client_id || !isValidUUID(client_id)) {
      return NextResponse.json({ error: 'Valid client_id is required' }, { status: 400 })
    }

    // Check if client already has an active program
    const { data: existing } = await supabase
      .from('client_programs')
      .select('id, program_id')
      .eq('client_id', client_id)
      .eq('status', 'active')
      .maybeSingle()

    if (existing) {
      // Deactivate old assignment
      await supabase
        .from('client_programs')
        .update({ status: 'cancelled', end_date: today() })
        .eq('id', existing.id)
    }

    const startDt = start_date || today()
    const endDt = await endDateFor(supabase, params.id, startDt)

    const { data, error } = await supabase
      .from('client_programs')
      .insert({
        client_id,
        program_id: params.id,
        start_date: startDt,
        end_date: endDt,
        status: 'active',
        current_week: 1,
        assigned_by: auth.data.user.id,
        notes: notes || null,
      })
      .select(`
        *,
        profiles:client_id ( id, full_name, email ),
        training_programs:program_id ( id, name, name_secondary )
      `)
      .single()

    if (error) {
      console.error('Assign program error:', error)
      return NextResponse.json({ error: 'Failed to assign program' }, { status: 500 })
    }

    // Make sure a private program stays visible to the client we just enrolled
    await supabase
      .from('client_assignments')
      .upsert(
        { client_id, program_id: params.id, mode: 'free', assigned_by: auth.data.user.id },
        { onConflict: 'client_id,program_id' }
      )

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/programs/[id]/assign error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH — switch one client between free and paid: { client_id, mode }
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const mode = parseMode(body.mode)
    const clientId = body.client_id

    if (!clientId || !isValidUUID(clientId)) {
      return NextResponse.json({ error: 'Valid client_id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('client_assignments')
      .upsert(
        { client_id: clientId, program_id: params.id, mode, assigned_by: auth.data.user.id },
        { onConflict: 'client_id,program_id' }
      )

    if (error) {
      console.error('Update assignment mode error:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    if (mode === 'free') {
      const { data: enrolled } = await supabase
        .from('client_programs')
        .select('id')
        .eq('program_id', params.id)
        .eq('client_id', clientId)
        .neq('status', 'cancelled')
        .limit(1)

      if (!enrolled || enrolled.length === 0) {
        const startDt = today()
        await supabase.from('client_programs').insert({
          client_id: clientId,
          program_id: params.id,
          start_date: startDt,
          end_date: await endDateFor(supabase, params.id, startDt),
          status: 'active',
          current_week: 1,
          assigned_by: auth.data.user.id,
        })
      }
    } else {
      // Switching to "client pays": take the free enrollment back. A purchase
      // recreates it through the webhook.
      const { data: paidOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', clientId)
        .eq('program_id', params.id)
        .eq('status', 'paid')
        .limit(1)

      if (!paidOrder || paidOrder.length === 0) {
        await supabase
          .from('client_programs')
          .update({ status: 'cancelled', end_date: today() })
          .eq('program_id', params.id)
          .eq('client_id', clientId)
          .neq('status', 'cancelled')
      }
    }

    return NextResponse.json({ success: true, mode })
  } catch (err: any) {
    console.error('PATCH /api/programs/[id]/assign error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE — unassign client from program: ?client_id=<uuid>
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    if (!clientId || !isValidUUID(clientId)) {
      return NextResponse.json({ error: 'Valid client_id query param required' }, { status: 400 })
    }

    await supabase
      .from('client_assignments')
      .delete()
      .eq('program_id', params.id)
      .eq('client_id', clientId)

    const { error } = await supabase
      .from('client_programs')
      .update({ status: 'cancelled', end_date: today() })
      .eq('program_id', params.id)
      .eq('client_id', clientId)
      .neq('status', 'cancelled')

    if (error) {
      console.error('Unassign program error:', error)
      return NextResponse.json({ error: 'Failed to unassign' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/programs/[id]/assign error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
