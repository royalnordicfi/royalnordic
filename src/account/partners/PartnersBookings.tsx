import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchMyPartnerBookingRequests,
  filterPartnerBookings,
  formatPartnerBookingWhen,
  formatPartnerGuestCount,
  formatPartnerNet,
  statusBadgeClass,
  statusLabel,
  type PartnerBookingRequest,
} from './partnerBookings'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'declined', label: 'Declined' },
  { id: 'cancelled', label: 'Cancelled' },
] as const

type FilterId = (typeof FILTERS)[number]['id']

export default function PartnersBookings() {
  const [requests, setRequests] = useState<PartnerBookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterId>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const inFlight = useRef(false)
  const hasLoaded = useRef(false)

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (inFlight.current) return
    inFlight.current = true
    const silent = Boolean(opts?.silent && hasLoaded.current)
    if (silent) setRefreshing(true)
    else {
      setLoading(true)
      setError(null)
    }
    try {
      const res = await fetchMyPartnerBookingRequests()
      if (!res.ok) {
        setError(res.error || 'Could not load bookings.')
        if (!silent) setRequests([])
      } else {
        setRequests(res.requests)
        setError(null)
        hasLoaded.current = true
      }
    } finally {
      inFlight.current = false
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const onFocus = () => {
      void load({ silent: true })
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void load({ silent: true })
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [load])

  const visible = useMemo(() => filterPartnerBookings(requests, filter), [requests, filter])

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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load({ silent: true })}
            disabled={loading || refreshing}
            className="rn-btn-secondary min-h-[44px] justify-center disabled:opacity-60"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <Link to="/partners/dashboard/tours" className="rn-btn-primary min-h-[44px] justify-center">
            Browse tours
          </Link>
        </div>
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
            {filter === 'all'
              ? 'Request a tour with an assigned partner net rate to get started.'
              : `No ${filter} bookings right now.`}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--rn-border)] rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.02]">
          {visible.map((r) => {
            const open = expandedId === r.id
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setExpandedId(open ? null : r.id)}
                  className="flex w-full flex-col gap-2 px-4 py-4 text-left transition hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between sm:px-5"
                  aria-expanded={open}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {r.tour_title || `Tour #${r.tour_id}`}
                    </p>
                    <p className="mt-1 text-xs text-[var(--rn-text-muted)]">
                      {r.reference}
                      {r.status === 'confirmed' && r.booking_ref ? ` · ${r.booking_ref}` : ''}
                      {' · '}
                      {formatPartnerBookingWhen(r)}
                      {' · '}
                      {formatPartnerGuestCount(r)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <span
                      className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${statusBadgeClass(r.status)}`}
                    >
                      {statusLabel(r.status)}
                    </span>
                    <span className="font-display text-base font-semibold text-white">
                      {formatPartnerNet(r.total_net_eur)}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--rn-text-dim)]">
                      {open ? 'Hide' : 'Details'}
                    </span>
                  </div>
                </button>
                {open ? (
                  <div className="border-t border-[var(--rn-border)] bg-white/[0.02] px-4 py-4 text-sm sm:px-5">
                    <dl className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rn-text-dim)]">
                          Guest lead
                        </dt>
                        <dd className="mt-1 text-white/90">{r.guest_name || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rn-text-dim)]">
                          Guests
                        </dt>
                        <dd className="mt-1 text-white/90">
                          {r.adults} adult{r.adults === 1 ? '' : 's'}
                          {r.children
                            ? ` · ${r.children} child${r.children === 1 ? '' : 'ren'}`
                            : ''}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rn-text-dim)]">
                          Partner net
                        </dt>
                        <dd className="mt-1 text-white/90">
                          {formatPartnerNet(r.unit_net_eur)} unit ·{' '}
                          {formatPartnerNet(r.total_net_eur)} total
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rn-text-dim)]">
                          References
                        </dt>
                        <dd className="mt-1 text-white/90">
                          {r.reference}
                          {r.status === 'confirmed' && r.booking_ref ? (
                            <>
                              <br />
                              {r.booking_ref}
                            </>
                          ) : null}
                        </dd>
                      </div>
                      {r.pickup_location ? (
                        <div className="sm:col-span-2">
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rn-text-dim)]">
                            Pickup
                          </dt>
                          <dd className="mt-1 text-white/90">{r.pickup_location}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
