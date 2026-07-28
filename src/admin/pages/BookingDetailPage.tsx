import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  fetchBooking,
  fetchBookingEmails,
  fetchBookingEvents,
  fetchGuides,
  fetchVehicles,
  hardDeleteBooking,
  restoreBooking,
  sendBookingConfirmationEmail,
  softDeleteBooking,
  updateBookingOps,
} from '../adminApi'
import type { BookingEmail, BookingEvent, Guide, OpsBooking, Vehicle } from '../types'
import { Badge, statusTone } from '../components/Badge'
import {
  EMAIL_LABELS,
  PAYMENT_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  weekdayForTourDate,
  type BookingSource,
  type BookingStatus,
  type PaymentStatus,
} from '../types'

export default function BookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const bookingId = Number(id)
  const [booking, setBooking] = useState<OpsBooking | null>(null)
  const [events, setEvents] = useState<BookingEvent[]>([])
  const [emails, setEmails] = useState<BookingEmail[]>([])
  const [guides, setGuides] = useState<Guide[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'soft' | 'hard' | null>(null)

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [totalPrice, setTotalPrice] = useState('')
  const [pickup, setPickup] = useState('')
  const [tourTime, setTourTime] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [guideId, setGuideId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [status, setStatus] = useState<BookingStatus>('pending')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid')
  const [source, setSource] = useState<BookingSource>('direct_website')

  const applyBooking = (b: OpsBooking) => {
    setBooking(b)
    setCustomerName(b.customer_name)
    setCustomerEmail(b.customer_email)
    setCustomerPhone(b.customer_phone || '')
    setAdults(b.adults)
    setChildren(b.children)
    setTotalPrice(String(b.total_price))
    setPickup(b.pickup_location || '')
    setTourTime(b.tour_time || '')
    setInternalNotes(b.internal_notes || '')
    setGuideId(b.guide_id ? String(b.guide_id) : '')
    setVehicleId(b.vehicle_id ? String(b.vehicle_id) : '')
    setStatus(b.status)
    setPaymentStatus(b.payment_status || 'unpaid')
    setSource(b.source || 'direct_website')
  }

  const load = async () => {
    setError('')
    try {
      const b = await fetchBooking(bookingId)
      applyBooking(b)
      const [ev, g, v, em] = await Promise.all([
        fetchBookingEvents(bookingId),
        fetchGuides(),
        fetchVehicles(),
        fetchBookingEmails(bookingId),
      ])
      setEvents(ev)
      setGuides(g.filter((x) => x.is_active))
      setVehicles(v.filter((x) => x.is_active))
      setEmails(em)
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
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim() || null,
        adults,
        children,
        total_price: Number(totalPrice),
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
      applyBooking(updated)
      setMsg('Saved')
      setEvents(await fetchBookingEvents(bookingId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const sendEmail = async () => {
    setSaving(true)
    setMsg('')
    setError('')
    try {
      const r = await sendBookingConfirmationEmail(bookingId)
      setMsg(r.message)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Email failed')
      await load()
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
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-lg">{error}</div>
      </div>
    )
  }

  const date = booking.tour_dates?.date || ''
  const emailStatus = booking.email_status || 'not_sent'

  return (
    <div className="space-y-4 pb-28">
      <Link to="/bookings" className="text-sm text-emerald-800 font-medium">
        ← Bookings
      </Link>

      <div className="flex justify-between gap-2 items-start">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">
            {booking.booking_ref || `RN-${booking.id}`}
          </h1>
          <p className="text-sm text-gray-600 truncate">
            {booking.tours?.public_name || booking.tours?.name} · {date}{' '}
            {date ? `(${weekdayForTourDate(date)})` : ''} · {booking.tour_time || 'Time TBD'}
          </p>
          {booking.deleted_at && (
            <p className="text-xs text-amber-700 mt-1">Soft-deleted {new Date(booking.deleted_at).toLocaleString()}</p>
          )}
        </div>
        <div className="flex flex-col gap-1 items-end shrink-0">
          <Badge tone={statusTone(booking.status)}>{STATUS_LABELS[booking.status]}</Badge>
          <Badge tone={statusTone(booking.payment_status)}>
            {PAYMENT_LABELS[booking.payment_status]}
          </Badge>
          <Badge tone={emailStatus === 'sent' ? 'green' : emailStatus === 'failed' ? 'red' : 'gray'}>
            {EMAIL_LABELS[emailStatus]}
          </Badge>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-lg">{error}</div>
      )}
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-3 rounded-lg">
          {msg}
        </div>
      )}

      <Card title="Customer">
        <label className="block text-xs text-gray-500 mb-1">Name</label>
        <input className="w-full border rounded-lg px-3 py-2 text-sm mb-3" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        <label className="block text-xs text-gray-500 mb-1">Email</label>
        <input className="w-full border rounded-lg px-3 py-2 text-sm mb-3" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
        <label className="block text-xs text-gray-500 mb-1">Phone</label>
        <input className="w-full border rounded-lg px-3 py-2 text-sm" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
      </Card>

      <Card title="Tour">
        <Row k="Product" v={booking.tours?.public_name || booking.tours?.name || '—'} />
        <Row k="Date" v={date ? `${date} · ${weekdayForTourDate(date)}` : '—'} />
        <Row k="Source" v={SOURCE_LABELS[booking.source] || booking.source} />
        <Row k="Stripe" v={booking.stripe_payment_intent_id || '—'} />
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Adults</label>
            <input type="number" min={0} className="w-full border rounded-lg px-3 py-2 text-sm" value={adults} onChange={(e) => setAdults(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Children</label>
            <input type="number" min={0} className="w-full border rounded-lg px-3 py-2 text-sm" value={children} onChange={(e) => setChildren(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Total €</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card title="Operations">
        <label className="block text-xs text-gray-500 mb-1">Tour time</label>
        <input className="w-full border rounded-lg px-3 py-2 text-sm mb-3" value={tourTime} onChange={(e) => setTourTime(e.target.value)} placeholder="18:30" />
        <label className="block text-xs text-gray-500 mb-1">Pickup</label>
        <input className="w-full border rounded-lg px-3 py-2 text-sm mb-3" value={pickup} onChange={(e) => setPickup(e.target.value)} />
        <label className="block text-xs text-gray-500 mb-1">Guide</label>
        <select className="w-full border rounded-lg px-3 py-2 text-sm mb-3" value={guideId} onChange={(e) => setGuideId(e.target.value)}>
          <option value="">Unassigned</option>
          {guides.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
              {g.languages ? ` · ${g.languages}` : ''}
            </option>
          ))}
        </select>
        <label className="block text-xs text-gray-500 mb-1">Vehicle</label>
        <select className="w-full border rounded-lg px-3 py-2 text-sm mb-3" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
          <option value="">Unassigned</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} (cap {v.passenger_capacity})
              {v.status === 'maintenance' ? ' · maintenance' : ''}
            </option>
          ))}
        </select>
        <label className="block text-xs text-gray-500 mb-1">Booking status</label>
        <select className="w-full border rounded-lg px-3 py-2 text-sm mb-3" value={status} onChange={(e) => setStatus(e.target.value as BookingStatus)}>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <label className="block text-xs text-gray-500 mb-1">Payment status</label>
        <select className="w-full border rounded-lg px-3 py-2 text-sm mb-3" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}>
          {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <label className="block text-xs text-gray-500 mb-1">Source</label>
        <select className="w-full border rounded-lg px-3 py-2 text-sm mb-3" value={source} onChange={(e) => setSource(e.target.value as BookingSource)}>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <label className="block text-xs text-gray-500 mb-1">Customer requests</label>
        <p className="text-sm bg-gray-50 border rounded-lg p-2 mb-3 whitespace-pre-wrap">
          {booking.special_requests || '—'}
        </p>
        <label className="block text-xs text-gray-500 mb-1">Internal notes</label>
        <textarea className="w-full border rounded-lg px-3 py-2 text-sm min-h-[88px]" value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
      </Card>

      <Card title="Email">
        <Row k="Status" v={EMAIL_LABELS[emailStatus]} />
        <Row
          k="Last sent"
          v={booking.email_last_sent_at ? new Date(booking.email_last_sent_at).toLocaleString() : '—'}
        />
        {booking.email_last_error && <Row k="Last error" v={booking.email_last_error} />}
        <button
          type="button"
          disabled={saving || !!booking.deleted_at}
          onClick={sendEmail}
          className="mt-3 w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          {emailStatus === 'sent' ? 'Resend confirmation' : 'Send confirmation'}
        </button>
        <p className="text-[11px] text-gray-500 mt-2">
          Uses the existing customer confirmation template via Resend.
        </p>
        {emails.length > 0 && (
          <ul className="mt-3 space-y-2 text-xs border-t pt-3">
            {emails.map((em) => (
              <li key={em.id} className="flex justify-between gap-2">
                <span>
                  {em.status} · {em.to_email}
                  {em.error_message ? ` · ${em.error_message}` : ''}
                </span>
                <span className="text-gray-400 shrink-0">
                  {new Date(em.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Timeline">
        {events.length === 0 ? (
          <p className="text-sm text-gray-500">No events yet.</p>
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

      <Card title="Danger zone">
        {booking.deleted_at ? (
          <button
            type="button"
            className="w-full bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-semibold"
            onClick={async () => {
              setSaving(true)
              try {
                await restoreBooking(bookingId)
                setMsg('Restored')
                await load()
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Restore failed')
              } finally {
                setSaving(false)
              }
            }}
          >
            Restore booking
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              className="flex-1 border border-amber-300 text-amber-900 py-2.5 rounded-lg text-sm font-semibold"
              onClick={() => setConfirmAction('soft')}
            >
              Soft delete
            </button>
            <button
              type="button"
              className="flex-1 border border-red-300 text-red-800 py-2.5 rounded-lg text-sm font-semibold"
              onClick={() => setConfirmAction('hard')}
            >
              Hard delete
            </button>
          </div>
        )}
      </Card>

      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 max-w-md w-full space-y-3 shadow-xl">
            <h3 className="font-semibold">
              {confirmAction === 'soft' ? 'Soft delete this booking?' : 'Permanently delete?'}
            </h3>
            <p className="text-sm text-gray-600">
              {confirmAction === 'soft'
                ? 'The booking will be cancelled (frees capacity), hidden from lists, and can be restored. Timeline and email log stay.'
                : 'This permanently removes the booking and its timeline/email log (CASCADE). Capacity is freed via cancel first. Cannot be undone.'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 border rounded-lg py-2.5 text-sm"
                onClick={() => setConfirmAction(null)}
              >
                Keep
              </button>
              <button
                type="button"
                className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-semibold"
                onClick={async () => {
                  setSaving(true)
                  setConfirmAction(null)
                  try {
                    if (confirmAction === 'soft') {
                      await softDeleteBooking(bookingId)
                      setMsg('Soft-deleted')
                      await load()
                    } else {
                      await hardDeleteBooking(bookingId)
                      navigate('/bookings')
                    }
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Delete failed')
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                Confirm delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 md:left-56 bg-white/95 backdrop-blur border-t border-gray-200 p-3 flex gap-2">
        <button
          type="button"
          disabled={saving || !!booking.deleted_at}
          onClick={() => save()}
          className="flex-1 bg-emerald-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          disabled={saving || !!booking.deleted_at}
          onClick={() => {
            setStatus('cancelled')
            save({ status: 'cancelled' })
          }}
          className="px-4 bg-red-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving || !!booking.deleted_at}
          onClick={() => {
            setStatus('completed')
            save({ status: 'completed' })
          }}
          className="px-4 bg-gray-900 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          Done
        </button>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-500 shrink-0">{k}</span>
      <span className="font-medium text-right break-all">{v}</span>
    </div>
  )
}
