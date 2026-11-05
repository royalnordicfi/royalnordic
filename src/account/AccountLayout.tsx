import { Link, Outlet, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'
import { RewardsAuthProvider, useRewardsAuth } from '../rewards/RewardsAuthContext'
import { signOutRewards } from '../rewards/auth'
import { useEffect, useState } from 'react'
import { fetchPartnerAccess, type PartnerAccess } from './partnerAccess'

function AccountChrome() {
  const { isSignedIn, loading, user } = useRewardsAuth()
  const location = useLocation()
  const [partner, setPartner] = useState<PartnerAccess>('none')

  useEffect(() => {
    if (!isSignedIn) {
      setPartner('none')
      return
    }
    void fetchPartnerAccess().then((r) => setPartner(r.access))
  }, [isSignedIn, user?.id])
  const isPartnerDashboard = location.pathname.startsWith('/partners/dashboard')
  const isPartnerApp = isPartnerDashboard || location.pathname.startsWith('/partners/status')

  async function logout() {
    await signOutRewards()
  }

  return (
    <div className="rn-rewards min-h-[60vh]">
      {isPartnerApp && !isPartnerDashboard ? (
        <div className="border-b border-[var(--rn-border)] bg-[var(--rn-surface)]/80 backdrop-blur-sm">
          <div className="rn-container flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3.5">
            <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto sm:gap-6">
              <Link
                to="/partners/status"
                className="shrink-0 font-display text-lg font-semibold tracking-tight text-white transition hover:text-aurora-soft"
              >
                Partners
              </Link>
              <nav
                className="flex shrink-0 items-center gap-3 whitespace-nowrap text-xs sm:gap-4 sm:text-sm"
                aria-label="Partners"
              >
                <Link
                  to="/partners/status"
                  className="text-[var(--rn-text-muted)] transition hover:text-white"
                >
                  Application
                </Link>
                <Link to="/account" className="text-[var(--rn-text-muted)] transition hover:text-white">
                  Account
                </Link>
              </nav>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-sm">
              {!loading && isSignedIn ? (
                <button
                  type="button"
                  onClick={logout}
                  className="min-h-[44px] px-1 text-[var(--rn-text-muted)] transition hover:text-white"
                >
                  Sign out
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {isPartnerDashboard ? (
        <div className="border-b border-[var(--rn-border)] bg-[var(--rn-surface)]/80 backdrop-blur-sm">
          <div className="rn-container flex items-center justify-between gap-3 py-3.5">
            <Link
              to="/partners/dashboard"
              className="font-display text-lg font-semibold tracking-tight text-white transition hover:text-aurora-soft"
            >
              Partners
            </Link>
            <div className="flex items-center gap-3 text-sm">
              {partner === 'approved' ? (
                <span className="hidden text-xs text-aurora-soft sm:inline">Approved</span>
              ) : null}
              {!loading && isSignedIn ? (
                <button
                  type="button"
                  onClick={logout}
                  className="min-h-[44px] px-1 text-[var(--rn-text-muted)] transition hover:text-white"
                >
                  Sign out
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      <Outlet />
      <Footer />
    </div>
  )
}

export default function AccountLayout() {
  return (
    <RewardsAuthProvider>
      <AccountChrome />
    </RewardsAuthProvider>
  )
}
