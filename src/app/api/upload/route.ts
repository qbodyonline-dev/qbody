import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'uploads'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const fileName = `${folder}/${timestamp}-${randomStr}.${ext}`

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

export const config = {
  api: {
    bodyParser: false,
  },
}
