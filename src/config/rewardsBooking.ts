/**
 * Royal Nordic Rewards — booking discount integration (Phase 2).
 *
 * Production discounts stay OFF until explicitly approved.
 * Set VITE_REWARDS_DISCOUNTS_ENABLED=true (and matching edge secret
 * REWARDS_DISCOUNTS_ENABLED=true) to activate guest discounts.
 */

/** Guest discount percent for eligible direct bookings. */
export const REFERRAL_DISCOUNT_PERCENT = 10

/**
 * Master client switch. Defaults false so production never applies discounts
 * until env is set intentionally.
 */
export function isRewardsDiscountUiEnabled(): boolean {
  const raw = String(import.meta.env.VITE_REWARDS_DISCOUNTS_ENABLED || '')
    .trim()
    .toLowerCase()
  return raw === '1' || raw === 'true' || raw === 'yes'
}

/**
 * Northern Lights products eligible for referral discounts when the flag is on.
 * Configurable seed — mirrored in migration 035 / edge shared module.
 * Excludes: catalogue-sale Guaranteed NL (1), private NL (11), transfers, custom.
 */
export const REFERRAL_ELIGIBLE_TOUR_IDS = new Set<number>([
  8, // Family-Friendly Northern Lights
  10, // Northern Lights Standard Group
])

/** Codes that must never be claimed as personal referral codes. */
export const REFERRAL_BLOCKED_PROMO_CODES = ['WINTER20'] as const

export const REFERRAL_STORAGE_KEY = 'rn_referral_code'
export const REFERRAL_STORAGE_TS_KEY = 'rn_referral_code_ts'
/** First-party attribution window (days). */
export const REFERRAL_ATTRIBUTION_DAYS = 30
