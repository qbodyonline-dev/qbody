import { createServerClient } from '@/lib/supabase-server'

/**
 * Private ("hidden") courses & programs.
 *
 * A private item is invisible in every catalog and unreachable by its direct
 * link — only the clients it was explicitly assigned to, plus admins/trainers,
 * may see and open it.  Assignment reuses the existing access tables:
 *   courses           -> course_access   (user_id, course_slug)
 *   training_programs -> client_programs (client_id, program_id)
 */

/** Statuses of client_programs that still count as "assigned". */
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

/** Is this program assigned to that client (any status except cancelled)? */
export async function hasProgramAssignment(userId: string, programId: string): Promise<boolean> {
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

/** Program ids of every private program assigned to this client. */
export async function assignedPrivateProgramIds(userId: string): Promise<Set<string>> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('client_programs')
    .select('program_id')
    .eq('client_id', userId)
    .in('status', ASSIGNED_STATUSES)
  return new Set((data || []).map((r: any) => r.program_id))
}
