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
  { to: '/products', label: 'Products' },
  { to: '/fleet', label: 'Guides & vehicles' },
  { to: '/customers', label: 'Customers' },
  { to: '/revenue', label: 'Revenue' },
  { to: '/import', label: 'Import' },
  { to: '/integrations', label: 'Integrations' },
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
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="sticky top-0 z-40 bg-black text-white px-4 py-3 flex items-center justify-between">
        <div className="min-w-0">
          <Link to="/" className="font-semibold tracking-wide">
            Royal Nordic Ops
          </Link>
          <p className="text-xs text-gray-400 truncate">{auth.user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-sm px-3 py-1.5 bg-gray-800 rounded"
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

      <div className="md:flex md:min-h-[calc(100vh-56px)]">
        <nav
          className={`${
            open ? 'block' : 'hidden'
          } md:block md:w-56 bg-white border-b md:border-b-0 md:border-r border-gray-200`}
        >
          <ul className="p-2 space-y-1">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2.5 rounded text-sm font-medium ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 p-4 md:p-6 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
