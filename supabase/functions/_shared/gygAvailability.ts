/**
 * Pure GetYourGuide Supplier API availability helpers.
 * Schema aligned with official docs:
 * - GET /1/get-availabilities/?productId&fromDateTime&toDateTime
 * - Response: { data: { availabilities: [{ productId, dateTime, vacancies, cutoffSeconds? }] } }
 * - dateTime: ISO 8601 local time with UTC offset (Europe/Helsinki for Royal Nordic)
 * Time-point products: one row per departure start time.
 */

export type GygAvailabilityQuery = {
  productId: string
  fromDate: string
  toDate: string
}

export type GygAvailabilitySlot = {
  productId: string
  dateTime: string
  vacancies: number
  cutoffSeconds?: number
}

export type SharedDepartureAvailabilityRow = {
  departure_date: string
  departure_time: string | null
  capacity: number
  confirmed_passengers: number
  /** Pending holds (1.6B). Counted when present; currently usually 0. */
  held_passengers?: number
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Remaining sellable seats: capacity − confirmed − valid holds. */
export function remainingSeats(
  capacity: number,
  confirmedPassengers: number,
  heldPassengers = 0,
): number {
  const cap = Math.max(0, Number(capacity) || 0)
  const confirmed = Math.max(0, Number(confirmedPassengers) || 0)
  const held = Math.max(0, Number(heldPassengers) || 0)
  return Math.max(0, cap - confirmed - held)
}

/** Extract YYYY-MM-DD from GYG ISO local datetime (keeps calendar date as sent). */
export function gygDateTimeToTourDate(dateTime: string): string | null {
  const m = String(dateTime || '').match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : null
}

export function parseGygAvailabilityQuery(input: {
  productId?: string | null
  fromDateTime?: string | null
  toDateTime?: string | null
}): { ok: true; query: GygAvailabilityQuery } | { ok: false; error: string } {
  const productId = String(input.productId || '').trim()
  if (!productId) return { ok: false, error: 'productId is required' }

  const fromDate = gygDateTimeToTourDate(String(input.fromDateTime || ''))
  const toDate = gygDateTimeToTourDate(String(input.toDateTime || ''))
  if (!fromDate || !DATE_RE.test(fromDate)) {
    return { ok: false, error: 'fromDateTime is required (ISO 8601 local with offset)' }
  }
  if (!toDate || !DATE_RE.test(toDate)) {
    return { ok: false, error: 'toDateTime is required (ISO 8601 local with offset)' }
  }
  if (fromDate > toDate) {
    return { ok: false, error: 'fromDateTime must be on or before toDateTime' }
  }

  return { ok: true, query: { productId, fromDate, toDate } }
}

/**
 * Europe/Helsinki UTC offset for a calendar date as ±HH:MM.
 * Uses noon UTC probe so DST is correct for the business day.
 */
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
  const localMinutes = hour * 60 + minute
  const utcMinutes = 12 * 60
  const offsetMinutes = localMinutes - utcMinutes
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMinutes)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `${sign}${hh}:${mm}`
}

/** Official time-point datetime: local wall time + Helsinki offset. */
export function formatGygLocalDateTime(
  departureDate: string,
  departureTime: string | null | undefined,
): string {
  const time = String(departureTime || '').trim()
  const hhmm = /^\d{1,2}:\d{2}/.test(time)
    ? time.slice(0, 5).padStart(5, '0')
    : '00:00'
  const [h, m] = hhmm.split(':')
  const normalized = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
  return `${departureDate}T${normalized}:00${europeHelsinkiOffset(departureDate)}`
}

/**
 * Build GYG availabilities from Shared Bookings departure rows.
 * Includes sold-out slots (vacancies: 0). Omits nothing that is active in range —
 * caller should only pass active departures.
 */
export function buildGygAvailabilities(
  productId: string,
  rows: SharedDepartureAvailabilityRow[],
  options?: { cutoffSeconds?: number },
): GygAvailabilitySlot[] {
  const cutoffSeconds = options?.cutoffSeconds
  const slots: GygAvailabilitySlot[] = rows.map((row) => {
    const vacancies = remainingSeats(
      row.capacity,
      row.confirmed_passengers,
      row.held_passengers ?? 0,
    )
    const slot: GygAvailabilitySlot = {
      productId,
      dateTime: formatGygLocalDateTime(row.departure_date, row.departure_time),
      vacancies,
    }
    if (typeof cutoffSeconds === 'number') slot.cutoffSeconds = cutoffSeconds
    return slot
  })

  return slots.sort((a, b) => a.dateTime.localeCompare(b.dateTime))
}

/** Normalize GYG path aliases to a logical action (supports official /1/ prefix). */
export function normalizeGygActionPath(tail: string): string {
  let path = tail.replace(/^\/+/, '').replace(/\/+$/, '')
  // Accept: gyg/get-availabilities | gyg/1/get-availabilities | 1/get-availabilities
  if (path.startsWith('gyg/')) path = path.slice(4)
  if (path.startsWith('1/')) path = path.slice(2)
  return path
}
