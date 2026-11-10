import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  isExpiredSessionMessage,
  signOutAdmin,
  updateAdminPassword,
  waitForAuthSession,
} from '../../lib/adminAuth'
import {
  completeSharedOperatorPasswordChange,
  fetchSharedBookingsAccess,
} from '../adminApi'
import { resolveSharedAccessDecision } from '../sharedBookings'
import { sharedBookingsPaths, useSharedBookingsBase } from '../sharedBookingsPaths'

export default function SharedBookingsPasswordSetupPage() {
  const navigate = useNavigate()
  const base = useSharedBookingsBase()
  const paths = sharedBookingsPaths(base)
  const [ready, setReady] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const session = await waitForAuthSession()
        if (!session.isSignedIn) {
          if (!cancelled) {
            setSessionExpired(true)
            setAllowed(false)
            setReady(true)
          }
          return
        }
        const access = await fetchSharedBookingsAccess()
        if (cancelled) return

        const decision = resolveSharedAccessDecision(access)
        if (decision === 'portal') {
          navigate(paths.root, { replace: true })
          return
        }
        if (decision === 'access_denied') {
          navigate(paths.accessDenied, { replace: true })
          return
        }
        if (decision === 'setup_password') {
          setAllowed(true)
          setSessionExpired(false)
          setReady(true)
          return
        }
        // access_error — show recoverable expired/retry state
        setSessionExpired(true)
        setAllowed(false)
        setReady(true)
      } catch {
        if (!cancelled) {
          setSessionExpired(true)
          setAllowed(false)
          setReady(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate, paths.root, paths.accessDenied])

  const signOutToLogin = async () => {
    try {
      await signOutAdmin()
    } catch {
      // still send the user to login
    }
    navigate(paths.login, { replace: true })
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">
        Loading…
      </div>
    )
  }

  if (sessionExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Shared Bookings
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Session expired</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Sign in again with your temporary password to finish setting a permanent password.
          </p>
          <button
            type="button"
            className="mt-6 inline-flex w-full min-h-[44px] items-center justify-center rounded-lg bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-600"
            onClick={() => navigate(paths.login, { replace: true })}
          >
            Return to login
          </button>
        </div>
      </div>
    )
  }

  if (!allowed) {
    return <Navigate to={paths.login} replace />
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (password.length < 10) {
      setError('Use at least 10 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await updateAdminPassword(password)
      const result = await completeSharedOperatorPasswordChange()
      if (!result.ok) {
        throw new Error(result.error || 'Could not complete setup')
      }

      const access = await fetchSharedBookingsAccess()
      const decision = resolveSharedAccessDecision(access)
      if (decision === 'setup_password') {
        throw new Error('Password saved, but setup is still required. Please try again.')
      }
      if (decision === 'access_denied') {
        navigate(paths.accessDenied, { replace: true })
        return
      }
      if (decision !== 'portal') {
        throw new Error('Password saved, but access could not be verified. Please sign in again.')
      }
      navigate(paths.root, { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Setup failed'
      if (isExpiredSessionMessage(message)) {
        setSessionExpired(true)
        setAllowed(false)
        setError('')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Shared Bookings
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Set your password</h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          For security, replace the temporary password before continuing.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="sb-new-password" className="mb-1.5 block text-xs font-medium text-zinc-600">
              New password
            </label>
            <input
              id="sb-new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            />
          </div>
          <div>
            <label
              htmlFor="sb-confirm-password"
              className="mb-1.5 block text-xs font-medium text-zinc-600"
            >
              Confirm password
            </label>
            <input
              id="sb-confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            />
          </div>

          {error ? (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save password and continue'}
          </button>
        </form>

        <button
          type="button"
          className="mt-4 inline-flex w-full min-h-[40px] items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          onClick={() => void signOutToLogin()}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
