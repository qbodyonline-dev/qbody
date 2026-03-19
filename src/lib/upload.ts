import { fetchWithAuth } from '@/lib/api'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
const IMAGE_MAX = 10 * 1024 * 1024   // 10 MB
const VIDEO_MAX = 100 * 1024 * 1024  // 100 MB

/**
 * Upload a file directly to Supabase Storage via signed URL.
 * Bypasses Vercel's 4.5MB body limit.
 *
 * Flow:
 * 1. API creates signed upload URL (tiny JSON request)
 * 2. Client uploads file directly to Supabase (no Vercel limit)
 * 3. Returns the public URL
 */
export async function uploadFile(
  file: File,
  folder: string,
): Promise<string> {
  const isImage = IMAGE_TYPES.includes(file.type)
  const isVideo = VIDEO_TYPES.includes(file.type)

  if (!isImage && !isVideo) {
    throw new Error(`Unsupported file type: ${file.type}`)
  }

  const maxSize = isVideo ? VIDEO_MAX : IMAGE_MAX
  if (file.size > maxSize) {
    const limitMB = Math.round(maxSize / 1024 / 1024)
    throw new Error(`File too large (max ${limitMB} MB)`)
  }

  // Step 1: Get signed upload URL from our API
  const res = await fetchWithAuth('/api/upload/signed-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      folder,
    }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to get upload URL')
  }

  const { signedUrl, token, path, bucket, publicUrl } = await res.json()

  // Step 2: Upload file directly to Supabase Storage (bypasses Vercel)
  const uploadRes = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  })

  if (!uploadRes.ok) {
    const text = await uploadRes.text().catch(() => '')
    throw new Error(`Upload failed: ${uploadRes.status} ${text}`)
  }

  return publicUrl
}

/**
 * Upload a video file with all validations.
 */
export async function uploadVideo(file: File, folder = 'exercises'): Promise<string> {
  if (!VIDEO_TYPES.includes(file.type)) {
    throw new Error('Unsupported video format. Use MP4, WebM, MOV, AVI or MKV')
  }
  if (file.size > VIDEO_MAX) {
    throw new Error('File too large (max 100 MB)')
  }
  return uploadFile(file, folder)
}

/**
 * Upload an image file with all validations.
 */
export async function uploadImage(file: File, folder = 'images'): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type)) {
    throw new Error('Unsupported image format. Use JPEG, PNG, WebP or GIF')
  }
  if (file.size > IMAGE_MAX) {
    throw new Error('File too large (max 10 MB)')
  }
  return uploadFile(file, folder)
}
