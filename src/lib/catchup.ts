/**
 * Catch-up for a missed workout.
 *
 * If a client skips a training day, the workout stays available on the next day that
 * has no training of its own (a rest day or an empty day) — but only until the end of
 * the current program week. Nothing carries over into the next week: a week that ends
 * unfinished stays unfinished.
 *
 * Shared by /api/client/today (mobile app home) and /api/client/training (web portal)
 * so both surfaces make exactly the same decision.
 */

export type CatchupWorkout = {
  missed_date: string
  /** ISO weekday of the missed day: 1=Mon .. 7=Sun */
  day_of_week: number
  client_program_id: string
  workout: {
    id: string
    name: string | null
    name_secondary: string | null
    type: string | null
    estimated_duration: number | null
    exercise_count: number
  }
}

/** Adds [n] days to a YYYY-MM-DD string. Pure UTC math — no timezone drift. */
export function addDaysStr(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().split('T')[0]
}

/** ISO weekday of a YYYY-MM-DD string: 1=Mon .. 7=Sun (matches program_days.day_of_week). */
export function isoDowStr(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number)
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return dow === 0 ? 7 : dow
}

/** Local calendar date of a Date, as YYYY-MM-DD (not toISOString, which shifts to UTC). */
export function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function findCatchupWorkout(opts: {
  /** program_days rows of the CURRENT program week, each with `workouts` joined. */
  weekDays: any[]
  /** First calendar day of the current program week (YYYY-MM-DD). */
  weekStart: string
  /** Today, as a local YYYY-MM-DD. */
  todayStr: string
  /** Recent workout_logs of this client (needs workout_id, started_at, status). */
  logs: any[]
  clientProgramId: string
  /** False when today has a workout of its own — then nothing is offered. */
  todayIsFree: boolean
}): CatchupWorkout | null {
  const { weekDays, weekStart, todayStr, logs, clientProgramId, todayIsFree } = opts
  if (!todayIsFree) return null

  // One catch-up per day: if something was already trained today, don't queue up the
  // next missed session on top of it.
  const trainedToday = logs.some(
    (l: any) => l.status === 'completed' && l.started_at && String(l.started_at).slice(0, 10) === todayStr
  )
  if (trainedToday) return null

  // A program "week" is a rolling 7-day block from start_date, so the calendar weekday
  // of a program day has to be resolved inside that block — the block does not
  // necessarily start on a Monday.
  const weekEnd = addDaysStr(weekStart, 7) // exclusive
  const dateForDow = new Map<number, string>()
  for (let i = 0; i < 7; i++) {
    const d = addDaysStr(weekStart, i)
    dateForDow.set(isoDowStr(d), d)
  }

  // Training days of this week that are already in the past.
  const pastDays = weekDays
    .filter((d: any) => !d.is_rest_day && d.workouts)
    .map((d: any) => ({ day: d, date: dateForDow.get(d.day_of_week) || '' }))
    .filter((x) => x.date && x.date < todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (pastDays.length === 0) return null

  // Completed sessions inside this week's window, counted per workout so a workout
  // scheduled twice in one week needs two completions to be "done".
  const doneCount = new Map<string, number>()
  for (const l of logs) {
    if (l.status !== 'completed' || !l.started_at) continue
    if (l.started_at < weekStart || l.started_at >= weekEnd) continue
    doneCount.set(l.workout_id, (doneCount.get(l.workout_id) || 0) + 1)
  }

  let missed: { day: any; date: string } | null = null
  for (const candidate of pastDays) {
    const wid = (candidate.day.workouts as any).id
    const done = doneCount.get(wid) || 0
    if (done > 0) {
      doneCount.set(wid, done - 1) // this scheduled slot is covered
      continue
    }
    missed = candidate
    break
  }
  if (!missed) return null

  // Already started but not finished — it is surfaced as the in-progress session, and
  // offering it a second time would just create a duplicate entry point.
  const missedWorkoutId = (missed.day.workouts as any).id
  if (logs.some((l: any) => l.status === 'in_progress' && l.workout_id === missedWorkoutId)) return null

  const w = missed.day.workouts as any
  return {
    missed_date: missed.date,
    day_of_week: missed.day.day_of_week,
    client_program_id: clientProgramId,
    workout: {
      id: w.id,
      name: w.name ?? null,
      name_secondary: w.name_secondary ?? null,
      type: w.type ?? null,
      estimated_duration: w.estimated_duration ?? null,
      exercise_count: w.workout_exercises?.length || 0,
    },
  }
}
