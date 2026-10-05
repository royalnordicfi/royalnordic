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
  // Bar advertises the live NL catalogue sale (€129 → €99). Do NOT stack WINTER20 on that product.
  enabled: true,
  campaignVersion: 'nl-sale-99-v1',
  title: 'Northern Lights special',
  announcementText: 'Northern Lights special · Was €129 → now €99',
  popupHeading: 'Northern Lights from €99',
  popupBody:
    'Guaranteed Aurora tour special offer: was €129, now €99 per adult. Book direct — no code needed.',
  discountPercent: 20,
  discountCode: 'WINTER20',
  destinationPath: '/northern-lights-tour',
  destinationHash: 'book',
  popupEnabled: false,
  announcementBarEnabled: true,
  popupDelayMs: 4000,
  popupDismissalDays: 7,
  startDate: null,
  endDate: null,
  allToursEligible: false,
}

/** Tours that already have a catalogue sale or flat vehicle pricing — WINTER20 must not stack. */
export const WINTER20_EXCLUDED_TOUR_IDS = new Set<number>([1, 9])
export const WINTER20_EXCLUDED_TOUR_NAMES = new Set<string>([
  'Guaranteed Northern Lights Tour',
  'Northern Lights Tour',
  'Guaranteed Northern Lights & Photography Tour',
  'Rovaniemi Saariselkä Private Transfer',
  'Rovaniemi ⇄ Saariselkä Private Transfer',
])

/** CSS custom property used to offset the fixed header under the bar */
export const PROMO_BAR_HEIGHT_VAR = '--rn-promo-bar-height'
/** Slim announcement strip — not a second nav bar */
export const PROMO_BAR_HEIGHT_PX = 30
