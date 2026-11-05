import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { resolvePostLoginPath } from '../account/partnerAccess'
import AuthFormShell, { FieldLabel, FormError } from './components/AuthFormShell'
import { useRewardsAuth } from './RewardsAuthContext'
import { authErrorMessage, signInRewards } from './auth'

export default function RewardsSignIn() {
  const { isSignedIn, loading, user } = useRewardsAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const fromState = (location.state as { from?: string } | null)?.from
  const from =
    fromState && fromState.startsWith('/referralprogram')
      ? fromState
      : resolvePostLoginPath(user, 'rewards')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && isSignedIn) {
    return <Navigate to={from} replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const data = await signInRewards(email, password)
      const dest =
        fromState && fromState.startsWith('/referralprogram')
          ? fromState
          : resolvePostLoginPath(data.user, 'rewards')
      navigate(dest, { replace: true })
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rn-container py-12 sm:py-16">
      <AuthFormShell
        title="Sign in"
        subtitle="Access your Rewards dashboard and referral code."
        footer={
          <>
            New here?{' '}
            <Link to="/referralprogram/signup" className="text-aurora-soft underline-offset-2 hover:underline">
              Create an account
            </Link>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormError message={error} />
          <div>
            <FieldLabel htmlFor="signin-email">Email</FieldLabel>
            <input
              id="signin-email"
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
                htmlFor="signin-password"
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
              id="signin-password"
              type="password"
              required
              className="rn-form-input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="rn-btn-primary w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </AuthFormShell>
    </div>
  )
}
