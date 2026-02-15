import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest, requireAdmin } from '@/lib/api-auth'

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

/**
 * Convert Block[] to HTML for mobile rendering.
 */
function blocksToHtml(value: any): string | null {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return blocksToHtml(parsed)
    } catch {}
    return `<p>${value}</p>`
  }
  if (!Array.isArray(value) || value.length === 0) return null
  const parts = value.map((block: any) => {
    switch (block.type) {
      case 'text':
        return block.content ? `<p>${block.content}</p>` : ''
      case 'heading': {
        const tag = `h${block.level || 2}`
        return block.content ? `<${tag}>${block.content}</${tag}>` : ''
      }
      case 'image':
        return block.url ? `<img src="${block.url}" alt="${block.alt || ''}" style="width:100%;border-radius:12px;" />` : ''
      case 'list': {
        const items = (block.items || []).filter(Boolean)
        if (items.length === 0) return ''
        const tag = block.style === 'ordered' ? 'ol' : 'ul'
        return `<${tag}>${items.map((i: string) => `<li>${i}</li>`).join('')}</${tag}>`
      }
      case 'image_text': {
        let html = ''
        if (block.url) html += `<img src="${block.url}" alt="${block.alt || ''}" style="width:100%;border-radius:12px;margin-bottom:8px;" />`
        if (block.content) html += `<p>${block.content}</p>`
        return html
      }
      case 'quote':
        return block.content ? `<blockquote style="border-left:3px solid #14b8a6;padding-left:12px;font-style:italic;color:#666;">${block.content}${block.author ? `<br/><small>— ${block.author}</small>` : ''}</blockquote>` : ''
      case 'video':
        return '' // skip video for mobile
      default:
        return ''
    }
  }).filter(Boolean)
  return parts.join('') || null
}

// GET — single program with days + clients
// Supports both admin and client access
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Try client auth first (mobile app / client)
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const isAdmin = auth.data.profile?.role === 'admin' || auth.data.profile?.role === 'trainer'

  // If NOT admin, return client-friendly response
  if (!isAdmin) {
    try {
      const supabase = createServerClient()
      const { data, error } = await supabase
        .from('training_programs')
        .select(`
          id, name, name_ru, description, description_ru,
          full_description, full_description_ru,
          hero_image_url, duration_weeks, goal, difficulty,
          price, original_price, features, features_ru, includes, includes_ru,
          created_at,
          program_days (
            week_number, day_of_week, is_rest_day,
            workouts:workout_id ( name, name_ru, type, estimated_duration )
          )
        `)
        .eq('id', params.id)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Program not found' }, { status: 404 })
      }

      // Sort days
      if (data.program_days) {
        data.program_days.sort((a: any, b: any) =>
          a.week_number !== b.week_number ? a.week_number - b.week_number : a.day_of_week - b.day_of_week
        )
      }

      const totalWorkouts = (data.program_days || []).filter((d: any) => !d.is_rest_day && d.workouts).length

      // Check if client has active enrollment
      const { data: enrollment } = await supabase
        .from('client_programs')
        .select('id, status, start_date, current_week')
        .eq('client_id', auth.data.user.id)
        .eq('program_id', params.id)
        .maybeSingle()

      return NextResponse.json({
        ...data,
        full_description: blocksToText(data.full_description),
        full_description_ru: blocksToText(data.full_description_ru),
        full_description_html: blocksToHtml(data.full_description),
        full_description_ru_html: blocksToHtml(data.full_description_ru),
        total_workouts: totalWorkouts,
        enrollment: enrollment || null,
      })
    } catch (err: any) {
      console.error('GET /api/programs/[id] client error:', err)
      return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
  }

  // Admin flow (original)

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('training_programs')
      .select(`
        *,
        program_days (
          id, week_number, day_of_week, workout_id, is_rest_day, notes, notes_ru,
          workouts:workout_id ( id, name, name_ru, type, difficulty, estimated_duration )
        )
      `)
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Get assigned clients
    const { data: clients } = await supabase
      .from('client_programs')
      .select(`
        id, status, start_date, end_date, current_week, created_at,
        profiles:client_id ( id, full_name, email, avatar_url )
      `)
      .eq('program_id', params.id)
      .in('status', ['active', 'paused', 'completed'])
      .order('created_at', { ascending: false })

    // Sort days
    data.program_days = (data.program_days || []).sort((a: any, b: any) =>
      a.week_number !== b.week_number ? a.week_number - b.week_number : a.day_of_week - b.day_of_week
    )

    return NextResponse.json({ ...data, assigned_clients: clients || [] })
  } catch (err: any) {
    console.error('GET /api/programs/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT — update program + replace days
export async function PUT(
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
    const { name, name_ru, slug, description, description_ru, full_description, full_description_ru, hero_image_url, duration_weeks, goal, difficulty, is_active, days } = body

    // Update program fields
    const updates: Record<string, any> = {}
    if (name !== undefined) updates.name = name
    if (name_ru !== undefined) updates.name_ru = name_ru || null
    if (slug !== undefined) updates.slug = slug || null
    if (description !== undefined) updates.description = description || null
    if (description_ru !== undefined) updates.description_ru = description_ru || null
    if (full_description !== undefined) updates.full_description = full_description
    if (full_description_ru !== undefined) updates.full_description_ru = full_description_ru
    if (hero_image_url !== undefined) updates.hero_image_url = hero_image_url
    if (duration_weeks !== undefined) updates.duration_weeks = duration_weeks
    if (goal !== undefined) updates.goal = goal
    if (difficulty !== undefined) updates.difficulty = difficulty
    if (is_active !== undefined) updates.is_active = is_active

    if (Object.keys(updates).length > 0) {
      const { error: uError } = await supabase
        .from('training_programs')
        .update(updates)
        .eq('id', params.id)

      if (uError) {
        console.error('Update program error:', uError)
        return NextResponse.json({ error: 'Failed to update program' }, { status: 500 })
      }
    }

    // Replace days if provided
    if (days !== undefined && Array.isArray(days)) {
      // Delete existing days
      await supabase.from('program_days').delete().eq('program_id', params.id)

      // Insert new days
      if (days.length > 0) {
        const rows = days
          .filter((d: any) => d.workout_id || d.is_rest_day)
          .map((d: any) => ({
            program_id: params.id,
            week_number: d.week_number,
            day_of_week: d.day_of_week,
            workout_id: d.is_rest_day ? null : (d.workout_id || null),
            is_rest_day: d.is_rest_day || false,
            notes: d.notes || null,
            notes_ru: d.notes_ru || null,
          }))

        if (rows.length > 0) {
          const { error: insError } = await supabase.from('program_days').insert(rows)
          if (insError) console.error('Insert program days error:', insError)
        }
      }
    }

    // Re-fetch
    const { data: full } = await supabase
      .from('training_programs')
      .select(`*, program_days ( *, workouts:workout_id ( id, name, name_ru, type, difficulty, estimated_duration ) )`)
      .eq('id', params.id)
      .single()

    return NextResponse.json(full)
  } catch (err: any) {
    console.error('PUT /api/programs/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE — delete program (cascade deletes program_days)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()

    // Check for active client assignments
    const { data: activeClients } = await supabase
      .from('client_programs')
      .select('id')
      .eq('program_id', params.id)
      .eq('status', 'active')

    if (activeClients && activeClients.length > 0) {
      return NextResponse.json({
        error: `Cannot delete: ${activeClients.length} active client(s) assigned`
      }, { status: 409 })
    }

    const { error } = await supabase
      .from('training_programs')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Delete program error:', error)
      return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/programs/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
