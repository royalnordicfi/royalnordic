import { Link, Navigate } from 'react-router-dom'
import AuthFormShell from '../../rewards/components/AuthFormShell'
import { useRewardsAuth } from '../../rewards/RewardsAuthContext'
import { getPartnerAccess, isApprovedPartner } from '../partnerAccess'

export default function PartnersStatus() {
  const { isSignedIn, loading, user } = useRewardsAuth()
  const access = getPartnerAccess(user)

  if (!loading && !isSignedIn) {
    return <Navigate to="/account/signin?intent=partners" replace state={{ from: '/partners/status' }} />
  }

  if (!loading && isApprovedPartner(user)) {
    return <Navigate to="/partners/dashboard" replace />
  }

  if (!loading && access === 'none') {
    return <Navigate to="/partners/apply" replace />
  }

  const company =
    typeof user?.user_metadata?.partner_application_company === 'string'
      ? user.user_metadata.partner_application_company
      : null

  return (
    <div className="rn-container py-12 sm:py-16">
      <AuthFormShell
        eyebrow="Royal Nordic Partners"
        title="Application under review"
        subtitle="Your partner application is pending. You do not have partner pricing or trade rates until Royal Nordic approves your account."
        backTo={{ href: '/account', label: '← Back to account' }}
      >
        <div className="space-y-4 rounded-[var(--rn-radius-sm)] border border-[var(--rn-border)] bg-white/[0.03] px-4 py-4 text-sm text-[var(--rn-text-muted)]">
          <p>
            Status: <span className="font-medium text-white">Pending review</span>
          </p>
          {company ? (
            <p>
              Company: <span className="text-white">{company}</span>
            </p>
          ) : null}
          <p className="text-[var(--rn-text-dim)]">
            Approval is granted only by Royal Nordic on the server. Selecting Partners or submitting
            this form never unlocks discounted partner pricing by itself.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Link to="/referralprogram/dashboard" className="rn-btn-secondary min-h-[44px] justify-center">
            Open Rewards
          </Link>
          <Link to="/travel-trade" className="rn-btn-secondary min-h-[44px] justify-center">
            Travel trade info
          </Link>
        </div>
      </AuthFormShell>
    </div>
  )
}
