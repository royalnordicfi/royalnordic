import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  deleteCustomer,
  fetchBookingsForCustomerEmail,
  fetchCustomers,
  mergeCustomers,
  updateCustomer,
} from '../adminApi'
import type { Customer, OpsBooking } from '../types'
import { weekdayForTourDate } from '../types'

export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [history, setHistory] = useState<OpsBooking[]>([])
  const [mergeId, setMergeId] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  const load = () =>
    fetchCustomers()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))

  useEffect(() => {
    load()
  }, [])

  const open = async (c: Customer) => {
    setSelected(c)
    setConfirmDelete(false)
    setMergeId('')
    setName(c.name || '')
    setEmail(c.email)
    setPhone(c.phone || '')
    setNotes(c.internal_notes || '')
    setHistory([])
    try {
      setHistory(await fetchBookingsForCustomerEmail(c.email))
    } catch {
      setHistory([])
    }
  }

  const filtered = rows.filter((c) => {
    if (!q.trim()) return true
    const hay = `${c.name} ${c.email} ${c.phone} ${c.internal_notes}`.toLowerCase()
    return hay.includes(q.trim().toLowerCase())
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-gray-500">Real customer rows + booking history by email.</p>
      </div>

      <input
        className="w-full border rounded-lg px-3 py-2 text-sm"
        placeholder="Search name, email, phone, notes…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-lg">{error}</div>
      )}
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-3 rounded-lg">
          {msg}
        </div>
      )}

      <ul className="space-y-2">
        {filtered.map((c) => (
          <li key={c.id || c.email}>
            <button
              type="button"
              onClick={() => open(c)}
              className="w-full text-left bg-white border border-gray-200 rounded-xl p-3 hover:border-emerald-300"
            >
              <div className="font-medium text-sm">{c.name || '—'}</div>
              <div className="text-xs text-gray-600 mt-1">
                {c.email} · {c.phone || '—'}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {c.booking_count || 0} bookings · €{Number(c.total_value || 0).toFixed(0)} · Upcoming:{' '}
                {c.upcoming_booking || '—'}
              </div>
            </button>
          </li>
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-500">No customers.</p>}
      </ul>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-start gap-2">
              <h2 className="font-semibold text-lg">Customer</h2>
              <button type="button" className="text-sm text-gray-500" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>

            {selected.id === 0 ? (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                Derived from bookings only — apply migration 016 so customers can be edited as rows.
              </p>
            ) : (
              <>
                <Field label="Name">
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Email">
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field label="Phone">
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Field>
                <Field label="Internal notes">
                  <textarea className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </Field>
                <button
                  type="button"
                  className="w-full bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-semibold"
                  onClick={async () => {
                    setError('')
                    setMsg('')
                    try {
                      const updated = await updateCustomer(selected.id, {
                        name: name || null,
                        email: email.trim().toLowerCase(),
                        phone: phone || null,
                        internal_notes: notes || null,
                      })
                      setMsg('Customer saved')
                      setSelected({ ...selected, ...updated })
                      await load()
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Save failed')
                    }
                  }}
                >
                  Save customer
                </button>

                <div className="border-t pt-3 space-y-2">
                  <h3 className="text-xs font-semibold uppercase text-gray-500">Merge duplicate</h3>
                  <p className="text-xs text-gray-500">
                    Keep this customer; move bookings from another email onto this one, then delete the other row.
                  </p>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={mergeId}
                    onChange={(e) => setMergeId(e.target.value)}
                  >
                    <option value="">Select customer to merge away…</option>
                    {rows
                      .filter((c) => c.id && c.id !== selected.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || c.email} · {c.email}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    disabled={!mergeId}
                    className="w-full border py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40"
                    onClick={async () => {
                      if (!mergeId) return
                      if (!confirm(`Merge customer #${mergeId} into ${selected.email}?`)) return
                      try {
                        await mergeCustomers(selected.id, Number(mergeId))
                        setMsg('Merged')
                        setSelected(null)
                        await load()
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Merge failed')
                      }
                    }}
                  >
                    Merge into this customer
                  </button>
                </div>

                <div className="border-t pt-3">
                  {!confirmDelete ? (
                    <button
                      type="button"
                      className="w-full border border-red-300 text-red-800 py-2.5 rounded-lg text-sm font-semibold"
                      onClick={() => setConfirmDelete(true)}
                    >
                      Delete customer…
                    </button>
                  ) : (
                    <div className="space-y-2 bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-900">
                        Deletes the customer row only. Blocked if active bookings still use this email.
                        Booking history is never rewritten away — cancel/reassign first.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="flex-1 border rounded-lg py-2 text-sm"
                          onClick={() => setConfirmDelete(false)}
                        >
                          Keep
                        </button>
                        <button
                          type="button"
                          className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-semibold"
                          onClick={async () => {
                            try {
                              await deleteCustomer(selected.id)
                              setMsg('Customer deleted')
                              setSelected(null)
                              await load()
                            } catch (e) {
                              setError(e instanceof Error ? e.message : 'Delete failed')
                              setConfirmDelete(false)
                            }
                          }}
                        >
                          Confirm delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="border-t pt-3 space-y-2">
              <h3 className="text-xs font-semibold uppercase text-gray-500">Booking history</h3>
              {history.length === 0 ? (
                <p className="text-sm text-gray-500">No bookings.</p>
              ) : (
                <ul className="space-y-2">
                  {history.map((b) => (
                    <li key={b.id}>
                      <Link
                        to={`/bookings/${b.id}`}
                        className="block text-sm border rounded-lg px-3 py-2 hover:border-emerald-300"
                        onClick={() => setSelected(null)}
                      >
                        <span className="font-medium">{b.booking_ref || `#${b.id}`}</span>
                        {' · '}
                        {b.tour_dates?.date
                          ? `${b.tour_dates.date} (${weekdayForTourDate(b.tour_dates.date)})`
                          : '—'}
                        {' · '}
                        {b.tours?.public_name || b.tours?.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-500 mb-1">{label}</span>
      {children}
    </label>
  )
}
