import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import AuthFormShell from '../../rewards/components/AuthFormShell'
import { useRewardsAuth } from '../../rewards/RewardsAuthContext'
import { fetchPartnerAccess, type PartnerAccessResult } from '../partnerAccess'

export default function PartnersStatus() {
  const { isSignedIn, loading } = useRewardsAuth()
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
  }, [loading, isSignedIn])

  if (!loading && !isSignedIn) {
    return <Navigate to="/account/signin?intent=partners" replace />
  }

  if (!ready) {
    return (
      <div className="rn-container py-14">
        <div className="rn-rewards-skel h-8 w-48" />
        <div className="mt-6 rn-rewards-skel h-32 w-full max-w-md" />
      </div>
    )
  }

  if (info?.access === 'approved') {
    return <Navigate to="/partners/dashboard" replace />
  }

  if (info?.access === 'declined') {
    return (
      <div className="rn-container py-12 sm:py-16">
        <AuthFormShell
          eyebrow="Royal Nordic Partners"
          title="Application declined"
          subtitle="This application was not approved. You do not have partner access or trade rates."
          backTo={{ href: '/account', label: '← Back to account' }}
        >
          <p className="text-sm text-[var(--rn-text-muted)]">
            Questions?{' '}
            <Link to="/contact" className="text-aurora-soft underline-offset-2 hover:underline">
              Contact Royal Nordic
            </Link>
            .
          </p>
        </AuthFormShell>
      </div>
    )
  }

  if (info?.access !== 'pending') {
    return <Navigate to="/partners/apply" replace />
  }

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
          {info.company_name ? (
            <p>
              Company: <span className="text-white">{info.company_name}</span>
            </p>
          ) : null}
          {info.submitted_at ? (
            <p className="text-[var(--rn-text-dim)]">
              Submitted {new Date(info.submitted_at).toLocaleString()}
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
