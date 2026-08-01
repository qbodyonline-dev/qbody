import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'
import { autoExpirePrograms, daysRemaining } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

// GET — unified dashboard: today's workout, stats, notifications
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

    const [
      { data: cp },
      { data: workoutLogs },
      { data: checkins },
      { data: courseAccess },
      { data: unreadMessages },
      { data: nutritionDays },
      { data: nutritionTarget },
    ] = await Promise.all([
      // Active program
      supabase.from('client_programs')
        .select('id, start_date, end_date, status, training_programs(id, name, name_secondary, duration_weeks, goal)')
        .eq('client_id', userId).eq('status', 'active').maybeSingle(),
      // Recent workout logs
      supabase.from('workout_logs')
        .select('id, workout_id, started_at, completed_at, status, duration_minutes, rpe, mood')
        .eq('client_id', userId).order('started_at', { ascending: false }).limit(30),
      // Recent checkins
      supabase.from('checkins')
        .select('id, checkin_date, weight, status, checkin_responses(id)')
        .eq('client_id', userId).order('checkin_date', { ascending: false }).limit(10),
      // Course access
      supabase.from('course_access')
        .select('course_slug, is_active').eq('user_id', userId),
      // Unread messages count
      supabase.from('conversations')
        .select('id, unread_count').eq('client_id', userId),
      // Nutrition summary for the home card: last 7 days of logs + targets
      supabase.from('nutrition_logs')
        .select('log_date, calories_hit, protein_hit, carbs_hit, fat_hit')
        .eq('client_id', userId)
        .gte('log_date', new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('log_date', { ascending: true }),
      supabase.from('nutrition_targets')
        .select('calories, protein, carbs, fat')
        .eq('client_id', userId)
        .maybeSingle(),
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // ═══ Program & today's workout ═══
    let program = null
    let todayWorkout = null
    let currentWeek = 0

    if (cp) {
      const prog = cp.training_programs as any
      const startDate = new Date(cp.start_date)
      startDate.setHours(0, 0, 0, 0)
      const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      currentWeek = Math.min(Math.floor(diffDays / 7) + 1, prog.duration_weeks)
      const dayOfWeek = today.getDay() || 7 // JS 0=Sun → DB 7=Sun; DB convention is ISO 1=Mon..7=Sun

      program = {
        id: prog.id,
        name: prog.name,
        name_secondary: prog.name_secondary,
        duration_weeks: prog.duration_weeks,
        goal: prog.goal,
        current_week: currentWeek,
        start_date: cp.start_date,
        end_date: cp.end_date,
        client_program_id: cp.id,
        days_remaining: daysRemaining(cp.end_date),
      }

      // Get today's workout
      if (diffDays >= 0 && currentWeek <= prog.duration_weeks) {
        const { data: todayDay } = await supabase
          .from('program_days')
          .select(`
            id, is_rest_day, notes,
            workouts(id, name, name_secondary, type, estimated_duration,
              workout_exercises(id, exercise_id, section))
          `)
          .eq('program_id', prog.id)
          .eq('week_number', currentWeek)
          .eq('day_of_week', dayOfWeek)
          .maybeSingle()

        if (todayDay) {
          const w = todayDay.workouts as any
          todayWorkout = {
            is_rest_day: todayDay.is_rest_day,
            notes: todayDay.notes,
            workout: w ? {
              id: w.id,
              name: w.name,
              name_secondary: w.name_secondary,
              type: w.type,
              estimated_duration: w.estimated_duration,
              exercise_count: w.workout_exercises?.length || 0,
            } : null,
          }
        }
      }
    }

    // ═══ Stats ═══
    const logs = workoutLogs || []
    const completedLogs = logs.filter(l => l.status === 'completed')
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const workoutsThisMonth = completedLogs.filter(l => l.started_at >= thirtyDaysAgo).length

    // Weight trend
    const weightCheckins = (checkins || []).filter(c => c.weight)
    const latestWeight = weightCheckins.length > 0 ? weightCheckins[0].weight : null
    const prevWeight = weightCheckins.length > 1 ? weightCheckins[1].weight : null
    const weightTrend = latestWeight && prevWeight
      ? Math.round((latestWeight - prevWeight) * 10) / 10
      : null

    // Last checkin
    const lastCheckin = (checkins || [])[0] || null
    const hasNewResponse = lastCheckin?.checkin_responses?.length > 0 && lastCheckin?.status !== 'reviewed'

    // In-progress workout
    const inProgressLog = logs.find(l => l.status === 'in_progress')

    // Unread messages
    const totalUnread = (unreadMessages || []).reduce((s, c) => s + (c.unread_count || 0), 0)

    // Courses
    const activeCourses = (courseAccess || []).filter(a => a.is_active !== false).length

    return NextResponse.json({
      program,
      nutrition: {
        target: nutritionTarget || null,
        days: nutritionDays || [],
      },
      today_workout: todayWorkout,
      in_progress_workout: inProgressLog ? { id: inProgressLog.id, started_at: inProgressLog.started_at } : null,
      stats: {
        workouts_completed: completedLogs.length,
        workouts_this_month: workoutsThisMonth,
        current_week: currentWeek,
        total_weeks: program?.duration_weeks || 0,
        weight: latestWeight,
        weight_trend: weightTrend,
        checkins_count: (checkins || []).length,
        active_courses: activeCourses,
      },
      notifications: {
        unread_messages: totalUnread,
        new_trainer_response: hasNewResponse,
        last_checkin_date: lastCheckin?.checkin_date || null,
      },
    })
  } catch (err: any) {
    console.error('GET /api/client/today error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
