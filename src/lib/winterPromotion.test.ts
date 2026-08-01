/**
 * Run: node --experimental-strip-types --test src/lib/winterPromotion.test.ts
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { WinterPromotionConfig } from '../config/winterPromotion.ts'
import {
  getWinterDiscountAmount,
  isCampaignActive,
  isValidWinterPromoCode,
  validateCheckoutDiscount,
} from './winterPromotion.ts'

const base: WinterPromotionConfig = {
  enabled: true,
  campaignVersion: 'test-v1',
  title: 'Test',
  announcementText: 'TEST',
  popupHeading: 'Test',
  popupBody: 'Body',
  discountPercent: 20,
  discountCode: 'WINTER20',
  destinationPath: '/',
  destinationHash: 'tours',
  popupEnabled: true,
  announcementBarEnabled: true,
  popupDelayMs: 4000,
  popupDismissalDays: 7,
  startDate: null,
  endDate: null,
  allToursEligible: false,
}

describe('winterPromotion', () => {
  it('applies 20% for valid WINTER20 when enabled', () => {
    assert.equal(getWinterDiscountAmount(100, 'winter20', base), 20)
    assert.equal(getWinterDiscountAmount(149, 'WINTER20', base), 29.8)
    assert.equal(isValidWinterPromoCode('WINTER20', base), true)
  })

  it('rejects invalid codes and disabled campaign', () => {
    assert.equal(getWinterDiscountAmount(100, 'DECEMBER15', base), 0)
    assert.equal(getWinterDiscountAmount(100, 'WINTER20', { ...base, enabled: false }), 0)
    assert.equal(isCampaignActive({ ...base, enabled: false }), false)
  })

  it('respects end date', () => {
    const ended = { ...base, endDate: '2020-01-01' }
    assert.equal(isCampaignActive(ended, new Date('2026-08-01')), false)
    assert.equal(getWinterDiscountAmount(100, 'WINTER20', ended, new Date('2026-08-01')), 0)
  })

  it('validateCheckoutDiscount accepts matching totals', () => {
    assert.equal(
      validateCheckoutDiscount({
        amount: 80,
        subtotal: 100,
        discount: 20,
        discountCode: 'WINTER20',
        config: base,
      }),
      null
    )
  })

  it('validateCheckoutDiscount rejects fake discounts', () => {
    assert.ok(
      validateCheckoutDiscount({
        amount: 50,
        subtotal: 100,
        discount: 50,
        discountCode: 'WINTER20',
        config: base,
      })
    )
    assert.ok(
      validateCheckoutDiscount({
        amount: 80,
        subtotal: 100,
        discount: 20,
        discountCode: 'FAKE',
        config: base,
      })
    )
  })
})
