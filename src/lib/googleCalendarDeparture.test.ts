import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  adminBookingUrl,
  buildCalendarEventBody,
  europeHelsinkiOffset,
  normalizeHhMm,
  resolveBookingDeparture,
} from './googleCalendarDeparture.ts'

describe('googleCalendarDeparture', () => {
  it('normalizes HH:MM', () => {
    assert.equal(normalizeHhMm('9:05'), '09:05')
    assert.equal(normalizeHhMm('18:30'), '18:30')
    assert.equal(normalizeHhMm(''), null)
    assert.equal(normalizeHhMm('tonight'), null)
  })

  it('does not invent departure times', () => {
    const r = resolveBookingDeparture({
      tourDate: '2026-12-01',
      bookingTourTime: null,
      tourDepartureTime: null,
    })
    assert.equal(r.ok, false)
    if (!r.ok) assert.equal(r.reason, 'needs_departure_time')
  })

  it('prefers booking.tour_time over tour.departure_time', () => {
    const r = resolveBookingDeparture({
      tourDate: '2026-12-01',
      bookingTourTime: '19:00',
      tourDepartureTime: '20:00',
    })
    assert.equal(r.ok, true)
    if (r.ok) {
      assert.equal(r.time, '19:00')
      assert.equal(r.source, 'booking.tour_time')
      assert.match(r.startRfc3339, /^2026-12-01T19:00:00[+-]\d{2}:\d{2}$/)
    }
  })

  it('uses tour.departure_time when booking time missing', () => {
    const r = resolveBookingDeparture({
      tourDate: '2026-12-01',
      bookingTourTime: null,
      tourDepartureTime: '20:00',
    })
    assert.equal(r.ok, true)
    if (r.ok) {
      assert.equal(r.source, 'tours.departure_time')
      assert.equal(r.time, '20:00')
    }
  })

  it('includes Helsinki offset (winter +02)', () => {
    assert.equal(europeHelsinkiOffset('2026-01-15'), '+02:00')
  })

  it('builds event body with admin link', () => {
    const body = buildCalendarEventBody({
      bookingId: 42,
      bookingRef: 'RN-42',
      tourName: 'Small Group Northern Lights',
      customerName: 'Ada',
      customerEmail: 'ada@example.com',
      customerPhone: '+358',
      adults: 2,
      children: 1,
      pickupLocation: 'Hotel Test',
      tourTime: '18:30',
      status: 'confirmed',
      internalNotes: 'VIP',
      specialRequests: null,
    })
    assert.match(body.summary, /RN-42/)
    assert.match(body.description, /admin\.royalnordic\.fi\/bookings\/42/)
    assert.match(body.description, /2 adult/)
  })

  it('adminBookingUrl', () => {
    assert.equal(adminBookingUrl(7), 'https://admin.royalnordic.fi/bookings/7')
  })
})
