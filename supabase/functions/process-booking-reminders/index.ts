/**
 * Send admin departure reminders (24h / 10h / 6h) via Resend.
 * Gated by google_calendar_settings.reminders_enabled AND GOOGLE_CALENDAR_REMINDERS_ENABLED.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { adminBookingUrl, calendarRemindersEnabledFromEnv } from '../_shared/googleCalendar.ts'
import { sendViaResend } from '../_shared/partnerEmails.ts'

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

type ReminderRow = {
  id: string
  booking_id: number
  reminder_kind: '24h' | '10h' | '6h'
  recipient_email: string | null
  payload: Record<string, unknown>
}

function reminderLabel(kind: string): string {
  if (kind === '24h') return '24 hours'
  if (kind === '10h') return '10 hours'
  if (kind === '6h') return '6 hours'
  return kind
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization') || ''
    const bearer = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!serviceKey || bearer !== serviceKey) return json({ error: 'Unauthorized' }, 401)

    if (!calendarRemindersEnabledFromEnv()) {
      return json({
        ok: true,
        processed: 0,
        skipped: true,
        reason: 'GOOGLE_CALENDAR_REMINDERS_ENABLED is not true',
      })
    }

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: settings } = await admin
      .from('google_calendar_settings')
      .select('reminders_enabled, admin_reminder_email')
      .eq('id', 1)
      .maybeSingle()

    if (!settings?.reminders_enabled) {
      return json({ ok: true, processed: 0, skipped: true, reason: 'reminders_disabled_in_db' })
    }

    const body = await req.json().catch(() => ({}))
    const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 50)
    const { data: claimed, error: claimErr } = await admin.rpc('claim_booking_reminder_outbox', {
      p_limit: limit,
    })
    if (claimErr) throw claimErr

    const rows = (claimed || []) as ReminderRow[]
    const results: Array<{ id: string; status: string; error?: string }> = []
    const from = Deno.env.get('RESEND_FROM') || 'Royal Nordic <noreply@royalnordic.fi>'

    for (const row of rows) {
      try {
        const { data: booking } = await admin
          .from('bookings')
          .select(
            `
            id, booking_ref, customer_name, customer_email, customer_phone,
            adults, children, status, pickup_location, tour_time, deleted_at,
            tours ( name, public_name, departure_time ),
            tour_dates ( date )
          `,
          )
          .eq('id', row.booking_id)
          .maybeSingle()

        if (!booking || booking.status !== 'confirmed' || booking.deleted_at) {
          await admin.rpc('complete_booking_reminder_outbox', {
            p_id: row.id,
            p_success: false,
            p_error: 'booking_not_confirmed',
          })
          // Mark cancelled rather than dead spam
          await admin
            .from('booking_reminder_outbox')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('id', row.id)
          results.push({ id: row.id, status: 'cancelled' })
          continue
        }

        const tour = Array.isArray(booking.tours) ? booking.tours[0] : booking.tours
        const tourDate = Array.isArray(booking.tour_dates) ? booking.tour_dates[0] : booking.tour_dates
        const tourName =
          (tour?.public_name && String(tour.public_name).trim()) ||
          (tour?.name && String(tour.name).trim()) ||
          'Tour'
        const ref = booking.booking_ref || `RN-${booking.id}`
        const to =
          row.recipient_email ||
          settings.admin_reminder_email ||
          'contact@royalnordic.fi'
        const whenLabel = reminderLabel(row.reminder_kind)
        const adminUrl = adminBookingUrl(booking.id)
        const subject = `[RN] Tour in ${whenLabel}: ${tourName} · ${ref}`
        const text = [
          `Royal Nordic operational reminder — ${whenLabel} before departure`,
          '',
          `Booking: ${ref}`,
          `Tour: ${tourName}`,
          `Date: ${tourDate?.date || '—'}`,
          `Time: ${booking.tour_time || tour?.departure_time || '—'} (Europe/Helsinki)`,
          `Customer: ${booking.customer_name}`,
          `Email: ${booking.customer_email}`,
          `Phone: ${booking.customer_phone || '—'}`,
          `Guests: ${booking.adults} adult(s), ${booking.children} child(ren)`,
          `Pickup: ${booking.pickup_location || '—'}`,
          '',
          `Open booking: ${adminUrl}`,
        ].join('\n')
        const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
          <p><strong>Tour in ${whenLabel}</strong></p>
          <p>Booking <strong>${ref}</strong> · ${tourName}</p>
          <ul>
            <li>Date: ${tourDate?.date || '—'}</li>
            <li>Time: ${booking.tour_time || tour?.departure_time || '—'} (Europe/Helsinki)</li>
            <li>Customer: ${booking.customer_name} · ${booking.customer_email} · ${booking.customer_phone || '—'}</li>
            <li>Guests: ${booking.adults} adult(s), ${booking.children} child(ren)</li>
            <li>Pickup: ${booking.pickup_location || '—'}</li>
          </ul>
          <p><a href="${adminUrl}">Open in Royal Nordic Admin</a></p>
        </div>`

        const sent = await sendViaResend({ from, to, subject, html, text })
        await admin.rpc('complete_booking_reminder_outbox', {
          p_id: row.id,
          p_success: true,
          p_provider_message_id: sent.id || null,
        })
        results.push({ id: row.id, status: 'sent' })
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        await admin.rpc('complete_booking_reminder_outbox', {
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
