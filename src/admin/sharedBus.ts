/**
 * Shared Bookings scope lock — Standard Group Northern Lights bus only.
 * Royal Nordic + Elias share one departure capacity (50 @ 20:00).
 */

export const SHARED_BUS_TEMPLATE_CODE = 'standard_group_northern_lights'
export const SHARED_BUS_TEMPLATE_TITLE = 'Standard Group Northern Lights'
export const SHARED_BUS_DEPARTURE_TIME = '20:00'
export const SHARED_BUS_CAPACITY = 50
export const SHARED_BUS_MEETING_POINT = 'Ruokasenkatu 3, 96100 Rovaniemi, Finland'
export const SHARED_BUS_CATEGORY = 'shared_bus' as const
export const SHARED_BUS_GYG_SUPPLIER_CODE = 'royal_nordic'

/** Titles that belong on the shared bus (excludes Guaranteed / small / private / Korouoma). */
export function isSharedBusTourTitle(title?: string | null): boolean {
  const t = String(title || '')
  if (!/standard\s+group/i.test(t)) return false
  if (/guaranteed/i.test(t)) return false
  if (/small\s+group/i.test(t)) return false
  if (/korouoma/i.test(t)) return false
  if (/private/i.test(t)) return false
  return true
}

export function sharedBusMappingDefaults() {
  return {
    templateCode: SHARED_BUS_TEMPLATE_CODE,
    templateTitle: SHARED_BUS_TEMPLATE_TITLE,
    defaultDepartureTime: SHARED_BUS_DEPARTURE_TIME,
    capacity: SHARED_BUS_CAPACITY,
    supplierCode: SHARED_BUS_GYG_SUPPLIER_CODE,
    isActiveDefault: false as const,
  }
}
