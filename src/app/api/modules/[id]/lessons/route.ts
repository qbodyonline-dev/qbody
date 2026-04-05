import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { isValidUUID, sanitizeString } from '@/lib/security'

// POST create lesson — admin only
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })

  // ✅ VALIDATION: Check UUID format
  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid module ID' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()

    // DEBUG: Try insert with raw SQL approach - only required fields, let DB handle defaults
    const { data: d1, error: e1 } = await supabase
      .from('course_lessons')
      .insert({ module_id: params.id, title: 'test-only-required' })
      .select('id')
      .single()

    if (e1) {
      // Even minimal insert fails — check if it's the same integer overflow
      // Try to get column info
      const { data: colInfo, error: colErr } = await supabase
        .rpc('get_table_columns', { p_table: 'course_lessons' })

      return NextResponse.json({
        error: 'Minimal lesson insert failed',
        detail: e1.message,
        code: e1.code,
        hint: e1.hint,
        colInfo: colInfo || colErr?.message || 'no rpc',
      }, { status: 500 })
    }

    // Minimal worked - clean up and return debug info
    if (d1?.id) {
      // Before deleting, read what was stored
      const { data: fullRow } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('id', d1.id)
        .single()

      await supabase.from('course_lessons').delete().eq('id', d1.id)

      return NextResponse.json({
        debug: true,
        message: 'Minimal insert WORKED — full row data below',
        fullRow,
      })
    }

    return NextResponse.json({ debug: true, message: 'unexpected state', d1 })
  } catch (err: any) {
    console.error('POST /api/modules/[id]/lessons error:', err)
    return NextResponse.json({ error: 'Failed to create lesson', detail: err?.message }, { status: 500 })
  }
}
