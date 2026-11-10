import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import {
  fetchSharedBookingsAccess,
  listSharedDepartures,
} from '../adminApi'
import { Badge } from '../components/Badge'
import { Card, ErrorBanner, PageHeader, SecondaryButton } from '../components/ui'
import {
  canAccessBoard,
  formatDepartureWhen,
  syncStatusBanner,
  type SharedBoard,
  type SharedBookingsAccess,
  type SharedDepartureSummary,
} from '../sharedBookings'
import { sharedBookingsPaths, useSharedBookingsBase } from '../sharedBookingsPaths'

const tabs: { id: SharedBoard; label: string }[] = [
  { id: 'shared_bus', label: 'Shared Bus' },
  { id: 'my_tours', label: 'My Tours' },
]

export default function SharedBookingsPage() {
  const base = useSharedBookingsBase()
  const paths = sharedBookingsPaths(base)
  const [params, setParams] = useSearchParams()
  const requested = (params.get('board') as SharedBoard) || 'shared_bus'
  const [access, setAccess] = useState<SharedBookingsAccess | null>(null)
  const [rows, setRows] = useState<SharedDepartureSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const board: SharedBoard = requested === 'my_tours' ? 'my_tours' : 'shared_bus'

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
        if (!canAccessBoard(a, board)) {
          setRows([])
          setError('You do not have access to this board')
          return
        }
        const list = await listSharedDepartures(board)
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
  }, [board, refreshKey])

  const visibleTabs = useMemo(
    () => tabs.filter((t) => canAccessBoard(access, t.id)),
    [access],
  )

  if (access && access.ok && access.access === 'none') {
    return (
      <div className="space-y-4">
        <PageHeader title="Shared Bookings" subtitle="Restricted operations board" />
        <ErrorBanner>Your account is not authorized for Shared Bookings.</ErrorBanner>
      </div>
    )
  }

  if (access && access.ok && access.access === 'supplier' && board === 'my_tours') {
    return <Navigate to={`${paths.root}?board=shared_bus`} replace />
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Shared Bookings"
        subtitle={
          access && access.ok && (access.access === 'admin' || access.access === 'supplier')
            ? `${access.supplier_name} · ${syncStatusBanner(false)}`
            : syncStatusBanner(false)
        }
        actions={
          <SecondaryButton
            type="button"
            onClick={() => setRefreshKey((n) => n + 1)}
            disabled={loading}
          >
            Refresh
          </SecondaryButton>
        }
      />

      <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 pb-px">
        {visibleTabs.map((tab) => {
          const active = board === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setParams({ board: tab.id })}
              className={`relative shrink-0 px-3 py-2.5 text-sm font-medium transition ${
                active ? 'text-emerald-900' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {tab.label}
              {active ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-emerald-600" />
              ) : null}
            </button>
          )
        })}
      </div>

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading departures…</p>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-600">No upcoming departures on this board.</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                to={paths.departure(row.id)}
                className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                      {formatDepartureWhen(row.departure_date, row.departure_time)}
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-zinc-900">{row.tour_title}</h2>
                    {row.meeting_point ? (
                      <p className="mt-1 text-xs text-zinc-500">{row.meeting_point}</p>
                    ) : null}
                  </div>
                  <Badge tone={row.available_seats > 0 ? 'green' : 'red'}>
                    {row.available_seats} seats left
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:max-w-md sm:text-left">
                  <div className="rounded-lg bg-zinc-50 px-2 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-400">Confirmed</p>
                    <p className="text-sm font-semibold text-zinc-900">{row.confirmed_passengers}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-50 px-2 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-400">Capacity</p>
                    <p className="text-sm font-semibold text-zinc-900">{row.capacity}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-50 px-2 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-400">Available</p>
                    <p className="text-sm font-semibold text-zinc-900">{row.available_seats}</p>
                  </div>
                </div>

                {row.supplier_breakdown.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {row.supplier_breakdown.map((s) => (
                      <span
                        key={s.supplier_code}
                        className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-700"
                      >
                        {s.supplier_name}: {s.confirmed_passengers}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-zinc-400">No confirmed passengers yet</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
