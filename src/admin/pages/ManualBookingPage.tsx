import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createAdminPaymentLink,
  createManualBooking,
  fetchGuides,
  fetchProducts,
  fetchVehicles,
} from '../adminApi'
import type { BookingSource, Guide, PaymentStatus, Product, Vehicle } from '../types'
import { SOURCE_LABELS } from '../types'
import {
  Card,
  ErrorBanner,
  Field,
  PageHeader,
  PrimaryButton,
  SectionLabel,
  inputClass,
  selectClass,
  textareaClass,
} from '../components/ui'

type PaymentMethod = 'already_paid' | 'payment_link' | 'pay_on_arrival' | 'complimentary'

const PAYMENT_METHODS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: 'already_paid', label: 'Already paid', hint: 'Confirm booking as paid now' },
  {
    id: 'payment_link',
    label: 'Payment link',
    hint: 'Create pending booking and Stripe checkout link (TEST/live per Stripe key)',
  },
  { id: 'pay_on_arrival', label: 'Pay on arrival', hint: 'Confirm place · unpaid until arrival' },
  { id: 'complimentary', label: 'Complimentary', hint: 'Confirmed · €0' },
]

export default function ManualBookingPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [guides, setGuides] = useState<Guide[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [paymentLinkUrl, setPaymentLinkUrl] = useState('')

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [tourId, setTourId] = useState('')
  const [date, setDate] = useState('')
  const [tourTime, setTourTime] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [totalPrice, setTotalPrice] = useState('')
  const [priceTouched, setPriceTouched] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('already_paid')
  const [pickup, setPickup] = useState('')
  const [destination, setDestination] = useState('')
  const [source, setSource] = useState<BookingSource>('manual')
  const [notes, setNotes] = useState('')
  const [guideId, setGuideId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [sendConfirmation, setSendConfirmation] = useState(true)
  const [sendPaymentEmail, setSendPaymentEmail] = useState(false)

  useEffect(() => {
    Promise.all([fetchProducts(), fetchGuides(), fetchVehicles()])
      .then(([p, g, v]) => {
        const active = p
          .filter((x) => x.is_active !== false)
          .sort((a, b) =>
            (a.public_name || a.name).localeCompare(b.public_name || b.name, 'en'),
          )
        setProducts(active)
        if (active[0]) {
          setTourId(String(active[0].id))
          if (active[0].departure_time) setTourTime(active[0].departure_time.slice(0, 5))
        }
        setGuides(g.filter((x) => x.is_active))
        setVehicles(v.filter((x) => x.is_active && x.status !== 'maintenance'))
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [])

  const selected = useMemo(
    () => products.find((x) => String(x.id) === tourId) || null,
    [products, tourId],
  )
  const perVehicle = selected?.pricing_model === 'per_vehicle'
  const maxGuests = selected?.max_capacity || (perVehicle ? 8 : 50)
  const isTransfer =
    !!selected &&
    (/transfer/i.test(selected.name) ||
      /transfer/i.test(selected.public_name || '') ||
      selected.id === 9)
  const needsPickup =
    !!selected &&
    (isTransfer ||
      selected.id === 11 ||
      /private northern lights/i.test(selected.public_name || selected.name))

  useEffect(() => {
    if (!selected || priceTouched) return
    if (paymentMethod === 'complimentary') {
      setTotalPrice('0')
      return
    }
    const price = perVehicle
      ? Number(selected.adult_price)
      : Number(selected.adult_price) * adults + Number(selected.child_price) * children
    setTotalPrice(String(Math.round(price * 100) / 100))
  }, [selected, adults, children, perVehicle, priceTouched, paymentMethod])

  useEffect(() => {
    if (!selected) return
    if (selected.departure_time) setTourTime(selected.departure_time.slice(0, 5))
    setPriceTouched(false)
    setAdults(1)
    setChildren(0)
  }, [selected?.id])

  useEffect(() => {
    const party = adults + children
    if (party <= maxGuests) return
    const overflow = party - maxGuests
    if (children >= overflow) setChildren(children - overflow)
    else {
      setChildren(0)
      setAdults(Math.max(1, maxGuests))
    }
  }, [adults, children, maxGuests])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setPaymentLinkUrl('')
    try {
      if (!selected) throw new Error('Select a product')
      const party = adults + children
      if (party < 1 || party > maxGuests) {
        throw new Error(`Guest count must be between 1 and ${maxGuests}`)
      }

      let payment_status: PaymentStatus = 'unpaid'
      let booking_status: 'pending' | 'confirmed' = 'pending'
      let payment_type = 'manual'
      let price = Number(totalPrice)
      let shouldEmail = sendConfirmation

      if (paymentMethod === 'already_paid') {
        payment_status = 'paid'
        booking_status = 'confirmed'
        payment_type = 'manual_paid'
      } else if (paymentMethod === 'payment_link') {
        payment_status = 'unpaid'
        booking_status = 'pending'
        payment_type = 'admin_payment_link'
        shouldEmail = false
      } else if (paymentMethod === 'pay_on_arrival') {
        payment_status = 'unpaid'
        booking_status = 'confirmed'
        payment_type = 'pay_on_arrival'
      } else if (paymentMethod === 'complimentary') {
        payment_status = 'paid'
        booking_status = 'confirmed'
        payment_type = 'complimentary'
        price = 0
      }

      const noteParts = [
        notes.trim(),
        destination.trim() ? `Destination: ${destination.trim()}` : '',
      ].filter(Boolean)

      const booking = await createManualBooking({
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim() || undefined,
        tour_id: Number(tourId),
        tour_date: date,
        tour_time: tourTime || selected.departure_time || undefined,
        adults,
        children,
        total_price: price,
        payment_status,
        payment_type,
        booking_status,
        pickup_location: pickup.trim() || undefined,
        source,
        notes: noteParts.join('\n') || undefined,
        guide_id: guideId ? Number(guideId) : null,
        vehicle_id: vehicleId ? Number(vehicleId) : null,
        send_confirmation: shouldEmail,
      })

      if (paymentMethod === 'payment_link') {
        const link = await createAdminPaymentLink(booking.id, {
          sendEmail: sendPaymentEmail,
        })
        setPaymentLinkUrl(link.url)
        navigate(
          `/bookings/${booking.id}?payment_link=1${link.email_sent ? '&emailed=1' : ''}`,
        )
        return
      }

      navigate(`/bookings/${booking.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="New booking"
        subtitle="All active products · same capacity and pricing rules as public checkout"
        actions={
          <Link to="/bookings" className="text-sm font-medium text-emerald-800 hover:underline">
            ← Bookings
          </Link>
        }
      />

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}
      {paymentLinkUrl ? (
        <Card className="border-emerald-200 bg-emerald-50/60">
          <p className="text-sm font-medium text-emerald-900">Payment link created</p>
          <p className="mt-1 break-all text-xs text-emerald-800">{paymentLinkUrl}</p>
        </Card>
      ) : null}

      <form onSubmit={submit} className="space-y-4">
        <Card className="space-y-3">
          <SectionLabel>1 · Product</SectionLabel>
          <Field label="Product *">
            <select
              required
              className={selectClass}
              value={tourId}
              onChange={(e) => setTourId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.public_name || p.name}
                  {p.pricing_model === 'per_vehicle'
                    ? ` · €${p.adult_price} / group`
                    : ` · €${p.adult_price}`}
                </option>
              ))}
            </select>
          </Field>
          {selected ? (
            <p className="text-xs text-zinc-500">
              {perVehicle
                ? `Exclusive allocation · max ${maxGuests} guests · flat group price`
                : `Shared capacity · max ${maxGuests} guests · per person`}
              {selected.departure_time ? ` · departs ${selected.departure_time.slice(0, 5)}` : ''}
            </p>
          ) : null}
        </Card>

        <Card className="space-y-3">
          <SectionLabel>2 · Date & guests</SectionLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Date *">
              <input
                required
                type="date"
                className={inputClass}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="Time">
              <input
                type="time"
                className={inputClass}
                value={tourTime}
                onChange={(e) => setTourTime(e.target.value)}
              />
            </Field>
            <Field label={perVehicle ? 'Adults in group *' : 'Adults *'}>
              <input
                required
                type="number"
                min={1}
                max={maxGuests}
                className={inputClass}
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
              />
            </Field>
            <Field label={perVehicle ? 'Children in group' : 'Children'}>
              <input
                type="number"
                min={0}
                max={maxGuests}
                className={inputClass}
                value={children}
                onChange={(e) => setChildren(Number(e.target.value))}
              />
            </Field>
          </div>
          {needsPickup ? (
            <Field
              label={isTransfer ? 'Pickup location *' : 'Hotel / pickup address *'}
              hint={
                isTransfer
                  ? 'Pickup point for the transfer'
                  : 'Required for private Northern Lights · exact pickup time confirmed later'
              }
            >
              <input
                required={needsPickup}
                className={inputClass}
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Hotel or address"
              />
            </Field>
          ) : (
            <Field label="Pickup (optional)">
              <input className={inputClass} value={pickup} onChange={(e) => setPickup(e.target.value)} />
            </Field>
          )}
          {isTransfer ? (
            <Field label="Destination" hint="Used for custom / long-distance transfer notes">
              <input
                className={inputClass}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Levi, Saariselkä, Kittilä Airport"
              />
            </Field>
          ) : null}
        </Card>

        <Card className="space-y-3">
          <SectionLabel>3 · Customer</SectionLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Full name *" className="sm:col-span-2">
              <input
                required
                className={inputClass}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </Field>
            <Field label="Email *">
              <input
                required
                type="email"
                className={inputClass}
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </Field>
            <Field label="Phone">
              <input
                className={inputClass}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                inputMode="tel"
              />
            </Field>
          </div>
        </Card>

        <Card className="space-y-3">
          <SectionLabel>4 · Payment & ops</SectionLabel>
          <Field label="Payment method *">
            <div className="grid gap-2">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 ${
                    paymentMethod === m.id
                      ? 'border-emerald-500 bg-emerald-50/70'
                      : 'border-zinc-200 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    className="mt-1"
                    checked={paymentMethod === m.id}
                    onChange={() => {
                      setPaymentMethod(m.id)
                      setPriceTouched(false)
                    }}
                  />
                  <span>
                    <span className="block text-sm font-medium text-zinc-900">{m.label}</span>
                    <span className="block text-[11px] text-zinc-500">{m.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </Field>
          <Field
            label="Total € *"
            hint={
              perVehicle
                ? 'Flat group price — do not multiply by guests'
                : 'Auto-calculated from catalogue; editable for custom quotes'
            }
          >
            <input
              required
              type="number"
              min={0}
              step="0.01"
              className={inputClass}
              value={totalPrice}
              onChange={(e) => {
                setPriceTouched(true)
                setTotalPrice(e.target.value)
              }}
              disabled={paymentMethod === 'complimentary'}
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Guide">
              <select className={selectClass} value={guideId} onChange={(e) => setGuideId(e.target.value)}>
                <option value="">Assign later</option>
                {guides.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Vehicle">
              <select
                className={selectClass}
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
              >
                <option value="">Assign later</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} (cap {v.passenger_capacity})
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Source">
            <select
              className={selectClass}
              value={source}
              onChange={(e) => setSource(e.target.value as BookingSource)}
            >
              {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Internal notes">
            <textarea className={textareaClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          {paymentMethod !== 'payment_link' ? (
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={sendConfirmation}
                onChange={(e) => setSendConfirmation(e.target.checked)}
              />
              Send confirmation email now
            </label>
          ) : (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={sendPaymentEmail}
                  onChange={(e) => setSendPaymentEmail(e.target.checked)}
                />
                Email payment request to customer now
              </label>
              <p className="text-xs text-zinc-500">
                Booking stays pending until Stripe confirms payment. Confirmation email sends
                automatically after paid webhook. Live customer sharing requires explicit approval.
              </p>
            </div>
          )}
        </Card>

        <PrimaryButton type="submit" disabled={saving || products.length === 0} className="w-full">
          {saving
            ? 'Creating…'
            : paymentMethod === 'payment_link'
              ? 'Create booking + payment link'
              : 'Create booking'}
        </PrimaryButton>
      </form>
    </div>
  )
}
