import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdminOnly } from '@/lib/api-auth'
import { isValidUUID } from '@/lib/security'
import { sendPasswordChangedByAdmin } from '@/lib/email'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // ✅ AUTH: Only admin can change user passwords
  const auth = await requireAdminOnly(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const id = params.id

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const body = await request.json()

    // ✅ VALIDATION: Strong password requirements
    if (!body.password || body.password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    if (!/[A-Z]/.test(body.password)) {
      return NextResponse.json({ error: 'Password must contain at least 1 uppercase letter' }, { status: 400 })
    }

    if (!/[0-9]/.test(body.password)) {
      return NextResponse.json({ error: 'Password must contain at least 1 number' }, { status: 400 })
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(body.password)) {
      return NextResponse.json({ error: 'Password must contain at least 1 special character' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { error } = await supabase.auth.admin.updateUserById(id, {
      password: body.password,
    })

    if (error) {
      console.error('Password change error:', error)
      return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
    }

    // Get user profile for email notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', id)
      .single()

    // ✅ SECURITY: Notify user that password was changed (do NOT send the password itself)
    if (profile?.email) {
      await sendPasswordChangedByAdmin(
        profile.email,
        profile.full_name || 'User',
        '********' // Never send plaintext passwords in email
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('POST /api/clients/[id]/password error:', err)
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}
