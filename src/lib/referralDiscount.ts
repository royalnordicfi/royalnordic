import {
  REFERRAL_DISCOUNT_PERCENT,
  REFERRAL_ELIGIBLE_TOUR_IDS,
  isRewardsDiscountUiEnabled,
} from '../config/rewardsBooking.ts'
import { normalizeReferralCode } from '../rewards/codes.ts'
import { normalizePromoCode } from './winterPromotion.ts'

export type ReferralPricingInput = {
  subtotal: number
  tourId: number
  pricingModel: 'per_person' | 'per_vehicle'
  /** Winter / catalogue promo code entered by guest (not referral). */
  promoCode?: string
  /** Referral code entered or captured from ?ref=. */
  referralCode?: string
  /** When false, referral discount is never applied (server/staging gate). */
  discountsEnabled?: boolean
  /** Server-confirmed: code exists and is active. */
  referralCodeValid?: boolean
  /** Server-confirmed: product is in eligibility table. */
  tourEligible?: boolean
  discountPercent?: number
}

export type ReferralPricingResult = {
  subtotal: number
  referralDiscount: number
  promoDiscount: number
  total: number
  referralApplied: boolean
  promoBlockedByReferral: boolean
  referralBlockedByPromo: boolean
  referralBlockedReason: string | null
}

export function isTourEligibleForReferralDiscount(
  tourId: number,
  eligibleIds: Set<number> = REFERRAL_ELIGIBLE_TOUR_IDS,
): boolean {
  return eligibleIds.has(tourId)
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

export function referralDiscountAmount(
  subtotal: number,
  percent: number = REFERRAL_DISCOUNT_PERCENT,
): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0
  if (!Number.isFinite(percent) || percent <= 0) return 0
  return roundMoney(subtotal * (percent / 100))
}

/**
 * Single source of truth for stacking rules:
 * - No per-vehicle referral discounts
 * - No stacking with WINTER20 / other promo codes
 * - Requires feature flag + valid code + eligible tour
 */
export function computeReferralAwareTotal(input: ReferralPricingInput): ReferralPricingResult {
  const subtotal = roundMoney(Number(input.subtotal) || 0)
  const discountsEnabled = input.discountsEnabled ?? isRewardsDiscountUiEnabled()
  const percent = input.discountPercent ?? REFERRAL_DISCOUNT_PERCENT
  const promo = normalizePromoCode(input.promoCode || '')
  const referral = normalizeReferralCode(input.referralCode || '')
  const hasPromo = Boolean(promo)
  const hasReferral = Boolean(referral)

  const base: ReferralPricingResult = {
    subtotal,
    referralDiscount: 0,
    promoDiscount: 0,
    total: subtotal,
    referralApplied: false,
    promoBlockedByReferral: false,
    referralBlockedByPromo: false,
    referralBlockedReason: null,
  }

  if (!discountsEnabled || !hasReferral) {
    return base
  }

  if (input.pricingModel === 'per_vehicle') {
    return { ...base, referralBlockedReason: 'not_eligible_product' }
  }

  const tourOk =
    input.tourEligible != null
      ? input.tourEligible
      : isTourEligibleForReferralDiscount(input.tourId)
  if (!tourOk) {
    return { ...base, referralBlockedReason: 'not_eligible_product' }
  }

  if (input.referralCodeValid === false) {
    return { ...base, referralBlockedReason: 'invalid_code' }
  }

  if (hasPromo) {
    return {
      ...base,
      referralBlockedByPromo: true,
      referralBlockedReason: 'cannot_stack_with_promo',
    }
  }

  const referralDiscount = referralDiscountAmount(subtotal, percent)
  return {
    subtotal,
    referralDiscount,
    promoDiscount: 0,
    total: roundMoney(subtotal - referralDiscount),
    referralApplied: referralDiscount > 0,
    promoBlockedByReferral: false,
    referralBlockedByPromo: false,
    referralBlockedReason: null,
  }
}

export function validateReferralCheckoutAmount(input: {
  amount: number
  subtotal: number
  discount: number
  discountType: 'none' | 'winter_promo' | 'referral'
  referralCode?: string
  promoCode?: string
  tourId: number
  pricingModel: 'per_person' | 'per_vehicle'
  discountsEnabled: boolean
  referralCodeValid: boolean
  tourEligible: boolean
  winterPromoDiscount: number
}): string | null {
  const amount = Number(input.amount)
  const subtotal = Number(input.subtotal)
  const discount = Number(input.discount) || 0
  if (!Number.isFinite(subtotal) || subtotal < 0) return 'Invalid subtotal'
  if (!Number.isFinite(amount) || amount < 0) return 'Invalid amount'

  if (input.discountType === 'winter_promo') {
    const expected = roundMoney(subtotal - input.winterPromoDiscount)
    if (Math.abs(discount - input.winterPromoDiscount) > 0.02) {
      return 'Discount does not match campaign rules'
    }
    if (Math.abs(amount - expected) > 0.02) {
      return 'Charged amount does not match discount rules'
    }
    if (input.referralCode && normalizeReferralCode(input.referralCode)) {
      return 'Referral and promotional discounts cannot be combined'
    }
    return null
  }

  if (input.discountType === 'referral') {
    const priced = computeReferralAwareTotal({
      subtotal,
      tourId: input.tourId,
      pricingModel: input.pricingModel,
      promoCode: '',
      referralCode: input.referralCode,
      discountsEnabled: input.discountsEnabled,
      referralCodeValid: input.referralCodeValid,
      tourEligible: input.tourEligible,
    })
    if (!priced.referralApplied) {
      return priced.referralBlockedReason || 'Referral discount not allowed'
    }
    if (Math.abs(discount - priced.referralDiscount) > 0.02) {
      return 'Referral discount does not match rules'
    }
    if (Math.abs(amount - priced.total) > 0.02) {
      return 'Charged amount does not match referral pricing'
    }
    return null
  }

  // none
  if (discount > 0.02) return 'Unexpected discount'
  if (Math.abs(amount - subtotal) > 0.02) return 'Charged amount does not match subtotal'
  return null
}

export function privacySafeBookingRef(bookingId: number | string | null | undefined): string {
  if (bookingId == null || bookingId === '') return 'Booking'
  const n = Number(bookingId)
  if (!Number.isFinite(n) || n <= 0) return 'Booking'
  return `RN-${n}`
}
