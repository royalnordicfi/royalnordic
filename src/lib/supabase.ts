import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  // Do not crash the whole SPA (blank page) — preview/misconfigured builds still render.
  console.error(
    'Missing Supabase environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Booking and auth will not work until they are set for this environment.',
  )
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'public-anon-key-missing',
)

// Database types for TypeScript
export interface Tour {
  id: number
  name: string
  description: string
  adult_price: number
  child_price: number
  max_capacity: number
  created_at: string
}

export interface TourDate {
  id: number
  tour_id: number
  date: string
  available_slots: number
  total_booked: number
  remaining_slots?: number
}

export interface Booking {
  id: number
  tour_id: number
  tour_date_id: number
  customer_name: string
  customer_email: string
  customer_phone: string
  adults: number
  children: number
  total_price: number
  stripe_payment_intent_id: string
  status: 'pending' | 'confirmed' | 'cancelled'
  special_requests: string
  created_at: string
}

export interface AdminUser {
  id: number
  email: string
  password_hash: string
  secure_key_hash: string
  created_at: string
}
