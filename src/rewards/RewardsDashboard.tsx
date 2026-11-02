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
  fetchEarnings,
  formatEuroFromCents,
} from './api'
import { referralLinkForCode } from './codes'
import { privacySafeBookingRef } from '../lib/referralDiscount'
import type {
  DashboardStats,
  ReferralActivity,
  ReferralAttribution,
  ReferralCode,
  ReferralProfile,
} from './types'
import CopyButton from './components/CopyButton'

function activityLabel(event: ReferralActivity): string {
  const bookingRef = event.metadata?.booking_ref
    ? String(event.metadata.booking_ref)
    : null
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
    case 'commission_pending':
      return 'Commission pending (not payable yet)'
    case 'commission_available':
      return 'Commission available (not payable yet)'
    case 'payout':
      return 'Payout processed'
    default:
      return event.event_type.replace(/_/g, ' ')
  }
}

function attributionLabel(row: ReferralAttribution): string {
  const ref = privacySafeBookingRef(row.booking_id)
  if (row.status === 'confirmed') return `Confirmed paid booking · ${ref}`
  if (row.status === 'pending') return `Pending referral · ${ref}`
  if (row.status === 'refunded') return `Refunded · ${ref}`
  if (row.status === 'cancelled') return `Cancelled · ${ref}`
  return `${row.status} · ${ref}`
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
    successfulReferrals: 0,
  })
  const [activity, setActivity] = useState<ReferralActivity[]>([])
  const [attributions, setAttributions] = useState<ReferralAttribution[]>([])
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
        const [prof, active, earnings, acts, attrs] = await Promise.all([
          ensureLocalProfile(
            user!.id,
            user!.email || '',
            (user!.user_metadata?.display_name as string | undefined) || null,
          ),
          fetchActiveCode(user!.id),
          fetchEarnings(user!.id),
          fetchActivity(user!.id),
          fetchAttributions(user!.id),
        ])
        if (!alive) return
        setProfile(prof)
        setCode(active)
        setAttributions(attrs)
        setStats(computeStats(earnings, acts, attrs))
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
        <p className="inline-flex items-center gap-2 rounded-[var(--rn-radius-sm)] border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-100/90">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
          Earnings &amp; discounts activate in the next phase
        </p>
      </header>

      {schemaMissing ? (
        <div
          role="alert"
          className="mt-8 rounded-[var(--rn-radius)] border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-50"
        >
          Rewards database tables are not applied on this environment yet. Account auth works; codes and
          stats need migration <code className="text-xs">033_referral_rewards.sql</code> applied with
          approval.
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-6 rounded-[var(--rn-radius-sm)] border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Earnings summary">
        {[
          { label: 'Total earned', value: formatEuroFromCents(stats.totalEarnedCents) },
          { label: 'Available for payout', value: formatEuroFromCents(stats.availableCents) },
          { label: 'Pending', value: formatEuroFromCents(stats.pendingCents) },
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

      {isEmpty ? (
        <section className="mt-8 rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-[var(--rn-surface)]/50 px-5 py-6 sm:px-7 sm:py-8">
          <h2 className="font-display text-xl font-semibold text-white">You&apos;re set up</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--rn-text-muted)]">
            Share your code with friends planning a Lapland trip. When Rewards connects to bookings,
            successful referrals and earnings will appear here — never fabricated.
          </p>
          <ol className="mt-5 space-y-2 text-sm text-[var(--rn-text-muted)]">
            <li>1. Copy your code or link above</li>
            <li>2. Share it with someone booking Royal Nordic</li>
            <li>3. Check back once booking rewards go live</li>
          </ol>
          <Link to="/" className="rn-btn-secondary mt-6 inline-flex">
            Browse experiences
          </Link>
        </section>
      ) : null}

      {attributions.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold text-white">Referral bookings</h2>
          <p className="mt-1 text-xs text-[var(--rn-text-dim)]">
            Guest details stay private. Payable commissions are not active yet.
          </p>
          <ul className="mt-4 divide-y divide-[var(--rn-border)] border-t border-[var(--rn-border)]">
            {attributions.map((row) => (
              <li key={row.id} className="flex items-baseline justify-between gap-4 py-3.5 text-sm">
                <span className="text-[var(--rn-text-muted)]">
                  {attributionLabel(row)}
                  {row.discount_cents > 0
                    ? ` · guest saved ${formatEuroFromCents(row.discount_cents)}`
                    : ''}
                </span>
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
