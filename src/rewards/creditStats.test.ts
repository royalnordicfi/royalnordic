/**
 * Run: npx tsx --test src/rewards/creditStats.test.ts
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { computeStats } from './creditStats.ts'
import type { ReferralActivity, ReferralAttribution, ReferralCreditBalance, ReferralEarning } from './types.ts'

describe('computeStats with server balance', () => {
  it('prefers balance cache and ignores refunded attributions for success count', () => {
    const balance: ReferralCreditBalance = {
      pending_cents: 500,
      available_cents: 1200,
      lifetime_earned_cents: 2000,
      lifetime_redeemed_cents: 300,
    }
    const attrs: ReferralAttribution[] = [
      {
        id: 'a1',
        referral_code: 'ALEX10',
        booking_id: 1,
        tour_id: 8,
        guest_subtotal_cents: 10000,
        discount_cents: 1000,
        charged_cents: 9000,
        status: 'refunded',
        created_at: '',
      },
      {
        id: 'a2',
        referral_code: 'ALEX10',
        booking_id: 2,
        tour_id: 8,
        guest_subtotal_cents: 10000,
        discount_cents: 1000,
        charged_cents: 9000,
        status: 'confirmed',
        created_at: '',
      },
    ]
    const acts: ReferralActivity[] = [
      {
        id: 'x',
        referrer_user_id: 'u',
        event_type: 'booking_attributed',
        amount_cents: 1000,
        metadata: { status: 'confirmed', booking_ref: 'RN-1' },
        created_at: '',
      },
    ]
    const stats = computeStats(balance, [], attrs, acts)
    assert.equal(stats.pendingCents, 500)
    assert.equal(stats.availableCents, 1200)
    assert.equal(stats.totalEarnedCents, 2000)
    assert.equal(stats.redeemedCents, 300)
    assert.equal(stats.successfulReferrals, 1)
  })

  it('does not count refunded-only history as successful via activity leftover', () => {
    const attrs: ReferralAttribution[] = [
      {
        id: 'a1',
        referral_code: 'ALEX10',
        booking_id: 1,
        tour_id: 8,
        guest_subtotal_cents: 200,
        discount_cents: 20,
        charged_cents: 180,
        status: 'refunded',
        created_at: '',
      },
    ]
    const acts: ReferralActivity[] = [
      {
        id: '1',
        referrer_user_id: 'u',
        event_type: 'booking_attributed',
        amount_cents: 20,
        metadata: { status: 'confirmed' },
        created_at: '',
      },
      {
        id: '2',
        referrer_user_id: 'u',
        event_type: 'booking_attributed',
        amount_cents: null,
        metadata: { status: 'refunded' },
        created_at: '',
      },
    ]
    const stats = computeStats(null, [] as ReferralEarning[], attrs, acts)
    assert.equal(stats.successfulReferrals, 0)
  })
})
