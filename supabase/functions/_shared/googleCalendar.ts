/**
 * Google Calendar helpers for edge functions.
 * Departure resolution mirrors src/lib/googleCalendarDeparture.ts (no invented times).
 */

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export type DepartureOk = {
  ok: true
  date: string
  time: string
  source: 'booking.tour_time' | 'tours.departure_time'
  startRfc3339: string
  startUtcIso: string
  endRfc3339: string
}

export type DepartureFail = {
  ok: false
  reason: 'missing_tour_date' | 'needs_departure_time' | 'invalid_time'
}

export function normalizeHhMm(raw: string | null | undefined): string | null {
  const t = String(raw || '').trim()
  const m = t.match(TIME_RE)
  if (!m) return null
  return `${m[1].padStart(2, '0')}:${m[2]}`
}

export function europeHelsinkiOffset(isoDate: string): string {
  if (!DATE_RE.test(isoDate)) return '+02:00'
  const utc = new Date(`${isoDate}T12:00:00.000Z`)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Helsinki',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(utc)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '14')
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '00')
  const offsetMinutes = hour * 60 + minute - 12 * 60
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMinutes)
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}

export function resolveBookingDeparture(input: {
  tourDate: string | null | undefined
  bookingTourTime?: string | null
  tourDepartureTime?: string | null
  /** Hours; default 3 when duration unknown */
  durationHours?: number
}): DepartureOk | DepartureFail {
  const date = String(input.tourDate || '').trim()
  if (!DATE_RE.test(date)) return { ok: false, reason: 'missing_tour_date' }

  const fromBooking = normalizeHhMm(input.bookingTourTime)
  const fromTour = normalizeHhMm(input.tourDepartureTime)
  const time = fromBooking || fromTour
  if (!time) return { ok: false, reason: 'needs_departure_time' }

  const offset = europeHelsinkiOffset(date)
  const startRfc3339 = `${date}T${time}:00${offset}`
  const start = new Date(startRfc3339)
  if (Number.isNaN(start.getTime())) return { ok: false, reason: 'invalid_time' }

  const hours = Math.min(Math.max(Number(input.durationHours) || 3, 1), 12)
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000)
  // Format end in Helsinki wall clock via offset for that calendar day
  const endDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(end)
  const endTimeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Helsinki',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(end)
  const eh = endTimeParts.find((p) => p.type === 'hour')?.value ?? '00'
  const em = endTimeParts.find((p) => p.type === 'minute')?.value ?? '00'
  const endRfc3339 = `${endDate}T${eh}:${em}:00${europeHelsinkiOffset(endDate)}`

  return {
    ok: true,
    date,
    time,
    source: fromBooking ? 'booking.tour_time' : 'tours.departure_time',
    startRfc3339,
    startUtcIso: start.toISOString(),
    endRfc3339,
  }
}

export function adminBookingUrl(bookingId: number): string {
  const base = (Deno.env.get('ADMIN_URL') || Deno.env.get('SITE_URL') || 'https://admin.royalnordic.fi')
    .replace(/\/$/, '')
    .replace('://royalnordic.fi', '://admin.royalnordic.fi')
  const host = base.includes('admin.') ? base : 'https://admin.royalnordic.fi'
  return `${host}/bookings/${bookingId}`
}

export function buildCalendarEventBody(input: {
  bookingId: number
  bookingRef: string | null
  tourName: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  adults: number
  children: number
  pickupLocation: string | null
  tourTime: string
  status: string
  internalNotes: string | null
  specialRequests: string | null
}): { summary: string; description: string } {
  const ref = input.bookingRef || `RN-${input.bookingId}`
  const pax = Number(input.adults || 0) + Number(input.children || 0)
  const summary = `${input.tourName} · ${pax} pax · ${ref}`
  const lines = [
    `Booking: ${ref}`,
    `Tour: ${input.tourName}`,
    `Status: ${input.status}`,
    `Customer: ${input.customerName}`,
    `Email: ${input.customerEmail}`,
    `Phone: ${input.customerPhone || '—'}`,
    `Guests: ${input.adults} adult(s), ${input.children} child(ren)`,
    `Departure time: ${input.tourTime} (Europe/Helsinki)`,
    `Pickup / meeting: ${input.pickupLocation || '—'}`,
    `Admin: ${adminBookingUrl(input.bookingId)}`,
  ]
  if (input.specialRequests?.trim()) lines.push(`Guest notes: ${input.specialRequests.trim()}`)
  if (input.internalNotes?.trim()) lines.push(`Ops notes: ${input.internalNotes.trim()}`)
  return { summary, description: lines.join('\n') }
}

/** AES-GCM encrypt UTF-8 text → base64(iv+ciphertext). Key: 32-byte base64 env. */
export async function encryptSecret(plain: string, keyB64: string): Promise<string> {
  const keyBytes = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0))
  if (keyBytes.length !== 32) throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY must be 32-byte base64')
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt'])
  const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain))
  const out = new Uint8Array(iv.length + enc.byteLength)
  out.set(iv, 0)
  out.set(new Uint8Array(enc), iv.length)
  return btoa(String.fromCharCode(...out))
}

export async function decryptSecret(blobB64: string, keyB64: string): Promise<string> {
  const keyBytes = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0))
  if (keyBytes.length !== 32) throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY must be 32-byte base64')
  const raw = Uint8Array.from(atob(blobB64), (c) => c.charCodeAt(0))
  const iv = raw.slice(0, 12)
  const data = raw.slice(12)
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt'])
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return new TextDecoder().decode(dec)
}

export function googleOAuthConfigured(): boolean {
  return Boolean(Deno.env.get('GOOGLE_CLIENT_ID') && Deno.env.get('GOOGLE_CLIENT_SECRET') && Deno.env.get('GOOGLE_TOKEN_ENCRYPTION_KEY'))
}

export function googleRedirectUri(): string {
  return (
    Deno.env.get('GOOGLE_OAUTH_REDIRECT_URI') ||
    'https://admin.royalnordic.fi/integrations?google=callback'
  )
}

export async function exchangeGoogleCode(code: string): Promise<{
  access_token: string
  refresh_token?: string
  expires_in: number
  scope?: string
}> {
  const body = new URLSearchParams({
    code,
    client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
    client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
    redirect_uri: googleRedirectUri(),
    grant_type: 'authorization_code',
  })
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`token_exchange_failed: ${JSON.stringify(json)}`)
  return json
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<{
  access_token: string
  expires_in: number
}> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
    client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
    grant_type: 'refresh_token',
  })
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`token_refresh_failed: ${JSON.stringify(json)}`)
  return json
}

export async function googleFetch(
  accessToken: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
}

export function calendarSyncEnabledFromEnv(): boolean {
  return String(Deno.env.get('GOOGLE_CALENDAR_SYNC_ENABLED') || '').toLowerCase() === 'true'
}

export function calendarRemindersEnabledFromEnv(): boolean {
  return String(Deno.env.get('GOOGLE_CALENDAR_REMINDERS_ENABLED') || '').toLowerCase() === 'true'
}
