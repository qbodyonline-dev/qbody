import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'

/**
 * GET /api/onboarding
 * Returns: { completed: boolean, template: FormTemplate | null }
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const userId = auth.data.user.id

    // Check if onboarding is completed
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single()

    const completed = profile?.onboarding_completed === true

    // Load onboarding template
    const { data: templates } = await supabase
      .from('form_templates')
      .select('*')
      .eq('type', 'onboarding')
      .eq('active', true)
      .limit(1)

    const template = templates?.[0] || null

    // Load existing questionnaire if any
    const { data: questionnaire } = await supabase
      .from('client_questionnaires')
      .select('*')
      .eq('client_id', userId)
      .maybeSingle()

    return NextResponse.json({ completed, template, questionnaire })
  } catch (err: any) {
    console.error('GET /api/onboarding error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

/**
 * POST /api/onboarding
 * Body: { values: Record<string, any> }
 * Saves questionnaire + marks onboarding as completed
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const userId = auth.data.user.id
    const body = await request.json()
    const values = body.values || {}

    // Known questionnaire DB columns
    const KNOWN_COLS = new Set([
      'primary_goal', 'secondary_goals', 'target_weight', 'injuries',
      'medical_conditions', 'medications', 'allergies', 'training_experience',
      'training_frequency', 'preferred_training_time', 'training_location',
      'available_equipment', 'occupation', 'activity_level', 'sleep_hours_avg',
      'stress_level_avg', 'dietary_restrictions', 'meals_per_day', 'water_intake',
      'supplements', 'notes', 'full_name', 'date_of_birth', 'height', 'current_weight',
    ])

    const questionnaireData: Record<string, any> = { client_id: userId }
    const customData: Record<string, any> = {}

    for (const [key, val] of Object.entries(values)) {
      if (val === null || val === undefined || val === '') continue
      if (KNOWN_COLS.has(key)) {
        questionnaireData[key] = typeof val === 'string' && !isNaN(Number(val)) && ['target_weight', 'height', 'current_weight', 'sleep_hours_avg', 'stress_level_avg', 'meals_per_day'].includes(key)
          ? Number(val) : val
      } else {
        customData[key] = val
      }
    }

    if (Object.keys(customData).length > 0) {
      questionnaireData.custom_data = customData
    }

    // Upsert questionnaire
    const { error: qError } = await supabase
      .from('client_questionnaires')
      .upsert(questionnaireData, { onConflict: 'client_id' })

    if (qError) {
      console.error('Save questionnaire error:', qError)
      return NextResponse.json({ error: 'Failed to save questionnaire' }, { status: 500 })
    }

    // Update profile fields if provided
    const profileUpdates: Record<string, any> = { onboarding_completed: true }
    if (values.full_name) profileUpdates.full_name = values.full_name
    if (values.date_of_birth) profileUpdates.date_of_birth = values.date_of_birth
    if (values.height) profileUpdates.height = Number(values.height)
    if (values.current_weight) profileUpdates.current_weight = Number(values.current_weight)

    const { error: pError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId)

    if (pError) {
      console.error('Update profile error:', pError)
      // Don't fail completely — questionnaire was saved
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('POST /api/onboarding error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
