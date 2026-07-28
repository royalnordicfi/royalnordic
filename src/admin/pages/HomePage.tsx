import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  detectAssignmentConflicts,
  detectCapacityConflicts,
  fetchOpsBookings,
  fetchOpsNotes,
} from '../adminApi'
import type { OpsBooking, OpsNote } from '../types'
import { Badge, statusTone } from '../components/Badge'
import { STATUS_LABELS, weekdayForTourDate } from '../types'
import { todayTourDateISO } from '../../lib/tourDate'

function addDaysISO(iso: string, days: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export default function HomePage() {
  const [bookings, setBookings] = useState<OpsBooking[]>([])
  const [notes, setNotes] = useState<OpsNote[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [schemaHint, setSchemaHint] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchOpsBookings(), fetchOpsNotes('open').catch(() => [] as OpsNote[])])
      .then(([b, n]) => {
        setBookings(b)
        setNotes(n)
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : 'Failed to load'
        setError(msg)
        if (msg.includes('column') || msg.includes('does not exist') || msg.includes('booking_ref')) {
          setSchemaHint(true)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const today = todayTourDateISO()
  const tomorrow = addDaysISO(today, 1)

  const stats = useMemo(() => {
    const active = bookings.filter((b) => b.status !== 'cancelled' && !b.deleted_at)
    const todayBookings = active
      .filter((b) => b.tour_dates?.date === today)
      .sort((a, b) => (a.tour_time || '').localeCompare(b.tour_time || ''))
    const tomorrowBookings = active
      .filter((b) => b.tour_dates?.date === tomorrow)
      .sort((a, b) => (a.tour_time || '').localeCompare(b.tour_time || ''))
    const guestsToday = todayBookings.reduce((s, b) => s + b.adults + b.children, 0)

    const pending = active.filter(
      (b) => b.status === 'pending' || b.status === 'pending_crypto_payment',
    )
    const missingGuide = active.filter(
      (b) =>
        b.status !== 'completed' &&
        (b.tour_dates?.date || '') >= today &&
        !b.guide_id,
    )
    const missingVehicle = active.filter(
      (b) =>
        b.status !== 'completed' &&
        (b.tour_dates?.date || '') >= today &&
        !b.vehicle_id,
    )
    const paymentIssues = active.filter(
      (b) =>
        b.payment_status === 'unpaid' ||
        b.payment_status === 'pending_crypto' ||
        b.status === 'pending_crypto_payment',
    )
    const emailIssues = active.filter(
      (b) => b.email_status === 'failed' || (b.email_status === 'not_sent' && b.status === 'confirmed'),
    )
    const capacityConflicts = detectCapacityConflicts(active)
    const assignmentConflicts = detectAssignmentConflicts(active)
    const customerIssues = active.filter(
      (b) =>
        !b.customer_phone ||
        !b.pickup_location ||
        (b.internal_notes || '').toLowerCase().includes('issue') ||
        (b.special_requests || '').toLowerCase().includes('allerg'),
    )
    const urgentNotes = notes.filter(
      (n) => n.status === 'open' && (n.priority === 'urgent' || n.priority === 'high'),
    )
    const dueNotes = notes.filter(
      (n) => n.status === 'open' && n.due_date && n.due_date <= today,
    )

    let nextAction: { label: string; to: string } | null = null
    if (paymentIssues[0]) {
      nextAction = {
        label: `Fix payment · ${paymentIssues[0].booking_ref || '#' + paymentIssues[0].id}`,
        to: `/bookings/${paymentIssues[0].id}`,
      }
    } else if (capacityConflicts[0]) {
      nextAction = {
        label: `Capacity overbooked · ${capacityConflicts[0].date} ${capacityConflicts[0].tour_name}`,
        to: `/calendar?date=${capacityConflicts[0].date}`,
      }
    } else if (missingGuide[0]) {
      nextAction = {
        label: `Assign guide · ${missingGuide[0].booking_ref || '#' + missingGuide[0].id}`,
        to: `/bookings/${missingGuide[0].id}`,
      }
    } else if (missingVehicle[0]) {
      nextAction = {
        label: `Assign vehicle · ${missingVehicle[0].booking_ref || '#' + missingVehicle[0].id}`,
        to: `/bookings/${missingVehicle[0].id}`,
      }
    } else if (dueNotes[0]) {
      nextAction = { label: `Due note · ${dueNotes[0].title}`, to: '/notes' }
    } else if (todayBookings[0]) {
      nextAction = {
        label: `Today's first tour · ${todayBookings[0].tour_time || 'TBD'}`,
        to: `/bookings/${todayBookings[0].id}`,
      }
    }

    return {
      todayBookings,
      tomorrowBookings,
      guestsToday,
      pending,
      missingGuide,
      missingVehicle,
      paymentIssues,
      emailIssues,
      capacityConflicts,
      assignmentConflicts,
      customerIssues,
      urgentNotes,
      dueNotes,
      nextAction,
    }
  }, [bookings, notes, today, tomorrow])

  if (loading) return <p className="text-gray-600 text-sm">Loading operations…</p>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Ops today</h1>
        <p className="text-sm text-gray-500">
          {weekdayForTourDate(today)} {today} · what needs action
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-lg">
          {error}
          {schemaHint && (
            <p className="mt-2">
              Apply <code className="bg-red-100 px-1 rounded">016_admin_os_v1.sql</code> and{' '}
              <code className="bg-red-100 px-1 rounded">018_ops_hub_winter.sql</code> in Supabase.
            </p>
          )}
        </div>
      )}

      {stats.nextAction && (
        <Link
          to={stats.nextAction.to}
          className="block bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl p-4 font-medium transition-colors"
        >
          Next: {stats.nextAction.label}
        </Link>
      )}

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Attention</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <AttentionRow label="Payment problems" count={stats.paymentIssues.length} to="/bookings?attention=payment" />
          <AttentionRow label="Missing guide" count={stats.missingGuide.length} to="/bookings?attention=guide" />
          <AttentionRow label="Missing vehicle" count={stats.missingVehicle.length} to="/bookings?attention=vehicle" />
          <AttentionRow label="Bookings pending" count={stats.pending.length} to="/bookings?attention=pending" />
          <AttentionRow label="Email not sent / failed" count={stats.emailIssues.length} to="/bookings?attention=email" />
          <AttentionRow
            label="Capacity conflicts"
            count={stats.capacityConflicts.length}
            to={stats.capacityConflicts[0] ? `/calendar?date=${stats.capacityConflicts[0].date}` : '/calendar'}
          />
          <AttentionRow
            label="Guide/vehicle double-booked"
            count={stats.assignmentConflicts.length}
            to="/calendar"
          />
          <AttentionRow label="Customer issues / gaps" count={stats.customerIssues.length} to="/bookings" />
          <AttentionRow label="Urgent / due notes" count={stats.urgentNotes.length + stats.dueNotes.length} to="/notes" />
        </div>
      </section>

      <DaySection title={`Today · ${guestsLabel(stats.guestsToday)}`} bookings={stats.todayBookings} empty="No tours today." />
      <DaySection title={`Tomorrow · ${weekdayForTourDate(tomorrow)}`} bookings={stats.tomorrowBookings} empty="No tours tomorrow." />

      {(stats.urgentNotes.length > 0 || stats.dueNotes.length > 0) && (
        <section className="space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</h2>
            <Link to="/notes" className="text-xs text-emerald-800 font-medium">
              All notes
            </Link>
          </div>
          <ul className="space-y-2">
            {[...stats.dueNotes, ...stats.urgentNotes]
              .filter((n, i, arr) => arr.findIndex((x) => x.id === n.id) === i)
              .slice(0, 5)
              .map((n) => (
                <li key={n.id} className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
                  <span className="font-medium">{n.title}</span>
                  {n.due_date && <span className="text-xs text-amber-700 ml-2">Due {n.due_date}</span>}
                  <span className="text-xs text-gray-400 ml-2">{n.priority}</span>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function guestsLabel(n: number) {
  return `${n} guest${n === 1 ? '' : 's'}`
}

function DaySection({
  title,
  bookings,
  empty,
}: {
  title: string
  bookings: OpsBooking[]
  empty: string
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      {bookings.length === 0 ? (
        <p className="text-sm text-gray-500">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link
                to={`/bookings/${b.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-3 hover:border-emerald-300 transition-colors"
              >
                <div className="flex justify-between gap-2 items-start">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">
                      {b.tour_time || 'Time TBD'} · {b.tours?.public_name || b.tours?.name}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {b.customer_name} · {b.adults + b.children} pax ·{' '}
                      {b.guides?.name || 'No guide'} · {b.vehicles?.name || 'No vehicle'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {b.pickup_location || 'Pickup TBD'}
                    </p>
                  </div>
                  <Badge tone={statusTone(b.status)}>{STATUS_LABELS[b.status]}</Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function AttentionRow({
  label,
  count,
  to,
}: {
  label: string
  count: number
  to?: string
}) {
  const body = (
    <div
      className={`flex justify-between items-center rounded-xl px-3 py-2.5 text-sm border ${
        count > 0
          ? 'bg-amber-50 border-amber-200 text-amber-950'
          : 'bg-white border-gray-200 text-gray-600'
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className={`font-semibold tabular-nums ${count > 0 ? 'text-amber-800' : 'text-gray-400'}`}>
        {count}
      </span>
    </div>
  )
  return to && count > 0 ? <Link to={to}>{body}</Link> : body
}
