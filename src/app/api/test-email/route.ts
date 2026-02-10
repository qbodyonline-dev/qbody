import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireAdminOnly } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/security'

/**
 * Test Email Route — ADMIN ONLY
 * Protected: requires admin authentication
 * Rate limited: max 5 test emails per minute
 */
export async function POST(request: NextRequest) {
  // ✅ AUTH: Only admin can send test emails
  const auth = await requireAdminOnly(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  // ✅ RATE LIMIT: Max 5 test emails per minute
  const rateCheck = await checkRateLimit(`test-email:${auth.data.user.id}`, 5, 60 * 1000)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many test emails. Please wait.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const testEmail = body.email

    if (!testEmail || typeof testEmail !== 'string') {
      return NextResponse.json({ error: 'Email address is required in request body' }, { status: 400 })
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Qbody <onboarding@resend.dev>',
      to: [testEmail],
      subject: 'Test Email from Qbody',
      html: `
        <h1>Test Email</h1>
        <p>If you see this, email is working!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
        <p>Requested by: ${auth.data.user.email}</p>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ success: false, error: 'Email sending failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
    })
  } catch (err: any) {
    console.error('Test email error:', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// ✅ Disable GET — was exposing config info
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed. Use POST with admin auth.' }, { status: 405 })
}
