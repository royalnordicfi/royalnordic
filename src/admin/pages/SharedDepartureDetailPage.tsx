import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { fetchSharedDepartureDetail } from '../adminApi'
import { Badge, statusTone } from '../components/Badge'
import { Card, ErrorBanner, PageHeader } from '../components/ui'
import {
  channelLabel,
  formatDepartureWhen,
  syncStatusBanner,
  type SharedDepartureSummary,
  type SharedPassenger,
} from '../sharedBookings'
import { sharedBookingsPaths, useSharedBookingsBase } from '../sharedBookingsPaths'

type DetailState = {
  departure: SharedDepartureSummary
  passengers: SharedPassenger[]
  cancelled: SharedPassenger[]
  channels_synced: boolean
}

function PassengerRow({ row }: { row: SharedPassenger }) {
  return (
    <li className="rounded-lg border border-zinc-200 px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-zinc-900">{row.guest_name || 'Guest'}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {[row.booking_ref, `${row.passenger_count} pax`, row.supplier_name]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {row.pickup_location ? (
            <p className="mt-1 text-xs text-zinc-600">Pickup: {row.pickup_location}</p>
          ) : null}
          <p className="mt-1 text-[11px] text-zinc-400">{channelLabel(row.channel)}</p>
        </div>
        <Badge tone={statusTone(row.status)}>{row.status}</Badge>
      </div>
    </li>
  )
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default function SharedDepartureDetailPage() {
  const { id } = useParams<{ id: string }>()
  const base = useSharedBookingsBase()
  const paths = sharedBookingsPaths(base)
  const [data, setData] = useState<DetailState | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const validId = Boolean(id && UUID_RE.test(id))

  useEffect(() => {
    if (!id || !UUID_RE.test(id)) return
    let cancelled = false
    setLoading(true)
    void fetchSharedDepartureDetail(id)
      .then((res) => {
        if (cancelled) return
        if (!res.ok) {
          setError(res.error || 'Could not load departure')
          setData(null)
          return
        }
        setError('')
        setData({
          departure: res.departure,
          passengers: res.passengers,
          cancelled: res.cancelled,
          channels_synced: res.channels_synced,
        })
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
  }, [id])

  if (!validId) {
    return <Navigate to={paths.root} replace />
  }

  const dep = data?.departure

  return (
    <div className="space-y-4">
      <PageHeader
        title={dep?.tour_title || 'Departure'}
        subtitle={
          dep
            ? `${formatDepartureWhen(dep.departure_date, dep.departure_time)} · ${syncStatusBanner(data?.channels_synced)}`
            : syncStatusBanner(false)
        }
        actions={
          <Link
            to={`${paths.root}?board=${dep?.board || 'shared_bus'}`}
            className="inline-flex min-h-[40px] items-center rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            ← Back
          </Link>
        }
      />

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}
      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : null}

      {dep ? (
        <>
          <Card>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">Confirmed</p>
                <p className="text-lg font-semibold text-zinc-900">{dep.confirmed_passengers}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">Capacity</p>
                <p className="text-lg font-semibold text-zinc-900">{dep.capacity}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">Available</p>
                <p className="text-lg font-semibold text-zinc-900">{dep.available_seats}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">Board</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {dep.board === 'shared_bus' ? 'Shared Bus' : 'My Tours'}
                </p>
              </div>
            </div>
            {dep.meeting_point ? (
              <p className="mt-3 text-sm text-zinc-600">Meeting point: {dep.meeting_point}</p>
            ) : null}
            {dep.supplier_breakdown.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {dep.supplier_breakdown.map((s) => (
                  <span
                    key={s.supplier_code}
                    className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-700"
                  >
                    {s.supplier_name}: {s.confirmed_passengers}
                  </span>
                ))}
              </div>
            ) : null}
          </Card>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-zinc-900">Passenger manifest</h2>
            <p className="text-xs text-zinc-500">
              Confirmed passengers occupy seats. Pending requests are listed but do not reduce
              availability. Cancelled bookings stay in history below.
            </p>
            {data && data.passengers.length === 0 ? (
              <Card>
                <p className="text-sm text-zinc-600">No active passengers on this departure.</p>
              </Card>
            ) : (
              <ul className="space-y-2">
                {data?.passengers.map((row) => (
                  <PassengerRow key={row.id} row={row} />
                ))}
              </ul>
            )}
          </section>

          {data && data.cancelled.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-zinc-900">Cancelled (history)</h2>
              <ul className="space-y-2 opacity-80">
                {data.cancelled.map((row) => (
                  <PassengerRow key={row.id} row={row} />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
