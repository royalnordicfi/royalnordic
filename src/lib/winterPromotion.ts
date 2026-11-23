import {
  PROMO_BAR_HEIGHT_PX,
  PROMO_BAR_HEIGHT_VAR,
  WINTER20_EXCLUDED_TOUR_IDS,
  WINTER20_EXCLUDED_TOUR_NAMES,
  WINTER_PROMOTION,
  type WinterPromotionConfig,
} from '../config/winterPromotion.ts'

export type { WinterPromotionConfig }

const STORAGE_PREFIX = 'rn_promo_dismissed_'

export function getWinterPromotionConfig(): WinterPromotionConfig {
  return WINTER_PROMOTION
}

export function isWithinCampaignWindow(
  config: WinterPromotionConfig = WINTER_PROMOTION,
  now: Date = new Date()
): boolean {
  if (config.startDate) {
    const start = new Date(`${config.startDate}T00:00:00.000Z`)
    if (now < start) return false
  }
  if (config.endDate) {
    const end = new Date(`${config.endDate}T23:59:59.999Z`)
    if (now > end) return false
  }
  return true
}

export function isCampaignActive(
  config: WinterPromotionConfig = WINTER_PROMOTION,
  now: Date = new Date()
): boolean {
  return config.enabled && isWithinCampaignWindow(config, now)
}

export function isAnnouncementBarActive(
  config: WinterPromotionConfig = WINTER_PROMOTION,
  now: Date = new Date()
): boolean {
  return isCampaignActive(config, now) && config.announcementBarEnabled
}

export function isPopupCampaignActive(
  config: WinterPromotionConfig = WINTER_PROMOTION,
  now: Date = new Date()
): boolean {
  return isCampaignActive(config, now) && config.popupEnabled
}

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase()
}

export const ALREADY_DISCOUNTED_PROMO_MESSAGE =
  'This tour already has a special offer. Additional discount codes cannot be combined.'

export type WinterPromoApplyOpts = {
  tourId?: number
  tourName?: string
  /** Live catalogue sale (reference_price > adult_price with sale_enabled). */
  hasCatalogueSale?: boolean
  /** Flat per-vehicle / private group fares never take guest codes. */
  pricingModel?: 'per_person' | 'per_vehicle' | string
}

export function isTourExcludedFromWinterPromo(
  tourId?: number,
  tourName?: string,
  opts?: Pick<WinterPromoApplyOpts, 'hasCatalogueSale' | 'pricingModel'>,
): boolean {
  if (opts?.pricingModel === 'per_vehicle') return true
  if (opts?.hasCatalogueSale) return true
  if (tourId != null && WINTER20_EXCLUDED_TOUR_IDS.has(tourId)) return true
  if (tourName && WINTER20_EXCLUDED_TOUR_NAMES.has(tourName)) return true
  return false
}

export type WinterPromoEval =
  | { status: 'empty'; discount: 0; message: '' }
  | { status: 'applied'; discount: number; message: string; code: string }
  | { status: 'ineligible'; discount: 0; message: string }
  | { status: 'inactive'; discount: 0; message: string }
  | { status: 'invalid'; discount: 0; message: string }

/** Evaluate a guest-entered code for UI feedback. Server still re-validates. */
export function evaluateWinterPromoCode(
  code: string,
  subtotal: number,
  config: WinterPromotionConfig = WINTER_PROMOTION,
  now: Date = new Date(),
  opts?: WinterPromoApplyOpts,
): WinterPromoEval {
  const normalized = normalizePromoCode(code)
  if (!normalized) return { status: 'empty', discount: 0, message: '' }

  if (isTourExcludedFromWinterPromo(opts?.tourId, opts?.tourName, opts)) {
    return { status: 'ineligible', discount: 0, message: ALREADY_DISCOUNTED_PROMO_MESSAGE }
  }
  if (!isCampaignActive(config, now)) {
    return {
      status: 'inactive',
      discount: 0,
      message: 'This discount code is not active or has expired.',
    }
  }
  if (normalized !== normalizePromoCode(config.discountCode)) {
    return {
      status: 'invalid',
      discount: 0,
      message: 'Invalid discount code. Check the spelling and try again.',
    }
  }
  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return { status: 'invalid', discount: 0, message: 'Unable to apply a discount to this total.' }
  }
  const discount = Math.round(subtotal * (config.discountPercent / 100) * 100) / 100
  return {
    status: 'applied',
    discount,
    code: normalized,
    message: `${config.discountCode} applied − ${config.discountPercent}% off`,
  }
}

export function isValidWinterPromoCode(
  code: string,
  config: WinterPromotionConfig = WINTER_PROMOTION,
  now: Date = new Date(),
  opts?: WinterPromoApplyOpts,
): boolean {
  return evaluateWinterPromoCode(code, 100, config, now, opts).status === 'applied'
}

/** Discount amount in euros for a subtotal. Only one promo; no stacking. */
export function getWinterDiscountAmount(
  subtotal: number,
  code: string,
  config: WinterPromotionConfig = WINTER_PROMOTION,
  now: Date = new Date(),
  opts?: WinterPromoApplyOpts,
): number {
  const result = evaluateWinterPromoCode(code, subtotal, config, now, opts)
  return result.status === 'applied' ? result.discount : 0
}

export function getExpectedTotalAfterPromo(
  subtotal: number,
  code: string,
  config: WinterPromotionConfig = WINTER_PROMOTION,
  now: Date = new Date()
): number {
  const discount = getWinterDiscountAmount(subtotal, code, config, now)
  return Math.round((subtotal - discount) * 100) / 100
}

export function dismissalStorageKey(
  config: WinterPromotionConfig = WINTER_PROMOTION
): string {
  return `${STORAGE_PREFIX}${config.campaignVersion}`
}

export function isPopupDismissed(
  config: WinterPromotionConfig = WINTER_PROMOTION,
  now: Date = new Date()
): boolean {
  try {
    const raw = localStorage.getItem(dismissalStorageKey(config))
    if (!raw) return false
    const until = Number(raw)
    if (!Number.isFinite(until)) return false
    return now.getTime() < until
  } catch {
    return false
  }
}

export function dismissPopup(
  config: WinterPromotionConfig = WINTER_PROMOTION,
  now: Date = new Date()
): void {
  try {
    const until =
      now.getTime() + config.popupDismissalDays * 24 * 60 * 60 * 1000
    localStorage.setItem(dismissalStorageKey(config), String(until))
    sessionStorage.setItem(dismissalStorageKey(config), '1')
  } catch {
    try {
      sessionStorage.setItem(dismissalStorageKey(config), '1')
    } catch {
      // ignore
    }
  }
}

export function wasPopupDismissedThisSession(
  config: WinterPromotionConfig = WINTER_PROMOTION
): boolean {
  try {
    return sessionStorage.getItem(dismissalStorageKey(config)) === '1'
  } catch {
    return false
  }
}

export function markCodeAppliedThisSession(
  config: WinterPromotionConfig = WINTER_PROMOTION
): void {
  try {
    sessionStorage.setItem(`rn_promo_applied_${config.campaignVersion}`, '1')
  } catch {
    // ignore
  }
}

export function wasCodeAppliedThisSession(
  config: WinterPromotionConfig = WINTER_PROMOTION
): boolean {
  try {
    return sessionStorage.getItem(`rn_promo_applied_${config.campaignVersion}`) === '1'
  } catch {
    return false
  }
}

export function setPromoBarCssVar(active: boolean): void {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty(
    PROMO_BAR_HEIGHT_VAR,
    active ? `${PROMO_BAR_HEIGHT_PX}px` : '0px'
  )
}

export function getPromoDestination(config: WinterPromotionConfig = WINTER_PROMOTION): {
  pathname: string
  hash: string
} {
  return {
    pathname: config.destinationPath || '/',
    hash: config.destinationHash ? `#${config.destinationHash.replace(/^#/, '')}` : '',
  }
}

export function eligibilityCopy(config: WinterPromotionConfig = WINTER_PROMOTION): string {
  if (config.allToursEligible) {
    return `Save ${config.discountPercent}% on all tours with code ${config.discountCode}.`
  }
  return `Save ${config.discountPercent}% on eligible winter tours with code ${config.discountCode}.`
}

type PromoAnalyticsEvent =
  | 'winter20_popup_viewed'
  | 'winter20_popup_dismissed'
  | 'winter20_popup_cta_clicked'
  | 'winter20_bar_clicked'
  | 'winter20_code_copied'
  | 'winter20_booking_started'
  | 'winter20_code_applied'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export function trackWinterPromoEvent(
  event: PromoAnalyticsEvent,
  params?: Record<string, string | number | boolean>
): void {
  try {
    if (typeof window === 'undefined') return
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event, ...params })
    if (typeof window.gtag === 'function') {
      window.gtag('event', event, params)
    }
  } catch {
    // analytics must never break UX
  }
}

/**
 * Server-side / shared validation helper for checkout amounts.
 * Returns null when the charged amount matches the expected promo rules.
 */
export function validateCheckoutDiscount(input: {
  amount: number
  subtotal: number
  discount: number
  discountCode: string
  config?: WinterPromotionConfig
  now?: Date
  tourId?: number
  tourName?: string
  hasCatalogueSale?: boolean
  pricingModel?: string
}): string | null {
  const config = input.config ?? WINTER_PROMOTION
  const now = input.now ?? new Date()
  const subtotal = Number(input.subtotal)
  const amount = Number(input.amount)
  const claimedDiscount = Number(input.discount) || 0
  const code = input.discountCode || ''
  const opts: WinterPromoApplyOpts = {
    tourId: input.tourId,
    tourName: input.tourName,
    hasCatalogueSale: input.hasCatalogueSale,
    pricingModel: input.pricingModel,
  }

  if (!Number.isFinite(subtotal) || subtotal < 0) return 'Invalid subtotal'
  if (!Number.isFinite(amount) || amount < 0) return 'Invalid amount'

  const expectedDiscount = getWinterDiscountAmount(subtotal, code, config, now, opts)
  const expectedTotal = Math.round((subtotal - expectedDiscount) * 100) / 100

  if (Math.abs(claimedDiscount - expectedDiscount) > 0.02) {
    if (claimedDiscount > 0.02 && isTourExcludedFromWinterPromo(opts.tourId, opts.tourName, opts)) {
      return ALREADY_DISCOUNTED_PROMO_MESSAGE
    }
    return 'Discount does not match campaign rules'
  }
  if (Math.abs(amount - expectedTotal) > 0.02) {
    return 'Charged amount does not match discount rules'
  }
  return null
}
