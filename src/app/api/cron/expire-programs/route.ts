import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { autoExpirePrograms } from '@/lib/subscription'

export const maxDuration = 60

/**
 * Cron job: Expire overdue active programs.
 * Runs daily at 00:05 UTC via Vercel Cron.
 *
 * This is a safety net — individual API calls also auto-expire
 * on access, but this ensures programs get expired even if the
 * client doesn't open the app.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const expired = await autoExpirePrograms(supabase)

    console.log(`⏰ Cron expire-programs: ${expired} program(s) expired`)

    return NextResponse.json({
      ok: true,
      expired,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('Cron expire-programs error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
