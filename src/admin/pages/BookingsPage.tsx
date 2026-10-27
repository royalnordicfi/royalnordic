import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchOpsBookings, fetchProducts } from '../adminApi'
import type { OpsBooking, Product } from '../types'
import { Badge, statusTone } from '../components/Badge'
import {
  EMAIL_LABELS,
  PAYMENT_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  weekdayForTourDate,
} from '../types'
import { todayTourDateISO } from '../../lib/tourDate'
import {
  Card,
  ErrorBanner,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  inputClass,
  selectClass,
} from '../components/ui'

const ATTENTION_CHIPS: { id: string; label: string }[] = [
  { id: '', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'payment', label: 'Unpaid' },
  { id: 'guide', label: 'No guide' },
  { id: 'vehicle', label: 'No vehicle' },
  { id: 'email', label: 'Email failed' },
]

const WHEN_CHIPS: { id: string; label: string }[] = [
  { id: '', label: 'Any date' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
]

export default function BookingsPage() {
  const [params, setParams] = useSearchParams()
  const [rows, setRows] = useState<OpsBooking[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState(params.get('q') || '')
  const status = params.get('status') || 'all'
  const source = params.get('source') || 'all'
  const attention = params.get('attention') || ''
  const when = params.get('when') || ''
  const tourId = params.get('tour') || ''
  const [refreshing, setRefreshing] = useState(false)

  const today = todayTourDateISO()

  const dateBounds = useMemo(() => {
    if (when === 'today') return { fromDate: today, toDate: today }
    if (when === 'upcoming') return { fromDate: today, toDate: undefined }
    if (when === 'past') return { fromDate: undefined, toDate: today }
    return { fromDate: undefined, toDate: undefined }
  }, [when, today])

  const load = (soft = false) => {
    if (soft && rows.length > 0) setRefreshing(true)
    else setLoading(true)
    setError('')
    fetchOpsBookings({
      status,
      source,
      search,
      attention: (attention as 'payment' | 'guide' | 'vehicle' | 'email' | 'pending') || undefined,
      fromDate: dateBounds.fromDate,
      toDate: when === 'past' ? undefined : dateBounds.toDate,
    })
      .then((data) => {
        let next = data
        if (when === 'past') {
          next = next.filter((b) => (b.tour_dates?.date || '') < today)
        }
        if (when === 'upcoming') {
          next = next.filter((b) => (b.tour_dates?.date || '') >= today)
        }
        if (tourId) {
          next = next.filter((b) => String(b.tour_id) === tourId)
        }
        setRows(next)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }

  useEffect(() => {
    fetchProducts()
      .then((p) => setProducts(p.filter((x) => x.is_active !== false)))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, source, attention, when, tourId])

  const applySearch = () => {
    setParams((p) => {
      const n = new URLSearchParams(p)
      if (search.trim()) n.set('q', search.trim())
      else n.delete('q')
      return n
    })
    load()
  }

  const unpaidCount = useMemo(
    () => rows.filter((b) => b.payment_status === 'unpaid' && b.status !== 'cancelled').length,
    [rows],
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bookings"
        subtitle={
          <>
            {rows.length} shown
            {unpaidCount > 0 ? ` · ${unpaidCount} unpaid` : ''}
            {refreshing ? ' · updating…' : ''}
          </>
        }
        actions={
          <>
            <SecondaryButton onClick={() => load(true)} disabled={refreshing}>
              Refresh
            </SecondaryButton>
            <Link to="/manual">
              <PrimaryButton>+ Booking</PrimaryButton>
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {WHEN_CHIPS.map((chip) => {
          const active = when === chip.id
          return (
            <button
              key={chip.id || 'any-date'}
              type="button"
              onClick={() =>
                setParams((p) => {
                  const n = new URLSearchParams(p)
                  if (chip.id) n.set('when', chip.id)
                  else n.delete('when')
                  return n
                })
              }
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ATTENTION_CHIPS.map((chip) => {
          const active = attention === chip.id
          return (
            <button
              key={chip.id || 'all'}
              type="button"
              onClick={() =>
                setParams((p) => {
                  const n = new URLSearchParams(p)
                  if (chip.id) n.set('attention', chip.id)
                  else n.delete('attention')
                  return n
                })
              }
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      <Card className="space-y-2 !p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className={inputClass}
            placeholder="Search name, email, ref, tour…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applySearch()
            }}
          />
          <select
            className={selectClass}
            value={tourId}
            onChange={(e) =>
              setParams((p) => {
                const n = new URLSearchParams(p)
                if (e.target.value) n.set('tour', e.target.value)
                else n.delete('tour')
                return n
              })
            }
          >
            <option value="">All products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.public_name || p.name}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
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
            className={selectClass}
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
        <SecondaryButton onClick={applySearch} className="w-full sm:w-auto">
          Apply search
        </SecondaryButton>
      </Card>

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-500">No bookings match.</p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {rows.map((b) => {
            const d = b.tour_dates?.date
            const isPrivate =
              b.tour_id === 11 ||
              /private northern lights/i.test(b.tours?.public_name || b.tours?.name || '')
            const awaitingPay =
              b.payment_status === 'unpaid' && b.status !== 'cancelled' && b.status !== 'confirmed'
            return (
              <li key={b.id}>
                <Link
                  to={`/bookings/${b.id}`}
                  className="block rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition-colors hover:border-emerald-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-zinc-900">
                        {b.booking_ref || `RN-${b.id}`} · {b.customer_name}
                      </div>
                      <div className="mt-1 text-xs text-zinc-600">
                        {d ? `${d} (${weekdayForTourDate(d)})` : '—'}
                        {b.tour_time ? ` · ${b.tour_time}` : ''} ·{' '}
                        {b.tours?.public_name || b.tours?.name}
                        {isPrivate ? ' · PRIVATE TOUR' : ''}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {b.adults + b.children} guests · €{Number(b.total_price).toFixed(0)} ·{' '}
                        {SOURCE_LABELS[b.source] || b.source}
                        {b.payment_link_url ? ' · Payment link ready' : ''}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge tone={statusTone(b.status)}>{STATUS_LABELS[b.status]}</Badge>
                      <Badge tone={statusTone(b.payment_status)}>
                        {PAYMENT_LABELS[b.payment_status] || b.payment_status}
                      </Badge>
                      {awaitingPay ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                          Awaiting payment
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2 truncate text-xs text-zinc-500">
                    {b.customer_email}
                    {b.pickup_location ? ` · Pickup: ${b.pickup_location}` : ''}
                    {b.guides?.name ? ` · ${b.guides.name}` : ''}
                    {' · Email: '}
                    {EMAIL_LABELS[b.email_status || 'not_sent']}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
