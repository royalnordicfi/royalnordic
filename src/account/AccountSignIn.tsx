import { useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import AuthFormShell, { FieldLabel, FormError } from '../rewards/components/AuthFormShell'
import { useRewardsAuth } from '../rewards/RewardsAuthContext'
import { authErrorMessage, signInRewards } from '../rewards/auth'
import { parseAccountIntent, resolvePostLoginPath } from './partnerAccess'

export default function AccountSignIn() {
  const { isSignedIn, loading, user } = useRewardsAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const intent = useMemo(() => parseAccountIntent(params.get('intent')), [params])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const destination = resolvePostLoginPath(user, intent)

  if (!loading && isSignedIn) {
    return <Navigate to={destination} replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const data = await signInRewards(email, password)
      navigate(resolvePostLoginPath(data.user, intent), { replace: true })
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const subtitle =
    intent === 'partners'
      ? 'Sign in to continue your partner application or open your partner workspace.'
      : intent === 'rewards'
        ? 'Access your Rewards dashboard and referral code.'
        : 'We’ll open the dashboard you’re authorized to use.'

  return (
    <div className="rn-container py-12 sm:py-16">
      <AuthFormShell
        eyebrow="Royal Nordic Account"
        title="Sign in"
        subtitle={subtitle}
        backTo={{ href: '/account', label: '← Back to account' }}
        footer={
          intent === 'partners' ? (
            <>
              New partner?{' '}
              <Link to="/partners/apply" className="text-aurora-soft underline-offset-2 hover:underline">
                Apply here
              </Link>
              {' · '}
              <Link
                to="/referralprogram/signup"
                className="text-aurora-soft underline-offset-2 hover:underline"
              >
                Create a Rewards account
              </Link>
            </>
          ) : (
            <>
              New to Rewards?{' '}
              <Link
                to="/referralprogram/signup"
                className="text-aurora-soft underline-offset-2 hover:underline"
              >
                Create an account
              </Link>
            </>
          )
        }
      >
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormError message={error} />
          <div>
            <FieldLabel htmlFor="account-signin-email">Email</FieldLabel>
            <input
              id="account-signin-email"
              type="email"
              required
              className="rn-form-input"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label
                htmlFor="account-signin-password"
                className="text-xs font-medium uppercase tracking-wide text-[var(--rn-text-muted)]"
              >
                Password
              </label>
              <Link
                to="/referralprogram/forgot-password"
                className="text-xs text-aurora-soft underline-offset-2 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="account-signin-password"
              type="password"
              required
              className="rn-form-input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="rn-btn-primary w-full min-h-[44px]" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </AuthFormShell>
    </div>
  )
}
