import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'

/**
 * Client-facing programs endpoint.
 * Returns available programs + which one the client is currently enrolled in.
 * Used by the mobile app's Programs screen.
 */
export const dynamic = 'force-dynamic'

/**
 * Convert Tiptap/ProseMirror JSON to plain text.
 */
function tiptapToText(value: any): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  try {
    const nodes = Array.isArray(value) ? value : value.content || []
    return extractText(nodes).trim() || null
  } catch {
    return null
  }
}

function extractText(nodes: any[]): string {
  if (!Array.isArray(nodes)) return ''
  return nodes.map((node: any) => {
    if (node.type === 'text') return node.text || ''
    if (node.content) return extractText(node.content) + (node.type === 'paragraph' ? '\n' : '')
    if (node.type === 'hardBreak') return '\n'
    return ''
  }).join('')
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

    // Mark which program is active + convert rich text to plain text
    const result = (programs || []).map((p: any) => ({
      ...p,
      full_description: tiptapToText(p.full_description),
      full_description_ru: tiptapToText(p.full_description_ru),
      is_active: p.id === activeProgramId,
    }))

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('GET /api/client/programs error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
