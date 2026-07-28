import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AdminShell from './admin/AdminShell'
import HomePage from './admin/pages/HomePage'
import BookingsPage from './admin/pages/BookingsPage'
import BookingDetailPage from './admin/pages/BookingDetailPage'
import ManualBookingPage from './admin/pages/ManualBookingPage'
import CalendarPage from './admin/pages/CalendarPage'
import ProductsPage from './admin/pages/ProductsPage'
import FleetPage from './admin/pages/FleetPage'
import CustomersPage from './admin/pages/CustomersPage'
import RevenuePage from './admin/pages/RevenuePage'
import ImportPage from './admin/pages/ImportPage'
import NotesPage from './admin/pages/NotesPage'

/**
 * Operator console — only mounted when hostname is admin.royalnordic.fi
 * (or local ?admin=1 override).
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
    <Router>
      <Routes>
        <Route element={<AdminShell />}>
          <Route index element={<HomePage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
          <Route path="manual" element={<ManualBookingPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="fleet" element={<FleetPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="revenue" element={<RevenuePage />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="integrations" element={<Navigate to="/" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default AdminApp
