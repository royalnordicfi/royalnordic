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
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-700" />
      </div>
    )
  }

  if (!auth?.isSignedIn) {
    return <AdminLogin onSuccess={() => getAdminSession().then(setAuth)} />
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 overflow-x-clip">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950 text-white px-4 py-2.5 flex items-center justify-between">
        <div className="min-w-0">
          <Link to="/" className="text-sm font-semibold tracking-tight">
            Royal Nordic Ops
          </Link>
          <p className="text-[11px] text-zinc-400 truncate">{auth.user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/manual"
            className="hidden sm:inline-flex text-xs font-medium px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500"
          >
            + Booking
          </Link>
          <button
            type="button"
            className="text-xs px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md"
            onClick={async () => {
              await signOutAdmin()
              navigate('/')
            }}
          >
            Sign out
          </button>
          <button
            type="button"
            className="p-1.5 md:hidden"
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
          } md:block md:w-52 md:shrink-0 md:sticky md:top-[49px] md:self-start md:max-h-[calc(100vh-49px)] md:overflow-y-auto bg-white border-b md:border-b-0 md:border-r border-zinc-200`}
        >
          <div className="p-2 space-y-3">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
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
                          `flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-900'
                              : 'text-zinc-700 hover:bg-zinc-50'
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

        <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-5 max-w-6xl w-full mx-auto pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
