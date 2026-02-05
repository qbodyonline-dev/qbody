import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { sendWelcomeEmail, sendNewClientNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, courseSlug } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password and name are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Create user via admin API (auto-confirms email)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })

    if (authError) {
      // Handle duplicate email
      if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }
      console.error('Auth error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const userId = authData.user?.id

    if (userId) {
      // Ensure profile exists (may be created by trigger, but just in case)
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email,
          full_name: name,
          role: 'client',
        }, { onConflict: 'id' })

      // Send welcome email to client
      await sendWelcomeEmail(email, name, courseSlug)

      // Notify admin about new client
      await sendNewClientNotification({
        clientName: name,
        clientEmail: email,
        source: courseSlug ? `Course registration: ${courseSlug}` : 'Direct registration',
      })
    }

    return NextResponse.json({
      success: true,
      userId,
      message: 'Registration successful',
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
