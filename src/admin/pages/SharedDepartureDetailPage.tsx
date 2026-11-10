import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  cancelSharedDeparture,
  fetchSharedBookingsAccess,
  fetchSharedDepartureDetail,
  listSharedSuppliersAdmin,
  updateSharedDeparture,
} from '../adminApi'
import { Badge, statusTone } from '../components/Badge'
import {
  Card,
  ErrorBanner,
  Field,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  inputClass,
} from '../components/ui'
import {
  canSetCapacity,
  channelLabel,
  formatDepartureWhen,
  syncStatusBanner,
  type SharedBookingsAccess,
  type SharedDepartureSummary,
  type SharedPassenger,
  type SharedSupplierOption,
} from '../sharedBookings'
import { sharedBookingsPaths, useSharedBookingsBase } from '../sharedBookingsPaths'
import { SHARED_BOOKINGS_ADMIN_BASE } from '../../lib/sharedBookingsPortal'

type DetailState = {
  departure: SharedDepartureSummary
  passengers: SharedPassenger[]
  cancelled: SharedPassenger[]
  assigned_supplier_ids: string[]
  channels_synced: boolean
}

function PassengerRow({ row }: { row: SharedPassenger }) {
  return (
    <li className="rounded-lg border border-zinc-200 px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-zinc-900">{row.guest_name || 'Guest'}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {[row.booking_ref, `${row.passenger_count} pax`, row.supplier_name]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {row.pickup_location ? (
            <p className="mt-1 text-xs text-zinc-600">Pickup: {row.pickup_location}</p>
          ) : null}
          <p className="mt-1 text-[11px] text-zinc-400">{channelLabel(row.channel)}</p>
        </div>
        <Badge tone={statusTone(row.status)}>{row.status}</Badge>
      </div>
    </li>
  )
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default function SharedDepartureDetailPage() {
  const { id } = useParams<{ id: string }>()
  const base = useSharedBookingsBase()
  const paths = sharedBookingsPaths(base)
  const [access, setAccess] = useState<SharedBookingsAccess | null>(null)
  const [data, setData] = useState<DetailState | null>(null)
  const [suppliers, setSuppliers] = useState<SharedSupplierOption[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [capacity, setCapacity] = useState('')
  const [meeting, setMeeting] = useState('')
  const [title, setTitle] = useState('')
  const [supplierIds, setSupplierIds] = useState<string[]>([])
  const validId = Boolean(id && UUID_RE.test(id))
  const isAdminHost = base === SHARED_BOOKINGS_ADMIN_BASE
  const isAdmin = Boolean(access && access.ok && access.access === 'admin' && isAdminHost)

  const load = async (departureId: string) => {
    const [a, res] = await Promise.all([
      fetchSharedBookingsAccess(),
      fetchSharedDepartureDetail(departureId),
    ])
    setAccess(a)
    if (!res.ok) {
      setError(res.error || 'Could not load departure')
      setData(null)
      return
    }
    setError('')
    setData({
      departure: res.departure,
      passengers: res.passengers,
      cancelled: res.cancelled,
      assigned_supplier_ids: res.assigned_supplier_ids,
      channels_synced: res.channels_synced,
    })
    setDate(res.departure.departure_date)
    setTime(res.departure.departure_time || '')
    setCapacity(String(res.departure.capacity))
    setMeeting(res.departure.meeting_point || '')
    setTitle(res.departure.tour_title)
    setSupplierIds(res.assigned_supplier_ids.filter(Boolean))
    if (a.ok && a.access === 'admin' && isAdminHost) {
      const sup = await listSharedSuppliersAdmin()
      if (sup.ok) {
        setSuppliers(sup.suppliers.filter((s) => s.code !== 'royal_nordic' && s.is_active))
      }
    }
  }

  useEffect(() => {
    if (!id || !UUID_RE.test(id)) return
    let cancelled = false
    setLoading(true)
    void load(id)
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, isAdminHost])

  if (!validId) {
    return <Navigate to={paths.root} replace />
  }

  const dep = data?.departure
  const confirmed = dep?.confirmed_passengers || 0
  const nextCapacity = Number(capacity)
  const capacityOk = canSetCapacity(nextCapacity, confirmed)

  const saveEdits = async () => {
    if (!id || !dep) return
    if (!capacityOk) {
      setError(`Capacity cannot be below confirmed occupancy (${confirmed})`)
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await updateSharedDeparture({
        departure_id: id,
        departure_date: date,
        departure_time: time.trim(),
        capacity: nextCapacity,
        meeting_point: meeting.trim(),
        tour_title: title.trim(),
        supplier_ids:
          dep.board === 'shared_bus'
            ? supplierIds
            : undefined,
      })
      if (!res.ok) {
        if (res.error === 'capacity_below_occupancy') {
          setError(
            `Capacity cannot be below confirmed occupancy (${res.confirmed_passengers ?? confirmed})`,
          )
        } else {
          setError(res.error || 'Could not update departure')
        }
        return
      }
      setEditing(false)
      await load(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update departure')
    } finally {
      setSaving(false)
    }
  }

  const cancelDeparture = async () => {
    if (!id || !dep) return
    if (
      !window.confirm(
        confirmed > 0
          ? `Cancel this departure? ${confirmed} confirmed passenger(s) are still on the manifest.`
          : 'Cancel this departure?',
      )
    ) {
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await cancelSharedDeparture(id)
      if (!res.ok) {
        setError(res.error || 'Could not cancel departure')
        return
      }
      await load(id)
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel departure')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={dep?.tour_title || 'Departure'}
        subtitle={
          dep
            ? `${formatDepartureWhen(dep.departure_date, dep.departure_time)} · ${
                dep.status === 'cancelled' ? 'Cancelled · ' : ''
              }${syncStatusBanner(data?.channels_synced)}`
            : syncStatusBanner(false)
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {isAdmin && dep && dep.status !== 'cancelled' ? (
              editing ? (
                <>
                  <PrimaryButton type="button" disabled={saving || !capacityOk} onClick={() => void saveEdits()}>
                    Save
                  </PrimaryButton>
                  <SecondaryButton type="button" disabled={saving} onClick={() => setEditing(false)}>
                    Discard
                  </SecondaryButton>
                </>
              ) : (
                <>
                  <SecondaryButton type="button" onClick={() => setEditing(true)}>
                    Edit
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    className="border-red-300 text-red-800 hover:bg-red-50"
                    disabled={saving}
                    onClick={() => void cancelDeparture()}
                  >
                    Cancel departure
                  </SecondaryButton>
                </>
              )
            ) : null}
            <Link
              to={paths.root}
              className="inline-flex min-h-[40px] items-center rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              ← Back
            </Link>
          </div>
        }
      />

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}
      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : null}

      {dep ? (
        <>
          {editing && isAdmin ? (
            <Card className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-900">Edit departure</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Title">
                  <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
                </Field>
                <Field label="Date">
                  <input
                    type="date"
                    className={inputClass}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </Field>
                <Field label="Time">
                  <input className={inputClass} value={time} onChange={(e) => setTime(e.target.value)} />
                </Field>
                <Field
                  label="Capacity"
                  hint={
                    capacityOk
                      ? `Confirmed occupancy: ${confirmed}`
                      : `Must be at least ${confirmed} (confirmed passengers)`
                  }
                >
                  <input
                    type="number"
                    min={Math.max(1, confirmed)}
                    className={inputClass}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </Field>
                <Field label="Meeting point" className="sm:col-span-2">
                  <input
                    className={inputClass}
                    value={meeting}
                    onChange={(e) => setMeeting(e.target.value)}
                  />
                </Field>
              </div>
              {dep.board === 'shared_bus' ? (
                <Field label="Operator access">
                  <div className="flex flex-wrap gap-2">
                    {suppliers.map((s) => {
                      const on = supplierIds.includes(s.id)
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() =>
                            setSupplierIds((prev) =>
                              on ? prev.filter((x) => x !== s.id) : [...prev, s.id],
                            )
                          }
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${
                            on
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                              : 'border-zinc-300 bg-white text-zinc-700'
                          }`}
                        >
                          {s.display_name}
                        </button>
                      )
                    })}
                  </div>
                </Field>
              ) : null}
            </Card>
          ) : (
            <Card>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-400">Confirmed</p>
                  <p className="text-lg font-semibold text-zinc-900">{dep.confirmed_passengers}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-400">Capacity</p>
                  <p className="text-lg font-semibold text-zinc-900">{dep.capacity}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-400">Available</p>
                  <p className="text-lg font-semibold text-zinc-900">{dep.available_seats}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-400">Board</p>
                  <p className="text-sm font-semibold text-zinc-900">
                    {dep.board === 'shared_bus' ? 'Shared Bus' : 'My Tours'}
                  </p>
                </div>
              </div>
              {dep.meeting_point ? (
                <p className="mt-3 text-sm text-zinc-600">Meeting point: {dep.meeting_point}</p>
              ) : null}
              {dep.status === 'cancelled' ? (
                <p className="mt-3 text-sm font-medium text-red-700">This departure is cancelled.</p>
              ) : null}
              {dep.supplier_breakdown.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {dep.supplier_breakdown.map((s) => (
                    <span
                      key={s.supplier_code}
                      className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-700"
                    >
                      {s.supplier_name}: {s.confirmed_passengers}
                    </span>
                  ))}
                </div>
              ) : null}
            </Card>
          )}

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-zinc-900">Passenger manifest</h2>
            <p className="text-xs text-zinc-500">
              Confirmed passengers occupy seats. Pending requests are listed but do not reduce
              availability. Cancelled bookings stay in history below.
            </p>
            {data && data.passengers.length === 0 ? (
              <Card>
                <p className="text-sm text-zinc-600">No active passengers on this departure.</p>
              </Card>
            ) : (
              <ul className="space-y-2">
                {data?.passengers.map((row) => (
                  <PassengerRow key={row.id} row={row} />
                ))}
              </ul>
            )}
          </section>

          {data && data.cancelled.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-zinc-900">Cancelled (history)</h2>
              <ul className="space-y-2 opacity-80">
                {data.cancelled.map((row) => (
                  <PassengerRow key={row.id} row={row} />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
