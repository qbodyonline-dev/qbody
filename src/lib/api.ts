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
  
  if (!session?.access_token) {
    throw new Error('No session')
  }
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
  
  const res = await fetch(url, { ...options, headers })
  
  // If 401, try once with refreshed token
  if (res.status === 401) {
    const { data: refreshed } = await supabase.auth.refreshSession()
    if (refreshed.session?.access_token) {
      const retryHeaders = {
        ...options.headers,
        'Authorization': `Bearer ${refreshed.session.access_token}`,
        'Content-Type': 'application/json',
      }
      return fetch(url, { ...options, headers: retryHeaders })
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
    // Session might be stale — force refresh
    const { data: refreshed } = await supabase.auth.refreshSession()
    session = refreshed.session
  }
  
  if (!session?.access_token) {
    throw new Error('No session')
  }
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${session.access_token}`,
  }
  
  const res = await fetch(url, { ...options, headers })
  
  // If 401, try once with refreshed token
  if (res.status === 401) {
    const { data: refreshed } = await supabase.auth.refreshSession()
    if (refreshed.session?.access_token) {
      const retryHeaders: Record<string, string> = {
        'Authorization': `Bearer ${refreshed.session.access_token}`,
      }
      return fetch(url, { ...options, headers: retryHeaders })
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
    { id: 'breast-augmentation-recovery', title: 'Breast Augmentation Recovery', titleRu: 'Восстановление после увеличения груди', slug: 'breast-augmentation-recovery', price: 99, duration_weeks: 6, lessons: 18, is_published: true, created_at: '2025-01-01' },
    { id: 'cesarean-recovery', title: 'C-Section Recovery', titleRu: 'Восстановление после кесарева сечения', slug: 'cesarean-recovery', price: 99, duration_weeks: 8, lessons: 24, is_published: true, created_at: '2025-01-01' },
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
