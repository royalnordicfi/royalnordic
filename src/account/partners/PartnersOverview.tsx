import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { PartnerAccessResult } from '../partnerAccess'
import {
  computePartnerDashboardStats,
  fetchMyPartnerBookingRequests,
  formatPartnerBookingWhen,
  formatPartnerGuestCount,
  formatPartnerNet,
  partnerBookingDisplayRef,
  selectUpcomingConfirmedBookings,
  type PartnerBookingRequest,
} from './partnerBookings'

type Ctx = { access: PartnerAccessResult }

export default function PartnersOverview() {
  const { access } = useOutletContext<Ctx>()
  const company = access.company_name || 'Your company'
  const [requests, setRequests] = useState<PartnerBookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const inFlight = useRef(false)
  const hasLoaded = useRef(false)

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (inFlight.current) return
    inFlight.current = true
    const silent = Boolean(opts?.silent && hasLoaded.current)
    if (!silent) {
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

  const stats = useMemo(() => computePartnerDashboardStats(requests), [requests])
  const upcoming = useMemo(() => selectUpcomingConfirmedBookings(requests, 5), [requests])

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-xl font-semibold tracking-tight text-white sm:text-[1.35rem]">
          Welcome, {company}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--rn-text-muted)]">
          Your partner workspace. Live booking status for your company — partner net rates only.
        </p>
      </section>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rn-rewards-skel h-28 w-full" />
          <div className="rn-rewards-skel h-28 w-full" />
          <div className="rn-rewards-skel h-28 w-full" />
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-red-200">
          {error}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.03] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--rn-text-dim)]">
              Pending requests
            </p>
            <p className="mt-2 font-display text-2xl font-semibold text-amber-100">
              {stats.pending_count}
            </p>
            <p className="mt-1 text-xs text-[var(--rn-text-muted)]">Awaiting Royal Nordic confirmation</p>
          </div>
          <div className="rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.03] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--rn-text-dim)]">
              Confirmed upcoming
            </p>
            <p className="mt-2 font-display text-2xl font-semibold text-aurora-soft">
              {stats.confirmed_upcoming_count}
            </p>
            <p className="mt-1 text-xs text-[var(--rn-text-muted)]">Departures from today onward</p>
          </div>
          <div className="rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.03] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--rn-text-dim)]">
              Confirmed net value
            </p>
            <p className="mt-2 font-display text-2xl font-semibold text-white">
              {formatPartnerNet(stats.confirmed_total_net_eur)}
            </p>
            <p className="mt-1 text-xs text-[var(--rn-text-muted)]">
              All confirmed · excludes declined &amp; cancelled
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <Link
          to="/partners/dashboard/tours"
          className="rn-btn-primary min-h-[44px] w-full justify-center sm:w-auto"
        >
          Browse tours
        </Link>
        <Link
          to="/partners/dashboard/bookings"
          className="rn-btn-secondary min-h-[44px] w-full justify-center sm:w-auto"
        >
          View all bookings
        </Link>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">Upcoming bookings</h3>
            <p className="mt-1 text-sm text-[var(--rn-text-muted)]">
              Next confirmed departures for your company.
            </p>
          </div>
          <Link
            to="/partners/dashboard/bookings"
            className="text-sm text-aurora-soft transition hover:text-white"
          >
            All bookings
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="rn-rewards-skel h-16 w-full" />
            <div className="rn-rewards-skel h-16 w-full" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="rounded-[var(--rn-radius)] border border-dashed border-[var(--rn-border)] px-5 py-8 text-center">
            <p className="font-display text-lg text-white/90">No upcoming confirmed bookings</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--rn-text-muted)]">
              Browse tours with an assigned partner net rate to submit a request.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--rn-border)] rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.02]">
            {upcoming.map((r) => {
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
                        {partnerBookingDisplayRef(r)} · {formatPartnerBookingWhen(r)} ·{' '}
                        {formatPartnerGuestCount(r)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
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
                            {r.booking_ref ? (
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
                      <Link
                        to="/partners/dashboard/bookings"
                        className="mt-4 inline-flex text-sm text-aurora-soft transition hover:text-white"
                      >
                        Open in bookings →
                      </Link>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
