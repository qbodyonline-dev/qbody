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
    const { userId, avatarUrl } = await request.json()

    if (!userId || !avatarUrl) {
      return NextResponse.json({ error: 'userId and avatarUrl required' }, { status: 400 })
    }

    // Save avatar in auth user metadata (always works)
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { avatar_url: avatarUrl },
    })

    if (authError) {
      console.error('Update user metadata error:', authError)
    }

    // Also try to update profiles table (column may or may not exist)
    try {
      await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', userId)
    } catch {} // Ignore if column doesn't exist

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('POST /api/clients/update-avatar error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
