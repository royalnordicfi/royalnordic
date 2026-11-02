import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  createAdminPaymentLink,
  fetchBooking,
  fetchBookingEmails,
  fetchBookingEvents,
  removeBooking,
  restoreBooking,
  sendBookingConfirmationEmail,
  updateBookingOps,
} from '../adminApi'
import type { BookingEmail, BookingEvent, OpsBooking } from '../types'
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
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [paidAck, setPaidAck] = useState(false)
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
    setStatus(b.status)
    setPaymentStatus(b.payment_status || 'unpaid')
    setSource(b.source || 'direct_website')
  }

  const load = async () => {
    setError('')
    try {
      const b = await fetchBooking(bookingId)
      applyBooking(b)
      const [ev, em] = await Promise.all([
        fetchBookingEvents(bookingId),
        fetchBookingEmails(bookingId),
      ])
      setEvents(ev)
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
          : 'Payment link created — copy or email from the Payment section',
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
            ? 'Payment link created and emailed'
            : 'Payment link created',
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
  const isPaid = booking.payment_status === 'paid'
  const removed = !!booking.deleted_at

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
          {removed ? (
            <p className="mt-1 text-xs text-amber-700">
              Removed {new Date(booking.deleted_at!).toLocaleString()} — hidden from ops lists
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {removed ? <Badge tone="gray">Removed</Badge> : null}
          <Badge tone={statusTone(booking.status)}>{STATUS_LABELS[booking.status]}</Badge>
          <Badge tone={statusTone(booking.payment_status)}>
            {PAYMENT_LABELS[booking.payment_status]}
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
          <input className={inputClass} value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={removed} />
        </Field>
        <Field label="Email" className="mt-3">
          <input
            className={inputClass}
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            disabled={removed}
          />
        </Field>
        <Field label="Phone" className="mt-3">
          <input className={inputClass} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} disabled={removed} />
        </Field>
      </Section>

      <Section title="Product & departure">
        <Row k="Product" v={booking.tours?.public_name || booking.tours?.name || '—'} />
        <Row k="Date" v={date ? `${date} · ${weekdayForTourDate(date)}` : '—'} />
        <Row k="Source" v={SOURCE_LABELS[booking.source] || booking.source} />
        <Row k="Stripe PI" v={booking.stripe_payment_intent_id || '—'} />
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Field label="Adults">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              disabled={removed}
            />
          </Field>
          <Field label="Children">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
              disabled={removed}
            />
          </Field>
          <Field label="Total €">
            <input className={inputClass} value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} disabled={removed} />
          </Field>
        </div>
        <Field label="Tour time" className="mt-3">
          <input
            className={inputClass}
            value={tourTime}
            onChange={(e) => setTourTime(e.target.value)}
            placeholder="18:30"
            disabled={removed}
          />
        </Field>
        <Field label="Pickup / meeting point" className="mt-3">
          <input className={inputClass} value={pickup} onChange={(e) => setPickup(e.target.value)} disabled={removed} />
        </Field>
      </Section>

      <Section title="Payment & status">
        <Field label="Booking status">
          <select
            className={selectClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as BookingStatus)}
            disabled={removed}
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
            disabled={removed}
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
            disabled={removed}
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
            disabled={removed}
          />
        </Field>
      </Section>

      {!removed && canCharge ? (
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
            </>
          ) : (
            <p className="text-sm text-zinc-500">No active payment link.</p>
          )}
          <PrimaryButton
            className="mt-3 w-full"
            disabled={paymentLinkBusy}
            onClick={() => createLink(false)}
          >
            {paymentLinkBusy && !emailPaymentBusy
              ? 'Creating…'
              : booking.payment_link_url
                ? 'Regenerate payment link'
                : 'Create Stripe payment link'}
          </PrimaryButton>
          <SecondaryButton
            className="mt-2 w-full"
            disabled={paymentLinkBusy}
            onClick={() => createLink(true)}
          >
            {emailPaymentBusy ? 'Creating & emailing…' : 'Create link + email customer'}
          </SecondaryButton>
        </Section>
      ) : null}

      <Section title="Email">
        <Row k="Status" v={EMAIL_LABELS[emailStatus]} />
        <Row
          k="Last sent"
          v={booking.email_last_sent_at ? new Date(booking.email_last_sent_at).toLocaleString() : '—'}
        />
        {!removed ? (
          <PrimaryButton
            className="mt-3 w-full !bg-zinc-900 hover:!bg-zinc-800"
            disabled={
              saving ||
              (booking.payment_type === 'admin_payment_link' && booking.payment_status !== 'paid')
            }
            onClick={sendEmail}
          >
            {emailStatus === 'sent' ? 'Resend confirmation' : 'Send confirmation'}
          </PrimaryButton>
        ) : null}
        {emails.length > 0 ? (
          <ul className="mt-3 space-y-2 border-t border-zinc-100 pt-3 text-xs">
            {emails.map((em) => (
              <li key={em.id} className="flex justify-between gap-2">
                <span>
                  {em.status} · {em.to_email}
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
                {ev.note ? <div className="mt-1 text-xs">{ev.note}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Actions">
        {removed ? (
          <PrimaryButton
            className="w-full"
            onClick={async () => {
              setSaving(true)
              try {
                await restoreBooking(bookingId)
                setMsg('Restored to active lists (still cancelled — change status if needed)')
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
          <button
            type="button"
            className="w-full rounded-lg border border-zinc-300 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            onClick={() => {
              setPaidAck(false)
              setConfirmRemove(true)
            }}
          >
            Remove booking
          </button>
        )}
        <p className="mt-2 text-[11px] text-zinc-500">
          Remove hides test or duplicate records from Home, Bookings, revenue and passenger totals.
          Capacity is freed. Stripe is never refunded automatically.
        </p>
      </Section>

      {confirmRemove ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md space-y-3 rounded-xl bg-white p-4 shadow-xl">
            <h3 className="font-semibold text-zinc-900">Remove this booking?</h3>
            <p className="text-sm text-zinc-600">
              The booking will be cancelled (frees capacity), hidden from operational lists and
              statistics, and kept for audit. It will not appear in customer histories in the active
              admin. You can view it under Bookings → Removed.
            </p>
            {isPaid ? (
              <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={paidAck}
                  onChange={(e) => setPaidAck(e.target.checked)}
                />
                <span>
                  This booking is marked <strong>paid</strong>. I confirm payment was refunded or
                  resolved outside admin. Removal does <strong>not</strong> refund Stripe.
                </span>
              </label>
            ) : null}
            <div className="flex gap-2">
              <SecondaryButton className="flex-1" onClick={() => setConfirmRemove(false)}>
                Keep
              </SecondaryButton>
              <button
                type="button"
                className="flex-1 rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                disabled={isPaid && !paidAck}
                onClick={async () => {
                  setSaving(true)
                  setConfirmRemove(false)
                  try {
                    await removeBooking(bookingId, {
                      acknowledgePaidResolved: isPaid ? paidAck : false,
                    })
                    setMsg('Booking removed')
                    navigate('/bookings?when=removed')
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Remove failed')
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                Confirm remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!removed ? (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex gap-2 border-t border-zinc-200 bg-white/95 p-3 backdrop-blur md:left-52">
          <PrimaryButton className="flex-1" disabled={saving} onClick={() => save()}>
            {saving ? 'Saving…' : 'Save'}
          </PrimaryButton>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setStatus('cancelled')
              save({ status: 'cancelled' })
            }}
            className="rounded-lg border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-800 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      ) : null}
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
