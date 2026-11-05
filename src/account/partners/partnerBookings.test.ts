import { describe, expect, it } from 'vitest'
import {
  PARTNER_BOOKING_FORBIDDEN_KEYS,
  computePartnerDashboardStats,
  filterPartnerBookings,
  formatPartnerBookingWhen,
  formatPartnerGuestCount,
  mapPartnerBookingListItem,
  partnerBookingDisplayRef,
  partnerBookingListHasForbiddenFields,
  selectUpcomingConfirmedBookings,
  statusBadgeClass,
  statusLabel,
  type PartnerBookingRequest,
} from './partnerBookings'

function row(partial: Partial<PartnerBookingRequest> & { id: string }): PartnerBookingRequest {
  return {
    reference: 'PB-TEST',
    tour_id: 1,
    tour_date: '2026-12-25',
    adults: 2,
    children: 0,
    passenger_count: 2,
    unit_net_eur: 50,
    total_net_eur: 100,
    currency: 'EUR',
    status: 'pending',
    created_at: '2026-11-05T00:00:00Z',
    ...partial,
  }
}

describe('partnerBookings list helpers', () => {
  it('filters pending confirmed declined cancelled', () => {
    const rows = [
      row({ id: '1', status: 'pending' }),
      row({ id: '2', status: 'confirmed', booking_ref: 'RN-9' }),
      row({ id: '3', status: 'declined' }),
      row({ id: '4', status: 'cancelled' }),
    ]
    expect(filterPartnerBookings(rows, 'all')).toHaveLength(4)
    expect(filterPartnerBookings(rows, 'pending').map((r) => r.id)).toEqual(['1'])
    expect(filterPartnerBookings(rows, 'confirmed').map((r) => r.id)).toEqual(['2'])
    expect(filterPartnerBookings(rows, 'declined').map((r) => r.id)).toEqual(['3'])
    expect(filterPartnerBookings(rows, 'cancelled').map((r) => r.id)).toEqual(['4'])
  })

  it('formats date/time and guest counts for compact cards', () => {
    expect(formatPartnerBookingWhen(row({ id: '1', departure_time: null }))).toBe('2026-12-25')
    expect(formatPartnerBookingWhen(row({ id: '1', departure_time: '20:00' }))).toBe(
      '2026-12-25 · 20:00',
    )
    expect(formatPartnerGuestCount(row({ id: '1', passenger_count: 1 }))).toBe('1 guest')
    expect(formatPartnerGuestCount(row({ id: '1', passenger_count: 3 }))).toBe('3 guests')
  })

  it('distinguishes declined from cancelled in labels and badge classes', () => {
    expect(statusLabel('declined')).toBe('Declined')
    expect(statusLabel('cancelled')).toBe('Cancelled')
    expect(statusBadgeClass('declined')).toContain('red')
    expect(statusBadgeClass('cancelled')).not.toContain('red')
    expect(statusBadgeClass('cancelled')).toContain('text-dim')
  })

  it('maps enriched list fields without leaking forbidden keys', () => {
    const mapped = mapPartnerBookingListItem({
      id: 'a',
      reference: 'PB-AAA',
      booking_ref: 'RN-12',
      tour_id: 1,
      tour_title: 'Northern Lights',
      tour_date: '2026-12-25',
      departure_time: '20:00',
      adults: 2,
      children: 1,
      passenger_count: 3,
      guest_name: 'Ada',
      pickup_location: 'Hotel',
      unit_net_eur: 55,
      total_net_eur: 165,
      currency: 'EUR',
      status: 'confirmed',
      booking_id: 12,
      created_at: '2026-11-05T00:00:00Z',
      reviewed_at: null,
      // stray sensitive keys must be dropped by mapping
      adult_price: 99,
      commission: 10,
      admin_note: 'secret',
    })
    expect(mapped.booking_ref).toBe('RN-12')
    expect(mapped.departure_time).toBe('20:00')
    expect(mapped.guest_name).toBe('Ada')
    expect(mapped.pickup_location).toBe('Hotel')
    expect(mapped.unit_net_eur).toBe(55)
    expect(mapped).not.toHaveProperty('adult_price')
    expect(mapped).not.toHaveProperty('commission')
    expect(mapped).not.toHaveProperty('admin_note')
  })

  it('detects forbidden fields on raw RPC payloads', () => {
    expect(partnerBookingListHasForbiddenFields({ id: '1', reference: 'PB-1' })).toEqual([])
    for (const key of PARTNER_BOOKING_FORBIDDEN_KEYS) {
      expect(partnerBookingListHasForbiddenFields({ [key]: 1 })).toContain(key)
    }
  })

  it('computes overview stats excluding declined and cancelled from confirmed totals', () => {
    const today = '2026-11-05'
    const rows = [
      row({ id: 'p', status: 'pending', total_net_eur: 10 }),
      row({ id: 'p2', status: 'pending', total_net_eur: 10 }),
      row({
        id: 'cu',
        status: 'confirmed',
        tour_date: '2026-12-01',
        total_net_eur: 100,
        booking_ref: 'RN-1',
      }),
      row({
        id: 'cp',
        status: 'confirmed',
        tour_date: '2026-10-01',
        total_net_eur: 40,
        booking_ref: 'RN-2',
      }),
      row({ id: 'd', status: 'declined', total_net_eur: 999 }),
      row({ id: 'c', status: 'cancelled', total_net_eur: 888 }),
    ]
    expect(computePartnerDashboardStats(rows, today)).toEqual({
      pending_count: 2,
      confirmed_upcoming_count: 1,
      confirmed_total_net_eur: 140,
    })
  })

  it('selects next five upcoming confirmed bookings soonest first', () => {
    const today = '2026-11-05'
    const rows = [
      row({ id: 'past', status: 'confirmed', tour_date: '2026-10-01', booking_ref: 'RN-0' }),
      row({
        id: 'b',
        status: 'confirmed',
        tour_date: '2026-12-10',
        departure_time: '09:00',
        booking_ref: 'RN-B',
      }),
      row({
        id: 'a',
        status: 'confirmed',
        tour_date: '2026-12-01',
        departure_time: '20:00',
        booking_ref: 'RN-A',
      }),
      row({ id: 'pend', status: 'pending', tour_date: '2026-12-01' }),
      row({
        id: 'c',
        status: 'confirmed',
        tour_date: '2026-12-01',
        departure_time: '18:00',
        booking_ref: 'RN-C',
      }),
      row({ id: 'd', status: 'declined', tour_date: '2026-12-02' }),
    ]
    expect(selectUpcomingConfirmedBookings(rows, 5, today).map((r) => r.id)).toEqual([
      'c',
      'a',
      'b',
    ])
    expect(partnerBookingDisplayRef(rows[2])).toBe('RN-A')
    expect(partnerBookingDisplayRef(row({ id: 'x', status: 'pending', reference: 'PB-X' }))).toBe(
      'PB-X',
    )
  })
})
