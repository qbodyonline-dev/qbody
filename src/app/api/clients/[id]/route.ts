import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { isValidUUID, sanitizeString } from '@/lib/security'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // ✅ AUTH: Only admin/trainer can view client details
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const id = params.id

    // ✅ VALIDATION: Check UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, avatar_url, created_at, onboarding_completed, gender, date_of_birth, height, current_weight, target_weight, primary_goal, training_experience, training_location, activity_level, medical_conditions, photo_front')
      .eq('id', id)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const { data: accessData } = await supabase
      .from('course_access')
      .select('course_slug, granted_at, is_active')
      .eq('user_id', id)

    const { data: ordersData } = await supabase
      .from('orders')
      .select('id, user_id, course_slug, amount, currency, status, paid_at, created_at, stripe_session_id, stripe_customer_id, stripe_payment_intent_id')
      .eq('user_id', id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      ...profile,
      courses: accessData || [],
      orders: ordersData || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // ✅ AUTH: Only admin/trainer can edit client profiles
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const id = params.id

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
    }

    const supabase = createServerClient()
    const body = await request.json()

    // ✅ SANITIZE: Clean input data
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: sanitizeString(body.full_name || '', 200),
        phone: sanitizeString(body.phone || '', 30),
      })
      .eq('id', id)

    if (error) {
      console.error('Client update error:', error)
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('PATCH /api/clients/[id] error:', err)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // ✅ AUTH: Only admin can delete users
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  // ✅ PROTECTION: Prevent admin from deleting themselves
  if (params.id === auth.data.user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  try {
    const id = params.id

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Delete in correct order (foreign key constraints)
    await supabase.from('course_access').delete().eq('user_id', id)
    await supabase.from('orders').delete().eq('user_id', id)
    await supabase.from('profiles').delete().eq('id', id)
    await supabase.auth.admin.deleteUser(id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
