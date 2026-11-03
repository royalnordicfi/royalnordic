import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import RewardsProtected from './RewardsProtected'
import { useRewardsAuth } from './RewardsAuthContext'
import {
  computeStats,
  ensureLocalProfile,
  fetchActiveCode,
  fetchActivity,
  fetchAttributions,
  fetchCreditBalance,
  fetchEarnings,
  fetchRedemptions,
  formatEuroFromCents,
} from './api'
import { referralLinkForCode } from './codes'
import { privacySafeBookingRef } from '../lib/referralDiscount'
import type {
  DashboardStats,
  ReferralActivity,
  ReferralAttribution,
  ReferralCode,
  ReferralCreditRedemption,
  ReferralEarning,
  ReferralProfile,
} from './types'
import CopyButton from './components/CopyButton'

function activityLabel(event: ReferralActivity): string {
  const bookingRef = event.metadata?.booking_ref ? String(event.metadata.booking_ref) : null
  const status = event.metadata?.status ? String(event.metadata.status) : null
  switch (event.event_type) {
    case 'code_claimed':
      return `Code claimed: ${String(event.metadata?.code ?? '')}`
    case 'signup':
      return 'Account created'
    case 'booking_attributed':
      if (status === 'refunded') {
        return `Refunded referral${bookingRef ? ` · ${bookingRef}` : ''}`
      }
      if (status === 'cancelled') {
        return `Cancelled referral${bookingRef ? ` · ${bookingRef}` : ''}`
      }
      return `Confirmed booking${bookingRef ? ` · ${bookingRef}` : ''}`
    case 'credit_pending':
      return `Royal Nordic Credit pending${bookingRef ? ` · ${bookingRef}` : ''}${
        event.amount_cents != null ? ` · ${formatEuroFromCents(event.amount_cents)}` : ''
      }`
    case 'credit_available':
      return `Royal Nordic Credit available${bookingRef ? ` · ${bookingRef}` : ''}${
        event.amount_cents != null ? ` · ${formatEuroFromCents(event.amount_cents)}` : ''
      }`
    case 'credit_reversed':
      return `Royal Nordic Credit reversed${bookingRef ? ` · ${bookingRef}` : ''}`
    case 'credit_redeemed':
      return `Royal Nordic Credit redeemed${
        event.amount_cents != null ? ` · ${formatEuroFromCents(event.amount_cents)}` : ''
      }`
    case 'commission_pending':
    case 'commission_available':
    case 'payout':
      return 'Legacy activity'
    default:
      return event.event_type.replace(/_/g, ' ')
  }
}

function attributionLabel(row: ReferralAttribution): string {
  const ref = privacySafeBookingRef(row.booking_id)
  if (row.status === 'confirmed') return `Paid booking · ${ref}`
  if (row.status === 'pending') return `Pending · ${ref}`
  if (row.status === 'refunded') return `Refunded · ${ref}`
  if (row.status === 'cancelled') return `Cancelled · ${ref}`
  return `${row.status} · ${ref}`
}

function earningLabel(row: ReferralEarning): string {
  const ref = privacySafeBookingRef(row.source_booking_id)
  const amt = formatEuroFromCents(row.remaining_cents ?? row.amount_cents)
  if (row.status === 'pending') return `Pending · ${ref} · ${amt}`
  if (row.status === 'available') return `Available · ${ref} · ${amt}`
  if (row.status === 'redeemed') return `Redeemed · ${ref} · ${formatEuroFromCents(row.amount_cents)}`
  if (row.status === 'reversed') return `Reversed · ${ref}`
  return `${row.status} · ${ref}`
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: 'border-aurora/35 bg-aurora/15 text-aurora-soft',
    pending: 'border-amber-400/30 bg-amber-500/10 text-amber-100/90',
    available: 'border-aurora/35 bg-aurora/15 text-aurora-soft',
    redeemed: 'border-white/15 bg-white/[0.04] text-[var(--rn-text-muted)]',
    refunded: 'border-white/15 bg-white/[0.04] text-[var(--rn-text-muted)]',
    reversed: 'border-white/15 bg-white/[0.04] text-[var(--rn-text-dim)]',
    cancelled: 'border-white/15 bg-white/[0.04] text-[var(--rn-text-dim)]',
    applied: 'border-aurora/35 bg-aurora/15 text-aurora-soft',
    reserved: 'border-amber-400/30 bg-amber-500/10 text-amber-100/90',
    released: 'border-white/15 bg-white/[0.04] text-[var(--rn-text-dim)]',
  }
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${map[status] || map.cancelled}`}
    >
      {label}
    </span>
  )
}

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function DashboardInner() {
  const { user } = useRewardsAuth()
  const [profile, setProfile] = useState<ReferralProfile | null>(null)
  const [code, setCode] = useState<ReferralCode | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnedCents: 0,
    availableCents: 0,
    pendingCents: 0,
    redeemedCents: 0,
    successfulReferrals: 0,
  })
  const [activity, setActivity] = useState<ReferralActivity[]>([])
  const [attributions, setAttributions] = useState<ReferralAttribution[]>([])
  const [earnings, setEarnings] = useState<ReferralEarning[]>([])
  const [redemptions, setRedemptions] = useState<ReferralCreditRedemption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [schemaMissing, setSchemaMissing] = useState(false)

  useEffect(() => {
    let alive = true
    if (!user) return

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [prof, active, balance, earns, acts, attrs, reds] = await Promise.all([
          ensureLocalProfile(
            user!.id,
            user!.email || '',
            (user!.user_metadata?.display_name as string | undefined) || null,
          ),
          fetchActiveCode(user!.id),
          fetchCreditBalance(user!.id),
          fetchEarnings(user!.id),
          fetchActivity(user!.id),
          fetchAttributions(user!.id),
          fetchRedemptions(user!.id),
        ])
        if (!alive) return
        setProfile(prof)
        setCode(active)
        setAttributions(attrs)
        setEarnings(earns)
        setRedemptions(reds)
        setStats(computeStats(balance, earns, attrs, acts))
        setActivity(acts)
      } catch (err) {
        if (!alive) return
        const msg = err instanceof Error ? err.message : 'Could not load dashboard'
        if (msg.includes('does not exist') || msg.includes('schema cache')) {
          setSchemaMissing(true)
        } else {
          setError(msg)
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [user])

  if (loading) {
    return (
      <div className="rn-container py-10 sm:py-14" aria-busy="true" aria-label="Loading dashboard">
        <div className="rn-rewards-skel h-8 w-48" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rn-rewards-skel h-24 w-full" />
          ))}
        </div>
        <div className="mt-6 rn-rewards-skel h-40 w-full" />
      </div>
    )
  }

  if (!code && !schemaMissing) {
    return <Navigate to="/referralprogram/claim-code" replace />
  }

  const link = code ? referralLinkForCode(code.code) : ''
  const isEmpty =
    stats.totalEarnedCents === 0 &&
    stats.successfulReferrals === 0 &&
    attributions.length === 0 &&
    activity.filter((a) => a.event_type !== 'code_claimed' && a.event_type !== 'signup').length === 0

  return (
    <div className="rn-container py-10 sm:py-14">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="rn-eyebrow text-aurora-soft">Dashboard</p>
          <h1 className="mt-1 font-display text-[1.65rem] font-semibold tracking-tight text-white sm:text-[2rem]">
            {profile?.display_name ? `Hello, ${profile.display_name}` : 'Your Rewards'}
          </h1>
        </div>
        <p className="inline-flex max-w-sm items-center gap-2 rounded-[var(--rn-radius-sm)] border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs leading-snug text-amber-100/90">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden />
          Guest discounts stay off until public launch — Royal Nordic Credit tracks here
        </p>
      </header>

      {schemaMissing ? (
        <div
          role="alert"
          className="mt-8 rounded-[var(--rn-radius)] border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-50"
        >
          Rewards database tables are not applied on this environment yet.
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-[var(--rn-radius-sm)] border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {error}
        </p>
      ) : null}

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Royal Nordic Credit summary">
        {[
          { label: 'Total earned credit', value: formatEuroFromCents(stats.totalEarnedCents) },
          { label: 'Available credit', value: formatEuroFromCents(stats.availableCents) },
          { label: 'Pending credit', value: formatEuroFromCents(stats.pendingCents) },
          { label: 'Successful referrals', value: String(stats.successfulReferrals) },
        ].map((tile) => (
          <div key={tile.label} className="rn-rewards-stat">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--rn-text-dim)]">
              {tile.label}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums tracking-tight text-white">
              {tile.value}
            </p>
          </div>
        ))}
      </section>

      {stats.redeemedCents > 0 ? (
        <p className="mt-3 text-xs text-[var(--rn-text-dim)]">
          Redeemed credit to date: {formatEuroFromCents(stats.redeemedCents)}
        </p>
      ) : null}

      {code ? (
        <section className="rn-rewards-code-panel mt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--rn-text-dim)]">
                Your referral code
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold tracking-[0.12em] text-white sm:text-3xl">
                {code.code}
              </p>
              <p className="mt-2 max-w-md break-all text-xs text-[var(--rn-text-muted)] sm:text-sm">
                {link}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton value={code.code} label="Copy code" />
              <CopyButton value={link} label="Copy link" />
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-8 rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-[var(--rn-surface)]/40 px-5 py-5 sm:px-6">
        <h2 className="font-display text-lg font-semibold text-white">How Royal Nordic Credit works</h2>
        <ul className="mt-3 grid gap-2 text-sm text-[var(--rn-text-muted)] sm:grid-cols-3 sm:gap-4">
          <li>
            <span className="font-medium text-white/90">Share</span>
            <p className="mt-0.5 text-[13px] leading-relaxed">
              Friends book eligible tours with your code and get 10% off.
            </p>
          </li>
          <li>
            <span className="font-medium text-white/90">Earn</span>
            <p className="mt-0.5 text-[13px] leading-relaxed">
              You earn 10% of what they paid as Royal Nordic Credit — pending until their tour
              completes.
            </p>
          </li>
          <li>
            <span className="font-medium text-white/90">Protect</span>
            <p className="mt-0.5 text-[13px] leading-relaxed">
              Refunded or cancelled bookings never leave available credit. No cash withdrawals.
            </p>
          </li>
        </ul>
      </section>

      {isEmpty ? (
        <section className="mt-6 rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-[var(--rn-surface)]/50 px-5 py-6 sm:px-7 sm:py-8">
          <h2 className="font-display text-xl font-semibold text-white">You&apos;re set up</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--rn-text-muted)]">
            Share your code with friends planning Lapland. Credit appears after a paid checkout that
            uses your code — never fabricated.
          </p>
          <ol className="mt-5 space-y-2 text-sm text-[var(--rn-text-muted)]">
            <li>1. Copy your code or link above</li>
            <li>2. Share it with someone booking an eligible Royal Nordic tour</li>
            <li>3. Watch pending credit become available after their tour</li>
          </ol>
          <Link to="/" className="rn-btn-secondary mt-6 inline-flex">
            Browse experiences
          </Link>
        </section>
      ) : null}

      {earnings.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold text-white">Credit rewards</h2>
          <p className="mt-1 text-xs text-[var(--rn-text-dim)]">
            Server ledger balances — pending until the referred tour date/time has passed.
          </p>
          <ul className="mt-4 divide-y divide-[var(--rn-border)] border-t border-[var(--rn-border)]">
            {earnings.map((row) => (
              <li
                key={row.id}
                className="flex items-start justify-between gap-3 py-3.5 text-sm sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={row.status} />
                    <span className="text-[var(--rn-text-muted)]">{earningLabel(row)}</span>
                  </div>
                </div>
                <time className="shrink-0 text-xs text-[var(--rn-text-dim)]" dateTime={row.created_at}>
                  {formatWhen(row.created_at)}
                </time>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {redemptions.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold text-white">Redemption history</h2>
          <p className="mt-1 text-xs text-[var(--rn-text-dim)]">
            Credit applied to Royal Nordic bookings. Checkout redemption is not public yet.
          </p>
          <ul className="mt-4 divide-y divide-[var(--rn-border)] border-t border-[var(--rn-border)]">
            {redemptions.map((row) => (
              <li
                key={row.id}
                className="flex items-start justify-between gap-3 py-3.5 text-sm sm:items-center"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={row.status} />
                  <span className="text-[var(--rn-text-muted)]">
                    {formatEuroFromCents(row.amount_cents)}
                    {row.booking_id ? ` · ${privacySafeBookingRef(row.booking_id)}` : ''}
                  </span>
                </div>
                <time className="shrink-0 text-xs text-[var(--rn-text-dim)]" dateTime={row.created_at}>
                  {formatWhen(row.created_at)}
                </time>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {attributions.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold text-white">Referral bookings</h2>
          <p className="mt-1 text-xs text-[var(--rn-text-dim)]">
            Booking references and status only — no guest contact details.
          </p>
          <ul className="mt-4 divide-y divide-[var(--rn-border)] border-t border-[var(--rn-border)]">
            {attributions.map((row) => (
              <li
                key={row.id}
                className="flex items-start justify-between gap-3 py-3.5 text-sm sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={row.status} />
                    <span className="text-[var(--rn-text-muted)]">{attributionLabel(row)}</span>
                  </div>
                  {row.discount_cents > 0 ? (
                    <p className="mt-1 text-xs text-[var(--rn-text-dim)]">
                      Guest discount {formatEuroFromCents(row.discount_cents)}
                    </p>
                  ) : null}
                </div>
                <time className="shrink-0 text-xs text-[var(--rn-text-dim)]" dateTime={row.created_at}>
                  {formatWhen(row.created_at)}
                </time>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {activity.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold text-white">
            {isEmpty ? 'Account activity' : 'Recent activity'}
          </h2>
          <ul className="mt-4 divide-y divide-[var(--rn-border)] border-t border-[var(--rn-border)]">
            {activity.map((a) => (
              <li key={a.id} className="flex items-baseline justify-between gap-4 py-3.5 text-sm">
                <span className="text-[var(--rn-text-muted)]">{activityLabel(a)}</span>
                <time className="shrink-0 text-xs text-[var(--rn-text-dim)]" dateTime={a.created_at}>
                  {formatWhen(a.created_at)}
                </time>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

export default function RewardsDashboard() {
  return (
    <RewardsProtected>
      <DashboardInner />
    </RewardsProtected>
  )
}
