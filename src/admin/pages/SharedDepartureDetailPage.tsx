import { useEffect, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import {
  cancelSharedDeparture,
  cancelSharedDepartureBooking,
  createSharedDepartureBooking,
  fetchSharedBookingsAccess,
  fetchSharedDepartureDetail,
  listSharedSuppliersAdmin,
  updateSharedDeparture,
  updateSharedDepartureBooking,
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
  textareaClass,
} from '../components/ui'
import {
  bookingErrorMessage,
  canMutateSharedPassenger,
  canSetCapacity,
  channelLabel,
  formatDepartureWhen,
  normalizePassengerCounts,
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

const emptyForm = {
  guest_name: '',
  adults: '1',
  children: '0',
  booking_ref: '',
  pickup_location: '',
  contact_email: '',
  contact_phone: '',
  notes: '',
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default function SharedDepartureDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [params, setParams] = useSearchParams()
  const base = useSharedBookingsBase()
  const paths = sharedBookingsPaths(base)
  const [access, setAccess] = useState<SharedBookingsAccess | null>(null)
  const [data, setData] = useState<DetailState | null>(null)
  const [suppliers, setSuppliers] = useState<SharedSupplierOption[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingDeparture, setEditingDeparture] = useState(false)
  const [showAdd, setShowAdd] = useState(params.get('add') === '1')
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
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
  const canBook =
    Boolean(access && access.ok && (access.access === 'admin' || access.access === 'supplier')) &&
    data?.departure.status !== 'cancelled'

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

  useEffect(() => {
    if (params.get('add') === '1') setShowAdd(true)
  }, [params])

  if (!validId) {
    return <Navigate to={paths.root} replace />
  }

  const dep = data?.departure
  const confirmed = dep?.confirmed_passengers || 0
  const nextCapacity = Number(capacity)
  const capacityOk = canSetCapacity(nextCapacity, confirmed)

  const openAdd = () => {
    setEditingBookingId(null)
    setForm(emptyForm)
    setShowAdd(true)
    setParams((prev) => {
      const n = new URLSearchParams(prev)
      n.set('add', '1')
      return n
    })
  }

  const closeAdd = () => {
    setShowAdd(false)
    setEditingBookingId(null)
    setForm(emptyForm)
    setParams((prev) => {
      const n = new URLSearchParams(prev)
      n.delete('add')
      return n
    })
  }

  const openEditBooking = (row: SharedPassenger) => {
    setShowAdd(true)
    setEditingBookingId(row.id)
    setForm({
      guest_name: row.guest_name || '',
      adults: String(row.adults ?? 0),
      children: String(row.children ?? 0),
      booking_ref: row.booking_ref || '',
      pickup_location: row.pickup_location || '',
      contact_email: row.contact_email || '',
      contact_phone: row.contact_phone || '',
      notes: row.notes || '',
    })
  }

  const saveBooking = async () => {
    if (!id || !dep) return
    const counts = normalizePassengerCounts(Number(form.adults), Number(form.children))
    if (!counts.ok) {
      setError(bookingErrorMessage(counts.error))
      return
    }
    if (!form.guest_name.trim()) {
      setError(bookingErrorMessage('guest_name_required'))
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        guest_name: form.guest_name.trim(),
        adults: counts.adults,
        children: counts.children,
        booking_ref: form.booking_ref.trim() || undefined,
        pickup_location: form.pickup_location.trim() || undefined,
        contact_email: form.contact_email.trim() || undefined,
        contact_phone: form.contact_phone.trim() || undefined,
        notes: form.notes.trim() || undefined,
      }
      const res = editingBookingId
        ? await updateSharedDepartureBooking(editingBookingId, payload)
        : await createSharedDepartureBooking(id, payload)
      if (!res.ok) {
        setError(
          bookingErrorMessage(res.error, {
            available_seats: res.available_seats,
            confirmed_passengers: res.confirmed_passengers,
          }),
        )
        return
      }
      closeAdd()
      await load(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save booking')
    } finally {
      setSaving(false)
    }
  }

  const cancelBooking = async (row: SharedPassenger) => {
    if (!id) return
    if (!window.confirm(`Cancel booking for ${row.guest_name || 'guest'}? Seats will be released.`)) {
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await cancelSharedDepartureBooking(row.id)
      if (!res.ok) {
        setError(bookingErrorMessage(res.error))
        return
      }
      await load(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel booking')
    } finally {
      setSaving(false)
    }
  }

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
        supplier_ids: dep.board === 'shared_bus' ? supplierIds : undefined,
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
      setEditingDeparture(false)
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
      setEditingDeparture(false)
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
            {canBook ? (
              <PrimaryButton type="button" onClick={openAdd}>
                Add booking
              </PrimaryButton>
            ) : null}
            {isAdmin && dep && dep.status !== 'cancelled' ? (
              editingDeparture ? (
                <>
                  <PrimaryButton
                    type="button"
                    disabled={saving || !capacityOk}
                    onClick={() => void saveEdits()}
                  >
                    Save departure
                  </PrimaryButton>
                  <SecondaryButton
                    type="button"
                    disabled={saving}
                    onClick={() => setEditingDeparture(false)}
                  >
                    Discard
                  </SecondaryButton>
                </>
              ) : (
                <>
                  <SecondaryButton type="button" onClick={() => setEditingDeparture(true)}>
                    Edit departure
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
          {showAdd && canBook ? (
            <Card className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-900">
                {editingBookingId ? 'Edit booking' : 'Add booking'}
              </h2>
              <p className="text-xs text-zinc-500">
                {access && access.ok && access.access === 'supplier'
                  ? `Saved under ${access.supplier_name}. Confirmed seats reduce shared capacity.`
                  : 'Saved under Royal Nordic. Confirmed seats reduce shared capacity.'}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Guest name" className="sm:col-span-2">
                  <input
                    className={inputClass}
                    value={form.guest_name}
                    onChange={(e) => setForm((f) => ({ ...f, guest_name: e.target.value }))}
                    autoFocus
                  />
                </Field>
                <Field label="Adults">
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={form.adults}
                    onChange={(e) => setForm((f) => ({ ...f, adults: e.target.value }))}
                  />
                </Field>
                <Field label="Children">
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={form.children}
                    onChange={(e) => setForm((f) => ({ ...f, children: e.target.value }))}
                  />
                </Field>
                <Field label="Booking reference">
                  <input
                    className={inputClass}
                    value={form.booking_ref}
                    onChange={(e) => setForm((f) => ({ ...f, booking_ref: e.target.value }))}
                  />
                </Field>
                <Field label="Pickup / meeting note">
                  <input
                    className={inputClass}
                    value={form.pickup_location}
                    onChange={(e) => setForm((f) => ({ ...f, pickup_location: e.target.value }))}
                  />
                </Field>
                <Field label="Contact email">
                  <input
                    type="email"
                    className={inputClass}
                    value={form.contact_email}
                    onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                  />
                </Field>
                <Field label="Contact phone">
                  <input
                    className={inputClass}
                    value={form.contact_phone}
                    onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                  />
                </Field>
                <Field label="Notes" className="sm:col-span-2">
                  <textarea
                    className={textareaClass}
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="button" disabled={saving} onClick={() => void saveBooking()}>
                  {editingBookingId ? 'Save changes' : 'Confirm booking'}
                </PrimaryButton>
                <SecondaryButton type="button" disabled={saving} onClick={closeAdd}>
                  Cancel
                </SecondaryButton>
              </div>
            </Card>
          ) : null}

          {editingDeparture && isAdmin ? (
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-900">Passenger manifest</h2>
              {canBook && !showAdd ? (
                <SecondaryButton type="button" onClick={openAdd}>
                  Add booking
                </SecondaryButton>
              ) : null}
            </div>
            <p className="text-xs text-zinc-500">
              Confirmed passengers occupy seats. Cancelled bookings stay in history and free capacity.
            </p>
            {data && data.passengers.length === 0 ? (
              <Card>
                <p className="text-sm text-zinc-600">No active passengers on this departure.</p>
              </Card>
            ) : (
              <ul className="space-y-2">
                {data?.passengers.map((row) => {
                  const canMutate = canMutateSharedPassenger(access, row)
                  return (
                    <li key={row.id} className="rounded-lg border border-zinc-200 px-3 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-900">{row.guest_name || 'Guest'}</p>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {[
                              row.booking_ref,
                              `${row.adults} adults`,
                              row.children ? `${row.children} children` : null,
                              `${row.passenger_count} pax`,
                              row.supplier_name,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                          {row.pickup_location ? (
                            <p className="mt-1 text-xs text-zinc-600">Pickup: {row.pickup_location}</p>
                          ) : null}
                          {row.contact_email || row.contact_phone ? (
                            <p className="mt-1 text-xs text-zinc-600">
                              {[row.contact_email, row.contact_phone].filter(Boolean).join(' · ')}
                            </p>
                          ) : null}
                          {row.notes ? (
                            <p className="mt-1 text-xs text-zinc-500">Notes: {row.notes}</p>
                          ) : null}
                          <p className="mt-1 text-[11px] text-zinc-400">{channelLabel(row.channel)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                          {canMutate && row.status === 'confirmed' && dep.status !== 'cancelled' ? (
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                className="text-xs font-medium text-emerald-800 hover:underline"
                                onClick={() => openEditBooking(row)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="text-xs font-medium text-red-700 hover:underline"
                                disabled={saving}
                                onClick={() => void cancelBooking(row)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {data && data.cancelled.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-zinc-900">Cancelled (history)</h2>
              <ul className="space-y-2 opacity-80">
                {data.cancelled.map((row) => (
                  <li key={row.id} className="rounded-lg border border-zinc-200 px-3 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900">{row.guest_name || 'Guest'}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {[row.booking_ref, `${row.passenger_count} pax`, row.supplier_name]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
