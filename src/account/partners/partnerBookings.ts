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
  tour_id: number
  tour_title?: string
  tour_date: string
  adults: number
  children: number
  passenger_count: number
  unit_net_eur: number
  total_net_eur: number
  currency: string
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled' | string
  booking_id?: number | null
  guest_name?: string
  created_at: string
  reviewed_at?: string | null
}

export { formatPartnerNet }

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
    request: data.request as PartnerBookingRequest,
  }
}

export async function fetchMyPartnerBookingRequests(): Promise<{
  ok: boolean
  error?: string
  requests: PartnerBookingRequest[]
}> {
  const { data, error } = await supabase.rpc('list_my_partner_booking_requests')
  if (error) return { ok: false, error: error.message, requests: [] }
  if (!data?.ok) return { ok: false, error: String(data?.error || 'failed'), requests: [] }
  return { ok: true, requests: (data.requests || []) as PartnerBookingRequest[] }
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
