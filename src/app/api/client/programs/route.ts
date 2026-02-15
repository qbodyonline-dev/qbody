import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'

/**
 * Client-facing programs endpoint.
 * Returns available programs + which one the client is currently enrolled in.
 * Used by the mobile app's Programs screen.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const userId = auth.data.user.id

  try {
    const supabase = createServerClient()

    // Get all programs
    const { data: programs, error } = await supabase
      .from('training_programs')
      .select('id, name, name_ru, description, description_ru, full_description, full_description_ru, hero_image_url, duration_weeks, goal, difficulty, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Client programs query error:', error)
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
    }

    // Get client's active program
    const { data: activeProgram } = await supabase
      .from('client_programs')
      .select('program_id')
      .eq('client_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    const activeProgramId = activeProgram?.program_id || null

    // Mark which program is active for this client
    const result = (programs || []).map((p: any) => ({
      ...p,
      is_active: p.id === activeProgramId,
    }))

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('GET /api/client/programs error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
