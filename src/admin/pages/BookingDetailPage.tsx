import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  createAdminPaymentLink,
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
import {
  Card,
  ErrorBanner,
  Field,
  PrimaryButton,
  SecondaryButton,
  inputClass,
  selectClass,
  textareaClass,
} from '../components/ui'

export default function BookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
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
  const [paymentLinkBusy, setPaymentLinkBusy] = useState(false)
  const [emailPaymentBusy, setEmailPaymentBusy] = useState(false)

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

  useEffect(() => {
    if (searchParams.get('payment_link') === '1') {
      setMsg(
        searchParams.get('emailed') === '1'
          ? 'Payment link created and emailed to customer'
          : 'Payment link created — copy or email from the Payment link section',
      )
    }
  }, [searchParams])

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
      const [ev, em] = await Promise.all([
        fetchBookingEvents(bookingId),
        fetchBookingEmails(bookingId),
      ])
      setEvents(ev)
      setEmails(em)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const sendEmail = async () => {
    setSaving(true)
    setError('')
    setMsg('')
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

  const createLink = async (sendEmailToCustomer: boolean) => {
    setPaymentLinkBusy(true)
    setEmailPaymentBusy(sendEmailToCustomer)
    setError('')
    setMsg('')
    try {
      const link = await createAdminPaymentLink(bookingId, { sendEmail: sendEmailToCustomer })
      if (link.email_error) {
        setError(`Link created, but email failed: ${link.email_error}`)
      } else {
        setMsg(
          link.email_sent
            ? link.livemode
              ? 'Live payment link created and emailed — verify before relying on it'
              : 'TEST payment link created and emailed'
            : link.livemode
              ? 'Live payment link created — verify before sending to customer'
              : 'TEST payment link created',
        )
      }
      await load()
      try {
        await navigator.clipboard.writeText(link.url)
      } catch {
        /* ignore */
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment link failed')
    } finally {
      setPaymentLinkBusy(false)
      setEmailPaymentBusy(false)
    }
  }

  if (!booking && !error) return <p className="text-sm text-zinc-500">Loading…</p>
  if (!booking) {
    return (
      <div className="space-y-3">
        <Link to="/bookings" className="text-sm font-medium text-emerald-800">
          ← Bookings
        </Link>
        <ErrorBanner>{error}</ErrorBanner>
      </div>
    )
  }

  const date = booking.tour_dates?.date || ''
  const emailStatus = booking.email_status || 'not_sent'
  const linkExpired =
    !!booking.payment_link_expires_at &&
    new Date(booking.payment_link_expires_at).getTime() < Date.now()
  const canCharge =
    !booking.deleted_at &&
    booking.payment_status !== 'paid' &&
    booking.status !== 'cancelled' &&
    Number(booking.total_price) > 0

  return (
    <div className="space-y-4 pb-28">
      <Link to="/bookings" className="text-sm font-medium text-emerald-800 hover:underline">
        ← Bookings
      </Link>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            {booking.booking_ref || `RN-${booking.id}`}
          </h1>
          <p className="truncate text-sm text-zinc-500">
            {booking.tours?.public_name || booking.tours?.name} · {date}{' '}
            {date ? `(${weekdayForTourDate(date)})` : ''} · {booking.tour_time || 'Time TBD'}
          </p>
          {booking.deleted_at ? (
            <p className="mt-1 text-xs text-amber-700">
              Soft-deleted {new Date(booking.deleted_at).toLocaleString()}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge tone={statusTone(booking.status)}>{STATUS_LABELS[booking.status]}</Badge>
          <Badge tone={statusTone(booking.payment_status)}>
            {PAYMENT_LABELS[booking.payment_status]}
          </Badge>
          <Badge tone={emailStatus === 'sent' ? 'green' : emailStatus === 'failed' ? 'red' : 'gray'}>
            {EMAIL_LABELS[emailStatus]}
          </Badge>
        </div>
      </div>

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}
      {msg ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
          {msg}
        </div>
      ) : null}

      <Section title="Customer">
        <Field label="Name">
          <input className={inputClass} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </Field>
        <Field label="Email" className="mt-3">
          <input
            className={inputClass}
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
          />
        </Field>
        <Field label="Phone" className="mt-3">
          <input className={inputClass} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
        </Field>
      </Section>

      <Section title="Tour">
        <Row k="Product" v={booking.tours?.public_name || booking.tours?.name || '—'} />
        <Row k="Date" v={date ? `${date} · ${weekdayForTourDate(date)}` : '—'} />
        <Row k="Source" v={SOURCE_LABELS[booking.source] || booking.source} />
        <Row k="Stripe" v={booking.stripe_payment_intent_id || '—'} />
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Field label="Adults">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
            />
          </Field>
          <Field label="Children">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
            />
          </Field>
          <Field label="Total €">
            <input className={inputClass} value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Operations">
        <Field label="Tour time">
          <input
            className={inputClass}
            value={tourTime}
            onChange={(e) => setTourTime(e.target.value)}
            placeholder="18:30"
          />
        </Field>
        <Field label="Pickup" className="mt-3">
          <input className={inputClass} value={pickup} onChange={(e) => setPickup(e.target.value)} />
        </Field>
        <Field label="Guide" className="mt-3">
          <select className={selectClass} value={guideId} onChange={(e) => setGuideId(e.target.value)}>
            <option value="">Unassigned</option>
            {guides.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g.languages ? ` · ${g.languages}` : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Vehicle" className="mt-3">
          <select className={selectClass} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">Unassigned</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} (cap {v.passenger_capacity})
                {v.status === 'maintenance' ? ' · maintenance' : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Booking status" className="mt-3">
          <select
            className={selectClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as BookingStatus)}
          >
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Payment status" className="mt-3">
          <select
            className={selectClass}
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
          >
            {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Source" className="mt-3">
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
        <p className="mb-1 mt-3 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
          Customer requests
        </p>
        <p className="mb-3 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-sm">
          {booking.special_requests || '—'}
        </p>
        <Field label="Internal notes">
          <textarea
            className={textareaClass}
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Payment link">
        {booking.payment_link_url ? (
          <>
            <Row
              k="Expires"
              v={
                booking.payment_link_expires_at
                  ? `${new Date(booking.payment_link_expires_at).toLocaleString()}${
                      linkExpired ? ' · expired' : ''
                    }`
                  : '—'
              }
            />
            <p className="mt-2 break-all rounded-lg bg-zinc-50 p-2 text-xs text-zinc-700">
              {booking.payment_link_url}
            </p>
            <SecondaryButton
              className="mt-2 w-full"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(booking.payment_link_url || '')
                  setMsg('Payment link copied')
                } catch {
                  setError('Could not copy link')
                }
              }}
            >
              Copy payment link
            </SecondaryButton>
          </>
        ) : (
          <p className="text-sm text-zinc-500">No active payment link.</p>
        )}
        <PrimaryButton
          className="mt-3 w-full"
          disabled={paymentLinkBusy || !canCharge}
          onClick={() => createLink(false)}
        >
          {paymentLinkBusy && !emailPaymentBusy
            ? 'Creating link…'
            : booking.payment_link_url
              ? 'Regenerate payment link'
              : 'Create Stripe payment link'}
        </PrimaryButton>
        <SecondaryButton
          className="mt-2 w-full"
          disabled={paymentLinkBusy || !canCharge}
          onClick={() => createLink(true)}
        >
          {emailPaymentBusy ? 'Creating & emailing…' : 'Create link + email Pay securely'}
        </SecondaryButton>
        <p className="mt-2 text-[11px] text-zinc-500">
          Booking stays unpaid until Stripe confirms. Do not share live links with customers until
          TEST verification is approved.
        </p>
      </Section>

      <Section title="Email">
        <Row k="Status" v={EMAIL_LABELS[emailStatus]} />
        <Row
          k="Last sent"
          v={booking.email_last_sent_at ? new Date(booking.email_last_sent_at).toLocaleString() : '—'}
        />
        {booking.email_last_error ? <Row k="Last error" v={booking.email_last_error} /> : null}
        <PrimaryButton
          className="mt-3 w-full !bg-zinc-900 hover:!bg-zinc-800"
          disabled={
            saving ||
            !!booking.deleted_at ||
            (booking.payment_type === 'admin_payment_link' && booking.payment_status !== 'paid')
          }
          onClick={sendEmail}
        >
          {emailStatus === 'sent' ? 'Resend confirmation' : 'Send confirmation'}
        </PrimaryButton>
        <p className="mt-2 text-[11px] text-zinc-500">
          Payment-link bookings receive confirmation automatically after Stripe payment.
        </p>
        {emails.length > 0 ? (
          <ul className="mt-3 space-y-2 border-t border-zinc-100 pt-3 text-xs">
            {emails.map((em) => (
              <li key={em.id} className="flex justify-between gap-2">
                <span>
                  {em.status} · {em.to_email}
                  {em.error_message ? ` · ${em.error_message}` : ''}
                </span>
                <span className="shrink-0 text-zinc-400">
                  {new Date(em.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </Section>

      <Section title="Timeline">
        {events.length === 0 ? (
          <p className="text-sm text-zinc-500">No events yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {events.map((ev) => (
              <li key={ev.id} className="border-b border-zinc-100 pb-2 last:border-0">
                <div className="font-medium text-zinc-900">{ev.event_type}</div>
                <div className="text-xs text-zinc-500">
                  {new Date(ev.created_at).toLocaleString()} · {ev.created_by || '—'}
                </div>
                {ev.from_value || ev.to_value ? (
                  <div className="text-xs text-zinc-600">
                    {ev.from_value || '—'} → {ev.to_value || '—'}
                  </div>
                ) : null}
                {ev.note ? <div className="mt-1 text-xs">{ev.note}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Danger zone">
        {booking.deleted_at ? (
          <PrimaryButton
            className="w-full"
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
          </PrimaryButton>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="flex-1 rounded-lg border border-amber-300 py-2.5 text-sm font-semibold text-amber-900"
              onClick={() => setConfirmAction('soft')}
            >
              Soft delete
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg border border-red-300 py-2.5 text-sm font-semibold text-red-800"
              onClick={() => setConfirmAction('hard')}
            >
              Hard delete
            </button>
          </div>
        )}
      </Section>

      {confirmAction ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md space-y-3 rounded-xl bg-white p-4 shadow-xl">
            <h3 className="font-semibold text-zinc-900">
              {confirmAction === 'soft' ? 'Soft delete this booking?' : 'Permanently delete?'}
            </h3>
            <p className="text-sm text-zinc-600">
              {confirmAction === 'soft'
                ? 'The booking will be cancelled (frees capacity), hidden from lists, and can be restored.'
                : 'Permanently removes the booking and its timeline/email log. Cannot be undone.'}
            </p>
            <div className="flex gap-2">
              <SecondaryButton className="flex-1" onClick={() => setConfirmAction(null)}>
                Keep
              </SecondaryButton>
              <button
                type="button"
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white"
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
      ) : null}

      <div className="fixed bottom-0 left-0 right-0 z-30 flex gap-2 border-t border-zinc-200 bg-white/95 p-3 backdrop-blur md:left-56">
        <PrimaryButton
          className="flex-1"
          disabled={saving || !!booking.deleted_at}
          onClick={() => save()}
        >
          {saving ? 'Saving…' : 'Save'}
        </PrimaryButton>
        <button
          type="button"
          disabled={saving || !!booking.deleted_at}
          onClick={() => {
            setStatus('cancelled')
            save({ status: 'cancelled' })
          }}
          className="rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
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
          className="rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Done
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="space-y-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">{title}</h2>
      {children}
    </Card>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-zinc-50 py-1 text-sm last:border-0">
      <span className="shrink-0 text-zinc-500">{k}</span>
      <span className="break-all text-right font-medium text-zinc-900">{v}</span>
    </div>
  )
}
