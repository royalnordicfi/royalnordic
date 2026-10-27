import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  BOOKING_DRAFT_VERSION,
  checkoutPathFromDraft,
  computeBookingSubtotal,
  isBookingDraft,
  type BookingDraft,
} from './bookingDraft.ts'

const sample: BookingDraft = {
  v: BOOKING_DRAFT_VERSION,
  createdAt: '2026-10-27T12:00:00.000Z',
  returnPath: '/northern-lights-standard-group#book',
  tourId: 10,
  tourName: 'Northern Lights Standard Group – 100% Guarantee',
  tourDateId: 33105,
  tourDateIso: '2026-11-01',
  adults: 2,
  children: 1,
  pricingModel: 'per_person',
  adultPrice: 60,
  childPrice: 60,
}

describe('bookingDraft', () => {
  it('prices per person and per vehicle correctly', () => {
    assert.equal(computeBookingSubtotal('per_person', 2, 1, 60, 60), 180)
    assert.equal(computeBookingSubtotal('per_vehicle', 4, 2, 849, 0), 849)
  })

  it('validates draft shape', () => {
    assert.equal(isBookingDraft(sample), true)
    assert.equal(isBookingDraft({ ...sample, v: 0 }), false)
    assert.equal(isBookingDraft(null), false)
  })

  it('builds a checkout path without PII', () => {
    assert.equal(
      checkoutPathFromDraft(sample),
      '/checkout?tour=10&date=2026-11-01&dateId=33105&a=2&c=1',
    )
    assert.equal(
      checkoutPathFromDraft({ ...sample, pricingModel: 'per_vehicle', children: 0 }),
      '/checkout?tour=10&date=2026-11-01&dateId=33105&a=2&c=0&pm=per_vehicle',
    )
  })
})
