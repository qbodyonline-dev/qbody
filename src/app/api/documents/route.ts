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

// GET — list all documents (admin)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Documents query error:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    return NextResponse.json({ documents: data || [] })
  } catch (err: any) {
    console.error('GET /api/documents error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST — create document metadata (after upload-url + actual upload)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const {
      title,
      title_secondary,
      description,
      description_secondary,
      file_path,
      file_name,
      file_size,
      mime_type,
      preview_url,
      is_paid,
      price,
      original_price,
      is_active,
    } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!file_path || !file_name) {
      return NextResponse.json({ error: 'File path and name are required' }, { status: 400 })
    }

    const paid = Boolean(is_paid)
    const priceNum = paid ? Math.max(0, Number(price) || 0) : 0
    const origPrice = original_price !== undefined && original_price !== null && original_price !== ''
      ? Math.max(0, Number(original_price) || 0)
      : null

    const insertPayload = {
      title: sanitizeString(title, 500),
      title_secondary: title_secondary ? sanitizeString(title_secondary, 500) : null,
      description: description ? sanitizeString(description, 5000) : null,
      description_secondary: description_secondary ? sanitizeString(description_secondary, 5000) : null,
      file_path: String(file_path).slice(0, 1000),
      file_name: sanitizeString(file_name, 500),
      file_size: Math.max(0, Number(file_size) || 0),
      mime_type: mime_type ? String(mime_type).slice(0, 100) : 'application/pdf',
      preview_url: sanitizeUrl(preview_url),
      is_paid: paid,
      price: priceNum,
      original_price: origPrice,
      is_active: is_active === undefined ? true : Boolean(is_active),
      created_by: auth.data.user.id,
    }

    const { data, error } = await supabase
      .from('documents')
      .insert(insertPayload)
      .select()
      .single()

    if (error || !data) {
      console.error('Create document error:', error)
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/documents error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
