import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()

    const {
      firstName, lastName, email, phone, birthDate, gender,
      conditions, surgeries, medications, allergies, injuries,
      goal, experience, daysPerWeek, equipment, motivation,
      weight, height, chest, waist, hips, arm, thigh,
      plan, program, startDate, notes,
    } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || null

    // 1. Create Supabase Auth user with a random password
    const tempPassword = crypto.randomUUID().slice(0, 16) + 'Aa1!'
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authError) {
      if (authError.message?.includes('already') || authError.message?.includes('duplicate')) {
        return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
      }
      console.error('Auth createUser error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    // 2. Upsert profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email.toLowerCase().trim(),
        full_name: fullName,
        phone: phone || null,
        role: 'client',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Profile upsert error:', profileError)
    }

    // 3. Save onboarding data
    const onboardingData = {
      user_id: userId,
      birth_date: birthDate || null,
      gender: gender || null,
      health: {
        conditions: conditions || null,
        surgeries: surgeries || null,
        medications: medications || null,
        allergies: allergies || null,
        injuries: injuries || null,
      },
      goals: {
        goal: goal || null,
        experience: experience || null,
        days_per_week: daysPerWeek ? parseInt(daysPerWeek) : null,
        equipment: equipment || null,
        motivation: motivation || null,
      },
      measurements: {
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        chest: chest ? parseFloat(chest) : null,
        waist: waist ? parseFloat(waist) : null,
        hips: hips ? parseFloat(hips) : null,
        arm: arm ? parseFloat(arm) : null,
        thigh: thigh ? parseFloat(thigh) : null,
      },
      subscription: {
        plan: plan || null,
        program: program || null,
        start_date: startDate || null,
      },
      notes: notes || null,
      created_at: new Date().toISOString(),
    }

    const { error: onboardError } = await supabase
      .from('site_settings')
      .upsert({
        key: `onboarding_${userId}`,
        value: onboardingData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })

    if (onboardError) {
      console.error('Onboarding data save error:', onboardError)
    }

    return NextResponse.json({
      success: true,
      client: {
        id: userId,
        email: email.toLowerCase().trim(),
        full_name: fullName,
        phone: phone || null,
      },
    })
  } catch (err: any) {
    console.error('POST /api/clients/onboard error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create client' }, { status: 500 })
  }
}
