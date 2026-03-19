import { SupabaseClient } from '@supabase/supabase-js'

const BUCKET_IMAGES = 'content-images'
const BUCKET_VIDEOS = 'content-videos'

/**
 * Extract the storage path from a Supabase public URL.
 * URL format: https://xxx.supabase.co/storage/v1/object/public/BUCKET/path/to/file.ext
 * Returns { bucket, path } or null if not a Supabase storage URL.
 */
export function parseStorageUrl(url: string | null | undefined): { bucket: string; path: string } | null {
  if (!url) return null
  if (!url.includes('supabase.co/storage')) return null

  try {
    const parsed = new URL(url)
    // pathname: /storage/v1/object/public/BUCKET_NAME/folder/file.ext
    const match = parsed.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/)
    if (!match) return null
    return { bucket: match[1], path: match[2] }
  } catch {
    return null
  }
}

/**
 * Delete a file from Supabase Storage by its public URL.
 * Silently ignores non-Supabase URLs (YouTube, Vimeo, etc).
 */
export async function deleteStorageFile(supabase: SupabaseClient, url: string | null | undefined): Promise<void> {
  const parsed = parseStorageUrl(url)
  if (!parsed) return // Not a Supabase URL — nothing to delete

  try {
    const { error } = await supabase.storage.from(parsed.bucket).remove([parsed.path])
    if (error) {
      console.warn(`Failed to delete storage file ${parsed.bucket}/${parsed.path}:`, error.message)
    }
  } catch (err) {
    console.warn('deleteStorageFile error:', err)
  }
}

/**
 * Delete multiple files from Supabase Storage by their public URLs.
 */
export async function deleteStorageFiles(supabase: SupabaseClient, urls: (string | null | undefined)[]): Promise<void> {
  // Group by bucket for efficient batch deletion
  const byBucket: Record<string, string[]> = {}

  for (const url of urls) {
    const parsed = parseStorageUrl(url)
    if (!parsed) continue
    if (!byBucket[parsed.bucket]) byBucket[parsed.bucket] = []
    byBucket[parsed.bucket].push(parsed.path)
  }

  for (const [bucket, paths] of Object.entries(byBucket)) {
    try {
      const { error } = await supabase.storage.from(bucket).remove(paths)
      if (error) {
        console.warn(`Failed to delete ${paths.length} files from ${bucket}:`, error.message)
      }
    } catch (err) {
      console.warn('deleteStorageFiles error:', err)
    }
  }
}
