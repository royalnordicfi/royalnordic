import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthFormShell, { FieldLabel, FormError, FormSuccess } from './components/AuthFormShell'
import { useRewardsAuth } from './RewardsAuthContext'
import { authErrorMessage, updatePassword } from './auth'

export default function RewardsResetPassword() {
  const { isSignedIn, loading } = useRewardsAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!loading) setReady(true)
  }, [loading])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password.length < 8) {
      setError('Use a password with at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!isSignedIn) {
      setError('This reset link is invalid or expired. Request a new one.')
      return
    }

    setSubmitting(true)
    try {
      await updatePassword(password)
      setSuccess('Password updated. Redirecting to your dashboard…')
      window.setTimeout(() => navigate('/referralprogram/dashboard', { replace: true }), 1200)
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rn-container py-12 sm:py-16">
      <AuthFormShell
        title="Choose a new password"
        subtitle="Enter a strong password for your Rewards account."
        footer={
          !isSignedIn && ready ? (
            <>
              Link expired?{' '}
              <Link to="/referralprogram/forgot-password" className="text-aurora-soft underline-offset-2 hover:underline">
                Request a new one
              </Link>
            </>
          ) : null
        }
      >
        {!ready ? (
          <div className="space-y-3" aria-busy="true">
            <div className="rn-rewards-skel h-10 w-full" />
            <div className="rn-rewards-skel h-10 w-full" />
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <FormError message={error} />
            <FormSuccess message={success} />
            <div>
              <FieldLabel htmlFor="reset-password">New password</FieldLabel>
              <input
                id="reset-password"
                type="password"
                required
                minLength={8}
                className="rn-form-input"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!isSignedIn}
              />
            </div>
            <div>
              <FieldLabel htmlFor="reset-confirm">Confirm password</FieldLabel>
              <input
                id="reset-confirm"
                type="password"
                required
                minLength={8}
                className="rn-form-input"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={!isSignedIn}
              />
            </div>
            <button type="submit" className="rn-btn-primary w-full" disabled={submitting || !isSignedIn}>
              {submitting ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}
      </AuthFormShell>
    </div>
  )
}
