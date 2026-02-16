import { createClient } from '@/lib/supabase'

// Helper for authenticated API requests
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const supabase = createClient()
  
  // Try getSession first, then refreshSession if token is stale
  let { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    const { data: refreshed } = await supabase.auth.refreshSession()
    session = refreshed.session
  }
  
  // Build headers — if we have a token, add Bearer auth
  // If not, send without Authorization header — server will use cookie-based auth fallback
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> || {}),
  }
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  
  const res = await fetch(url, { ...options, headers, credentials: 'include' })
  
  // If 401 and we had a token, try once with refreshed token
  if (res.status === 401 && session?.access_token) {
    const { data: refreshed } = await supabase.auth.refreshSession()
    if (refreshed.session?.access_token) {
      const retryHeaders: Record<string, string> = {
        ...headers,
        'Authorization': `Bearer ${refreshed.session.access_token}`,
      }
      return fetch(url, { ...options, headers: retryHeaders, credentials: 'include' })
    }
  }
  
  return res
}

// Helper for authenticated file uploads (FormData — no Content-Type header)
export async function fetchWithAuthUpload(url: string, options: RequestInit = {}) {
  const supabase = createClient()
  
  // Try getSession first, then refreshSession if token is stale
  let { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    const { data: refreshed } = await supabase.auth.refreshSession()
    session = refreshed.session
  }
  
  // Build headers — if we have a token, add Bearer auth
  // If not, send without Authorization header — server will use cookie-based auth fallback
  const headers: Record<string, string> = {}
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  
  const res = await fetch(url, { ...options, headers, credentials: 'include' })
  
  // If 401 and we had a token, try once with refreshed token
  if (res.status === 401 && session?.access_token) {
    const { data: refreshed } = await supabase.auth.refreshSession()
    if (refreshed.session?.access_token) {
      const retryHeaders: Record<string, string> = {
        'Authorization': `Bearer ${refreshed.session.access_token}`,
      }
      return fetch(url, { ...options, headers: retryHeaders, credentials: 'include' })
    }
  }
  
  return res
}

// Dashboard stats — via API route (requires admin auth)
export async function getDashboardStats() {
  try {
    const res = await fetchWithAuth('/api/stats')
    if (!res.ok) throw new Error('Failed to fetch stats')
    return await res.json()
  } catch {
    return { totalClients: 0, activeClients: 0, publishedCourses: 2, totalCourses: 2, totalRevenue: 0, paidOrders: 0 }
  }
}

// Clients — via API route (requires admin auth)
export async function getClients() {
  try {
    const res = await fetchWithAuth('/api/clients')
    if (!res.ok) throw new Error('Failed to fetch clients')
    return await res.json()
  } catch {
    return []
  }
}

// Courses — hardcoded from stripe.ts definitions
export function getCourses() {
  return [
    { id: 'breast-augmentation-recovery', title: 'Breast Augmentation Recovery', titleSecondary: 'Восстановление после увеличения груди', slug: 'breast-augmentation-recovery', price: 99, duration_weeks: 6, lessons: 18, is_published: true, created_at: '2025-01-01' },
    { id: 'cesarean-recovery', title: 'C-Section Recovery', titleSecondary: 'Восстановление после кесарева сечения', slug: 'cesarean-recovery', price: 99, duration_weeks: 8, lessons: 24, is_published: true, created_at: '2025-01-01' },
  ]
}

// Single course
export function getCourse(id: string) {
  const courses = getCourses()
  return courses.find(c => c.id === id || c.slug === id) || null
}

// Update profile
export async function updateProfile(id: string, updates: any) {
  const { createClient } = await import('@/lib/supabase')
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
  
  return { error }
}
