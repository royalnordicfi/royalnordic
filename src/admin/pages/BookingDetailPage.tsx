import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  fetchBooking,
  fetchBookingEvents,
  fetchGuides,
  fetchVehicles,
  updateBookingOps,
} from '../adminApi'
import type { BookingEvent, Guide, OpsBooking, Vehicle } from '../types'
import { Badge, statusTone } from '../components/Badge'
import {
  PAYMENT_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  type BookingSource,
  type BookingStatus,
  type PaymentStatus,
} from '../types'

export default function BookingDetailPage() {
  const { id } = useParams()
  const bookingId = Number(id)
  const [booking, setBooking] = useState<OpsBooking | null>(null)
  const [events, setEvents] = useState<BookingEvent[]>([])
  const [guides, setGuides] = useState<Guide[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const [pickup, setPickup] = useState('')
  const [tourTime, setTourTime] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [guideId, setGuideId] = useState<string>('')
  const [vehicleId, setVehicleId] = useState<string>('')
  const [status, setStatus] = useState<BookingStatus>('pending')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid')
  const [source, setSource] = useState<BookingSource>('direct_website')

  const load = async () => {
    setError('')
    try {
      const b = await fetchBooking(bookingId)
      setBooking(b)
      setPickup(b.pickup_location || '')
      setTourTime(b.tour_time || '')
      setInternalNotes(b.internal_notes || '')
      setGuideId(b.guide_id ? String(b.guide_id) : '')
      setVehicleId(b.vehicle_id ? String(b.vehicle_id) : '')
      setStatus(b.status)
      setPaymentStatus(b.payment_status || 'unpaid')
      setSource(b.source || 'direct_website')
      const [ev, g, v] = await Promise.all([
        fetchBookingEvents(bookingId),
        fetchGuides(),
        fetchVehicles(),
      ])
      setEvents(ev)
      setGuides(g.filter((x) => x.is_active))
      setVehicles(v.filter((x) => x.is_active))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    }
  }

  useEffect(() => {
    if (bookingId) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId])

  const save = async (patch?: Parameters<typeof updateBookingOps>[1]) => {
    setSaving(true)
    setMsg('')
    setError('')
    try {
      const updated = await updateBookingOps(bookingId, {
        pickup_location: pickup || null,
        tour_time: tourTime || null,
        internal_notes: internalNotes || null,
        guide_id: guideId ? Number(guideId) : null,
        vehicle_id: vehicleId ? Number(vehicleId) : null,
        status,
        payment_status: paymentStatus,
        source,
        ...patch,
      })
      setBooking(updated)
      setMsg('Saved')
      setEvents(await fetchBookingEvents(bookingId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!booking && !error) return <p className="text-sm text-gray-600">Loading…</p>
  if (!booking) {
    return (
      <div className="space-y-3">
        <Link to="/bookings" className="text-sm text-emerald-800">
          ← Bookings
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-24">
      <Link to="/bookings" className="text-sm text-emerald-800 font-medium">
        ← Bookings
      </Link>

      <div className="flex justify-between gap-2 items-start">
        <div>
          <h1 className="text-xl font-bold">{booking.booking_ref || `RN-${booking.id}`}</h1>
          <p className="text-sm text-gray-600">{booking.customer_name}</p>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <Badge tone={statusTone(booking.status)}>{STATUS_LABELS[booking.status]}</Badge>
          <Badge tone={statusTone(booking.payment_status)}>
            {PAYMENT_LABELS[booking.payment_status]}
          </Badge>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded">
          {error}
        </div>
      )}
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-3 rounded">
          {msg}
        </div>
      )}

      <Card title="Customer">
        <Row k="Name" v={booking.customer_name} />
        <Row k="Email" v={booking.customer_email} />
        <Row k="Phone" v={booking.customer_phone || '—'} />
      </Card>

      <Card title="Tour">
        <Row k="Product" v={booking.tours?.public_name || booking.tours?.name || '—'} />
        <Row k="Date" v={booking.tour_dates?.date || '—'} />
        <Row k="Passengers" v={`${booking.adults} adults, ${booking.children} children`} />
        <Row k="Total" v={`€${Number(booking.total_price).toFixed(2)}`} />
        <Row k="Source" v={SOURCE_LABELS[booking.source] || booking.source} />
        <Row k="Stripe / ref" v={booking.stripe_payment_intent_id || '—'} />
      </Card>

      <Card title="Operations">
        <label className="block text-xs text-gray-500 mb-1">Tour time</label>
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          value={tourTime}
          onChange={(e) => setTourTime(e.target.value)}
          placeholder="20:00"
        />
        <label className="block text-xs text-gray-500 mb-1">Pickup location</label>
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          placeholder="Hotel / address"
        />
        <label className="block text-xs text-gray-500 mb-1">Guide</label>
        <select
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          value={guideId}
          onChange={(e) => setGuideId(e.target.value)}
        >
          <option value="">Unassigned</option>
          {guides.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <label className="block text-xs text-gray-500 mb-1">Vehicle</label>
        <select
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
        >
          <option value="">Unassigned</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} (cap {v.passenger_capacity})
            </option>
          ))}
        </select>
        <label className="block text-xs text-gray-500 mb-1">Booking status</label>
        <select
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          value={status}
          onChange={(e) => setStatus(e.target.value as BookingStatus)}
        >
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <label className="block text-xs text-gray-500 mb-1">Payment status</label>
        <select
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
        >
          {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <label className="block text-xs text-gray-500 mb-1">Source</label>
        <select
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          value={source}
          onChange={(e) => setSource(e.target.value as BookingSource)}
        >
          {Object.entries(SOURCE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <label className="block text-xs text-gray-500 mb-1">Customer notes</label>
        <p className="text-sm bg-gray-50 border rounded-lg p-2 mb-3 whitespace-pre-wrap">
          {booking.special_requests || '—'}
        </p>
        <label className="block text-xs text-gray-500 mb-1">Internal notes</label>
        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm min-h-[88px]"
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
        />
      </Card>

      <Card title="Timeline">
        {events.length === 0 ? (
          <p className="text-sm text-gray-500">
            No events yet (requires booking_events table from migration 016).
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {events.map((ev) => (
              <li key={ev.id} className="border-b border-gray-100 pb-2">
                <div className="font-medium">{ev.event_type}</div>
                <div className="text-xs text-gray-500">
                  {new Date(ev.created_at).toLocaleString()} · {ev.created_by || '—'}
                </div>
                {(ev.from_value || ev.to_value) && (
                  <div className="text-xs text-gray-600">
                    {ev.from_value || '—'} → {ev.to_value || '—'}
                  </div>
                )}
                {ev.note && <div className="text-xs mt-1">{ev.note}</div>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="fixed bottom-0 left-0 right-0 md:left-56 bg-white border-t border-gray-200 p-3 flex gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => save()}
          className="flex-1 bg-emerald-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            setStatus('cancelled')
            save({ status: 'cancelled' })
          }}
          className="px-4 bg-red-600 text-white py-3 rounded-lg font-semibold"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            setStatus('completed')
            save({ status: 'completed' })
          }}
          className="px-4 bg-gray-900 text-white py-3 rounded-lg font-semibold"
        >
          Done
        </button>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  )
}
