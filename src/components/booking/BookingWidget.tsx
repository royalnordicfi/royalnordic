import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTourAvailability } from '../../hooks/useTourAvailability'
import {
  BOOKING_DRAFT_VERSION,
  checkoutPathFromDraft,
  computeBookingSubtotal,
  readBookingDraft,
  saveBookingDraft,
  type BookingPricingModel,
} from '../../lib/bookingDraft'
import { formatEuroAmount } from '../../lib/tourPricing'
import DatePickerField from './DatePickerField'
import GuestSteppers from './GuestSteppers'

export type BookingWidgetProps = {
  tourId: number
  tourName: string
  adultPrice: number
  childPrice: number
  maxCapacity?: number
  seasonStart?: string
  seasonEnd?: string
  departureTime?: string
  meetingPointDeparture?: boolean
  meetingPoint?: string
  pricingModel?: BookingPricingModel
  cancellationNote?: string
  /** Collect hotel/pickup address on /checkout (private tours). */
  requiresHotelPickup?: boolean
  /** Override total note under the price (e.g. private group). */
  totalNote?: string
  /** Override guest-stepper note for flat group pricing. */
  guestPriceNote?: string
}

export default function BookingWidget({
  tourId,
  tourName,
  adultPrice,
  childPrice,
  maxCapacity,
  seasonStart,
  seasonEnd,
  departureTime,
  meetingPointDeparture = false,
  meetingPoint,
  pricingModel = 'per_person',
  cancellationNote = 'Free cancellation up to 24 hours before departure.',
  requiresHotelPickup = false,
  totalNote,
  guestPriceNote,
}: BookingWidgetProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const returnPath = `${location.pathname}${location.search || ''}#book`
  const perVehicle = pricingModel === 'per_vehicle'

  const {
    loading,
    error,
    liveAdultPrice,
    liveChildPrice,
    hasOpenDates,
    getAvailableSlots,
    findDateRow,
    getCalendarGrid,
  } = useTourAvailability({
    tourId,
    adultPrice,
    childPrice,
    maxCapacity,
    seasonStart,
    seasonEnd,
    pricingModel,
  })

  const [preferredDate, setPreferredDate] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [localError, setLocalError] = useState('')

  // Restore draft selection when returning from checkout to edit.
  useEffect(() => {
    const draft = readBookingDraft()
    if (!draft || draft.tourId !== tourId) return
    setPreferredDate(draft.tourDateIso)
    setAdults(Math.max(1, draft.adults))
    setChildren(Math.max(0, draft.children))
  }, [tourId])

  const seatsLeft = preferredDate ? getAvailableSlots(preferredDate) : 0
  const maxGuests = preferredDate
    ? Math.max(1, seatsLeft || maxCapacity || 1)
    : Math.max(1, maxCapacity || 8)
  const partySize = adults + children

  useEffect(() => {
    if (!preferredDate) return
    if (partySize <= maxGuests) return
    const overflow = partySize - maxGuests
    if (children >= overflow) setChildren(children - overflow)
    else {
      setChildren(0)
      setAdults(Math.max(1, maxGuests))
    }
  }, [preferredDate, maxGuests, partySize, children])

  const subtotal = useMemo(
    () =>
      computeBookingSubtotal(pricingModel, adults, children, liveAdultPrice, liveChildPrice),
    [pricingModel, adults, children, liveAdultPrice, liveChildPrice],
  )

  const continueBooking = () => {
    setLocalError('')
    if (!preferredDate) {
      setLocalError('Please select a date.')
      return
    }
    const row = findDateRow(preferredDate)
    if (!row?.id) {
      setLocalError('This date is no longer available. Please choose another date.')
      return
    }
    const available = getAvailableSlots(preferredDate)
    if (available <= 0) {
      setLocalError(
        perVehicle
          ? 'This private departure is no longer available. Please choose another date.'
          : 'This date is sold out. Please choose another date.',
      )
      return
    }
    if (partySize > available) {
      setLocalError(
        `Only ${available} place${available === 1 ? '' : 's'} left on this date.`,
      )
      return
    }

    const draft = {
      v: BOOKING_DRAFT_VERSION,
      createdAt: new Date().toISOString(),
      returnPath,
      tourId,
      tourName,
      tourDateId: row.id,
      tourDateIso: preferredDate,
      adults,
      children,
      pricingModel,
      adultPrice: liveAdultPrice,
      childPrice: liveChildPrice,
      maxCapacity,
      seasonStart,
      seasonEnd,
      departureTime,
      meetingPointDeparture,
      meetingPoint,
      requiresHotelPickup,
    }
    saveBookingDraft(draft)
    navigate(checkoutPathFromDraft(draft))
  }

  return (
    <div className="rn-book-widget">
      <DatePickerField
        selectedDate={preferredDate}
        onSelect={(date) => {
          setPreferredDate(date)
          setLocalError('')
        }}
        loading={loading}
        hasOpenDates={hasOpenDates}
        error={error}
        seasonStart={seasonStart}
        seasonEnd={seasonEnd}
        departureTime={departureTime}
        meetingPointDeparture={meetingPointDeparture}
        adultPrice={liveAdultPrice}
        partySize={Math.max(1, partySize)}
        getCalendarGrid={getCalendarGrid}
      />

      {preferredDate ? (
        <>
          <GuestSteppers
            adults={adults}
            children={children}
            maxGuests={maxGuests}
            adultPrice={liveAdultPrice}
            childPrice={liveChildPrice}
            pricingModel={pricingModel}
            formatMoney={formatEuroAmount}
            priceNote={guestPriceNote}
            partyNoun={requiresHotelPickup || !perVehicle ? 'guests' : 'passengers'}
            onChange={({ adults: a, children: c }) => {
              setAdults(a)
              setChildren(c)
              setLocalError('')
            }}
          />
          {seatsLeft > 0 ? (
            <p className="rn-book-widget__seats">
              {perVehicle
                ? `Exclusive for your group · up to ${maxGuests} guests`
                : seatsLeft === 1
                  ? '1 seat left on this departure'
                  : `${seatsLeft} seats left on this departure`}
            </p>
          ) : null}
        </>
      ) : null}

      <div className="rn-book-widget__total">
        <div>
          <p className="rn-book-widget__label">Total</p>
          <p className="rn-book-widget__total-note">
            {totalNote || (perVehicle ? 'Per vehicle · VAT incl.' : 'VAT included')}
          </p>
        </div>
        <p className="rn-book-widget__total-value">€{formatEuroAmount(subtotal)}</p>
      </div>

      {(localError || error) && preferredDate ? (
        <p className="rn-book-widget__error" role="alert">
          {localError || error}
        </p>
      ) : null}
      {localError && !preferredDate ? (
        <p className="rn-book-widget__error" role="alert">
          {localError}
        </p>
      ) : null}

      <p className="rn-book-widget__cancel">{cancellationNote}</p>

      <button
        type="button"
        className="rn-btn-primary rn-book-widget__cta"
        onClick={continueBooking}
        disabled={loading}
      >
        Continue to booking
      </button>
    </div>
  )
}
