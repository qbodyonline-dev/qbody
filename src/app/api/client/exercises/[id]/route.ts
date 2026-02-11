import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateRequest } from '@/lib/api-auth'

// GET — exercise detail with video, instructions, history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  const userId = auth.data.user.id

  try {
    const supabase = createServerClient()

    // Get exercise
    const { data: exercise, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
    }

    // Get user's exercise history (last 20 logs)
    const { data: history } = await supabase
      .from('exercise_logs')
      .select('id, set_number, reps_done, weight_done, rpe, completed, created_at, workout_logs!inner(client_id, started_at, status)')
      .eq('exercise_id', params.id)
      .eq('workout_logs.client_id', userId)
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(50)

    // Group history by workout session
    const sessions: { date: string; sets: { set: number; reps: number | null; weight: number | null; rpe: number | null }[] }[] = []
    const sessionMap = new Map<string, typeof sessions[0]>()

    for (const h of (history || [])) {
      const wl = h.workout_logs as any
      const dateKey = new Date(wl.started_at).toISOString().split('T')[0]
      if (!sessionMap.has(dateKey)) {
        const session = { date: dateKey, sets: [] as any[] }
        sessionMap.set(dateKey, session)
        sessions.push(session)
      }
      sessionMap.get(dateKey)!.sets.push({
        set: h.set_number,
        reps: h.reps_done,
        weight: h.weight_done,
        rpe: h.rpe,
      })
    }

    // Personal records
    const allWeights = (history || []).filter(h => h.weight_done).map(h => h.weight_done!)
    const maxWeight = allWeights.length > 0 ? Math.max(...allWeights) : null

    const allReps = (history || []).filter(h => h.reps_done).map(h => h.reps_done!)
    const maxReps = allReps.length > 0 ? Math.max(...allReps) : null

    // Weight progression (by session, max weight per session)
    const weightProgression = sessions
      .map(s => ({
        date: s.date,
        max_weight: s.sets.reduce((max, set) => Math.max(max, set.weight || 0), 0),
      }))
      .filter(p => p.max_weight > 0)
      .reverse()

    return NextResponse.json({
      exercise: {
        id: exercise.id,
        name: exercise.name,
        name_ru: exercise.name_ru,
        description: exercise.description,
        description_ru: exercise.description_ru,
        instructions: exercise.instructions,
        instructions_ru: exercise.instructions_ru,
        common_mistakes: exercise.common_mistakes,
        common_mistakes_ru: exercise.common_mistakes_ru,
        muscle_groups: exercise.muscle_groups,
        equipment: exercise.equipment,
        category: exercise.category,
        difficulty: exercise.difficulty,
        video_url: exercise.video_url,
        thumbnail_url: exercise.thumbnail_url,
        regressions: exercise.regressions,
        regressions_ru: exercise.regressions_ru,
        progressions: exercise.progressions,
        progressions_ru: exercise.progressions_ru,
      },
      history: sessions.slice(0, 10),
      records: {
        max_weight: maxWeight,
        max_reps: maxReps,
        total_sessions: sessions.length,
      },
      weight_progression: weightProgression.slice(0, 20),
    })
  } catch (err: any) {
    console.error('GET /api/client/exercises/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
