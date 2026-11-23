/**
 * Process calendar_sync_outbox → Google Calendar events.
 * Gated by google_calendar_settings.calendar_sync_enabled AND env GOOGLE_CALENDAR_SYNC_ENABLED.
 * Missing departure time → mark needs_departure_time (no invented times). Never throws into checkout.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  buildCalendarEventBody,
  calendarSyncEnabledFromEnv,
  decryptSecret,
  encryptSecret,
  googleFetch,
  googleOAuthConfigured,
  refreshGoogleAccessToken,
  resolveBookingDeparture,
} from '../_shared/googleCalendar.ts'

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
  booking_id: number
  action: 'upsert' | 'delete'
  attempt_count: number
}

async function getAccessToken(admin: ReturnType<typeof createClient>): Promise<{
  token: string
  calendarId: string
} | { error: string }> {
  if (!googleOAuthConfigured()) return { error: 'oauth_not_configured' }
  const { data: row } = await admin.from('google_calendar_settings').select('*').eq('id', 1).maybeSingle()
  if (!row?.refresh_token_ciphertext) return { error: 'not_connected' }
  if (!row.calendar_id) return { error: 'calendar_id_missing' }
  if (!row.calendar_sync_enabled) return { error: 'sync_disabled_in_db' }

  const encKey = Deno.env.get('GOOGLE_TOKEN_ENCRYPTION_KEY')!
  const refresh = await decryptSecret(row.refresh_token_ciphertext, encKey)
  const refreshed = await refreshGoogleAccessToken(refresh)
  const accessCipher = await encryptSecret(refreshed.access_token, encKey)
  await admin
    .from('google_calendar_settings')
    .update({
      access_token_ciphertext: accessCipher,
      token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      last_sync_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
  return { token: refreshed.access_token, calendarId: row.calendar_id }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization') || ''
    const bearer = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!serviceKey || bearer !== serviceKey) return json({ error: 'Unauthorized' }, 401)

    if (!calendarSyncEnabledFromEnv()) {
      return json({
        ok: true,
        processed: 0,
        skipped: true,
        reason: 'GOOGLE_CALENDAR_SYNC_ENABLED is not true',
      })
    }

    const admin = createClient(supabaseUrl, serviceKey)
    const body = await req.json().catch(() => ({}))
    const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 50)

    const access = await getAccessToken(admin)
    if ('error' in access) {
      return json({ ok: true, processed: 0, skipped: true, reason: access.error })
    }

    const { data: claimed, error: claimErr } = await admin.rpc('claim_calendar_sync_outbox', {
      p_limit: limit,
    })
    if (claimErr) throw claimErr

    const rows = (claimed || []) as OutboxRow[]
    const results: Array<{ id: string; status: string; error?: string }> = []

    for (const row of rows) {
      try {
        const { data: booking, error: bErr } = await admin
          .from('bookings')
          .select(
            `
            id, booking_ref, customer_name, customer_email, customer_phone,
            adults, children, status, pickup_location, tour_time, internal_notes, special_requests,
            google_event_id, deleted_at, tour_id, tour_date_id,
            tours ( id, name, public_name, departure_time ),
            tour_dates ( id, date )
          `,
          )
          .eq('id', row.booking_id)
          .maybeSingle()
        if (bErr) throw bErr
        if (!booking) {
          await admin.rpc('complete_calendar_sync_outbox', {
            p_id: row.id,
            p_success: true,
            p_sync_status: 'skipped',
            p_error: 'booking_missing',
          })
          results.push({ id: row.id, status: 'skipped', error: 'booking_missing' })
          continue
        }

        const shouldDelete =
          row.action === 'delete' ||
          booking.status === 'cancelled' ||
          booking.deleted_at != null ||
          booking.status !== 'confirmed'

        if (shouldDelete) {
          if (booking.google_event_id) {
            const del = await googleFetch(
              access.token,
              `/calendars/${encodeURIComponent(access.calendarId)}/events/${encodeURIComponent(booking.google_event_id)}`,
              { method: 'DELETE' },
            )
            // 404/410 = already gone
            if (!del.ok && del.status !== 404 && del.status !== 410) {
              const t = await del.text()
              throw new Error(`delete_failed_${del.status}: ${t.slice(0, 300)}`)
            }
          }
          await admin.rpc('complete_calendar_sync_outbox', {
            p_id: row.id,
            p_success: true,
            p_google_event_id: null,
            p_sync_status: 'deleted',
          })
          // Cancel pending reminders when booking leaves confirmed
          await admin.rpc('cancel_booking_reminders', { p_booking_id: row.booking_id })
          results.push({ id: row.id, status: 'deleted' })
          continue
        }

        const tour = Array.isArray(booking.tours) ? booking.tours[0] : booking.tours
        const tourDate = Array.isArray(booking.tour_dates) ? booking.tour_dates[0] : booking.tour_dates
        const departure = resolveBookingDeparture({
          tourDate: tourDate?.date,
          bookingTourTime: booking.tour_time,
          tourDepartureTime: tour?.departure_time,
        })

        if (!departure.ok) {
          await admin
            .from('bookings')
            .update({
              google_calendar_sync_status: departure.reason,
              google_calendar_sync_error: departure.reason,
            })
            .eq('id', booking.id)
          await admin.rpc('complete_calendar_sync_outbox', {
            p_id: row.id,
            p_success: true,
            p_sync_status: departure.reason,
            p_error: departure.reason,
          })
          await admin.rpc('cancel_booking_reminders', { p_booking_id: booking.id })
          results.push({ id: row.id, status: 'skipped', error: departure.reason })
          continue
        }

        const tourName =
          (tour?.public_name && String(tour.public_name).trim()) ||
          (tour?.name && String(tour.name).trim()) ||
          'Royal Nordic tour'
        const bodyParts = buildCalendarEventBody({
          bookingId: booking.id,
          bookingRef: booking.booking_ref,
          tourName,
          customerName: booking.customer_name,
          customerEmail: booking.customer_email,
          customerPhone: booking.customer_phone,
          adults: booking.adults,
          children: booking.children,
          pickupLocation: booking.pickup_location,
          tourTime: departure.time,
          status: booking.status,
          internalNotes: booking.internal_notes,
          specialRequests: booking.special_requests,
        })

        const eventPayload = {
          summary: bodyParts.summary,
          description: bodyParts.description,
          start: { dateTime: departure.startRfc3339, timeZone: 'Europe/Helsinki' },
          end: { dateTime: departure.endRfc3339, timeZone: 'Europe/Helsinki' },
          reminders: { useDefault: false, overrides: [] as Array<{ method: string; minutes: number }> },
        }

        let eventId = booking.google_event_id as string | null
        if (eventId) {
          const patch = await googleFetch(
            access.token,
            `/calendars/${encodeURIComponent(access.calendarId)}/events/${encodeURIComponent(eventId)}`,
            { method: 'PUT', body: JSON.stringify(eventPayload) },
          )
          if (patch.status === 404) {
            eventId = null
          } else if (!patch.ok) {
            throw new Error(`update_failed_${patch.status}: ${(await patch.text()).slice(0, 300)}`)
          }
        }

        if (!eventId) {
          const create = await googleFetch(
            access.token,
            `/calendars/${encodeURIComponent(access.calendarId)}/events`,
            { method: 'POST', body: JSON.stringify(eventPayload) },
          )
          const created = await create.json()
          if (!create.ok) throw new Error(`create_failed_${create.status}: ${JSON.stringify(created).slice(0, 300)}`)
          eventId = created.id
        }

        await admin.rpc('complete_calendar_sync_outbox', {
          p_id: row.id,
          p_success: true,
          p_google_event_id: eventId,
          p_sync_status: 'synced',
        })

        results.push({ id: row.id, status: 'synced' })
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        await admin.rpc('complete_calendar_sync_outbox', {
          p_id: row.id,
          p_success: false,
          p_error: msg,
        })
        results.push({ id: row.id, status: 'failed', error: msg })
      }
    }

    return json({ ok: true, processed: results.length, results })
  } catch (e) {
    console.error(e)
    return json({ error: e instanceof Error ? e.message : 'internal_error' }, 500)
  }
})
