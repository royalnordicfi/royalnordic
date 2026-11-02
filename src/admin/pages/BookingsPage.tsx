import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchOpsBookings } from '../adminApi'
import type { OpsBooking } from '../types'
import { Badge, statusTone } from '../components/Badge'
import { PAYMENT_LABELS, STATUS_LABELS, weekdayForTourDate } from '../types'
import { addTourDays, todayTourDateISO } from '../../lib/tourDate'
import { passengerCount } from '../stats'
import {
  ErrorBanner,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  inputClass,
} from '../components/ui'

const FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'removed', label: 'Removed' },
]

export default function BookingsPage() {
  const [params, setParams] = useSearchParams()
  const [rows, setRows] = useState<OpsBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState(params.get('q') || '')
  const [refreshing, setRefreshing] = useState(false)

  const filter = params.get('when') || params.get('status') || 'all'
  const today = todayTourDateISO()
  const tomorrow = addTourDays(today, 1)

  const load = (soft = false) => {
    if (soft && rows.length > 0) setRefreshing(true)
    else setLoading(true)
    setError('')

    const onlyRemoved = filter === 'removed'
    const status =
      filter === 'cancelled' ? 'cancelled' : filter === 'removed' ? 'all' : 'all'

    fetchOpsBookings({
      status,
      search: search.trim() || undefined,
      onlyRemoved,
      includeDeleted: onlyRemoved,
    })
      .then((data) => {
        let next = data
        if (filter === 'today') {
          next = next.filter((b) => b.tour_dates?.date === today && b.status !== 'cancelled')
        } else if (filter === 'tomorrow') {
          next = next.filter((b) => b.tour_dates?.date === tomorrow && b.status !== 'cancelled')
        } else if (filter === 'upcoming') {
          next = next.filter(
            (b) => (b.tour_dates?.date || '') >= today && b.status !== 'cancelled',
          )
        } else if (filter === 'cancelled') {
          next = next.filter((b) => b.status === 'cancelled' && !b.deleted_at)
        } else if (filter === 'all') {
          next = next.filter((b) => !b.deleted_at)
        }
        // Sort by departure date then time
        next = [...next].sort((a, b) => {
          const da = a.tour_dates?.date || ''
          const db = b.tour_dates?.date || ''
          if (da !== db) return da.localeCompare(db)
          return (a.tour_time || '').localeCompare(b.tour_time || '')
        })
        setRows(next)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }

  useEffect(() => {
    load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const applySearch = () => {
    setParams((p) => {
      const n = new URLSearchParams(p)
      if (search.trim()) n.set('q', search.trim())
      else n.delete('q')
      return n
    })
    load()
  }

  const setFilter = (id: string) => {
    setParams((p) => {
      const n = new URLSearchParams(p)
      n.delete('status')
      n.delete('attention')
      if (id === 'all') n.delete('when')
      else n.set('when', id)
      return n
    })
  }

  const unpaidCount = useMemo(
    () =>
      rows.filter(
        (b) =>
          !b.deleted_at &&
          b.status !== 'cancelled' &&
          (b.payment_status === 'unpaid' || b.payment_status === 'pending_crypto'),
      ).length,
    [rows],
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bookings"
        subtitle={
          <>
            {rows.length} shown
            {unpaidCount > 0 ? ` · ${unpaidCount} unpaid` : ''}
            {refreshing ? ' · updating…' : ''}
          </>
        }
        actions={
          <>
            <SecondaryButton onClick={() => load(true)} disabled={refreshing}>
              Refresh
            </SecondaryButton>
            <Link to="/manual">
              <PrimaryButton>+ Booking</PrimaryButton>
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((chip) => {
          const active = filter === chip.id
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className={inputClass}
          placeholder="Search name, email, or booking ref…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applySearch()
          }}
        />
        <SecondaryButton onClick={applySearch} className="sm:w-auto">
          Search
        </SecondaryButton>
      </div>

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-white px-3.5 py-4 text-sm text-zinc-500">
          No bookings match.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {rows.map((b) => {
            const d = b.tour_dates?.date
            return (
              <li key={b.id}>
                <Link
                  to={`/bookings/${b.id}`}
                  className="block px-3.5 py-3 transition-colors hover:bg-zinc-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-zinc-900">
                        {b.customer_name}
                        <span className="font-normal text-zinc-400">
                          {' '}
                          · {b.booking_ref || `RN-${b.id}`}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-zinc-600">
                        {b.tours?.public_name || b.tours?.name}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {d ? `${d} (${weekdayForTourDate(d)})` : '—'}
                        {b.tour_time ? ` · ${b.tour_time}` : ''} · {passengerCount(b)} pax · €
                        {Number(b.total_price).toFixed(0)}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {b.deleted_at ? (
                        <Badge tone="gray">Removed</Badge>
                      ) : (
                        <Badge tone={statusTone(b.status)}>{STATUS_LABELS[b.status]}</Badge>
                      )}
                      <Badge tone={statusTone(b.payment_status)}>
                        {PAYMENT_LABELS[b.payment_status] || b.payment_status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
