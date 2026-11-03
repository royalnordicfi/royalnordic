/** Pure helpers for Royal Nordic Credit at checkout (server remains authoritative). */

export function clampCreditApplyCents(args: {
  requestedCents: number
  availableCents: number
  payableCents: number
}): number {
  const requested = Math.max(0, Math.floor(args.requestedCents || 0))
  const available = Math.max(0, Math.floor(args.availableCents || 0))
  const payable = Math.max(0, Math.floor(args.payableCents || 0))
  return Math.min(requested, available, payable)
}

export function cashDueCents(payableCents: number, creditCents: number): number {
  return Math.max(0, payableCents - Math.max(0, creditCents))
}

/** Referral earn basis = cash only. */
export function referralEarnBasisCents(cashPaidCents: number): number {
  return Math.max(0, Math.floor(cashPaidCents || 0))
}

export function proportionalCreditRestoreCents(args: {
  creditAppliedCents: number
  alreadyRestoredCents: number
  originalCashCents: number
  amountRefundedCents: number
  fullRestore?: boolean
}): number {
  const credit = Math.max(0, args.creditAppliedCents)
  const restored = Math.max(0, args.alreadyRestoredCents)
  const cash = Math.max(0, args.originalCashCents)
  const refunded = Math.max(0, args.amountRefundedCents)
  let targetTotal: number
  if (args.fullRestore || cash <= 0 || refunded >= cash) {
    targetTotal = credit
  } else {
    targetTotal = Math.floor((credit * refunded) / cash)
  }
  return Math.max(0, Math.min(credit - restored, targetTotal - restored))
}
