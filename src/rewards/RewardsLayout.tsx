import { Outlet, Link, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'
import { RewardsAuthProvider, useRewardsAuth } from './RewardsAuthContext'
import { signOutRewards } from './auth'

function RewardsChrome() {
  const { isSignedIn, loading } = useRewardsAuth()
  const location = useLocation()
  const isApp =
    location.pathname.startsWith('/referralprogram/dashboard') ||
    location.pathname.startsWith('/referralprogram/claim-code')

  async function logout() {
    await signOutRewards()
  }

  return (
    <div className="rn-rewards min-h-[60vh]">
      {isApp ? (
        <div className="border-b border-[var(--rn-border)] bg-[var(--rn-surface)]/80 backdrop-blur-sm">
          <div className="rn-container flex items-center justify-between gap-4 py-3.5">
            <Link
              to="/referralprogram/dashboard"
              className="font-display text-lg font-semibold tracking-tight text-white transition hover:text-aurora-soft"
            >
              Rewards
            </Link>
            <div className="flex items-center gap-3 text-sm">
              {!loading && isSignedIn ? (
                <button
                  type="button"
                  onClick={logout}
                  className="text-[var(--rn-text-muted)] transition hover:text-white"
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

export default function RewardsLayout() {
  return (
    <RewardsAuthProvider>
      <RewardsChrome />
    </RewardsAuthProvider>
  )
}
