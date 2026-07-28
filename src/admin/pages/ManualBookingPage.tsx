import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createManualBooking, fetchGuides, fetchProducts, fetchVehicles } from '../adminApi'
import type { BookingSource, Guide, PaymentStatus, Product, Vehicle } from '../types'
import { PAYMENT_LABELS, SOURCE_LABELS } from '../types'

export default function ManualBookingPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [guides, setGuides] = useState<Guide[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [tourId, setTourId] = useState('')
  const [date, setDate] = useState('')
  const [tourTime, setTourTime] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [totalPrice, setTotalPrice] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid')
  const [pickup, setPickup] = useState('')
  const [source, setSource] = useState<BookingSource>('manual')
  const [notes, setNotes] = useState('')
  const [guideId, setGuideId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [sendConfirmation, setSendConfirmation] = useState(true)

  useEffect(() => {
    Promise.all([fetchProducts(), fetchGuides(), fetchVehicles()])
      .then(([p, g, v]) => {
        setProducts(p.filter((x) => x.is_active !== false))
        if (p[0]) setTourId(String(p[0].id))
        setGuides(g.filter((x) => x.is_active))
        setVehicles(v.filter((x) => x.is_active && x.status !== 'maintenance'))
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [])

  useEffect(() => {
    const p = products.find((x) => String(x.id) === tourId)
    if (p) {
      const price = Number(p.adult_price) * adults + Number(p.child_price) * children
      setTotalPrice(String(price))
    }
  }, [tourId, adults, children, products])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const booking = await createManualBooking({
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim() || undefined,
        tour_id: Number(tourId),
        tour_date: date,
        tour_time: tourTime || undefined,
        adults,
        children,
        total_price: Number(totalPrice),
        payment_status: paymentStatus,
        pickup_location: pickup || undefined,
        source,
        notes: notes || undefined,
        guide_id: guideId ? Number(guideId) : null,
        vehicle_id: vehicleId ? Number(vehicleId) : null,
        send_confirmation: sendConfirmation,
      })
      navigate(`/bookings/${booking.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Manual booking</h1>
      <p className="text-sm text-gray-500">
        Creates a real booking, optional confirmation email, then assignable on the detail page.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-3 bg-white border border-gray-200 rounded-xl p-4">
        <Field label="Customer name *">
          <input required className="w-full border rounded-lg px-3 py-2 text-sm" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </Field>
        <Field label="Email *">
          <input required type="email" className="w-full border rounded-lg px-3 py-2 text-sm" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className="w-full border rounded-lg px-3 py-2 text-sm" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} inputMode="tel" />
        </Field>
        <Field label="Product *">
          <select required className="w-full border rounded-lg px-3 py-2 text-sm" value={tourId} onChange={(e) => setTourId(e.target.value)}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.public_name || p.name} · €{p.adult_price}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Date *">
            <input required type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Time">
            <input type="time" className="w-full border rounded-lg px-3 py-2 text-sm" value={tourTime} onChange={(e) => setTourTime(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Adults *">
            <input required type="number" min={1} className="w-full border rounded-lg px-3 py-2 text-sm" value={adults} onChange={(e) => setAdults(Number(e.target.value))} />
          </Field>
          <Field label="Children">
            <input type="number" min={0} className="w-full border rounded-lg px-3 py-2 text-sm" value={children} onChange={(e) => setChildren(Number(e.target.value))} />
          </Field>
        </div>
        <Field label="Total price € *">
          <input required type="number" min={0} step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} />
        </Field>
        <Field label="Payment status">
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}>
            {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Pickup">
          <input className="w-full border rounded-lg px-3 py-2 text-sm" value={pickup} onChange={(e) => setPickup(e.target.value)} />
        </Field>
        <Field label="Guide (optional)">
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={guideId} onChange={(e) => setGuideId(e.target.value)}>
            <option value="">Assign later</option>
            {guides.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Vehicle (optional)">
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">Assign later</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name} (cap {v.passenger_capacity})</option>
            ))}
          </select>
        </Field>
        <Field label="Source">
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={source} onChange={(e) => setSource(e.target.value as BookingSource)}>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Notes">
          <textarea className="w-full border rounded-lg px-3 py-2 text-sm min-h-[72px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={sendConfirmation} onChange={(e) => setSendConfirmation(e.target.checked)} />
          Send confirmation email now (existing template)
        </label>
        <button type="submit" disabled={saving} className="w-full bg-emerald-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50">
          {saving ? 'Creating…' : 'Create booking'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-500 mb-1">{label}</span>
      {children}
    </label>
  )
}
