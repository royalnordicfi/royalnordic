import React, { useEffect, useState } from 'react'
import { fetchTransportationRequests, updateTransportationRequestStatus } from '../adminApi'
import type { TransportationRequest } from '../types'
import { Badge } from '../components/Badge'

const STATUS_OPTIONS = ['new', 'quoted', 'confirmed', 'closed', 'spam'] as const

export default function RequestsPage() {
  const [rows, setRows] = useState<TransportationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('open')

  const load = async (mode: 'initial' | 'refresh' = 'refresh') => {
    try {
      setError('')
      if (mode === 'initial') setLoading(true)
      else setRefreshing(true)
      const data = await fetchTransportationRequests(
        statusFilter === 'open' ? undefined : statusFilter,
      )
      const filtered =
        statusFilter === 'open'
          ? data.filter((r) => r.status === 'new' || r.status === 'quoted')
          : data
      setRows(filtered)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load requests')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void load('initial')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const setStatus = async (id: number, status: string) => {
    try {
      await updateTransportationRequestStatus(id, status)
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Requests</h1>
          <p className="text-sm text-zinc-500">
            Transportation quote requests from the website (custom / Levi transfers).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load('refresh')}
          disabled={refreshing}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'open', label: 'Open' },
          { id: 'all', label: 'All' },
          { id: 'new', label: 'New' },
          { id: 'quoted', label: 'Quoted' },
          { id: 'confirmed', label: 'Confirmed' },
          { id: 'closed', label: 'Closed' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatusFilter(f.id)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              statusFilter === f.id
                ? 'bg-zinc-900 text-white'
                : 'border border-zinc-300 bg-white text-zinc-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading requests…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-zinc-500">No requests in this filter.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-zinc-200 bg-white p-3 text-sm space-y-2"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-zinc-900">
                    {r.service_type || 'Transportation'} · {r.name}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {r.email}
                    {r.phone ? ` · ${r.phone}` : ''}
                    {' · '}
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString('en-GB', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : ''}
                  </div>
                </div>
                <Badge tone={r.status === 'new' ? 'yellow' : r.status === 'closed' ? 'gray' : 'green'}>
                  {r.status}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-700">
                <div>
                  <span className="text-zinc-400">Destination </span>
                  {r.destination || '—'}
                </div>
                <div>
                  <span className="text-zinc-400">Pickup </span>
                  {r.pickup_details || '—'}
                </div>
                <div>
                  <span className="text-zinc-400">When </span>
                  {r.preferred_date || '—'}
                  {r.preferred_time ? ` ${r.preferred_time}` : ''}
                </div>
                <div>
                  <span className="text-zinc-400">Group </span>
                  {r.group_size || '—'}
                </div>
              </div>
              {r.additional_info && (
                <p className="text-xs text-zinc-600 whitespace-pre-wrap border-t border-zinc-100 pt-2">
                  {r.additional_info}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={`mailto:${r.email}?subject=${encodeURIComponent(
                    `Royal Nordic transport quote — ${r.service_type || 'request'}`,
                  )}`}
                  className="rounded-md bg-emerald-700 px-2.5 py-1 text-xs font-medium text-white"
                >
                  Email customer
                </a>
                <select
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                  value={r.status}
                  onChange={(e) => void setStatus(r.id, e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      Mark {s}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
