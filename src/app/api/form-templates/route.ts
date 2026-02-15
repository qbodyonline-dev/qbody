import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin, authenticateRequest } from '@/lib/api-auth'

/**
 * GET /api/form-templates — list all templates
 * Public for type-based fetch (client needs checkin template), admin gets all
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'checkin' | 'onboarding' | 'custom'

    let query = supabase
      .from('form_templates')
      .select('*')
      .order('created_at', { ascending: true })

    if (type) {
      query = query.eq('type', type)
    }

    // Non-admin users only see active templates
    const isAdmin = ['admin', 'trainer'].includes(auth.data.profile.role)
    if (!isAdmin) {
      query = query.eq('active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Form templates query error:', error)
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err: any) {
    console.error('GET /api/form-templates error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

/**
 * POST /api/form-templates — create template (admin only)
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('form_templates')
      .insert({
        name_en: body.name_en || 'New Form',
        name_ru: body.name_ru || 'Новая форма',
        type: body.type || 'custom',
        fields: body.fields || [],
        active: body.active !== false,
      })
      .select()
      .single()

    if (error) {
      console.error('Create template error:', error)
      return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/form-templates error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

/**
 * PUT /api/form-templates — update template by id (admin only)
 */
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const updates: Record<string, any> = {}
    if (body.name_en !== undefined) updates.name_en = body.name_en
    if (body.name_ru !== undefined) updates.name_ru = body.name_ru
    if (body.type !== undefined) updates.type = body.type
    if (body.fields !== undefined) updates.fields = body.fields
    if (body.active !== undefined) updates.active = body.active
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('form_templates')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      console.error('Update template error:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('PUT /api/form-templates error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/form-templates?id=xxx — delete template (admin only)
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('form_templates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete template error:', error)
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/form-templates error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
