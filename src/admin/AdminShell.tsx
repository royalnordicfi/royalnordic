import React, { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Menu, RefreshCw, X } from 'lucide-react'
import {
  getAdminSession,
  onAdminAuthChange,
  signOutAdmin,
  type AdminSessionState,
} from '../lib/adminAuth'
import AdminLogin from '../components/AdminLogin'
import { countOpenTransportationRequests } from './adminApi'

type NavItem = { to: string; label: string; end?: boolean; badgeKey?: 'requests' }

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Operations',
    items: [
      { to: '/', label: 'Home', end: true },
      { to: '/bookings', label: 'Bookings' },
      { to: '/manual', label: 'New booking' },
      { to: '/calendar', label: 'Calendar' },
      { to: '/availability', label: 'Availability' },
      { to: '/requests', label: 'Requests', badgeKey: 'requests' },
      { to: '/notes', label: 'Notes' },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { to: '/products', label: 'Products' },
      { to: '/fleet', label: 'Guides & vehicles' },
      { to: '/customers', label: 'Customers' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { to: '/revenue', label: 'Revenue' },
      { to: '/import', label: 'Import' },
      { to: '/integrations', label: 'Integrations' },
    ],
  },
]

export default function AdminShell() {
  const [auth, setAuth] = useState<AdminSessionState | null>(null)
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [requestCount, setRequestCount] = useState(0)
  const navigate = useNavigate()

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
    if (!auth?.isSignedIn) return
    let cancelled = false
    const load = () =>
      countOpenTransportationRequests()
        .then((n) => {
          if (!cancelled) setRequestCount(n)
        })
        .catch(() => undefined)
    void load()
    const t = window.setInterval(load, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(t)
    }
  }, [auth?.isSignedIn])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <RefreshCw className="h-5 w-5 animate-spin text-emerald-700" />
      </div>
    )
  }

  if (!auth?.isSignedIn) {
    return <AdminLogin onSuccess={() => getAdminSession().then(setAuth)} />
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-800/90 bg-zinc-950 px-4 py-2.5 text-white sm:px-5">
        <div className="min-w-0">
          <Link to="/" className="text-[13px] font-semibold tracking-tight">
            Royal Nordic Ops
          </Link>
          <p className="truncate text-[11px] text-zinc-400">{auth.user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/manual"
            className="hidden rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium hover:bg-emerald-500 sm:inline-flex"
          >
            + Booking
          </Link>
          <button
            type="button"
            className="rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs hover:bg-zinc-700"
            onClick={async () => {
              await signOutAdmin()
              navigate('/')
            }}
          >
            Sign out
          </button>
          <button
            type="button"
            className="rounded-md p-1.5 hover:bg-zinc-800 md:hidden"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <div className="md:flex md:items-start">
        <nav
          className={`${
            open ? 'block' : 'hidden'
          } border-b border-zinc-200 bg-white md:block md:w-56 md:shrink-0 md:sticky md:top-[49px] md:max-h-[calc(100vh-49px)] md:self-start md:overflow-y-auto md:border-b-0 md:border-r`}
        >
          <div className="space-y-4 p-3">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-900'
                              : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                          }`
                        }
                      >
                        <span>{item.label}</span>
                        {item.badgeKey === 'requests' && requestCount > 0 && (
                          <span className="min-w-[1.25rem] rounded-full bg-amber-500 px-1.5 text-center text-[10px] font-bold text-white">
                            {requestCount > 99 ? '99+' : requestCount}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-3 pb-12 pt-4 sm:px-5 sm:pt-5 md:px-6 md:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
