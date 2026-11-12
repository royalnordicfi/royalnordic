/**
 * Shared Bookings external ingestion (GetYourGuide Supplier API + Bókun webhooks).
 *
 * Auth (documented):
 * - GetYourGuide: HTTP Basic Auth in both directions (integrator.getyourguide.com).
 * - Bókun: X-Bokun-HMAC over sorted X-Bokun-* headers (bokun.dev webhooks docs).
 *
 * Live processing stays off until env flags + DB ingestion_enabled + product mappings.
 * No outbound availability notify in 1.5. No invented provider schemas.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  buildGygAvailabilities,
  normalizeGygActionPath,
  parseGygAvailabilityQuery,
  type SharedDepartureAvailabilityRow,
} from '../_shared/gygAvailability.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-bokun-apikey, x-bokun-hmac, x-bokun-topic, x-bokun-vendor-id, x-bokun-booking-id, x-bokun-experiencebooking-id',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function gygError(errorCode: string, errorMessage: string, extra: Record<string, unknown> = {}) {
  // Official GYG Supplier API: HTTP 200 with errorCode payload for application errors.
  return json({ errorCode, errorMessage, ...extra }, 200)
}

function serviceClient() {
  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(url, key)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

function parseBasicAuth(header: string | null): { user: string; pass: string } | null {
  if (!header?.startsWith('Basic ')) return null
  try {
    const decoded = atob(header.slice(6))
    const idx = decoded.indexOf(':')
    if (idx < 0) return null
    return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) }
  } catch {
    return null
  }
}

function gygCredsConfigured(): boolean {
  return Boolean(
    Deno.env.get('SHARED_BOOKINGS_GYG_BASIC_USER') &&
      Deno.env.get('SHARED_BOOKINGS_GYG_BASIC_PASSWORD'),
  )
}

function gygIngestionEnvEnabled(): boolean {
  return String(Deno.env.get('SHARED_BOOKINGS_GYG_INGESTION_ENABLED') || '').toLowerCase() === 'true'
}

function bokunSecretConfigured(): boolean {
  return Boolean(Deno.env.get('SHARED_BOOKINGS_BOKUN_WEBHOOK_SECRET'))
}

function bokunIngestionEnvEnabled(): boolean {
  return String(Deno.env.get('SHARED_BOOKINGS_BOKUN_INGESTION_ENABLED') || '').toLowerCase() === 'true'
}

function verifyGygBasic(req: Request): boolean {
  const expectedUser = Deno.env.get('SHARED_BOOKINGS_GYG_BASIC_USER') || ''
  const expectedPass = Deno.env.get('SHARED_BOOKINGS_GYG_BASIC_PASSWORD') || ''
  if (!expectedUser || !expectedPass) return false
  const parsed = parseBasicAuth(req.headers.get('Authorization'))
  if (!parsed) return false
  return timingSafeEqual(parsed.user, expectedUser) && timingSafeEqual(parsed.pass, expectedPass)
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function hmacSha256Base64(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  let binary = ''
  for (const b of new Uint8Array(sig)) binary += String.fromCharCode(b)
  return btoa(binary)
}

/** Official Bókun webhook HMAC (hex digest of sorted X-Bokun-* headers excluding HMAC). */
async function verifyBokunHmac(req: Request): Promise<boolean> {
  const secret = Deno.env.get('SHARED_BOOKINGS_BOKUN_WEBHOOK_SECRET') || ''
  if (!secret) return false
  const provided = req.headers.get('x-bokun-hmac') || req.headers.get('X-Bokun-HMAC') || ''
  if (!provided) return false

  const pairs: string[] = []
  req.headers.forEach((value, name) => {
    const lower = name.toLowerCase()
    if (lower.startsWith('x-bokun-') && lower !== 'x-bokun-hmac') {
      pairs.push(`${lower}=${value}`)
    }
  })
  pairs.sort()
  const base = pairs.join('&')
  const digest = await hmacSha256Hex(secret, base)
  const b64 = await hmacSha256Base64(secret, base)
  return timingSafeEqual(provided.toLowerCase(), digest.toLowerCase()) || timingSafeEqual(provided, b64)
}

function pathTail(pathname: string): string {
  // /functions/v1/shared-bookings-external/...
  const marker = '/shared-bookings-external'
  const idx = pathname.indexOf(marker)
  const rest = idx >= 0 ? pathname.slice(idx + marker.length) : pathname
  return rest.replace(/^\/+/, '') || ''
}

type SeatCounts = { adults: number; children: number }

function countGygCategories(
  items: Array<{ category?: string; count?: number }> | undefined,
  adultCats: string[],
  childCats: string[],
): SeatCounts {
  let adults = 0
  let children = 0
  for (const item of items || []) {
    const cat = String(item.category || '').toUpperCase()
    const count = Math.max(0, Number(item.count) || 0)
    if (childCats.includes(cat)) children += count
    else if (adultCats.includes(cat) || cat === 'GROUP' || cat === 'COLLECTIVE') adults += count
    else adults += count
  }
  return { adults, children }
}

function parseIsoLocal(dateTime: string | undefined): { date?: string; time?: string } {
  if (!dateTime) return {}
  // Official: ISO 8601 local with offset, e.g. 2020-12-05T14:00:00+02:00
  const m = dateTime.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  if (!m) return {}
  return { date: m[1], time: m[2] === '00:00' ? undefined : m[2] }
}

function guestFromTravelers(
  travelers: Array<{ firstName?: string; lastName?: string; email?: string; phoneNumber?: string }> | undefined,
): { name?: string; email?: string; phone?: string } {
  const t = travelers?.[0]
  if (!t) return {}
  const name = [t.firstName, t.lastName].filter(Boolean).join(' ').trim()
  return { name: name || undefined, email: t.email, phone: t.phoneNumber }
}

async function upsertAndProcess(
  admin: ReturnType<typeof createClient>,
  args: {
    provider: 'getyourguide' | 'bokun'
    eventKey: string
    topic: string
    externalBookingId?: string
    payload: Record<string, unknown>
  },
) {
  const { data: up, error: upErr } = await admin.rpc('service_upsert_shared_inbound_event', {
    p_provider: args.provider,
    p_event_key: args.eventKey,
    p_topic: args.topic,
    p_external_booking_id: args.externalBookingId || null,
    p_payload: args.payload,
  })
  if (upErr) throw upErr
  if (!up?.ok) return up
  if (up.already_processed) return { ok: true, idempotent: true, ...up }

  const { data: processed, error: procErr } = await admin.rpc('service_process_shared_inbound_event', {
    p_event_id: up.event_id,
    p_allow_admin_retry: false,
  })
  if (procErr) throw procErr
  return processed
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const tail = pathTail(url.pathname)
    const admin = serviceClient()

    // Health / config status (no secrets)
    if (req.method === 'GET' && (tail === '' || tail === 'status')) {
      return json({
        ok: true,
        providers: {
          getyourguide: {
            mode: 'supplier_api',
            auth: 'HTTP Basic Auth (official GYG Supplier API)',
            credentials_configured: gygCredsConfigured(),
            ingestion_env_enabled: gygIngestionEnvEnabled(),
            endpoints: [
              'GET /gyg/1/get-availabilities (official /1/ prefix)',
              'GET /gyg/get-availabilities',
              'POST /gyg/reserve',
              'POST /gyg/cancel-reservation',
              'POST /gyg/book',
              'POST /gyg/cancel-booking',
            ],
            // Availability is real (1.6A). Reserve/book still gated by ingestion flag.
            availability_live: true,
            live: false,
          },
          bokun: {
            mode: 'webhooks',
            auth: 'X-Bokun-HMAC (official Bókun webhook docs)',
            credentials_configured: bokunSecretConfigured(),
            ingestion_env_enabled: bokunIngestionEnvEnabled(),
            endpoint: 'POST /bokun/webhook',
            live: false,
          },
        },
      })
    }

    // ---------------- Bókun webhook ----------------
    if (tail === 'bokun/webhook' || tail === 'bokun') {
      if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
      if (!bokunSecretConfigured()) {
        return json(
          {
            ok: false,
            error: 'credentials_required',
            required: ['SHARED_BOOKINGS_BOKUN_WEBHOOK_SECRET'],
            optional: [
              'SHARED_BOOKINGS_BOKUN_ACCESS_KEY',
              'SHARED_BOOKINGS_BOKUN_SECRET_KEY',
              'SHARED_BOOKINGS_BOKUN_INGESTION_ENABLED',
            ],
          },
          503,
        )
      }
      if (!(await verifyBokunHmac(req))) return json({ error: 'invalid_signature' }, 401)

      const topic = (req.headers.get('x-bokun-topic') || '').toLowerCase()
      const bookingId =
        req.headers.get('x-bokun-booking-id') ||
        req.headers.get('X-Bokun-Booking-Id') ||
        ''
      const body = await req.json().catch(() => ({}))
      const externalId = String(body.bookingId || bookingId || '').trim()
      if (!externalId) return json({ error: 'missing_booking_id' }, 400)

      // Official webhook body is { timestamp, bookingId, experienceBookingId? }.
      // Detail enrichment requires GraphQL API credentials — quarantine if create/update lacks mapping fields.
      const action =
        topic.includes('cancel') ? 'cancel' : topic.includes('update') ? 'update' : 'create'
      const eventKey = `bokun:${topic || action}:${externalId}:${body.timestamp || body.experienceBookingId || 'na'}`

      if (!bokunIngestionEnvEnabled()) {
        await admin.rpc('service_upsert_shared_inbound_event', {
          p_provider: 'bokun',
          p_event_key: eventKey,
          p_topic: topic || action,
          p_external_booking_id: externalId,
          p_payload: {
            action,
            provider_raw: body,
            note: 'Authenticated webhook stored; env ingestion flag is off',
          },
        })
        return json({ ok: true, accepted: true, processed: false, reason: 'ingestion_env_disabled' })
      }

      const result = await upsertAndProcess(admin, {
        provider: 'bokun',
        eventKey,
        topic: topic || action,
        externalBookingId: externalId,
        payload: {
          action,
          external_booking_id: externalId,
          external_product_id: body.external_product_id || body.experienceId || null,
          external_option_id: body.experienceBookingId || null,
          departure_date: body.departure_date || null,
          departure_time: body.departure_time || null,
          guest_name: body.guest_name || null,
          adults: body.adults ?? null,
          children: body.children ?? null,
          provider_raw: body,
          enrichment: 'webhook_only_until_graphql_configured',
        },
      })

      // Always 200 quickly for Bókun after auth (official: non-2xx causes retries/deletion).
      return json({ ok: true, accepted: true, result })
    }

    // ---------------- GetYourGuide Supplier API ----------------
    if (tail.startsWith('gyg/')) {
      if (!gygCredsConfigured()) {
        return gygError(
          'INTERNAL_SYSTEM_FAILURE',
          'GetYourGuide Basic Auth credentials are not configured on this supplier endpoint.',
        )
      }
      if (!verifyGygBasic(req)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'WWW-Authenticate': 'Basic' },
        })
      }

      const actionPath = normalizeGygActionPath(tail)

      if (actionPath === 'get-availabilities') {
        // Official: GET /1/get-availabilities/?productId&fromDateTime&toDateTime
        // Availability does NOT require ingestion flag (read-only capacity).
        let productId = url.searchParams.get('productId')
        let fromDateTime = url.searchParams.get('fromDateTime')
        let toDateTime = url.searchParams.get('toDateTime')

        if (req.method === 'POST' && (!productId || !fromDateTime || !toDateTime)) {
          const body = await req.json().catch(() => ({}))
          const data = body?.data || body || {}
          productId = productId || data.productId || null
          fromDateTime = fromDateTime || data.fromDateTime || null
          toDateTime = toDateTime || data.toDateTime || null
        }

        const parsed = parseGygAvailabilityQuery({ productId, fromDateTime, toDateTime })
        if (!parsed.ok) {
          return gygError('VALIDATION_FAILURE', parsed.error)
        }

        const { data: rpcData, error: rpcErr } = await admin.rpc('service_list_gyg_availabilities', {
          p_product_id: parsed.query.productId,
          p_from: parsed.query.fromDate,
          p_to: parsed.query.toDate,
        })
        if (rpcErr) {
          console.error('service_list_gyg_availabilities', rpcErr)
          return gygError('INTERNAL_SYSTEM_FAILURE', 'Availability lookup failed')
        }
        if (rpcData && rpcData.ok === false) {
          return gygError('VALIDATION_FAILURE', rpcData.error || 'invalid availability request')
        }

        // Unknown mapping → empty array (do not emit INVALID_PRODUCT; that auto-deactivates on GYG).
        // No departures in range → empty array (official).
        // Sold-out active departures → vacancies: 0 (official; never NO_AVAILABILITY here).
        const rows = (Array.isArray(rpcData?.departures) ? rpcData.departures : []) as SharedDepartureAvailabilityRow[]
        const availabilities = buildGygAvailabilities(parsed.query.productId, rows, {
          defaultDepartureTime: rpcData?.default_departure_time ?? null,
        })

        return json({ data: { availabilities } })
      }

      if (actionPath === 'reserve') {
        if (!gygIngestionEnvEnabled()) {
          return gygError(
            'INTERNAL_SYSTEM_FAILURE',
            'Shared Bookings GYG ingestion is disabled until credentials, mappings and verification are confirmed.',
          )
        }
        const body = await req.json().catch(() => ({}))
        const data = body.data || body
        const reservationReference = `sb-gyg-res-${crypto.randomUUID()}`
        // Hold is recorded as inbound event only; seats are consumed on book (confirmed).
        await admin.rpc('service_upsert_shared_inbound_event', {
          p_provider: 'getyourguide',
          p_event_key: `gyg:reserve:${reservationReference}`,
          p_topic: 'reserve',
          p_external_booking_id: reservationReference,
          p_payload: { action: 'reserve', provider_raw: data },
        })
        return json({
          data: {
            reservationReference,
            reservationExpiration: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          },
        })
      }

      if (actionPath === 'cancel-reservation') {
        const body = await req.json().catch(() => ({}))
        const data = body.data || body
        const reservationReference = String(data.reservationReference || '').trim()
        if (!reservationReference) {
          return gygError('VALIDATION_FAILURE', 'reservationReference is required')
        }
        await admin.rpc('service_upsert_shared_inbound_event', {
          p_provider: 'getyourguide',
          p_event_key: `gyg:cancel-reservation:${reservationReference}`,
          p_topic: 'cancel-reservation',
          p_external_booking_id: reservationReference,
          p_payload: { action: 'cancel-reservation', provider_raw: data },
        })
        return json({ data: { reservationReference } })
      }

      if (actionPath === 'book') {
        if (!gygIngestionEnvEnabled()) {
          return gygError(
            'INTERNAL_SYSTEM_FAILURE',
            'Shared Bookings GYG ingestion is disabled until credentials, mappings and verification are confirmed.',
          )
        }
        const body = await req.json().catch(() => ({}))
        const data = body.data || body
        const productId = String(data.productId || '').trim()
        const gygBookingReference = String(data.gygBookingReference || data.bookingReference || '').trim()
        const reservationReference = String(data.reservationReference || '').trim()
        const externalId = gygBookingReference || reservationReference
        if (!productId || !externalId) {
          return gygError('VALIDATION_FAILURE', 'productId and gygBookingReference are required')
        }

        const { data: maps } = await admin.from('shared_product_mappings').select('*').eq('provider', 'getyourguide').eq('external_product_id', productId).eq('is_active', true).limit(1)
        const mapping = maps?.[0]
        if (!mapping) {
          await upsertAndProcess(admin, {
            provider: 'getyourguide',
            eventKey: `gyg:book:${externalId}`,
            topic: 'book',
            externalBookingId: externalId,
            payload: {
              action: 'create',
              external_product_id: productId,
              external_booking_id: externalId,
              provider_raw: data,
            },
          })
          return gygError('VALIDATION_FAILURE', `Unknown productId ${productId} — configure Shared Bookings product mapping`)
        }

        const seats = countGygCategories(
          data.bookingItems,
          mapping.adult_categories || ['ADULT', 'SENIOR', 'YOUTH', 'STUDENT'],
          mapping.child_categories || ['CHILD', 'INFANT'],
        )
        const when = parseIsoLocal(data.dateTime)
        const guest = guestFromTravelers(data.travelers)

        const processed = await upsertAndProcess(admin, {
          provider: 'getyourguide',
          eventKey: `gyg:book:${externalId}`,
          topic: 'book',
          externalBookingId: externalId,
          payload: {
            action: 'create',
            external_product_id: productId,
            external_booking_id: externalId,
            departure_date: when.date,
            departure_time: when.time || mapping.default_departure_time || null,
            guest_name: guest.name || 'GYG Guest',
            adults: seats.adults,
            children: seats.children,
            contact_email: guest.email || null,
            contact_phone: guest.phone || null,
            notes: data.comment || null,
            provider_raw: data,
          },
        })

        if (!processed?.ok) {
          if (processed?.error === 'capacity_exceeded') {
            return gygError(
              'NO_AVAILABILITY',
              `This activity is sold out; requested ${seats.adults + seats.children}.`,
            )
          }
          if (processed?.error === 'unmatched_departure' || processed?.error === 'unknown_product') {
            return gygError('VALIDATION_FAILURE', processed.error_message || processed.error)
          }
          if (processed?.error === 'ingestion_disabled') {
            return gygError('INTERNAL_SYSTEM_FAILURE', 'Ingestion disabled in Shared Bookings connector settings')
          }
          return gygError('INTERNAL_SYSTEM_FAILURE', processed?.error || 'booking_failed')
        }

        return json({
          data: {
            bookingReference: externalId,
            tickets: [
              ...Array.from({ length: seats.adults }, () => ({ category: 'ADULT' })),
              ...Array.from({ length: seats.children }, () => ({ category: 'CHILD' })),
            ],
          },
        })
      }

      if (actionPath === 'cancel-booking') {
        const body = await req.json().catch(() => ({}))
        const data = body.data || body
        const bookingReference = String(
          data.bookingReference || data.gygBookingReference || '',
        ).trim()
        if (!bookingReference) {
          return gygError('VALIDATION_FAILURE', 'bookingReference is required')
        }

        if (!gygIngestionEnvEnabled()) {
          return gygError(
            'INTERNAL_SYSTEM_FAILURE',
            'Shared Bookings GYG ingestion is disabled until credentials, mappings and verification are confirmed.',
          )
        }

        const processed = await upsertAndProcess(admin, {
          provider: 'getyourguide',
          eventKey: `gyg:cancel-booking:${bookingReference}:${Date.now()}`,
          topic: 'cancel-booking',
          externalBookingId: bookingReference,
          payload: { action: 'cancel', external_booking_id: bookingReference, provider_raw: data },
        })

        if (!processed?.ok && processed?.error === 'missing_external_ref') {
          return gygError('INVALID_BOOKING', 'The booking does not exist or is not in a valid state.')
        }
        return json({ data: { bookingReference } })
      }

      return gygError('VALIDATION_FAILURE', `Unsupported GYG path: ${actionPath}`)
    }

    return json({ error: 'not_found', path: tail }, 404)
  } catch (err) {
    console.error('shared-bookings-external error', err)
    return json({ error: err instanceof Error ? err.message : 'server_error' }, 500)
  }
})
