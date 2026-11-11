/** Shared Bookings foundation — pure helpers (no network). */

export type SharedBoard = 'shared_bus' | 'my_tours'

export type SharedBookingsAccess =
  | {
      ok: true
      access: 'admin'
      boards: SharedBoard[]
      supplier_code: string
      supplier_name: string
      must_change_password: boolean
      channels_synced: false
    }
  | {
      ok: true
      access: 'supplier'
      boards: SharedBoard[]
      supplier_id: string
      supplier_code: string
      supplier_name: string
      operator_id?: string
      must_change_password: boolean
      channels_synced: false
    }
  | {
      ok: true
      access: 'none'
      boards: SharedBoard[]
      must_change_password?: boolean
      channels_synced: false
    }
  | { ok: false; error: string; access?: 'none' }

export type SharedOperatorRow = {
  id: string
  user_id: string
  email: string | null
  display_name: string | null
  is_active: boolean
  must_change_password: boolean
  password_changed_at: string | null
  supplier_id: string
  supplier_code: string
  supplier_name: string
  created_at: string
}

export type SharedSupplierOption = {
  id: string
  code: string
  display_name: string
  is_active: boolean
}

export type SupplierBreakdown = {
  supplier_code: string
  supplier_name: string
  confirmed_passengers: number
}

export type SharedDepartureStatus = 'active' | 'cancelled'

export type SharedTourTemplate = {
  id: string
  code: string
  title: string
  category: SharedBoard
  meeting_point: string | null
  default_capacity: number
  default_departure_time: string | null
  is_active: boolean
  created_at?: string
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
  status?: SharedDepartureStatus
  template_id?: string | null
  confirmed_passengers: number
  available_seats: number
  supplier_breakdown: SupplierBreakdown[]
  channels_synced: boolean
}

export type SharedCalendarView = 'month' | 'week' | 'day'

export type SharedPassenger = {
  id: string
  booking_ref: string | null
  external_ref?: string | null
  guest_name: string | null
  adults: number
  children: number
  passenger_count: number
  pickup_location: string | null
  contact_email?: string | null
  contact_phone?: string | null
  notes?: string | null
  status: 'confirmed' | 'pending' | 'cancelled'
  channel: string
  sync_status: string
  supplier_code: string
  supplier_name: string
  cancelled_at?: string | null
}

export type SharedBookingInput = {
  guest_name: string
  adults: number
  children: number
  booking_ref?: string
  pickup_location?: string
  contact_email?: string
  contact_phone?: string
  notes?: string
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

/** Capacity must stay at or above confirmed occupancy. */
export function canSetCapacity(capacity: number, confirmedPassengers: number): boolean {
  const cap = Number(capacity)
  const occ = Math.max(0, Number(confirmedPassengers) || 0)
  return Number.isFinite(cap) && cap >= 1 && cap >= occ
}

export function occupancyTone(
  confirmed: number,
  capacity: number,
): 'green' | 'amber' | 'red' | 'zinc' {
  if (capacity <= 0) return 'zinc'
  const ratio = confirmed / capacity
  if (confirmed >= capacity) return 'red'
  if (ratio >= 0.8) return 'amber'
  if (confirmed > 0) return 'green'
  return 'zinc'
}

export function occupancyLabel(confirmed: number, capacity: number, available: number): string {
  return `${confirmed}/${capacity} · ${available} left`
}

export function normalizePassengerCounts(adults: number, children: number): {
  adults: number
  children: number
  passenger_count: number
  ok: boolean
  error?: string
} {
  const a = Math.max(0, Math.floor(Number(adults) || 0))
  const c = Math.max(0, Math.floor(Number(children) || 0))
  const passenger_count = a + c
  if (passenger_count < 1) {
    return { adults: a, children: c, passenger_count, ok: false, error: 'passenger_count_required' }
  }
  return { adults: a, children: c, passenger_count, ok: true }
}

export function canMutateSharedPassenger(
  access: SharedBookingsAccess | null | undefined,
  passenger: Pick<SharedPassenger, 'supplier_code'>,
): boolean {
  if (!access || access.ok === false || access.access === 'none') return false
  if (access.access === 'admin') return true
  if (access.access === 'supplier') return access.supplier_code === passenger.supplier_code
  return false
}

export function bookingErrorMessage(error: string | undefined, extras?: {
  available_seats?: number
  confirmed_passengers?: number
}): string {
  switch (error) {
    case 'capacity_exceeded':
      return extras?.available_seats != null
        ? `Not enough seats (only ${extras.available_seats} left)`
        : 'Not enough seats on this departure'
    case 'duplicate_booking_ref':
      return 'This booking reference already exists for your supplier'
    case 'guest_name_required':
      return 'Guest name is required'
    case 'passenger_count_required':
      return 'Add at least one adult or child'
    case 'forbidden':
      return 'You are not allowed to change this booking'
    case 'departure_cancelled':
      return 'This departure is cancelled'
    case 'booking_not_confirmed':
      return 'Only confirmed bookings can be edited'
    case 'password_change_required':
      return 'Set your password before managing bookings'
    default:
      return error || 'Could not save booking'
  }
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

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    if (v === 'true' || v === '1') return true
    if (v === 'false' || v === '0') return false
  }
  return fallback
}

function asBoardList(value: unknown): SharedBoard[] {
  if (!Array.isArray(value)) return []
  return value.filter((b): b is SharedBoard => b === 'shared_bus' || b === 'my_tours')
}

/** Normalize RPC/jsonb payloads (object or JSON string) into a typed access result. */
export function normalizeSharedBookingsAccess(raw: unknown): SharedBookingsAccess {
  let value: unknown = raw
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return { ok: false, error: 'invalid_access_payload', access: 'none' }
    }
  }
  if (!value || typeof value !== 'object') {
    return { ok: false, error: 'invalid_access_payload', access: 'none' }
  }

  const row = value as Record<string, unknown>
  const ok = asBoolean(row.ok, false)
  const accessRaw = String(row.access || 'none')
  const access =
    accessRaw === 'admin' || accessRaw === 'supplier' || accessRaw === 'none' ? accessRaw : 'none'

  if (!ok) {
    return {
      ok: false,
      error: String(row.error || 'access_denied'),
      access: 'none',
    }
  }

  if (access === 'admin') {
    return {
      ok: true,
      access: 'admin',
      boards: asBoardList(row.boards).length ? asBoardList(row.boards) : ['shared_bus', 'my_tours'],
      supplier_code: String(row.supplier_code || 'royal_nordic'),
      supplier_name: String(row.supplier_name || 'Royal Nordic'),
      must_change_password: asBoolean(row.must_change_password, false),
      channels_synced: false,
    }
  }

  if (access === 'supplier') {
    return {
      ok: true,
      access: 'supplier',
      boards: asBoardList(row.boards).length ? asBoardList(row.boards) : ['shared_bus'],
      supplier_id: String(row.supplier_id || ''),
      supplier_code: String(row.supplier_code || ''),
      supplier_name: String(row.supplier_name || ''),
      operator_id: row.operator_id ? String(row.operator_id) : undefined,
      must_change_password: asBoolean(row.must_change_password, false),
      channels_synced: false,
    }
  }

  return {
    ok: true,
    access: 'none',
    boards: [],
    must_change_password: false,
    channels_synced: false,
  }
}

export type SharedAccessDecision =
  | 'setup_password'
  | 'portal'
  | 'access_denied'
  | 'access_error'

/** Pure routing decision used by login + shell (no network). */
export function resolveSharedAccessDecision(
  access: SharedBookingsAccess | null | undefined,
): SharedAccessDecision {
  if (!access) return 'access_error'
  if (access.ok === false) return 'access_error'
  if (access.access === 'none') return 'access_denied'
  if (access.access === 'supplier' && access.must_change_password) return 'setup_password'
  if (access.access === 'supplier' || access.access === 'admin') return 'portal'
  return 'access_denied'
}

