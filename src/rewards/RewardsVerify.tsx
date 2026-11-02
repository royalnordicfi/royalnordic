import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthFormShell, { FormError, FormSuccess } from './components/AuthFormShell'
import { useRewardsAuth } from './RewardsAuthContext'
import { authErrorMessage, resendVerificationEmail } from './auth'

export default function RewardsVerify() {
  const { isSignedIn, user, loading } = useRewardsAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const stateEmail = (location.state as { email?: string } | null)?.email
  const email = stateEmail || user?.email || ''

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!loading && isSignedIn && user?.email_confirmed_at) {
      navigate('/referralprogram/dashboard', { replace: true })
    }
  }, [loading, isSignedIn, user, navigate])

  async function resend() {
    if (!email) {
      setError('Enter your email on the sign-up page first.')
      return
    }
    setError(null)
    setSuccess(null)
    setSending(true)
    try {
      await resendVerificationEmail(email)
      setSuccess('Verification email sent. Check your inbox and spam folder.')
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rn-container py-12 sm:py-16">
      <AuthFormShell
        title="Confirm your email"
        subtitle="We sent a verification link to your inbox. Open it to activate your Rewards account."
        footer={
          <>
            Ready to continue?{' '}
            <Link to="/referralprogram/signin" className="text-aurora-soft underline-offset-2 hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        <FormError message={error} />
        <FormSuccess message={success} />
        {email ? (
          <p className="text-sm text-[var(--rn-text-muted)]">
            Sent to <span className="text-white">{email}</span>
          </p>
        ) : null}
        <button type="button" className="rn-btn-secondary w-full" onClick={resend} disabled={sending || !email}>
          {sending ? 'Sending…' : 'Resend verification email'}
        </button>
        <p className="text-xs leading-relaxed text-[var(--rn-text-dim)]">
          After confirming, return here and sign in. You can then choose your personal referral code.
        </p>
      </AuthFormShell>
    </div>
  )
}
