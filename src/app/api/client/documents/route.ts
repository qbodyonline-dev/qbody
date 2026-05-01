import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/client/documents
 * List all documents the user has access to:
 *  - All purchased (paid) documents
 *  - For admin/trainer: all active documents
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
    }

    const supabase = createServerClient()
    const isStaff = auth.data.profile.role === 'admin' || auth.data.profile.role === 'trainer'

    if (isStaff) {
      // Staff sees all active documents
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, title_secondary, description, description_secondary, preview_url, file_name, file_size, mime_type, is_paid, price, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
      }
      return NextResponse.json({ documents: data || [] })
    }

    // Regular user: documents they purchased
    const { data: purchases, error } = await supabase
      .from('document_purchases')
      .select(`
        id,
        created_at,
        amount_paid,
        documents (
          id, title, title_secondary, description, description_secondary,
          preview_url, file_name, file_size, mime_type, is_paid, price
        )
      `)
      .eq('user_id', auth.data.user.id)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Client documents fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    const list = (purchases || [])
      .map((p: any) => p.documents ? { ...p.documents, purchased_at: p.created_at, amount_paid: p.amount_paid } : null)
      .filter(Boolean)

    return NextResponse.json({ documents: list })
  } catch (err: any) {
    console.error('GET /api/client/documents error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
