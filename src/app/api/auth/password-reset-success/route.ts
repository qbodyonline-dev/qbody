import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'
import { isValidUUID } from '@/lib/security'
import { sendPasswordResetSuccess } from '@/lib/email'

export async function POST(request: NextRequest) {
  // ✅ AUTH: User must be authenticated (they just reset their own password)
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const body = await request.json()
    const { userId } = body

    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json({ error: 'Valid userId is required' }, { status: 400 })
    }

    // ✅ AUTHORIZATION: Users can only trigger notification for themselves, admins for anyone
    const isAdmin = auth.data.profile.role === 'admin'
    if (!isAdmin && auth.data.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createServerClient()

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single()

    if (profile?.email) {
      await sendPasswordResetSuccess(profile.email, profile.full_name || 'User')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Password reset success notification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
