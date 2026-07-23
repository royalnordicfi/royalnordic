export type BookingSource =
  | 'direct_website'
  | 'getyourguide'
  | 'airbnb'
  | 'viator'
  | 'manual'
  | 'other'

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'pending_crypto_payment'
  | 'completed'

export type PaymentStatus =
  | 'unpaid'
  | 'paid'
  | 'partial'
  | 'refunded'
  | 'pending_crypto'

export type OpsBooking = {
  id: number
  booking_ref: string | null
  customer_name: string
  customer_email: string
  customer_phone: string | null
  adults: number
  children: number
  total_price: number
  status: BookingStatus
  payment_status: PaymentStatus
  payment_type?: string | null
  crypto_type?: string | null
  source: BookingSource
  pickup_location: string | null
  tour_time: string | null
  special_requests: string | null
  internal_notes: string | null
  stripe_payment_intent_id: string | null
  guide_id: number | null
  vehicle_id: number | null
  tour_id: number
  tour_date_id: number
  created_at: string
  updated_at?: string | null
  tours?: { id: number; name: string; public_name?: string | null; max_capacity?: number }
  tour_dates?: { id: number; date: string }
  guides?: { id: number; name: string; phone?: string | null } | null
  vehicles?: {
    id: number
    name: string
    passenger_capacity: number
    registration_number?: string | null
  } | null
}

export type Guide = {
  id: number
  name: string
  phone: string | null
  email: string | null
  availability_status: 'available' | 'busy' | 'off'
  notes: string | null
  is_active: boolean
}

export type Vehicle = {
  id: number
  name: string
  registration_number: string | null
  passenger_capacity: number
  status: 'available' | 'in_use' | 'maintenance'
  notes: string | null
  is_active: boolean
}

export type Product = {
  id: number
  name: string
  public_name: string | null
  description: string | null
  adult_price: number
  child_price: number
  max_capacity: number
  is_active: boolean
  duration_text: string | null
  inclusions: string | null
  operational_notes: string | null
  platform_availability: string | null
  commission_percent: number | null
}

export type Customer = {
  id: number
  email: string
  name: string | null
  phone: string | null
  internal_notes: string | null
  booking_count?: number
  total_value?: number
  latest_booking?: string | null
  upcoming_booking?: string | null
}

export type BookingEvent = {
  id: number
  booking_id: number
  event_type: string
  from_value: string | null
  to_value: string | null
  note: string | null
  created_by: string | null
  created_at: string
}

export const SOURCE_LABELS: Record<BookingSource, string> = {
  direct_website: 'Direct website',
  getyourguide: 'GetYourGuide',
  airbnb: 'Airbnb',
  viator: 'Viator',
  manual: 'Manual',
  other: 'Other',
}

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  pending_crypto_payment: 'Pending crypto',
  completed: 'Completed',
}

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  partial: 'Partial',
  refunded: 'Refunded',
  pending_crypto: 'Pending crypto',
}
