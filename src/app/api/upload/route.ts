import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { validateUploadFile, checkRateLimit, getClientIP } from '@/lib/security'
import { optimizeImage, isOptimizableImage, presetFromFolder } from '@/lib/image-optimize'

export async function POST(request: Request) {
  // ✅ AUTH: Only admin/trainer can upload files
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  // ✅ RATE LIMIT: Max 30 uploads per minute per user
  const ip = getClientIP(request)
  const rateCheck = await checkRateLimit(`upload:${auth.data.user.id}`, 30, 60 * 1000)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many uploads. Please wait.' }, { status: 429 })
  }

  try {
    const supabase = createServerClient()
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'uploads'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // ✅ VALIDATION: Check file type and size
    const validation = validateUploadFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // ✅ SANITIZE: Clean folder name
    const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || 'uploads'

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let buffer: any = Buffer.from(arrayBuffer)

    // ✅ IMAGE OPTIMIZATION: Compress & convert to WebP
    let finalContentType = file.type
    let finalExtension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
    let optimizedSize = buffer.length

    if (isOptimizableImage(file.type)) {
      const preset = presetFromFolder(cleanFolder)
      const result = await optimizeImage(buffer, file.type, preset)
      
      buffer = result.buffer
      finalContentType = result.contentType
      finalExtension = result.extension
      optimizedSize = result.optimizedSize

      // Log compression stats
      const savings = result.originalSize - result.optimizedSize
      const pct = result.originalSize > 0 ? Math.round((savings / result.originalSize) * 100) : 0
      if (savings > 0) {
        console.log(
          `[Image Optimize] ${file.name}: ${(result.originalSize / 1024).toFixed(0)}KB → ${(result.optimizedSize / 1024).toFixed(0)}KB (${pct}% saved, preset: ${preset})`
        )
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 10)
    const fileName = `${cleanFolder}/${timestamp}-${randomStr}.${finalExtension}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('course-assets')
      .upload(fileName, buffer, {
        contentType: finalContentType,
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('course-assets')
      .getPublicUrl(fileName)

    return NextResponse.json({ 
      url: urlData.publicUrl,
      path: fileName,
      size: optimizedSize,
      originalSize: file.size,
      type: finalContentType,
    })
  } catch (err: any) {
    console.error('POST /api/upload error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
