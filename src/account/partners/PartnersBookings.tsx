import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchMyPartnerBookingRequests,
  formatPartnerNet,
  statusLabel,
  type PartnerBookingRequest,
} from './partnerBookings'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'declined', label: 'Declined' },
] as const

export default function PartnersBookings() {
  const [requests, setRequests] = useState<PartnerBookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      const res = await fetchMyPartnerBookingRequests()
      if (cancelled) return
      if (!res.ok) {
        setError(res.error || 'Could not load bookings.')
        setRequests([])
      } else {
        setRequests(res.requests)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const visible = useMemo(() => {
    if (filter === 'all') return requests
    return requests.filter((r) => r.status === filter)
  }, [requests, filter])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-white">Bookings</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--rn-text-muted)]">
            Your company’s booking requests. Confirmed requests reserve capacity; payment is handled
            separately by Royal Nordic.
          </p>
        </div>
        <Link to="/partners/dashboard/tours" className="rn-btn-primary min-h-[44px] justify-center">
          Browse tours
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-[var(--rn-radius-sm)] px-3 py-1.5 text-xs font-medium transition ${
              filter === f.id
                ? 'bg-white/10 text-white'
                : 'text-[var(--rn-text-muted)] hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="rn-rewards-skel h-20 w-full" />
          <div className="rn-rewards-skel h-20 w-full" />
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-red-200">
          {error}
        </p>
      ) : visible.length === 0 ? (
        <div className="rounded-[var(--rn-radius)] border border-dashed border-[var(--rn-border)] px-5 py-10 text-center">
          <p className="font-display text-lg text-white/90">No booking requests</p>
          <p className="mt-2 text-sm text-[var(--rn-text-muted)]">
            Request a tour with an assigned partner net rate to get started.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--rn-border)] rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.02]">
          {visible.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <p className="truncate font-medium text-white">
                  {r.tour_title || `Tour #${r.tour_id}`}
                </p>
                <p className="mt-1 text-xs text-[var(--rn-text-muted)]">
                  {r.reference} · {r.tour_date} · {r.passenger_count} guest
                  {r.passenger_count === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <span
                  className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                    r.status === 'confirmed'
                      ? 'bg-aurora/15 text-aurora-soft'
                      : r.status === 'pending'
                        ? 'bg-amber-500/15 text-amber-100'
                        : 'bg-white/5 text-[var(--rn-text-dim)]'
                  }`}
                >
                  {statusLabel(r.status)}
                </span>
                <span className="font-display text-base font-semibold text-white">
                  {formatPartnerNet(r.total_net_eur)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
