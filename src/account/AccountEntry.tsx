import { Link } from 'react-router-dom'
import { useRewardsAuth } from '../rewards/RewardsAuthContext'
import { getPartnerAccess, resolvePostLoginPath } from './partnerAccess'

const CHOICES = [
  {
    intent: 'rewards' as const,
    title: 'Rewards',
    text: 'Referral codes, Royal Nordic Credit, and your Rewards dashboard.',
    primary: { to: '/referralprogram/signup', label: 'Join Rewards' },
    secondary: { to: '/account/signin?intent=rewards', label: 'Sign in' },
    signedInTo: '/referralprogram/dashboard',
  },
  {
    intent: 'partners' as const,
    title: 'Partners',
    text: 'Travel trade and B2B — apply for partnership. Approval is reviewed by Royal Nordic.',
    primary: { to: '/partners/apply', label: 'Apply to partner' },
    secondary: { to: '/account/signin?intent=partners', label: 'Sign in' },
    signedInTo: null as string | null,
  },
]

export default function AccountEntry() {
  const { isSignedIn, loading, user } = useRewardsAuth()
  const partner = getPartnerAccess(user)

  return (
    <section className="relative overflow-hidden border-b border-[var(--rn-border)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 70% 20%, rgba(15,143,99,0.22), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(125,211,252,0.08), transparent 50%)',
        }}
        aria-hidden
      />
      <div className="rn-container relative py-14 sm:py-20 lg:py-24">
        <p className="rn-eyebrow text-aurora-soft">Royal Nordic</p>
        <h1 className="mt-3 max-w-2xl font-display text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[2.85rem]">
          Sign in or get started
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--rn-text-muted)] sm:text-base">
          Choose Rewards for guest referrals, or Partners to apply for travel-trade access. Selecting
          Partners never grants pricing or approval on its own.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
          {CHOICES.map((choice) => {
            const signedInTarget =
              choice.intent === 'partners'
                ? resolvePostLoginPath(user, 'partners')
                : choice.signedInTo!
            return (
              <div
                key={choice.intent}
                className="flex flex-col rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.03] p-5 sm:p-6"
              >
                <h2 className="font-display text-xl font-semibold tracking-tight text-white sm:text-[1.35rem]">
                  {choice.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--rn-text-muted)]">
                  {choice.text}
                </p>
                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
                  {!loading && isSignedIn ? (
                    <Link to={signedInTarget} className="rn-btn-primary min-h-[44px] justify-center">
                      {choice.intent === 'partners'
                        ? partner === 'approved'
                          ? 'Open partner dashboard'
                          : partner === 'pending'
                            ? 'View application status'
                            : 'Continue application'
                        : 'Open Rewards dashboard'}
                    </Link>
                  ) : (
                    <>
                      <Link
                        to={choice.primary.to}
                        className="rn-btn-primary min-h-[44px] justify-center"
                      >
                        {choice.primary.label}
                      </Link>
                      <Link
                        to={choice.secondary.to}
                        className="rn-btn-secondary min-h-[44px] justify-center"
                      >
                        {choice.secondary.label}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-sm text-[var(--rn-text-dim)]">
          Looking for tours?{' '}
          <Link to="/" className="text-aurora-soft underline-offset-2 hover:underline">
            Browse experiences
          </Link>
          {partner === 'none' && !loading ? (
            <>
              {' '}
              ·{' '}
              <Link to="/travel-trade" className="text-aurora-soft underline-offset-2 hover:underline">
                Travel trade overview
              </Link>
            </>
          ) : null}
        </p>
      </div>
    </section>
  )
}
