import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_PRIMARY_LANGUAGE,
  DEFAULT_SECONDARY_LANGUAGE,
  isValidLanguageCode,
  getLanguageByCode,
} from '@/lib/languages'

/** Public Supabase client */
function getPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (url: any, options: any = {}) =>
          fetch(url, { ...options, cache: 'no-store' as RequestCache }),
      },
    }
  )
}

/**
 * GET /api/languages — Public
 * Returns current language configuration + list of supported languages.
 */
export async function GET() {
  try {
    const supabase = getPublicSupabase()

    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'languages')
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found — that's ok, use defaults
      console.error('GET languages error:', error)
      throw error
    }

    const stored = data?.value || {}
    const primaryLanguage = stored.primaryLanguage || DEFAULT_PRIMARY_LANGUAGE
    const secondaryLanguage = stored.secondaryLanguage ?? DEFAULT_SECONDARY_LANGUAGE

    return NextResponse.json({
      primaryLanguage,
      secondaryLanguage,
      isBilingual: secondaryLanguage !== null,
      primaryLanguageInfo: getLanguageByCode(primaryLanguage) || getLanguageByCode('en')!,
      secondaryLanguageInfo: secondaryLanguage ? getLanguageByCode(secondaryLanguage) || null : null,
      supportedLanguages: SUPPORTED_LANGUAGES,
    })
  } catch (err: any) {
    console.error('GET /api/languages error:', err)
    return NextResponse.json({ error: 'Failed to fetch language config' }, { status: 500 })
  }
}

/**
 * PUT /api/languages — Admin only
 * Update language configuration.
 *
 * Body:
 * {
 *   primaryLanguage: "en",
 *   secondaryLanguage: "fr" | null   // null = monolingual
 * }
 */
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { primaryLanguage, secondaryLanguage } = body

    // Validate primary language
    if (!primaryLanguage || !isValidLanguageCode(primaryLanguage)) {
      return NextResponse.json(
        { error: `Invalid primary language. Supported: ${SUPPORTED_LANGUAGES.map(l => l.code).join(', ')}` },
        { status: 400 }
      )
    }

    // Validate secondary language (can be null for monolingual)
    if (secondaryLanguage !== null && secondaryLanguage !== undefined) {
      if (!isValidLanguageCode(secondaryLanguage)) {
        return NextResponse.json(
          { error: `Invalid secondary language. Supported: ${SUPPORTED_LANGUAGES.map(l => l.code).join(', ')}` },
          { status: 400 }
        )
      }
      if (secondaryLanguage === primaryLanguage) {
        return NextResponse.json(
          { error: 'Primary and secondary languages must be different' },
          { status: 400 }
        )
      }
    }

    const value = {
      primaryLanguage,
      secondaryLanguage: secondaryLanguage ?? null,
    }

    const { error } = await supabase
      .from('site_settings')
      .upsert(
        { key: 'languages', value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )

    if (error) {
      console.error('Upsert languages error:', error)
      throw error
    }

    const isBilingual = value.secondaryLanguage !== null
    return NextResponse.json({
      success: true,
      primaryLanguage: value.primaryLanguage,
      secondaryLanguage: value.secondaryLanguage,
      isBilingual,
      primaryLanguageInfo: getLanguageByCode(value.primaryLanguage),
      secondaryLanguageInfo: isBilingual ? getLanguageByCode(value.secondaryLanguage!) : null,
    })
  } catch (err: any) {
    console.error('PUT /api/languages error:', err)
    return NextResponse.json({ error: 'Failed to update language config' }, { status: 500 })
  }
}
