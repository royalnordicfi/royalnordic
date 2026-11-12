/**
 * Pure GetYourGuide Supplier API book + cancel-booking helpers (1.6C).
 * Official:
 * - POST /1/book/ → { data: { bookingReference, tickets[] } } (idempotent retries)
 * - POST /1/cancel-booking/ → { data: {} }
 */

export type GygTicket = {
  category: string
  ticketCode: string
  ticketCodeType: 'TEXT'
}

export type GygBookSuccess = {
  bookingReference: string
  tickets: GygTicket[]
}

export type GygBookRequest = {
  productId: string
  dateTime: string
  gygBookingReference: string
  reservationReference: string | null
  adults: number
  children: number
  guestName: string
  contactEmail: string | null
  contactPhone: string | null
  notes: string | null
}

/** Stable cancel-booking idempotency key — never include timestamps. */
export function gygCancelBookingEventKey(bookingReference: string): string {
  return `gyg:cancel-booking:${String(bookingReference || '').trim().toLowerCase()}`
}

export function gygBookEventKey(gygBookingReference: string): string {
  return `gyg:book:${String(gygBookingReference || '').trim().toLowerCase()}`
}

export function parseGygBookRequest(input: {
  productId?: string | null
  dateTime?: string | null
  gygBookingReference?: string | null
  bookingReference?: string | null
  reservationReference?: string | null
  bookingItems?: Array<{ category?: string; count?: number }> | null
  travelers?: Array<{
    firstName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
  }> | null
  comment?: string | null
  adultCategories?: readonly string[]
  childCategories?: readonly string[]
}): { ok: true; request: GygBookRequest } | { ok: false; errorCode: string; errorMessage: string } {
  const productId = String(input.productId || '').trim()
  const dateTime = String(input.dateTime || '').trim()
  const gygBookingReference = String(input.gygBookingReference || input.bookingReference || '').trim()
  const reservationReference = String(input.reservationReference || '').trim() || null

  if (!productId) {
    return { ok: false, errorCode: 'VALIDATION_FAILURE', errorMessage: 'productId is required' }
  }
  if (!gygBookingReference) {
    return { ok: false, errorCode: 'VALIDATION_FAILURE', errorMessage: 'gygBookingReference is required' }
  }
  if (!dateTime || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateTime)) {
    return {
      ok: false,
      errorCode: 'VALIDATION_FAILURE',
      errorMessage: 'dateTime is required (ISO 8601 local with offset)',
    }
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
    else adults += count
  }
  if (adults + children < 1) {
    return {
      ok: false,
      errorCode: 'INVALID_PARTICIPANTS_CONFIGURATION',
      errorMessage: 'At least one participant is required',
    }
  }

  const traveler = input.travelers?.[0]
  const guestName = [traveler?.firstName, traveler?.lastName].filter(Boolean).join(' ').trim() || 'GYG Guest'

  return {
    ok: true,
    request: {
      productId,
      dateTime,
      gygBookingReference,
      reservationReference,
      adults,
      children,
      guestName,
      contactEmail: traveler?.email?.trim() || null,
      contactPhone: traveler?.phoneNumber?.trim() || null,
      notes: String(input.comment || '').trim() || null,
    },
  }
}

export function buildGygTickets(
  bookingReference: string,
  adults: number,
  children: number,
): GygTicket[] {
  const ref = String(bookingReference || 'bk').trim() || 'bk'
  const tickets: GygTicket[] = []
  let n = 1
  for (let i = 0; i < Math.max(0, adults); i++) {
    tickets.push({
      category: 'ADULT',
      ticketCode: `${ref}-A${String(n).padStart(2, '0')}`,
      ticketCodeType: 'TEXT',
    })
    n += 1
  }
  for (let i = 0; i < Math.max(0, children); i++) {
    tickets.push({
      category: 'CHILD',
      ticketCode: `${ref}-C${String(n).padStart(2, '0')}`,
      ticketCodeType: 'TEXT',
    })
    n += 1
  }
  return tickets
}

export function gygBookSuccessResponse(
  bookingReference: string,
  adults: number,
  children: number,
): { data: GygBookSuccess } {
  return {
    data: {
      bookingReference,
      tickets: buildGygTickets(bookingReference, adults, children),
    },
  }
}

/** Official cancel-booking success body. */
export function gygCancelBookingResponse(): { data: Record<string, never> } {
  return { data: {} }
}

export function parseGygCancelBookingRequest(input: {
  bookingReference?: string | null
  gygBookingReference?: string | null
  productId?: string | null
}): {
  ok: true
  bookingReference: string | null
  gygBookingReference: string | null
} | { ok: false; errorCode: string; errorMessage: string } {
  const bookingReference = String(input.bookingReference || '').trim() || null
  const gygBookingReference = String(input.gygBookingReference || '').trim() || null
  if (!bookingReference && !gygBookingReference) {
    return {
      ok: false,
      errorCode: 'VALIDATION_FAILURE',
      errorMessage: 'bookingReference or gygBookingReference is required',
    }
  }
  return { ok: true, bookingReference, gygBookingReference }
}

export function mapGygConfirmRpcError(error?: string | null): {
  errorCode: string
  errorMessage: string
} {
  switch (error) {
    case 'INVALID_RESERVATION':
      return {
        errorCode: 'INVALID_RESERVATION',
        errorMessage: 'The reservation does not exist or is not in a valid state.',
      }
    case 'NO_AVAILABILITY':
      return {
        errorCode: 'NO_AVAILABILITY',
        errorMessage: 'This activity is sold out; booking could not be confirmed.',
      }
    case 'INVALID_PARTICIPANTS_CONFIGURATION':
      return {
        errorCode: 'INVALID_PARTICIPANTS_CONFIGURATION',
        errorMessage: 'Invalid participant configuration.',
      }
    case 'VALIDATION_FAILURE':
      return { errorCode: 'VALIDATION_FAILURE', errorMessage: 'Invalid booking request.' }
    case 'forbidden':
      return {
        errorCode: 'AUTHORIZATION_FAILURE',
        errorMessage: 'The provided authentication credentials are not valid.',
      }
    default:
      return { errorCode: 'INTERNAL_SYSTEM_FAILURE', errorMessage: error || 'Booking failed' }
  }
}

export function mapGygCancelBookingRpcError(error?: string | null): {
  errorCode: string
  errorMessage: string
} {
  switch (error) {
    case 'INVALID_BOOKING':
      return {
        errorCode: 'INVALID_BOOKING',
        errorMessage: 'The booking does not exist or is not in a valid state.',
      }
    case 'BOOKING_ALREADY_CANCELLED':
    case 'BOOKING_ALREADY_CANCELED':
      // Official docs list both spellings; we prefer success idempotency over reject.
      return {
        errorCode: 'BOOKING_ALREADY_CANCELLED',
        errorMessage: 'The booking has already been canceled.',
      }
    case 'VALIDATION_FAILURE':
      return {
        errorCode: 'VALIDATION_FAILURE',
        errorMessage: 'bookingReference or gygBookingReference is required',
      }
    default:
      return { errorCode: 'INTERNAL_SYSTEM_FAILURE', errorMessage: error || 'Cancel booking failed' }
  }
}

/**
 * Capacity after a successful cancel: confirmed seats drop once; holds unchanged.
 */
export function capacityAfterCancel(
  capacity: number,
  confirmedBefore: number,
  held: number,
  cancelledPassengers: number,
): number {
  const confirmed = Math.max(0, confirmedBefore - Math.max(0, cancelledPassengers))
  return Math.max(0, capacity - confirmed - Math.max(0, held))
}
