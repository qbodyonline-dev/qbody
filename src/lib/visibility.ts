import { createServerClient } from '@/lib/supabase-server'

/**
 * Private ("hidden") courses & programs, and personal assignments.
 *
 * A private item is invisible in every catalog and unreachable by its direct
 * link — only the clients it was assigned to, plus admins/trainers, may see it.
 *
 * An assignment (`client_assignments`) says WHO may see it and on what terms:
 *   mode 'free' — access granted right away; a course_access / client_programs
 *                 row is written alongside, so every existing access check works
 *   mode 'paid' — the client sees it and may buy it; access arrives through the
 *                 Stripe webhook exactly like a normal purchase
 *
 * So: assignment = visibility + intent, course_access / client_programs = access.
 */

export type AssignmentMode = 'free' | 'paid'

/** Statuses of client_programs that still count as "enrolled". */
export const ASSIGNED_STATUSES = ['active', 'paused', 'completed', 'expired']

export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'trainer'
}

/** Does this user hold access to the course with that slug? */
export async function hasCourseAccess(userId: string, courseSlug: string): Promise<boolean> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('course_access')
    .select('id')
    .eq('user_id', userId)
    .eq('course_slug', courseSlug)
    .eq('is_active', true)
    .maybeSingle()
  return !!data
}

/** Is this program enrolled for that client (any status except cancelled)? */
export async function hasProgramEnrollment(userId: string, programId: string): Promise<boolean> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('client_programs')
    .select('id')
    .eq('client_id', userId)
    .eq('program_id', programId)
    .in('status', ASSIGNED_STATUSES)
    .limit(1)
  return !!(data && data.length > 0)
}

/** The client's personal assignment for a course, if any. */
export async function courseAssignment(userId: string, courseId: string): Promise<AssignmentMode | null> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('client_assignments')
    .select('mode')
    .eq('client_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()
  return (data?.mode as AssignmentMode) || null
}

/** The client's personal assignment for a program, if any. */
export async function programAssignment(userId: string, programId: string): Promise<AssignmentMode | null> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('client_assignments')
    .select('mode')
    .eq('client_id', userId)
    .eq('program_id', programId)
    .maybeSingle()
  return (data?.mode as AssignmentMode) || null
}

/** May this user see a private course at all (bought it, or it was assigned)? */
export async function canSeeCourse(userId: string, courseId: string, courseSlug: string): Promise<boolean> {
  if (await courseAssignment(userId, courseId)) return true
  return hasCourseAccess(userId, courseSlug)
}

/** May this user see a private program at all (enrolled, or it was assigned)? */
export async function canSeeProgram(userId: string, programId: string): Promise<boolean> {
  if (await programAssignment(userId, programId)) return true
  return hasProgramEnrollment(userId, programId)
}

/** Ids of every course personally assigned to this client. */
export async function assignedCourseIds(userId: string): Promise<Set<string>> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('client_assignments')
    .select('course_id')
    .eq('client_id', userId)
    .not('course_id', 'is', null)
  return new Set((data || []).map((r: any) => r.course_id))
}

/** Ids of every program this client may see: enrolled in or personally assigned. */
export async function visibleProgramIds(userId: string): Promise<Set<string>> {
  const supabase = createServerClient()
  const [enrolled, assigned] = await Promise.all([
    supabase
      .from('client_programs')
      .select('program_id')
      .eq('client_id', userId)
      .in('status', ASSIGNED_STATUSES),
    supabase
      .from('client_assignments')
      .select('program_id')
      .eq('client_id', userId)
      .not('program_id', 'is', null),
  ])
  const ids = new Set<string>()
  for (const r of enrolled.data || []) ids.add((r as any).program_id)
  for (const r of assigned.data || []) ids.add((r as any).program_id)
  return ids
}
