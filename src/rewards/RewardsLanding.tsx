import { Link } from 'react-router-dom'
import CategoryPageEnd from '../components/CategoryPageEnd'
import { useRewardsAuth } from './RewardsAuthContext'

const VALUE_CARDS = [
  {
    eyebrow: 'For friends',
    title: '10% off',
    text: 'Guests booking with your referral code receive 10% off eligible Royal Nordic experiences when Rewards goes live.',
  },
  {
    eyebrow: 'For members',
    title: '10% credit',
    text: 'You earn 10% of what they paid as Royal Nordic Credit — toward future bookings, not cash. Credit becomes available after their tour.',
  },
] as const

const STEPS = [
  {
    n: '01',
    title: 'Create your code',
    text: 'Join Rewards and claim a personal referral code you can share.',
  },
  {
    n: '02',
    title: 'Share Lapland',
    text: 'Friends book a Royal Nordic experience using your code.',
  },
  {
    n: '03',
    title: 'Earn credit',
    text: 'You earn 10% credit after their tour — ready for a future booking when redemption launches.',
  },
] as const

const PREVIEW_STATS = [
  { label: 'Total earned', value: '€—' },
  { label: 'Available', value: '€—' },
  { label: 'Pending', value: '€—' },
  { label: 'Referrals', value: '—' },
] as const

export default function RewardsLanding() {
  const { isSignedIn, loading } = useRewardsAuth()

  const primaryTo = !loading && isSignedIn ? '/referralprogram/dashboard' : '/referralprogram/signup'
  const primaryLabel = !loading && isSignedIn ? 'Open dashboard' : 'Join Rewards'

  return (
    <div className="rn-rewards-landing">
      <section className="rn-rewards-hero relative flex items-end overflow-hidden">
        <img
          src="/nortti1.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          fetchPriority="high"
        />
        <div className="rn-rewards-hero__veil" aria-hidden />
        <div className="rn-hero-chrome-veil pointer-events-none absolute inset-x-0 top-0 h-28 sm:h-36" aria-hidden />

        <div className="rn-container relative z-10 w-full pb-10 pt-[calc(var(--rn-chrome-h)+1.6rem)] sm:pb-12 sm:pt-[calc(var(--rn-chrome-h)+1.85rem)] lg:pb-14">
          <p className="rn-eyebrow rn-reveal text-aurora-soft">Royal Nordic Rewards</p>
          <h1 className="rn-rewards-hero__title rn-reveal mt-3 max-w-[14ch] font-display font-semibold text-white">
            Give 10% off. Earn 10% credit.
          </h1>
          <p className="rn-reveal mt-4 max-w-xl text-[15px] leading-relaxed text-white/78 sm:mt-5 sm:text-[16.5px] sm:leading-[1.6]">
            Share Lapland with friends. Create your referral code now — guest discounts and Royal Nordic
            Credit unlock when Rewards goes live publicly.
          </p>

          <div className="rn-reveal mt-7 flex flex-wrap items-center gap-3 sm:mt-8">
            <Link to={primaryTo} className="rn-btn-primary min-h-[48px] px-7 sm:px-8">
              {primaryLabel}
            </Link>
            {!loading && !isSignedIn ? (
              <>
                <Link to="/referralprogram/signin" className="rn-btn-secondary min-h-[48px] px-6">
                  Sign in
                </Link>
                <Link
                  to="/account"
                  className="inline-flex min-h-[48px] items-center px-2 text-sm font-medium text-white/75 transition hover:text-white"
                >
                  Account
                </Link>
              </>
            ) : null}
            {!loading && isSignedIn ? (
              <Link to="/account" className="rn-btn-secondary min-h-[48px] px-6">
                Account
              </Link>
            ) : null}
          </div>

          <p className="rn-rewards-status rn-reveal mt-7 sm:mt-8">
            <span className="rn-rewards-status__dot" aria-hidden />
            <span>
              Accounts and referral codes are ready. Checkout discounts and credit redemption are not
              active yet.
            </span>
          </p>
        </div>
      </section>

      <section className="rn-section-follow relative" aria-labelledby="rn-rewards-value-heading">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-50" aria-hidden />
        <div className="rn-container relative">
          <header className="rn-reveal max-w-2xl">
            <p className="rn-eyebrow">The exchange</p>
            <h2 id="rn-rewards-value-heading" className="rn-h2-tight mt-2.5 text-white">
              Simple rewards for friends and members
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-text-muted">
              Credit is toward future Royal Nordic bookings — never cash.
            </p>
          </header>

          <div className="rn-rewards-value mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5">
            {VALUE_CARDS.map((card) => (
              <article key={card.eyebrow} className="rn-rewards-value__card rn-reveal">
                <p className="rn-rewards-value__eyebrow">{card.eyebrow}</p>
                <h3 className="rn-rewards-value__title">{card.title}</h3>
                <p className="rn-rewards-value__text">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-t border-white/[0.06] bg-midnight/40 py-12 sm:py-16"
        aria-labelledby="rn-rewards-steps-heading"
      >
        <div className="rn-container">
          <header className="rn-reveal max-w-2xl">
            <p className="rn-eyebrow">How it works</p>
            <h2 id="rn-rewards-steps-heading" className="rn-h2-tight mt-2.5 text-white">
              Three steps to share Lapland
            </h2>
          </header>

          <ol className="rn-rewards-steps mt-9 grid gap-8 sm:mt-11 sm:grid-cols-3 sm:gap-6 lg:gap-10">
            {STEPS.map((step) => (
              <li key={step.n} className="rn-rewards-step rn-reveal">
                <span className="rn-rewards-step__n" aria-hidden>
                  {step.n}
                </span>
                <h3 className="rn-rewards-step__title">{step.title}</h3>
                <p className="rn-rewards-step__text">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="relative border-t border-white/[0.06] py-12 sm:py-16"
        aria-labelledby="rn-rewards-preview-heading"
      >
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-40" aria-hidden />
        <div className="rn-container relative">
          <header className="rn-reveal max-w-xl">
            <p className="rn-eyebrow">Member experience</p>
            <h2 id="rn-rewards-preview-heading" className="rn-h2-tight mt-2.5 text-white">
              Your Rewards dashboard
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-text-muted">
              Track your code, referrals, and Royal Nordic Credit in one place once you join.
            </p>
          </header>

          <div
            className="rn-rewards-preview rn-reveal mt-8 sm:mt-10"
            role="img"
            aria-label="Preview of the Rewards dashboard. Illustrative only — not live balances."
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="rn-rewards-preview__badge">Preview · illustrative only</span>
            </div>
            <div className="rn-rewards-preview__head">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-text-dim">
                  Referral code
                </p>
                <p className="mt-1.5 font-mono text-2xl font-semibold tracking-[0.14em] text-white sm:text-[1.75rem]">
                  AURORA10
                </p>
              </div>
              <div className="flex flex-wrap gap-2" aria-hidden>
                <span className="rn-rewards-preview__chip">Copy code</span>
                <span className="rn-rewards-preview__chip">Copy link</span>
              </div>
            </div>

            <div className="rn-rewards-preview__stats">
              {PREVIEW_STATS.map((stat) => (
                <div key={stat.label} className="rn-rewards-preview__stat">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-text-dim">
                    {stat.label}
                  </p>
                  <p className="mt-1.5 font-display text-xl font-semibold tabular-nums text-white/90">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <p className="rn-rewards-preview__note">
              Live balances appear after friends book with your code. Redemption at checkout launches
              separately.
            </p>
          </div>
        </div>
      </section>

      <CategoryPageEnd
        title="Ready to share Lapland?"
        lede="Create your referral code today. You’ll be ready the moment Rewards discounts and credit go live."
        links={[
          {
            to: primaryTo,
            label: !loading && isSignedIn ? 'Go to dashboard' : 'Join Rewards',
            primary: true,
          },
          ...(!loading && !isSignedIn
            ? [{ to: '/referralprogram/signin', label: 'Sign in' }]
            : [{ to: '/northern-lights-tours', label: 'Explore tours' }]),
        ]}
      />
    </div>
  )
}
