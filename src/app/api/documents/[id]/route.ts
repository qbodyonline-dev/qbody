import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { sanitizeString } from '@/lib/security'

export const dynamic = 'force-dynamic'

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

// GET — single document
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()

    if (error) {
      console.error('Document fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('GET /api/documents/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT — update document metadata
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const updateData: Record<string, any> = {}

    if (body.title !== undefined) {
      if (!body.title || !String(body.title).trim()) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
      }
      updateData.title = sanitizeString(body.title, 500)
    }
    if (body.title_secondary !== undefined) {
      updateData.title_secondary = body.title_secondary ? sanitizeString(body.title_secondary, 500) : null
    }
    if (body.description !== undefined) {
      updateData.description = body.description ? sanitizeString(body.description, 5000) : null
    }
    if (body.description_secondary !== undefined) {
      updateData.description_secondary = body.description_secondary ? sanitizeString(body.description_secondary, 5000) : null
    }
    if (body.preview_url !== undefined) {
      updateData.preview_url = sanitizeUrl(body.preview_url)
    }
    if (body.is_paid !== undefined) {
      updateData.is_paid = Boolean(body.is_paid)
    }
    if (body.price !== undefined) {
      updateData.price = Math.max(0, Number(body.price) || 0)
    }
    if (body.original_price !== undefined) {
      updateData.original_price = body.original_price === null || body.original_price === ''
        ? null
        : Math.max(0, Number(body.original_price) || 0)
    }
    if (body.is_active !== undefined) {
      updateData.is_active = Boolean(body.is_active)
    }
    // file replacement
    if (body.file_path !== undefined && body.file_path) {
      updateData.file_path = String(body.file_path).slice(0, 1000)
    }
    if (body.file_name !== undefined && body.file_name) {
      updateData.file_name = sanitizeString(body.file_name, 500)
    }
    if (body.file_size !== undefined) {
      updateData.file_size = Math.max(0, Number(body.file_size) || 0)
    }
    if (body.mime_type !== undefined && body.mime_type) {
      updateData.mime_type = String(body.mime_type).slice(0, 100)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error || !data) {
      console.error('Update document error:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('PUT /api/documents/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE — delete document + storage file
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()

    // Fetch to know file_path
    const { data: doc } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', params.id)
      .maybeSingle()

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Delete document error:', error)
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    // Best-effort storage cleanup
    if (doc?.file_path) {
      await supabase.storage.from('documents').remove([doc.file_path]).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('DELETE /api/documents/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
