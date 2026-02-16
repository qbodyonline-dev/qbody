'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { fetchWithAuth } from '@/lib/api'
import {
  ArrowLeft, Loader2, CheckCircle2, Clock,
  Flame, Zap, Snowflake, ChevronDown, ChevronUp, Timer,
  Trophy, Star, SkipForward, Video
} from 'lucide-react'
import { toast } from 'sonner'

/* ═══════════ TYPES ═══════════ */
type Exercise = {
  id: string; name: string; name_secondary: string
  muscle_groups: string[]; equipment: string | null
  video_url: string | null
  instructions: string | null; instructions_secondary: string | null
}

type WorkoutExercise = {
  id: string; exercise_id: string; section: string; position: number
  sets: number; reps: string; weight: string | null; rest_seconds: number | null; notes: string | null
  exercises: Exercise
}

type ExerciseLog = {
  id: string; exercise_id: string; set_number: number
  reps_planned: number | null; reps_done: number | null
  weight_planned: number | null; weight_done: number | null
  completed: boolean; rpe: number | null; notes: string | null
  exercises: Exercise
}

type WorkoutLog = {
  id: string; workout_id: string; status: string
  started_at: string; completed_at: string | null
  duration_minutes: number | null; rpe: number | null; mood: string | null; comment: string | null
  exercise_logs: ExerciseLog[]
  workout: {
    id: string; name: string; name_secondary: string
    type: string; difficulty: string
    estimated_duration?: number | null
    workout_exercises: WorkoutExercise[]
  }
}

const eName = (ex: Exercise, ru: boolean) => ru ? (ex.name_secondary || ex.name) : (ex.name || ex.name_secondary)
const wName = (w: any, ru: boolean) => ru ? (w.name_secondary || w.name) : (w.name || w.name_secondary)

const sectionIcons: Record<string, any> = { warmup: Flame, main: Zap, cooldown: Snowflake }
const sectionColors: Record<string, string> = {
  warmup: 'text-orange-500 bg-orange-50 dark:bg-orange-500/10',
  main: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
  cooldown: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10',
}

export default function WorkoutExecutionPage() {
  const { locale, langConfig } = useTranslation()
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const logId = params.logId as string
  const ru = locale === langConfig.secondaryLanguage

  const [log, setLog] = useState<WorkoutLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([])
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)

  // Rest timer
  const [restActive, setRestActive] = useState(false)
  const [restTime, setRestTime] = useState(0)
  const [restTarget, setRestTarget] = useState(60)
  const restRef = useRef<NodeJS.Timeout | null>(null)

  // Elapsed timer
  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef<NodeJS.Timeout | null>(null)

  // Completion modal
  const [showComplete, setShowComplete] = useState(false)
  const [finalRpe, setFinalRpe] = useState(5)
  const [finalMood, setFinalMood] = useState<string>('good')
  const [finalComment, setFinalComment] = useState('')

  /* ─── Fetch ─── */
  const fetchLog = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`/api/client/workout-log/${logId}`)
      if (!res.ok) { router.push('/client/training'); return }
      const data = await res.json()
      setLog(data)
      setExerciseLogs(data.exercise_logs || [])
      // Start elapsed timer if in_progress
      if (data.status === 'in_progress' && data.started_at) {
        const diff = Math.floor((Date.now() - new Date(data.started_at).getTime()) / 1000)
        setElapsed(diff)
      }
    } catch { router.push('/client/training') }
    finally { setLoading(false) }
  }, [logId, router])

  useEffect(() => { if (user) fetchLog() }, [user, fetchLog])

  // Elapsed timer
  useEffect(() => {
    if (log?.status === 'in_progress') {
      elapsedRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    }
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current) }
  }, [log?.status])

  // Rest timer
  useEffect(() => {
    if (restActive && restTime > 0) {
      restRef.current = setTimeout(() => setRestTime(t => t - 1), 1000)
    } else if (restActive && restTime <= 0) {
      setRestActive(false)
      // Vibrate if available
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
    }
    return () => { if (restRef.current) clearTimeout(restRef.current) }
  }, [restActive, restTime])

  /* ─── Toggle set complete ─── */
  const toggleSet = (elId: string, currentlyDone: boolean) => {
    setExerciseLogs(prev => prev.map(el => {
      if (el.id !== elId) return el
      const completed = !currentlyDone
      return {
        ...el,
        completed,
        reps_done: completed ? (el.reps_done || el.reps_planned) : el.reps_done,
        weight_done: completed ? (el.weight_done || el.weight_planned) : el.weight_done,
      }
    }))
  }

  /* ─── Update set values ─── */
  const updateSet = (elId: string, field: string, value: any) => {
    setExerciseLogs(prev => prev.map(el => el.id === elId ? { ...el, [field]: value } : el))
  }

  /* ─── Start rest timer ─── */
  const startRest = (seconds: number) => {
    setRestTarget(seconds)
    setRestTime(seconds)
    setRestActive(true)
  }

  /* ─── Save progress ─── */
  const saveProgress = async () => {
    setSaving(true)
    try {
      await fetchWithAuth(`/api/client/workout-log/${logId}`, {
        method: 'PUT',
        body: JSON.stringify({
          exercise_logs: exerciseLogs.map(el => ({
            id: el.id,
            reps_done: el.reps_done,
            weight_done: el.weight_done,
            completed: el.completed,
          })),
        }),
      })
      toast.success(ru ? 'Прогресс сохранён' : 'Progress saved')
    } catch {
      toast.error(ru ? 'Ошибка сохранения' : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  /* ─── Complete workout ─── */
  const completeWorkout = async () => {
    setSaving(true)
    try {
      await fetchWithAuth(`/api/client/workout-log/${logId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'completed',
          rpe: finalRpe,
          mood: finalMood,
          comment: finalComment || null,
          exercise_logs: exerciseLogs.map(el => ({
            id: el.id,
            reps_done: el.reps_done,
            weight_done: el.weight_done,
            completed: el.completed,
          })),
        }),
      })
      toast.success(ru ? 'Тренировка завершена! 💪' : 'Workout complete! 💪')
      router.push('/client/training')
    } catch {
      toast.error(ru ? 'Ошибка' : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  /* ─── Helpers ─── */
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const groupByExercise = () => {
    if (!log?.workout?.workout_exercises) return []
    const sections = ['warmup', 'main', 'cooldown']
    const result: { section: string; exercises: { we: WorkoutExercise; sets: ExerciseLog[] }[] }[] = []

    for (const section of sections) {
      const wes = log.workout.workout_exercises.filter(we => we.section === section)
      if (wes.length === 0) continue
      const exercises = wes.map(we => ({
        we,
        sets: exerciseLogs.filter(el => el.exercise_id === we.exercise_id).sort((a, b) => a.set_number - b.set_number),
      }))
      result.push({ section, exercises })
    }
    return result
  }

  const completedSets = exerciseLogs.filter(el => el.completed).length
  const totalSets = exerciseLogs.length
  const completionPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0

  const sectionLabels: Record<string, string> = ru
    ? { warmup: 'Разминка', main: 'Основная часть', cooldown: 'Заминка' }
    : { warmup: 'Warm-up', main: 'Main', cooldown: 'Cool-down' }

  const moodEmojis: Record<string, string> = { great: '🔥', good: '💪', ok: '😐', tired: '😴', bad: '😩' }
  const moodLabels: Record<string, string> = ru
    ? { great: 'Супер', good: 'Хорошо', ok: 'Норм', tired: 'Устал', bad: 'Плохо' }
    : { great: 'Great', good: 'Good', ok: 'OK', tired: 'Tired', bad: 'Bad' }

  /* ═══════════ RENDER ═══════════ */
  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
  }

  if (!log) {
    return <div className="text-center py-20 text-zinc-500">{ru ? 'Тренировка не найдена' : 'Workout not found'}</div>
  }

  const isCompleted = log.status === 'completed'
  const grouped = groupByExercise()

  return (
    <div className="max-w-lg mx-auto pb-32">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 -mx-4 px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/client/training')} className="flex items-center gap-1 text-zinc-500 hover:text-zinc-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">
              {log.workout ? wName(log.workout, ru) : ''}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
              <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{formatTime(elapsed)}</span>
              <span>•</span>
              <span>{completedSets}/{totalSets} {ru ? 'подх.' : 'sets'}</span>
            </div>
          </div>
          <button onClick={saveProgress} disabled={saving || isCompleted}
            className="text-teal-500 hover:text-teal-600 text-sm font-medium disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (ru ? 'Сохр.' : 'Save')}
          </button>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${completionPct}%` }} />
        </div>
      </div>

      {/* Rest timer overlay */}
      {restActive && (
        <div className="fixed inset-0 z-50 bg-zinc-900/90 flex items-center justify-center" onClick={() => setRestActive(false)}>
          <div className="text-center" onClick={e => e.stopPropagation()}>
            <Timer className="w-12 h-12 text-teal-400 mx-auto mb-4 animate-pulse" />
            <p className="text-6xl font-bold text-white mb-2">{formatTime(restTime)}</p>
            <p className="text-zinc-400 text-sm mb-6">{ru ? 'Отдых' : 'Rest'}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" size="sm" className="border-zinc-600 text-zinc-300"
                onClick={() => setRestTime(t => Math.max(0, t - 15))}>-15s</Button>
              <Button variant="outline" size="sm" className="border-zinc-600 text-zinc-300"
                onClick={() => setRestTime(t => t + 15)}>+15s</Button>
              <Button variant="outline" size="sm" className="border-red-600 text-red-400"
                onClick={() => setRestActive(false)}>
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-4 mt-4">
        {grouped.map(({ section, exercises }) => {
          const SIcon = sectionIcons[section] || Zap
          const colorClass = sectionColors[section] || ''

          return (
            <div key={section}>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold mb-2 ${colorClass}`}>
                <SIcon className="w-3.5 h-3.5" />
                {sectionLabels[section] || section}
              </div>

              <div className="space-y-3">
                {exercises.map(({ we, sets }) => {
                  const ex = we.exercises
                  const isExpanded = expandedExercise === we.id
                  const setsCompleted = sets.filter(s => s.completed).length
                  const allDone = sets.length > 0 && setsCompleted === sets.length

                  return (
                    <Card key={we.id} className={`overflow-hidden transition-all ${allDone ? 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-500/5' : ''}`}>
                      {/* Exercise header */}
                      <button
                        className="w-full flex items-center gap-3 p-4 text-left"
                        onClick={() => setExpandedExercise(isExpanded ? null : we.id)}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${allDone ? 'bg-green-100 dark:bg-green-500/20' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                          {allDone ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                            <span className="text-xs font-bold text-zinc-500">{setsCompleted}/{sets.length}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                            {eName(ex, ru)}
                          </p>
                          <p className="text-xs text-zinc-500">{we.sets}×{we.reps}{we.weight ? ` @ ${we.weight}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {ex.video_url && (
                            <a href={ex.video_url} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-teal-500">
                              <Video className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                        </div>
                      </button>

                      {/* Expanded: sets list */}
                      {isExpanded && (
                        <CardContent className="pt-0 pb-4 px-4">
                          {/* Instructions */}
                          {(ru ? ex.instructions_secondary : ex.instructions) && (
                            <details className="mb-3">
                              <summary className="text-xs text-teal-600 cursor-pointer">{ru ? 'Инструкция' : 'Instructions'}</summary>
                              <p className="text-xs text-zinc-500 mt-1 whitespace-pre-line">{ru ? ex.instructions_secondary || ex.instructions : ex.instructions}</p>
                            </details>
                          )}

                          {/* Sets table */}
                          <div className="space-y-2">
                            <div className="grid grid-cols-[40px_1fr_1fr_48px] gap-2 text-[10px] font-semibold text-zinc-400 uppercase px-1">
                              <span>{ru ? 'Подх' : 'Set'}</span>
                              <span>{ru ? 'Повт' : 'Reps'}</span>
                              <span>{ru ? 'Вес' : 'Weight'}</span>
                              <span className="text-center">✓</span>
                            </div>

                            {sets.map(set => (
                              <div key={set.id}
                                className={`grid grid-cols-[40px_1fr_1fr_48px] gap-2 items-center rounded-lg px-1 py-2 transition-colors ${set.completed ? 'bg-green-50 dark:bg-green-500/10' : 'bg-zinc-50 dark:bg-zinc-800/50'}`}>
                                <span className="text-xs font-bold text-zinc-400 text-center">{set.set_number}</span>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-sm text-center focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none"
                                  value={set.reps_done ?? set.reps_planned ?? ''}
                                  placeholder={set.reps_planned?.toString() || '—'}
                                  onChange={e => updateSet(set.id, 'reps_done', e.target.value ? parseInt(e.target.value) : null)}
                                  disabled={isCompleted}
                                />
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.5"
                                  className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-sm text-center focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none"
                                  value={set.weight_done ?? set.weight_planned ?? ''}
                                  placeholder={set.weight_planned?.toString() || '—'}
                                  onChange={e => updateSet(set.id, 'weight_done', e.target.value ? parseFloat(e.target.value) : null)}
                                  disabled={isCompleted}
                                />
                                <div className="flex justify-center">
                                  <button
                                    onClick={() => {
                                      if (!isCompleted) {
                                        toggleSet(set.id, set.completed)
                                        // Auto-start rest after completing a set
                                        if (!set.completed && we.rest_seconds) {
                                          startRest(we.rest_seconds)
                                        }
                                      }
                                    }}
                                    disabled={isCompleted}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${set.completed
                                      ? 'bg-green-500 text-white'
                                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 hover:bg-teal-100 hover:text-teal-500'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Rest timer button */}
                          {we.rest_seconds && !isCompleted && (
                            <button onClick={() => startRest(we.rest_seconds!)}
                              className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-teal-500 text-xs font-medium">
                              <Timer className="w-3.5 h-3.5" />
                              {ru ? 'Таймер отдыха' : 'Rest Timer'} ({we.rest_seconds}s)
                            </button>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom bar */}
      {!isCompleted && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-t border-zinc-200 dark:border-zinc-800 p-4">
          <div className="max-w-lg mx-auto flex gap-3">
            <div className="flex-1 text-center">
              <p className="text-xs text-zinc-500">{ru ? 'Выполнено' : 'Completed'}</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{completionPct}%</p>
            </div>
            <Button variant="gradient" className="flex-[2]" onClick={() => setShowComplete(true)}
              disabled={completedSets === 0}>
              <Trophy className="w-4 h-4 mr-2" />
              {ru ? 'Завершить' : 'Finish Workout'}
            </Button>
          </div>
        </div>
      )}

      {/* Completed state */}
      {isCompleted && (
        <Card className="mt-6 border-green-200 dark:border-green-800">
          <CardContent className="p-6 text-center">
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">{ru ? 'Тренировка завершена!' : 'Workout Complete!'}</h3>
            <div className="flex justify-center gap-4 text-sm text-zinc-500 mb-3">
              {log.duration_minutes && <span><Clock className="w-4 h-4 inline mr-1" />{log.duration_minutes} {ru ? 'мин' : 'min'}</span>}
              {log.rpe && <span><Star className="w-4 h-4 inline mr-1" />RPE {log.rpe}/10</span>}
              {log.mood && <span>{moodEmojis[log.mood]} {moodLabels[log.mood]}</span>}
            </div>
            {log.comment && <p className="text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">{log.comment}</p>}
            <Button variant="outline" className="mt-4" onClick={() => router.push('/client/training')}>
              <ArrowLeft className="w-4 h-4 mr-2" />{ru ? 'К тренировкам' : 'Back to Training'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ═══ Complete Modal ═══ */}
      <Modal isOpen={showComplete} onClose={() => setShowComplete(false)}
        title={ru ? 'Завершить тренировку' : 'Finish Workout'} size="sm">
        <div className="space-y-5">
          {/* Summary */}
          <div className="bg-teal-50 dark:bg-teal-500/10 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-teal-600">{completedSets}/{totalSets}</p>
            <p className="text-xs text-teal-500">{ru ? 'подходов выполнено' : 'sets completed'}</p>
            <p className="text-sm text-zinc-500 mt-1"><Clock className="w-3.5 h-3.5 inline mr-1" />{formatTime(elapsed)}</p>
          </div>

          {/* RPE */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              {ru ? 'Тяжесть (RPE)' : 'Effort (RPE)'}: {finalRpe}/10
            </label>
            <input type="range" min="1" max="10" value={finalRpe}
              onChange={e => setFinalRpe(parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-500" />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              <span>{ru ? 'Легко' : 'Easy'}</span>
              <span>{ru ? 'Максимум' : 'Maximum'}</span>
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              {ru ? 'Настроение' : 'How do you feel?'}
            </label>
            <div className="flex gap-2">
              {(['great', 'good', 'ok', 'tired', 'bad'] as const).map(m => (
                <button key={m} onClick={() => setFinalMood(m)}
                  className={`flex-1 py-2 rounded-xl text-center transition-colors ${finalMood === m ? 'bg-teal-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200'}`}>
                  <span className="text-lg">{moodEmojis[m]}</span>
                  <p className="text-[10px] mt-0.5">{moodLabels[m]}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">{ru ? 'Заметка (опционально)' : 'Notes (optional)'}</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-sm resize-none"
              rows={2} placeholder={ru ? 'Как прошла тренировка...' : 'How was the workout...'}
              value={finalComment} onChange={e => setFinalComment(e.target.value)} />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowComplete(false)}>
              {ru ? 'Назад' : 'Back'}
            </Button>
            <Button variant="gradient" className="flex-1" onClick={completeWorkout} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trophy className="w-4 h-4 mr-2" />}
              {ru ? 'Готово!' : 'Done!'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
