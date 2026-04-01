import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { invalidateStripeCache } from '@/lib/stripe'
import Stripe from 'stripe'

const STRIPE_SETTINGS_KEY = 'stripe'

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

const EMPTY_KEYS: StripeKeys = { publishableKey: '', secretKey: '', webhookSecret: '' }

const DEFAULT_SETTINGS: StripeSettings = {
  mode: 'test',
  test: { ...EMPTY_KEYS },
  live: { ...EMPTY_KEYS },
}

/**
 * Mask a secret key: keep prefix (up to 2nd underscore) + last 4 chars.
 * "sk_test_abc123xyz" -> "sk_test_••••••xyz"
 * Empty/short keys -> ""
 */
function maskKey(key: string | undefined | null): string {
  if (!key || key.length < 8) return ''
  // Find prefix end (e.g., "sk_test_", "pk_live_", "whsec_")
  const parts = key.split('_')
  let prefix = ''
  if (parts.length >= 3) {
    // e.g. sk_test_xxx -> prefix = "sk_test_"
    prefix = parts.slice(0, 2).join('_') + '_'
  } else if (parts.length === 2) {
    // e.g. whsec_xxx -> prefix = "whsec_"
    prefix = parts[0] + '_'
  } else {
    prefix = ''
  }
  const suffix = key.slice(-4)
  const maskedLen = Math.max(key.length - prefix.length - 4, 4)
  return prefix + '••••••'.slice(0, maskedLen) + suffix
}

/** Check if value is a masked placeholder (contains ••) */
function isMasked(val: string | undefined | null): boolean {
  return !!val && val.includes('••')
}

function maskKeys(keys: StripeKeys): StripeKeys {
  return {
    publishableKey: keys.publishableKey || '',
    secretKey: maskKey(keys.secretKey),
    webhookSecret: maskKey(keys.webhookSecret),
  }
}

/** Validate Stripe key prefixes */
function validateKeys(keys: StripeKeys, mode: 'test' | 'live'): string | null {
  const pkPrefix = mode === 'test' ? 'pk_test_' : 'pk_live_'
  const skPrefix = mode === 'test' ? 'sk_test_' : 'sk_live_'

  if (keys.publishableKey && !keys.publishableKey.startsWith(pkPrefix)) {
    return `Publishable key must start with ${pkPrefix}`
  }
  if (keys.secretKey && !isMasked(keys.secretKey) && !keys.secretKey.startsWith(skPrefix)) {
    return `Secret key must start with ${skPrefix}`
  }
  if (keys.webhookSecret && !isMasked(keys.webhookSecret) && !keys.webhookSecret.startsWith('whsec_')) {
    return `Webhook secret must start with whsec_`
  }
  return null
}

async function loadSettings(supabase: ReturnType<typeof createServerClient>): Promise<StripeSettings> {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', STRIPE_SETTINGS_KEY)
    .single()

  if (!data?.value) return { ...DEFAULT_SETTINGS }
  const val = data.value as StripeSettings
  return {
    mode: val.mode || 'test',
    test: { ...EMPTY_KEYS, ...val.test },
    live: { ...EMPTY_KEYS, ...val.live },
  }
}

/**
 * GET — read Stripe settings with masked secrets
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const settings = await loadSettings(supabase)

    return NextResponse.json({
      mode: settings.mode,
      test: maskKeys(settings.test),
      live: maskKeys(settings.live),
      hasTestKeys: !!settings.test.secretKey,
      hasLiveKeys: !!settings.live.secretKey,
    })
  } catch (err: any) {
    console.error('GET /api/settings/stripe error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

/**
 * POST — save settings or test connection
 * Body: { action: "save" | "test", ... }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { action } = body

    // ─── Test connection ───
    if (action === 'test') {
      const { secretKey, mode } = body as { secretKey: string; mode: 'test' | 'live' }

      let realKey = secretKey
      // If masked, retrieve from DB
      if (isMasked(secretKey)) {
        const settings = await loadSettings(supabase)
        realKey = mode === 'live' ? settings.live.secretKey : settings.test.secretKey
      }

      if (!realKey) {
        return NextResponse.json({ success: false, error: 'No secret key configured' })
      }

      try {
        const testStripe = new Stripe(realKey, { apiVersion: '2024-04-10' })
        await testStripe.balance.retrieve()
        return NextResponse.json({ success: true })
      } catch (stripeErr: any) {
        return NextResponse.json({
          success: false,
          error: stripeErr.message || 'Connection failed',
        })
      }
    }

    // ─── Save settings ───
    const { mode, test: testKeys, live: liveKeys } = body as {
      mode: 'test' | 'live'
      test: StripeKeys
      live: StripeKeys
    }

    if (!mode || !['test', 'live'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
    }

    // Load current settings to preserve masked values
    const current = await loadSettings(supabase)

    // Merge: if field is masked or empty -> keep current value
    // Empty string protection: onFocus clears masked value to '',
    // so saving with '' must NOT overwrite the real stored key
    const mergeKeys = (incoming: StripeKeys, existing: StripeKeys): StripeKeys => ({
      publishableKey: incoming.publishableKey || existing.publishableKey,
      secretKey: (!incoming.secretKey || isMasked(incoming.secretKey)) ? existing.secretKey : incoming.secretKey,
      webhookSecret: (!incoming.webhookSecret || isMasked(incoming.webhookSecret)) ? existing.webhookSecret : incoming.webhookSecret,
    })

    const mergedTest = mergeKeys(testKeys || EMPTY_KEYS, current.test)
    const mergedLive = mergeKeys(liveKeys || EMPTY_KEYS, current.live)

    // Validate prefixes for non-empty, non-masked keys
    const testErr = validateKeys(mergedTest, 'test')
    if (testErr) return NextResponse.json({ error: testErr }, { status: 400 })

    const liveErr = validateKeys(mergedLive, 'live')
    if (liveErr) return NextResponse.json({ error: liveErr }, { status: 400 })

    const newSettings: StripeSettings = {
      mode,
      test: mergedTest,
      live: mergedLive,
    }

    const { error: upsertError } = await supabase
      .from('site_settings')
      .upsert(
        { key: STRIPE_SETTINGS_KEY, value: newSettings, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )

    if (upsertError) {
      console.error('Upsert stripe settings error:', upsertError)
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }

    // Invalidate cache so getStripe() picks up new keys
    invalidateStripeCache()

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('POST /api/settings/stripe error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
