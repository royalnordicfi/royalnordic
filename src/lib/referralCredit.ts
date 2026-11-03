/**
 * Pure helpers for Royal Nordic Credit (10% of net paid).
 * Server SQL `referral_credit_from_paid_cents` is authoritative.
 */

/** Round-half-up 10% of paid cents — matches Postgres `(paid + 5) / 10`. */
export function referralCreditFromPaidCents(paidCents: number): number {
  if (!Number.isFinite(paidCents) || paidCents <= 0) return 0
  return Math.floor((paidCents + 5) / 10)
}

/**
 * After a charge refund, remaining credit target from net paid.
 * Redeemed amounts are not clawed back from guests — callers shrink unredeemed remainder only.
 */
export function targetCreditAfterRefund(args: {
  chargeAmountCents: number
  amountRefundedCents: number
}): number {
  const net = Math.max(args.chargeAmountCents - Math.max(args.amountRefundedCents, 0), 0)
  return referralCreditFromPaidCents(net)
}

export function creditReverseAmount(args: {
  remainingCents: number
  targetCents: number
}): number {
  const remaining = Math.max(args.remainingCents, 0)
  const target = Math.max(args.targetCents, 0)
  return Math.max(remaining - target, 0)
}
