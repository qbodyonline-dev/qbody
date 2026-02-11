'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { fetchWithAuth } from '@/lib/api'
import {
  Dumbbell, Calendar, Target, Clock, ChevronLeft, ChevronRight,
  Play, CheckCircle2, Loader2, Flame, Snowflake, Zap, Moon
} from 'lucide-react'
import { toast } from 'sonner'

/* ═══════════ TYPES ═══════════ */
type Exercise = {
  id: string; name_en: string; name_ru: string
  muscle_groups: string[]; equipment: string | null; category: string
  video_url: string | null; instructions_en: string | null; instructions_ru: string | null
}

type WorkoutExercise = {
  id: string; section: string; position: number
  sets: number; reps: string; weight: string | null; rest_seconds: number | null
  notes: string | null; exercises: Exercise
}

type Workout = {
  id: string; name_en: string; name_ru: string
  type: string; difficulty: string; duration_minutes: number | null
  workout_exercises: WorkoutExercise[]
}

type ScheduleDay = {
  id: string; week_number: number; day_of_week: number
  is_rest_day: boolean; notes: string | null; workouts: Workout | null
}

type Program = {
  id: string; name_en: string; name_ru: string
  description_en: string | null; description_ru: string | null
  goal: string; difficulty: string; duration_weeks: number
  client_program_id: string; start_date: string; end_date: string
  status: string; current_week: number; current_day_of_week: number
}

type WorkoutLog = {
  id: string; workout_id: string; started_at: string
  completed_at: string | null; status: string; notes: string | null
}

const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAMES_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const DAY_FULL_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_FULL_RU = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']

const sectionIcons: Record<string, any> = { warmup: Flame, main: Zap, cooldown: Snowflake }
const sectionColors: Record<string, string> = {
  warmup: 'text-orange-500 bg-orange-50 dark:bg-orange-500/10',
  main: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
  cooldown: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10',
}

export default function ClientTrainingPage() {
  const { locale } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const ru = locale === 'ru'
  const [starting, setStarting] = useState(false)

  const [program, setProgram] = useState<Program | null>(null)
  const [schedule, setSchedule] = useState<ScheduleDay[]>([])
  const [todayWorkout, setTodayWorkout] = useState<ScheduleDay | null>(null)
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [viewWeek, setViewWeek] = useState(1)
  const [selectedDay, setSelectedDay] = useState<ScheduleDay | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const res = await fetchWithAuth('/api/client/training')
        if (res.ok) {
          const data = await res.json()
          setProgram(data.program)
          setSchedule(data.schedule || [])
          setTodayWorkout(data.today_workout)
          setRecentLogs(data.recent_logs || [])
          if (data.program) setViewWeek(data.program.current_week)
        }
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [user])

  const dayNames = ru ? DAY_NAMES_RU : DAY_NAMES_EN
  const dayFull = ru ? DAY_FULL_RU : DAY_FULL_EN

  const weekDays = schedule.filter(d => d.week_number === viewWeek)

  const goalLabels: Record<string, string> = ru
    ? { weight_loss: 'Похудение', muscle_gain: 'Набор массы', endurance: 'Выносливость', recovery: 'Восстановление', toning: 'Тонус', flexibility: 'Гибкость', general_health: 'Здоровье', postnatal: 'Послеродовое', rehab: 'Реабилитация' }
    : { weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', endurance: 'Endurance', recovery: 'Recovery', toning: 'Toning', flexibility: 'Flexibility', general_health: 'Health', postnatal: 'Postnatal', rehab: 'Rehab' }

  const typeLabels: Record<string, string> = ru
    ? { strength: 'Силовая', cardio: 'Кардио', mobility: 'Мобильность', mixed: 'Смешанная', hiit: 'HIIT', recovery: 'Восстановление' }
    : { strength: 'Strength', cardio: 'Cardio', mobility: 'Mobility', mixed: 'Mixed', hiit: 'HIIT', recovery: 'Recovery' }

  const sectionLabels: Record<string, string> = ru
    ? { warmup: 'Разминка', main: 'Основная часть', cooldown: 'Заминка' }
    : { warmup: 'Warm-up', main: 'Main', cooldown: 'Cool-down' }

  /* ─── Start workout ─── */
  const startWorkout = async (workoutId: string) => {
    if (!program) return
    setStarting(true)
    try {
      const res = await fetchWithAuth('/api/client/workout-log', {
        method: 'POST',
        body: JSON.stringify({
          workout_id: workoutId,
          client_program_id: program.client_program_id,
          scheduled_date: new Date().toISOString().split('T')[0],
        }),
      })
      if (!res.ok) throw new Error()
      const log = await res.json()
      router.push(`/client/training/workout/${log.id}`)
    } catch {
      toast.error(ru ? 'Ошибка запуска' : 'Failed to start workout')
    } finally {
      setStarting(false)
    }
  }

  const openDayDetail = (day: ScheduleDay) => {
    setSelectedDay(day)
    setIsDetailOpen(true)
  }

  /* ═══════════ RENDER ═══════════ */
  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
  }

  if (!program) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{ru ? 'Мои тренировки' : 'My Training'}</h1>
        <Card className="p-12 text-center">
          <Dumbbell className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
            {ru ? 'Программа не назначена' : 'No program assigned'}
          </h3>
          <p className="text-zinc-400 text-sm">
            {ru ? 'Ваш тренер назначит вам программу тренировок' : 'Your trainer will assign a training program to you'}
          </p>
        </Card>
      </div>
    )
  }

  const progressPercent = Math.round((program.current_week / program.duration_weeks) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{ru ? 'Мои тренировки' : 'My Training'}</h1>
        <p className="text-zinc-500 mt-1">{ru ? program.name_ru || program.name_en : program.name_en}</p>
      </div>

      {/* Program overview */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">{ru ? program.name_ru || program.name_en : program.name_en}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className="bg-white/20 text-white border-0">{goalLabels[program.goal] || program.goal}</Badge>
                <Badge className="bg-white/20 text-white border-0">{program.difficulty}</Badge>
                <Badge className="bg-white/20 text-white border-0">{program.duration_weeks} {ru ? 'нед.' : 'weeks'}</Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{ru ? 'Неделя' : 'Week'} {program.current_week}</p>
              <p className="text-white/70 text-sm">{ru ? 'из' : 'of'} {program.duration_weeks}</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="flex justify-between text-xs text-white/70 mt-1">
              <span>{new Date(program.start_date).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}</span>
              <span>{progressPercent}%</span>
              <span>{new Date(program.end_date).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Today's workout */}
      {todayWorkout && (
        <Card className="border-2 border-teal-200 dark:border-teal-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-teal-600">
                <Target className="w-5 h-5" />
                {ru ? 'Сегодня' : 'Today'} — {dayFull[todayWorkout.day_of_week]}
              </CardTitle>
              {todayWorkout.workouts && (
                <Badge variant="outline">{typeLabels[todayWorkout.workouts.type] || todayWorkout.workouts.type}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {todayWorkout.is_rest_day ? (
              <div className="text-center py-6">
                <Moon className="w-12 h-12 text-indigo-300 mx-auto mb-2" />
                <p className="text-lg font-semibold text-zinc-600 dark:text-zinc-400">{ru ? 'День отдыха' : 'Rest Day'}</p>
                <p className="text-sm text-zinc-400">{ru ? 'Восстанавливайтесь!' : 'Take it easy and recover!'}</p>
              </div>
            ) : todayWorkout.workouts ? (
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  {ru ? todayWorkout.workouts.name_ru || todayWorkout.workouts.name_en : todayWorkout.workouts.name_en}
                </h3>
                <div className="flex gap-3 text-sm text-zinc-500 mb-4">
                  {todayWorkout.workouts.duration_minutes && (
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{todayWorkout.workouts.duration_minutes} {ru ? 'мин' : 'min'}</span>
                  )}
                  <span>{todayWorkout.workouts.workout_exercises?.length || 0} {ru ? 'упражнений' : 'exercises'}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="gradient" className="flex-1 sm:flex-none" onClick={() => startWorkout(todayWorkout.workouts!.id)} disabled={starting}>
                    {starting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                    {ru ? 'Начать' : 'Start'}
                  </Button>
                  <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => openDayDetail(todayWorkout)}>
                    {ru ? 'Детали' : 'Details'}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-zinc-400 text-sm">{ru ? 'Тренировка не запланирована' : 'No workout scheduled'}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Weekly schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {ru ? 'Расписание' : 'Schedule'}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled={viewWeek <= 1} onClick={() => setViewWeek(viewWeek - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 min-w-[100px] text-center">
                {ru ? 'Неделя' : 'Week'} {viewWeek}
                {viewWeek === program.current_week && (
                  <span className="text-teal-500 text-xs ml-1">({ru ? 'текущая' : 'current'})</span>
                )}
              </span>
              <Button variant="ghost" size="sm" disabled={viewWeek >= program.duration_weeks} onClick={() => setViewWeek(viewWeek + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {[0, 1, 2, 3, 4, 5, 6].map(d => (
              <div key={`h-${d}`} className="text-center text-xs font-medium text-zinc-400 pb-2">
                {dayNames[d]}
              </div>
            ))}
            {/* Day cells */}
            {[0, 1, 2, 3, 4, 5, 6].map(d => {
              const day = weekDays.find(wd => wd.day_of_week === d)
              const isToday = viewWeek === program.current_week && d === program.current_day_of_week
              const hasWorkout = day && !day.is_rest_day && day.workouts
              const isRest = day?.is_rest_day

              return (
                <button
                  key={`d-${d}`}
                  onClick={() => day && openDayDetail(day)}
                  disabled={!day}
                  className={`
                    relative rounded-xl p-3 text-center transition-all min-h-[80px] flex flex-col items-center justify-center gap-1
                    ${isToday ? 'ring-2 ring-teal-500 bg-teal-50 dark:bg-teal-500/10' : ''}
                    ${hasWorkout ? 'bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 cursor-pointer' : ''}
                    ${isRest ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''}
                    ${!day ? 'bg-zinc-50/50 dark:bg-zinc-900/30 opacity-40' : ''}
                  `}
                >
                  {isToday && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-500" />
                  )}
                  {hasWorkout ? (
                    <>
                      <Dumbbell className="w-5 h-5 text-blue-500" />
                      <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-tight line-clamp-2">
                        {ru ? day.workouts!.name_ru || day.workouts!.name_en : day.workouts!.name_en}
                      </p>
                    </>
                  ) : isRest ? (
                    <>
                      <Moon className="w-5 h-5 text-indigo-300" />
                      <p className="text-[10px] text-zinc-400">{ru ? 'Отдых' : 'Rest'}</p>
                    </>
                  ) : day ? (
                    <p className="text-xs text-zinc-300">—</p>
                  ) : null}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent logs */}
      {recentLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ru ? 'Недавние тренировки' : 'Recent Workouts'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentLogs.slice(0, 5).map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${log.status === 'completed' ? 'bg-green-100 dark:bg-green-500/20' : 'bg-orange-100 dark:bg-orange-500/20'}`}>
                      {log.status === 'completed'
                        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                        : <Clock className="w-4 h-4 text-orange-500" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {new Date(log.started_at).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      {log.notes && <p className="text-xs text-zinc-500 truncate max-w-[200px]">{log.notes}</p>}
                    </div>
                  </div>
                  <Badge variant={log.status === 'completed' ? 'success' : 'warning'}>
                    {log.status === 'completed' ? (ru ? 'Выполнено' : 'Done') : (ru ? 'Начато' : 'Started')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workout Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)}
        title={selectedDay?.is_rest_day
          ? (ru ? 'День отдыха' : 'Rest Day')
          : (ru
            ? selectedDay?.workouts?.name_ru || selectedDay?.workouts?.name_en || ''
            : selectedDay?.workouts?.name_en || ''
          )
        }
        size="lg"
      >
        {selectedDay && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Calendar className="w-4 h-4" />
              {ru ? 'Неделя' : 'Week'} {selectedDay.week_number}, {dayFull[selectedDay.day_of_week]}
            </div>

            {selectedDay.is_rest_day ? (
              <div className="text-center py-8">
                <Moon className="w-16 h-16 text-indigo-200 mx-auto mb-3" />
                <p className="text-xl font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  {ru ? 'День отдыха' : 'Rest Day'}
                </p>
                <p className="text-zinc-400">
                  {selectedDay.notes || (ru ? 'Отдыхайте и восстанавливайтесь' : 'Rest and recover')}
                </p>
              </div>
            ) : selectedDay.workouts ? (
              <>
                {/* Workout meta */}
                <div className="flex flex-wrap gap-2">
                  {selectedDay.workouts.type && <Badge>{typeLabels[selectedDay.workouts.type] || selectedDay.workouts.type}</Badge>}
                  {selectedDay.workouts.difficulty && <Badge variant="secondary">{selectedDay.workouts.difficulty}</Badge>}
                  {selectedDay.workouts.duration_minutes && (
                    <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />{selectedDay.workouts.duration_minutes} {ru ? 'мин' : 'min'}</Badge>
                  )}
                </div>

                {/* Exercises by section */}
                {['warmup', 'main', 'cooldown'].map(section => {
                  const exercises = selectedDay.workouts!.workout_exercises?.filter(
                    (we: WorkoutExercise) => we.section === section
                  ) || []
                  if (exercises.length === 0) return null
                  const Icon = sectionIcons[section] || Zap
                  const colorClass = sectionColors[section] || ''

                  return (
                    <div key={section}>
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold mb-3 ${colorClass}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {sectionLabels[section] || section}
                      </div>
                      <div className="space-y-2">
                        {exercises.map((we: WorkoutExercise, i: number) => (
                          <div key={we.id} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                            <span className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                                {ru ? we.exercises.name_ru || we.exercises.name_en : we.exercises.name_en}
                              </p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 mt-1">
                                {we.sets > 0 && <span>{we.sets} {ru ? 'подх.' : 'sets'}</span>}
                                {we.reps && <span>{we.reps} {ru ? 'повт.' : 'reps'}</span>}
                                {we.weight && <span>{we.weight}</span>}
                                {we.rest_seconds && <span>{ru ? 'Отдых' : 'Rest'}: {we.rest_seconds}{ru ? 'с' : 's'}</span>}
                              </div>
                              {we.notes && <p className="text-xs text-zinc-400 mt-1">{we.notes}</p>}
                              {we.exercises.muscle_groups?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {we.exercises.muscle_groups.map((m: string) => (
                                    <span key={m} className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded text-[10px] text-zinc-500">
                                      {m}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {/* Video link */}
                              {we.exercises.video_url && (
                                <a href={we.exercises.video_url} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-teal-500 hover:underline mt-1.5">
                                  <Play className="w-3 h-3" />{ru ? 'Видео' : 'Video'}
                                </a>
                              )}
                              {/* Instructions */}
                              {(ru ? we.exercises.instructions_ru : we.exercises.instructions_en) && (
                                <details className="mt-2">
                                  <summary className="text-xs text-teal-600 cursor-pointer hover:underline">
                                    {ru ? 'Инструкция' : 'Instructions'}
                                  </summary>
                                  <p className="text-xs text-zinc-500 mt-1 whitespace-pre-line">
                                    {ru ? we.exercises.instructions_ru : we.exercises.instructions_en}
                                  </p>
                                </details>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </>
            ) : (
              <p className="text-zinc-400">{ru ? 'Нет данных' : 'No data'}</p>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                {ru ? 'Закрыть' : 'Close'}
              </Button>
              {selectedDay?.workouts && !selectedDay.is_rest_day && (
                <Button variant="gradient" onClick={() => { setIsDetailOpen(false); startWorkout(selectedDay.workouts!.id) }} disabled={starting}>
                  {starting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                  {ru ? 'Начать тренировку' : 'Start Workout'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
