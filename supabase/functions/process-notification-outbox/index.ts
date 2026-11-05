/**
 * B2B.7 — Process transactional notification outbox (partner booking emails).
 * Auth: service role bearer, or authenticated admin/partner (flush after mutation).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  partnerBookingConfirmedEmail,
  partnerBookingDeclinedEmail,
  partnerBookingSubmittedAdminEmail,
  sendViaResend,
  type PartnerBookingNotifyPayload,
} from '../_shared/partnerEmails.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

type OutboxRow = {
  id: string
  template_key: string
  recipient_email: string
  recipient_role: string
  payload: PartnerBookingNotifyPayload
  partner_booking_request_id: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization') || ''
    const bearer = authHeader.replace(/^Bearer\s+/i, '').trim()

    const isService = Boolean(serviceKey && bearer === serviceKey)
    if (!isService) {
      if (!bearer) return json({ error: 'Unauthorized' }, 401)
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
      })
      const {
        data: { user },
        error: userErr,
      } = await userClient.auth.getUser()
      if (userErr || !user) return json({ error: 'Unauthorized' }, 401)

      const { data: isAdmin } = await userClient.rpc('is_admin')
      if (!isAdmin) {
        const { data: access } = await userClient.rpc('get_my_partner_access')
        if (!access || access.access !== 'approved') {
          return json({ error: 'Forbidden' }, 403)
        }
      }
    }

    const body = await req.json().catch(() => ({}))
    const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 50)
    const admin = createClient(supabaseUrl, serviceKey)

    const { data: claimed, error: claimErr } = await admin.rpc('claim_notification_outbox', {
      p_limit: limit,
    })
    if (claimErr) throw claimErr

    const rows = (claimed || []) as OutboxRow[]
    const results: Array<{ id: string; status: string; error?: string }> = []

    for (const row of rows) {
      try {
        const payload = (row.payload || {}) as PartnerBookingNotifyPayload
        let message: {
          from: string
          to: string | string[]
          subject: string
          html: string
          text: string
        }

        if (row.template_key === 'partner_booking_submitted_admin') {
          const built = partnerBookingSubmittedAdminEmail(payload)
          message = { ...built, to: row.recipient_email }
        } else if (row.template_key === 'partner_booking_confirmed_partner') {
          message = {
            ...partnerBookingConfirmedEmail(payload),
            to: row.recipient_email,
          }
        } else if (row.template_key === 'partner_booking_declined_partner') {
          message = {
            ...partnerBookingDeclinedEmail(payload),
            to: row.recipient_email,
          }
        } else {
          throw new Error(`unknown_template:${row.template_key}`)
        }

        // Never send "confirmed" wording for decline templates (guard).
        if (
          row.template_key === 'partner_booking_declined_partner' &&
          /booking confirmed/i.test(message.subject + message.text)
        ) {
          throw new Error('decline_template_guard')
        }

        const sent = await sendViaResend(message)
        await admin.rpc('complete_notification_outbox', {
          p_id: row.id,
          p_ok: true,
          p_provider_message_id: sent.id || null,
          p_error: null,
        })
        results.push({ id: row.id, status: 'sent' })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'send_failed'
        await admin.rpc('complete_notification_outbox', {
          p_id: row.id,
          p_ok: false,
          p_provider_message_id: null,
          p_error: msg,
        })
        results.push({ id: row.id, status: 'failed', error: msg })
      }
    }

    return json({
      ok: true,
      claimed: rows.length,
      sent: results.filter((r) => r.status === 'sent').length,
      failed: results.filter((r) => r.status === 'failed').length,
      results,
    })
  } catch (error) {
    console.error('process-notification-outbox', error)
    return json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    )
  }
})
