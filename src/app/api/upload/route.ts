import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import crypto from 'crypto'

export const maxDuration = 60

const IMAGE_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'image/avif', 'image/heic', 'image/heif',
]
const VIDEO_TYPES = [
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
  'video/ogg', 'video/x-m4v', 'video/3gpp',
]
const IMAGE_MAX = 15 * 1024 * 1024   // 15 MB (HEIC photos from iPhones can be larger)
const VIDEO_MAX = 200 * 1024 * 1024  // 200 MB (matches security.MAX_VIDEO_SIZE)

const BUCKET_IMAGES = 'content-images'
const BUCKET_VIDEOS = 'content-videos'

async function ensureBucket(supabase: any, bucketId: string) {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.find((b: any) => b.id === bucketId)) {
    const { error } = await supabase.storage.createBucket(bucketId, { public: true })
    if (error) console.error(`Create bucket "${bucketId}" error:`, error)
  }
}

/**
 * Upload image or video to Supabase Storage.
 * Images  → content-images bucket (max 10 MB)
 * Videos  → content-videos bucket (max 100 MB)
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const isImage = IMAGE_TYPES.includes(file.type)
    const isVideo = VIDEO_TYPES.includes(file.type)

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: images (jpeg, png, webp, gif) and videos (mp4, webm, mov, avi, mkv)` },
        { status: 400 }
      )
    }

    const maxSize = isVideo ? VIDEO_MAX : IMAGE_MAX
    if (file.size > maxSize) {
      const limitMB = Math.round(maxSize / 1024 / 1024)
      return NextResponse.json(
        { error: `File too large (max ${limitMB} MB for ${isVideo ? 'videos' : 'images'})` },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const ext = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg')
    const folder = formData.get('folder') as string | null
    const prefix = folder ? `${folder}/` : 'content/'
    const fileName = `${prefix}${crypto.randomUUID()}.${ext}`
    const bucket = isVideo ? BUCKET_VIDEOS : BUCKET_IMAGES

    await ensureBucket(supabase, bucket)

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err: any) {
    console.error('POST /api/upload error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
