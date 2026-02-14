import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import crypto from 'crypto'

/**
 * Upload image to Supabase Storage.
 * Used by the block editor for program/course content images.
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

    // Validate file type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    const supabase = createServerClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `content/${crypto.randomUUID()}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('content-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from('content-images')
      .getPublicUrl(fileName)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err: any) {
    console.error('POST /api/upload error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
