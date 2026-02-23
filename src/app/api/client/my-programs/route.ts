import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'
import { autoExpirePrograms, daysRemaining } from '@/lib/subscription'

/**
 * GET /api/client/my-programs
 * Returns all programs assigned to the current client (active, paused, completed).
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const userId = auth.data.user.id

  try {
    const supabase = createServerClient()

    // Auto-expire overdue programs for this client
    await autoExpirePrograms(supabase, userId)

    const { data, error } = await supabase
      .from('client_programs')
      .select(`
        id, start_date, end_date, status, current_week,
        training_programs (
          id, name, name_secondary, description, description_secondary,
          goal, difficulty, duration_weeks, hero_image_url
        )
      `)
      .eq('client_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('My programs query error:', error)
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }

    // Calculate progress for each program
    const programs = (data || []).map((cp: any) => {
      const program = cp.training_programs as any
      if (!program) return null

      const startDate = new Date(cp.start_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      startDate.setHours(0, 0, 0, 0)

      const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const currentWeek = Math.max(1, Math.min(Math.floor(diffDays / 7) + 1, program.duration_weeks))

      return {
        client_program_id: cp.id,
        program_id: program.id,
        name: program.name,
        name_secondary: program.name_secondary,
        description: program.description,
        description_secondary: program.description_secondary,
        goal: program.goal,
        difficulty: program.difficulty,
        duration_weeks: program.duration_weeks,
        hero_image_url: program.hero_image_url,
        start_date: cp.start_date,
        end_date: cp.end_date,
        status: cp.status,
        current_week: currentWeek,
        days_remaining: daysRemaining(cp.end_date),
        access_blocked: ['expired', 'cancelled'].includes(cp.status),
      }
    }).filter(Boolean)

    return NextResponse.json({ programs })
  } catch (err: any) {
    console.error('GET /api/client/my-programs error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
