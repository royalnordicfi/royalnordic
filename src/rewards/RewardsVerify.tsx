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
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!loading && isSignedIn && user?.email_confirmed_at) {
      navigate('/referralprogram/dashboard', { replace: true })
    }
  }, [loading, isSignedIn, user, navigate])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const hash = location.hash || ''
    const err =
      params.get('error_description') ||
      params.get('error') ||
      (hash.includes('error_description')
        ? decodeURIComponent(hash.split('error_description=')[1]?.split('&')[0] || '')
        : null)
    if (err) {
      const lower = err.toLowerCase()
      if (lower.includes('expired') || lower.includes('otp') || lower.includes('invalid')) {
        setError('This confirmation link is invalid or has expired. Request a new email below.')
      } else {
        setError(err.replace(/\+/g, ' '))
      }
    }
  }, [location.search, location.hash])

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [cooldownUntil])

  const cooldownSec = Math.max(0, Math.ceil((cooldownUntil - now) / 1000))

  async function resend() {
    if (!email) {
      setError('Enter your email on the sign-up page first.')
      return
    }
    if (cooldownSec > 0) return
    setError(null)
    setSuccess(null)
    setSending(true)
    try {
      await resendVerificationEmail(email)
      setSuccess('Verification email sent. Check your inbox and spam folder.')
      setCooldownUntil(Date.now() + 60_000)
    } catch (err) {
      setError(authErrorMessage(err))
      setCooldownUntil(Date.now() + 60_000)
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
        <button
          type="button"
          className="rn-btn-secondary w-full"
          onClick={resend}
          disabled={sending || !email || cooldownSec > 0}
        >
          {sending
            ? 'Sending…'
            : cooldownSec > 0
              ? `Resend available in ${cooldownSec}s`
              : 'Resend verification email'}
        </button>
        <p className="text-xs leading-relaxed text-[var(--rn-text-dim)]">
          After confirming, sign in to choose your personal referral code. Links expire for security —
          use Resend if yours no longer works.
        </p>
      </AuthFormShell>
    </div>
  )
}
