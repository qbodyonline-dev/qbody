import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { sendPasswordChangedByAdmin } from '@/lib/email'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const id = params.id
    const body = await request.json()

    if (!body.password || body.password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const { error } = await supabase.auth.admin.updateUserById(id, {
      password: body.password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user profile for email notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', id)
      .single()

    // Send email notification with new password
    if (profile?.email) {
      await sendPasswordChangedByAdmin(
        profile.email,
        profile.full_name || 'User',
        body.password
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
