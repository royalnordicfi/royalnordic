/** Lapland Legacy / Royal Nordic Bókun booking channel */
export const BOKUN_BOOKING_CHANNEL_UUID = 'e7b35bc6-29d7-4a99-9752-d65807fb20b5'

/** Snowmobile safari experience on the Royal Nordic booking channel */
export const BOKUN_SNOWMOBILE_EXPERIENCE_ID = '1238416'

export const BOKUN_LOADER_SRC = `https://widgets.bokun.io/assets/javascripts/apps/build/BokunWidgetsLoader.js?bookingChannelUUID=${BOKUN_BOOKING_CHANNEL_UUID}`

export function bokunExperienceCalendarSrc(experienceId: string): string {
  return `https://widgets.bokun.io/online-sales/${BOKUN_BOOKING_CHANNEL_UUID}/experience-calendar/${experienceId}`
}

/** Exclusive Royal Nordic promo — must exist in Bókun; applied at checkout */
export const RN_SNOWMOBILE_PROMO = {
  code: 'RN10',
  percent: 10,
  /** Displayed reference prices; Bókun checkout is authoritative */
  adultRegular: 119,
  adultWithCode: 107.1,
  childRegular: 89,
  childWithCode: 80.1,
  privateFrom: 590,
  privateWithCode: 531,
  singleDriverSupplement: 60,
} as const
