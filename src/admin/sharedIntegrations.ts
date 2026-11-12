/** Pure Shared Bookings external integration helpers (no network). */

export type SharedIntegrationProvider = 'getyourguide' | 'bokun'

export type SharedConnectorStatus =
  | 'credentials_required'
  | 'credentials_present'
  | 'mappings_required'
  | 'ready'
  | 'error'

export type SharedConnectorRow = {
  provider: SharedIntegrationProvider
  display_name: string
  ingestion_enabled: boolean
  config_status: SharedConnectorStatus
  last_success_at: string | null
  last_error_at: string | null
  last_error: string | null
  notes: string | null
  mapping_count: number
  open_event_count: number
}

export type SharedProductMapping = {
  id: string
  provider: SharedIntegrationProvider
  external_product_id: string
  external_option_id: string | null
  template_id: string | null
  template_title?: string | null
  supplier_id: string
  supplier_code: string
  supplier_name: string
  default_departure_time: string | null
  adult_categories: string[]
  child_categories: string[]
  is_active: boolean
}

export type SharedInboundEvent = {
  id: string
  provider: SharedIntegrationProvider
  event_key: string
  topic: string
  external_booking_id: string | null
  status: string
  error_code: string | null
  error_message: string | null
  departure_id: string | null
  booking_id: string | null
  attempt_count: number
  processed_at: string | null
  created_at: string
  updated_at: string
}

export const GYG_ADULT_CATEGORIES = ['ADULT', 'SENIOR', 'YOUTH', 'STUDENT'] as const
export const GYG_CHILD_CATEGORIES = ['CHILD', 'INFANT'] as const

export function countGygSeatCategories(
  items: Array<{ category?: string; count?: number }>,
  adultCategories: readonly string[] = GYG_ADULT_CATEGORIES,
  childCategories: readonly string[] = GYG_CHILD_CATEGORIES,
): { adults: number; children: number; total: number } {
  let adults = 0
  let children = 0
  for (const item of items) {
    const cat = String(item.category || '').toUpperCase()
    const count = Math.max(0, Number(item.count) || 0)
    if (childCategories.map((c) => c.toUpperCase()).includes(cat)) children += count
    else adults += count
  }
  return { adults, children, total: adults + children }
}

export function parseGygDateTime(dateTime: string): { date?: string; time?: string } {
  const m = dateTime.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  if (!m) return {}
  return { date: m[1], time: m[2] === '00:00' ? undefined : m[2] }
}

/** Build Bókun webhook HMAC base string per official docs. */
export function bokunHmacBaseString(
  headers: Record<string, string>,
): string {
  const pairs = Object.entries(headers)
    .map(([k, v]) => [k.toLowerCase(), v] as const)
    .filter(([k]) => k.startsWith('x-bokun-') && k !== 'x-bokun-hmac')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
  return pairs.join('&')
}

export function connectorStatusLabel(status: SharedConnectorStatus): string {
  switch (status) {
    case 'credentials_required':
      return 'Credentials required'
    case 'credentials_present':
      return 'Credentials present'
    case 'mappings_required':
      return 'Product mappings required'
    case 'ready':
      return 'Ready'
    case 'error':
      return 'Error'
    default:
      return status
  }
}

export function requiredSecretsFor(provider: SharedIntegrationProvider): string[] {
  if (provider === 'getyourguide') {
    return [
      'SHARED_BOOKINGS_GYG_BASIC_USER',
      'SHARED_BOOKINGS_GYG_BASIC_PASSWORD',
      'SHARED_BOOKINGS_GYG_INGESTION_ENABLED',
    ]
  }
  return [
    'SHARED_BOOKINGS_BOKUN_WEBHOOK_SECRET',
    'SHARED_BOOKINGS_BOKUN_INGESTION_ENABLED',
  ]
}

export function externalEndpointPaths(provider: SharedIntegrationProvider): string[] {
  if (provider === 'getyourguide') {
    return [
      // Official Supplier API version prefix /1/ is accepted via path normalization.
      '/functions/v1/shared-bookings-external/gyg/1/get-availabilities',
      '/functions/v1/shared-bookings-external/gyg/get-availabilities',
      '/functions/v1/shared-bookings-external/gyg/reserve',
      '/functions/v1/shared-bookings-external/gyg/cancel-reservation',
      '/functions/v1/shared-bookings-external/gyg/book',
      '/functions/v1/shared-bookings-external/gyg/cancel-booking',
    ]
  }
  return ['/functions/v1/shared-bookings-external/bokun/webhook']
}
