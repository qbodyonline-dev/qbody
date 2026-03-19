import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin, authenticateRequest } from '@/lib/api-auth'
import { deleteStorageFile } from '@/lib/storage-cleanup'

// GET — single exercise
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('GET /api/exercises/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT — update exercise
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Only allow updating specific fields
    const allowedFields = [
      'name', 'name_secondary', 'description', 'description_secondary',
      'muscle_groups', 'equipment', 'category', 'difficulty',
      'instructions', 'instructions_secondary',
      'common_mistakes', 'common_mistakes_secondary',
      'regressions', 'regressions_secondary',
      'progressions', 'progressions_secondary',
      'video_url', 'thumbnail_url'
    ]

    const updates: Record<string, any> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // If video_url is changing, delete the old one from storage
    if ('video_url' in updates) {
      const { data: existing } = await supabase
        .from('exercises')
        .select('video_url')
        .eq('id', params.id)
        .single()

      if (existing?.video_url && existing.video_url !== updates.video_url) {
        await deleteStorageFile(supabase, existing.video_url)
      }
    }

    const { data, error } = await supabase
      .from('exercises')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Update exercise error:', error)
      return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('PUT /api/exercises/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE — delete exercise
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()

    // Fetch video_url before deleting so we can clean up storage
    const { data: existing } = await supabase
      .from('exercises')
      .select('video_url')
      .eq('id', params.id)
      .single()

    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Delete exercise error:', error)
      return NextResponse.json({ error: 'Failed to delete exercise' }, { status: 500 })
    }

    // Clean up video file from storage
    if (existing?.video_url) {
      await deleteStorageFile(supabase, existing.video_url)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/exercises/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
