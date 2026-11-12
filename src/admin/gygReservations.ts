/**
 * Pure GetYourGuide Supplier API reservation helpers (1.6B).
 * Official:
 * - POST /1/reserve/ → { data: { reservationReference, reservationExpiration } }
 * - POST /1/cancel-reservation/ → { data: {} }
 * - POST /1/book/ consumes reservationReference without double-counting seats
 * Hold TTL: desired 60 minutes (minimum 15). Expiration is time-checked — no worker.
 */

import { remainingSeats } from './gygAvailability'

export const GYG_HOLD_MINUTES_DEFAULT = 60
export const GYG_HOLD_MINUTES_MINIMUM = 15

export type GygBookingItem = { category?: string; count?: number }

export type GygReserveRequest = {
  productId: string
  dateTime: string
  gygBookingReference: string
  adults: number
  children: number
  total: number
}

export type GygReserveSuccess = {
  reservationReference: string
  reservationExpiration: string
}

/** True when a pending hold still occupies capacity. */
export function isHoldActive(
  status: string | null | undefined,
  holdExpiresAt: string | Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (String(status || '').toLowerCase() !== 'pending') return false
  if (!holdExpiresAt) return false
  const expires = holdExpiresAt instanceof Date ? holdExpiresAt : new Date(holdExpiresAt)
  if (Number.isNaN(expires.getTime())) return false
  return expires.getTime() > now.getTime()
}

/** Count only active unexpired holds toward capacity. */
export function activeHeldPassengers(
  holds: Array<{ status?: string | null; hold_expires_at?: string | Date | null; passenger_count?: number }>,
  now: Date = new Date(),
): number {
  return holds.reduce((sum, h) => {
    if (!isHoldActive(h.status, h.hold_expires_at ?? null, now)) return sum
    return sum + Math.max(0, Number(h.passenger_count) || 0)
  }, 0)
}

export function canReserveSeats(
  capacity: number,
  confirmedPassengers: number,
  heldPassengers: number,
  requested: number,
): boolean {
  return remainingSeats(capacity, confirmedPassengers, heldPassengers) >= Math.max(0, requested)
}

/**
 * Capacity check when confirming a hold: exclude the hold's own seats
 * so converting pending → confirmed does not double-count.
 */
export function canConsumeHold(
  capacity: number,
  confirmedPassengers: number,
  activeHeldPassengersExcludingThis: number,
  passengersOnHold: number,
): boolean {
  return (
    remainingSeats(capacity, confirmedPassengers, activeHeldPassengersExcludingThis) >=
    Math.max(0, passengersOnHold)
  )
}

export function holdMinutesOrDefault(minutes?: number | null): number {
  const n = Number(minutes)
  if (!Number.isFinite(n)) return GYG_HOLD_MINUTES_DEFAULT
  return Math.max(GYG_HOLD_MINUTES_MINIMUM, Math.floor(n))
}

/** Official reservationExpiration: ISO-8601 UTC with offset (+00:00). */
export function formatGygReservationExpiration(expiresAt: Date): string {
  return expiresAt.toISOString().replace(/\.(\d{3})Z$/, '+00:00').replace(/Z$/, '+00:00')
}

export function reservationExpirationFromNow(
  holdMinutes: number = GYG_HOLD_MINUTES_DEFAULT,
  now: Date = new Date(),
): string {
  const mins = holdMinutesOrDefault(holdMinutes)
  return formatGygReservationExpiration(new Date(now.getTime() + mins * 60_000))
}

export function parseGygReserveRequest(input: {
  productId?: string | null
  dateTime?: string | null
  gygBookingReference?: string | null
  bookingItems?: GygBookingItem[] | null
  adultCategories?: readonly string[]
  childCategories?: readonly string[]
}): { ok: true; request: GygReserveRequest } | { ok: false; errorCode: string; errorMessage: string } {
  const productId = String(input.productId || '').trim()
  const dateTime = String(input.dateTime || '').trim()
  const gygBookingReference = String(input.gygBookingReference || '').trim()

  if (!productId) {
    return { ok: false, errorCode: 'VALIDATION_FAILURE', errorMessage: 'productId is required' }
  }
  if (!dateTime || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateTime)) {
    return {
      ok: false,
      errorCode: 'VALIDATION_FAILURE',
      errorMessage: 'dateTime is required (ISO 8601 local with offset)',
    }
  }
  if (!gygBookingReference) {
    return { ok: false, errorCode: 'VALIDATION_FAILURE', errorMessage: 'gygBookingReference is required' }
  }

  const adultCats = (input.adultCategories || ['ADULT', 'SENIOR', 'YOUTH', 'STUDENT']).map((c) =>
    c.toUpperCase(),
  )
  const childCats = (input.childCategories || ['CHILD', 'INFANT']).map((c) => c.toUpperCase())
  let adults = 0
  let children = 0
  for (const item of input.bookingItems || []) {
    const cat = String(item.category || '').toUpperCase()
    const count = Math.max(0, Number(item.count) || 0)
    if (childCats.includes(cat)) children += count
    else if (adultCats.includes(cat) || cat === 'GROUP' || cat === 'COLLECTIVE' || !cat) adults += count
    else adults += count
  }

  if (adults + children < 1) {
    return {
      ok: false,
      errorCode: 'INVALID_PARTICIPANTS_CONFIGURATION',
      errorMessage: 'At least one participant is required',
    }
  }

  return {
    ok: true,
    request: { productId, dateTime, gygBookingReference, adults, children, total: adults + children },
  }
}

export function mapGygReserveRpcError(error?: string | null): {
  errorCode: string
  errorMessage: string
} {
  switch (error) {
    case 'NO_AVAILABILITY':
      return { errorCode: 'NO_AVAILABILITY', errorMessage: 'This activity is sold out for the requested seats.' }
    case 'INVALID_PRODUCT':
      return { errorCode: 'INVALID_PRODUCT', errorMessage: 'This activity should be deactivated; not sellable.' }
    case 'INVALID_PARTICIPANTS_CONFIGURATION':
      return { errorCode: 'INVALID_PARTICIPANTS_CONFIGURATION', errorMessage: 'Invalid participant configuration.' }
    case 'VALIDATION_FAILURE':
      return { errorCode: 'VALIDATION_FAILURE', errorMessage: 'Invalid reservation request.' }
    case 'forbidden':
      return { errorCode: 'AUTHORIZATION_FAILURE', errorMessage: 'The provided authentication credentials are not valid.' }
    default:
      return { errorCode: 'INTERNAL_SYSTEM_FAILURE', errorMessage: error || 'Reservation failed' }
  }
}

export function mapGygCancelRpcError(error?: string | null): {
  errorCode: string
  errorMessage: string
} {
  switch (error) {
    case 'INVALID_RESERVATION':
      return { errorCode: 'INVALID_RESERVATION', errorMessage: 'The reservation does not exist or is not in a valid state.' }
    case 'VALIDATION_FAILURE':
      return { errorCode: 'VALIDATION_FAILURE', errorMessage: 'reservationReference is required' }
    default:
      return { errorCode: 'INTERNAL_SYSTEM_FAILURE', errorMessage: error || 'Cancel reservation failed' }
  }
}

export function mapGygConsumeRpcError(error?: string | null): {
  errorCode: string
  errorMessage: string
} {
  switch (error) {
    case 'INVALID_RESERVATION':
      return { errorCode: 'INVALID_RESERVATION', errorMessage: 'The reservation does not exist or is not in a valid state.' }
    case 'NO_AVAILABILITY':
      return { errorCode: 'NO_AVAILABILITY', errorMessage: 'This activity is sold out; booking could not be confirmed.' }
    case 'INVALID_PARTICIPANTS_CONFIGURATION':
      return { errorCode: 'INVALID_PARTICIPANTS_CONFIGURATION', errorMessage: 'Invalid participant configuration.' }
    case 'VALIDATION_FAILURE':
      return { errorCode: 'VALIDATION_FAILURE', errorMessage: 'Invalid booking request.' }
    default:
      return { errorCode: 'INTERNAL_SYSTEM_FAILURE', errorMessage: error || 'Booking failed' }
  }
}

/** Official cancel-reservation success body. */
export function gygCancelReservationResponse(): { data: Record<string, never> } {
  return { data: {} }
}

export function gygReserveSuccessResponse(
  reservationReference: string,
  reservationExpiration: string | Date,
): { data: GygReserveSuccess } {
  const expiration =
    reservationExpiration instanceof Date
      ? formatGygReservationExpiration(reservationExpiration)
      : String(reservationExpiration).endsWith('Z')
        ? String(reservationExpiration).replace(/Z$/, '+00:00')
        : String(reservationExpiration)
  return {
    data: {
      reservationReference,
      reservationExpiration: expiration,
    },
  }
}
