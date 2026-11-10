import { useEffect } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import SharedBookingsShell from './admin/SharedBookingsShell'
import SharedBookingsAccessDeniedPage from './admin/pages/SharedBookingsAccessDeniedPage'
import SharedBookingsLoginPage from './admin/pages/SharedBookingsLoginPage'
import SharedBookingsPasswordSetupPage from './admin/pages/SharedBookingsPasswordSetupPage'
import SharedDepartureDetailPage from './admin/pages/SharedDepartureDetailPage'
import SharedOperatorBoardPage from './admin/pages/SharedOperatorBoardPage'
import { SharedBookingsBaseProvider } from './admin/sharedBookingsPaths'
import { SHARED_BOOKINGS_PORTAL_BASE } from './lib/sharedBookingsPortal'

/**
 * Isolated Shared Bookings operator portal for royalnordic.fi/admin/sharedbookings.
 * Never mounts AdminShell or RN admin navigation.
 */
export default function SharedBookingsApp() {
  useEffect(() => {
    document.title = 'Royal Nordic Shared Bookings'
    const robots = document.querySelector('meta[name="robots"]')
    if (robots) {
      robots.setAttribute('content', 'noindex, nofollow')
    } else {
      const meta = document.createElement('meta')
      meta.name = 'robots'
      meta.content = 'noindex, nofollow'
      document.head.appendChild(meta)
    }
  }, [])

  const base = SHARED_BOOKINGS_PORTAL_BASE

  return (
    <SharedBookingsBaseProvider base={base}>
      <Router>
        <Routes>
          <Route path={`${base}/login`} element={<SharedBookingsLoginPage />} />
          <Route path={`${base}/setup-password`} element={<SharedBookingsPasswordSetupPage />} />
          <Route path={`${base}/access-denied`} element={<SharedBookingsAccessDeniedPage />} />
          <Route path={base} element={<SharedBookingsShell />}>
            <Route index element={<SharedOperatorBoardPage />} />
            <Route path=":id" element={<SharedDepartureDetailPage />} />
          </Route>
          <Route path="*" element={<Navigate to={`${base}/login`} replace />} />
        </Routes>
      </Router>
    </SharedBookingsBaseProvider>
  )
}
