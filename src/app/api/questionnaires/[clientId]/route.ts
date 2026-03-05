import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin, authenticateRequest } from '@/lib/api-auth'
import { isValidUUID } from '@/lib/security'

// GET — get questionnaire for a client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const { clientId } = await params

  if (!isValidUUID(clientId)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
  }

  const isAdmin = ['admin', 'trainer'].includes(auth.data.profile.role)
  if (!isAdmin && auth.data.user.id !== clientId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('client_questionnaires')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle()

    if (error) {
      console.error('Questionnaire query error:', error)
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }

    return NextResponse.json(data || null)
  } catch (err: any) {
    console.error('GET /api/questionnaires/[clientId] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT — create or update questionnaire
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const { clientId } = await params

  if (!isValidUUID(clientId)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
  }

  const isAdmin = ['admin', 'trainer'].includes(auth.data.profile.role)
  if (!isAdmin && auth.data.user.id !== clientId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()

    const fields = {
      client_id: clientId,
      primary_goal: body.primary_goal || null,
      secondary_goals: body.secondary_goals || [],
      target_weight: body.target_weight || null,
      injuries: body.injuries || null,
      medical_conditions: body.medical_conditions || null,
      medications: body.medications || null,
      allergies: body.allergies || null,
      training_experience: body.training_experience || null,
      training_frequency: body.training_frequency || null,
      preferred_training_time: body.preferred_training_time || null,
      training_location: body.training_location || null,
      available_equipment: body.available_equipment || [],
      occupation: body.occupation || null,
      activity_level: body.activity_level || null,
      sleep_hours_avg: body.sleep_hours_avg || null,
      stress_level_avg: body.stress_level_avg || null,
      dietary_restrictions: body.dietary_restrictions || [],
      meals_per_day: body.meals_per_day || null,
      water_intake: body.water_intake || null,
      supplements: body.supplements || null,
      notes: body.notes || null,
    }

    // Upsert
    const { data, error } = await supabase
      .from('client_questionnaires')
      .upsert(fields, { onConflict: 'client_id' })
      .select()
      .single()

    if (error) {
      console.error('Upsert questionnaire error:', error)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('PUT /api/questionnaires/[clientId] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE — remove questionnaire
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const { clientId } = await params

  if (!isValidUUID(clientId)) {
    return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('client_questionnaires')
      .delete()
      .eq('client_id', clientId)

    if (error) {
      console.error('Delete questionnaire error:', error)
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/questionnaires/[clientId] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
