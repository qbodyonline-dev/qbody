import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const STRIPE_API_VERSION = '2024-04-10'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

type StripeKeys = {
  publishableKey: string
  secretKey: string
  webhookSecret: string
}

type StripeSettings = {
  mode: 'test' | 'live'
  test: StripeKeys
  live: StripeKeys
}

// ─── In-memory cache ───
let cachedStripe: Stripe | null = null
let cachedWebhookSecret: string | null = null
let cacheTimestamp = 0

/** Invalidate cache — call after saving new keys */
export function invalidateStripeCache() {
  cachedStripe = null
  cachedWebhookSecret = null
  cacheTimestamp = 0
}

function isCacheValid(): boolean {
  return Date.now() - cacheTimestamp < CACHE_TTL_MS
}

/** Load Stripe settings from site_settings table */
async function loadStripeSettings(): Promise<StripeSettings | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) return null

  try {
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'stripe')
      .single()

    return (data?.value as StripeSettings) ?? null
  } catch {
    return null
  }
}

/**
 * Get a configured Stripe instance.
 * Reads keys from DB (with cache), falls back to env vars.
 */
export async function getStripe(): Promise<Stripe> {
  if (cachedStripe && isCacheValid()) {
    return cachedStripe
  }

  const settings = await loadStripeSettings()
  let secretKey: string | undefined

  if (settings) {
    const activeKeys = settings.mode === 'live' ? settings.live : settings.test
    if (activeKeys.secretKey) {
      secretKey = activeKeys.secretKey
    }
  }

  // Fallback to env
  if (!secretKey) {
    secretKey = process.env.STRIPE_SECRET_KEY
  }

  if (!secretKey) {
    throw new Error('No Stripe secret key configured (neither in DB nor in environment)')
  }

  cachedStripe = new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION as any,
    typescript: true,
  })
  cacheTimestamp = Date.now()

  return cachedStripe
}

/**
 * Get the webhook secret for signature verification.
 * Reads from DB (with cache), falls back to env var.
 */
export async function getWebhookSecret(): Promise<string> {
  if (cachedWebhookSecret && isCacheValid()) {
    return cachedWebhookSecret
  }

  const settings = await loadStripeSettings()
  let webhookSecret: string | undefined

  if (settings) {
    const activeKeys = settings.mode === 'live' ? settings.live : settings.test
    if (activeKeys.webhookSecret) {
      webhookSecret = activeKeys.webhookSecret
    }
  }

  // Fallback to env
  if (!webhookSecret) {
    webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  }

  if (!webhookSecret) {
    throw new Error('No Stripe webhook secret configured (neither in DB nor in environment)')
  }

  cachedWebhookSecret = webhookSecret
  // Re-use same timestamp as Stripe instance
  if (!cacheTimestamp) cacheTimestamp = Date.now()

  return cachedWebhookSecret
}

/**
 * Legacy static export for backward compatibility.
 * Uses env vars only. Prefer getStripe() for dynamic key resolution.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: STRIPE_API_VERSION as any,
  typescript: true,
})
