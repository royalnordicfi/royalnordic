/** Edge mirror of src/lib/referralDiscount.ts + src/config/rewardsBooking.ts */

export const REFERRAL_DISCOUNT_PERCENT = 10

/** Fallback if referral_eligible_tours table is empty / unreachable */
export const REFERRAL_ELIGIBLE_TOUR_IDS_FALLBACK = new Set<number>([8, 10])

export function rewardsDiscountsEnabledFromEnv(): boolean {
  const raw = String(Deno.env.get('REWARDS_DISCOUNTS_ENABLED') || '')
    .trim()
    .toLowerCase()
  return raw === '1' || raw === 'true' || raw === 'yes'
}

export function normalizeReferralCode(raw: string): string {
  return String(raw || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

export function referralDiscountAmount(
  subtotal: number,
  percent: number = REFERRAL_DISCOUNT_PERCENT,
): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0
  return roundMoney(subtotal * (percent / 100))
}

export function computeReferralDiscount(input: {
  subtotal: number
  tourId: number
  pricingModel: string
  referralCode: string
  promoCode: string
  discountsEnabled: boolean
  codeValid: boolean
  tourEligible: boolean
  percent?: number
}): { discount: number; error: string | null } {
  const subtotal = roundMoney(input.subtotal)
  const referral = normalizeReferralCode(input.referralCode)
  const promo = String(input.promoCode || '').trim().toUpperCase()

  if (!input.discountsEnabled || !referral) {
    return { discount: 0, error: null }
  }
  if (input.pricingModel === 'per_vehicle') {
    return { discount: 0, error: 'Referral discounts are not available for this product' }
  }
  if (!input.tourEligible) {
    return { discount: 0, error: 'This experience is not eligible for referral discounts' }
  }
  if (!input.codeValid) {
    return { discount: 0, error: 'Invalid referral code' }
  }
  if (promo) {
    return { discount: 0, error: 'Referral and promotional discounts cannot be combined' }
  }
  return {
    discount: referralDiscountAmount(subtotal, input.percent ?? REFERRAL_DISCOUNT_PERCENT),
    error: null,
  }
}
