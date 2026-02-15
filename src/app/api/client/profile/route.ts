import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'

// GET — get own profile + questionnaire + program summary
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const userId = auth.data.user.id

  try {
    const supabase = createServerClient()

    const [
      { data: profile },
      { data: questionnaire },
      { data: cp },
    ] = await Promise.all([
      supabase.from('profiles')
        .select('id, full_name, email, phone, avatar_url, role, locale, created_at, onboarding_completed, gender, date_of_birth, height, current_weight, target_weight, primary_goal, training_experience, training_location, activity_level, medical_conditions, photo_front')
        .eq('id', userId).single(),
      supabase.from('client_questionnaires')
        .select('*')
        .eq('client_id', userId).maybeSingle(),
      supabase.from('client_programs')
        .select('id, start_date, end_date, status, training_programs(name, name_ru, duration_weeks)')
        .eq('client_id', userId).eq('status', 'active').maybeSingle(),
    ])

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        role: profile.role,
        locale: profile.locale,
        member_since: profile.created_at,
        onboarding_completed: (profile as any).onboarding_completed,
        gender: (profile as any).gender,
        date_of_birth: (profile as any).date_of_birth,
        height: (profile as any).height,
        current_weight: (profile as any).current_weight,
        target_weight: (profile as any).target_weight,
        primary_goal: (profile as any).primary_goal,
        training_experience: (profile as any).training_experience,
        training_location: (profile as any).training_location,
        activity_level: (profile as any).activity_level,
        medical_conditions: (profile as any).medical_conditions,
        photo_front: (profile as any).photo_front,
      },
      questionnaire: questionnaire || null,
      program: cp ? {
        name: (cp.training_programs as any)?.name,
        name_ru: (cp.training_programs as any)?.name_ru,
        duration_weeks: (cp.training_programs as any)?.duration_weeks,
        start_date: cp.start_date,
        status: cp.status,
      } : null,
    })
  } catch (err: any) {
    console.error('GET /api/client/profile error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT — update own profile
export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const userId = auth.data.user.id

  try {
    const supabase = createServerClient()
    const body = await request.json()

    const allowed = [
      'full_name', 'phone', 'locale', 'gender', 'date_of_birth',
      'height', 'current_weight', 'target_weight', 'primary_goal',
      'training_experience', 'training_location', 'activity_level',
      'medical_conditions', 'photo_front',
    ]
    const NUMERIC = new Set(['height', 'current_weight', 'target_weight'])
    const update: Record<string, any> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) {
        update[key] = NUMERIC.has(key) && body[key] !== null ? Number(body[key]) : body[key]
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', userId)
      .select('id, full_name, email, phone, avatar_url, locale')
      .single()

    if (error) {
      console.error('Update profile error:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('PUT /api/client/profile error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
