import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

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

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('training_programs')
      .select(`
        id, name, name_secondary, description, description_secondary,
        full_description, full_description_secondary,
        duration_weeks, goal, difficulty, slug, is_active, price, original_price,
        features, features_secondary, includes, includes_secondary,
        hero_image_url, created_at,
        program_days (
          week_number, day_of_week, is_rest_day,
          workouts:workout_id ( name, name_secondary, type, estimated_duration )
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
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
