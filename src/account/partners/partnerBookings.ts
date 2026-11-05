import { supabase } from '../../lib/supabase'
import { formatPartnerNet } from './partnerTours'

export type PartnerAvailabilityDate = {
  tour_date_id: number
  date: string
  available_slots: number
  total_booked: number
  remaining: number
  pricing_model?: string | null
  max_capacity?: number | null
}

export type PartnerBookingRequest = {
  id: string
  reference: string
  booking_ref?: string | null
  tour_id: number
  tour_title?: string
  tour_date: string
  departure_time?: string | null
  adults: number
  children: number
  passenger_count: number
  guest_name?: string | null
  pickup_location?: string | null
  unit_net_eur: number
  total_net_eur: number
  currency: string
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled' | string
  booking_id?: number | null
  created_at: string
  reviewed_at?: string | null
}

export { formatPartnerNet }

/** Fields that must never appear on partner booking list payloads. */
export const PARTNER_BOOKING_FORBIDDEN_KEYS = [
  'adult_price',
  'child_price',
  'retail_price',
  'percent_off',
  'fixed_net_eur',
  'commission',
  'admin_note',
  'decline_reason',
  'internal_notes',
  'pricing_snapshot',
  'partner_price_id',
] as const

export function partnerBookingListHasForbiddenFields(raw: Record<string, unknown>): string[] {
  return PARTNER_BOOKING_FORBIDDEN_KEYS.filter((key) => key in raw)
}

/** Map list RPC rows to the partner-safe shape (drops unknown/sensitive keys). */
export function mapPartnerBookingListItem(raw: Record<string, unknown>): PartnerBookingRequest {
  return {
    id: String(raw.id),
    reference: String(raw.reference || ''),
    booking_ref: raw.booking_ref != null ? String(raw.booking_ref) : null,
    tour_id: Number(raw.tour_id),
    tour_title: raw.tour_title != null ? String(raw.tour_title) : undefined,
    tour_date: String(raw.tour_date || ''),
    departure_time: raw.departure_time != null ? String(raw.departure_time) : null,
    adults: Number(raw.adults || 0),
    children: Number(raw.children || 0),
    passenger_count: Number(raw.passenger_count || 0),
    guest_name: raw.guest_name != null ? String(raw.guest_name) : null,
    pickup_location: raw.pickup_location != null ? String(raw.pickup_location) : null,
    unit_net_eur: Number(raw.unit_net_eur || 0),
    total_net_eur: Number(raw.total_net_eur || 0),
    currency: String(raw.currency || 'EUR'),
    status: String(raw.status || ''),
    booking_id: raw.booking_id != null ? Number(raw.booking_id) : null,
    created_at: String(raw.created_at || ''),
    reviewed_at: raw.reviewed_at != null ? String(raw.reviewed_at) : null,
  }
}

export function filterPartnerBookings(
  requests: PartnerBookingRequest[],
  filter: 'all' | 'pending' | 'confirmed' | 'declined' | 'cancelled',
): PartnerBookingRequest[] {
  if (filter === 'all') return requests
  return requests.filter((r) => r.status === filter)
}

export function formatPartnerBookingWhen(r: PartnerBookingRequest): string {
  const time = (r.departure_time || '').trim()
  return time ? `${r.tour_date} · ${time}` : r.tour_date
}

export function formatPartnerGuestCount(r: PartnerBookingRequest): string {
  const n = r.passenger_count
  return `${n} guest${n === 1 ? '' : 's'}`
}

export function partnerBookingDisplayRef(r: PartnerBookingRequest): string {
  if (r.status === 'confirmed' && r.booking_ref) return r.booking_ref
  return r.reference
}

export type PartnerDashboardStats = {
  pending_count: number
  confirmed_upcoming_count: number
  confirmed_total_net_eur: number
}

/** Today as YYYY-MM-DD in local calendar (for upcoming comparisons). */
export function partnerTodayISO(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Overview stats from company-scoped list rows.
 * Confirmed totals exclude declined/cancelled; upcoming = confirmed with tour_date >= today.
 */
export function computePartnerDashboardStats(
  requests: PartnerBookingRequest[],
  todayISO = partnerTodayISO(),
): PartnerDashboardStats {
  let pending_count = 0
  let confirmed_upcoming_count = 0
  let confirmed_total_net_eur = 0
  for (const r of requests) {
    if (r.status === 'pending') pending_count += 1
    if (r.status === 'confirmed') {
      confirmed_total_net_eur += Number(r.total_net_eur) || 0
      if (r.tour_date >= todayISO) confirmed_upcoming_count += 1
    }
  }
  return {
    pending_count,
    confirmed_upcoming_count,
    confirmed_total_net_eur: Math.round(confirmed_total_net_eur * 100) / 100,
  }
}

/** Next N confirmed upcoming bookings, soonest first. */
export function selectUpcomingConfirmedBookings(
  requests: PartnerBookingRequest[],
  limit = 5,
  todayISO = partnerTodayISO(),
): PartnerBookingRequest[] {
  return requests
    .filter((r) => r.status === 'confirmed' && r.tour_date >= todayISO)
    .slice()
    .sort((a, b) => {
      const byDate = a.tour_date.localeCompare(b.tour_date)
      if (byDate !== 0) return byDate
      return (a.departure_time || '').localeCompare(b.departure_time || '')
    })
    .slice(0, Math.max(limit, 0))
}

export async function fetchPartnerTourAvailability(
  tourId: number,
  from?: string,
  to?: string,
): Promise<{
  ok: boolean
  error?: string
  pricing_model?: string
  max_capacity?: number
  dates: PartnerAvailabilityDate[]
}> {
  const { data, error } = await supabase.rpc('list_partner_tour_availability', {
    p_tour_id: tourId,
    p_from: from || undefined,
    p_to: to || undefined,
  })
  if (error) return { ok: false, error: error.message, dates: [] }
  if (!data?.ok) return { ok: false, error: String(data?.error || 'failed'), dates: [] }
  return {
    ok: true,
    pricing_model: data.pricing_model,
    max_capacity: data.max_capacity,
    dates: (data.dates || []) as PartnerAvailabilityDate[],
  }
}

export async function submitPartnerBookingRequest(input: {
  tour_id: number
  tour_date: string
  adults: number
  children?: number
  guest_name: string
  guest_email: string
  guest_phone?: string
  pickup_location?: string
  special_requests?: string
  idempotency_key: string
}): Promise<{ ok: boolean; error?: string; duplicate?: boolean; request?: PartnerBookingRequest }> {
  const { data, error } = await supabase.rpc('submit_partner_booking_request', {
    p_tour_id: input.tour_id,
    p_tour_date: input.tour_date,
    p_adults: input.adults,
    p_children: input.children ?? 0,
    p_guest_name: input.guest_name,
    p_guest_email: input.guest_email,
    p_guest_phone: input.guest_phone ?? null,
    p_pickup_location: input.pickup_location ?? null,
    p_special_requests: input.special_requests ?? null,
    p_idempotency_key: input.idempotency_key,
  })
  if (error) return { ok: false, error: error.message }
  if (!data?.ok) return { ok: false, error: String(data?.error || 'submit_failed') }
  return {
    ok: true,
    duplicate: Boolean(data.duplicate),
    request: data.request
      ? mapPartnerBookingListItem(data.request as Record<string, unknown>)
      : undefined,
  }
}

export async function fetchMyPartnerBookingRequests(): Promise<{
  ok: boolean
  error?: string
  requests: PartnerBookingRequest[]
  forbidden_fields?: string[]
}> {
  const { data, error } = await supabase.rpc('list_my_partner_booking_requests')
  if (error) return { ok: false, error: error.message, requests: [] }
  if (!data?.ok) return { ok: false, error: String(data?.error || 'failed'), requests: [] }
  const rawRows = (data.requests || []) as Record<string, unknown>[]
  const forbidden = Array.from(
    new Set(rawRows.flatMap((row) => partnerBookingListHasForbiddenFields(row))),
  )
  if (forbidden.length > 0) {
    return {
      ok: false,
      error: `forbidden_partner_booking_field:${forbidden.join(',')}`,
      requests: [],
      forbidden_fields: forbidden,
    }
  }
  return { ok: true, requests: rawRows.map(mapPartnerBookingListItem) }
}

export const BOOKING_ERROR_COPY: Record<string, string> = {
  not_authenticated: 'Sign in to request a booking.',
  not_partner: 'Partner access is required.',
  tour_and_date_required: 'Choose a tour date.',
  date_in_past: 'Choose a future date.',
  passengers_required: 'Add at least one passenger.',
  guest_name_required: 'Enter the guest lead name.',
  guest_email_invalid: 'Enter a valid guest email.',
  idempotency_required: 'Refresh and try again.',
  tour_not_found: 'This tour is not available.',
  no_partner_rate: 'Contact Royal Nordic for pricing before requesting.',
  exceeds_vehicle_capacity: 'Too many guests for this departure.',
  insufficient_capacity: 'Not enough capacity on that date.',
}

export function statusLabel(status: string): string {
  if (status === 'pending') return 'Pending confirmation'
  if (status === 'confirmed') return 'Confirmed'
  if (status === 'declined') return 'Declined'
  if (status === 'cancelled') return 'Cancelled'
  return status
}

export function statusBadgeClass(status: string): string {
  if (status === 'confirmed') return 'bg-aurora/15 text-aurora-soft'
  if (status === 'pending') return 'bg-amber-500/15 text-amber-100'
  if (status === 'declined') return 'bg-red-500/15 text-red-200'
  if (status === 'cancelled') return 'bg-white/5 text-[var(--rn-text-dim)]'
  return 'bg-white/5 text-[var(--rn-text-dim)]'
}
