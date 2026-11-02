import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  countOpenTransportationRequests,
  detectCapacityConflicts,
  fetchOpsBookings,
} from '../adminApi'
import type { OpsBooking } from '../types'
import { Badge, statusTone } from '../components/Badge'
import { PAYMENT_LABELS, STATUS_LABELS, weekdayForTourDate } from '../types'
import { todayTourDateISO } from '../../lib/tourDate'
import { computeOverviewStats, passengerCount } from '../stats'
import { ErrorBanner, PrimaryButton } from '../components/ui'

export default function HomePage() {
  const [bookings, setBookings] = useState<OpsBooking[]>([])
  const [openRequests, setOpenRequests] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = (mode: 'initial' | 'refresh' = 'refresh') => {
    if (mode === 'initial') setLoading(true)
    else setRefreshing(true)
    Promise.all([
      fetchOpsBookings(),
      countOpenTransportationRequests().catch(() => 0),
    ])
      .then(([b, reqs]) => {
        setBookings(b)
        setOpenRequests(reqs)
        setError('')
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }

  useEffect(() => {
    load('initial')
  }, [])

  const today = todayTourDateISO()
  const capacityConflicts = useMemo(
    () => detectCapacityConflicts(bookings.filter((b) => !b.deleted_at && b.status !== 'cancelled')),
    [bookings],
  )

  const stats = useMemo(
    () =>
      computeOverviewStats(bookings, {
        today,
        capacityConflictDates: capacityConflicts.map((c) => c.date),
      }),
    [bookings, today, capacityConflicts],
  )

  if (loading) return <p className="text-sm text-zinc-500">Loading overview…</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Overview</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {weekdayForTourDate(today)} · {today} · Europe/Helsinki
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load('refresh')}
            disabled={refreshing}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <Link to="/manual">
            <PrimaryButton>+ New booking</PrimaryButton>
          </Link>
        </div>
      </div>

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatCard label="Today's bookings" value={String(stats.todayBookings)} />
        <StatCard label="Today's passengers" value={String(stats.todayPassengers)} />
        <StatCard label="Next 7 days' bookings" value={String(stats.weekBookings)} />
        <StatCard
          label="Next 7 days' revenue"
          value={`€${stats.weekRevenue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`}
          hint="Paid departures only"
        />
      </div>

      {(stats.unpaidAttention.length > 0 ||
        openRequests > 0 ||
        capacityConflicts.length > 0) && (
        <section className="space-y-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Pending actions
          </h2>
          <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {stats.unpaidAttention.slice(0, 5).map((b) => (
              <li key={`pay-${b.id}`}>
                <Link
                  to={`/bookings/${b.id}`}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm hover:bg-zinc-50"
                >
                  <span className="min-w-0 truncate">
                    <span className="font-medium text-zinc-900">Unpaid</span>
                    <span className="text-zinc-500">
                      {' '}
                      · {b.customer_name} · {b.booking_ref || `RN-${b.id}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-amber-700">
                    {b.tour_dates?.date}
                    {b.tour_time ? ` ${b.tour_time}` : ''}
                  </span>
                </Link>
              </li>
            ))}
            {openRequests > 0 && (
              <li>
                <Link
                  to="/requests"
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm hover:bg-zinc-50"
                >
                  <span className="font-medium text-zinc-900">
                    {openRequests} open transfer request{openRequests === 1 ? '' : 's'}
                  </span>
                  <span className="text-xs text-emerald-800">View</span>
                </Link>
              </li>
            )}
            {capacityConflicts.slice(0, 3).map((c) => (
              <li key={`cap-${c.tour_date_id}`}>
                <Link
                  to={`/calendar?date=${c.date}`}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm hover:bg-zinc-50"
                >
                  <span className="min-w-0 truncate">
                    <span className="font-medium text-zinc-900">Capacity conflict</span>
                    <span className="text-zinc-500">
                      {' '}
                      · {c.tour_name} · {c.guests}/{c.capacity}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-amber-700">{c.date}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Upcoming bookings
          </h2>
          <Link to="/bookings?when=upcoming" className="text-xs font-medium text-emerald-800">
            All bookings
          </Link>
        </div>
        {stats.upcoming.length === 0 ? (
          <p className="rounded-xl border border-zinc-200 bg-white px-3.5 py-4 text-sm text-zinc-500">
            No upcoming reservations.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {stats.upcoming.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function BookingRow({ booking: b }: { booking: OpsBooking }) {
  const d = b.tour_dates?.date
  return (
    <li>
      <Link to={`/bookings/${b.id}`} className="block px-3.5 py-3 transition-colors hover:bg-zinc-50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-zinc-900">{b.customer_name}</div>
            <div className="mt-0.5 truncate text-xs text-zinc-600">
              {b.tours?.public_name || b.tours?.name}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {d ? `${d} (${weekdayForTourDate(d)})` : '—'}
              {b.tour_time ? ` · ${b.tour_time}` : ''} · {passengerCount(b)} pax ·{' '}
              {b.booking_ref || `RN-${b.id}`}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge tone={statusTone(b.status)}>{STATUS_LABELS[b.status]}</Badge>
            {b.payment_status !== 'paid' ? (
              <Badge tone={statusTone(b.payment_status)}>
                {PAYMENT_LABELS[b.payment_status] || b.payment_status}
              </Badge>
            ) : null}
          </div>
        </div>
      </Link>
    </li>
  )
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900">{value}</div>
      {hint ? <div className="mt-0.5 text-[10px] text-zinc-400">{hint}</div> : null}
    </div>
  )
}
