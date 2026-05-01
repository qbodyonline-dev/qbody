import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

const SIGNED_URL_TTL = 60 * 5 // 5 minutes

/**
 * POST /api/documents/[id]/download
 * Returns a short-lived signed URL for the document file.
 * Access rules:
 *  - Free document: anyone (auth optional)
 *  - Paid: requires either purchased document_purchase OR admin/trainer role
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()

    // Fetch document
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, file_path, is_paid, is_active')
      .eq('id', params.id)
      .maybeSingle()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (!doc.is_active) {
      return NextResponse.json({ error: 'Document is not available' }, { status: 403 })
    }

    let canDownload = !doc.is_paid

    // For paid: require auth + (purchase OR admin/trainer)
    if (doc.is_paid) {
      const auth = await authenticateRequest(request)
      if (!auth.success) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      if (auth.data.profile.role === 'admin' || auth.data.profile.role === 'trainer') {
        canDownload = true
      } else {
        const { data: purchase } = await supabase
          .from('document_purchases')
          .select('id')
          .eq('user_id', auth.data.user.id)
          .eq('document_id', params.id)
          .eq('status', 'paid')
          .maybeSingle()

        canDownload = !!purchase
      }

      if (!canDownload) {
        return NextResponse.json({ error: 'Purchase required' }, { status: 403 })
      }
    }

    // Generate signed URL
    const { data: signed, error: signedError } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.file_path, SIGNED_URL_TTL, { download: true })

    if (signedError || !signed?.signedUrl) {
      console.error('Signed URL error:', signedError)
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 })
    }

    // Increment download counter (best-effort, fire-and-forget)
    ;(async () => {
      try {
        const { data: cur } = await supabase
          .from('documents')
          .select('download_count')
          .eq('id', params.id)
          .single()
        if (cur) {
          await supabase
            .from('documents')
            .update({ download_count: (cur.download_count || 0) + 1 })
            .eq('id', params.id)
        }
      } catch {}
    })()

    return NextResponse.json({ url: signed.signedUrl })
  } catch (err: any) {
    console.error('POST /api/documents/[id]/download error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
