import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { sendWelcomeEmail, sendNewClientNotification } from '@/lib/email'
import { verifyRecaptcha } from '@/lib/recaptcha-server'
import { sanitizeString, isValidEmail, checkRateLimit, getClientIP } from '@/lib/security'

export async function POST(request: NextRequest) {
  // ✅ RATE LIMIT: Max 5 registrations per IP per hour
  const ip = getClientIP(request)
  const rateCheck = await checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { email, password, name, phone, courseSlug, captchaToken } = body

    // ✅ CAPTCHA: Verify reCAPTCHA
    if (!captchaToken) {
      return NextResponse.json({ error: 'reCAPTCHA verification required' }, { status: 400 })
    }
    const captchaResult = await verifyRecaptcha(captchaToken)
    if (!captchaResult.success) {
      return NextResponse.json({ error: 'reCAPTCHA verification failed. Please try again.' }, { status: 403 })
    }

    // ✅ VALIDATION: Required fields
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password and name are required' }, { status: 400 })
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // ✅ VALIDATION: Email format
    const cleanEmail = email.trim().toLowerCase()
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // ✅ SANITIZE: Clean input fields
    const cleanName = sanitizeString(name.trim(), 200)
    const cleanPhone = phone.trim().replace(/[^0-9+\-() ]/g, '').slice(0, 20)
    const cleanCourseSlug = courseSlug ? courseSlug.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 200) : undefined

    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
    }

    // ✅ VALIDATION: Strong password requirements (min 8 chars)
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    if (password.length > 128) {
      return NextResponse.json({ error: 'Password is too long' }, { status: 400 })
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: 'Password must contain at least 1 uppercase letter' }, { status: 400 })
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json({ error: 'Password must contain at least 1 number' }, { status: 400 })
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
      return NextResponse.json({ error: 'Password must contain at least 1 special character' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Create user via admin API (auto-confirms email)
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
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
    }

    const userId = authData.user?.id

    if (userId) {
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

      await sendWelcomeEmail(cleanEmail, cleanName, cleanCourseSlug)

      await sendNewClientNotification({
        clientName: cleanName,
        clientEmail: cleanEmail,
        source: cleanCourseSlug ? `Course registration: ${cleanCourseSlug}` : 'Direct registration',
      })
    }

    return NextResponse.json({
      success: true,
      userId,
      message: 'Registration successful',
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    // ✅ SECURITY: Don't expose internal error details
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
