/** Shared Bookings foundation — pure helpers (no network). */

export type SharedBoard = 'shared_bus' | 'my_tours'

export type SharedBookingsAccess =
  | {
      ok: true
      access: 'admin'
      boards: SharedBoard[]
      supplier_code: string
      supplier_name: string
      channels_synced: false
    }
  | {
      ok: true
      access: 'supplier'
      boards: SharedBoard[]
      supplier_id: string
      supplier_code: string
      supplier_name: string
      channels_synced: false
    }
  | {
      ok: true
      access: 'none'
      boards: SharedBoard[]
      channels_synced: false
    }
  | { ok: false; error: string; access?: 'none' }

export type SupplierBreakdown = {
  supplier_code: string
  supplier_name: string
  confirmed_passengers: number
}

export type SharedDepartureSummary = {
  id: string
  board: SharedBoard
  departure_date: string
  tour_code: string
  tour_title: string
  departure_time: string | null
  meeting_point: string | null
  capacity: number
  confirmed_passengers: number
  available_seats: number
  supplier_breakdown: SupplierBreakdown[]
  channels_synced: boolean
}

export type SharedPassenger = {
  id: string
  booking_ref: string | null
  external_ref?: string | null
  guest_name: string | null
  adults: number
  children: number
  passenger_count: number
  pickup_location: string | null
  status: 'confirmed' | 'pending' | 'cancelled'
  channel: string
  sync_status: string
  supplier_code: string
  supplier_name: string
  cancelled_at?: string | null
}

/** Fields that must never appear in Elias-facing payloads. */
export const SHARED_BOOKINGS_FORBIDDEN_KEYS = [
  'total_price',
  'adult_price',
  'child_price',
  'commission',
  'customer_email',
  'customer_phone',
  'internal_notes',
  'rn_booking_id',
  'stripe_payment_intent_id',
  'payment_status',
  'payment_type',
] as const

export function occupiedSeatsFromBookings(
  rows: Array<{ status: string; passenger_count: number }>,
): number {
  return rows
    .filter((r) => r.status === 'confirmed')
    .reduce((sum, r) => sum + Math.max(0, Number(r.passenger_count) || 0), 0)
}

export function availableSeats(capacity: number, confirmedPassengers: number): number {
  return Math.max(0, capacity - Math.max(0, confirmedPassengers))
}

export function supplierBreakdownFromBookings(
  rows: Array<{
    status: string
    passenger_count: number
    supplier_code: string
    supplier_name: string
  }>,
): SupplierBreakdown[] {
  const map = new Map<string, SupplierBreakdown>()
  for (const row of rows) {
    if (row.status !== 'confirmed') continue
    const prev = map.get(row.supplier_code)
    const add = Math.max(0, Number(row.passenger_count) || 0)
    if (prev) {
      prev.confirmed_passengers += add
    } else {
      map.set(row.supplier_code, {
        supplier_code: row.supplier_code,
        supplier_name: row.supplier_name,
        confirmed_passengers: add,
      })
    }
  }
  return [...map.values()].sort((a, b) => a.supplier_name.localeCompare(b.supplier_name))
}

export function canAccessBoard(access: SharedBookingsAccess | null | undefined, board: SharedBoard): boolean {
  if (!access || access.ok === false) return false
  if (access.access === 'none') return false
  return access.boards.includes(board)
}

export function canViewSupplierPassengers(
  access: SharedBookingsAccess | null | undefined,
  supplierCode: string,
): boolean {
  if (!access || access.ok === false) return false
  if (access.access === 'admin') return true
  if (access.access === 'supplier') return access.supplier_code === supplierCode
  return false
}

export function filterManifestForAccess(
  passengers: SharedPassenger[],
  access: SharedBookingsAccess | null | undefined,
): SharedPassenger[] {
  if (!access || access.ok === false || access.access === 'none') return []
  if (access.access === 'admin') return passengers
  return passengers.filter((p) => p.supplier_code === access.supplier_code)
}

export function payloadHasForbiddenFields(value: unknown): string[] {
  const found = new Set<string>()
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      if ((SHARED_BOOKINGS_FORBIDDEN_KEYS as readonly string[]).includes(key)) {
        found.add(key)
      }
      walk(child)
    }
  }
  walk(value)
  return [...found].sort()
}

export function channelLabel(channel: string): string {
  switch (channel) {
    case 'royal_nordic_direct':
      return 'Royal Nordic direct'
    case 'royal_nordic_manual':
      return 'Royal Nordic manual'
    case 'royal_nordic_partner':
      return 'Partner'
    case 'elias':
      return 'Elias'
    case 'getyourguide':
      return 'GetYourGuide (not connected)'
    case 'bokun':
      return 'Bókun (not connected)'
    default:
      return channel
  }
}

export function formatDepartureWhen(date: string, time?: string | null): string {
  const d = date || ''
  if (!time) return d
  return `${d} · ${time}`
}

export function syncStatusBanner(channelsSynced: boolean | undefined): string {
  if (channelsSynced) return 'External channels connected'
  return 'Local records only — GetYourGuide / Bókun are not connected yet'
}
