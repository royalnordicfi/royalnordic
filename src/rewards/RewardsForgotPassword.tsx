import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthFormShell, { FieldLabel, FormError, FormSuccess } from './components/AuthFormShell'
import { authErrorMessage, requestPasswordReset } from './auth'

export default function RewardsForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [now, setNow] = useState(Date.now())

  const cooldownSec = Math.max(0, Math.ceil((cooldownUntil - now) / 1000))

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [cooldownUntil])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (cooldownSec > 0) return
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      await requestPasswordReset(email)
      setSuccess('If an account exists for that email, a reset link is on its way.')
      setCooldownUntil(Date.now() + 60_000)
    } catch (err) {
      setError(authErrorMessage(err))
      setCooldownUntil(Date.now() + 60_000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rn-container py-12 sm:py-16">
      <AuthFormShell
        title="Reset password"
        subtitle="We’ll email you a secure link to choose a new password."
        footer={
          <>
            Remembered it?{' '}
            <Link to="/referralprogram/signin" className="text-aurora-soft underline-offset-2 hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormError message={error} />
          <FormSuccess message={success} />
          <div>
            <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
            <input
              id="forgot-email"
              type="email"
              required
              className="rn-form-input"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="rn-btn-primary w-full" disabled={submitting || cooldownSec > 0}>
            {submitting
              ? 'Sending…'
              : cooldownSec > 0
                ? `Try again in ${cooldownSec}s`
                : 'Send reset link'}
          </button>
        </form>
      </AuthFormShell>
    </div>
  )
}
