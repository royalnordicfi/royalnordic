import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FieldLabel, FormError, FormSuccess } from '../../rewards/components/AuthFormShell'
import {
  BOOKING_ERROR_COPY,
  fetchPartnerTourAvailability,
  formatPartnerNet,
  submitPartnerBookingRequest,
  type PartnerAvailabilityDate,
} from './partnerBookings'

type Props = {
  tourId: number
  unitNetEur: number
  pickupHint?: string | null
}

function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `pb-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function PartnersBookingRequestForm({ tourId, unitNetEur, pickupHint }: Props) {
  const [dates, setDates] = useState<PartnerAvailabilityDate[]>([])
  const [pricingModel, setPricingModel] = useState('per_person')
  const [maxCapacity, setMaxCapacity] = useState(8)
  const [loadingDates, setLoadingDates] = useState(true)
  const [dateLoadError, setDateLoadError] = useState<string | null>(null)

  const [tourDate, setTourDate] = useState('')
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [pickup, setPickup] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [idemKey] = useState(() => newIdempotencyKey())

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoadingDates(true)
      setDateLoadError(null)
      const res = await fetchPartnerTourAvailability(tourId)
      if (cancelled) return
      if (!res.ok) {
        setDateLoadError(BOOKING_ERROR_COPY[res.error || ''] || res.error || 'Could not load dates.')
        setDates([])
      } else {
        setDates(res.dates)
        setPricingModel(res.pricing_model || 'per_person')
        setMaxCapacity(res.max_capacity || 8)
      }
      setLoadingDates(false)
    })()
    return () => {
      cancelled = true
    }
  }, [tourId])

  const selected = useMemo(
    () => dates.find((d) => d.date === tourDate) || null,
    [dates, tourDate],
  )

  const pax = adults + children
  const perVehicle = pricingModel === 'per_vehicle'
  const totalNet = perVehicle ? unitNetEur : Math.round(unitNetEur * pax * 100) / 100

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!tourDate) {
      setError('Choose a date.')
      return
    }
    if (pax < 1) {
      setError('Add at least one passenger.')
      return
    }
    if (selected && !perVehicle && pax > selected.remaining) {
      setError(`Only ${selected.remaining} seats left on this date.`)
      return
    }
    if (perVehicle && pax > maxCapacity) {
      setError(`This departure accepts up to ${maxCapacity} guests.`)
      return
    }
    setSubmitting(true)
    try {
      const res = await submitPartnerBookingRequest({
        tour_id: tourId,
        tour_date: tourDate,
        adults,
        children,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone || undefined,
        pickup_location: pickup || undefined,
        special_requests: notes || undefined,
        idempotency_key: idemKey,
      })
      if (!res.ok || !res.request) {
        throw new Error(BOOKING_ERROR_COPY[res.error || ''] || res.error || 'Request failed')
      }
      setReference(res.request.reference)
      setSuccess(
        res.duplicate
          ? `Request already submitted (${res.request.reference}).`
          : `Request ${res.request.reference} submitted for confirmation.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit request.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingDates) {
    return <div className="rn-rewards-skel h-48 w-full" />
  }

  if (dateLoadError) {
    return (
      <p role="alert" className="text-sm text-red-200">
        {dateLoadError}
      </p>
    )
  }

  if (reference) {
    return (
      <div className="rounded-[var(--rn-radius)] border border-aurora/30 bg-aurora/10 px-5 py-6">
        <p className="font-display text-lg font-semibold text-white">Request received</p>
        <p className="mt-2 text-sm text-[var(--rn-text-muted)]">
          Reference <span className="text-aurora-soft">{reference}</span> is pending Royal Nordic
          confirmation. No payment was collected.
        </p>
        <Link
          to="/partners/dashboard/bookings"
          className="rn-btn-primary mt-5 inline-flex min-h-[44px]"
        >
          View bookings
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="rn-rewards-auth space-y-4" noValidate>
      <div>
        <h3 className="font-display text-lg font-semibold text-white">Request booking</h3>
        <p className="mt-1 text-sm text-[var(--rn-text-muted)]">
          Uses your assigned partner net rate. Rates cannot be edited here. Confirmation is required
          before capacity is reserved.
        </p>
      </div>

      <FormError message={error} />
      <FormSuccess message={success} />

      <div>
        <FieldLabel htmlFor="pb-date">Date</FieldLabel>
        <select
          id="pb-date"
          className="rn-form-input"
          required
          value={tourDate}
          onChange={(e) => setTourDate(e.target.value)}
        >
          <option value="">Select available date…</option>
          {dates.map((d) => (
            <option key={d.date} value={d.date}>
              {d.date} · {d.remaining} left
            </option>
          ))}
        </select>
        {dates.length === 0 ? (
          <p className="mt-1 text-xs text-[var(--rn-text-dim)]">No open dates in the next 90 days.</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="pb-adults">Adults</FieldLabel>
          <input
            id="pb-adults"
            type="number"
            min={0}
            max={maxCapacity}
            className="rn-form-input"
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            required
          />
        </div>
        <div>
          <FieldLabel htmlFor="pb-children">Children</FieldLabel>
          <input
            id="pb-children"
            type="number"
            min={0}
            max={maxCapacity}
            className="rn-form-input"
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="pb-guest-name">Guest lead name</FieldLabel>
        <input
          id="pb-guest-name"
          className="rn-form-input"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="pb-guest-email">Guest email</FieldLabel>
          <input
            id="pb-guest-email"
            type="email"
            className="rn-form-input"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <FieldLabel htmlFor="pb-guest-phone">Guest phone</FieldLabel>
          <input
            id="pb-guest-phone"
            type="tel"
            className="rn-form-input"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            autoComplete="tel"
          />
        </div>
      </div>
      <div>
        <FieldLabel htmlFor="pb-pickup">Pickup / meeting details</FieldLabel>
        <input
          id="pb-pickup"
          className="rn-form-input"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          placeholder={pickupHint || 'Hotel name or address'}
        />
      </div>
      <div>
        <FieldLabel htmlFor="pb-notes">Notes (optional)</FieldLabel>
        <textarea
          id="pb-notes"
          className="rn-form-input min-h-[88px] resize-y"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="rounded-[var(--rn-radius-sm)] border border-[var(--rn-border)] bg-white/[0.03] px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rn-text-dim)]">
          Agreed total (partner net)
        </p>
        <p className="mt-1 font-display text-xl font-semibold text-aurora-soft">
          {formatPartnerNet(totalNet)}
        </p>
        <p className="mt-1 text-xs text-[var(--rn-text-muted)]">
          {perVehicle
            ? `${formatPartnerNet(unitNetEur)} net per vehicle · ${pax} guest${pax === 1 ? '' : 's'}`
            : `${formatPartnerNet(unitNetEur)} net × ${pax} guest${pax === 1 ? '' : 's'}`}
          . Not editable.
        </p>
      </div>

      <button type="submit" className="rn-btn-primary min-h-[44px] w-full sm:w-auto" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit booking request'}
      </button>
    </form>
  )
}
