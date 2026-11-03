import type {
  DashboardStats,
  ReferralActivity,
  ReferralAttribution,
  ReferralCreditBalance,
  ReferralEarning,
} from './types'

/**
 * Prefer server balance cache. Fall back to summing earnings only if RPC unavailable.
 * Never invent balances from activity alone.
 */
export function computeStats(
  balance: ReferralCreditBalance | null,
  earnings: ReferralEarning[],
  attributions: ReferralAttribution[] = [],
  activity: ReferralActivity[] = [],
): DashboardStats {
  const successfulFromAttrs = attributions.filter((a) => a.status === 'confirmed').length
  const successfulReferrals =
    attributions.length > 0
      ? successfulFromAttrs
      : activity.filter((a) => {
          if (a.event_type !== 'booking_attributed') return false
          return String(a.metadata?.status || 'confirmed') === 'confirmed'
        }).length

  if (balance) {
    return {
      totalEarnedCents: balance.lifetime_earned_cents,
      availableCents: balance.available_cents,
      pendingCents: balance.pending_cents,
      redeemedCents: balance.lifetime_redeemed_cents,
      successfulReferrals,
    }
  }

  let totalEarnedCents = 0
  let availableCents = 0
  let pendingCents = 0
  let redeemedCents = 0

  for (const e of earnings) {
    if (e.status === 'void' || e.status === 'reversed') continue
    const original = e.original_cents ?? e.amount_cents
    totalEarnedCents += original
    if (e.status === 'available') availableCents += e.remaining_cents ?? e.amount_cents
    if (e.status === 'pending') pendingCents += e.remaining_cents ?? e.amount_cents
    if (e.status === 'redeemed') redeemedCents += e.amount_cents
    if (e.status === 'paid') {
      redeemedCents += e.amount_cents
    }
  }

  return {
    totalEarnedCents,
    availableCents,
    pendingCents,
    redeemedCents,
    successfulReferrals,
  }
}
