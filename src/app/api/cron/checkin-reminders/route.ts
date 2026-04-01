import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { escapeHtml } from '@/lib/email-templates'

// Allow up to 60s for cron execution (Pro plan)
export const maxDuration = 60

/**
 * Cron job: Check for clients with overdue check-ins.
 * Runs daily via Vercel Cron.
 * 
 * Logic:
 * 1. Get all active clients (role='client' with active program OR recent checkins)
 * 2. For each client, find their last checkin date
 * 3. If last checkin > X days ago (default 7, configurable), create notification
 * 4. Send digest email to trainer
 * 
 * Protected by CRON_SECRET header.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // 1. Get checkin frequency from settings (default: 7 days)
    const { data: freqSetting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'checkin_frequency_days')
      .maybeSingle()

    const frequencyDays = Number(freqSetting?.value) || 7

    // 2. Get all clients with active programs
    const { data: activeClients } = await supabase
      .from('client_programs')
      .select('client_id, profiles:client_id(id, full_name, email)')
      .eq('status', 'active')

    if (!activeClients || activeClients.length === 0) {
      return NextResponse.json({ message: 'No active clients', notifications: 0 })
    }

    // Deduplicate by client_id
    const clientMap = new Map<string, { id: string; full_name: string; email: string }>()
    for (const row of activeClients) {
      const profile = row.profiles as any
      if (profile?.id && !clientMap.has(profile.id)) {
        clientMap.set(profile.id, profile)
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 3. For each client check last checkin
    const overdueClients: { id: string; name: string; email: string; lastCheckin: string | null; daysSince: number }[] = []

    for (const [clientId, profile] of Array.from(clientMap.entries())) {
      // Find last checkin
      const { data: lastCheckin } = await supabase
        .from('checkins')
        .select('checkin_date')
        .eq('client_id', clientId)
        .order('checkin_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      const lastDate = lastCheckin?.checkin_date || null

      let isOverdue = false
      let daysSince = 0

      if (!lastDate) {
        // Never did a checkin — check if program started > frequencyDays ago
        const { data: cp } = await supabase
          .from('client_programs')
          .select('start_date')
          .eq('client_id', clientId)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle()

        if (cp?.start_date) {
          const startDate = new Date(cp.start_date)
          daysSince = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
          isOverdue = daysSince >= frequencyDays
        }
      } else {
        const lastDateObj = new Date(lastDate)
        daysSince = Math.floor((today.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24))
        isOverdue = daysSince >= frequencyDays
      }

      if (isOverdue) {
        // Check we haven't already notified about this gap today
        const todayStr = today.toISOString().split('T')[0]
        const { data: existing } = await supabase
          .from('trainer_notifications')
          .select('id')
          .eq('type', 'missed_checkin')
          .eq('client_id', clientId)
          .gte('created_at', todayStr + 'T00:00:00Z')
          .limit(1)
          .maybeSingle()

        if (!existing) {
          overdueClients.push({
            id: clientId,
            name: profile.full_name || profile.email || 'Unknown client',
            email: profile.email,
            lastCheckin: lastDate,
            daysSince,
          })
        }
      }
    }

    // 4. Create notifications
    if (overdueClients.length > 0) {
      const notifications = overdueClients.map(client => ({
        type: 'missed_checkin',
        client_id: client.id,
        title: `${client.name} — missed check-in`,
        message: client.lastCheckin
          ? `Last check-in was ${client.daysSince} days ago (${client.lastCheckin}). Expected every ${frequencyDays} days.`
          : `No check-ins yet. Program started ${client.daysSince} days ago.`,
        metadata: {
          days_since: client.daysSince,
          last_checkin: client.lastCheckin,
          frequency_days: frequencyDays,
        },
      }))

      const { error: insertErr } = await supabase
        .from('trainer_notifications')
        .insert(notifications)

      let insertedOk = true
      if (insertErr) {
        console.error('Insert notifications error:', insertErr)
        insertedOk = false
      }

      // 5. Send digest email to trainer
      await sendDigestEmail(overdueClients, frequencyDays)

      return NextResponse.json({
        message: `Checked ${clientMap.size} clients, ${overdueClients.length} overdue`,
        notifications: overdueClients.length,
        frequency_days: frequencyDays,
        insertError: !insertedOk ? insertErr?.message : undefined,
      })
    }

    return NextResponse.json({
      message: `Checked ${clientMap.size} clients, ${overdueClients.length} overdue`,
      notifications: overdueClients.length,
      frequency_days: frequencyDays,
    })

  } catch (err: any) {
    console.error('Cron checkin-reminders error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── Email digest ──

async function sendDigestEmail(
  clients: { name: string; email: string; lastCheckin: string | null; daysSince: number }[],
  frequencyDays: number,
) {
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@qbody.fit'
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Qbody'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qbody.fit'

    const clientRows = clients.map(c => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-weight:500;">${escapeHtml(c.name)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#ef4444;font-weight:600;">${c.daysSince} days</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#666;">${c.lastCheckin || 'Never'}</td>
      </tr>
    `).join('')

    const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
      <div style="background:linear-gradient(135deg,#14b8a6,#0d9488);padding:24px 32px;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:20px;">⚠️ Missed Check-in Alert</h1>
        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">${clients.length} client${clients.length > 1 ? 's' : ''} overdue (>${frequencyDays} days)</p>
      </div>
      <div style="padding:24px 32px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f8f8f8;">
              <th style="padding:8px 12px;text-align:left;font-weight:600;color:#333;">Client</th>
              <th style="padding:8px 12px;text-align:left;font-weight:600;color:#333;">Overdue</th>
              <th style="padding:8px 12px;text-align:left;font-weight:600;color:#333;">Last Check-in</th>
            </tr>
          </thead>
          <tbody>
            ${clientRows}
          </tbody>
        </table>
        <div style="margin-top:24px;text-align:center;">
          <a href="${appUrl}/dashboard/checkins" style="display:inline-block;padding:12px 32px;background:#14b8a6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View Check-ins →</a>
        </div>
      </div>
      <div style="padding:16px 32px;background:#f8f8f8;border-radius:0 0 12px 12px;">
        <p style="margin:0;font-size:12px;color:#888;">This is an automated notification from ${siteName}. Check-in frequency: every ${frequencyDays} days.</p>
      </div>
    </div>`

    await resend.emails.send({
      from: process.env.EMAIL_FROM || `${siteName} <noreply@qbody.fit>`,
      to: [adminEmail],
      subject: `⚠️ ${clients.length} client${clients.length > 1 ? 's' : ''} missed check-in — ${siteName}`,
      html,
    })
  } catch (err) {
    console.error('Failed to send digest email:', err)
  }
}
