import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'
import { ASSIGNED_STATUSES, isAdminRole } from '@/lib/visibility'

/**
 * Client-facing programs endpoint.
 * Returns available programs + which one the client is currently enrolled in.
 * Used by the mobile app's Programs screen.
 */
export const dynamic = 'force-dynamic'

/**
 * Convert Block[] (custom page-builder format) to plain text.
 */
function blocksToText(value: any): string | null {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return blocksToText(parsed)
    } catch {}
    return value
  }
  if (!Array.isArray(value)) return null
  const parts = value.map((block: any) => {
    switch (block.type) {
      case 'text': return block.content || ''
      case 'heading': return block.content || ''
      case 'list': return (block.items || []).filter(Boolean).map((i: string) => '• ' + i).join('\n')
      case 'image_text': return block.content || ''
      case 'quote': return block.content || ''
      default: return ''
    }
  }).filter(Boolean)
  return parts.join('\n\n').trim() || null
}

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
      .select('id, name, name_secondary, description, description_secondary, full_description, full_description_secondary, hero_image_url, duration_weeks, goal, difficulty, is_private, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Client programs query error:', error)
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
    }

    // Every program this client is enrolled in / was assigned to
    const { data: assignments } = await supabase
      .from('client_programs')
      .select('program_id, status')
      .eq('client_id', userId)
      .in('status', ASSIGNED_STATUSES)

    const assignedIds = new Set((assignments || []).map((a: any) => a.program_id))
    const activeProgramId = (assignments || []).find((a: any) => a.status === 'active')?.program_id || null
    const isAdmin = isAdminRole(auth.data.profile?.role)

    // Mark which program is active + convert rich text to plain text.
    // Private programs stay out of the catalog for everyone except the
    // clients they were assigned to (and admins/trainers).
    const result = (programs || [])
      .filter((p: any) => !p.is_private || isAdmin || assignedIds.has(p.id))
      .map((p: any) => {
        const { is_private, ...rest } = p
        return {
          ...rest,
          full_description: blocksToText(p.full_description),
          full_description_secondary: blocksToText(p.full_description_secondary),
          is_active: p.id === activeProgramId,
        }
      })

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('GET /api/client/programs error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
