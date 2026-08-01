import {
  PROMO_BAR_HEIGHT_PX,
  PROMO_BAR_HEIGHT_VAR,
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

export function isValidWinterPromoCode(
  code: string,
  config: WinterPromotionConfig = WINTER_PROMOTION,
  now: Date = new Date()
): boolean {
  if (!isCampaignActive(config, now)) return false
  return normalizePromoCode(code) === normalizePromoCode(config.discountCode)
}

/** Discount amount in euros for a subtotal. Only one promo; no stacking. */
export function getWinterDiscountAmount(
  subtotal: number,
  code: string,
  config: WinterPromotionConfig = WINTER_PROMOTION,
  now: Date = new Date()
): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0
  if (!isValidWinterPromoCode(code, config, now)) return 0
  const raw = subtotal * (config.discountPercent / 100)
  return Math.round(raw * 100) / 100
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
}): string | null {
  const config = input.config ?? WINTER_PROMOTION
  const now = input.now ?? new Date()
  const subtotal = Number(input.subtotal)
  const amount = Number(input.amount)
  const claimedDiscount = Number(input.discount) || 0
  const code = input.discountCode || ''

  if (!Number.isFinite(subtotal) || subtotal < 0) return 'Invalid subtotal'
  if (!Number.isFinite(amount) || amount < 0) return 'Invalid amount'

  const expectedDiscount = getWinterDiscountAmount(subtotal, code, config, now)
  const expectedTotal = getExpectedTotalAfterPromo(subtotal, code, config, now)

  if (Math.abs(claimedDiscount - expectedDiscount) > 0.02) {
    return 'Discount does not match campaign rules'
  }
  if (Math.abs(amount - expectedTotal) > 0.02) {
    return 'Charged amount does not match discount rules'
  }
  return null
}
