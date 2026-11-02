import { Link } from 'react-router-dom'
import { useRewardsAuth } from './RewardsAuthContext'

const STEPS = [
  {
    title: 'Share your code',
    text: 'Friends book a Royal Nordic experience with your unique referral code.',
  },
  {
    title: 'They save 10%',
    text: 'Your guest receives 10% off eligible tours when Rewards goes live.',
  },
  {
    title: 'You earn 10%',
    text: 'You earn 10% of what they paid — tracked in your dashboard.',
  },
]

export default function RewardsLanding() {
  const { isSignedIn, loading } = useRewardsAuth()

  return (
    <>
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
          <p className="rn-eyebrow text-aurora-soft">Royal Nordic Rewards</p>
          <h1 className="mt-3 max-w-2xl font-display text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[2.85rem] lg:text-[3.25rem]">
            Give 10% off. Earn 10%.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--rn-text-muted)] sm:text-base">
            Share Lapland with friends. When Rewards activates, they save on
            their booking — and you earn for every successful referral.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {!loading && isSignedIn ? (
              <Link to="/referralprogram/dashboard" className="rn-btn-primary">
                Open dashboard
              </Link>
            ) : (
              <>
                <Link to="/referralprogram/signup" className="rn-btn-primary">
                  Sign up
                </Link>
                <Link to="/referralprogram/signin" className="rn-btn-secondary">
                  Sign in
                </Link>
              </>
            )}
          </div>

          <p className="mt-6 inline-flex items-center gap-2 rounded-[var(--rn-radius-sm)] border border-[var(--rn-border)] bg-white/[0.03] px-3 py-2 text-xs text-[var(--rn-text-dim)] sm:text-[13px]">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400/90" aria-hidden />
            Discounts and earnings are not active yet — accounts and codes are ready now.
          </p>
        </div>
      </section>

      <section className="rn-container py-12 sm:py-16">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
          How it works
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rn-rewards-step">
              <span className="font-display text-3xl font-semibold text-aurora/50 tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 text-base font-semibold text-white">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--rn-text-muted)]">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-[var(--rn-border)] bg-[var(--rn-surface)]/40">
        <div className="rn-container flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between sm:py-14">
          <div>
            <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">
              Create your code today
            </h2>
            <p className="mt-2 max-w-md text-sm text-[var(--rn-text-muted)]">
              Choose a personal code like ALEX10 or AURORA2026. You&apos;ll be first in line when booking rewards go live.
            </p>
          </div>
          <Link to={isSignedIn ? '/referralprogram/dashboard' : '/referralprogram/signup'} className="rn-btn-primary shrink-0">
            {isSignedIn ? 'Go to dashboard' : 'Get started'}
          </Link>
        </div>
      </section>
    </>
  )
}
