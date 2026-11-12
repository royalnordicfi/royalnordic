/**
 * Pure GetYourGuide outbound availability notification helpers (1.6D).
 * Official:
 * - POST https://supplier-api.getyourguide.com/1/notify-availability-update
 * - Basic Auth (separate outbound credentials from supplier-facing auth)
 * - Body: { data: { productId, availabilities: [{ dateTime, vacancies }] } }
 * - Success: HTTP 202
 * - Rate limit: 1000 requests / 10 minutes → HTTP 429
 * Notify when vacancies change meaningfully; send current vacancy values (not a re-fetch ping).
 */

import { formatGygLocalDateTime } from './gygAvailability.ts'

export const GYG_NOTIFY_URL_DEFAULT =
  'https://supplier-api.getyourguide.com/1/notify-availability-update'

export const GYG_NOTIFY_RATE_LIMIT_PER_10_MIN = 1000

export type GygNotifyAvailabilityItem = {
  dateTime: string
  vacancies: number
}

export type GygNotifyAvailabilityRequest = {
  data: {
    productId: string
    availabilities: GygNotifyAvailabilityItem[]
  }
}

/** Official notify rules we can verify from GYG docs. */
export function shouldNotifyGygAvailability(input: {
  previousVacancies: number | null | undefined
  nextVacancies: number
  departureDate: string
  sourceChannel?: string | null
  today?: string
}): boolean {
  const prev =
    input.previousVacancies == null ? null : Math.max(0, Number(input.previousVacancies) || 0)
  const next = Math.max(0, Number(input.nextVacancies) || 0)

  if (prev != null && prev === next) return false

  // Official: not necessary for decreased vacancies due to GetYourGuide bookings.
  if (
    String(input.sourceChannel || '').toLowerCase() === 'getyourguide' &&
    prev != null &&
    next < prev
  ) {
    return false
  }

  if (next === 0) return true
  if ((prev == null || prev === 0) && next > 0) {
    // First observation with availability: callers seed snapshot instead of dumping.
    // Became-available (0 → >0) still notifies when previous is known.
    if (prev === 0) return true
  }

  const today = input.today || new Date().toISOString().slice(0, 10)
  const within60 =
    input.departureDate >= today &&
    input.departureDate <= addDaysIso(today, 60)

  if (within60 && next < 7 && prev != null && prev !== next) return true

  return false
}

export function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function buildGygNotifyAvailabilityRequest(
  productId: string,
  departureDate: string,
  departureTime: string | null | undefined,
  vacancies: number,
): GygNotifyAvailabilityRequest {
  return {
    data: {
      productId: String(productId || '').trim(),
      availabilities: [
        {
          dateTime: formatGygLocalDateTime(departureDate, departureTime),
          vacancies: Math.max(0, Number(vacancies) || 0),
        },
      ],
    },
  }
}

/** Coalesce key for one open outbox row per product timeslot. */
export function gygNotifyCoalesceKey(
  productId: string,
  departureDate: string,
  departureTime?: string | null,
): string {
  const time = String(departureTime || '00:00').trim().slice(0, 5) || '00:00'
  return `${String(productId).trim()}|${departureDate}|${time}`
}

/** Bounded exponential backoff minutes: 1, 2, 4, … capped at 60. */
export function gygNotifyBackoffMinutes(attemptCount: number): number {
  const n = Math.max(1, Math.floor(Number(attemptCount) || 1))
  return Math.min(60, 2 ** Math.max(n - 1, 0))
}

export function isGygNotifyRetryableStatus(httpStatus: number): boolean {
  if (httpStatus === 429) return true
  if (httpStatus >= 500) return true
  return false
}

export function classifyGygNotifyResponse(input: {
  httpStatus: number
  body?: { errorCode?: string; data?: { message?: string } } | null
}): { ok: boolean; retryable: boolean; error?: string } {
  if (input.httpStatus === 202) return { ok: true, retryable: false }
  const code = String(input.body?.errorCode || '')
  if (input.httpStatus === 401 || code === 'AUTHORIZATION_FAILURE') {
    return { ok: false, retryable: false, error: 'AUTHORIZATION_FAILURE' }
  }
  if (code === 'INVALID_PRODUCT') {
    return { ok: false, retryable: false, error: 'INVALID_PRODUCT' }
  }
  if (input.httpStatus === 429 || code === 'RATE_LIMIT_EXCEEDED') {
    return { ok: false, retryable: true, error: 'RATE_LIMIT_EXCEEDED' }
  }
  if (isGygNotifyRetryableStatus(input.httpStatus)) {
    return { ok: false, retryable: true, error: `HTTP_${input.httpStatus}` }
  }
  return {
    ok: false,
    retryable: false,
    error: code || `HTTP_${input.httpStatus}`,
  }
}

export function gygNotifyEnabledFromEnv(value?: string | null): boolean {
  return String(value || '').toLowerCase() === 'true'
}

/** Secrets required for outbound notify (kept separate from supplier-facing Basic Auth). */
export function gygNotifyRequiredSecrets(): string[] {
  return [
    'SHARED_BOOKINGS_GYG_NOTIFY_USER',
    'SHARED_BOOKINGS_GYG_NOTIFY_PASSWORD',
    'SHARED_BOOKINGS_GYG_NOTIFY_ENABLED',
  ]
}
