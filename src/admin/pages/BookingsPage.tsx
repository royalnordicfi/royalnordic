import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchOpsBookings } from '../adminApi'
import type { OpsBooking } from '../types'
import { Badge, statusTone } from '../components/Badge'
import { PAYMENT_LABELS, SOURCE_LABELS, STATUS_LABELS } from '../types'

export default function BookingsPage() {
  const [params, setParams] = useSearchParams()
  const [rows, setRows] = useState<OpsBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState(params.get('q') || '')
  const status = params.get('status') || 'all'
  const source = params.get('source') || 'all'

  const load = () => {
    setLoading(true)
    fetchOpsBookings({ status, source, search })
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, source])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Bookings</h1>
        <Link
          to="/manual"
          className="bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg"
        >
          + Manual
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Search name, email, ref, tour…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setParams((p) => {
                const n = new URLSearchParams(p)
                if (search) n.set('q', search)
                else n.delete('q')
                return n
              })
              load()
            }
          }}
        />
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={status}
          onChange={(e) =>
            setParams((p) => {
              const n = new URLSearchParams(p)
              n.set('status', e.target.value)
              return n
            })
          }
        >
          <option value="all">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={source}
          onChange={(e) =>
            setParams((p) => {
              const n = new URLSearchParams(p)
              n.set('source', e.target.value)
              return n
            })
          }
        >
          <option value="all">All sources</option>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={load}
        className="text-sm text-emerald-800 font-medium"
      >
        Apply search
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-600 text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 text-sm">No bookings match.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((b) => (
            <li key={b.id}>
              <Link
                to={`/bookings/${b.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-3"
              >
                <div className="flex justify-between gap-2 items-start">
                  <div>
                    <div className="font-semibold text-sm">
                      {b.booking_ref || `RN-${b.id}`} · {b.customer_name}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {b.tour_dates?.date} {b.tour_time || ''} ·{' '}
                      {b.tours?.public_name || b.tours?.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {b.adults + b.children} pax · €{Number(b.total_price).toFixed(0)} ·{' '}
                      {SOURCE_LABELS[b.source] || b.source}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge tone={statusTone(b.status)}>{STATUS_LABELS[b.status]}</Badge>
                    <Badge tone={statusTone(b.payment_status)}>
                      {PAYMENT_LABELS[b.payment_status] || b.payment_status}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Guide: {b.guides?.name || '—'} · Vehicle: {b.vehicles?.name || '—'} · Pickup:{' '}
                  {b.pickup_location || '—'}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
