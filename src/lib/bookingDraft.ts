/** Versioned handoff from tour-page BookingWidget → /checkout. */

export type BookingPricingModel = 'per_person' | 'per_vehicle'

export const BOOKING_DRAFT_KEY = 'rnCheckoutDraft'
export const BOOKING_DRAFT_VERSION = 1 as const

export type BookingDraft = {
  v: typeof BOOKING_DRAFT_VERSION
  createdAt: string
  returnPath: string
  tourId: number
  tourName: string
  tourDateId: number
  tourDateIso: string
  adults: number
  children: number
  pricingModel: BookingPricingModel
  adultPrice: number
  childPrice: number
  maxCapacity?: number
  seasonStart?: string
  seasonEnd?: string
  absoluteFrom?: string
  absoluteTo?: string
  departureTime?: string
  meetingPointDeparture?: boolean
  meetingPoint?: string
  /** When true, checkout requires a hotel/pickup address. */
  requiresHotelPickup?: boolean
  pickupLocation?: string
  customerName?: string
  customerEmail?: string
  phone?: string
  specialRequests?: string
  discountCode?: string
}

export function computeBookingSubtotal(
  pricingModel: BookingPricingModel,
  adults: number,
  children: number,
  adultPrice: number,
  childPrice: number,
): number {
  if (pricingModel === 'per_vehicle') return adultPrice
  return adults * adultPrice + children * childPrice
}

export function isBookingDraft(value: unknown): value is BookingDraft {
  if (!value || typeof value !== 'object') return false
  const d = value as Record<string, unknown>
  return (
    d.v === BOOKING_DRAFT_VERSION &&
    typeof d.tourId === 'number' &&
    typeof d.tourName === 'string' &&
    typeof d.tourDateId === 'number' &&
    typeof d.tourDateIso === 'string' &&
    typeof d.adults === 'number' &&
    typeof d.children === 'number' &&
    (d.pricingModel === 'per_person' || d.pricingModel === 'per_vehicle') &&
    typeof d.adultPrice === 'number' &&
    typeof d.childPrice === 'number' &&
    typeof d.returnPath === 'string'
  )
}

export function saveBookingDraft(draft: BookingDraft): void {
  try {
    sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft))
  } catch {
    /* private mode / quota */
  }
}

export function readBookingDraft(): BookingDraft | null {
  try {
    const raw = sessionStorage.getItem(BOOKING_DRAFT_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isBookingDraft(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function clearBookingDraft(): void {
  try {
    sessionStorage.removeItem(BOOKING_DRAFT_KEY)
  } catch {
    /* ignore */
  }
}

export function updateBookingDraft(patch: Partial<BookingDraft>): BookingDraft | null {
  const current = readBookingDraft()
  if (!current) return null
  const next = { ...current, ...patch, v: BOOKING_DRAFT_VERSION }
  saveBookingDraft(next)
  return next
}

/** Build /checkout query from a draft (non-PII selection only). */
export function checkoutPathFromDraft(draft: BookingDraft): string {
  const params = new URLSearchParams({
    tour: String(draft.tourId),
    date: draft.tourDateIso,
    dateId: String(draft.tourDateId),
    a: String(draft.adults),
    c: String(draft.children),
  })
  if (draft.pricingModel === 'per_vehicle') params.set('pm', 'per_vehicle')
  return `/checkout?${params.toString()}`
}

export function draftFromCheckoutSearch(
  search: string,
  fallbacks: Pick<BookingDraft, 'tourName' | 'adultPrice' | 'childPrice' | 'returnPath'> &
    Partial<BookingDraft>,
): BookingDraft | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const tourId = Number(params.get('tour'))
  const tourDateIso = params.get('date') || ''
  const tourDateId = Number(params.get('dateId'))
  const adults = Number(params.get('a') || '1')
  const children = Number(params.get('c') || '0')
  const pm = params.get('pm') === 'per_vehicle' ? 'per_vehicle' : 'per_person'
  if (!Number.isFinite(tourId) || tourId <= 0 || !tourDateIso || !Number.isFinite(tourDateId)) {
    return null
  }
  return {
    v: BOOKING_DRAFT_VERSION,
    createdAt: new Date().toISOString(),
    returnPath: fallbacks.returnPath,
    tourId,
    tourName: fallbacks.tourName,
    tourDateId,
    tourDateIso,
    adults: Number.isFinite(adults) && adults > 0 ? adults : 1,
    children: Number.isFinite(children) && children >= 0 ? children : 0,
    pricingModel: pm,
    adultPrice: fallbacks.adultPrice,
    childPrice: fallbacks.childPrice,
    maxCapacity: fallbacks.maxCapacity,
    seasonStart: fallbacks.seasonStart,
    seasonEnd: fallbacks.seasonEnd,
    departureTime: fallbacks.departureTime,
    meetingPointDeparture: fallbacks.meetingPointDeparture,
    meetingPoint: fallbacks.meetingPoint,
  }
}

/** Open calendar on the soonest month that intersects the tour season (UI only). */
export function initialCalendarMonth(
  seasonStart?: string,
  seasonEnd?: string,
  absoluteFrom?: string,
): Date {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)
  const abs = (absoluteFrom || '').trim().slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(abs)) {
    const fromMonth = new Date(Number(abs.slice(0, 4)), Number(abs.slice(5, 7)) - 1, 1, 12)
    if (today < fromMonth) return fromMonth
    return new Date(today.getFullYear(), today.getMonth(), 1)
  }
  if (!seasonStart || !seasonEnd) return new Date(today.getFullYear(), today.getMonth(), 1)

  const [startMonth, startDay] = seasonStart.split('-').map(Number)
  const [endMonth, endDay] = seasonEnd.split('-').map(Number)
  const year = today.getFullYear()

  const candidates: Date[] = []
  if (endMonth < startMonth) {
    candidates.push(new Date(year - 1, startMonth - 1, startDay, 12))
    candidates.push(new Date(year, startMonth - 1, startDay, 12))
    candidates.push(new Date(year + 1, startMonth - 1, startDay, 12))
  } else {
    candidates.push(new Date(year, startMonth - 1, startDay, 12))
    candidates.push(new Date(year + 1, startMonth - 1, startDay, 12))
  }

  for (const start of candidates) {
    const end = new Date(
      endMonth < startMonth ? start.getFullYear() + 1 : start.getFullYear(),
      endMonth - 1,
      endDay,
      12,
    )
    if (today <= end) {
      if (today >= start) return new Date(today.getFullYear(), today.getMonth(), 1)
      return new Date(start.getFullYear(), start.getMonth(), 1)
    }
  }

  const fallback = candidates[candidates.length - 1]
  return new Date(fallback.getFullYear(), fallback.getMonth(), 1)
}
