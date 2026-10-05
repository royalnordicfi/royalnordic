import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, Mail, Calendar, Users } from 'lucide-react'
import { formatTourDateForDisplay } from '../lib/tourDate'
import Footer from './Footer'

const REDIRECT_SECONDS = 10

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate()
  const [emailSent, setEmailSent] = useState(false)
  const [bookingData, setBookingData] = useState<any>(null)
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS)

  useEffect(() => {
    const stored = sessionStorage.getItem('pendingBooking')
    if (stored) {
      const data = JSON.parse(stored)
      setBookingData(data)
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

  useEffect(() => {
    if (!bookingData) return
    setSecondsLeft(REDIRECT_SECONDS)
    const tick = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(tick)
          navigate('/', { replace: true })
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(tick)
  }, [bookingData, navigate])

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
            <div className="rn-prose-panel rn-success-card p-6 sm:p-8">
              <div className="text-center">
                <div className="rn-success-check mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-aurora/20">
                  <CheckCircle className="h-9 w-9 text-aurora-soft" aria-hidden />
                </div>
                <h1 className="font-display text-2xl font-semibold text-white sm:text-[1.75rem]">
                  Payment successful
                </h1>
                <p className="mt-2 text-sm text-text-muted">
                  Your {bookingData.tour_name || 'experience'} is confirmed.
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

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-[11px] text-text-dim">
                  <span>Returning home</span>
                  <span className="tabular-nums text-aurora-soft">{secondsLeft}s</span>
                </div>
                <div className="rn-success-progress" aria-hidden>
                  <div
                    className="rn-success-progress__bar"
                    style={{ animationDuration: `${REDIRECT_SECONDS}s` }}
                  />
                </div>
              </div>

              <Link to="/" className="rn-btn-primary mt-5 flex w-full justify-center">
                Go to homepage now
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
