/**
 * Run: npx tsx --test src/lib/referralDiscount.test.ts
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  computeReferralAwareTotal,
  privacySafeBookingRef,
  referralDiscountAmount,
  validateReferralCheckoutAmount,
} from './referralDiscount.ts'

describe('referralDiscountAmount', () => {
  it('applies 10% rounded to cents', () => {
    assert.equal(referralDiscountAmount(99), 9.9)
    assert.equal(referralDiscountAmount(100), 10)
  })
})

describe('computeReferralAwareTotal', () => {
  it('applies referral when enabled and eligible', () => {
    const r = computeReferralAwareTotal({
      subtotal: 200,
      tourId: 8,
      pricingModel: 'per_person',
      referralCode: 'ALEX10',
      discountsEnabled: true,
      referralCodeValid: true,
      tourEligible: true,
    })
    assert.equal(r.referralApplied, true)
    assert.equal(r.referralDiscount, 20)
    assert.equal(r.total, 180)
  })

  it('blocks stacking with promo', () => {
    const r = computeReferralAwareTotal({
      subtotal: 200,
      tourId: 8,
      pricingModel: 'per_person',
      referralCode: 'ALEX10',
      promoCode: 'WINTER20',
      discountsEnabled: true,
      referralCodeValid: true,
      tourEligible: true,
    })
    assert.equal(r.referralApplied, false)
    assert.equal(r.referralBlockedByPromo, true)
    assert.equal(r.total, 200)
  })

  it('blocks when feature flag off', () => {
    const r = computeReferralAwareTotal({
      subtotal: 200,
      tourId: 8,
      pricingModel: 'per_person',
      referralCode: 'ALEX10',
      discountsEnabled: false,
      referralCodeValid: true,
      tourEligible: true,
    })
    assert.equal(r.referralApplied, false)
    assert.equal(r.total, 200)
  })

  it('blocks per-vehicle and ineligible tours', () => {
    assert.equal(
      computeReferralAwareTotal({
        subtotal: 849,
        tourId: 9,
        pricingModel: 'per_vehicle',
        referralCode: 'ALEX10',
        discountsEnabled: true,
        referralCodeValid: true,
        tourEligible: false,
      }).referralBlockedReason,
      'not_eligible_product',
    )
    assert.equal(
      computeReferralAwareTotal({
        subtotal: 99,
        tourId: 1,
        pricingModel: 'per_person',
        referralCode: 'ALEX10',
        discountsEnabled: true,
        referralCodeValid: true,
        tourEligible: false,
      }).referralApplied,
      false,
    )
  })
})

describe('validateReferralCheckoutAmount', () => {
  it('accepts matching referral totals', () => {
    const err = validateReferralCheckoutAmount({
      amount: 180,
      subtotal: 200,
      discount: 20,
      discountType: 'referral',
      referralCode: 'ALEX10',
      tourId: 8,
      pricingModel: 'per_person',
      discountsEnabled: true,
      referralCodeValid: true,
      tourEligible: true,
      winterPromoDiscount: 0,
    })
    assert.equal(err, null)
  })

  it('rejects mismatched charged amount', () => {
    const err = validateReferralCheckoutAmount({
      amount: 150,
      subtotal: 200,
      discount: 20,
      discountType: 'referral',
      referralCode: 'ALEX10',
      tourId: 8,
      pricingModel: 'per_person',
      discountsEnabled: true,
      referralCodeValid: true,
      tourEligible: true,
      winterPromoDiscount: 0,
    })
    assert.match(String(err), /match/i)
  })

  it('rejects winter promo + referral code', () => {
    const err = validateReferralCheckoutAmount({
      amount: 160,
      subtotal: 200,
      discount: 40,
      discountType: 'winter_promo',
      referralCode: 'ALEX10',
      promoCode: 'WINTER20',
      tourId: 8,
      pricingModel: 'per_person',
      discountsEnabled: true,
      referralCodeValid: true,
      tourEligible: true,
      winterPromoDiscount: 40,
    })
    assert.match(String(err), /cannot be combined/i)
  })
})

describe('privacySafeBookingRef', () => {
  it('never exposes guest identity', () => {
    assert.equal(privacySafeBookingRef(42), 'RN-42')
    assert.equal(privacySafeBookingRef(null), 'Booking')
  })
})
