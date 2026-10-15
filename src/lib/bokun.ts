/** Lapland Legacy / Royal Nordic Bókun booking channel (snowmobile) */
export const BOKUN_BOOKING_CHANNEL_UUID = 'e7b35bc6-29d7-4a99-9752-d65807fb20b5'

/** Santa Claus Reindeer partner channel (reindeer rides prototype) */
export const BOKUN_SANTA_CLAUS_REINDEER_CHANNEL_UUID = 'f5e46498-b871-4220-add4-79e160d4d66d'

/** Snowmobile safari experience on the Lapland Legacy booking channel */
export const BOKUN_SNOWMOBILE_EXPERIENCE_ID = '1238416'

/** Santa Claus Reindeer product-list widget id */
export const BOKUN_REINDEER_PRODUCT_LIST_ID = '115161'

export function bokunLoaderSrc(bookingChannelUUID: string): string {
  return `https://widgets.bokun.io/assets/javascripts/apps/build/BokunWidgetsLoader.js?bookingChannelUUID=${bookingChannelUUID}`
}

/** Default loader URL for Lapland Legacy / snowmobile embeds */
export const BOKUN_LOADER_SRC = bokunLoaderSrc(BOKUN_BOOKING_CHANNEL_UUID)

export function bokunExperienceCalendarSrc(
  experienceId: string,
  bookingChannelUUID: string = BOKUN_BOOKING_CHANNEL_UUID,
): string {
  return `https://widgets.bokun.io/online-sales/${bookingChannelUUID}/experience-calendar/${experienceId}`
}

export function bokunProductListSrc(
  productListId: string,
  bookingChannelUUID: string = BOKUN_SANTA_CLAUS_REINDEER_CHANNEL_UUID,
): string {
  return `https://widgets.bokun.io/online-sales/${bookingChannelUUID}/product-list/${productListId}`
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
