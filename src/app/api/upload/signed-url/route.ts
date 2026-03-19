import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import crypto from 'crypto'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']

const BUCKET_IMAGES = 'content-images'
const BUCKET_VIDEOS = 'content-videos'

async function ensureBucket(supabase: any, bucketId: string) {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.find((b: any) => b.id === bucketId)) {
    const { error } = await supabase.storage.createBucket(bucketId, {
      public: true,
      fileSizeLimit: bucketId === BUCKET_VIDEOS ? 100 * 1024 * 1024 : 10 * 1024 * 1024,
    })
    if (error) console.error(`Create bucket "${bucketId}" error:`, error)
  }
}

/**
 * Generate a signed upload URL for direct client → Supabase upload.
 * This bypasses Vercel's 4.5MB body limit.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const { fileName, contentType, folder } = await request.json()

    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'fileName and contentType are required' }, { status: 400 })
    }

    const isImage = IMAGE_TYPES.includes(contentType)
    const isVideo = VIDEO_TYPES.includes(contentType)

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: `Invalid file type: ${contentType}` },
        { status: 400 }
      )
    }

    const bucket = isVideo ? BUCKET_VIDEOS : BUCKET_IMAGES
    const ext = fileName.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg')
    const prefix = folder ? `${folder}/` : 'content/'
    const filePath = `${prefix}${crypto.randomUUID()}.${ext}`

    const supabase = createServerClient()
    await ensureBucket(supabase, bucket)

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath)

    if (error) {
      console.error('Signed URL error:', error)
      return NextResponse.json({ error: `Failed to create upload URL: ${error.message}` }, { status: 500 })
    }

    // Build the public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: filePath,
      bucket,
      publicUrl: urlData.publicUrl,
    })
  } catch (err: any) {
    console.error('POST /api/upload/signed-url error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
