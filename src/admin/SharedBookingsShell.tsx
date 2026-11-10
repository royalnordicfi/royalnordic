import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import {
  getAdminSession,
  onAdminAuthChange,
  signOutAdmin,
  type AdminSessionState,
} from '../lib/adminAuth'
import { fetchSharedBookingsAccess } from './adminApi'
import type { SharedBookingsAccess } from './sharedBookings'
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

  useEffect(() => {
    let mounted = true
    getAdminSession()
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
    const unsub = onAdminAuthChange((s) => mounted && setAuth(s))
    return () => {
      mounted = false
      unsub()
    }
  }, [])

  useEffect(() => {
    if (!auth?.isSignedIn) {
      setAccess(null)
      setAccessReady(true)
      return
    }
    let cancelled = false
    setAccessReady(false)
    void fetchSharedBookingsAccess()
      .then((a) => {
        if (!cancelled) {
          setAccess(a)
          setAccessReady(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAccess({ ok: false, error: 'access_check_failed', access: 'none' })
          setAccessReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [auth?.isSignedIn, auth?.user?.id])

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

  if (access && access.ok && access.access === 'supplier' && access.must_change_password) {
    return <Navigate to={paths.setupPassword} replace />
  }

  if (!access || access.ok === false || access.access === 'none') {
    return <Navigate to={paths.accessDenied} replace />
  }

  // Portal is for operators. Admins who land here may view assigned boards,
  // but management (operators CRUD) stays on admin.royalnordic.fi.
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
            className="shrink-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
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
