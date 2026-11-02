import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthFormShell, { FieldLabel, FormError, FormSuccess } from './components/AuthFormShell'
import { authErrorMessage, requestPasswordReset } from './auth'

export default function RewardsForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      await requestPasswordReset(email)
      setSuccess('If an account exists for that email, a reset link is on its way.')
    } catch (err) {
      setError(authErrorMessage(err))
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
          <button type="submit" className="rn-btn-primary w-full" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      </AuthFormShell>
    </div>
  )
}
