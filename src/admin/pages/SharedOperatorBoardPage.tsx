import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchSharedBookingsAccess, listSharedDepartures } from '../adminApi'
import { Badge } from '../components/Badge'
import { ErrorBanner, SecondaryButton, inputClass } from '../components/ui'
import {
  occupancyLabel,
  occupancyTone,
  syncStatusBanner,
  type SharedBookingsAccess,
  type SharedCalendarView,
  type SharedDepartureSummary,
} from '../sharedBookings'
import {
  calendarRange,
  formatCalendarHeading,
  groupDeparturesByDate,
  monthGridWithDepartures,
  shiftCalendarAnchor,
} from '../sharedCalendar'
import { sharedBookingsPaths, useSharedBookingsBase } from '../sharedBookingsPaths'
import { WEEKDAY_HEADERS_MON_FIRST, todayTourDateISO } from '../../lib/tourDate'

const views: { id: SharedCalendarView; label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
  { id: 'day', label: 'Day' },
]

function OccupancyBadge({ row }: { row: SharedDepartureSummary }) {
  const tone = occupancyTone(row.confirmed_passengers, row.capacity)
  return (
    <Badge tone={tone === 'amber' ? 'yellow' : tone === 'zinc' ? 'gray' : tone}>
      {occupancyLabel(row.confirmed_passengers, row.capacity, row.available_seats)}
    </Badge>
  )
}

export default function SharedOperatorBoardPage() {
  const base = useSharedBookingsBase()
  const paths = sharedBookingsPaths(base)
  const [params, setParams] = useSearchParams()
  const viewParam = params.get('view') as SharedCalendarView | null
  const view: SharedCalendarView =
    viewParam === 'week' || viewParam === 'day' || viewParam === 'month' ? viewParam : 'month'
  const anchor = params.get('date') || todayTourDateISO()

  const [access, setAccess] = useState<SharedBookingsAccess | null>(null)
  const [rows, setRows] = useState<SharedDepartureSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const range = useMemo(() => calendarRange(view, anchor), [view, anchor])
  const byDate = useMemo(() => groupDeparturesByDate(rows), [rows])
  const monthCells = useMemo(
    () => (view === 'month' ? monthGridWithDepartures(anchor, byDate) : []),
    [view, anchor, byDate],
  )

  const setQuery = (next: { view?: SharedCalendarView; date?: string }) => {
    setParams((prev) => {
      const n = new URLSearchParams(prev)
      if (next.view) n.set('view', next.view)
      if (next.date) n.set('date', next.date)
      return n
    })
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void fetchSharedBookingsAccess()
      .then(async (a) => {
        if (cancelled) return
        setAccess(a)
        if (!a.ok || a.access === 'none') {
          setRows([])
          setError(a.ok === false ? a.error : 'No Shared Bookings access')
          return
        }
        const list = await listSharedDepartures('shared_bus', range.from, range.to)
        if (cancelled) return
        if (!list.ok) {
          setError(list.error || 'Could not load departures')
          setRows([])
          return
        }
        setError('')
        setRows(list.departures)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [range.from, range.to, refreshKey])

  const subtitle =
    access && access.ok && (access.access === 'admin' || access.access === 'supplier')
      ? `${access.supplier_name} · ${syncStatusBanner(false)}`
      : syncStatusBanner(false)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Calendar
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            Your departures
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        </div>
        <SecondaryButton
          type="button"
          onClick={() => setRefreshKey((n) => n + 1)}
          disabled={loading}
        >
          Refresh
        </SecondaryButton>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-0.5">
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setQuery({ view: v.id })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                view === v.id ? 'bg-emerald-700 text-white' : 'text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          onClick={() => setQuery({ date: shiftCalendarAnchor(view, anchor, -1) })}
        >
          ←
        </button>
        <p className="min-w-[9rem] flex-1 text-center text-sm font-semibold text-zinc-900 sm:flex-none">
          {formatCalendarHeading(view, anchor)}
        </p>
        <button
          type="button"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          onClick={() => setQuery({ date: shiftCalendarAnchor(view, anchor, 1) })}
        >
          →
        </button>
        <SecondaryButton type="button" onClick={() => setQuery({ date: todayTourDateISO() })}>
          Today
        </SecondaryButton>
        <input
          type="date"
          className={`${inputClass} w-auto max-w-[11rem]`}
          value={anchor}
          onChange={(e) => e.target.value && setQuery({ date: e.target.value })}
        />
      </div>

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading calendar…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/70 px-5 py-10 text-center">
          <p className="text-sm font-medium text-zinc-800">No departures assigned yet</p>
          <p className="mt-1 text-xs text-zinc-500">
            When Royal Nordic assigns a Shared Bookings departure to you, it appears here.
          </p>
        </div>
      ) : view === 'month' ? (
        <div className="overflow-x-auto">
          <div className="min-w-[560px] rounded-xl border border-zinc-200 bg-white">
            <div className="grid grid-cols-7 border-b border-zinc-200">
              {WEEKDAY_HEADERS_MON_FIRST.map((d) => (
                <div
                  key={d}
                  className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-400"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthCells.map((cell, idx) => {
                if (!cell) {
                  return (
                    <div
                      key={`pad-${idx}`}
                      className="min-h-[88px] border-b border-r border-zinc-100 bg-zinc-50/50"
                    />
                  )
                }
                const isToday = cell.date === todayTourDateISO()
                return (
                  <div
                    key={cell.date}
                    className="min-h-[88px] border-b border-r border-zinc-100 p-1.5 text-left"
                  >
                    <button
                      type="button"
                      onClick={() => setQuery({ date: cell.date, view: 'day' })}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold hover:ring-2 hover:ring-emerald-200 ${
                        isToday ? 'bg-emerald-700 text-white' : 'text-zinc-700'
                      }`}
                    >
                      {cell.day}
                    </button>
                    <div className="mt-1 space-y-1">
                      {cell.departures.slice(0, 2).map((row) => (
                        <Link
                          key={row.id}
                          to={paths.departure(row.id)}
                          className="block truncate rounded-lg border border-zinc-200 bg-zinc-50 px-1.5 py-1 text-[11px] font-medium text-zinc-800"
                        >
                          {row.departure_time ? `${row.departure_time} ` : ''}
                          {row.tour_title}
                        </Link>
                      ))}
                      {cell.departures.length > 2 ? (
                        <button
                          type="button"
                          className="px-1 text-[10px] text-zinc-500"
                          onClick={() => setQuery({ date: cell.date, view: 'day' })}
                        >
                          +{cell.departures.length - 2} more
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {range.days.map((date) => {
            const deps = byDate.get(date) || []
            if (view === 'week' && deps.length === 0) {
              return (
                <section key={date} className="opacity-70">
                  <h2 className="text-sm font-semibold text-zinc-500">
                    {formatCalendarHeading('day', date)}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-400">No departures</p>
                </section>
              )
            }
            return (
              <section key={date} className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-2 border-b border-zinc-200 pb-1.5">
                  <h2 className="text-sm font-semibold text-zinc-900">
                    {formatCalendarHeading('day', date)}
                  </h2>
                  <p className="text-[11px] tabular-nums text-zinc-400">{date}</p>
                </div>
                {deps.length === 0 ? (
                  <p className="text-sm text-zinc-500">No departures</p>
                ) : (
                  <ul className="space-y-2.5">
                    {deps.map((row) => (
                      <li key={row.id}>
                        <Link
                          to={paths.departure(row.id)}
                          className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium text-zinc-500">
                                {row.departure_time || 'Time TBD'}
                              </p>
                              <h3 className="mt-0.5 text-base font-semibold text-zinc-900">
                                {row.tour_title}
                              </h3>
                              {row.meeting_point ? (
                                <p className="mt-1 text-xs text-zinc-500">{row.meeting_point}</p>
                              ) : null}
                            </div>
                            <OccupancyBadge row={row} />
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            <div className="rounded-xl bg-zinc-50 px-2.5 py-2 text-center">
                              <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                                Confirmed
                              </p>
                              <p className="text-sm font-semibold tabular-nums text-zinc-900">
                                {row.confirmed_passengers}
                              </p>
                            </div>
                            <div className="rounded-xl bg-zinc-50 px-2.5 py-2 text-center">
                              <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                                Capacity
                              </p>
                              <p className="text-sm font-semibold tabular-nums text-zinc-900">
                                {row.capacity}
                              </p>
                            </div>
                            <div className="rounded-xl bg-zinc-50 px-2.5 py-2 text-center">
                              <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                                Available
                              </p>
                              <p className="text-sm font-semibold tabular-nums text-zinc-900">
                                {row.available_seats}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
