import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createCheckoutSession, redirectToCheckout } from '../lib/stripe'
import {
  computeBookingSubtotal,
  readBookingDraft,
  saveBookingDraft,
  type BookingDraft,
} from '../lib/bookingDraft'
import { formatTourDateLong } from '../lib/tourDate'
import { formatEuroAmount } from '../lib/tourPricing'
import { departureSuffixForTour } from '../lib/tourBookingRules'
import {
  getWinterDiscountAmount,
  isTourExcludedFromWinterPromo,
  markCodeAppliedThisSession,
  trackWinterPromoEvent,
} from '../lib/winterPromotion'
import { WINTER_PROMOTION } from '../config/winterPromotion'
import {
  isRewardsCreditRedemptionUiEnabled,
  isRewardsDiscountUiEnabled,
} from '../config/rewardsBooking'
import { fetchCreditBalance, formatEuroFromCents } from '../rewards/api'
import {
  computeReferralAwareTotal,
  isTourEligibleForReferralDiscount,
} from '../lib/referralDiscount'
import { normalizeReferralCode } from '../rewards/codes'
import {
  persistReferralCode,
  readPersistedReferralCode,
} from '../rewards/attribution'
import { supabase } from '../lib/supabase'
import { CHECKOUT_RETURN_PATH_KEY } from './PaymentCancelled'
import { useTourAvailability } from '../hooks/useTourAvailability'
import { useTourCms } from '../hooks/useTourCms'

function CheckoutBrandBar() {
  return (
    <header className="rn-checkout-brand">
      <Link to="/" className="rn-checkout-brand__link" aria-label="Royal Nordic home">
        <img src="/logo.png" alt="" width={28} height={28} className="rn-checkout-brand__mark" />
        <span className="rn-checkout-brand__name">Royal Nordic</span>
      </Link>
    </header>
  )
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [draft, setDraft] = useState<BookingDraft | null>(() => readBookingDraft())
  const [fullName, setFullName] = useState(draft?.customerName || '')
  const [email, setEmail] = useState(draft?.customerEmail || '')
  const [phone, setPhone] = useState(draft?.phone || '')
  const [specialRequests, setSpecialRequests] = useState(draft?.specialRequests || '')
  const [pickupLocation, setPickupLocation] = useState(draft?.pickupLocation || '')
  const [discountCode, setDiscountCode] = useState(draft?.discountCode || '')
  const [referralCode, setReferralCode] = useState(
    () => draft?.referralCode || readPersistedReferralCode() || '',
  )
  const [referralResolved, setReferralResolved] = useState<{
    ok: boolean
    eligible?: boolean
    error?: string
    normalized?: string
  } | null>(null)
  const [referralChecking, setReferralChecking] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showCrypto, setShowCrypto] = useState(false)
  const [cryptoType, setCryptoType] = useState('bitcoin')
  const rewardsDiscountsOn = isRewardsDiscountUiEnabled()
  const creditRedemptionOn = isRewardsCreditRedemptionUiEnabled()
  const [creditAvailableCents, setCreditAvailableCents] = useState(0)
  const [creditApplyCents, setCreditApplyCents] = useState(0)
  const [creditUserId, setCreditUserId] = useState<string | null>(null)

  useEffect(() => {
    const stored = readBookingDraft()
    if (stored) {
      setDraft(stored)
      if (stored.pickupLocation) setPickupLocation(stored.pickupLocation)
      if (stored.referralCode) setReferralCode(stored.referralCode)
      else if (!referralCode) {
        const persisted = readPersistedReferralCode()
        if (persisted) setReferralCode(persisted)
      }
    }
  }, [location.search])

  useEffect(() => {
    if (!creditRedemptionOn) {
      setCreditAvailableCents(0)
      setCreditApplyCents(0)
      setCreditUserId(null)
      return
    }
    let alive = true
    void supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user
      if (!alive) return
      if (!user) {
        setCreditAvailableCents(0)
        setCreditApplyCents(0)
        setCreditUserId(null)
        return
      }
      setCreditUserId(user.id)
      try {
        const bal = await fetchCreditBalance(user.id)
        if (!alive) return
        setCreditAvailableCents(bal?.available_cents || 0)
      } catch {
        if (!alive) return
        setCreditAvailableCents(0)
      }
    })
    return () => {
      alive = false
    }
  }, [creditRedemptionOn])

  useEffect(() => {
    if (!rewardsDiscountsOn || !draft) {
      setReferralResolved(null)
      return
    }
    const normalized = normalizeReferralCode(referralCode)
    if (normalized.length < 4) {
      setReferralResolved(null)
      return
    }
    let alive = true
    setReferralChecking(true)
    const handle = window.setTimeout(() => {
      void supabase
        .rpc('resolve_referral_code_for_checkout', {
          p_code: normalized,
          p_tour_id: draft.tourId,
          p_customer_email: email.trim() || null,
        })
        .then(({ data, error: rpcError }) => {
          if (!alive) return
          if (rpcError) {
            setReferralResolved({ ok: false, error: 'unavailable' })
            return
          }
          setReferralResolved((data || { ok: false }) as {
            ok: boolean
            eligible?: boolean
            error?: string
            normalized?: string
          })
          if (data?.ok && data?.normalized) {
            persistReferralCode(String(data.normalized))
          }
        })
        .finally(() => {
          if (alive) setReferralChecking(false)
        })
    }, 350)
    return () => {
      alive = false
      window.clearTimeout(handle)
    }
  }, [referralCode, draft?.tourId, email, rewardsDiscountsOn, draft])

  const {
    loading: availabilityLoading,
    liveAdultPrice,
    liveChildPrice,
    getAvailableSlots,
    findDateRow,
    reload,
  } = useTourAvailability({
    tourId: draft?.tourId || 0,
    adultPrice: draft?.adultPrice || 0,
    childPrice: draft?.childPrice || 0,
    maxCapacity: draft?.maxCapacity,
    seasonStart: draft?.seasonStart,
    seasonEnd: draft?.seasonEnd,
    absoluteFrom: draft?.absoluteFrom,
    absoluteTo: draft?.absoluteTo,
    pricingModel: draft?.pricingModel,
  })

  const { tour: cmsTour } = useTourCms(draft?.tourId || 0)
  const summaryImage =
    cmsTour?.hero_image_url ||
    cmsTour?.gallery?.[0]?.url ||
    cmsTour?.seo_image ||
    ''

  // Sync live prices into draft when availability returns.
  useEffect(() => {
    setDraft((current) => {
      if (!current || current.tourId <= 0) return current
      if (liveAdultPrice === current.adultPrice && liveChildPrice === current.childPrice) {
        return current
      }
      const next = {
        ...current,
        adultPrice: liveAdultPrice,
        childPrice: liveChildPrice,
      }
      saveBookingDraft(next)
      return next
    })
  }, [liveAdultPrice, liveChildPrice])

  const perVehicle = draft?.pricingModel === 'per_vehicle'
  const promoAllowed =
    !!draft && !perVehicle && !isTourExcludedFromWinterPromo(draft.tourId, draft.tourName)
  const referralUiEligible =
    rewardsDiscountsOn &&
    !!draft &&
    !perVehicle &&
    isTourEligibleForReferralDiscount(draft.tourId)

  const subtotal = useMemo(() => {
    if (!draft) return 0
    return computeBookingSubtotal(
      draft.pricingModel,
      draft.adults,
      draft.children,
      liveAdultPrice || draft.adultPrice,
      liveChildPrice || draft.childPrice,
    )
  }, [draft, liveAdultPrice, liveChildPrice])

  const winterDiscount = promoAllowed
    ? getWinterDiscountAmount(subtotal, discountCode, undefined, undefined, {
        tourId: draft!.tourId,
        tourName: draft!.tourName,
      })
    : 0

  const referralPricing = computeReferralAwareTotal({
    subtotal,
    tourId: draft?.tourId || 0,
    pricingModel: draft?.pricingModel || 'per_person',
    promoCode: winterDiscount > 0 ? discountCode : '',
    referralCode,
    discountsEnabled: rewardsDiscountsOn,
    referralCodeValid: referralResolved?.ok === true,
    tourEligible:
      referralResolved?.eligible != null
        ? Boolean(referralResolved.eligible)
        : referralUiEligible,
  })

  const usingReferral = referralPricing.referralApplied && winterDiscount <= 0
  const discount = usingReferral ? referralPricing.referralDiscount : winterDiscount
  const payableAfterDiscount = Math.max(0, subtotal - discount)
  const payableCents = Math.round(payableAfterDiscount * 100)
  const maxCreditCents =
    creditRedemptionOn && creditUserId
      ? Math.min(creditAvailableCents, payableCents)
      : 0
  const appliedCreditCents = Math.min(Math.max(0, creditApplyCents), maxCreditCents)
  const creditEuros = appliedCreditCents / 100
  const cashDue = Math.max(0, Math.round((payableAfterDiscount - creditEuros) * 100) / 100)
  const total = payableAfterDiscount
  const discountType = usingReferral ? 'referral' : winterDiscount > 0 ? 'winter_promo' : 'none'
  const seatsLeft = draft ? getAvailableSlots(draft.tourDateIso) : 0
  const partySize = draft ? draft.adults + draft.children : 0
  const dateStillOpen = draft
    ? Boolean(findDateRow(draft.tourDateIso) && seatsLeft > 0 && partySize <= seatsLeft)
    : false
  const needsPickup = Boolean(draft?.requiresHotelPickup)

  const persistContact = () => {
    if (!draft) return
    const next = {
      ...draft,
      customerName: fullName.trim(),
      customerEmail: email.trim(),
      phone: phone.trim(),
      specialRequests: specialRequests.trim(),
      pickupLocation: needsPickup ? pickupLocation.trim() : draft.pickupLocation,
      discountCode: promoAllowed ? discountCode.trim().toUpperCase() : '',
      referralCode: normalizeReferralCode(referralCode) || undefined,
      adultPrice: liveAdultPrice || draft.adultPrice,
      childPrice: liveChildPrice || draft.childPrice,
    }
    saveBookingDraft(next)
    setDraft(next)
  }

  const validate = () => {
    if (!draft) {
      setError('Your booking selection expired. Please choose a date again.')
      return false
    }
    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return false
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return false
    }
    if (needsPickup && pickupLocation.trim().length < 5) {
      setError('Please enter your hotel or pickup address in the supported Rovaniemi area.')
      return false
    }
    if (!dateStillOpen) {
      setError('This date is no longer available. Please edit your booking and choose another date.')
      return false
    }
    return true
  }

  const payWithStripe = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validate() || !draft) return
    persistContact()
    setSubmitting(true)
    try {
      await reload()
      const row = findDateRow(draft.tourDateIso)
      const available = getAvailableSlots(draft.tourDateIso)
      if (!row?.id || available <= 0 || draft.adults + draft.children > available) {
        throw new Error(
          available <= 0
            ? 'This date is sold out. Please edit your booking.'
            : `Only ${available} place${available === 1 ? '' : 's'} left. Please edit guest counts.`,
        )
      }

      const code = promoAllowed && !usingReferral ? discountCode.trim().toUpperCase() : ''
      const refCode = usingReferral
        ? normalizeReferralCode(referralResolved?.normalized || referralCode)
        : ''
      if (winterDiscount > 0) {
        markCodeAppliedThisSession()
        trackWinterPromoEvent('winter20_code_applied', { tour_name: draft.tourName, discount })
      }
      trackWinterPromoEvent('winter20_booking_started', { tour_name: draft.tourName })

      if (usingReferral && referralResolved?.error === 'self_referral') {
        throw new Error('You cannot use your own referral code')
      }
      if (normalizeReferralCode(referralCode) && rewardsDiscountsOn && !usingReferral && winterDiscount <= 0) {
        const reason = referralPricing.referralBlockedReason
        if (reason === 'cannot_stack_with_promo') {
          throw new Error('Referral and promotional discounts cannot be combined')
        }
        if (reason === 'not_eligible_product') {
          throw new Error('This experience is not eligible for referral discounts')
        }
        if (referralResolved && !referralResolved.ok) {
          throw new Error(
            referralResolved.error === 'self_referral'
              ? 'You cannot use your own referral code'
              : 'Invalid referral code',
          )
        }
      }

      const returnPath = draft.returnPath || '/'
      sessionStorage.setItem(CHECKOUT_RETURN_PATH_KEY, returnPath)

      const tourDate = formatTourDateLong(draft.tourDateIso)
      const creditIdem = `ui:${creditUserId || 'anon'}:${row.id}:${payableCents}:${appliedCreditCents}:${Date.now()}`
      const checkoutData = {
        amount: cashDue,
        currency: 'eur',
        tour_name: draft.tourName,
        tour_date: tourDate,
        cancel_path: returnPath,
        metadata: {
          tour_id: String(draft.tourId),
          tour_date_id: String(row.id),
          tour_date_iso: draft.tourDateIso,
          customer_name: fullName.trim(),
          customer_email: email.trim(),
          adults: String(draft.adults),
          children: String(draft.children),
          total_price: String(payableAfterDiscount),
          payable_total: String(payableAfterDiscount),
          subtotal: String(subtotal),
          discount: String(discount),
          discount_code: code,
          discount_type: discountType,
          referral_code: refCode,
          credit_cents: String(appliedCreditCents),
          credit_idempotency_key: creditIdem.slice(0, 160),
          pricing_model: draft.pricingModel,
          phone: phone.trim(),
          special_requests: specialRequests.trim(),
          ...(draft.departureTime ? { tour_time: draft.departureTime } : {}),
          ...(draft.meetingPointDeparture && draft.meetingPoint
            ? { meeting_point: `Meeting point: ${draft.meetingPoint}` }
            : {}),
          ...(needsPickup && pickupLocation.trim()
            ? { pickup_location: pickupLocation.trim() }
            : {}),
        },
      }

      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      const result = await createCheckoutSession(
        checkoutData,
        appliedCreditCents > 0 ? { accessToken } : undefined,
      )

      sessionStorage.setItem(
        'pendingBooking',
        JSON.stringify({
          customer_name: fullName.trim(),
          customer_email: email.trim(),
          adults: String(draft.adults),
          children: String(draft.children),
          total_price: String(payableAfterDiscount),
          tour_date: tourDate,
          tour_date_iso: draft.tourDateIso,
          tour_name: draft.tourName,
          phone: phone.trim(),
          special_requests: specialRequests.trim(),
          booking_ref: result.bookingRef,
        }),
      )

      if (result.creditOnly && result.bookingRef) {
        sessionStorage.setItem(
          'confirmedBooking',
          JSON.stringify({
            customer_name: fullName.trim(),
            customer_email: email.trim(),
            adults: String(draft.adults),
            children: String(draft.children),
            total_price: String(payableAfterDiscount),
            tour_date: tourDate,
            tour_date_iso: draft.tourDateIso,
            tour_name: draft.tourName,
            booking_ref: result.bookingRef,
          }),
        )
        sessionStorage.removeItem('pendingBooking')
        navigate('/payment-success', { replace: true })
        return
      }

      if (!result.sessionId) {
        throw new Error('Payment could not be started. Please try again.')
      }
      await redirectToCheckout(result.sessionId)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Payment could not be started. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const payWithCrypto = async () => {
    setError('')
    if (!validate() || !draft) return
    persistContact()
    setSubmitting(true)
    try {
      const row = findDateRow(draft.tourDateIso)
      if (!row?.id) throw new Error('This date is no longer available.')
      const code = promoAllowed ? discountCode.trim().toUpperCase() : ''
      const tourDate = formatTourDateLong(draft.tourDateIso)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-crypto-booking`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tour_id: draft.tourId,
            tour_date_id: row.id,
            customer_name: fullName.trim(),
            customer_email: email.trim(),
            customer_phone: phone.trim(),
            adults: draft.adults,
            children: draft.children,
            total_price: total,
            subtotal,
            discount,
            discount_code: code,
            tour_name: draft.tourName,
            tour_date: tourDate,
            tour_date_iso: draft.tourDateIso,
            crypto_type: cryptoType,
            special_requests: specialRequests.trim(),
            payment_type: 'crypto',
          }),
        },
      )
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create crypto booking')
      }
      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Crypto booking failed')
      sessionStorage.setItem(
        'cryptoBooking',
        JSON.stringify({
          customer_name: fullName.trim(),
          customer_email: email.trim(),
          customer_phone: phone.trim(),
          adults: String(draft.adults),
          children: String(draft.children),
          total_price: String(total),
          tour_date: tourDate,
          tour_date_iso: draft.tourDateIso,
          tour_name: draft.tourName,
          crypto_type: cryptoType,
          special_requests: specialRequests.trim(),
        }),
      )
      setShowCrypto(false)
      navigate('/crypto-payment-success')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Crypto booking failed. Please try card payment.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!draft) {
    return (
      <div className="rn-checkout-page">
        <CheckoutBrandBar />
        <main className="rn-checkout rn-checkout--empty">
          <h1 className="rn-checkout__title">Checkout</h1>
          <p className="rn-checkout__lede">
            No booking selection found. Choose a date on a tour page to continue.
          </p>
          <Link to="/northern-lights-tours" className="rn-btn-primary inline-flex">
            Browse Northern Lights tours
          </Link>
        </main>
      </div>
    )
  }

  const editHref = draft.returnPath || '/'
  const dateLabel = `${formatTourDateLong(draft.tourDateIso)}${departureSuffixForTour(draft.tourName, draft.departureTime)}`

  return (
    <div className="rn-checkout-page">
      <CheckoutBrandBar />
      <main className="rn-checkout">
        <div className="rn-checkout__intro">
          <p className="rn-checkout__eyebrow">Secure checkout</p>
          <h1 className="rn-checkout__title">Complete your booking</h1>
          <Link to={editHref} className="rn-checkout__edit">
            ← Edit date or guests
          </Link>
        </div>

        <div className="rn-checkout__grid">
          <form className="rn-checkout__form" onSubmit={payWithStripe} noValidate>
            <section className="rn-checkout__card">
              <h2 className="rn-checkout__section-title">Your details</h2>
              <label className="rn-checkout__field">
                <span>Full name</span>
                <input
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </label>
              <label className="rn-checkout__field">
                <span>Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className="rn-checkout__field">
                <span>Phone (optional)</span>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
              {needsPickup ? (
                <label className="rn-checkout__field">
                  <span>Hotel / pickup address</span>
                  <input
                    type="text"
                    autoComplete="street-address"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="Hotel or accommodation in Rovaniemi"
                    required
                  />
                  <span className="rn-checkout__field-hint">
                    Pickup and drop-off are included within the supported Rovaniemi area. Exact pickup
                    time is confirmed after booking and may be earlier than departure.
                  </span>
                </label>
              ) : null}
              <label className="rn-checkout__field">
                <span>Special requests (optional)</span>
                <textarea
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                />
              </label>
            </section>

            {promoAllowed ? (
              <section className="rn-checkout__card">
                <h2 className="rn-checkout__section-title">Promo code</h2>
                <label className="rn-checkout__field">
                  <span>{WINTER_PROMOTION.discountCode}</span>
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Enter code"
                    autoCapitalize="characters"
                    disabled={usingReferral}
                  />
                </label>
                {winterDiscount > 0 ? (
                  <p className="rn-checkout__promo-ok">
                    Code applied − €{formatEuroAmount(winterDiscount)}
                  </p>
                ) : null}
                {usingReferral ? (
                  <p className="rn-checkout__field-hint">Clear the referral code to use a promo instead.</p>
                ) : null}
              </section>
            ) : null}

            {rewardsDiscountsOn ? (
              <section className="rn-checkout__card">
                <h2 className="rn-checkout__section-title">Referral code</h2>
                <label className="rn-checkout__field">
                  <span>Friend&apos;s Rewards code</span>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="e.g. ALEX10"
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={winterDiscount > 0}
                  />
                </label>
                {!referralUiEligible ? (
                  <p className="rn-checkout__field-hint">
                    Referral discounts apply to selected Northern Lights tours only.
                  </p>
                ) : null}
                {referralChecking ? (
                  <p className="rn-checkout__field-hint">Checking code…</p>
                ) : null}
                {usingReferral ? (
                  <p className="rn-checkout__promo-ok">
                    Referral applied − €{formatEuroAmount(referralPricing.referralDiscount)}
                  </p>
                ) : null}
                {referralResolved && !referralResolved.ok && normalizeReferralCode(referralCode).length >= 4 ? (
                  <p className="rn-checkout__error" role="status">
                    {referralResolved.error === 'self_referral'
                      ? 'You cannot use your own referral code.'
                      : 'This referral code is not valid.'}
                  </p>
                ) : null}
                {winterDiscount > 0 ? (
                  <p className="rn-checkout__field-hint">Promo codes cannot be combined with referrals.</p>
                ) : null}
              </section>
            ) : (
              <section className="rn-checkout__card">
                <h2 className="rn-checkout__section-title">Referral code</h2>
                <p className="rn-checkout__terms">
                  Rewards referral discounts are prepared but not active on live checkout yet.
                  Codes and dashboards work — guest discounts activate after approval.
                </p>
              </section>
            )}

            {creditRedemptionOn ? (
              <section className="rn-checkout__card">
                <h2 className="rn-checkout__section-title">Royal Nordic Credit</h2>
                {!creditUserId ? (
                  <p className="rn-checkout__terms">
                    Sign in to your Rewards account to apply available Royal Nordic Credit. This is
                    separate from a friend&apos;s referral code.
                  </p>
                ) : maxCreditCents <= 0 ? (
                  <p className="rn-checkout__terms">
                    No available Royal Nordic Credit on this account yet.
                  </p>
                ) : (
                  <>
                    <p className="rn-checkout__field-hint">
                      Available: {formatEuroFromCents(creditAvailableCents)}. Apply up to{' '}
                      {formatEuroFromCents(maxCreditCents)} on this booking.
                    </p>
                    <label className="rn-checkout__field">
                      <span>Credit to apply (€)</span>
                      <input
                        type="number"
                        min={0}
                        max={maxCreditCents / 100}
                        step={0.01}
                        value={(appliedCreditCents / 100).toFixed(2)}
                        onChange={(e) => {
                          const euros = Number(e.target.value)
                          if (!Number.isFinite(euros) || euros <= 0) {
                            setCreditApplyCents(0)
                            return
                          }
                          setCreditApplyCents(
                            Math.min(maxCreditCents, Math.max(0, Math.round(euros * 100))),
                          )
                        }}
                      />
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rn-btn-secondary"
                        onClick={() => setCreditApplyCents(maxCreditCents)}
                      >
                        Apply max
                      </button>
                      <button
                        type="button"
                        className="rn-btn-secondary"
                        onClick={() => setCreditApplyCents(0)}
                      >
                        Clear
                      </button>
                    </div>
                  </>
                )}
              </section>
            ) : null}

            <section className="rn-checkout__card">
              <h2 className="rn-checkout__section-title">Cancellation</h2>
              <p className="rn-checkout__terms">
                Free cancellation up to 24 hours before departure. Cancellations within 24 hours are
                non-refundable.
              </p>
              {draft.meetingPointDeparture ? (
                <p className="rn-checkout__terms">
                  Meeting point departure
                  {draft.meetingPoint ? ` at ${draft.meetingPoint}` : ''}. Hotel pickup is not included.
                </p>
              ) : null}
            </section>

            {error ? (
              <p className="rn-checkout__error" role="alert">
                {error}
              </p>
            ) : null}
            {!availabilityLoading && !dateStillOpen ? (
              <p className="rn-checkout__error" role="alert">
                This date is no longer available for your party size.{' '}
                <Link to={editHref}>Edit booking</Link>
              </p>
            ) : null}

            <button
              type="submit"
              className="rn-btn-primary rn-checkout__pay"
              disabled={submitting || availabilityLoading || !dateStillOpen}
            >
              {submitting
                ? 'Confirming…'
                : cashDue <= 0.009 && appliedCreditCents > 0
                  ? 'Confirm with Royal Nordic Credit'
                  : `Pay €${formatEuroAmount(cashDue)} securely`}
            </button>
            <button
              type="button"
              className="rn-checkout__crypto"
              onClick={() => setShowCrypto(true)}
              disabled={submitting || !dateStillOpen || appliedCreditCents > 0}
            >
              Prefer crypto? Request a crypto booking
            </button>
            <p className="rn-checkout__secure">Visa · Mastercard · Apple Pay · Google Pay via Stripe</p>
          </form>

          <aside className="rn-checkout__summary">
            <div className="rn-checkout__summary-card">
              {summaryImage ? (
                <div className="rn-checkout__thumb">
                  <img src={summaryImage} alt="" width={120} height={90} loading="lazy" decoding="async" />
                </div>
              ) : null}
              <p className="rn-checkout__eyebrow">Booking summary</p>
              <h2 className="rn-checkout__summary-title">{draft.tourName}</h2>
              <dl className="rn-checkout__summary-list">
                <div>
                  <dt>Date</dt>
                  <dd>{dateLabel}</dd>
                </div>
                <div>
                  <dt>{needsPickup ? 'Guests' : perVehicle ? 'Passengers' : 'Guests'}</dt>
                  <dd>
                    {draft.adults} adult{draft.adults === 1 ? '' : 's'}
                    {draft.children > 0
                      ? `, ${draft.children} child${draft.children === 1 ? '' : 'ren'}`
                      : ''}
                  </dd>
                </div>
                {needsPickup && pickupLocation.trim() ? (
                  <div>
                    <dt>Pickup</dt>
                    <dd>{pickupLocation.trim()}</dd>
                  </div>
                ) : null}
                {perVehicle ? (
                  <div>
                    <dt>{needsPickup ? 'Private group' : 'Vehicle'}</dt>
                    <dd>€{formatEuroAmount(liveAdultPrice || draft.adultPrice)}</dd>
                  </div>
                ) : (
                  <>
                    <div>
                      <dt>Adults</dt>
                      <dd>
                        {draft.adults} × €{formatEuroAmount(liveAdultPrice || draft.adultPrice)}
                      </dd>
                    </div>
                    {draft.children > 0 ? (
                      <div>
                        <dt>Children</dt>
                        <dd>
                          {draft.children} × €{formatEuroAmount(liveChildPrice || draft.childPrice)}
                        </dd>
                      </div>
                    ) : null}
                  </>
                )}
                <div>
                  <dt>Subtotal</dt>
                  <dd>€{formatEuroAmount(subtotal)}</dd>
                </div>
                {discount > 0 ? (
                  <div>
                    <dt>{usingReferral ? 'Referral (10% off)' : 'Discount'}</dt>
                    <dd>− €{formatEuroAmount(discount)}</dd>
                  </div>
                ) : null}
                {appliedCreditCents > 0 ? (
                  <div>
                    <dt>Royal Nordic Credit</dt>
                    <dd>− €{formatEuroAmount(creditEuros)}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="rn-checkout__summary-total">
                <span>{appliedCreditCents > 0 ? 'Amount due' : 'Total'}</span>
                <strong>€{formatEuroAmount(cashDue)}</strong>
              </div>
              {appliedCreditCents > 0 ? (
                <p className="mt-2 text-xs text-[var(--rn-text-dim)]">
                  Booking total €{formatEuroAmount(payableAfterDiscount)} after discounts
                </p>
              ) : null}
              <Link to={editHref} className="rn-checkout__summary-edit">
                Change date or guests
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {showCrypto ? (
        <div className="rn-checkout-modal" role="dialog" aria-modal="true" aria-label="Crypto booking">
          <div className="rn-checkout-modal__panel">
            <h3>Crypto booking request</h3>
            <p>We will email payment instructions after you submit this request.</p>
            <label className="rn-checkout__field">
              <span>Crypto type</span>
              <select value={cryptoType} onChange={(e) => setCryptoType(e.target.value)}>
                <option value="bitcoin">Bitcoin</option>
                <option value="ethereum">Ethereum</option>
                <option value="usdt">USDT</option>
              </select>
            </label>
            <div className="rn-checkout-modal__actions">
              <button type="button" className="rn-btn-primary" onClick={payWithCrypto} disabled={submitting}>
                Submit request
              </button>
              <button type="button" className="rn-checkout__crypto" onClick={() => setShowCrypto(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
