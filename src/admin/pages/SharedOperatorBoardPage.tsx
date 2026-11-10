import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchSharedBookingsAccess, listSharedDepartures } from '../adminApi'
import { Badge } from '../components/Badge'
import { ErrorBanner } from '../components/ui'
import {
  formatDepartureWhen,
  syncStatusBanner,
  type SharedBookingsAccess,
  type SharedDepartureSummary,
} from '../sharedBookings'
import { sharedBookingsPaths, useSharedBookingsBase } from '../sharedBookingsPaths'

function formatDayHeading(isoDate: string): string {
  try {
    const d = new Date(`${isoDate}T12:00:00`)
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return isoDate
  }
}

export default function SharedOperatorBoardPage() {
  const base = useSharedBookingsBase()
  const paths = sharedBookingsPaths(base)
  const [access, setAccess] = useState<SharedBookingsAccess | null>(null)
  const [rows, setRows] = useState<SharedDepartureSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

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
        const list = await listSharedDepartures('shared_bus')
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
  }, [refreshKey])

  const byDate = useMemo(() => {
    const map = new Map<string, SharedDepartureSummary[]>()
    for (const row of rows) {
      const key = row.departure_date || 'unknown'
      const list = map.get(key) || []
      list.push(row)
      map.set(key, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [rows])

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
        <button
          type="button"
          onClick={() => setRefreshKey((n) => n + 1)}
          disabled={loading}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading calendar…</p>
      ) : byDate.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/70 px-5 py-10 text-center">
          <p className="text-sm font-medium text-zinc-800">No assigned departures yet</p>
          <p className="mt-1 text-xs text-zinc-500">
            When Royal Nordic shares a bus departure with you, it appears here by date.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {byDate.map(([date, deps]) => (
            <section key={date} className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-2 border-b border-zinc-200 pb-1.5">
                <h2 className="text-sm font-semibold text-zinc-900">{formatDayHeading(date)}</h2>
                <p className="text-[11px] tabular-nums text-zinc-400">{date}</p>
              </div>
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
                            {formatDepartureWhen(row.departure_date, row.departure_time)}
                          </p>
                          <h3 className="mt-0.5 text-base font-semibold text-zinc-900">
                            {row.tour_title}
                          </h3>
                          {row.meeting_point ? (
                            <p className="mt-1 text-xs text-zinc-500">{row.meeting_point}</p>
                          ) : null}
                        </div>
                        <Badge tone={row.available_seats > 0 ? 'green' : 'red'}>
                          {row.available_seats} left
                        </Badge>
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
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
