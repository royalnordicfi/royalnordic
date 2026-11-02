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

export type ReferralEarning = {
  id: string
  user_id: string
  amount_cents: number
  currency: string
  status: 'pending' | 'available' | 'paid' | 'void'
  created_at: string
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
  successfulReferrals: number
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
