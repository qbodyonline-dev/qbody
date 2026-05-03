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
const MAX_SIZE = 50 * 1024 * 1024 // 50MB — лимит Supabase проекта

// Возвращает true если bucket существует/создан, false если создать не удалось.
// Главный путь создания — SQL-миграция 20260503_documents_storage_bucket.sql.
// Этот fallback пытается поднять bucket в runtime, но если падает —
// ошибка пробрасывается наружу (а не глотается, как было раньше).
async function ensureBucket(supabase: any): Promise<{ ok: boolean; error?: string }> {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) {
    return { ok: false, error: `listBuckets: ${listError.message}` }
  }
  if (buckets?.find((b: any) => b.id === BUCKET)) {
    return { ok: true }
  }
  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: MAX_SIZE,
  })
  if (createError) {
    // Если bucket уже создан другим процессом параллельно — это ок
    if (/already exists/i.test(createError.message)) return { ok: true }
    return { ok: false, error: `createBucket: ${createError.message}` }
  }
  return { ok: true }
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
    const bucketCheck = await ensureBucket(supabase)
    if (!bucketCheck.ok) {
      console.error('Document bucket unavailable:', bucketCheck.error)
      return NextResponse.json({
        error: `Storage bucket "${BUCKET}" is not available. Run migration 20260503_documents_storage_bucket.sql or create the bucket manually in Supabase Studio. Reason: ${bucketCheck.error}`,
      }, { status: 500 })
    }

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
