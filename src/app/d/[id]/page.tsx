import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { createServerClient as createSSRClient } from '@supabase/ssr'
import DocumentLanding from './DocumentLanding'

export const dynamic = 'force-dynamic'

async function getCurrentUser() {
  try {
    const cookieStore = cookies()
    const supabase = createSSRClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll().map(c => ({ name: c.name, value: c.value }))
          },
          setAll() {},
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { paid?: string; canceled?: string }
}) {
  const supabase = createServerClient()

  // Fetch document
  const { data: doc } = await supabase
    .from('documents')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!doc) notFound()

  // Get current user
  const user = await getCurrentUser()

  // Check user role / purchase status
  let isAdmin = false
  let hasPurchased = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    isAdmin = profile?.role === 'admin' || profile?.role === 'trainer'

    if (doc.is_paid) {
      const { data: purchase } = await supabase
        .from('document_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('document_id', params.id)
        .eq('status', 'paid')
        .maybeSingle()

      hasPurchased = !!purchase
    }
  }

  // Free document: anyone (logged in or not) can download immediately
  // Paid + admin/trainer: free download
  // Paid + purchased: free download
  const canDownload = !doc.is_paid || isAdmin || hasPurchased

  return (
    <DocumentLanding
      doc={{
        id: doc.id,
        title: doc.title,
        title_secondary: doc.title_secondary,
        description: doc.description,
        description_secondary: doc.description_secondary,
        preview_url: doc.preview_url,
        is_paid: doc.is_paid,
        price: doc.price,
        original_price: doc.original_price,
        file_name: doc.file_name,
        file_size: doc.file_size,
        mime_type: doc.mime_type,
      }}
      canDownload={canDownload}
      isAuthenticated={!!user}
      paidJustNow={searchParams.paid === '1'}
      canceled={searchParams.canceled === '1'}
    />
  )
}
