'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { useTranslation } from '@/lib/i18n'
import { fetchWithAuth, fetchWithAuthUpload } from '@/lib/api'
import {
  Plus, Edit, Trash2, Calendar, Users, Dumbbell, Loader2,
  ChevronDown, ChevronUp, Copy, UserPlus, X, Power, Check, ExternalLink
} from 'lucide-react'
import BlockEditor, { type Block } from '@/components/ui/block-editor'
import { compressImage } from '@/lib/compress-image'
import { toast } from 'sonner'
import { useLanguageConfig } from '@/lib/useLanguageConfig'

/* ═══════════ TYPES ═══════════ */
type WorkoutRef = { id: string; name: string; name_secondary: string | null; type: string; difficulty: string; estimated_duration: number }
type ProgramDay = { id?: string; week_number: number; day_of_week: number; workout_id: string | null; is_rest_day: boolean; notes: string | null; notes_secondary: string | null; workouts?: WorkoutRef | null }
type AssignedClient = { id: string; status: string; start_date: string; current_week: number; profiles: { id: string; full_name: string | null; email: string; avatar_url: string | null } }
type Program = {
  id: string; name: string; name_secondary: string | null; description: string | null; description_secondary: string | null
  duration_weeks: number; goal: string; difficulty: string; is_active: boolean
  program_days: ProgramDay[]; clients_count: number; assigned_clients?: AssignedClient[]; created_at: string
}

type FormDay = { workout_id: string | null; is_rest_day: boolean }

/* ═══════════ CONSTANTS ═══════════ */
const GOALS = ['weight_loss', 'muscle_gain', 'endurance', 'recovery', 'general', 'beginner', 'home'] as const
const DIFFS = ['beginner', 'intermediate', 'advanced'] as const

export default function ProgramsPage() {
  const { t, locale } = useTranslation()
  const ru = locale === 'ru'
  const lang = useLanguageConfig()

  const [programs, setPrograms] = useState<Program[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Workouts for schedule dropdowns
  const [workoutsList, setWorkoutsList] = useState<WorkoutRef[]>([])

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [assignProgramId, setAssignProgramId] = useState<string | null>(null)

  // Form
  const [fName, setFName] = useState('')
  const [fNameSecondary, setFNameSecondary] = useState('')
  const [fSlug, setFSlug] = useState('')
  const [fDesc, setFDesc] = useState('')
  const [fDescSecondary, setFDescSecondary] = useState('')
  const [fFullDesc, setFFullDesc] = useState<Block[]>([])
  const [fFullDescSecondary, setFFullDescSecondary] = useState<Block[]>([])
  const [descTab, setDescTab] = useState<'en' | 'ru'>('ru')
  const [fHeroImage, setFHeroImage] = useState('')
  const [heroUploading, setHeroUploading] = useState(false)
  const [fWeeks, setFWeeks] = useState(8)
  const [fGoal, setFGoal] = useState('general')
  const [fDiff, setFDiff] = useState('intermediate')
  const [fSchedule, setFSchedule] = useState<FormDay[][]>([]) // [week][day]
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null)

  // Assign form
  const [clientsList, setClientsList] = useState<any[]>([])
  const [assignClientId, setAssignClientId] = useState('')
  const [assignStartDate, setAssignStartDate] = useState(new Date().toISOString().split('T')[0])

  /* ─── Hero image upload ─── */
  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setHeroUploading(true)
    try {
      const url = await uploadImageFile(file)
      setFHeroImage(url)
      toast.success(ru ? 'Фото загружено' : 'Image uploaded')
    } catch (e: any) { toast.error(e?.message || (ru ? 'Ошибка загрузки' : 'Upload failed')) }
    finally { setHeroUploading(false) }
  }

  /* ─── Image upload (with client-side compression) ─── */
  const uploadImageFile = async (file: File): Promise<string> => {
    const compressed = await compressImage(file)
    const formData = new FormData()
    formData.append('file', compressed)
    const res = await fetchWithAuthUpload('/api/upload', { method: 'POST', body: formData })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      throw new Error(err.error || 'Upload failed')
    }
    const data = await res.json()
    return data.url
  }

  /* ─── Slug helper ─── */
  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
  const programUrl = fSlug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/programs/${fSlug}` : ''

  /* ─── Labels ─── */
  const goalLabels: Record<string, string> = ru
    ? { weight_loss: 'Похудение', muscle_gain: 'Набор массы', endurance: 'Выносливость', recovery: 'Восстановление', general: 'Общая', beginner: 'Для новичков', home: 'Дома' }
    : { weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', endurance: 'Endurance', recovery: 'Recovery', general: 'General', beginner: 'Beginner', home: 'Home' }
  const diffLabels: Record<string, string> = ru
    ? { beginner: 'Начинающий', intermediate: 'Средний', advanced: 'Продвинутый' }
    : { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }
  const diffColors: Record<string, string> = { beginner: 'bg-green-100 text-green-700', intermediate: 'bg-yellow-100 text-yellow-700', advanced: 'bg-red-100 text-red-700' }
  const dayNames = ru ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  /* ─── FETCH ─── */
  const fetchPrograms = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/programs')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPrograms(data.programs || [])
      setTotal(data.total || 0)
    } catch { toast.error(ru ? 'Ошибка загрузки' : 'Failed to load') }
    finally { setLoading(false) }
  }, [ru])

  const fetchWorkouts = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/workouts?limit=200')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setWorkoutsList((data.workouts || []).map((w: any) => ({
        id: w.id, name: w.name, name_secondary: w.name_secondary, type: w.type, difficulty: w.difficulty, estimated_duration: w.estimated_duration
      })))
    } catch { /* ignore */ }
  }, [])

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/clients')
      if (!res.ok) throw new Error()
      setClientsList(await res.json())
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchPrograms(); fetchWorkouts() }, [fetchPrograms, fetchWorkouts])

  /* ─── SCHEDULE HELPERS ─── */
  const emptyWeek = (): FormDay[] => Array(7).fill(null).map(() => ({ workout_id: null, is_rest_day: true }))

  const buildScheduleFromDays = (days: ProgramDay[], weeks: number): FormDay[][] => {
    const schedule: FormDay[][] = Array.from({ length: weeks }, () => emptyWeek())
    for (const d of days) {
      const wi = d.week_number - 1
      const di = d.day_of_week - 1
      if (wi >= 0 && wi < weeks && di >= 0 && di < 7) {
        schedule[wi][di] = { workout_id: d.is_rest_day ? null : d.workout_id, is_rest_day: d.is_rest_day }
      }
    }
    return schedule
  }

  const scheduleToPayload = (schedule: FormDay[][]): any[] => {
    const days: any[] = []
    schedule.forEach((week, wi) => {
      week.forEach((day, di) => {
        days.push({
          week_number: wi + 1,
          day_of_week: di + 1,
          workout_id: day.is_rest_day ? null : day.workout_id,
          is_rest_day: day.is_rest_day || !day.workout_id,
        })
      })
    })
    return days
  }

  const copyWeek = (fromIdx: number) => {
    const source = fSchedule[fromIdx]
    if (!source) return
    const newSchedule = fSchedule.map((week, i) => i === fromIdx ? week : source.map(d => ({ ...d })))
    setFSchedule(newSchedule)
    toast.success(ru ? `Неделя ${fromIdx + 1} скопирована на все` : `Week ${fromIdx + 1} copied to all`)
  }

  const updateWeeksCount = (n: number) => {
    const current = [...fSchedule]
    if (n > current.length) {
      for (let i = current.length; i < n; i++) current.push(emptyWeek())
    } else {
      current.length = n
    }
    setFWeeks(n)
    setFSchedule(current)
  }

  const setDayWorkout = (wi: number, di: number, workoutId: string | null) => {
    const s = fSchedule.map(w => w.map(d => ({ ...d })))
    s[wi][di] = { workout_id: workoutId, is_rest_day: !workoutId }
    setFSchedule(s)
  }

  /* ─── MODAL ─── */
  const resetForm = () => {
    setFName(''); setFNameSecondary(''); setFSlug(''); setFDesc(''); setFDescSecondary('')
    setFFullDesc([]); setFFullDescSecondary([]); setDescTab('ru'); setFHeroImage('')
    setFWeeks(8); setFGoal('general'); setFDiff('intermediate')
    setFSchedule(Array.from({ length: 8 }, () => emptyWeek()))
    setEditingId(null); setExpandedWeek(null)
  }

  const openAdd = () => { resetForm(); setIsModalOpen(true) }

  const parseBlocks = (val: any): Block[] => {
    if (!val) return []
    if (Array.isArray(val)) return val
    if (typeof val === 'string') {
      try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : [] } catch { return [] }
    }
    return []
  }

  const openEdit = (p: Program) => {
    setEditingId(p.id)
    setFName(p.name); setFNameSecondary(p.name_secondary || ''); setFSlug((p as any).slug || generateSlug(p.name)); setFDesc(p.description || ''); setFDescSecondary(p.description_secondary || '')
    setFFullDesc(parseBlocks((p as any).full_description)); setFFullDescSecondary(parseBlocks((p as any).full_description_secondary)); setDescTab('ru')
    setFHeroImage((p as any).hero_image_url || '')
    setFWeeks(p.duration_weeks); setFGoal(p.goal); setFDiff(p.difficulty)
    setFSchedule(buildScheduleFromDays(p.program_days, p.duration_weeks))
    setExpandedWeek(null)
    setIsModalOpen(true)
  }

  const openAssign = (programId: string) => {
    setAssignProgramId(programId)
    setAssignClientId('')
    setAssignStartDate(new Date().toISOString().split('T')[0])
    fetchClients()
    setIsAssignModalOpen(true)
  }

  /* ─── SAVE ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fName.trim()) { toast.error(ru ? 'Введите название' : 'Name required'); return }
    setSaving(true)

    const slug = fSlug.trim() || generateSlug(fName)
    const payload = {
      name: fName.trim(),
      name_secondary: fNameSecondary.trim() || null,
      slug,
      description: fDesc.trim() || null,
      description_secondary: fDescSecondary.trim() || null,
      full_description: fFullDesc.length > 0 ? fFullDesc : null,
      full_description_secondary: fFullDescSecondary.length > 0 ? fFullDescSecondary : null,
      hero_image_url: fHeroImage || null,
      duration_weeks: fWeeks,
      goal: fGoal,
      difficulty: fDiff,
      days: scheduleToPayload(fSchedule),
    }

    try {
      const url = editingId ? `/api/programs/${editingId}` : '/api/programs'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetchWithAuth(url, { method, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      toast.success(ru ? 'Сохранено' : 'Saved')
      setIsModalOpen(false); resetForm(); fetchPrograms()
    } catch { toast.error(ru ? 'Ошибка' : 'Failed') }
    finally { setSaving(false) }
  }

  /* ─── DELETE ─── */
  const handleDelete = async () => {
    if (!deleteId) return
    setSaving(true)
    try {
      const res = await fetchWithAuth(`/api/programs/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed')
        return
      }
      toast.success(ru ? 'Удалено' : 'Deleted')
      setIsDeleteModalOpen(false); setDeleteId(null); fetchPrograms()
    } catch { toast.error(ru ? 'Ошибка' : 'Failed') }
    finally { setSaving(false) }
  }

  /* ─── ASSIGN ─── */
  const handleAssign = async () => {
    if (!assignProgramId || !assignClientId) return
    setSaving(true)
    try {
      const res = await fetchWithAuth(`/api/programs/${assignProgramId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ client_id: assignClientId, start_date: assignStartDate }),
      })
      if (!res.ok) throw new Error()
      toast.success(ru ? 'Программа назначена' : 'Program assigned')
      setIsAssignModalOpen(false); fetchPrograms()
    } catch { toast.error(ru ? 'Ошибка' : 'Failed') }
    finally { setSaving(false) }
  }

  /* ─── STATS ─── */
  const workoutDays = (p: Program) => (p.program_days || []).filter(d => !d.is_rest_day && d.workout_id).length

  /* ═══════════ RENDER ═══════════ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{ru ? 'Программы тренировок' : 'Training Programs'}</h1>
          <p className="text-zinc-500 mt-1">{total} {ru ? 'программ' : 'programs'}</p>
        </div>
        <Button variant="gradient" onClick={openAdd}><Plus className="w-4 h-4 mr-2" />{ru ? 'Создать' : 'Create Program'}</Button>
      </div>

      {/* Loading */}
      {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>}

      {/* Empty */}
      {!loading && programs.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-600 mb-2">{ru ? 'Нет программ' : 'No programs yet'}</h3>
          <Button variant="gradient" onClick={openAdd} className="mt-4"><Plus className="w-4 h-4 mr-2" />{ru ? 'Создать' : 'Create'}</Button>
        </div>
      )}

      {/* Cards */}
      {!loading && programs.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map(p => (
            <Card key={p.id} className={`card-hover ${!p.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">{ru ? (p.name_secondary || p.name) : p.name}</h3>
                  {!p.is_active && <Badge variant="secondary">{ru ? 'Неакт.' : 'Inactive'}</Badge>}
                </div>
                {(p.description || p.description_secondary) && (
                  <p className="text-sm text-zinc-500 mb-4 line-clamp-2">{ru ? (p.description_secondary || p.description) : p.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 flex items-center gap-2"><Calendar className="w-4 h-4" />{ru ? 'Длительность' : 'Duration'}</span>
                    <span className="font-medium">{p.duration_weeks} {ru ? 'нед.' : 'wks'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 flex items-center gap-2"><Dumbbell className="w-4 h-4" />{ru ? 'Тренировок' : 'Workouts'}</span>
                    <span className="font-medium">{workoutDays(p)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 flex items-center gap-2"><Users className="w-4 h-4" />{ru ? 'Клиентов' : 'Clients'}</span>
                    <Badge>{p.clients_count}</Badge>
                  </div>
                </div>

                <div className="flex gap-1 mb-4 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColors[p.difficulty] || 'bg-zinc-100'}`}>{diffLabels[p.difficulty] || p.difficulty}</span>
                  <Badge variant="secondary" className="text-xs">{goalLabels[p.goal] || p.goal}</Badge>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(p)}>
                    <Edit className="w-4 h-4 mr-1" />{ru ? 'Редакт.' : 'Edit'}
                  </Button>
                  {(p as any).slug && (
                    <Button variant="ghost" size="sm" title={ru ? 'Просмотреть на сайте' : 'View on site'}
                      onClick={() => window.open(`/programs/${(p as any).slug}`, '_blank')}>
                      <ExternalLink className="w-4 h-4 text-blue-500" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" title={ru ? 'Назначить клиенту' : 'Assign to client'} onClick={() => openAssign(p.id)}>
                    <UserPlus className="w-4 h-4 text-teal-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setDeleteId(p.id); setIsDeleteModalOpen(true) }}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ═══════════ ADD/EDIT MODAL ═══════════ */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm() }}
        title={editingId ? (ru ? 'Редактировать программу' : 'Edit Program') : (ru ? 'Новая программа' : 'New Program')} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Basic */}
          <div className={`grid ${lang.isBilingual ? 'sm:grid-cols-2' : ''} gap-4`}>
            <Input label={`${lang.pl(ru ? 'Название' : 'Name')} *`} value={fName} onChange={e => setFName(e.target.value)} required />
            {lang.isBilingual && <Input label={lang.sl(ru ? 'Название' : 'Name')} value={fNameSecondary} onChange={e => setFNameSecondary(e.target.value)} />}
          </div>
          <div className={`grid ${lang.isBilingual ? 'sm:grid-cols-2' : ''} gap-4`}>
            <Input label={lang.pl(ru ? 'Краткое описание' : 'Short Description')} value={fDesc} onChange={e => setFDesc(e.target.value)} />
            {lang.isBilingual && <Input label={lang.sl(ru ? 'Краткое описание' : 'Short Description')} value={fDescSecondary} onChange={e => setFDescSecondary(e.target.value)} />}
          </div>

          {/* Slug / Link */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{ru ? 'Ссылка на программу' : 'Program Link'}</label>
            <div className="flex gap-2">
              <Input
                value={fSlug}
                onChange={e => setFSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder={generateSlug(fName) || 'my-program'}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm"
                onClick={() => { if (!fSlug && fName) setFSlug(generateSlug(fName)) }}
                title={ru ? 'Сгенерировать' : 'Generate'}>
                {ru ? 'Сген.' : 'Gen.'}
              </Button>
            </div>
            {(fSlug || fName) && (
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs bg-white dark:bg-zinc-900 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 flex-1 truncate">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/programs/{fSlug || generateSlug(fName)}
                </code>
                <button type="button" onClick={() => {
                  const url = `${window.location.origin}/programs/${fSlug || generateSlug(fName)}`
                  navigator.clipboard.writeText(url)
                  toast.success(ru ? 'Ссылка скопирована' : 'Link copied')
                }} className="text-teal-500 hover:text-teal-600">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {/* ─── Hero Image ─── */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{ru ? 'Фото программы (hero)' : 'Program Photo (hero)'}</label>
            {fHeroImage ? (
              <div className="relative">
                <img src={fHeroImage} alt="Hero" className="w-full h-40 object-cover rounded-lg" />
                <button type="button" onClick={() => setFHeroImage('')}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg cursor-pointer hover:border-teal-400 transition-colors">
                {heroUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
                ) : (
                  <>
                    <Plus className="w-6 h-6 text-zinc-400 mb-1" />
                    <span className="text-xs text-zinc-500">{ru ? 'Загрузить фото' : 'Upload photo'}</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" />
              </label>
            )}
            <p className="text-[11px] text-zinc-400">{ru ? 'Отображается в шапке страницы программы. Рекоменд. 1920×600px' : 'Displayed in the program page header. Recommended 1920×600px'}</p>
          </div>

          {/* ─── Full Description (Block Editor) ─── */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">{ru ? 'Полное описание' : 'Full Description'}</h3>
              {lang.isBilingual && (
                <div className="flex gap-1">
                  <button type="button" onClick={() => setDescTab('en')}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${descTab === 'en' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>{lang.pCode}</button>
                  <button type="button" onClick={() => setDescTab('ru')}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${descTab === 'ru' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>{lang.sCode}</button>
                </div>
              )}
            </div>
            {descTab === 'ru' && lang.isBilingual ? (
              <BlockEditor value={fFullDescSecondary} onChange={setFFullDescSecondary} locale="ru" uploadImage={uploadImageFile} />
            ) : (
              <BlockEditor value={fFullDesc} onChange={setFFullDesc} locale="en" uploadImage={uploadImageFile} />
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{ru ? 'Недель' : 'Weeks'}</label>
              <select className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-sm"
                value={fWeeks} onChange={e => updateWeeksCount(parseInt(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24].map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{ru ? 'Цель' : 'Goal'}</label>
              <select className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-sm"
                value={fGoal} onChange={e => setFGoal(e.target.value)}>
                {GOALS.map(g => <option key={g} value={g}>{goalLabels[g]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{ru ? 'Сложность' : 'Difficulty'}</label>
              <select className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-sm"
                value={fDiff} onChange={e => setFDiff(e.target.value)}>
                {DIFFS.map(d => <option key={d} value={d}>{diffLabels[d]}</option>)}
              </select>
            </div>
          </div>

          {/* ─── SCHEDULE ─── */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h3 className="font-semibold mb-3">{ru ? 'Расписание' : 'Schedule'}</h3>
            <div className="space-y-2">
              {fSchedule.map((week, wi) => {
                const workoutCount = week.filter(d => d.workout_id).length
                return (
                  <div key={wi} className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                    {/* Week header */}
                    <button type="button" onClick={() => setExpandedWeek(expandedWeek === wi ? null : wi)}
                      className="w-full flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                      <span className="font-medium text-sm">{ru ? 'Неделя' : 'Week'} {wi + 1}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500">{workoutCount} {ru ? 'трен.' : 'workouts'}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); copyWeek(wi) }}
                          className="text-xs text-teal-500 hover:text-teal-600 flex items-center gap-1" title={ru ? 'Скопировать на все недели' : 'Copy to all weeks'}>
                          <Copy className="w-3 h-3" />{ru ? 'На все' : 'To all'}
                        </button>
                        {expandedWeek === wi ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {/* Week grid */}
                    {expandedWeek === wi && (
                      <div className="p-3 grid grid-cols-7 gap-2">
                        {week.map((day, di) => (
                          <div key={di} className="text-center">
                            <p className="text-xs font-medium text-zinc-500 mb-1">{dayNames[di]}</p>
                            <select value={day.workout_id || ''} onChange={e => setDayWorkout(wi, di, e.target.value || null)}
                              className={`w-full text-xs p-1.5 border rounded-lg transition-colors ${day.workout_id
                                ? 'border-teal-300 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-800 text-teal-700 dark:text-teal-300'
                                : 'border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-zinc-500'
                              }`}>
                              <option value="">{ru ? 'Отдых' : 'Rest'}</option>
                              {workoutsList.map(w => (
                                <option key={w.id} value={w.id}>{ru ? (w.name_secondary || w.name) : w.name}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 sticky bottom-0 bg-white dark:bg-zinc-900 pb-1">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); resetForm() }}>{ru ? 'Отмена' : 'Cancel'}</Button>
            <Button type="submit" variant="gradient" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {ru ? 'Сохранить' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ═══════════ ASSIGN MODAL ═══════════ */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)}
        title={ru ? 'Назначить программу клиенту' : 'Assign Program to Client'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{ru ? 'Клиент' : 'Client'}</label>
            <select className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 text-sm"
              value={assignClientId} onChange={e => setAssignClientId(e.target.value)}>
              <option value="">{ru ? 'Выберите клиента...' : 'Select client...'}</option>
              {clientsList.map((c: any) => (
                <option key={c.id} value={c.id}>{c.full_name || c.email}</option>
              ))}
            </select>
          </div>
          <Input label={ru ? 'Дата начала' : 'Start Date'} type="date" value={assignStartDate} onChange={e => setAssignStartDate(e.target.value)} />
          <p className="text-xs text-zinc-500">{ru ? 'Если у клиента есть активная программа, она будет отменена.' : 'If the client has an active program, it will be cancelled.'}</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>{ru ? 'Отмена' : 'Cancel'}</Button>
            <Button variant="gradient" onClick={handleAssign} disabled={saving || !assignClientId}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <UserPlus className="w-4 h-4 mr-2" />{ru ? 'Назначить' : 'Assign'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ═══════════ DELETE MODAL ═══════════ */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setDeleteId(null) }}
        title={ru ? 'Удалить программу' : 'Delete Program'} size="sm">
        <div className="space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400">{ru ? 'Вы уверены? Программу с активными клиентами нельзя удалить.' : 'Are you sure? Programs with active clients cannot be deleted.'}</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>{ru ? 'Отмена' : 'Cancel'}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving} className="bg-red-500 hover:bg-red-600 text-white">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-2" />{ru ? 'Удалить' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
