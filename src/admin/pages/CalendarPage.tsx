import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchOpsBookings } from '../adminApi'
import type { OpsBooking } from '../types'
import { Badge, statusTone } from '../components/Badge'
import { STATUS_LABELS } from '../types'
import { addTourDays, todayTourDateISO } from '../../lib/tourDate'

export default function CalendarPage() {
  const [bookings, setBookings] = useState<OpsBooking[]>([])
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'day' | 'week'>('day')
  const [anchor, setAnchor] = useState(() => todayTourDateISO())

  useEffect(() => {
    fetchOpsBookings()
      .then(setBookings)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
  }, [])

  const range = useMemo(() => {
    if (mode === 'day') return [anchor]
    return Array.from({ length: 7 }, (_, i) => addTourDays(anchor, i))
  }, [mode, anchor])

  const byDate = useMemo(() => {
    const map = new Map<string, OpsBooking[]>()
    for (const day of range) map.set(day, [])
    for (const b of bookings) {
      const d = b.tour_dates?.date
      if (!d || !map.has(d) || b.status === 'cancelled') continue
      map.get(d)!.push(b)
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.tour_time || '').localeCompare(b.tour_time || ''))
    }
    return map
  }, [bookings, range])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Operations</h1>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode('day')}
            className={`px-3 py-1.5 text-sm rounded ${mode === 'day' ? 'bg-black text-white' : 'bg-white border'}`}
          >
            Day
          </button>
          <button
            type="button"
            onClick={() => setMode('week')}
            className={`px-3 py-1.5 text-sm rounded ${mode === 'week' ? 'bg-black text-white' : 'bg-white border'}`}
          >
            Week
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="px-3 py-2 border rounded-lg bg-white text-sm"
          onClick={() => setAnchor(addTourDays(anchor, mode === 'day' ? -1 : -7))}
        >
          ←
        </button>
        <input
          type="date"
          className="border rounded-lg px-3 py-2 text-sm flex-1"
          value={anchor}
          onChange={(e) => setAnchor(e.target.value)}
        />
        <button
          type="button"
          className="px-3 py-2 border rounded-lg bg-white text-sm"
          onClick={() => setAnchor(addTourDays(anchor, mode === 'day' ? 1 : 7))}
        >
          →
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded">{error}</div>
      )}

      <p className="text-xs text-gray-500">
        Internal schedule only — external calendar sync not connected.
      </p>

      {range.map((day) => {
        const rows = byDate.get(day) || []
        return (
          <section key={day} className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{day}</h2>
            {rows.length === 0 ? (
              <p className="text-sm text-gray-400 bg-white border rounded-lg p-3">No tours</p>
            ) : (
              <ul className="space-y-2">
                {rows.map((b) => (
                  <li key={b.id}>
                    <Link
                      to={`/bookings/${b.id}`}
                      className="block bg-white border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-semibold text-sm">
                          {b.tour_time || 'Time TBD'} ·{' '}
                          {b.tours?.public_name || b.tours?.name}
                        </span>
                        <Badge tone={statusTone(b.status)}>{STATUS_LABELS[b.status]}</Badge>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {b.adults + b.children} pax · Pickup: {b.pickup_location || '—'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Guide: {b.guides?.name || 'Unassigned'} · Vehicle:{' '}
                        {b.vehicles?.name || 'Unassigned'}
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
  )
}
