import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getAdminSession, signOutAdmin } from '../../lib/adminAuth'
import { completeSharedOperatorPasswordChange, fetchSharedBookingsAccess } from '../adminApi'

export default function SharedBookingsPasswordSetupPage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const session = await getAdminSession()
      if (!session.isSignedIn) {
        if (!cancelled) {
          setAllowed(false)
          setReady(true)
        }
        return
      }
      const access = await fetchSharedBookingsAccess()
      if (cancelled) return
      const needsSetup =
        access.ok && access.access === 'supplier' && Boolean(access.must_change_password)
      setAllowed(needsSetup)
      setReady(true)
      if (access.ok && access.access === 'supplier' && !access.must_change_password) {
        navigate('/sharedbookings', { replace: true })
      }
      if (access.ok && access.access === 'admin') {
        navigate('/sharedbookings', { replace: true })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">
        Loading…
      </div>
    )
  }

  if (!allowed) {
    return <Navigate to="/sharedbookings/login" replace />
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
      const { error: updErr } = await supabase.auth.updateUser({ password })
      if (updErr) throw new Error(updErr.message || 'Could not update password')
      const result = await completeSharedOperatorPasswordChange()
      if (!result.ok) throw new Error(result.error || 'Could not complete setup')
      navigate('/sharedbookings', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Setup failed')
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
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
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
          className="mt-4 w-full text-center text-xs text-zinc-500 underline-offset-2 hover:underline"
          onClick={async () => {
            await signOutAdmin()
            navigate('/sharedbookings/login', { replace: true })
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
