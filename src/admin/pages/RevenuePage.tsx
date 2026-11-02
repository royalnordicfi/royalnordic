import React, { useEffect, useMemo, useState } from 'react'
import { fetchOpsBookings, fetchProducts } from '../adminApi'
import type { OpsBooking, Product } from '../types'
import { SOURCE_LABELS, type BookingSource } from '../types'
import { todayTourDateISO } from '../../lib/tourDate'
import { computeRevenueReport } from '../stats'
import { ErrorBanner } from '../components/ui'

export default function RevenuePage() {
  const [bookings, setBookings] = useState<OpsBooking[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    // includeDeleted so refunded/cancelled history still available, but report excludes removed
    Promise.all([fetchOpsBookings({ includeDeleted: true }), fetchProducts()])
      .then(([b, p]) => {
        setBookings(b)
        setProducts(p)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
  }, [])

  const today = todayTourDateISO()
  const commissionByTour = useMemo(() => {
    const m = new Map<number, number | null>()
    for (const p of products) m.set(p.id, p.commission_percent ?? null)
    return m
  }, [products])

  const report = useMemo(
    () => computeRevenueReport(bookings, commissionByTour, { today }),
    [bookings, commissionByTour, today],
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Revenue</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Paid bookings only · Europe/Helsinki departure calendar · removed and unpaid excluded
        </p>
      </div>

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="Paid bookings" value={String(report.paidBookingCount)} />
        <Stat label="Paid gross" value={`€${report.paidGross.toFixed(0)}`} />
        <Stat label="Refunded (marked)" value={`€${report.refundedGross.toFixed(0)}`} />
        <Stat label="Upcoming paid" value={`€${report.upcomingPaidGross.toFixed(0)}`} />
      </div>

      <p className="text-xs text-zinc-500">
        Operational passengers (active, non-expired): {report.operationalPassengers}. Refunds are
        status labels only — Stripe refunds are not automated from admin.
      </p>

      <section className="space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
          By source
        </h2>
        {(Object.keys(SOURCE_LABELS) as BookingSource[]).map((src) => {
          const row = report.bySource.get(src)
          if (!row || row.count === 0) return null
          return (
            <div key={src} className="rounded-xl border border-zinc-200 bg-white p-3 text-sm">
              <div className="font-semibold text-zinc-900">{SOURCE_LABELS[src]}</div>
              <div className="mt-1 text-xs text-zinc-600">
                {row.count} paid · Gross €{row.gross.toFixed(0)}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {row.netKnown
                  ? `Commission est. €${row.commission.toFixed(0)} · Net est. €${(
                      row.gross - row.commission
                    ).toFixed(0)}`
                  : 'Commission not configured on product(s)'}
              </div>
            </div>
          )
        })}
      </section>

      <section className="space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
          By product
        </h2>
        {Array.from(report.byProduct.entries()).map(([name, row]) => (
          <div key={name} className="rounded-xl border border-zinc-200 bg-white p-3 text-sm">
            <div className="font-semibold text-zinc-900">{name}</div>
            <div className="mt-1 text-xs text-zinc-600">
              {row.count} paid · {row.pax} pax · €{row.gross.toFixed(0)}
            </div>
          </div>
        ))}
        {report.byProduct.size === 0 && (
          <p className="text-sm text-zinc-500">No paid booking data yet.</p>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900">{value}</div>
    </div>
  )
}
