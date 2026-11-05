import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRewardsAuth } from '../../rewards/RewardsAuthContext'
import { signOutRewards } from '../../rewards/auth'
import { fetchPartnerAccess, type PartnerAccessResult } from '../partnerAccess'
import { fetchMyPartnerCompany } from './partnerCompany'

export default function PartnersAccount() {
  const { user, isSignedIn } = useRewardsAuth()
  const [access, setAccess] = useState<PartnerAccessResult | null>(null)
  const [memberRole, setMemberRole] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isSignedIn) return
    void Promise.all([fetchPartnerAccess(), fetchMyPartnerCompany()]).then(([a, c]) => {
      setAccess(a)
      setMemberRole(c.member_role || a.member_role || null)
      setReady(true)
    })
  }, [isSignedIn, user?.id])

  async function logout() {
    setBusy(true)
    try {
      await signOutRewards()
    } finally {
      setBusy(false)
    }
  }

  if (!ready) {
    return (
      <div className="space-y-3">
        <div className="rn-rewards-skel h-7 w-36" />
        <div className="rn-rewards-skel h-40 w-full max-w-lg" />
      </div>
    )
  }

  const displayName =
    (user?.user_metadata as { display_name?: string } | undefined)?.display_name ||
    user?.email ||
    'Partner user'

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-white">Account</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--rn-text-muted)]">
          Signed-in partner identity and membership. Rewards remains available on the same login.
        </p>
      </div>

      <section className="rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.03] p-5 sm:p-6">
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rn-text-dim)]">
              Signed in as
            </dt>
            <dd className="mt-1.5 text-white/90">{displayName}</dd>
            <dd className="mt-0.5 text-[var(--rn-text-muted)]">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rn-text-dim)]">
              Company
            </dt>
            <dd className="mt-1.5 text-white/90">{access?.company_name || '—'}</dd>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rn-text-dim)]">
                Access status
              </dt>
              <dd className="mt-1.5 font-medium text-aurora-soft">
                {access?.access === 'approved' ? 'Approved' : access?.access || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rn-text-dim)]">
                Membership
              </dt>
              <dd className="mt-1.5 capitalize text-white/90">{memberRole || '—'}</dd>
            </div>
          </div>
        </dl>
      </section>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <Link
          to="/referralprogram/dashboard"
          className="rn-btn-primary min-h-[44px] w-full justify-center sm:w-auto"
        >
          Open Rewards dashboard
        </Link>
        <Link
          to="/account"
          className="rn-btn-secondary min-h-[44px] w-full justify-center sm:w-auto"
        >
          Account home
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          disabled={busy}
          className="rn-btn-secondary min-h-[44px] w-full justify-center sm:w-auto disabled:opacity-50"
        >
          {busy ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  )
}
