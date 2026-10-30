/**
 * Shared booking rules for Royal Nordic tours.
 * Keep this file identical to supabase/functions/_shared/tourBookingRules.ts
 * (edge functions cannot import from src/).
 */

export const STANDARD_GROUP_TOUR_ID = 10
export const STANDARD_GROUP_PATH = '/northern-lights-standard-group'
export const STANDARD_GROUP_SEASON_START = '11-01'
export const STANDARD_GROUP_SEASON_END = '03-31'
export const STANDARD_GROUP_DEPARTURE = '20:00'
export const STANDARD_GROUP_ADULT_PRICE = 60
export const STANDARD_GROUP_CHILD_PRICE = 60
export const STANDARD_GROUP_CAPACITY = 50
export const STANDARD_GROUP_NAME = 'Northern Lights Standard Group – 100% Guarantee'
export const STANDARD_GROUP_PUBLIC_NAME = 'Northern Lights Standard Group – 100% Guarantee'
export const STANDARD_GROUP_LISTING_TITLE = 'Northern Lights Standard Group — Bus Tour'
export const STANDARD_GROUP_MEETING_POINT = 'Ruokasenkatu 3, 96100 Rovaniemi, Finland'

export const PRIVATE_NL_TOUR_ID = 11
export const PRIVATE_NL_PATH = '/northern-lights-private-tour'
export const PRIVATE_NL_SEASON_START = '11-01'
export const PRIVATE_NL_SEASON_END = '04-15'
export const PRIVATE_NL_DEPARTURE = '18:30'
export const PRIVATE_NL_GROUP_PRICE = 1349
export const PRIVATE_NL_CAPACITY = 8
export const PRIVATE_NL_NAME = 'Private Northern Lights Tour – 100% Guarantee'
export const PRIVATE_NL_PUBLIC_NAME = 'Private Northern Lights Tour – 100% Guarantee'
export const PRIVATE_NL_LISTING_TITLE = 'Private Northern Lights Tour — Exclusive Group'

export const RANUA_TOUR_ID = 5
export const RANUA_PATH = '/ranua-zoo'
export const RANUA_PUBLIC_NAME =
  'Ranua Wildlife Park – Entry Ticket & Round-Trip Transfer'
export const RANUA_INTERNAL_NAME = 'Nordic Animals of Ranua Zoo'

/** Absolute one-season window (Europe/Helsinki calendar dates). Not MM-DD recurring. */
export const PRIVATE_SANTA_TOUR_ID = 12
export const PRIVATE_SANTA_PATH = '/private-santa-claus-experience'
export const PRIVATE_SANTA_NAME = 'Private Santa Claus Experience'
export const PRIVATE_SANTA_PUBLIC_NAME = 'Private Santa Claus Experience in Rovaniemi'
export const PRIVATE_SANTA_LISTING_TITLE = 'Private Santa Claus Experience'
export const PRIVATE_SANTA_GROUP_PRICE = 1169
export const PRIVATE_SANTA_REFERENCE_PRICE = 1299
export const PRIVATE_SANTA_CAPACITY = 6
export const PRIVATE_SANTA_SEASON_FIRST = '2026-11-15'
export const PRIVATE_SANTA_SEASON_LAST = '2027-03-31'
// Keep in sync with src/lib/tourBookingRules.ts

const MONTH_DAY = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/

export function isStandardGroupTour(tourId?: number | null, tourName?: string | null): boolean {
  if (tourId === STANDARD_GROUP_TOUR_ID) return true
  return /standard group/i.test(tourName || '')
}

export function isPrivateNlTour(tourId?: number | null, tourName?: string | null): boolean {
  if (tourId === PRIVATE_NL_TOUR_ID) return true
  return /private northern lights/i.test(tourName || '')
}

export function isRanuaTour(tourId?: number | null, tourName?: string | null): boolean {
  if (tourId === RANUA_TOUR_ID) return true
  return /ranua/i.test(tourName || '')
}

export function isPrivateSantaTour(tourId?: number | null, tourName?: string | null): boolean {
  if (tourId === PRIVATE_SANTA_TOUR_ID) return true
  return /private santa/i.test(tourName || '') || /santa claus experience/i.test(tourName || '')
}

/** Inclusive absolute YYYY-MM-DD window. Empty bounds = no restriction. */
export function isDateInAbsoluteTourWindow(
  iso: string,
  fromIso?: string | null,
  toIso?: string | null,
): boolean {
  const date = String(iso || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const from = (fromIso || '').trim().slice(0, 10)
  const to = (toIso || '').trim().slice(0, 10)
  if (!from && !to) return true
  if (from && date < from) return false
  if (to && date > to) return false
  return true
}

/** Recurring MM-DD season. A start after the end crosses the new year (1 Nov–31 Mar). */
export function isDateInTourSeason(
  iso: string,
  seasonStart?: string | null,
  seasonEnd?: string | null,
): boolean {
  const start = (seasonStart || '').trim()
  const end = (seasonEnd || '').trim()
  if (!start || !end) return true
  if (!MONTH_DAY.test(start) || !MONTH_DAY.test(end)) return false

  const date = String(iso || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false

  const month = Number(date.slice(5, 7))
  const day = Number(date.slice(8, 10))
  const [startMonth, startDay] = start.split('-').map(Number)
  const [endMonth, endDay] = end.split('-').map(Number)

  const onOrAfterStart = month > startMonth || (month === startMonth && day >= startDay)
  const onOrBeforeEnd = month < endMonth || (month === endMonth && day <= endDay)
  const crossesYear = startMonth > endMonth || (startMonth === endMonth && startDay > endDay)

  if (crossesYear) return onOrAfterStart || onOrBeforeEnd
  return onOrAfterStart && onOrBeforeEnd
}

export function perPersonSubtotal(
  adults: number,
  children: number,
  adultPrice: number,
  childPrice: number,
): number {
  const subtotal = adults * adultPrice + children * childPrice
  return Math.round(subtotal * 100) / 100
}

export function partyFitsCapacity(opts: {
  adults: number
  children: number
  remaining: number
  maxCapacity: number
}): boolean {
  const requested = opts.adults + opts.children
  if (!Number.isInteger(requested) || requested < 1) return false
  if (!Number.isInteger(opts.maxCapacity) || opts.maxCapacity < 1) return false
  if (requested > opts.maxCapacity) return false
  if (requested > opts.remaining) return false
  return true
}

export function isValidSeasonDay(value: string): boolean {
  return MONTH_DAY.test(value.trim())
}

export function isValidDepartureTime(value: string): boolean {
  return CLOCK.test(value.trim())
}

/** Confirmation / summary clock. Explicit departure wins over product-name defaults. */
export function departureSuffixForTour(tourName: string, departureTime?: string | null): string {
  const explicit = (departureTime || '').trim()
  if (explicit && isValidDepartureTime(explicit)) return ` at ${explicit}`
  if (/family-friendly northern lights/i.test(tourName)) return ' at 21:00'
  if (isStandardGroupTour(null, tourName)) return ` at ${STANDARD_GROUP_DEPARTURE}`
  if (isPrivateNlTour(null, tourName)) return ` at ${PRIVATE_NL_DEPARTURE}`
  if (/northern lights/i.test(tourName)) return ' at 18:30'
  return ''
}
