import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { sendPasswordResetSuccess } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
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
