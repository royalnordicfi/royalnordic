import { describe, expect, it } from 'vitest'
import { remainingSeats } from './gygAvailability'
import {
  buildGygNotifyAvailabilityRequest,
  classifyGygNotifyResponse,
  gygNotifyBackoffMinutes,
  gygNotifyCoalesceKey,
  gygNotifyEnabledFromEnv,
  gygNotifyRequiredSecrets,
  shouldNotifyGygAvailability,
} from './gygAvailabilitySync'

describe('GYG availability sync (1.6D)', () => {
  it('manual booking reduces capacity → notify when crossing official thresholds', () => {
    const capacity = 10
    const before = remainingSeats(capacity, 2, 0) // 8
    const after = remainingSeats(capacity, 5, 0) // 5 (<7, within 60d)
    expect(
      shouldNotifyGygAvailability({
        previousVacancies: before,
        nextVacancies: after,
        departureDate: '2026-11-20',
        today: '2026-11-12',
        sourceChannel: 'royal_nordic_manual',
      }),
    ).toBe(true)
  })

  it('booking cancellation restores capacity and notifies sold-out → available', () => {
    expect(
      shouldNotifyGygAvailability({
        previousVacancies: 0,
        nextVacancies: 4,
        departureDate: '2026-11-20',
        today: '2026-11-12',
        sourceChannel: 'royal_nordic_manual',
      }),
    ).toBe(true)
  })

  it('reservation hold and release follow GYG decrease skip + restore notify', () => {
    // GYG reserve decreases vacancies — official: not necessary to notify
    expect(
      shouldNotifyGygAvailability({
        previousVacancies: 6,
        nextVacancies: 3,
        departureDate: '2026-11-20',
        today: '2026-11-12',
        sourceChannel: 'getyourguide',
      }),
    ).toBe(false)

    // Cancel reservation restores (and may become available from 0)
    expect(
      shouldNotifyGygAvailability({
        previousVacancies: 0,
        nextVacancies: 3,
        departureDate: '2026-11-20',
        today: '2026-11-12',
        sourceChannel: 'getyourguide',
      }),
    ).toBe(true)
  })

  it('departure capacity changes notify when vacancies change meaningfully', () => {
    expect(
      shouldNotifyGygAvailability({
        previousVacancies: 10,
        nextVacancies: 0,
        departureDate: '2026-12-01',
        today: '2026-11-12',
        sourceChannel: 'system',
      }),
    ).toBe(true)
  })

  it('no notification when availability is unchanged', () => {
    expect(
      shouldNotifyGygAvailability({
        previousVacancies: 5,
        nextVacancies: 5,
        departureDate: '2026-11-20',
        today: '2026-11-12',
      }),
    ).toBe(false)
  })

  it('duplicate events coalesce to the same product timeslot key', () => {
    expect(gygNotifyCoalesceKey('prod123', '2020-12-01', '10:00')).toBe('prod123|2020-12-01|10:00')
    expect(gygNotifyCoalesceKey('prod123', '2020-12-01', '10:00')).toBe(
      gygNotifyCoalesceKey('prod123', '2020-12-01', '10:00:00'),
    )
  })

  it('builds official notify payload with current vacancies', () => {
    expect(buildGygNotifyAvailabilityRequest('prod123', '2020-12-01', '10:00', 0)).toEqual({
      data: {
        productId: 'prod123',
        availabilities: [{ dateTime: '2020-12-01T10:00:00+02:00', vacancies: 0 }],
      },
    })
  })

  it('failed notification classifies retry vs terminal errors', () => {
    expect(classifyGygNotifyResponse({ httpStatus: 202 })).toEqual({ ok: true, retryable: false })
    expect(classifyGygNotifyResponse({ httpStatus: 429 }).retryable).toBe(true)
    expect(classifyGygNotifyResponse({ httpStatus: 500 }).retryable).toBe(true)
    expect(
      classifyGygNotifyResponse({
        httpStatus: 400,
        body: { errorCode: 'INVALID_PRODUCT' },
      }),
    ).toMatchObject({ ok: false, retryable: false, error: 'INVALID_PRODUCT' })
    expect(gygNotifyBackoffMinutes(1)).toBe(1)
    expect(gygNotifyBackoffMinutes(2)).toBe(2)
    expect(gygNotifyBackoffMinutes(3)).toBe(4)
    expect(gygNotifyBackoffMinutes(10)).toBe(60)
  })

  it('concurrent inventory changes: latest vacancies win for notify decision', () => {
    // Two overlapping manual bookings: 8 → 5 → 2; notify based on net change vs snapshot
    expect(
      shouldNotifyGygAvailability({
        previousVacancies: 8,
        nextVacancies: 2,
        departureDate: '2026-11-15',
        today: '2026-11-12',
        sourceChannel: 'royal_nordic_manual',
      }),
    ).toBe(true)
  })

  it('keeps outbound notify disabled by default and documents secrets', () => {
    expect(gygNotifyEnabledFromEnv(undefined)).toBe(false)
    expect(gygNotifyEnabledFromEnv('false')).toBe(false)
    expect(gygNotifyEnabledFromEnv('true')).toBe(true)
    expect(gygNotifyRequiredSecrets()).toContain('SHARED_BOOKINGS_GYG_NOTIFY_ENABLED')
  })
})
