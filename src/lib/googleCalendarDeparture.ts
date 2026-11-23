/**
 * Resolve booking departure for Google Calendar / admin reminders.
 * Does NOT invent marketing defaults — only booking.tour_time or tours.departure_time.
 */

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export type DepartureResolution =
  | {
      ok: true
      date: string
      time: string
      source: 'booking.tour_time' | 'tours.departure_time'
      /** RFC3339 with Europe/Helsinki offset, e.g. 2026-12-01T18:30:00+02:00 */
      startRfc3339: string
      /** Absolute UTC instant for reminder scheduling */
      startUtc: Date
    }
  | {
      ok: false
      reason: 'missing_tour_date' | 'needs_departure_time' | 'invalid_time'
      date: string | null
      time: string | null
    }

export function normalizeHhMm(raw: string | null | undefined): string | null {
  const t = String(raw || '').trim()
  const m = t.match(TIME_RE)
  if (!m) return null
  return `${m[1].padStart(2, '0')}:${m[2]}`
}

/** Europe/Helsinki UTC offset for a calendar date (±HH:MM). */
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
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `${sign}${hh}:${mm}`
}

export function resolveBookingDeparture(input: {
  tourDate: string | null | undefined
  bookingTourTime?: string | null
  tourDepartureTime?: string | null
}): DepartureResolution {
  const date = String(input.tourDate || '').trim()
  if (!DATE_RE.test(date)) {
    return { ok: false, reason: 'missing_tour_date', date: date || null, time: null }
  }

  const fromBooking = normalizeHhMm(input.bookingTourTime)
  const fromTour = normalizeHhMm(input.tourDepartureTime)
  const time = fromBooking || fromTour
  if (!time) {
    return { ok: false, reason: 'needs_departure_time', date, time: null }
  }

  const source = fromBooking ? 'booking.tour_time' : 'tours.departure_time'
  const offset = europeHelsinkiOffset(date)
  const startRfc3339 = `${date}T${time}:00${offset}`
  const startUtc = new Date(startRfc3339)
  if (Number.isNaN(startUtc.getTime())) {
    return { ok: false, reason: 'invalid_time', date, time }
  }

  return { ok: true, date, time, source, startRfc3339, startUtc }
}

export function adminBookingUrl(bookingId: number, base = 'https://admin.royalnordic.fi'): string {
  return `${base.replace(/\/$/, '')}/bookings/${bookingId}`
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
  adminBaseUrl?: string
}): { summary: string; description: string } {
  const ref = input.bookingRef || `RN-${input.bookingId}`
  const pax = input.adults + input.children
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
    `Admin: ${adminBookingUrl(input.bookingId, input.adminBaseUrl)}`,
  ]
  if (input.specialRequests?.trim()) lines.push(`Guest notes: ${input.specialRequests.trim()}`)
  if (input.internalNotes?.trim()) lines.push(`Ops notes: ${input.internalNotes.trim()}`)
  return { summary, description: lines.join('\n') }
}
