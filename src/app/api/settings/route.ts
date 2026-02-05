import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET all settings
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

    // Transform array to object with key-value pairs
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

// POST/PUT settings (upsert)
export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    
    // Expect body to be { key: string, value: object }
    const { key, value } = body

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('site_settings')
      .upsert({ 
        key, 
        value,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'key' 
      })
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

// PUT - Update multiple settings at once
export async function PUT(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    
    // Expect body to be { settings: { key1: value1, key2: value2, ... } }
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 })
    }

    const results = []
    const errors = []

    for (const [key, value] of Object.entries(settings)) {
      const { data, error } = await supabase
        .from('site_settings')
        .upsert({ 
          key, 
          value,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'key' 
        })
        .select()
        .single()

      if (error) {
        errors.push({ key, error: error.message })
      } else {
        results.push(data)
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ 
        success: false, 
        errors,
        saved: results 
      }, { status: 207 })
    }

    return NextResponse.json({ success: true, saved: results })
  } catch (err: any) {
    console.error('PUT /api/settings error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH - Update settings (simplified for notification settings)
export async function PATCH(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    
    // Handle notification_settings or any other settings
    const results = []
    const errors = []

    for (const [key, value] of Object.entries(body)) {
      const { data, error } = await supabase
        .from('site_settings')
        .upsert({ 
          key, 
          value,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'key' 
        })
        .select()
        .single()

      if (error) {
        errors.push({ key, error: error.message })
      } else {
        results.push(data)
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ 
        success: false, 
        errors,
        saved: results 
      }, { status: 207 })
    }

    return NextResponse.json({ success: true, saved: results })
  } catch (err: any) {
    console.error('PATCH /api/settings error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
