import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { validateUploadFile, checkRateLimit, getClientIP } from '@/lib/security'

export async function POST(request: Request) {
  // ✅ AUTH: Only admin/trainer can upload files
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  // ✅ RATE LIMIT: Max 30 uploads per minute per user
  const ip = getClientIP(request)
  const rateCheck = checkRateLimit(`upload:${auth.data.user.id}`, 30, 60 * 1000)
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

    // ✅ SANITIZE: Clean folder name — only allow alphanumeric, hyphens, underscores
    const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || 'uploads'

    // Generate unique filename with safe extension
    const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 10)
    const fileName = `${cleanFolder}/${timestamp}-${randomStr}.${ext}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('course-assets')
      .upload(fileName, buffer, {
        contentType: file.type,
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
      size: file.size,
      type: file.type
    })
  } catch (err: any) {
    console.error('POST /api/upload error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
