import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { isValidUUID } from '@/lib/security'

export const dynamic = 'force-dynamic'

const ALLOWED_STATUS = ['active', 'paused', 'completed', 'cancelled', 'expired']

// GET — client's programs with progress — admin only
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }
  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('client_programs')
      .select(`
        id, program_id, status, start_date, end_date, current_week, created_at,
        training_programs:program_id ( id, name, name_secondary, duration_weeks, difficulty, goal )
      `)
      .eq('client_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching client programs:', error)
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
    }

    const programs = (data || []).map((cp: any) => {
      const prog = cp.training_programs
      const durationWeeks = prog?.duration_weeks || 0
      const currentWeek = cp.current_week || 0
      return {
        id: cp.id,
        program_id: cp.program_id,
        name: prog?.name || 'Program',
        name_secondary: prog?.name_secondary || null,
        difficulty: prog?.difficulty || null,
        goal: prog?.goal || null,
        status: cp.status,
        start_date: cp.start_date,
        end_date: cp.end_date,
        current_week: currentWeek,
        duration_weeks: durationWeeks,
        progress_percent: durationWeeks > 0 ? Math.min(100, Math.round((currentWeek / durationWeeks) * 100)) : 0,
        created_at: cp.created_at,
      }
    })

    return NextResponse.json({ programs })
  } catch (err: any) {
    console.error('GET /api/clients/[id]/programs error:', err)
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
  }
}

// POST — assign a program to client — admin only
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }
  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const clientId = params.id
    const body = await request.json()
    const { program_id, start_date } = body

    if (!program_id || !isValidUUID(program_id)) {
      return NextResponse.json({ error: 'Valid program_id is required' }, { status: 400 })
    }

    // Prevent duplicate active assignment of the same program
    const { data: dup } = await supabase
      .from('client_programs')
      .select('id')
      .eq('client_id', clientId)
      .eq('program_id', program_id)
      .eq('status', 'active')
      .maybeSingle()
    if (dup) {
      return NextResponse.json({ error: 'This program is already active for the client' }, { status: 400 })
    }

    // Model: one active program at a time — cancel other active assignments
    await supabase
      .from('client_programs')
      .update({ status: 'cancelled', end_date: new Date().toISOString().split('T')[0] })
      .eq('client_id', clientId)
      .eq('status', 'active')

    const { data: program } = await supabase
      .from('training_programs')
      .select('duration_weeks')
      .eq('id', program_id)
      .single()

    const startDt = start_date || new Date().toISOString().split('T')[0]
    let endDt: string | null = null
    if (program?.duration_weeks) {
      const end = new Date(startDt)
      end.setDate(end.getDate() + program.duration_weeks * 7)
      endDt = end.toISOString().split('T')[0]
    }

    const { data, error } = await supabase
      .from('client_programs')
      .insert({
        client_id: clientId,
        program_id,
        start_date: startDt,
        end_date: endDt,
        status: 'active',
        current_week: 1,
        assigned_by: auth.data.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Assign program error:', error)
      return NextResponse.json({ error: 'Failed to assign program' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/clients/[id]/programs error:', err)
    return NextResponse.json({ error: 'Failed to assign program' }, { status: 500 })
  }
}

// PATCH — change program status (pause / resume / etc.) — admin only
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }
  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { client_program_id, status } = body

    if (!client_program_id || !isValidUUID(client_program_id)) {
      return NextResponse.json({ error: 'Valid client_program_id is required' }, { status: 400 })
    }
    if (!status || !ALLOWED_STATUS.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { error } = await supabase
      .from('client_programs')
      .update({ status })
      .eq('id', client_program_id)
      .eq('client_id', params.id)

    if (error) {
      console.error('Update program status error:', error)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('PATCH /api/clients/[id]/programs error:', err)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}

// DELETE — remove a program assignment — admin only
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }
  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const clientProgramId = searchParams.get('client_program_id')

    if (!clientProgramId || !isValidUUID(clientProgramId)) {
      return NextResponse.json({ error: 'Valid client_program_id query param is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('client_programs')
      .delete()
      .eq('id', clientProgramId)
      .eq('client_id', params.id)

    if (error) {
      console.error('Delete program assignment error:', error)
      return NextResponse.json({ error: 'Failed to remove program' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/clients/[id]/programs error:', err)
    return NextResponse.json({ error: 'Failed to remove program' }, { status: 500 })
  }
}
