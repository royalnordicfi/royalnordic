import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useRewardsAuth } from '../../rewards/RewardsAuthContext'
import { fetchPartnerAccess, type PartnerAccessResult } from '../partnerAccess'

/**
 * Premium shell only. No partner rates or booking tools in B2B.2.
 * Access requires active partner_members row (DB), not client selection.
 */
export default function PartnersDashboard() {
  const { isSignedIn, loading, user } = useRewardsAuth()
  const [info, setInfo] = useState<PartnerAccessResult | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!isSignedIn) {
      setReady(true)
      return
    }
    void fetchPartnerAccess().then((r) => {
      setInfo(r)
      setReady(true)
    })
  }, [loading, isSignedIn, user?.id])

  if (loading || !ready) {
    return (
      <div className="rn-container py-14">
        <div className="rn-rewards-skel h-8 w-48" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rn-rewards-skel h-40 w-full" />
          <div className="rn-rewards-skel h-40 w-full" />
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/account/signin?intent=partners" replace />
  }

  if (info?.access === 'pending') {
    return <Navigate to="/partners/status" replace />
  }
  if (info?.access !== 'approved') {
    return <Navigate to="/partners/apply" replace />
  }

  const company = info.company_name || 'Your company'

  return (
    <div className="rn-container py-12 sm:py-16">
      <p className="rn-eyebrow text-aurora-soft">Royal Nordic Partners</p>
      <h1 className="mt-2 max-w-2xl font-display text-[1.75rem] font-semibold tracking-[-0.02em] text-white sm:text-[2.1rem]">
        Welcome, {company}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--rn-text-muted)] sm:text-[15px]">
        Your partnership is approved. Bookings tools and partner rates will appear here in a later
        phase — nothing on this screen changes public or partner pricing yet.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.03] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--rn-text-dim)]">
            Account status
          </p>
          <p className="mt-2 font-display text-xl font-semibold text-aurora-soft">Approved</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--rn-text-muted)]">
            Server-verified partner membership
          </p>
        </div>
        <div className="rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.03] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--rn-text-dim)]">
            Bookings
          </p>
          <p className="mt-2 font-display text-xl font-semibold text-white/90">Coming soon</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--rn-text-muted)]">
            Partner booking tools placeholder
          </p>
        </div>
        <div className="rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.03] p-5 sm:col-span-2 lg:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--rn-text-dim)]">
            Partner rates
          </p>
          <p className="mt-2 font-display text-xl font-semibold text-white/90">Not enabled</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--rn-text-muted)]">
            No discounted prices exposed yet
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <Link to="/travel-trade" className="rn-btn-primary min-h-[44px] w-full justify-center sm:w-auto">
          Travel trade overview
        </Link>
        <Link
          to="/referralprogram/dashboard"
          className="rn-btn-secondary min-h-[44px] w-full justify-center sm:w-auto"
        >
          Rewards dashboard
        </Link>
        <Link to="/account" className="rn-btn-secondary min-h-[44px] w-full justify-center sm:w-auto">
          Account home
        </Link>
      </div>
    </div>
  )
}
