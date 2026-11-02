/**
 * Shared operational metrics for Home, Bookings, and Revenue.
 * Departure dates are YYYY-MM-DD in Europe/Helsinki business calendar.
 * Revenue counts successful payments only (paid, not refunded).
 */

import { addTourDays, todayTourDateISO } from '../lib/tourDate'
import type { OpsBooking } from './types'

/** Active operational booking — not cancelled, not soft-removed. */
export function isActiveBooking(b: OpsBooking): boolean {
  return b.status !== 'cancelled' && !b.deleted_at
}

/** Failed / abandoned unpaid states that should not count as passengers or revenue. */
export function isExpiredUnpaid(b: OpsBooking, today: string = todayTourDateISO()): boolean {
  if (b.deleted_at || b.status === 'cancelled') return false
  if (b.payment_status === 'paid' || b.payment_status === 'partial') return false
  if (b.payment_status === 'refunded') return false
  const departure = b.tour_dates?.date || ''
  // Unpaid and departure day has passed — treat as expired for operational stats
  return (
    (b.payment_status === 'unpaid' ||
      b.payment_status === 'pending_crypto' ||
      b.status === 'pending' ||
      b.status === 'pending_crypto_payment') &&
    !!departure &&
    departure < today
  )
}

/** Counts toward passenger / booking totals on the ops dashboard. */
export function countsAsOperational(b: OpsBooking, today: string = todayTourDateISO()): boolean {
  if (!isActiveBooking(b)) return false
  if (isExpiredUnpaid(b, today)) return false
  return true
}

/** Counts as earned revenue (successful payment, not refunded / cancelled / removed). */
export function countsAsRevenue(b: OpsBooking): boolean {
  if (b.deleted_at) return false
  if (b.status === 'cancelled') return false
  if (b.payment_status === 'refunded') return false
  return b.payment_status === 'paid'
}

export function passengerCount(b: OpsBooking): number {
  return (Number(b.adults) || 0) + (Number(b.children) || 0)
}

export function bookingAmount(b: OpsBooking): number {
  return Number(b.total_price) || 0
}

export type OverviewStats = {
  todayBookings: number
  todayPassengers: number
  weekBookings: number
  weekRevenue: number
  upcoming: OpsBooking[]
  unpaidAttention: OpsBooking[]
  capacityConflictDates: string[]
}

export function computeOverviewStats(
  bookings: OpsBooking[],
  options?: { today?: string; capacityConflictDates?: string[] },
): OverviewStats {
  const today = options?.today ?? todayTourDateISO()
  const weekEnd = addTourDays(today, 6)

  const operational = bookings.filter((b) => countsAsOperational(b, today))

  const todayRows = operational
    .filter((b) => b.tour_dates?.date === today)
    .sort((a, b) => (a.tour_time || '').localeCompare(b.tour_time || ''))

  const weekRows = operational.filter((b) => {
    const d = b.tour_dates?.date || ''
    return d >= today && d <= weekEnd
  })

  const weekRevenue = weekRows.filter(countsAsRevenue).reduce((s, b) => s + bookingAmount(b), 0)

  const upcoming = operational
    .filter((b) => (b.tour_dates?.date || '') >= today)
    .sort((a, b) => {
      const da = a.tour_dates?.date || ''
      const db = b.tour_dates?.date || ''
      if (da !== db) return da.localeCompare(db)
      return (a.tour_time || '').localeCompare(b.tour_time || '')
    })
    .slice(0, 12)

  const unpaidAttention = operational
    .filter(
      (b) =>
        (b.tour_dates?.date || '') >= today &&
        (b.payment_status === 'unpaid' ||
          b.payment_status === 'pending_crypto' ||
          b.status === 'pending_crypto_payment'),
    )
    .sort((a, b) => (a.tour_dates?.date || '').localeCompare(b.tour_dates?.date || ''))

  return {
    todayBookings: todayRows.length,
    todayPassengers: todayRows.reduce((s, b) => s + passengerCount(b), 0),
    weekBookings: weekRows.length,
    weekRevenue,
    upcoming,
    unpaidAttention,
    capacityConflictDates: options?.capacityConflictDates ?? [],
  }
}

export type RevenueReport = {
  paidGross: number
  refundedGross: number
  netPaidEstimate: number
  paidBookingCount: number
  operationalPassengers: number
  upcomingPaidGross: number
  bySource: Map<
    string,
    { count: number; gross: number; commission: number; netKnown: boolean }
  >
  byProduct: Map<string, { count: number; gross: number; pax: number }>
}

export function computeRevenueReport(
  bookings: OpsBooking[],
  commissionByTour: Map<number, number | null>,
  options?: { today?: string },
): RevenueReport {
  const today = options?.today ?? todayTourDateISO()
  const bySource = new Map<
    string,
    { count: number; gross: number; commission: number; netKnown: boolean }
  >()
  const byProduct = new Map<string, { count: number; gross: number; pax: number }>()

  let paidGross = 0
  let refundedGross = 0
  let paidBookingCount = 0
  let operationalPassengers = 0
  let upcomingPaidGross = 0

  for (const b of bookings) {
    if (b.deleted_at) continue

    if (b.payment_status === 'refunded') {
      refundedGross += bookingAmount(b)
      continue
    }

    if (countsAsOperational(b, today)) {
      operationalPassengers += passengerCount(b)
    }

    if (!countsAsRevenue(b)) continue

    const gross = bookingAmount(b)
    paidGross += gross
    paidBookingCount += 1

    if ((b.tour_dates?.date || '') >= today) {
      upcomingPaidGross += gross
    }

    const src = b.source || 'direct_website'
    const bucket = bySource.get(src) || { count: 0, gross: 0, commission: 0, netKnown: true }
    bucket.count += 1
    bucket.gross += gross
    const pct = commissionByTour.get(b.tour_id)
    if (pct == null) bucket.netKnown = false
    else bucket.commission += (gross * Number(pct)) / 100
    bySource.set(src, bucket)

    const pname = b.tours?.public_name || b.tours?.name || `Tour ${b.tour_id}`
    const pb = byProduct.get(pname) || { count: 0, gross: 0, pax: 0 }
    pb.count += 1
    pb.gross += gross
    pb.pax += passengerCount(b)
    byProduct.set(pname, pb)
  }

  return {
    paidGross,
    refundedGross,
    netPaidEstimate: paidGross, // commission subtracted per-source when known
    paidBookingCount,
    operationalPassengers,
    upcomingPaidGross,
    bySource,
    byProduct,
  }
}
