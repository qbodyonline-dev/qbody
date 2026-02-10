import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'
import { isValidUUID } from '@/lib/security'
import { sendAccountDeleted, sendAccountDeletedAdmin } from '@/lib/email'

export async function DELETE(request: NextRequest) {
  // ✅ AUTH: Must be authenticated
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    if (!isValidUUID(userId)) {
      return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 })
    }

    // ✅ AUTHORIZATION: Users can only delete their own account, admins can delete anyone
    const isAdmin = auth.data.profile.role === 'admin'
    const isSelf = auth.data.user.id === userId

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: 'You can only delete your own account' }, { status: 403 })
    }

    // ✅ PROTECTION: Prevent last admin from deleting themselves
    if (isAdmin && isSelf) {
      const supabase = createServerClient()
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin')
      
      if ((count || 0) <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last admin account' }, { status: 400 })
      }
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

    // Delete in correct order
    await supabase.from('course_access').delete().eq('user_id', userId)
    await supabase.from('orders').delete().eq('user_id', userId)
    await supabase.from('profiles').delete().eq('id', userId)

    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    // Send email notifications
    if (clientEmail) {
      await sendAccountDeleted(clientEmail, clientName)
      await sendAccountDeletedAdmin({ clientName, clientEmail })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
