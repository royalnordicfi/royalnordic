/**
 * Shared Bookings 1.6D — deliver GYG notify-availability-update outbox rows.
 * Official: POST /1/notify-availability-update with Basic Auth + current vacancies.
 * Gated by SHARED_BOOKINGS_GYG_NOTIFY_ENABLED (default off). Never mutates booking capacity.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  buildGygNotifyAvailabilityRequest,
  classifyGygNotifyResponse,
  GYG_NOTIFY_URL_DEFAULT,
  gygNotifyEnabledFromEnv,
} from '../_shared/gygAvailabilitySync.ts'
import { formatGygLocalDateTime } from '../_shared/gygAvailability.ts'

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
  product_id: string
  departure_id: string | null
  departure_date: string | null
  departure_time: string | null
  vacancies: number
  attempt_count: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization') || ''
    const bearer = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!serviceKey || bearer !== serviceKey) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const notifyEnabled = gygNotifyEnabledFromEnv(Deno.env.get('SHARED_BOOKINGS_GYG_NOTIFY_ENABLED'))
    const notifyUser = Deno.env.get('SHARED_BOOKINGS_GYG_NOTIFY_USER') || ''
    const notifyPass = Deno.env.get('SHARED_BOOKINGS_GYG_NOTIFY_PASSWORD') || ''
    const notifyUrl = Deno.env.get('SHARED_BOOKINGS_GYG_NOTIFY_URL') || GYG_NOTIFY_URL_DEFAULT

    if (!notifyEnabled) {
      return json({
        ok: true,
        processed: 0,
        skipped: true,
        reason: 'SHARED_BOOKINGS_GYG_NOTIFY_ENABLED is not true',
      })
    }
    if (!notifyUser || !notifyPass) {
      return json({
        ok: false,
        error: 'credentials_required',
        required: ['SHARED_BOOKINGS_GYG_NOTIFY_USER', 'SHARED_BOOKINGS_GYG_NOTIFY_PASSWORD'],
      }, 503)
    }

    const body = await req.json().catch(() => ({}))
    const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 50)
    const admin = createClient(supabaseUrl, serviceKey)

    const { data: claimed, error: claimErr } = await admin.rpc('claim_gyg_availability_outbox', {
      p_limit: limit,
    })
    if (claimErr) throw claimErr

    const rows = (claimed || []) as OutboxRow[]
    const results: Array<{ id: string; status: string; error?: string }> = []
    const basic = btoa(`${notifyUser}:${notifyPass}`)

    for (const row of rows) {
      try {
        // Recompute live vacancies at send time — Shared Bookings is source of truth.
        let vacancies = row.vacancies
        let departureDate = row.departure_date
        let departureTime = row.departure_time
        if (row.departure_id) {
          const { data: seats } = await admin.rpc('shared_departure_available_seats', {
            p_departure_id: row.departure_id,
          })
          if (typeof seats === 'number') vacancies = seats
          const { data: deps } = await admin
            .from('shared_departures')
            .select('departure_date, departure_time, status')
            .eq('id', row.departure_id)
            .limit(1)
          const dep = deps?.[0]
          if (dep) {
            departureDate = dep.departure_date
            departureTime = dep.departure_time
            if (dep.status !== 'active') vacancies = 0
          }
        }

        if (!departureDate) {
          await admin.rpc('complete_gyg_availability_outbox', {
            p_id: row.id,
            p_success: false,
            p_error: 'missing_departure_date',
          })
          results.push({ id: row.id, status: 'failed', error: 'missing_departure_date' })
          continue
        }

        const payload = buildGygNotifyAvailabilityRequest(
          row.product_id,
          departureDate,
          departureTime,
          vacancies,
        )
        const dateTimeLocal = formatGygLocalDateTime(departureDate, departureTime)

        const res = await fetch(notifyUrl, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basic}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        const resBody = await res.json().catch(() => ({}))
        const classified = classifyGygNotifyResponse({
          httpStatus: res.status,
          body: resBody,
        })

        await admin.rpc('complete_gyg_availability_outbox', {
          p_id: row.id,
          p_success: classified.ok,
          p_error: classified.ok ? null : classified.error,
          p_vacancies: vacancies,
          p_date_time_local: dateTimeLocal,
        })

        results.push({
          id: row.id,
          status: classified.ok ? 'sent' : classified.retryable ? 'failed' : 'dead_or_failed',
          error: classified.error,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'send_failed'
        await admin.rpc('complete_gyg_availability_outbox', {
          p_id: row.id,
          p_success: false,
          p_error: message,
        })
        results.push({ id: row.id, status: 'failed', error: message })
      }
    }

    return json({ ok: true, processed: rows.length, results })
  } catch (err) {
    console.error('process-gyg-availability-outbox', err)
    return json({ error: err instanceof Error ? err.message : 'server_error' }, 500)
  }
})
