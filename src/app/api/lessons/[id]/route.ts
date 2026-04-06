import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { isValidUUID, sanitizeString } from '@/lib/security'
import { deleteStorageFile, deleteStorageFiles } from '@/lib/storage-cleanup'

export const dynamic = 'force-dynamic'

// GET single lesson — admin only
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  if (!isValidUUID(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('course_lessons')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('GET /api/lessons/[id] error:', err)
    return NextResponse.json({ error: 'Failed to fetch lesson' }, { status: 500 })
  }
}

// PATCH update lesson — admin only
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  if (!isValidUUID(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    const supabase = createServerClient()
    const body = await request.json()
    
    // ✅ VALIDATION: Whitelist allowed lesson types
    const allowedTypes = ['video', 'text', 'task', 'quiz', 'assignment']
    
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = sanitizeString(body.title, 500)
    if (body.title_secondary !== undefined) updateData.title_secondary = sanitizeString(body.title_secondary, 500)
    if (body.type !== undefined && allowedTypes.includes(body.type)) updateData.type = body.type
    if (body.duration_minutes !== undefined) updateData.duration_minutes = Math.max(0, Math.min(Number(body.duration_minutes) || 0, 600))
    // Fetch existing lesson data if video or content is changing (for storage cleanup)
    const needsExisting =
      body.video_url !== undefined ||
      body.video_url_secondary !== undefined ||
      body.content !== undefined ||
      body.content_secondary !== undefined
    let existing: any = null
    if (needsExisting) {
      const { data } = await supabase
        .from('course_lessons')
        .select('video_url, video_url_secondary, content, content_secondary')
        .eq('id', params.id)
        .single()
      existing = data
    }

    if (body.video_url !== undefined) {
      if (existing?.video_url && existing.video_url !== body.video_url) {
        await deleteStorageFile(supabase, existing.video_url)
      }
      updateData.video_url = body.video_url
    }
    if (body.video_url_secondary !== undefined) {
      if (existing?.video_url_secondary && existing.video_url_secondary !== body.video_url_secondary) {
        await deleteStorageFile(supabase, existing.video_url_secondary)
      }
      updateData.video_url_secondary = body.video_url_secondary
    }

    // Clean up orphaned images: compare old vs new content blocks (across both languages)
    const extractImageUrls = (content: any): string[] => {
      if (!Array.isArray(content)) return []
      return content
        .filter((b: any) => b.type === 'image' && b.content)
        .map((b: any) => b.content)
    }
    if (body.content !== undefined) {
      const oldUrls = new Set(extractImageUrls(existing?.content))
      const newUrls = new Set(extractImageUrls(body.content))
      const orphaned = Array.from(oldUrls).filter(url => !newUrls.has(url))
      if (orphaned.length > 0) {
        await deleteStorageFiles(supabase, orphaned)
      }
      updateData.content = body.content
    }
    if (body.content_secondary !== undefined) {
      const oldUrls = new Set(extractImageUrls(existing?.content_secondary))
      const newUrls = new Set(extractImageUrls(body.content_secondary))
      const orphaned = Array.from(oldUrls).filter(url => !newUrls.has(url))
      if (orphaned.length > 0) {
        await deleteStorageFiles(supabase, orphaned)
      }
      updateData.content_secondary = body.content_secondary
    }
    if (body.is_free !== undefined) updateData.is_free = !!body.is_free
    if (body.is_published !== undefined) updateData.is_published = !!body.is_published
    if (body.sort_order !== undefined) updateData.sort_order = Number(body.sort_order) || 0
    
    const { data, error } = await supabase
      .from('course_lessons')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('PATCH /api/lessons/[id] error:', err)
    return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 })
  }
}

// DELETE lesson — admin only
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  if (!isValidUUID(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  try {
    const supabase = createServerClient()

    // Fetch lesson data before deleting so we can clean up storage
    const { data: existing } = await supabase
      .from('course_lessons')
      .select('video_url, video_url_secondary, content, content_secondary')
      .eq('id', params.id)
      .single()

    const { error } = await supabase
      .from('course_lessons')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    // Clean up storage files (videos + images in content blocks for both languages)
    if (existing) {
      const urlsToDelete: (string | null)[] = [existing.video_url, existing.video_url_secondary]
      const collectImages = (content: any) => {
        if (!Array.isArray(content)) return
        for (const block of content) {
          if (block.type === 'image' && block.content) urlsToDelete.push(block.content)
        }
      }
      collectImages(existing.content)
      collectImages(existing.content_secondary)
      await deleteStorageFiles(supabase, urlsToDelete)
    }
    
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/lessons/[id] error:', err)
    return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 })
  }
}
