import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { checkRateLimit, getClientIP } from '@/lib/security'

export const dynamic = 'force-dynamic'

const FROM_EMAIL = process.env.EMAIL_FROM || 'Qbody <noreply@qbody.fit>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@qbody.fit'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 submissions per hour per IP
    const ip = getClientIP(request)
    const rl = await checkRateLimit(`public-contact:${ip}`, 5, 60 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    // Soft size limit: cap each field at 2KB, total fields at 30
    const entries = Object.entries(body).slice(0, 30)
    const fields: Record<string, string> = {}
    for (const [k, v] of entries) {
      if (typeof v !== 'string' && typeof v !== 'number') continue
      const key = String(k).slice(0, 60)
      const val = String(v).slice(0, 2000)
      if (val.trim()) fields[key] = val
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: 'Empty submission' }, { status: 400 })
    }

    // Honeypot — if a field literally named "website" or "url" is filled, drop silently
    if (fields.website || fields.url_honey) {
      return NextResponse.json({ ok: true })
    }

    // Find a likely email field for replyTo
    const replyTo = Object.entries(fields).find(([k, v]) =>
      /email|mail/i.test(k) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    )?.[1]

    const page = fields._page || ''

    const rows = Object.entries(fields)
      .filter(([k]) => !k.startsWith('_'))
      .map(([k, v]) =>
        `<tr><td style="padding:6px 12px;font-weight:600;color:#555;border-bottom:1px solid #eee;">${escapeHtml(k)}</td><td style="padding:6px 12px;color:#222;border-bottom:1px solid #eee;white-space:pre-wrap;">${escapeHtml(v)}</td></tr>`
      )
      .join('')

    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f6f7f9;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #e5e7eb;">
  <h2 style="margin:0 0 16px;color:#111;font-size:18px;">New Contact Form Submission</h2>
  <p style="margin:0 0 12px;color:#555;font-size:13px;">Page: <code>${escapeHtml(page) || '/'}</code> · IP: <code>${escapeHtml(ip)}</code></p>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>
</div></body></html>`

    if (!process.env.RESEND_API_KEY) {
      console.warn('[contact] RESEND_API_KEY not set — submission logged only', fields)
      return NextResponse.json({ ok: true })
    }

    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `Contact form: ${page || 'website'}`,
      html,
      replyTo: replyTo || undefined,
    })

    if (error) {
      console.error('[contact] resend error', error)
      return NextResponse.json({ error: 'Send failed' }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact] exception', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
