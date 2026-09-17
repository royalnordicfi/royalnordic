import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Mail, Calendar, Users } from 'lucide-react'
import { formatTourDateForDisplay } from '../lib/tourDate'
import Footer from './Footer'

const PaymentSuccess: React.FC = () => {
  const [emailSent, setEmailSent] = useState(false)
  const [bookingData, setBookingData] = useState<any>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('pendingBooking')
    if (stored) {
      const data = JSON.parse(stored)
      setBookingData(data)
      // Keep a copy so refresh still shows confirmation details
      sessionStorage.setItem('confirmedBooking', stored)
      sessionStorage.removeItem('pendingBooking')
      setEmailSent(true)
      return
    }

    const confirmed = sessionStorage.getItem('confirmedBooking')
    if (confirmed) {
      setBookingData(JSON.parse(confirmed))
      setEmailSent(true)
    }
  }, [])

  const emptyState = (
    <div className="rn-prose-panel p-8 text-center">
      <CheckCircle className="mx-auto mb-4 h-12 w-12 text-aurora-soft" aria-hidden />
      <h1 className="font-display text-xl font-semibold text-white">Looking for your confirmation?</h1>
      <p className="mt-2 text-sm text-text-muted">
        If you just paid, check your email for the booking confirmation. You can also browse our tours
        anytime.
      </p>
      <Link to="/" className="rn-btn-primary mt-6 inline-flex">
        Back to home
      </Link>
    </div>
  )

  return (
    <div className="rn-page flex min-h-screen flex-col">
      <div className="rn-status-page">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-80" aria-hidden />
        <div className="rn-container relative w-full max-w-lg">
          {!bookingData ? (
            emptyState
          ) : (
            <div className="rn-prose-panel p-6 sm:p-8">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-aurora/20">
                  <CheckCircle className="h-7 w-7 text-aurora-soft" aria-hidden />
                </div>
                <h1 className="font-display text-2xl font-semibold text-white">Payment successful</h1>
                <p className="mt-2 text-sm text-text-muted">
                  Your {bookingData.tour_name || 'tour'} is confirmed.
                </p>
              </div>

              <div className="mt-6 rounded-rn border border-white/10 bg-surface-2 p-4">
                <h2 className="text-sm font-semibold text-white">Booking details</h2>
                <div className="mt-3 space-y-2 text-sm text-text-muted">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 shrink-0 text-aurora-soft" aria-hidden />
                    <span>
                      {bookingData.adults} adults, {bookingData.children} children
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0 text-aurora-soft" aria-hidden />
                    <span>{formatTourDateForDisplay(bookingData.tour_date_iso || bookingData.tour_date)}</span>
                  </div>
                  <p className="pt-1 font-semibold text-white">Total: €{bookingData.total_price}</p>
                </div>
              </div>

              <div className="mt-4 rounded-rn border border-white/10 bg-surface-2 p-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-aurora-soft" aria-hidden />
                  <h3 className="text-sm font-semibold text-white">Confirmation email</h3>
                </div>
                {emailSent && (
                  <p className="mt-2 text-xs text-aurora-soft">
                    A confirmation will be sent to {bookingData.customer_email}
                  </p>
                )}
              </div>

              <div className="mt-4 rounded-rn border border-white/10 bg-surface-2 p-4">
                <h3 className="text-sm font-semibold text-white">What happens next</h3>
                <ul className="mt-2 space-y-1 text-xs text-text-muted">
                  <li>Check your email for instructions</li>
                  <li>Meeting details before your tour date</li>
                  <li>Contact us if anything looks wrong</li>
                </ul>
              </div>

              <Link to="/" className="rn-btn-secondary mt-6 flex w-full">
                Back to home
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default PaymentSuccess
