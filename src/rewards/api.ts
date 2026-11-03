import { supabase } from '../lib/supabase'
import type {
  AvailabilityResult,
  ClaimCodeResult,
  ReferralActivity,
  ReferralAttribution,
  ReferralCode,
  ReferralCreditBalance,
  ReferralCreditRedemption,
  ReferralEarning,
  ReferralProfile,
} from './types'

export { computeStats } from './creditStats'

export async function fetchReferralProfile(userId: string): Promise<ReferralProfile | null> {
  const { data, error } = await supabase
    .from('referral_profiles')
    .select('id, email, display_name, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return null
    }
    throw error
  }
  return data
}

export async function ensureLocalProfile(userId: string, email: string, displayName?: string | null) {
  const existing = await fetchReferralProfile(userId)
  if (existing) return existing

  await new Promise((r) => setTimeout(r, 400))
  const again = await fetchReferralProfile(userId)
  if (again) return again

  return {
    id: userId,
    email,
    display_name: displayName ?? email.split('@')[0] ?? null,
    created_at: new Date().toISOString(),
  } satisfies ReferralProfile
}

export async function fetchActiveCode(userId: string): Promise<ReferralCode | null> {
  const { data, error } = await supabase
    .from('referral_codes')
    .select('id, user_id, code, status, created_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) return null
    throw error
  }
  return data
}

export async function checkCodeAvailable(code: string): Promise<AvailabilityResult> {
  const { data, error } = await supabase.rpc('check_referral_code_available', { p_code: code })
  if (error) throw new Error(error.message)
  return (data ?? { ok: false, error: 'unknown' }) as AvailabilityResult
}

export async function claimReferralCode(code: string): Promise<ClaimCodeResult> {
  const { data, error } = await supabase.rpc('claim_referral_code', { p_code: code })
  if (error) throw new Error(error.message)
  return (data ?? { ok: false, error: 'unknown' }) as ClaimCodeResult
}

export async function fetchCreditBalance(userId: string): Promise<ReferralCreditBalance | null> {
  const { data, error } = await supabase.rpc('get_referral_credit_balance', {
    p_user_id: userId,
  })
  if (error) {
    if (error.code === 'PGRST202' || error.message?.includes('does not exist')) return null
    throw error
  }
  const row = data as Record<string, unknown> | null
  if (!row || row.ok === false) return null
  return {
    pending_cents: Number(row.pending_cents) || 0,
    available_cents: Number(row.available_cents) || 0,
    lifetime_earned_cents: Number(row.lifetime_earned_cents) || 0,
    lifetime_redeemed_cents: Number(row.lifetime_redeemed_cents) || 0,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  }
}

export async function fetchEarnings(userId: string): Promise<ReferralEarning[]> {
  const { data, error } = await supabase
    .from('referral_earnings')
    .select(
      'id, user_id, amount_cents, currency, status, created_at, remaining_cents, original_cents, source_booking_id, attribution_id, mature_at, available_at',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) return []
    throw error
  }
  return data ?? []
}

export async function fetchRedemptions(userId: string, limit = 20): Promise<ReferralCreditRedemption[]> {
  const { data, error } = await supabase
    .from('referral_credit_redemptions')
    .select('id, user_id, amount_cents, status, booking_id, created_at, note')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) return []
    throw error
  }
  return data ?? []
}

export async function fetchActivity(userId: string, limit = 12): Promise<ReferralActivity[]> {
  const { data, error } = await supabase
    .from('referral_activity')
    .select('id, referrer_user_id, event_type, amount_cents, metadata, created_at')
    .eq('referrer_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) return []
    throw error
  }
  return (data ?? []).map((row) => ({
    ...row,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
  }))
}

export async function fetchAttributions(userId: string, limit = 20): Promise<ReferralAttribution[]> {
  const { data, error } = await supabase
    .from('referral_attributions')
    .select(
      'id, referral_code, booking_id, tour_id, guest_subtotal_cents, discount_cents, charged_cents, status, created_at',
    )
    .eq('referrer_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) return []
    throw error
  }
  return data ?? []
}

export function formatEuroFromCents(cents: number): string {
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}
