export type ReferralProfile = {
  id: string
  email: string
  display_name: string | null
  created_at: string
}

export type ReferralCode = {
  id: string
  user_id: string
  code: string
  status: 'active' | 'retired'
  created_at: string
}

/** Royal Nordic Credit reward row (server ledger; not cash). */
export type ReferralEarning = {
  id: string
  user_id: string
  amount_cents: number
  currency: string
  status: 'pending' | 'available' | 'redeemed' | 'reversed' | 'void' | 'paid'
  created_at: string
  remaining_cents?: number | null
  original_cents?: number | null
  source_booking_id?: number | null
  attribution_id?: string | null
  mature_at?: string | null
  available_at?: string | null
}

export type ReferralCreditBalance = {
  pending_cents: number
  available_cents: number
  lifetime_earned_cents: number
  lifetime_redeemed_cents: number
  updated_at?: string
}

export type ReferralCreditRedemption = {
  id: string
  user_id: string
  amount_cents: number
  status: 'reserved' | 'applied' | 'released' | 'void'
  booking_id: number | null
  created_at: string
  note?: string | null
}

export type ReferralActivity = {
  id: string
  referrer_user_id: string
  event_type: string
  amount_cents: number | null
  metadata: Record<string, unknown>
  created_at: string
}

export type DashboardStats = {
  totalEarnedCents: number
  availableCents: number
  pendingCents: number
  redeemedCents: number
  successfulReferrals: number
}

export type ReferralAttribution = {
  id: string
  referral_code: string
  booking_id: number | null
  tour_id: number | null
  guest_subtotal_cents: number
  discount_cents: number
  charged_cents: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded' | 'void'
  created_at: string
}

export type ClaimCodeResult =
  | { ok: true; code: string; id?: string }
  | { ok: false; error: string; code?: string; normalized?: string }

export type AvailabilityResult = {
  ok: boolean
  available?: boolean
  normalized?: string
  error?: string
}
