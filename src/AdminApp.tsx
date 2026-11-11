import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AdminShell from './admin/AdminShell'
import OperatorPortalRedirect from './admin/OperatorPortalRedirect'
import HomePage from './admin/pages/HomePage'
import BookingsPage from './admin/pages/BookingsPage'
import BookingDetailPage from './admin/pages/BookingDetailPage'
import ManualBookingPage from './admin/pages/ManualBookingPage'
import CalendarPage from './admin/pages/CalendarPage'
import ProductsPage from './admin/pages/ProductsPage'
import ProductEditorPage from './admin/pages/ProductEditorPage'
import CustomersPage from './admin/pages/CustomersPage'
import RevenuePage from './admin/pages/RevenuePage'
import ImportPage from './admin/pages/ImportPage'
import AvailabilityPage from './admin/pages/AvailabilityPage'
import RequestsPage from './admin/pages/RequestsPage'
import IntegrationsPage from './admin/pages/IntegrationsPage'
import PartnersPage from './admin/pages/PartnersPage'
import PartnerBookingsPage from './admin/pages/PartnerBookingsPage'
import SharedBookingsPage from './admin/pages/SharedBookingsPage'
import SharedDepartureDetailPage from './admin/pages/SharedDepartureDetailPage'
import SharedIntegrationsPage from './admin/pages/SharedIntegrationsPage'
import SharedOperatorsPage from './admin/pages/SharedOperatorsPage'
import { SharedBookingsBaseProvider } from './admin/sharedBookingsPaths'
import { SHARED_BOOKINGS_ADMIN_BASE } from './lib/sharedBookingsPortal'

/**
 * Royal Nordic admin console — admin.royalnordic.fi only.
 * Operator auth UI lives on royalnordic.fi/admin/sharedbookings (separate app root).
 */
function AdminApp() {
  useEffect(() => {
    document.title = 'Royal Nordic Admin'
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

  return (
    <SharedBookingsBaseProvider base={SHARED_BOOKINGS_ADMIN_BASE}>
      <Router>
        <Routes>
          {/* Operator login/setup on admin host → public portal (separate auth storage). */}
          <Route path="sharedbookings/login" element={<OperatorPortalRedirect subpath="/login" />} />
          <Route
            path="sharedbookings/setup-password"
            element={<OperatorPortalRedirect subpath="/setup-password" />}
          />
          <Route
            path="sharedbookings/access-denied"
            element={<OperatorPortalRedirect subpath="/access-denied" />}
          />
          <Route element={<AdminShell />}>
            <Route index element={<HomePage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="bookings/:id" element={<BookingDetailPage />} />
            <Route path="manual" element={<ManualBookingPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="availability" element={<AvailabilityPage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:id" element={<ProductEditorPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="partners" element={<PartnersPage />} />
            <Route path="partner-bookings" element={<PartnerBookingsPage />} />
            <Route path="sharedbookings" element={<SharedBookingsPage />} />
            <Route path="sharedbookings/operators" element={<SharedOperatorsPage />} />
            <Route path="sharedbookings/integrations" element={<SharedIntegrationsPage />} />
            <Route path="sharedbookings/:id" element={<SharedDepartureDetailPage />} />
            <Route path="revenue" element={<RevenuePage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </SharedBookingsBaseProvider>
  )
}

export default AdminApp
