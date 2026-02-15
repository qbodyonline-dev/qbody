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

    // Load profile with ALL fitness fields
    const { data: profileData } = await supabase
      .from('profiles')
      .select('onboarding_completed, full_name, gender, date_of_birth, height, current_weight, target_weight, primary_goal, training_experience, training_location, activity_level, medical_conditions, photo_front')
      .eq('id', userId)
      .single()

    const completed = profileData?.onboarding_completed === true

    // Load onboarding template
    const { data: templates } = await supabase
      .from('form_templates')
      .select('*')
      .eq('type', 'onboarding')
      .eq('active', true)
      .limit(1)

    const template = templates?.[0] || null

    return NextResponse.json({ completed, template, profile: profileData })
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

    // Update ALL fields in profiles — single source of truth for site + app
    const PROFILE_FIELDS = [
      'full_name', 'date_of_birth', 'gender', 'height', 'current_weight',
      'target_weight', 'primary_goal', 'training_experience', 'training_location',
      'activity_level', 'medical_conditions', 'photo_front',
    ]
    const NUMERIC_FIELDS = new Set(['height', 'current_weight', 'target_weight'])

    const profileUpdates: Record<string, any> = { onboarding_completed: true }
    for (const field of PROFILE_FIELDS) {
      if (values[field] !== undefined && values[field] !== null && values[field] !== '') {
        profileUpdates[field] = NUMERIC_FIELDS.has(field) ? Number(values[field]) : values[field]
      }
    }

    const { error: pError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId)

    if (pError) {
      console.error('Update profile error:', pError)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('POST /api/onboarding error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
