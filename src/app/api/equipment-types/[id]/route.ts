import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

// PATCH — update equipment type (admin). slug is immutable.
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
      .from('equipment_types')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('equipment_types update error:', error)
      return NextResponse.json({ error: 'Failed to update equipment type' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('PATCH /api/equipment-types/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE — admin. Reset exercises that reference this slug back to 'bodyweight'.
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()

    const { data: existing, error: fetchErr } = await supabase
      .from('equipment_types')
      .select('slug')
      .eq('id', params.id)
      .single()

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Equipment type not found' }, { status: 404 })
    }

    const { error: delErr } = await supabase
      .from('equipment_types')
      .delete()
      .eq('id', params.id)

    if (delErr) {
      console.error('equipment_types delete error:', delErr)
      return NextResponse.json({ error: 'Failed to delete equipment type' }, { status: 500 })
    }

    // Replace this slug with 'bodyweight' on referencing exercises (equipment is a single field)
    await supabase
      .from('exercises')
      .update({ equipment: 'bodyweight' })
      .eq('equipment', existing.slug)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/equipment-types/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
