import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

// GET all settings — public (needed for frontend rendering)
export async function GET() {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')

    if (error) {
      console.error('GET settings error:', error)
      throw error
    }

    const settings: Record<string, any> = {}
    data?.forEach((item: { key: string; value: any }) => {
      settings[item.key] = item.value
    })

    return NextResponse.json(settings)
  } catch (err: any) {
    console.error('GET /api/settings error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST/PUT settings (upsert) — admin only
export async function POST(request: Request) {
  // ✅ AUTH: Only admin can modify settings
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { key, value } = body

    if (!key || typeof key !== 'string' || key.length > 100) {
      return NextResponse.json({ error: 'Valid key is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('site_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select()
      .single()

    if (error) {
      console.error('POST settings error:', error)
      throw error
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('POST /api/settings error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PUT - Update multiple settings at once — admin only
export async function PUT(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 })
    }

    const results = []
    const errors = []

    for (const [key, value] of Object.entries(settings)) {
      const { data, error } = await supabase
        .from('site_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
        .select()
        .single()

      if (error) errors.push({ key, error: error.message })
      else results.push(data)
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors, saved: results }, { status: 207 })
    }

    return NextResponse.json({ success: true, saved: results })
  } catch (err: any) {
    console.error('PUT /api/settings error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH — admin only
export async function PATCH(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()

    const results = []
    const errors = []

    for (const [key, value] of Object.entries(body)) {
      const { data, error } = await supabase
        .from('site_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
        .select()
        .single()

      if (error) errors.push({ key, error: error.message })
      else results.push(data)
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors, saved: results }, { status: 207 })
    }

    return NextResponse.json({ success: true, saved: results })
  } catch (err: any) {
    console.error('PATCH /api/settings error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
