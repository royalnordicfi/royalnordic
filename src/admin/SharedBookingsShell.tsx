import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import {
  onAdminAuthChange,
  signOutAdmin,
  waitForAuthSession,
  type AdminSessionState,
} from '../lib/adminAuth'
import { fetchSharedBookingsAccess } from './adminApi'
import {
  resolveSharedAccessDecision,
  type SharedBookingsAccess,
} from './sharedBookings'
import { sharedBookingsPaths, useSharedBookingsBase } from './sharedBookingsPaths'

/**
 * Isolated operator chrome — never AdminShell, never RN admin nav / +Booking.
 */
export default function SharedBookingsShell() {
  const base = useSharedBookingsBase()
  const paths = sharedBookingsPaths(base)
  const navigate = useNavigate()
  const [auth, setAuth] = useState<AdminSessionState | null>(null)
  const [ready, setReady] = useState(false)
  const [access, setAccess] = useState<SharedBookingsAccess | null>(null)
  const [accessReady, setAccessReady] = useState(false)
  const [accessLoadError, setAccessLoadError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let mounted = true
    void waitForAuthSession()
      .then((s) => {
        if (mounted) {
          setAuth(s)
          setReady(true)
        }
      })
      .catch(() => {
        if (mounted) {
          setAuth({ session: null, user: null, isSignedIn: false })
          setReady(true)
        }
      })
    const unsub = onAdminAuthChange((s) => {
      if (mounted) setAuth(s)
    })
    return () => {
      mounted = false
      unsub()
    }
  }, [])

  useEffect(() => {
    // Important: while auth is still hydrating, do NOT mark accessReady.
    // A prior bug set accessReady=true with access=null on the signed-out
    // interim state, so the first signed-in render hit Access Denied.
    if (!ready) return

    if (!auth?.isSignedIn) {
      setAccess(null)
      setAccessLoadError('')
      setAccessReady(true)
      return
    }

    let cancelled = false
    setAccessReady(false)
    setAccessLoadError('')
    void fetchSharedBookingsAccess()
      .then((a) => {
        if (!cancelled) {
          setAccess(a)
          setAccessReady(true)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setAccess(null)
          setAccessLoadError(e instanceof Error ? e.message : 'access_check_failed')
          setAccessReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [ready, auth?.isSignedIn, auth?.user?.id, retryKey])

  if (!ready || (auth?.isSignedIn && !accessReady)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <RefreshCw className="h-5 w-5 animate-spin text-emerald-700" />
      </div>
    )
  }

  if (!auth?.isSignedIn) {
    return <Navigate to={paths.login} replace />
  }

  if (accessLoadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Couldn’t verify access</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Your session is signed in, but Shared Bookings access could not be loaded. This is not
            the same as being unauthorized — try again.
          </p>
          <button
            type="button"
            className="mt-5 w-full min-h-[44px] rounded-lg bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-600"
            onClick={() => setRetryKey((n) => n + 1)}
          >
            Retry
          </button>
          <button
            type="button"
            className="mt-3 inline-flex w-full min-h-[40px] items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            onClick={async () => {
              await signOutAdmin()
              navigate(paths.login, { replace: true })
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  const decision = resolveSharedAccessDecision(access)
  if (decision === 'setup_password') {
    return <Navigate to={paths.setupPassword} replace />
  }
  if (decision === 'access_denied') {
    return <Navigate to={paths.accessDenied} replace />
  }
  // Transient/unknown errors: never treat as unauthorized.
  if (decision === 'access_error' || !access || access.ok === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Couldn’t verify access</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Please retry. If this keeps happening, sign out and sign in again.
          </p>
          <button
            type="button"
            className="mt-5 w-full min-h-[44px] rounded-lg bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-600"
            onClick={() => setRetryKey((n) => n + 1)}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }
  if (decision !== 'portal') {
    return <Navigate to={paths.accessDenied} replace />
  }

  const label =
    access.access === 'supplier' ? access.supplier_name : 'Royal Nordic · Shared Bookings'

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf9_0%,#f4f4f5_40%,#fafafa_100%)] text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <Link to={paths.root} className="block truncate text-[13px] font-semibold tracking-tight">
              Shared Bookings
            </Link>
            <p className="truncate text-[11px] text-zinc-500">
              {label}
              {auth.user?.email ? ` · ${auth.user.email}` : ''}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 min-h-[40px] items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
            onClick={async () => {
              await signOutAdmin()
              navigate(paths.login, { replace: true })
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-5 sm:px-5 sm:pt-6">
        <Outlet />
      </main>
    </div>
  )
}
