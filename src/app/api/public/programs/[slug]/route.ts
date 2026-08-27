import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'
import { hasProgramAssignment, isAdminRole } from '@/lib/visibility'

export const dynamic = 'force-dynamic'

/**
 * GET public program by slug.
 * Uses service-role client because program_days / workouts tables
 * don't have anon-read RLS policies.  Only public-safe fields are returned.
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug?.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 200)
    if (!slug) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }

    // Используем service_role: RLS политики для program_days и workouts
    // не позволяют anon-доступ (требуют покупку через client_programs).
    // Для публичной страницы каталога нужен полный доступ к расписанию.
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('training_programs')
      .select(`
        id, name, name_secondary, description, description_secondary,
        full_description, full_description_secondary,
        duration_weeks, goal, difficulty, slug, is_active, is_private, price, original_price,
        features, features_secondary, includes, includes_secondary,
        hero_image_url, created_at,
        program_days (
          week_number, day_of_week, is_rest_day,
          workouts:workout_id ( name, name_secondary, type, estimated_duration )
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Private program — visible only to the clients it was assigned to (and
    // admins/trainers). Everyone else gets the same 404 as for a missing one,
    // so sharing the link with a third party reveals nothing.
    if (data.is_private) {
      const auth = await authenticateRequest(request)
      const allowed = auth.success && (
        isAdminRole(auth.data.profile?.role) ||
        await hasProgramAssignment(auth.data.user.id, data.id)
      )
      if (!allowed) {
        return NextResponse.json({ error: 'Program not found' }, { status: 404 })
      }
    }

    // Sort days
    if (data.program_days) {
      data.program_days.sort((a: any, b: any) =>
        a.week_number !== b.week_number ? a.week_number - b.week_number : a.day_of_week - b.day_of_week
      )
    }

    // Count workouts
    const workoutDays = (data.program_days || []).filter((d: any) => !d.is_rest_day && d.workouts)
    const totalWorkouts = workoutDays.length

    return NextResponse.json({
      ...data,
      total_workouts: totalWorkouts,
    })
  } catch (err: any) {
    console.error('GET /api/public/programs/[slug] error:', err)
    return NextResponse.json({ error: 'Failed to load program' }, { status: 500 })
  }
}
