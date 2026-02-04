import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const id = params.id

    // Get profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, created_at')
      .eq('id', id)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get course access
    const { data: accessData } = await supabase
      .from('course_access')
      .select('course_slug, granted_at')
      .eq('user_id', id)

    // Get orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      ...profile,
      courses: accessData || [],
      orders: ordersData || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const id = params.id
    const body = await request.json()

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: body.full_name,
        phone: body.phone,
      })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const id = params.id

    // Delete course_access
    await supabase.from('course_access').delete().eq('user_id', id)
    
    // Delete orders
    await supabase.from('orders').delete().eq('user_id', id)
    
    // Delete profile
    await supabase.from('profiles').delete().eq('id', id)
    
    // Delete auth user
    await supabase.auth.admin.deleteUser(id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
