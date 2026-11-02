import { supabase } from '../lib/supabase'
import type {
  AvailabilityResult,
  ClaimCodeResult,
  DashboardStats,
  ReferralActivity,
  ReferralCode,
  ReferralEarning,
  ReferralProfile,
} from './types'

export async function fetchReferralProfile(userId: string): Promise<ReferralProfile | null> {
  const { data, error } = await supabase
    .from('referral_profiles')
    .select('id, email, display_name, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    // Table may not exist until migration is applied
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

  // Profile is created by DB trigger; brief retry for race after signup
  await new Promise((r) => setTimeout(r, 400))
  const again = await fetchReferralProfile(userId)
  if (again) return again

  // Soft fallback display only — never invent earnings
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

export async function fetchEarnings(userId: string): Promise<ReferralEarning[]> {
  const { data, error } = await supabase
    .from('referral_earnings')
    .select('id, user_id, amount_cents, currency, status, created_at')
    .eq('user_id', userId)
    .neq('status', 'void')
    .order('created_at', { ascending: false })

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

export function computeStats(earnings: ReferralEarning[], activity: ReferralActivity[]): DashboardStats {
  let totalEarnedCents = 0
  let availableCents = 0
  let pendingCents = 0

  for (const e of earnings) {
    if (e.status === 'void') continue
    if (e.status === 'paid' || e.status === 'available' || e.status === 'pending') {
      totalEarnedCents += e.amount_cents
    }
    if (e.status === 'available') availableCents += e.amount_cents
    if (e.status === 'pending') pendingCents += e.amount_cents
  }

  const successfulReferrals = activity.filter((a) =>
    a.event_type === 'booking_attributed' || a.event_type === 'commission_pending' || a.event_type === 'commission_available',
  ).length

  return { totalEarnedCents, availableCents, pendingCents, successfulReferrals }
}

export function formatEuroFromCents(cents: number): string {
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}
