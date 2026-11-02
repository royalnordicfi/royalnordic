import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { detectCapacityConflicts, fetchOpsBookings } from '../adminApi'
import type { OpsBooking } from '../types'
import { Badge, statusTone } from '../components/Badge'
import { STATUS_LABELS, weekdayForTourDate } from '../types'
import { addTourDays, todayTourDateISO } from '../../lib/tourDate'

export default function CalendarPage() {
  const [params, setParams] = useSearchParams()
  const [bookings, setBookings] = useState<OpsBooking[]>([])
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'day' | 'week'>('day')
  const [anchor, setAnchor] = useState(() => params.get('date') || todayTourDateISO())

  useEffect(() => {
    const d = params.get('date')
    if (d) setAnchor(d)
  }, [params])

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
      if (!d || !map.has(d) || b.status === 'cancelled' || b.deleted_at) continue
      map.get(d)!.push(b)
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.tour_time || '').localeCompare(b.tour_time || ''))
    }
    return map
  }, [bookings, range])

  const setDay = (day: string) => {
    setAnchor(day)
    setParams((p) => {
      const n = new URLSearchParams(p)
      n.set('date', day)
      return n
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Calendar</h1>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode('day')}
            className={`px-3 py-1.5 text-sm rounded-lg ${mode === 'day' ? 'bg-black text-white' : 'bg-white border'}`}
          >
            Day
          </button>
          <button
            type="button"
            onClick={() => setMode('week')}
            className={`px-3 py-1.5 text-sm rounded-lg ${mode === 'week' ? 'bg-black text-white' : 'bg-white border'}`}
          >
            Week
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="px-3 py-2 border rounded-lg bg-white text-sm"
          onClick={() => setDay(addTourDays(anchor, mode === 'day' ? -1 : -7))}
        >
          ←
        </button>
        <input
          type="date"
          className="border rounded-lg px-3 py-2 text-sm flex-1"
          value={anchor}
          onChange={(e) => setDay(e.target.value)}
        />
        <button
          type="button"
          className="px-3 py-2 border rounded-lg bg-white text-sm"
          onClick={() => setDay(addTourDays(anchor, mode === 'day' ? 1 : 7))}
        >
          →
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-lg">{error}</div>
      )}

      {range.map((day) => {
        const rows = byDate.get(day) || []
        const guests = rows.reduce((s, b) => s + b.adults + b.children, 0)
        const unpaid = rows.filter(
          (b) => b.payment_status === 'unpaid' || b.payment_status === 'pending_crypto',
        ).length
        const dayConflicts = detectCapacityConflicts(rows)

        return (
          <section key={day} className="space-y-2">
            <button type="button" className="text-left w-full" onClick={() => { setMode('day'); setDay(day) }}>
              <h2 className="text-sm font-semibold text-zinc-700">
                {weekdayForTourDate(day)} {day}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {rows.length} bookings · {guests} guests
                {unpaid ? ` · ${unpaid} unpaid` : ''}
                {dayConflicts.length ? ` · ${dayConflicts.length} capacity conflict` : ''}
              </p>
            </button>

            {dayConflicts.length > 0 && (
              <div className="text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-2 space-y-1">
                {dayConflicts.map((c) => (
                  <div key={c.tour_date_id}>
                    Over capacity: {c.tour_name} · {c.guests}/{c.capacity}
                  </div>
                ))}
              </div>
            )}

            {rows.length === 0 ? (
              <p className="text-sm text-zinc-400 bg-white border rounded-xl p-3">No bookings</p>
            ) : (
              <ul className="space-y-2">
                {rows.map((b) => (
                  <li key={b.id}>
                    <Link
                      to={`/bookings/${b.id}`}
                      className="block bg-white border border-zinc-200 rounded-xl p-3 hover:border-emerald-300"
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-semibold text-sm">
                          {b.tour_time || 'Time TBD'} · {b.tours?.public_name || b.tours?.name}
                        </span>
                        <Badge tone={statusTone(b.status)}>{STATUS_LABELS[b.status]}</Badge>
                      </div>
                      <div className="text-xs text-zinc-600 mt-1">
                        {b.customer_name} · {b.adults + b.children} pax ·{' '}
                        {b.booking_ref || `RN-${b.id}`}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        Pickup: {b.pickup_location || '—'}
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
