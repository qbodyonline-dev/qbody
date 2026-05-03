import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { isValidUUID, sanitizeString } from '@/lib/security'

export const dynamic = 'force-dynamic'

/**
 * POST /api/documents/[id]/send
 *
 * Отправить документ клиенту(ам) одним из двух способов:
 *   - mode = "gift"  → клиент сразу получает доступ (запись в document_purchases
 *     со status='paid', amount_paid=0). Подарок не учитывается в выручке.
 *   - mode = "offer" → клиенту приходит только ссылка; чтобы скачать он должен
 *     оплатить через /d/[id] (обычный Stripe-flow). Запись в document_purchases
 *     не создаётся.
 *
 * В обоих случаях клиенту приходит сообщение в чате со ссылкой на документ.
 *
 * body: {
 *   user_ids: string[],     // массив UUID клиентов
 *   mode: 'gift' | 'offer',
 *   message?: string,        // опциональный текст; иначе генерируется по умолчанию
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error.error }, { status: auth.error.status })
  }

  if (!isValidUUID(params.id)) {
    return NextResponse.json({ error: 'Invalid document id' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { user_ids, mode, message } = body || {}

    // Валидация
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({ error: 'user_ids[] is required' }, { status: 400 })
    }
    if (user_ids.length > 100) {
      return NextResponse.json({ error: 'Too many recipients (max 100)' }, { status: 400 })
    }
    if (user_ids.some((id: any) => !isValidUUID(id))) {
      return NextResponse.json({ error: 'Invalid user_id in list' }, { status: 400 })
    }
    if (mode !== 'gift' && mode !== 'offer') {
      return NextResponse.json({ error: 'mode must be "gift" or "offer"' }, { status: 400 })
    }

    const cleanMessage = message ? sanitizeString(String(message), 2000) : null

    // Проверяем что документ существует и активен
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, title, title_secondary, is_active, is_paid, price')
      .eq('id', params.id)
      .maybeSingle()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    if (!doc.is_active) {
      return NextResponse.json({ error: 'Document is not active' }, { status: 400 })
    }

    // Проверяем что все user_ids — реальные клиенты
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('id', user_ids)

    const validClients = (profiles || []).filter((p: any) => p.role === 'client')
    if (validClients.length === 0) {
      return NextResponse.json({ error: 'No valid client recipients' }, { status: 400 })
    }

    // Базовый URL для ссылки на документ
    const proto = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host') || 'qbodyfit.com'
    const docUrl = `${proto}://${host}/d/${doc.id}`

    const results: Array<{ user_id: string; ok: boolean; error?: string }> = []

    for (const client of validClients) {
      try {
        // 1. Если gift — выдать доступ через document_purchases
        if (mode === 'gift') {
          // Проверяем что у клиента ещё нет paid-записи (UNIQUE индекс по
          // (user_id, document_id) WHERE status='paid' защищает от дублей,
          // но мы не хотим возвращать ошибку — это идемпотентная операция)
          const { data: existing } = await supabase
            .from('document_purchases')
            .select('id')
            .eq('user_id', client.id)
            .eq('document_id', doc.id)
            .eq('status', 'paid')
            .maybeSingle()

          if (!existing) {
            const { error: insertError } = await supabase
              .from('document_purchases')
              .insert({
                user_id: client.id,
                document_id: doc.id,
                stripe_session_id: null,
                amount_paid: 0,
                currency: 'usd',
                status: 'paid',
                email_sent_at: new Date().toISOString(),
              })
            if (insertError) {
              throw new Error(`Grant access failed: ${insertError.message}`)
            }
          }
        }

        // 2. Найти / создать conversation для клиента
        let convId: string | null = null
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('client_id', client.id)
          .maybeSingle()

        if (existingConv) {
          convId = existingConv.id
        } else {
          const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({
              client_id: client.id,
              admin_id: auth.data.user.id,
              status: 'open',
            })
            .select('id')
            .single()
          if (convError || !newConv) {
            throw new Error(`Conversation create failed: ${convError?.message}`)
          }
          convId = newConv.id
        }

        // 3. Сформировать текст сообщения
        const docTitle = doc.title
        const defaultGiftMsg = `📄 Вам открыт доступ к документу «${docTitle}» — скачать: ${docUrl}`
        const defaultOfferMsg = `📄 Документ «${docTitle}» доступен для покупки за $${Number(doc.price).toFixed(2)}: ${docUrl}`
        const finalContent = cleanMessage
          ? `${cleanMessage}\n\n${docUrl}`
          : (mode === 'gift' ? defaultGiftMsg : defaultOfferMsg)

        // 4. Вставить сообщение
        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: convId,
            sender_id: auth.data.user.id,
            content: finalContent,
            attachments: [],
          })
        if (msgError) {
          throw new Error(`Message send failed: ${msgError.message}`)
        }

        // 5. Поднять статус conversation (если был closed/archived)
        await supabase
          .from('conversations')
          .update({ status: 'open' })
          .eq('id', convId)
          .in('status', ['closed', 'archived'])

        results.push({ user_id: client.id, ok: true })
      } catch (err: any) {
        console.error(`Send doc ${doc.id} to ${client.id} failed:`, err)
        results.push({ user_id: client.id, ok: false, error: err.message })
      }
    }

    const sent = results.filter(r => r.ok).length
    const failed = results.length - sent

    return NextResponse.json({
      sent,
      failed,
      total: results.length,
      mode,
      results,
    })
  } catch (err: any) {
    console.error('POST /api/documents/[id]/send error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
