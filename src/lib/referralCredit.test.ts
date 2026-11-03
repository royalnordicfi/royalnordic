/**
 * Run: npx tsx --test src/lib/referralCredit.test.ts
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  creditReverseAmount,
  referralCreditFromPaidCents,
  targetCreditAfterRefund,
} from './referralCredit.ts'

describe('referralCreditFromPaidCents', () => {
  it('returns 10% rounded half-up', () => {
    assert.equal(referralCreditFromPaidCents(180), 18)
    assert.equal(referralCreditFromPaidCents(100), 10)
    assert.equal(referralCreditFromPaidCents(99), 10) // 9.9 → 10
    assert.equal(referralCreditFromPaidCents(94), 9) // 9.4 → 9
    assert.equal(referralCreditFromPaidCents(0), 0)
    assert.equal(referralCreditFromPaidCents(-5), 0)
  })
})

describe('targetCreditAfterRefund', () => {
  it('zeros credit on full refund', () => {
    assert.equal(
      targetCreditAfterRefund({ chargeAmountCents: 180, amountRefundedCents: 180 }),
      0,
    )
  })

  it('shrinks credit on partial refund', () => {
    // Paid 180 → credit 18; refund 90 → net 90 → credit 9
    assert.equal(
      targetCreditAfterRefund({ chargeAmountCents: 180, amountRefundedCents: 90 }),
      9,
    )
  })
})

describe('creditReverseAmount', () => {
  it('reverses only the excess remaining', () => {
    assert.equal(creditReverseAmount({ remainingCents: 18, targetCents: 9 }), 9)
    assert.equal(creditReverseAmount({ remainingCents: 18, targetCents: 0 }), 18)
    assert.equal(creditReverseAmount({ remainingCents: 9, targetCents: 9 }), 0)
  })
})
