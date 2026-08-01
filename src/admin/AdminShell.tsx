import React, { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Menu, X, RefreshCw } from 'lucide-react'
import {
  getAdminSession,
  onAdminAuthChange,
  signOutAdmin,
  type AdminSessionState,
} from '../lib/adminAuth'
import AdminLogin from '../components/AdminLogin'

const nav = [
  { to: '/', label: 'Home', end: true },
  { to: '/bookings', label: 'Bookings' },
  { to: '/manual', label: 'New booking' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/availability', label: 'Availability' },
  { to: '/notes', label: 'Notes' },
  { to: '/products', label: 'Products' },
  { to: '/fleet', label: 'Guides & vehicles' },
  { to: '/customers', label: 'Customers' },
  { to: '/revenue', label: 'Revenue' },
  { to: '/import', label: 'Import' },
]

export default function AdminShell() {
  const [auth, setAuth] = useState<AdminSessionState | null>(null)
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
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

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-700" />
      </div>
    )
  }

  if (!auth?.isSignedIn) {
    return <AdminLogin onSuccess={() => getAdminSession().then(setAuth)} />
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 overflow-x-clip">
      <header className="sticky top-0 z-40 bg-zinc-950 text-white px-4 py-3 flex items-center justify-between">
        <div className="min-w-0">
          <Link to="/" className="font-semibold tracking-tight">
            Royal Nordic Ops
          </Link>
          <p className="text-xs text-zinc-400 truncate">{auth.user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-sm px-3 py-1.5 bg-zinc-800 rounded-lg"
            onClick={async () => {
              await signOutAdmin()
              navigate('/')
            }}
          >
            Sign out
          </button>
          <button
            type="button"
            className="p-2 md:hidden"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Document scrolls normally; sidebar sticks — avoid nested overflow traps */}
      <div className="md:flex md:items-start">
        <nav
          className={`${
            open ? 'block' : 'hidden'
          } md:block md:w-56 md:shrink-0 md:sticky md:top-[52px] md:self-start md:max-h-[calc(100vh-52px)] md:overflow-y-auto bg-white border-b md:border-b-0 md:border-r border-zinc-200`}
        >
          <ul className="p-2 space-y-0.5">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-900'
                        : 'text-zinc-700 hover:bg-zinc-50'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 min-w-0 p-4 md:p-6 max-w-6xl w-full mx-auto pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
