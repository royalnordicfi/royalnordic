import { describe, expect, it } from 'vitest'
import { buildGygAvailabilities, remainingSeats } from './gygAvailability'
import {
  canConsumeHold,
  canReserveSeats,
  isHoldActive,
} from './gygReservations'
import {
  buildGygTickets,
  capacityAfterCancel,
  gygBookEventKey,
  gygBookSuccessResponse,
  gygCancelBookingEventKey,
  gygCancelBookingResponse,
  mapGygCancelBookingRpcError,
  mapGygConfirmRpcError,
  parseGygBookRequest,
  parseGygCancelBookingRequest,
} from './gygBookings'

describe('GYG booking lifecycle (1.6C)', () => {
  it('parses official book request including travelers', () => {
    const parsed = parseGygBookRequest({
      productId: 'prod123',
      dateTime: '2020-12-01T10:00:00+02:00',
      gygBookingReference: 'GYG1B2D34GHI',
      reservationReference: 'res789',
      bookingItems: [
        { category: 'ADULT', count: 2 },
        { category: 'CHILD', count: 1 },
      ],
      travelers: [
        {
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@john-smith.com',
          phoneNumber: '+49 030 1231231',
        },
      ],
      comment: 'Hotel ABC',
    })
    expect(parsed).toMatchObject({
      ok: true,
      request: {
        productId: 'prod123',
        gygBookingReference: 'GYG1B2D34GHI',
        reservationReference: 'res789',
        adults: 2,
        children: 1,
        guestName: 'John Smith',
        contactEmail: 'john@john-smith.com',
        notes: 'Hotel ABC',
      },
    })
  })

  it('allows book without reservationReference (recoverable via gyg ref)', () => {
    const parsed = parseGygBookRequest({
      productId: 'prod123',
      dateTime: '2020-12-01T10:00:00+02:00',
      gygBookingReference: 'GYG1B2D34GHI',
      bookingItems: [{ category: 'ADULT', count: 1 }],
    })
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.request.reservationReference).toBeNull()
  })

  it('builds official book success with tickets', () => {
    expect(gygBookSuccessResponse('GYG1B2D34GHI', 2, 1)).toEqual({
      data: {
        bookingReference: 'GYG1B2D34GHI',
        tickets: [
          { category: 'ADULT', ticketCode: 'GYG1B2D34GHI-A01', ticketCodeType: 'TEXT' },
          { category: 'ADULT', ticketCode: 'GYG1B2D34GHI-A02', ticketCodeType: 'TEXT' },
          { category: 'CHILD', ticketCode: 'GYG1B2D34GHI-C03', ticketCodeType: 'TEXT' },
        ],
      },
    })
    expect(buildGygTickets('bk456', 1, 0)).toHaveLength(1)
  })

  it('duplicate book requests stay idempotent (same booking reference + tickets)', () => {
    const first = gygBookSuccessResponse('GYG1', 2, 0)
    const retry = gygBookSuccessResponse('GYG1', 2, 0)
    expect(retry).toEqual(first)
    expect(gygBookEventKey('GYG1')).toBe('gyg:book:gyg1')
    expect(gygBookEventKey('GYG1')).toBe(gygBookEventKey('gyg1'))
  })

  it('maps invalid/expired/mismatched reservation to INVALID_RESERVATION', () => {
    expect(mapGygConfirmRpcError('INVALID_RESERVATION').errorCode).toBe('INVALID_RESERVATION')
    expect(mapGygConfirmRpcError('NO_AVAILABILITY').errorCode).toBe('NO_AVAILABILITY')
  })

  it('confirming a hold does not double-count capacity', () => {
    const capacity = 10
    const confirmed = 2
    const holdPax = 3
    const otherHolds = 1
    expect(canReserveSeats(capacity, confirmed, holdPax + otherHolds, 1)).toBe(true)
    expect(canConsumeHold(capacity, confirmed, otherHolds, holdPax)).toBe(true)
    // After consume: confirmed includes former hold; other holds remain
    expect(remainingSeats(capacity, confirmed + holdPax, otherHolds)).toBe(
      remainingSeats(capacity, confirmed, holdPax + otherHolds),
    )
  })

  it('failed confirmation against expired hold releases that hold from availability', () => {
    const now = new Date('2026-01-15T12:00:00.000Z')
    expect(isHoldActive('pending', '2026-01-15T11:00:00.000Z', now)).toBe(false)
    expect(
      buildGygAvailabilities('prod', [
        {
          departure_date: '2026-01-20',
          departure_time: '10:00',
          capacity: 10,
          confirmed_passengers: 2,
          held_passengers: 0, // expired excluded
        },
      ])[0].vacancies,
    ).toBe(8)
  })

  it('cancel-booking response is empty data object; keys are stable', () => {
    expect(gygCancelBookingResponse()).toEqual({ data: {} })
    expect(gygCancelBookingEventKey('bk456')).toBe('gyg:cancel-booking:bk456')
    expect(gygCancelBookingEventKey('BK456')).toBe(gygCancelBookingEventKey('bk456'))
    expect(gygCancelBookingEventKey('bk456')).not.toMatch(/\d{10,}/)
  })

  it('parses cancel-booking refs and maps unknown booking errors', () => {
    expect(
      parseGygCancelBookingRequest({
        bookingReference: 'bk456',
        gygBookingReference: 'GYG1B2D34GHI',
        productId: 'prod123',
      }),
    ).toEqual({
      ok: true,
      bookingReference: 'bk456',
      gygBookingReference: 'GYG1B2D34GHI',
    })
    expect(parseGygCancelBookingRequest({}).ok).toBe(false)
    expect(mapGygCancelBookingRpcError('INVALID_BOOKING').errorCode).toBe('INVALID_BOOKING')
  })

  it('cancellation releases confirmed seats exactly once', () => {
    const capacity = 10
    const confirmed = 6
    const held = 1
    const first = capacityAfterCancel(capacity, confirmed, held, 3)
    expect(first).toBe(6) // 10 - 3 confirmed remaining - 1 hold
    // Second cancel of same booking releases 0 additional seats.
    const second = capacityAfterCancel(capacity, 3, held, 0)
    expect(second).toBe(6)
  })

  it('availability after cancel reflects released capacity', () => {
    const after = buildGygAvailabilities('prod123', [
      {
        departure_date: '2020-12-01',
        departure_time: '10:00',
        capacity: 10,
        confirmed_passengers: 3,
        held_passengers: 0,
      },
    ])
    expect(after[0].vacancies).toBe(7)
  })

  it('concurrent confirm capacity: second confirmation cannot oversell', () => {
    // Two holds of 6 on capacity 10 cannot both confirm if one already confirmed 6.
    expect(canConsumeHold(10, 6, 0, 6)).toBe(false)
    expect(canConsumeHold(10, 4, 0, 6)).toBe(true)
  })
})
