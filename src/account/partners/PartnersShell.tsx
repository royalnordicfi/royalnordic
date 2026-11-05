import { useEffect, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useRewardsAuth } from '../../rewards/RewardsAuthContext'
import { fetchPartnerAccess, type PartnerAccessResult } from '../partnerAccess'

const NAV = [
  { to: '/partners/dashboard', label: 'Overview', end: true },
  { to: '/partners/dashboard/bookings', label: 'Bookings', soon: true },
  { to: '/partners/dashboard/company', label: 'Company' },
  { to: '/partners/dashboard/account', label: 'Account' },
] as const

function PartnerNav() {
  return (
    <nav
      className="mt-6 flex gap-1 overflow-x-auto border-b border-[var(--rn-border)] pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Partner dashboard"
    >
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={'end' in item ? item.end : false}
          className={({ isActive }) =>
            [
              'relative shrink-0 px-3 py-2.5 text-sm transition sm:px-4',
              isActive
                ? 'text-white after:absolute after:inset-x-2 after:bottom-0 after:h-px after:bg-aurora-soft'
                : 'text-[var(--rn-text-muted)] hover:text-white',
              'soon' in item && item.soon ? 'opacity-80' : '',
            ].join(' ')
          }
        >
          {item.label}
          {'soon' in item && item.soon ? (
            <span className="ml-1.5 text-[10px] uppercase tracking-[0.12em] text-[var(--rn-text-dim)]">
              Soon
            </span>
          ) : null}
        </NavLink>
      ))}
    </nav>
  )
}

/**
 * Approved-partner gate + shared chrome. Nested routes render via Outlet.
 */
export default function PartnersShell() {
  const { isSignedIn, loading, user } = useRewardsAuth()
  const location = useLocation()
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
  }, [loading, isSignedIn, user?.id, location.pathname])

  if (loading || !ready) {
    return (
      <div className="rn-container py-14">
        <div className="rn-rewards-skel h-8 w-48" />
        <div className="mt-6 rn-rewards-skel h-10 w-full max-w-lg" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rn-rewards-skel h-36 w-full" />
          <div className="rn-rewards-skel h-36 w-full" />
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

  return (
    <div className="rn-container py-10 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="rn-eyebrow text-aurora-soft">Royal Nordic Partners</p>
          <h1 className="mt-2 max-w-2xl truncate font-display text-[1.65rem] font-semibold tracking-[-0.02em] text-white sm:text-[2rem]">
            {info.company_name || 'Partner workspace'}
          </h1>
          <p className="mt-2 text-sm text-[var(--rn-text-muted)]">
            Approved partnership · server-verified access
          </p>
        </div>
        <Link
          to="/referralprogram/dashboard"
          className="rn-btn-secondary min-h-[44px] shrink-0 justify-center text-sm"
        >
          Rewards
        </Link>
      </div>
      <PartnerNav />
      <div className="pt-8">
        <Outlet context={{ access: info }} />
      </div>
    </div>
  )
}
