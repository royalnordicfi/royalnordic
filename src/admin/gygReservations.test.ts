import { describe, expect, it } from 'vitest'
import { buildGygAvailabilities, remainingSeats } from './gygAvailability'
import {
  activeHeldPassengers,
  canConsumeHold,
  canReserveSeats,
  formatGygReservationExpiration,
  gygCancelReservationResponse,
  gygReserveSuccessResponse,
  holdMinutesOrDefault,
  isHoldActive,
  mapGygCancelRpcError,
  mapGygConsumeRpcError,
  mapGygReserveRpcError,
  parseGygReserveRequest,
  reservationExpirationFromNow,
} from './gygReservations'

describe('GYG seat reservations (1.6B)', () => {
  it('parses official reserve request and participant counts', () => {
    const parsed = parseGygReserveRequest({
      productId: 'prod123',
      dateTime: '2020-12-01T10:00:00+02:00',
      gygBookingReference: 'GYG189H3K1',
      bookingItems: [
        { category: 'ADULT', count: 2 },
        { category: 'CHILD', count: 1 },
      ],
    })
    expect(parsed).toEqual({
      ok: true,
      request: {
        productId: 'prod123',
        dateTime: '2020-12-01T10:00:00+02:00',
        gygBookingReference: 'GYG189H3K1',
        adults: 2,
        children: 1,
        total: 3,
      },
    })
  })

  it('rejects invalid reserve payloads with official error codes', () => {
    expect(parseGygReserveRequest({ productId: '', dateTime: '2020-12-01T10:00:00+02:00', gygBookingReference: 'x' }).ok).toBe(
      false,
    )
    expect(
      parseGygReserveRequest({
        productId: 'p',
        dateTime: '2020-12-01T10:00:00+02:00',
        gygBookingReference: 'GYG1',
        bookingItems: [],
      }),
    ).toMatchObject({ ok: false, errorCode: 'INVALID_PARTICIPANTS_CONFIGURATION' })
  })

  it('treats only unexpired pending holds as active', () => {
    const now = new Date('2026-01-15T12:00:00.000Z')
    expect(isHoldActive('pending', '2026-01-15T13:00:00.000Z', now)).toBe(true)
    expect(isHoldActive('pending', '2026-01-15T11:00:00.000Z', now)).toBe(false)
    expect(isHoldActive('cancelled', '2026-01-15T13:00:00.000Z', now)).toBe(false)
    expect(isHoldActive('confirmed', '2026-01-15T13:00:00.000Z', now)).toBe(false)
    expect(isHoldActive('pending', null, now)).toBe(false)
  })

  it('successful reservation reduces available capacity immediately', () => {
    const capacity = 10
    const confirmed = 4
    const beforeHeld = 0
    expect(canReserveSeats(capacity, confirmed, beforeHeld, 3)).toBe(true)
    const afterHeld = beforeHeld + 3
    expect(remainingSeats(capacity, confirmed, afterHeld)).toBe(3)
    expect(
      buildGygAvailabilities('prod123', [
        {
          departure_date: '2020-12-01',
          departure_time: '10:00',
          capacity,
          confirmed_passengers: confirmed,
          held_passengers: afterHeld,
        },
      ])[0].vacancies,
    ).toBe(3)
  })

  it('duplicate / concurrent capacity: second reserve fails when seats are gone', () => {
    // Simulates two simultaneous 6-seat requests against capacity 10 with 0 confirmed.
    const capacity = 10
    const confirmed = 0
    const first = 6
    expect(canReserveSeats(capacity, confirmed, 0, first)).toBe(true)
    const heldAfterFirst = first
    expect(canReserveSeats(capacity, confirmed, heldAfterFirst, 6)).toBe(false)
    expect(canReserveSeats(capacity, confirmed, heldAfterFirst, 4)).toBe(true)
  })

  it('reservation exceeding capacity is rejected', () => {
    expect(canReserveSeats(8, 5, 2, 2)).toBe(false)
    expect(mapGygReserveRpcError('NO_AVAILABILITY').errorCode).toBe('NO_AVAILABILITY')
  })

  it('cancellation releases hold capacity immediately', () => {
    const now = new Date('2026-01-15T12:00:00.000Z')
    const holds = [
      { status: 'pending', hold_expires_at: '2026-01-15T13:00:00.000Z', passenger_count: 4 },
      { status: 'cancelled', hold_expires_at: null, passenger_count: 3 },
    ]
    expect(activeHeldPassengers(holds, now)).toBe(4)
    // After cancel of the active hold:
    expect(
      activeHeldPassengers(
        [{ status: 'cancelled', hold_expires_at: null, passenger_count: 4 }],
        now,
      ),
    ).toBe(0)
    expect(remainingSeats(10, 2, 0)).toBe(8)
  })

  it('expired reservation no longer occupies capacity', () => {
    const now = new Date('2026-01-15T12:00:00.000Z')
    const held = activeHeldPassengers(
      [
        { status: 'pending', hold_expires_at: '2026-01-15T11:59:00.000Z', passenger_count: 5 },
        { status: 'pending', hold_expires_at: '2026-01-15T12:30:00.000Z', passenger_count: 2 },
      ],
      now,
    )
    expect(held).toBe(2)
    expect(remainingSeats(10, 3, held)).toBe(5)
  })

  it('booking confirmation from a valid hold does not double-count capacity', () => {
    const capacity = 10
    const confirmed = 3
    const holdPax = 4
    const otherHolds = 1
    // Before consume: confirmed 3 + held (4+1) = 8 used → 2 free
    expect(remainingSeats(capacity, confirmed, holdPax + otherHolds)).toBe(2)
    // Consume converts this hold → confirmed 7, held 1 → still 2 free (not 2-4)
    expect(canConsumeHold(capacity, confirmed, otherHolds, holdPax)).toBe(true)
    expect(remainingSeats(capacity, confirmed + holdPax, otherHolds)).toBe(2)
    // Oversized consume vs remaining excluding this hold fails
    expect(canConsumeHold(capacity, 8, 2, 4)).toBe(false)
  })

  it('availability before and after reservation reflects active holds only', () => {
    const before = buildGygAvailabilities('prod123', [
      {
        departure_date: '2020-12-01',
        departure_time: '10:00',
        capacity: 10,
        confirmed_passengers: 2,
        held_passengers: 0,
      },
    ])
    expect(before[0].vacancies).toBe(8)

    const after = buildGygAvailabilities('prod123', [
      {
        departure_date: '2020-12-01',
        departure_time: '10:00',
        capacity: 10,
        confirmed_passengers: 2,
        held_passengers: 3,
      },
    ])
    expect(after[0].vacancies).toBe(5)
  })

  it('formats official reserve/cancel response shapes', () => {
    const expires = new Date('2020-12-01T07:35:53.000Z')
    expect(gygReserveSuccessResponse('res789', expires)).toEqual({
      data: {
        reservationReference: 'res789',
        reservationExpiration: '2020-12-01T07:35:53+00:00',
      },
    })
    expect(formatGygReservationExpiration(expires)).toBe('2020-12-01T07:35:53+00:00')
    expect(gygCancelReservationResponse()).toEqual({ data: {} })
    expect(holdMinutesOrDefault(5)).toBe(15)
    expect(holdMinutesOrDefault(90)).toBe(90)
    const exp = reservationExpirationFromNow(60, new Date('2020-12-01T06:35:53.000Z'))
    expect(exp).toBe('2020-12-01T07:35:53+00:00')
  })

  it('maps RPC errors to official GYG error codes', () => {
    expect(mapGygReserveRpcError('INVALID_PRODUCT').errorCode).toBe('INVALID_PRODUCT')
    expect(mapGygCancelRpcError('INVALID_RESERVATION').errorCode).toBe('INVALID_RESERVATION')
    expect(mapGygConsumeRpcError('INVALID_RESERVATION').errorCode).toBe('INVALID_RESERVATION')
    expect(mapGygConsumeRpcError('NO_AVAILABILITY').errorCode).toBe('NO_AVAILABILITY')
  })
})
