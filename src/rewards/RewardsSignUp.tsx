import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthFormShell, { FieldLabel, FormError } from './components/AuthFormShell'
import { useRewardsAuth } from './RewardsAuthContext'
import { authErrorMessage, signUpRewards } from './auth'

export default function RewardsSignUp() {
  const { isSignedIn, loading } = useRewardsAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && isSignedIn) {
    return <Navigate to="/referralprogram/dashboard" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Use a password with at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const data = await signUpRewards(email, password, displayName)
      if (data.session) {
        navigate('/referralprogram/claim-code', { replace: true })
      } else {
        navigate('/referralprogram/verify', {
          replace: true,
          state: { email: email.trim().toLowerCase() },
        })
      }
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rn-container py-12 sm:py-16">
      <AuthFormShell
        title="Create your account"
        subtitle="Secure email signup for Royal Nordic Rewards."
        footer={
          <>
            Already have an account?{' '}
            <Link to="/referralprogram/signin" className="text-aurora-soft underline-offset-2 hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormError message={error} />
          <div>
            <FieldLabel htmlFor="rewards-name">Display name</FieldLabel>
            <input
              id="rewards-name"
              className="rn-form-input"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex"
            />
          </div>
          <div>
            <FieldLabel htmlFor="rewards-email">Email</FieldLabel>
            <input
              id="rewards-email"
              type="email"
              required
              className="rn-form-input"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
          </div>
          <div>
            <FieldLabel htmlFor="rewards-password">Password</FieldLabel>
            <input
              id="rewards-password"
              type="password"
              required
              minLength={8}
              className="rn-form-input"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <FieldLabel htmlFor="rewards-confirm">Confirm password</FieldLabel>
            <input
              id="rewards-confirm"
              type="password"
              required
              minLength={8}
              className="rn-form-input"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <button type="submit" className="rn-btn-primary w-full" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
      </AuthFormShell>
    </div>
  )
}
