import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

// POST — trainer sends response to checkin
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()

    if (!body.message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Insert response
    const { data, error } = await supabase
      .from('checkin_responses')
      .insert({
        checkin_id: params.id,
        trainer_id: auth.data.user.id,
        message: body.message.trim(),
        attachment_url: body.attachment_url || null,
      })
      .select(`
        *,
        profiles:trainer_id ( id, full_name, avatar_url )
      `)
      .single()

    if (error) {
      console.error('Create checkin response error:', error)
      return NextResponse.json({ error: 'Failed to send response' }, { status: 500 })
    }

    // Auto-mark checkin as reviewed
    await supabase
      .from('checkins')
      .update({ status: 'reviewed' })
      .eq('id', params.id)
      .eq('status', 'new')

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/checkins/[id]/respond error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
