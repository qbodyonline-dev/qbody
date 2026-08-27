import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest, requireAdmin } from '@/lib/api-auth'
import { isValidUUID, sanitizeString } from '@/lib/security'
import { escapeHtml } from '@/lib/email-templates'
import { canSeeProgram } from '@/lib/visibility'

export const dynamic = 'force-dynamic'

const GOALS = ['weight_loss', 'muscle_gain', 'endurance', 'recovery', 'general', 'beginner', 'home']
const DIFFS = ['beginner', 'intermediate', 'advanced']

function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null
  try {
    const parsed = new URL(trimmed)
    if (!['http:', 'https:'].includes(parsed.protocol)) return null
    return trimmed.slice(0, 2000)
  } catch {
    if (trimmed.startsWith('/')) return trimmed.slice(0, 2000)
    return null
  }
}

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

// escapeHtml imported from @/lib/email-templates

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
    return `<p>${escapeHtml(value)}</p>`
  }
  if (!Array.isArray(value) || value.length === 0) return null
  const parts = value.map((block: any) => {
    switch (block.type) {
      case 'text':
        return block.content ? `<p>${escapeHtml(block.content)}</p>` : ''
      case 'heading': {
        const tag = `h${block.level || 2}`
        return block.content ? `<${tag}>${escapeHtml(block.content)}</${tag}>` : ''
      }
      case 'image':
        return block.url ? `<img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt || '')}" style="width:100%;border-radius:12px;" />` : ''
      case 'list': {
        const items = (block.items || []).filter(Boolean)
        if (items.length === 0) return ''
        const tag = block.style === 'ordered' ? 'ol' : 'ul'
        return `<${tag}>${items.map((i: string) => `<li>${escapeHtml(i)}</li>`).join('')}</${tag}>`
      }
      case 'image_text': {
        let html = ''
        if (block.url) html += `<img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt || '')}" style="width:100%;border-radius:12px;margin-bottom:8px;" />`
        if (block.content) html += `<p>${escapeHtml(block.content)}</p>`
        return html
      }
      case 'quote':
        return block.content ? `<blockquote style="border-left:3px solid #14b8a6;padding-left:12px;font-style:italic;color:#666;">${escapeHtml(block.content)}${block.author ? `<br/><small>— ${escapeHtml(block.author)}</small>` : ''}</blockquote>` : ''
      case 'video':
        return '' // skip video for mobile
      default:
        return ''
    }
  }).filter(Boolean)
  return parts.join('') || null
}

/**
 * Normalize blocks: if value is a JSON string, parse it. If array, return as-is.
 */
function normalizeBlocks(value: any): any[] | null {
  if (!value) return null
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
    } catch {}
  }
  return null
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

  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 })
  }

  const isAdmin = auth.data.profile?.role === 'admin' || auth.data.profile?.role === 'trainer'

  // If NOT admin, return client-friendly response
  if (!isAdmin) {
    try {
      const supabase = createServerClient()
      const { data, error } = await supabase
        .from('training_programs')
        .select(`
          id, name, name_secondary, description, description_secondary,
          full_description, full_description_secondary,
          hero_image_url, duration_weeks, goal, difficulty, is_private,
          price, original_price, features, features_secondary, includes, includes_secondary,
          created_at,
          program_days (
            week_number, day_of_week, is_rest_day,
            workouts:workout_id ( name, name_secondary, type, estimated_duration )
          )
        `)
        .eq('id', params.id)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Program not found' }, { status: 404 })
      }

      // Private program — readable only by the clients it was assigned to.
      // Same 404 as a missing program, so a shared link tells a stranger nothing.
      if (data.is_private && !(await canSeeProgram(auth.data.user.id, params.id))) {
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

      // Normalize blocks: parse JSON strings into arrays
      const fdBlocks = normalizeBlocks(data.full_description)
      const fdBlocksSecondary = normalizeBlocks(data.full_description_secondary)

      return NextResponse.json({
        ...data,
        full_description: blocksToText(data.full_description),
        full_description_secondary: blocksToText(data.full_description_secondary),
        full_description_blocks: fdBlocks,
        full_description_secondary_blocks: fdBlocksSecondary,
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
          id, week_number, day_of_week, workout_id, is_rest_day, notes, notes_secondary,
          workouts:workout_id ( id, name, name_secondary, type, difficulty, estimated_duration )
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

  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { name, name_secondary, slug, description, description_secondary, full_description, full_description_secondary, hero_image_url, duration_weeks, goal, difficulty, is_active, is_private, days, price, original_price, features, features_secondary, includes: includesArr, includes_secondary } = body

    const s = (v: string, len = 1000) => sanitizeString(v, len)

    // Update program fields
    const updates: Record<string, any> = {}
    if (name !== undefined) updates.name = s(name, 500)
    if (name_secondary !== undefined) updates.name_secondary = name_secondary ? s(name_secondary, 500) : null
    if (slug !== undefined) {
      updates.slug = slug ? slug.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 80) : null
      // Check slug uniqueness (exclude current program)
      if (updates.slug) {
        const { data: existingSlug } = await supabase
          .from('training_programs')
          .select('id')
          .eq('slug', updates.slug)
          .neq('id', params.id)
          .maybeSingle()
        if (existingSlug) {
          return NextResponse.json({ error: 'A program with this slug already exists' }, { status: 409 })
        }
      }
    }
    if (description !== undefined) updates.description = description ? s(description, 5000) : null
    if (description_secondary !== undefined) updates.description_secondary = description_secondary ? s(description_secondary, 5000) : null
    if (full_description !== undefined) updates.full_description = full_description
    if (full_description_secondary !== undefined) updates.full_description_secondary = full_description_secondary
    if (hero_image_url !== undefined) updates.hero_image_url = sanitizeUrl(hero_image_url)
    if (duration_weeks !== undefined) updates.duration_weeks = Math.max(1, Math.min(Number(duration_weeks) || 8, 52))
    if (goal !== undefined) updates.goal = GOALS.includes(goal) ? goal : 'general'
    if (difficulty !== undefined) updates.difficulty = DIFFS.includes(difficulty) ? difficulty : 'intermediate'
    if (is_active !== undefined) updates.is_active = !!is_active
    if (is_private !== undefined) updates.is_private = !!is_private
    if (price !== undefined) updates.price = Math.max(0, Math.round(Number(price) || 0))
    if (original_price !== undefined) updates.original_price = original_price ? Math.max(0, Math.round(Number(original_price) || 0)) : null
    if (features !== undefined) updates.features = Array.isArray(features) ? features.filter(Boolean).map((f: string) => s(f, 500)) : []
    if (features_secondary !== undefined) updates.features_secondary = Array.isArray(features_secondary) ? features_secondary.filter(Boolean).map((f: string) => s(f, 500)) : []
    if (includesArr !== undefined) updates.includes = Array.isArray(includesArr) ? includesArr.filter(Boolean).map((f: string) => s(f, 500)) : []
    if (includes_secondary !== undefined) updates.includes_secondary = Array.isArray(includes_secondary) ? includes_secondary.filter(Boolean).map((f: string) => s(f, 500)) : []

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

    // Replace days if provided (with backup for atomicity)
    if (days !== undefined && Array.isArray(days)) {
      // Backup existing days before deleting
      const { data: backup } = await supabase
        .from('program_days')
        .select('program_id, week_number, day_of_week, workout_id, is_rest_day, notes, notes_secondary')
        .eq('program_id', params.id)

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
            notes_secondary: d.notes_secondary || null,
          }))

        if (rows.length > 0) {
          const { error: insError } = await supabase.from('program_days').insert(rows)
          if (insError) {
            console.error('Insert program days error:', insError)
            // Restore backup on insert failure
            if (backup && backup.length > 0) {
              await supabase.from('program_days').insert(backup)
            }
            return NextResponse.json({ error: 'Failed to update program schedule' }, { status: 500 })
          }
        }
      }
    }

    // Re-fetch
    const { data: full } = await supabase
      .from('training_programs')
      .select(`*, program_days ( *, workouts:workout_id ( id, name, name_secondary, type, difficulty, estimated_duration ) )`)
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

  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 })
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
