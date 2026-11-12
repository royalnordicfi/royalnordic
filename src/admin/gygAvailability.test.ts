import { describe, expect, it } from 'vitest'
import {
  buildGygAvailabilities,
  europeHelsinkiOffset,
  formatGygLocalDateTime,
  gygDateTimeToTourDate,
  normalizeGygActionPath,
  parseGygAvailabilityQuery,
  remainingSeats,
} from './gygAvailability'

describe('GYG availability helpers (1.6A)', () => {
  it('computes remaining seats from confirmed and holds', () => {
    expect(remainingSeats(10, 3, 2)).toBe(5)
    expect(remainingSeats(10, 10, 0)).toBe(0)
    expect(remainingSeats(8, 6, 4)).toBe(0)
    expect(remainingSeats(0, 0, 0)).toBe(0)
    expect(remainingSeats(-1, 2, 0)).toBe(0)
  })

  it('parses official GYG query params into date range', () => {
    const ok = parseGygAvailabilityQuery({
      productId: 'prod123',
      fromDateTime: '2020-12-01T00:00:00+02:00',
      toDateTime: '2020-12-05T23:59:59+02:00',
    })
    expect(ok).toEqual({
      ok: true,
      query: { productId: 'prod123', fromDate: '2020-12-01', toDate: '2020-12-05' },
    })

    expect(
      parseGygAvailabilityQuery({
        productId: '',
        fromDateTime: '2020-12-01T00:00:00+02:00',
        toDateTime: '2020-12-01T23:59:59+02:00',
      }).ok,
    ).toBe(false)

    expect(
      parseGygAvailabilityQuery({
        productId: 'x',
        fromDateTime: '2020-12-05T00:00:00+02:00',
        toDateTime: '2020-12-01T23:59:59+02:00',
      }).ok,
    ).toBe(false)
  })

  it('formats Europe/Helsinki local ISO datetimes with offset', () => {
    // Winter (EET +02)
    expect(formatGygLocalDateTime('2020-12-05', '14:00')).toBe('2020-12-05T14:00:00+02:00')
    // Summer (EEST +03)
    expect(europeHelsinkiOffset('2026-07-15')).toBe('+03:00')
    expect(formatGygLocalDateTime('2026-07-15', '09:30')).toBe('2026-07-15T09:30:00+03:00')
    // Null time → midnight (time-period style / fallback)
    expect(formatGygLocalDateTime('2020-12-05', null)).toBe('2020-12-05T00:00:00+02:00')
    expect(gygDateTimeToTourDate('2020-12-05T14:00:00+02:00')).toBe('2020-12-05')
  })

  it('builds official availabilities including sold-out vacancies:0', () => {
    const slots = buildGygAvailabilities(
      'prod123',
      [
        {
          departure_date: '2020-12-01',
          departure_time: '15:00',
          capacity: 12,
          confirmed_passengers: 0,
          held_passengers: 0,
        },
        {
          departure_date: '2020-12-01',
          departure_time: '10:00',
          capacity: 10,
          confirmed_passengers: 7,
          held_passengers: 3,
        },
      ],
    )

    expect(slots).toEqual([
      { productId: 'prod123', dateTime: '2020-12-01T10:00:00+02:00', vacancies: 0 },
      { productId: 'prod123', dateTime: '2020-12-01T15:00:00+02:00', vacancies: 12 },
    ])
  })

  it('uses mapping defaultDepartureTime when departure_time is null', () => {
    const slots = buildGygAvailabilities(
      'mapped-product',
      [
        {
          departure_date: '2026-01-10',
          departure_time: null,
          capacity: 20,
          confirmed_passengers: 5,
        },
      ],
      { defaultDepartureTime: '17:00' },
    )
    expect(slots[0]).toEqual({
      productId: 'mapped-product',
      dateTime: '2026-01-10T17:00:00+02:00',
      vacancies: 15,
    })
  })

  it('returns empty list for unknown mapping / no departures (caller contract)', () => {
    expect(buildGygAvailabilities('unknown', [])).toEqual([])
  })

  it('normalizes official /1/ path aliases', () => {
    expect(normalizeGygActionPath('gyg/get-availabilities')).toBe('get-availabilities')
    expect(normalizeGygActionPath('gyg/1/get-availabilities')).toBe('get-availabilities')
    expect(normalizeGygActionPath('gyg/1/get-availabilities/')).toBe('get-availabilities')
    expect(normalizeGygActionPath('1/get-availabilities')).toBe('get-availabilities')
    expect(normalizeGygActionPath('gyg/reserve')).toBe('reserve')
  })
})
