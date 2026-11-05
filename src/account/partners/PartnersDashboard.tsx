import { Link, Navigate } from 'react-router-dom'
import { useRewardsAuth } from '../../rewards/RewardsAuthContext'
import { getPartnerAccess, isApprovedPartner } from '../partnerAccess'

/**
 * Placeholder only. No partner pricing in B2B.1.
 * Access requires server app_metadata.partner_status = approved.
 */
export default function PartnersDashboard() {
  const { isSignedIn, loading, user } = useRewardsAuth()
  const access = getPartnerAccess(user)

  if (loading) {
    return (
      <div className="rn-container py-14">
        <div className="rn-rewards-skel h-8 w-48" />
        <div className="mt-6 rn-rewards-skel h-40 w-full max-w-xl" />
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/account/signin?intent=partners" replace />
  }

  if (!isApprovedPartner(user)) {
    return <Navigate to={access === 'pending' ? '/partners/status' : '/partners/apply'} replace />
  }

  return (
    <div className="rn-container py-12 sm:py-16">
      <p className="rn-eyebrow text-aurora-soft">Royal Nordic Partners</p>
      <h1 className="mt-2 font-display text-[1.75rem] font-semibold tracking-[-0.02em] text-white sm:text-[2rem]">
        Partner dashboard
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--rn-text-muted)] sm:text-[15px]">
        Your partnership is approved. Trade rates and booking tools will land here in a later phase —
        nothing in this screen changes public or partner pricing yet.
      </p>
      <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
        <Link to="/travel-trade" className="rn-btn-primary min-h-[44px] justify-center">
          Travel trade overview
        </Link>
        <Link to="/referralprogram/dashboard" className="rn-btn-secondary min-h-[44px] justify-center">
          Rewards dashboard
        </Link>
        <Link to="/account" className="rn-btn-secondary min-h-[44px] justify-center">
          Account home
        </Link>
      </div>
    </div>
  )
}
