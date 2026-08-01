import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  countOpenTransportationRequests,
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
  const [openRequests, setOpenRequests] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [schemaHint, setSchemaHint] = useState(false)

  const load = (mode: 'initial' | 'refresh' = 'refresh') => {
    if (mode === 'initial') setLoading(true)
    else setRefreshing(true)
    Promise.all([
      fetchOpsBookings(),
      fetchOpsNotes('open').catch(() => [] as OpsNote[]),
      countOpenTransportationRequests().catch(() => 0),
    ])
      .then(([b, n, reqs]) => {
        setBookings(b)
        setNotes(n)
        setOpenRequests(reqs)
        setError('')
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : 'Failed to load'
        setError(msg)
        if (msg.includes('column') || msg.includes('does not exist') || msg.includes('booking_ref')) {
          setSchemaHint(true)
        }
      })
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }

  useEffect(() => {
    load('initial')
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

    const weekEnd = addDaysISO(today, 7)
    const weekBookings = active.filter((b) => {
      const d = b.tour_dates?.date || ''
      return d >= today && d <= weekEnd
    })
    const weekRevenue = weekBookings
      .filter((b) => b.payment_status === 'paid' || b.status === 'confirmed')
      .reduce((s, b) => s + Number(b.total_price || 0), 0)
    const weekGuests = weekBookings.reduce((s, b) => s + b.adults + b.children, 0)

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
      weekBookings: weekBookings.length,
      weekRevenue,
      weekGuests,
    }
  }, [bookings, notes, today, tomorrow])

  if (loading) return <p className="text-zinc-500 text-sm">Loading operations…</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Ops today</h1>
          <p className="text-sm text-zinc-500">
            {weekdayForTourDate(today)} {today} · what needs action
          </p>
        </div>
        <button
          type="button"
          onClick={() => load('refresh')}
          disabled={refreshing}
          className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 disabled:opacity-50"
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard label="Today guests" value={String(stats.guestsToday)} />
        <StatCard label="Today tours" value={String(stats.todayBookings.length)} />
        <StatCard label="7-day bookings" value={String(stats.weekBookings)} />
        <StatCard
          label="7-day revenue"
          value={`€${stats.weekRevenue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <QuickLink to="/manual" label="+ Booking" primary />
        <QuickLink to="/availability" label="Availability" />
        <QuickLink to="/calendar" label="Calendar" />
        <QuickLink to="/requests" label={openRequests > 0 ? `Requests (${openRequests})` : 'Requests'} />
        <QuickLink to="/products" label="Products" />
        <QuickLink to="/bookings" label="All bookings" />
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
          <AttentionRow label="Transport requests" count={openRequests} to="/requests" />
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
      className={`flex justify-between items-center rounded-lg px-3 py-2 text-sm border ${
        count > 0
          ? 'bg-amber-50 border-amber-200 text-amber-950'
          : 'bg-white border-zinc-200 text-zinc-600'
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className={`font-semibold tabular-nums ${count > 0 ? 'text-amber-800' : 'text-zinc-400'}`}>
        {count}
      </span>
    </div>
  )
  return to && count > 0 ? <Link to={to}>{body}</Link> : body
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-zinc-400 font-semibold">{label}</div>
      <div className="text-lg font-semibold tabular-nums text-zinc-900 mt-0.5">{value}</div>
    </div>
  )
}

function QuickLink({
  to,
  label,
  primary,
}: {
  to: string
  label: string
  primary?: boolean
}) {
  return (
    <Link
      to={to}
      className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
        primary
          ? 'bg-emerald-700 text-white hover:bg-emerald-600'
          : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
      }`}
    >
      {label}
    </Link>
  )
}
