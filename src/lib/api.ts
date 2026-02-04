import { createClient } from '@/lib/supabase'

// Dashboard stats
export async function getDashboardStats() {
  const supabase = createClient()
  
  const [
    { count: clientsCount },
    { count: coursesCount },
    { data: courses },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('courses').select('*').eq('is_published', true),
  ])

  return {
    activeClients: clientsCount || 0,
    publishedCourses: coursesCount || 0,
    courses: courses || [],
  }
}

// Clients
export async function getClients() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      client_profiles(*),
      subscriptions(*)
    `)
    .eq('role', 'client')
    .order('created_at', { ascending: false })
  
  return data || []
}

// Single client
export async function getClient(id: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select(`
      *,
      client_profiles(*),
      subscriptions(*),
      client_courses(*, courses(*))
    `)
    .eq('id', id)
    .single()
  
  return data
}

// Courses
export async function getCourses() {
  const supabase = createClient()
  const { data } = await supabase
    .from('courses')
    .select(`
      *,
      lessons(count)
    `)
    .order('created_at', { ascending: false })
  
  return data || []
}

// Single course with lessons
export async function getCourse(id: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('courses')
    .select(`
      *,
      lessons(*)
    `)
    .eq('id', id)
    .single()
  
  return data
}

// Exercises
export async function getExercises() {
  const supabase = createClient()
  const { data } = await supabase
    .from('exercises')
    .select('*')
    .order('created_at', { ascending: false })
  
  return data || []
}

// Site settings
export async function getSiteSettings() {
  const supabase = createClient()
  const { data } = await supabase
    .from('site_settings')
    .select('*')
  
  const settings: Record<string, any> = {}
  data?.forEach((s: any) => { settings[s.key] = s.value })
  return settings
}

// Update site settings
export async function updateSiteSettings(key: string, value: any) {
  const supabase = createClient()
  const { error } = await supabase
    .from('site_settings')
    .update({ value })
    .eq('key', key)
  
  return { error }
}

// Create course
export async function createCourse(course: { title: string; slug: string; description?: string; price: number; original_price?: number; duration_weeks?: number; is_published?: boolean }) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('courses')
    .insert(course)
    .select()
    .single()
  
  return { data, error }
}

// Update course
export async function updateCourse(id: string, updates: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

// Delete course
export async function deleteCourse(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id)
  
  return { error }
}

// Create exercise
export async function createExercise(exercise: { name: string; description?: string; muscle_groups?: string[]; equipment?: string; video_url?: string; instructions?: string }) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercises')
    .insert(exercise)
    .select()
    .single()
  
  return { data, error }
}

// Update profile
export async function updateProfile(id: string, updates: any) {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
  
  return { error }
}
