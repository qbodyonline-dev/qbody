import { NextRequest, NextResponse } from 'next/server'
import { verifyRecaptcha } from '@/lib/recaptcha-server'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'reCAPTCHA token required' }, { status: 400 })
    }

    const result = await verifyRecaptcha(token)

    if (!result.success) {
      return NextResponse.json({ error: 'reCAPTCHA verification failed', score: result.score }, { status: 403 })
    }

    return NextResponse.json({ success: true, score: result.score })
  } catch {
    return NextResponse.json({ error: 'Verification error' }, { status: 500 })
  }
}
