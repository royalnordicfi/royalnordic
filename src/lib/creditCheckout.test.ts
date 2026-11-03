/**
 * Run: npx tsx --test src/lib/creditCheckout.test.ts
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  cashDueCents,
  clampCreditApplyCents,
  proportionalCreditRestoreCents,
  referralEarnBasisCents,
} from './creditCheckout.ts'

describe('clampCreditApplyCents', () => {
  it('never exceeds available or payable', () => {
    assert.equal(
      clampCreditApplyCents({ requestedCents: 5000, availableCents: 1200, payableCents: 9000 }),
      1200,
    )
    assert.equal(
      clampCreditApplyCents({ requestedCents: 5000, availableCents: 8000, payableCents: 1800 }),
      1800,
    )
  })
})

describe('cashDueCents', () => {
  it('supports partial and full credit', () => {
    assert.equal(cashDueCents(9000, 2000), 7000)
    assert.equal(cashDueCents(9000, 9000), 0)
  })
})

describe('referralEarnBasisCents', () => {
  it('uses cash only', () => {
    assert.equal(referralEarnBasisCents(7000), 7000)
    assert.equal(referralEarnBasisCents(0), 0)
  })
})

describe('proportionalCreditRestoreCents', () => {
  it('restores fully when cash fully refunded', () => {
    assert.equal(
      proportionalCreditRestoreCents({
        creditAppliedCents: 2000,
        alreadyRestoredCents: 0,
        originalCashCents: 7000,
        amountRefundedCents: 7000,
      }),
      2000,
    )
  })

  it('restores proportionally on partial cash refund', () => {
    // 2000 credit, refund half of 7000 cash → restore floor(2000*3500/7000)=1000
    assert.equal(
      proportionalCreditRestoreCents({
        creditAppliedCents: 2000,
        alreadyRestoredCents: 0,
        originalCashCents: 7000,
        amountRefundedCents: 3500,
      }),
      1000,
    )
  })

  it('is idempotent against already restored', () => {
    assert.equal(
      proportionalCreditRestoreCents({
        creditAppliedCents: 2000,
        alreadyRestoredCents: 1000,
        originalCashCents: 7000,
        amountRefundedCents: 3500,
      }),
      0,
    )
  })
})
