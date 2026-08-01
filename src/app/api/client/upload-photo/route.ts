import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'

/**
 * Client photo upload (check-in progress photos etc).
 * Accepts base64 JPEG, uploads to Supabase Storage, returns the public URL.
 * The record itself (e.g. checkin_photos) is created by the follow-up request
 * that references the returned URL.
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const userId = auth.data.user.id

  try {
    const body = await request.json()
    const { image } = body // base64 encoded JPEG

    if (!image) {
      return NextResponse.json({ error: 'Image data required' }, { status: 400 })
    }

    const buffer = Buffer.from(image, 'base64')

    // Limit size: 5MB
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 400 })
    }

    const supabase = createServerClient()
    const filePath = `checkins/${userId}/${Date.now()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('content-images')
      .upload(filePath, buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('Client photo upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from('content-images')
      .getPublicUrl(filePath)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err: any) {
    console.error('POST /api/client/upload-photo error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
