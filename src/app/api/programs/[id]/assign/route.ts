import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { isValidUUID } from '@/lib/security'

export const dynamic = 'force-dynamic'

// POST — assign program to client
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
        .update({ status: 'cancelled', end_date: new Date().toISOString().split('T')[0] })
        .eq('id', existing.id)
    }

    // Get program duration for end_date
    const { data: program } = await supabase
      .from('training_programs')
      .select('duration_weeks')
      .eq('id', params.id)
      .single()

    const startDt = start_date || new Date().toISOString().split('T')[0]
    let endDt = null
    if (program?.duration_weeks) {
      const end = new Date(startDt)
      end.setDate(end.getDate() + program.duration_weeks * 7)
      endDt = end.toISOString().split('T')[0]
    }

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

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/programs/[id]/assign error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE — unassign client from program
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

    const { error } = await supabase
      .from('client_programs')
      .update({ status: 'cancelled', end_date: new Date().toISOString().split('T')[0] })
      .eq('program_id', params.id)
      .eq('client_id', clientId)
      .eq('status', 'active')

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
