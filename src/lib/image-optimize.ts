import sharp from 'sharp'

interface OptimizeResult {
  buffer: Buffer
  contentType: string
  extension: string
  originalSize: number
  optimizedSize: number
}

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/avif',
  'image/heic',
  'image/heif',
])

// Max dimensions for different use cases
const PRESETS = {
  // Chat attachments — small & fast
  chat: { maxWidth: 1200, maxHeight: 1200, quality: 75 },
  // General site images (page editor, course thumbnails)
  site: { maxWidth: 1920, maxHeight: 1920, quality: 80 },
  // Avatars — tiny
  avatar: { maxWidth: 400, maxHeight: 400, quality: 75 },
  // Full quality (course content)
  full: { maxWidth: 2560, maxHeight: 2560, quality: 85 },
} as const

type PresetName = keyof typeof PRESETS

/**
 * Checks if a MIME type is an image that can be optimized
 */
export function isOptimizableImage(mimeType: string): boolean {
  return IMAGE_TYPES.has(mimeType.toLowerCase())
}

/**
 * Optimize an image: resize to max bounds, convert to WebP
 * 
 * - Animated GIFs are passed through (sharp can't reliably handle multi-frame)
 * - Non-image files are returned as-is
 * - Already-small images are still converted to WebP for consistency
 */
export async function optimizeImage(
  inputBuffer: Buffer,
  mimeType: string,
  preset: PresetName = 'site'
): Promise<OptimizeResult> {
  const originalSize = inputBuffer.length

  // Skip non-images
  if (!isOptimizableImage(mimeType)) {
    return {
      buffer: inputBuffer,
      contentType: mimeType,
      extension: 'bin',
      originalSize,
      optimizedSize: originalSize,
    }
  }

  // Skip animated GIFs — pass through as-is
  if (mimeType === 'image/gif') {
    return {
      buffer: inputBuffer,
      contentType: 'image/gif',
      extension: 'gif',
      originalSize,
      optimizedSize: originalSize,
    }
  }

  const { maxWidth, maxHeight, quality } = PRESETS[preset]

  try {
    const optimized = await sharp(inputBuffer)
      .rotate() // Auto-rotate based on EXIF
      .resize(maxWidth, maxHeight, {
        fit: 'inside',        // Maintain aspect ratio, fit within bounds
        withoutEnlargement: true, // Don't upscale small images
      })
      .webp({ quality, effort: 4 }) // effort 4 = balanced speed/compression
      .toBuffer()

    return {
      buffer: optimized,
      contentType: 'image/webp',
      extension: 'webp',
      originalSize,
      optimizedSize: optimized.length,
    }
  } catch (err) {
    // If sharp fails (corrupt image, unsupported format), return original
    console.error('Image optimization failed, using original:', err)
    const ext = mimeType.split('/')[1] || 'bin'
    return {
      buffer: inputBuffer,
      contentType: mimeType,
      extension: ext,
      originalSize,
      optimizedSize: originalSize,
    }
  }
}

/**
 * Pick preset based on folder name
 */
export function presetFromFolder(folder: string): PresetName {
  const f = folder.toLowerCase()
  if (f.includes('chat') || f.includes('message')) return 'chat'
  if (f.includes('avatar') || f.includes('profile')) return 'avatar'
  if (f.includes('course-content') || f.includes('lesson')) return 'full'
  return 'site'
}
