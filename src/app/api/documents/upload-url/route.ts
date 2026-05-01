import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import crypto from 'crypto'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/zip',
  'application/x-zip-compressed',
  'application/epub+zip',
  'text/plain',
  'image/jpeg',
  'image/png',
]

const BUCKET = 'documents'
const MAX_SIZE = 100 * 1024 * 1024 // 100MB

async function ensureBucket(supabase: any) {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.find((b: any) => b.id === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: MAX_SIZE,
    })
    if (error) console.error(`Create bucket "${BUCKET}" error:`, error)
  }
}

/**
 * Generate a signed upload URL for direct client → Supabase upload (private bucket).
 * Returns a path that should later be saved with POST /api/documents.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const { fileName, contentType, fileSize } = await request.json()

    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'fileName and contentType are required' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: `Unsupported file type: ${contentType}` }, { status: 400 })
    }

    if (fileSize && Number(fileSize) > MAX_SIZE) {
      return NextResponse.json({ error: `File too large (max ${Math.round(MAX_SIZE / 1024 / 1024)} MB)` }, { status: 400 })
    }

    const ext = String(fileName).split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf'
    const filePath = `${crypto.randomUUID()}.${ext}`

    const supabase = createServerClient()
    await ensureBucket(supabase)

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(filePath)

    if (error) {
      console.error('Document signed URL error:', error)
      return NextResponse.json({ error: `Failed to create upload URL: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: filePath,
      bucket: BUCKET,
    })
  } catch (err: any) {
    console.error('POST /api/documents/upload-url error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
