import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchOpsBookings } from '../adminApi'
import type { OpsBooking } from '../types'
import { Badge, statusTone } from '../components/Badge'
import { STATUS_LABELS } from '../types'
import { todayTourDateISO } from '../../lib/tourDate'

function todayISO() {
  return todayTourDateISO()
}

export default function HomePage() {
  const [bookings, setBookings] = useState<OpsBooking[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [schemaHint, setSchemaHint] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchOpsBookings()
      .then(setBookings)
      .catch((e) => {
        const msg = e instanceof Error ? e.message : 'Failed to load'
        setError(msg)
        if (msg.includes('column') || msg.includes('does not exist') || msg.includes('booking_ref')) {
          setSchemaHint(true)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const today = todayISO()

  const stats = useMemo(() => {
    const todayBookings = bookings.filter((b) => b.tour_dates?.date === today && b.status !== 'cancelled')
    const upcoming = bookings
      .filter((b) => (b.tour_dates?.date || '') > today && b.status !== 'cancelled')
      .sort((a, b) => (a.tour_dates?.date || '').localeCompare(b.tour_dates?.date || ''))
    const passengersToday = todayBookings.reduce((s, b) => s + b.adults + b.children, 0)
    const revenueBooked = bookings
      .filter((b) => b.status === 'confirmed' || b.status === 'completed')
      .reduce((s, b) => s + Number(b.total_price || 0), 0)
    const pendingActions = bookings.filter(
      (b) =>
        b.status === 'pending' ||
        b.status === 'pending_crypto_payment' ||
        b.payment_status === 'unpaid' ||
        b.payment_status === 'pending_crypto',
    )
    const needsAssignment = bookings.filter(
      (b) =>
        b.status !== 'cancelled' &&
        b.status !== 'completed' &&
        (b.tour_dates?.date || '') >= today &&
        (!b.guide_id || !b.vehicle_id),
    )
    const paymentIssues = bookings.filter(
      (b) =>
        b.payment_status === 'unpaid' ||
        b.payment_status === 'pending_crypto' ||
        b.status === 'pending_crypto_payment',
    )

    let nextAction: { label: string; to: string } | null = null
    if (pendingActions[0]) {
      nextAction = {
        label: `Review pending booking ${pendingActions[0].booking_ref || '#' + pendingActions[0].id}`,
        to: `/bookings/${pendingActions[0].id}`,
      }
    } else if (needsAssignment[0]) {
      nextAction = {
        label: `Assign guide/vehicle for ${needsAssignment[0].booking_ref || '#' + needsAssignment[0].id}`,
        to: `/bookings/${needsAssignment[0].id}`,
      }
    } else if (todayBookings[0]) {
      nextAction = {
        label: `Open today's first tour (${todayBookings[0].tours?.public_name || todayBookings[0].tours?.name})`,
        to: `/bookings/${todayBookings[0].id}`,
      }
    }

    return {
      todayBookings,
      upcoming: upcoming.slice(0, 8),
      passengersToday,
      revenueBooked,
      pendingActions,
      needsAssignment,
      paymentIssues,
      nextAction,
    }
  }, [bookings, today])

  if (loading) return <p className="text-gray-600">Loading operations…</p>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Today</h1>
        <p className="text-sm text-gray-600">{today} · real booking data only</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded">
          {error}
          {schemaHint && (
            <p className="mt-2">
              Run SQL migration <code className="bg-red-100 px-1">016_admin_os_v1.sql</code> in
              Supabase (and 015 if not applied). Until then some fields are not connected.
            </p>
          )}
        </div>
      )}

      {stats.nextAction && (
        <Link
          to={stats.nextAction.to}
          className="block bg-emerald-700 text-white rounded-lg p-4 font-medium"
        >
          Next: {stats.nextAction.label}
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Bookings today" value={String(stats.todayBookings.length)} />
        <Stat label="Passengers today" value={String(stats.passengersToday)} />
        <Stat label="Upcoming" value={String(stats.upcoming.length)} />
        <Stat
          label="Revenue booked"
          value={`€${stats.revenueBooked.toFixed(0)}`}
          hint="Confirmed + completed"
        />
      </div>

      <Section title="Needs attention">
        <AttentionRow
          label="Pending customer / payment actions"
          count={stats.pendingActions.length}
          to="/bookings?status=pending"
        />
        <AttentionRow
          label="Tours needing guide or vehicle"
          count={stats.needsAssignment.length}
          to="/calendar"
        />
        <AttentionRow
          label="Payment issues"
          count={stats.paymentIssues.length}
          to="/bookings"
        />
        <AttentionRow
          label="Platform sync issues"
          count={0}
          note="Not connected — no GYG/Airbnb/Viator API"
        />
      </Section>

      <Section title="Bookings today">
        {stats.todayBookings.length === 0 ? (
          <p className="text-sm text-gray-500">No tours scheduled today.</p>
        ) : (
          <ul className="space-y-2">
            {stats.todayBookings.map((b) => (
              <li key={b.id}>
                <Link
                  to={`/bookings/${b.id}`}
                  className="block bg-white border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-sm">
                      {b.tour_time || '—'} · {b.tours?.public_name || b.tours?.name}
                    </span>
                    <Badge tone={statusTone(b.status)}>{STATUS_LABELS[b.status]}</Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {b.customer_name} · {b.adults + b.children} pax ·{' '}
                    {b.pickup_location || 'Pickup TBD'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Upcoming">
        {stats.upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming bookings.</p>
        ) : (
          <ul className="space-y-2">
            {stats.upcoming.map((b) => (
              <li key={b.id}>
                <Link
                  to={`/bookings/${b.id}`}
                  className="block bg-white border border-gray-200 rounded-lg p-3 text-sm"
                >
                  <span className="font-medium">{b.tour_dates?.date}</span> ·{' '}
                  {b.tours?.public_name || b.tours?.name} · {b.customer_name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {hint && <div className="text-[11px] text-gray-400 mt-1">{hint}</div>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      {children}
    </section>
  )
}

function AttentionRow({
  label,
  count,
  to,
  note,
}: {
  label: string
  count: number
  to?: string
  note?: string
}) {
  const body = (
    <div className="flex justify-between items-center bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm">
      <div>
        <div className="font-medium">{label}</div>
        {note && <div className="text-xs text-amber-700 mt-0.5">{note}</div>}
      </div>
      <span className={`font-bold ${count > 0 ? 'text-amber-700' : 'text-gray-400'}`}>{count}</span>
    </div>
  )
  return to && count > 0 ? <Link to={to}>{body}</Link> : body
}
