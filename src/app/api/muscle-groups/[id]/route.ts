import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

// PATCH — update muscle group (admin). Only name_en/name_ru/display_order; slug is immutable.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()

    const updates: Record<string, any> = {}
    if (typeof body.name_en === 'string') updates.name_en = body.name_en.trim()
    if (typeof body.name_ru === 'string') updates.name_ru = body.name_ru.trim()
    if (typeof body.display_order === 'number') updates.display_order = body.display_order

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('muscle_groups')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('muscle_groups update error:', error)
      return NextResponse.json({ error: 'Failed to update muscle group' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('PATCH /api/muscle-groups/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE — admin. Also strip the slug from any exercise that still references it.
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()

    // Look up the slug before deleting
    const { data: existing, error: fetchErr } = await supabase
      .from('muscle_groups')
      .select('slug')
      .eq('id', params.id)
      .single()

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Muscle group not found' }, { status: 404 })
    }

    const { error: delErr } = await supabase
      .from('muscle_groups')
      .delete()
      .eq('id', params.id)

    if (delErr) {
      console.error('muscle_groups delete error:', delErr)
      return NextResponse.json({ error: 'Failed to delete muscle group' }, { status: 500 })
    }

    // Best-effort: remove the slug from all exercises' muscle_groups arrays
    const { error: cleanupErr } = await supabase.rpc('remove_muscle_group_slug', { target_slug: existing.slug })
    if (cleanupErr) {
      // Fallback: do it inline. RPC may not exist; ignore failure silently — orphan slugs are harmless.
      console.warn('remove_muscle_group_slug RPC missing, falling back to client-side update:', cleanupErr.message)
      const { data: affected } = await supabase
        .from('exercises')
        .select('id, muscle_groups')
        .contains('muscle_groups', [existing.slug])

      if (affected && affected.length > 0) {
        await Promise.all(
          affected.map(ex =>
            supabase
              .from('exercises')
              .update({ muscle_groups: (ex.muscle_groups || []).filter((s: string) => s !== existing.slug) })
              .eq('id', ex.id)
          )
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/muscle-groups/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
