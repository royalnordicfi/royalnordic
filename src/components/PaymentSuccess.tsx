import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, Loader2, Mail, Calendar, Users } from 'lucide-react'
import { formatTourDateForDisplay } from '../lib/tourDate'
import Footer from './Footer'

const REDIRECT_SECONDS = 10
const POLL_MS = 1500
const POLL_ATTEMPTS = 8

type ConfirmationBooking = {
  booking_ref?: string
  customer_name?: string
  customer_email?: string
  adults?: string | number
  children?: string | number
  total_price?: string | number
  tour_name?: string
  tour_date?: string
  tour_date_iso?: string
  status?: string
  payment_status?: string
}

function readStoredBooking(): ConfirmationBooking | null {
  const pending = sessionStorage.getItem('pendingBooking')
  if (pending) {
    try {
      const data = JSON.parse(pending) as ConfirmationBooking
      sessionStorage.setItem('confirmedBooking', pending)
      sessionStorage.removeItem('pendingBooking')
      return data
    } catch {
      sessionStorage.removeItem('pendingBooking')
    }
  }
  const confirmed = sessionStorage.getItem('confirmedBooking')
  if (confirmed) {
    try {
      return JSON.parse(confirmed) as ConfirmationBooking
    } catch {
      sessionStorage.removeItem('confirmedBooking')
    }
  }
  return null
}

async function fetchConfirmationBySession(
  sessionId: string,
): Promise<{ booking: ConfirmationBooking | null; pending: boolean; error?: string }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anon) {
    return { booking: null, pending: false, error: 'Missing configuration' }
  }
  const response = await fetch(`${supabaseUrl}/functions/v1/get-checkout-confirmation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anon}`,
      apikey: anon,
    },
    body: JSON.stringify({ session_id: sessionId }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    return { booking: null, pending: false, error: data.error || 'Unable to load confirmation' }
  }
  if (data.ok && data.booking) {
    return { booking: data.booking as ConfirmationBooking, pending: false }
  }
  return { booking: null, pending: Boolean(data.pending), error: data.error }
}

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = (searchParams.get('session_id') || '').trim()

  const [bookingData, setBookingData] = useState<ConfirmationBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS)

  useEffect(() => {
    let cancelled = false
    let timer: number | undefined

    const applyBooking = (data: ConfirmationBooking) => {
      if (cancelled) return
      setBookingData(data)
      try {
        sessionStorage.setItem('confirmedBooking', JSON.stringify(data))
      } catch {
        /* ignore quota / private mode */
      }
      setLoading(false)
    }

    const run = async () => {
      const stored = readStoredBooking()
      if (stored && (stored.tour_name || stored.customer_email || stored.total_price)) {
        // Prefer Stripe-backed confirmation when session_id is present so we get booking_ref.
        if (!sessionId) {
          applyBooking(stored)
          return
        }
      }

      if (!sessionId) {
        if (stored) {
          applyBooking(stored)
          return
        }
        if (!cancelled) {
          setLoading(false)
        }
        return
      }

      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
        try {
          const result = await fetchConfirmationBySession(sessionId)
          if (cancelled) return
          if (result.booking) {
            applyBooking({
              ...stored,
              ...result.booking,
            })
            return
          }
          if (!result.pending) {
            setLoadError(result.error || null)
            if (stored) {
              applyBooking(stored)
              return
            }
            break
          }
        } catch (err) {
          if (cancelled) return
          setLoadError(err instanceof Error ? err.message : 'Unable to load confirmation')
          if (stored) {
            applyBooking(stored)
            return
          }
        }
        await new Promise<void>((resolve) => {
          timer = window.setTimeout(resolve, POLL_MS)
        })
      }

      if (!cancelled) {
        if (stored) applyBooking(stored)
        else setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [sessionId])

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
        {loadError
          ? 'We could not load booking details here, but if payment succeeded a confirmation email is on its way.'
          : 'If you just paid, check your email for the booking confirmation. You can also browse our tours anytime.'}
      </p>
      <Link to="/" className="rn-btn-primary mt-6 inline-flex">
        Back to home
      </Link>
    </div>
  )

  const loadingState = (
    <div className="rn-prose-panel p-8 text-center">
      <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-aurora-soft" aria-hidden />
      <h1 className="font-display text-xl font-semibold text-white">Confirming your booking…</h1>
      <p className="mt-2 text-sm text-text-muted">This usually takes a few seconds.</p>
    </div>
  )

  return (
    <div className="rn-page flex min-h-screen flex-col">
      <div className="rn-status-page">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-80" aria-hidden />
        <div className="rn-container relative w-full max-w-lg">
          {loading ? (
            loadingState
          ) : !bookingData ? (
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
                {bookingData.booking_ref && (
                  <p className="mt-3 text-sm font-semibold text-aurora-soft">
                    Booking reference: {bookingData.booking_ref}
                  </p>
                )}
              </div>

              <div className="mt-6 rounded-rn border border-white/10 bg-surface-2 p-4">
                <h2 className="text-sm font-semibold text-white">Booking details</h2>
                <div className="mt-3 space-y-2 text-sm text-text-muted">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 shrink-0 text-aurora-soft" aria-hidden />
                    <span>
                      {bookingData.adults ?? 0} adults, {bookingData.children ?? 0} children
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0 text-aurora-soft" aria-hidden />
                    <span>
                      {formatTourDateForDisplay(bookingData.tour_date_iso || bookingData.tour_date)}
                    </span>
                  </div>
                  <p className="pt-1 font-semibold text-white">Total: €{bookingData.total_price}</p>
                </div>
              </div>

              <div className="mt-4 rounded-rn border border-white/10 bg-surface-2 p-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-aurora-soft" aria-hidden />
                  <h3 className="text-sm font-semibold text-white">Confirmation email</h3>
                </div>
                {bookingData.customer_email && (
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
