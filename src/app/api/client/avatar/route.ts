import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'

/**
 * Client avatar upload.
 * Accepts base64 image, uploads to Supabase Storage, updates profile.
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const userId = auth.data.user.id

  try {
    const body = await request.json()
    const { image } = body // base64 encoded image

    if (!image) {
      return NextResponse.json({ error: 'Image data required' }, { status: 400 })
    }

    // Decode base64
    const buffer = Buffer.from(image, 'base64')

    // Limit size: 5MB
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 400 })
    }

    const supabase = createServerClient()
    const filePath = `avatars/${userId}.jpg`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('Avatar upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const avatarUrl = urlData.publicUrl + `?t=${Date.now()}`

    // Update profile
    await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', userId)

    // Update auth user metadata
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { avatar_url: avatarUrl },
    })

    return NextResponse.json({ avatar_url: avatarUrl })
  } catch (err: any) {
    console.error('POST /api/client/avatar error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
