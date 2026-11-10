import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminSession, signInAdmin, waitForAuthSession } from '../../lib/adminAuth'
import { fetchSharedBookingsAccess } from '../adminApi'
import { postLoginSharedPath, useSharedBookingsBase } from '../sharedBookingsPaths'

export default function SharedBookingsLoginPage() {
  const navigate = useNavigate()
  const base = useSharedBookingsBase()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    void waitForAuthSession()
      .then(async (s) => {
        if (!s.isSignedIn) {
          if (!cancelled) setChecking(false)
          return
        }
        const access = await fetchSharedBookingsAccess()
        if (cancelled) return
        navigate(postLoginSharedPath(access, base), { replace: true })
      })
      .catch(() => {
        if (!cancelled) setChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [navigate, base])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInAdmin(email, password)
      await getAdminSession()
      const access = await fetchSharedBookingsAccess()
      navigate(postLoginSharedPath(access, base), { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">
        Checking session…
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(165deg,#ecfdf5_0%,#f4f4f5_45%,#fafafa_100%)] px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Royal Nordic
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Shared Bookings</h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Sign in with the credentials provided by Royal Nordic. Accounts are invitation-only.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="sb-email" className="mb-1.5 block text-xs font-medium text-zinc-600">
              Email
            </label>
            <input
              id="sb-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            />
          </div>

          <div>
            <label htmlFor="sb-password" className="mb-1.5 block text-xs font-medium text-zinc-600">
              Password
            </label>
            <input
              id="sb-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
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
            className="w-full min-h-[44px] rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-zinc-400">
          No public registration. Contact Royal Nordic if you need access.
        </p>
        <p className="mt-3 text-center text-[11px] text-zinc-400">
          Operator portal only — not the Royal Nordic admin console.
        </p>
      </div>
    </div>
  )
}
