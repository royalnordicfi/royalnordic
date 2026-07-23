import React, { useEffect, useMemo, useState } from 'react'
import { fetchOpsBookings, fetchProducts } from '../adminApi'
import type { OpsBooking, Product } from '../types'
import { SOURCE_LABELS, type BookingSource } from '../types'

export default function RevenuePage() {
  const [bookings, setBookings] = useState<OpsBooking[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([fetchOpsBookings(), fetchProducts()])
      .then(([b, p]) => {
        setBookings(b)
        setProducts(p)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const commissionByTour = useMemo(() => {
    const m = new Map<number, number | null>()
    for (const p of products) m.set(p.id, p.commission_percent ?? null)
    return m
  }, [products])

  const report = useMemo(() => {
    const active = bookings.filter((b) => b.status !== 'cancelled')
    const bySource = new Map<
      BookingSource,
      { count: number; gross: number; commission: number; netKnown: boolean }
    >()

    for (const src of Object.keys(SOURCE_LABELS) as BookingSource[]) {
      bySource.set(src, { count: 0, gross: 0, commission: 0, netKnown: true })
    }

    let passengers = 0
    let upcomingGross = 0
    const byProduct = new Map<string, { count: number; gross: number; pax: number }>()

    for (const b of active) {
      const src = (b.source || 'direct_website') as BookingSource
      const bucket = bySource.get(src) || {
        count: 0,
        gross: 0,
        commission: 0,
        netKnown: true,
      }
      const gross = Number(b.total_price) || 0
      bucket.count += 1
      bucket.gross += gross
      const pct = commissionByTour.get(b.tour_id)
      if (pct == null) {
        bucket.netKnown = false
      } else {
        bucket.commission += (gross * Number(pct)) / 100
      }
      bySource.set(src, bucket)

      passengers += b.adults + b.children
      if ((b.tour_dates?.date || '') >= today) upcomingGross += gross

      const pname = b.tours?.public_name || b.tours?.name || `Tour ${b.tour_id}`
      const pb = byProduct.get(pname) || { count: 0, gross: 0, pax: 0 }
      pb.count += 1
      pb.gross += gross
      pb.pax += b.adults + b.children
      byProduct.set(pname, pb)
    }

    return { bySource, passengers, upcomingGross, byProduct }
  }, [bookings, commissionByTour, today])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Revenue & sources</h1>
        <p className="text-sm text-gray-600">
          Real bookings only. Commission calculated only when product has a configured %.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Passenger volume" value={String(report.passengers)} />
        <Stat label="Upcoming booked" value={`€${report.upcomingGross.toFixed(0)}`} />
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">By source</h2>
        {(Object.keys(SOURCE_LABELS) as BookingSource[]).map((src) => {
          const row = report.bySource.get(src)!
          if (row.count === 0) return null
          return (
            <div key={src} className="bg-white border rounded-lg p-3 text-sm">
              <div className="font-semibold">{SOURCE_LABELS[src]}</div>
              <div className="text-xs text-gray-600 mt-1">
                {row.count} bookings · Gross €{row.gross.toFixed(0)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {row.netKnown
                  ? `Commission est. €${row.commission.toFixed(0)} · Net est. €${(
                      row.gross - row.commission
                    ).toFixed(0)}`
                  : 'Commission: not configured on product(s) — net not assumed'}
              </div>
            </div>
          )
        })}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Product performance
        </h2>
        {Array.from(report.byProduct.entries()).map(([name, row]) => (
          <div key={name} className="bg-white border rounded-lg p-3 text-sm">
            <div className="font-semibold">{name}</div>
            <div className="text-xs text-gray-600 mt-1">
              {row.count} bookings · {row.pax} pax · €{row.gross.toFixed(0)}
            </div>
          </div>
        ))}
        {report.byProduct.size === 0 && (
          <p className="text-sm text-gray-500">No booking data yet.</p>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border rounded-lg p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  )
}
