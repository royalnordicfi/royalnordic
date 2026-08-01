/**
 * Central configuration for the direct-booking winter promotion.
 * Disable or edit the campaign here only — UI and booking discount read from this file.
 *
 * To turn the campaign off: set `enabled: false`.
 */
export type WinterPromotionConfig = {
  /** Master switch for the entire campaign */
  enabled: boolean
  /** Bump when launching a new campaign so dismissed visitors can see it again */
  campaignVersion: string
  title: string
  /** Short line used in the announcement bar */
  announcementText: string
  /** Popup heading */
  popupHeading: string
  /** Popup body copy */
  popupBody: string
  discountPercent: number
  discountCode: string
  /** SPA path for BOOK NOW (homepage tours section) */
  destinationPath: string
  destinationHash: string
  popupEnabled: boolean
  announcementBarEnabled: boolean
  /** Delay before first popup show (ms) */
  popupDelayMs: number
  /** How long dismissal persists in localStorage (days) */
  popupDismissalDays: number
  /** ISO date string (inclusive start of day UTC) or null */
  startDate: string | null
  /** ISO date string (inclusive end of day UTC) or null for no end */
  endDate: string | null
  /**
   * When true, customer-facing copy may say “all tours”.
   * Keep false unless every bookable product is confirmed eligible.
   */
  allToursEligible: boolean
}

export const WINTER_PROMOTION: WinterPromotionConfig = {
  enabled: true,
  campaignVersion: 'winter20-v1',
  title: 'Winter Booking Offer',
  announcementText:
    'LIMITED TIME • SAVE 20% ON WINTER TOURS • USE CODE WINTER20 • BOOK DIRECT',
  popupHeading: 'Save 20% on Your Winter Adventure',
  popupBody:
    'Book directly through RoyalNordic.fi and save 20% on eligible tours with code WINTER20.',
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
  // BookingForm products (NL, family NL, ice fishing, Ranua, Korouoma, snowshoe).
  // Inquiry-only products (customized, transfers) do not use this checkout discount field.
  allToursEligible: false,
}

/** CSS custom property used to offset the fixed header under the bar */
export const PROMO_BAR_HEIGHT_VAR = '--rn-promo-bar-height'
export const PROMO_BAR_HEIGHT_PX = 32
