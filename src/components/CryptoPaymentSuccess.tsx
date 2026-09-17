import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Mail, Calendar, Users, Phone } from 'lucide-react'
import { formatTourDateForDisplay } from '../lib/tourDate'
import Footer from './Footer'

const CryptoPaymentSuccess: React.FC = () => {
  const [bookingData, setBookingData] = useState<any>(null)

  useEffect(() => {
    // Get booking data from sessionStorage
    const stored = sessionStorage.getItem('cryptoBooking')
    if (stored) {
      const data = JSON.parse(stored)
      setBookingData(data)

      // Clear the stored data
      sessionStorage.removeItem('cryptoBooking')
    }
  }, [])

  return (
    <div className="rn-page flex min-h-screen flex-col">
      <div className="rn-section flex-1 bg-midnight pt-28 sm:pt-32">
        <div className="rn-container max-w-lg">
          {!bookingData ? (
            <div className="rounded-rn border border-white/10 bg-surface p-8 text-center shadow-rn-soft">
              <p className="text-3xl" aria-hidden>
                ⚠️
              </p>
              <h1 className="mt-3 font-display text-xl font-semibold text-white">No booking data found</h1>
              <p className="mt-2 text-sm text-text-muted">
                Return to the tour page and submit your crypto booking again.
              </p>
              <Link to="/" className="rn-btn-primary mt-6 inline-flex">
                Back to home
              </Link>
            </div>
          ) : (
            <div className="rounded-rn border border-white/10 bg-surface p-6 shadow-rn sm:p-8">
              <div className="text-center">
                <CheckCircle className="mx-auto mb-4 h-14 w-14 text-aurora-soft" aria-hidden />
                <h1 className="font-display text-2xl font-semibold text-white">Crypto booking submitted</h1>
                <p className="mt-2 text-sm text-text-muted">We received your request and will follow up by email.</p>
              </div>

              <div className="mt-6 rounded-rn border border-white/10 bg-surface-2 p-4">
                <h3 className="text-sm font-semibold text-white">Booking details</h3>
                <div className="mt-3 space-y-2 text-xs text-text-muted">
                  <p>
                    <span className="text-text-dim">Tour:</span> {bookingData.tour_name || 'Tour'}
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-aurora-soft" aria-hidden />
                    <span>{formatTourDateForDisplay(bookingData.tour_date_iso || bookingData.tour_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-aurora-soft" aria-hidden />
                    <span>
                      {bookingData.adults} adults, {bookingData.children} children
                    </span>
                  </div>
                  <p>Total: €{bookingData.total_price}</p>
                  <p>Payment: {bookingData.crypto_type?.toUpperCase() || 'Cryptocurrency'}</p>
                </div>
              </div>

              <div className="mt-4 rounded-rn border border-aurora/25 bg-aurora/10 p-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-aurora-soft" aria-hidden />
                  <h3 className="text-sm font-semibold text-white">Payment instructions</h3>
                </div>
                <div className="mt-2 text-xs text-text-muted">
                  <p>We will send wallet details to:</p>
                  <p className="mt-1 text-white">{bookingData.customer_email}</p>
                  {bookingData.customer_phone && (
                    <div className="mt-2 flex items-center gap-2">
                      <Phone className="h-3 w-3 text-aurora-soft" aria-hidden />
                      <span>{bookingData.customer_phone}</span>
                    </div>
                  )}
                  <p className="mt-2 text-aurora-soft">
                    Expect payment details within 24 hours. Complete payment within 48 hours once received.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-rn border border-white/10 bg-surface-2 p-4">
                <h3 className="text-sm font-semibold text-white">What happens next</h3>
                <ul className="mt-2 space-y-1 text-xs text-text-muted">
                  <li>Check email for payment instructions</li>
                  <li>Send crypto within the stated window</li>
                  <li>Final confirmation after payment is verified</li>
                  <li>Meeting details before your tour</li>
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

export default CryptoPaymentSuccess
