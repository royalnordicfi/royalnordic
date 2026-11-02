import { describe, expect, it } from 'vitest'
import {
  countsAsOperational,
  countsAsRevenue,
  computeOverviewStats,
  isExpiredUnpaid,
  passengerCount,
} from './stats'
import type { OpsBooking } from './types'

function booking(partial: Partial<OpsBooking> & Pick<OpsBooking, 'id'>): OpsBooking {
  return {
    booking_ref: `RN-${partial.id}`,
    customer_name: 'Test',
    customer_email: 't@example.com',
    customer_phone: null,
    adults: 2,
    children: 0,
    total_price: 100,
    status: 'confirmed',
    payment_status: 'paid',
    source: 'direct_website',
    pickup_location: null,
    tour_time: '18:30',
    special_requests: null,
    internal_notes: null,
    stripe_payment_intent_id: null,
    guide_id: null,
    vehicle_id: null,
    tour_id: 1,
    tour_date_id: 1,
    created_at: '2026-01-01T00:00:00Z',
    deleted_at: null,
    tour_dates: { id: 1, date: '2026-11-10' },
    tours: { id: 1, name: 'Tour', public_name: 'Tour', max_capacity: 8 },
    ...partial,
  }
}

describe('admin stats', () => {
  it('excludes cancelled and removed from operational counts', () => {
    expect(countsAsOperational(booking({ id: 1, status: 'cancelled' }))).toBe(false)
    expect(
      countsAsOperational(booking({ id: 2, deleted_at: '2026-11-01T00:00:00Z' })),
    ).toBe(false)
    expect(countsAsOperational(booking({ id: 3 }))).toBe(true)
  })

  it('excludes unpaid past departures from operational counts', () => {
    const b = booking({
      id: 4,
      payment_status: 'unpaid',
      status: 'pending',
      tour_dates: { id: 1, date: '2020-01-01' },
    })
    expect(isExpiredUnpaid(b, '2026-11-02')).toBe(true)
    expect(countsAsOperational(b, '2026-11-02')).toBe(false)
  })

  it('counts only paid non-refunded as revenue', () => {
    expect(countsAsRevenue(booking({ id: 5, payment_status: 'paid' }))).toBe(true)
    expect(countsAsRevenue(booking({ id: 6, payment_status: 'unpaid' }))).toBe(false)
    expect(countsAsRevenue(booking({ id: 7, payment_status: 'refunded' }))).toBe(false)
    expect(
      countsAsRevenue(booking({ id: 8, payment_status: 'paid', deleted_at: '2026-01-01' })),
    ).toBe(false)
  })

  it('sums passengers correctly', () => {
    expect(passengerCount(booking({ id: 9, adults: 2, children: 1 }))).toBe(3)
  })

  it('overview week revenue uses paid only', () => {
    const today = '2026-11-10'
    const rows = [
      booking({ id: 1, payment_status: 'paid', tour_dates: { id: 1, date: today } }),
      booking({
        id: 2,
        payment_status: 'unpaid',
        status: 'pending',
        tour_dates: { id: 2, date: today },
      }),
      booking({
        id: 3,
        payment_status: 'paid',
        status: 'cancelled',
        deleted_at: '2026-11-01',
        tour_dates: { id: 3, date: today },
      }),
    ]
    const stats = computeOverviewStats(rows, { today })
    expect(stats.todayBookings).toBe(2)
    expect(stats.todayPassengers).toBe(4)
    expect(stats.weekRevenue).toBe(100)
  })
})
