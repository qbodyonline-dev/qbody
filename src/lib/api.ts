// Dashboard stats — via API route (server-side, bypasses RLS)
export async function getDashboardStats() {
  try {
    const res = await fetch('/api/stats')
    if (!res.ok) throw new Error('Failed to fetch stats')
    return await res.json()
  } catch {
    return { totalClients: 0, activeClients: 0, publishedCourses: 2, totalCourses: 2, totalRevenue: 0, paidOrders: 0 }
  }
}

// Clients — via API route (server-side, bypasses RLS)
export async function getClients() {
  try {
    const res = await fetch('/api/clients')
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
