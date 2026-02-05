import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { sendAccountDeleted, sendAccountDeletedAdmin } from '@/lib/email'

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get user profile before deletion for email notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single()

    const clientName = profile?.full_name || 'User'
    const clientEmail = profile?.email || ''

    // Delete course access
    await supabase.from('course_access').delete().eq('user_id', userId)

    // Delete orders
    await supabase.from('orders').delete().eq('user_id', userId)

    // Delete profile
    await supabase.from('profiles').delete().eq('id', userId)

    // Delete auth user (requires service_role)
    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    // Send email notifications
    if (clientEmail) {
      // Confirm to client
      await sendAccountDeleted(clientEmail, clientName)
      
      // Notify admin
      await sendAccountDeletedAdmin({
        clientName,
        clientEmail,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
