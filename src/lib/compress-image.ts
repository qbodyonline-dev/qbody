/**
 * Compress and resize image on client side before upload.
 * Returns a new File object with reduced size.
 */
export async function compressImage(
  file: File,
  maxWidth = 1920,
  maxHeight = 1200,
  quality = 0.82
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Scale down if needed
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context unavailable'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Try WebP first, fallback to JPEG
      const tryFormat = (format: string, ext: string) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              if (format === 'image/webp') {
                tryFormat('image/jpeg', 'jpg')
                return
              }
              reject(new Error('Compression failed'))
              return
            }
            const name = file.name.replace(/\.[^.]+$/, `.${ext}`)
            resolve(new File([blob], name, { type: format }))
          },
          format,
          quality
        )
      }

      tryFormat('image/webp', 'webp')
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}
