import React, { useEffect, useState } from 'react'
import { fetchCustomersDerived } from '../adminApi'
import type { Customer } from '../types'

export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([])
  const [error, setError] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    fetchCustomersDerived()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
  }, [])

  const filtered = rows.filter((c) => {
    if (!q.trim()) return true
    const hay = `${c.name} ${c.email} ${c.phone}`.toLowerCase()
    return hay.includes(q.trim().toLowerCase())
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Customers</h1>
        <p className="text-sm text-gray-600">
          Derived from bookings by email — duplicates avoided by email key.
        </p>
      </div>

      <input
        className="w-full border rounded-lg px-3 py-2 text-sm"
        placeholder="Search name, email, phone…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded">{error}</div>
      )}

      <ul className="space-y-2">
        {filtered.map((c) => (
          <li key={c.email} className="bg-white border rounded-lg p-3">
            <div className="font-semibold text-sm">{c.name || '—'}</div>
            <div className="text-xs text-gray-600 mt-1">
              {c.email} · {c.phone || '—'}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {c.booking_count} bookings · €{Number(c.total_value || 0).toFixed(0)} booked · Latest:{' '}
              {c.latest_booking ? new Date(c.latest_booking).toLocaleDateString() : '—'} · Upcoming:{' '}
              {c.upcoming_booking || '—'}
            </div>
          </li>
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-500">No customers yet.</p>}
      </ul>
    </div>
  )
}
