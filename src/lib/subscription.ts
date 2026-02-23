import { createServerClient } from '@/lib/supabase-server'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Auto-expire programs whose end_date has passed.
 * Called lazily from client APIs and daily via cron.
 * Accepts optional supabase client (reuse existing) and optional clientId (scope to one user).
 * Returns count of expired programs.
 */
export async function autoExpirePrograms(
  supabaseOrClientId?: SupabaseClient | string,
  clientId?: string,
): Promise<number> {
  // Flexible signature: autoExpirePrograms() | autoExpirePrograms(supabase) | autoExpirePrograms(supabase, clientId) | autoExpirePrograms(clientId)
  let supabase: SupabaseClient
  let scopeClientId: string | undefined

  if (typeof supabaseOrClientId === 'string') {
    supabase = createServerClient()
    scopeClientId = supabaseOrClientId
  } else {
    supabase = supabaseOrClientId || createServerClient()
    scopeClientId = clientId
  }

  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('client_programs')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('status', 'active')
    .not('end_date', 'is', null)
    .lt('end_date', today)

  if (scopeClientId) {
    query = query.eq('client_id', scopeClientId)
  }

  const { data, error } = await query.select('id')

  if (error) {
    console.error('autoExpirePrograms error:', error)
    return 0
  }

  const count = data?.length || 0
  if (count > 0) {
    console.log(`⏰ Auto-expired ${count} program(s)${scopeClientId ? ` for client ${scopeClientId}` : ''}`)
  }

  return count
}

/**
 * Check if a specific client_program is accessible (active or paused).
 * Returns { allowed, reason } — if not allowed, reason explains why.
 */
export function isProgramAccessible(status: string, endDate: string | null): {
  allowed: boolean
  reason?: string
} {
  if (status === 'expired') {
    return { allowed: false, reason: 'Program subscription has expired' }
  }
  if (status === 'cancelled') {
    return { allowed: false, reason: 'Program was cancelled' }
  }
  if (status === 'completed') {
    return { allowed: false, reason: 'Program is completed' }
  }
  // Double-check end_date even if status hasn't been updated yet
  if (endDate) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    if (new Date() > end) {
      return { allowed: false, reason: 'Program subscription has expired' }
    }
  }
  return { allowed: true }
}

/**
 * Calculate days remaining until program end_date.
 * Returns null if no end_date, 0 if already passed, or positive number.
 */
export function daysRemaining(endDate: string | null): number | null {
  if (!endDate) return null
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)
  const now = new Date()
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}
