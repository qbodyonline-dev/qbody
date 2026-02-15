import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { sendWelcomeEmail, sendNewClientNotification } from '@/lib/email'
import { sanitizeString, isValidEmail, checkRateLimit, getClientIP } from '@/lib/security'

/**
 * Mobile Registration Endpoint
 * Similar to /api/auth/register but without reCAPTCHA requirement.
 * Uses stricter rate limiting instead.
 * Called from QBody mobile app (KMP).
 */
export async function POST(request: NextRequest) {
  // Verify this is from mobile app
  const platform = request.headers.get('x-client-platform')
  if (platform !== 'mobile') {
    return NextResponse.json({ error: 'Invalid client' }, { status: 403 })
  }

  // ✅ RATE LIMIT: Stricter for mobile (no captcha) — 3 per IP per hour
  const ip = getClientIP(request)
  const rateCheck = await checkRateLimit(`register-mobile:${ip}`, 3, 60 * 60 * 1000)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { email, password, name, phone } = body

    // ✅ VALIDATION: Required fields
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password and name are required' }, { status: 400 })
    }

    // ✅ VALIDATION: Email format
    const cleanEmail = email.trim().toLowerCase()
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // ✅ SANITIZE
    const cleanName = sanitizeString(name.trim(), 200)
    const cleanPhone = phone ? phone.trim().replace(/[^0-9+\-() ]/g, '').slice(0, 20) : null

    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
    }

    // ✅ VALIDATION: Password requirements
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    if (password.length > 128) {
      return NextResponse.json({ error: 'Password is too long' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Create user via admin API (auto-confirms email — no email verification needed)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: cleanName },
    })

    if (authError) {
      if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
      }
      console.error('Mobile register auth error:', authError)
      return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
    }

    const userId = authData.user?.id

    if (userId) {
      // Create profile
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: cleanEmail,
          full_name: cleanName,
          phone: cleanPhone,
          role: 'client',
          onboarding_completed: false,
        }, { onConflict: 'id' })

      // Send welcome email (non-blocking)
      try {
        await sendWelcomeEmail(cleanEmail, cleanName)
        await sendNewClientNotification({
          clientName: cleanName,
          clientEmail: cleanEmail,
          source: 'Mobile app registration',
        })
      } catch (emailErr) {
        console.error('Email notification error:', emailErr)
        // Don't fail registration if email fails
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      message: 'Registration successful',
    })
  } catch (error: any) {
    console.error('Mobile registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
