import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import {
  createSharedDeparture,
  fetchSharedBookingsAccess,
  listSharedDepartures,
  listSharedSuppliersAdmin,
  listSharedTourTemplates,
  upsertSharedTourTemplate,
} from '../adminApi'
import { Badge } from '../components/Badge'
import {
  Card,
  ErrorBanner,
  Field,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  inputClass,
  selectClass,
} from '../components/ui'
import {
  canAccessBoard,
  occupancyLabel,
  occupancyTone,
  syncStatusBanner,
  type SharedBoard,
  type SharedBookingsAccess,
  type SharedCalendarView,
  type SharedDepartureSummary,
  type SharedSupplierOption,
  type SharedTourTemplate,
} from '../sharedBookings'
import {
  calendarRange,
  formatCalendarHeading,
  groupDeparturesByDate,
  monthGridWithDepartures,
  shiftCalendarAnchor,
} from '../sharedCalendar'
import { sharedBookingsPaths, useSharedBookingsBase } from '../sharedBookingsPaths'
import { WEEKDAY_HEADERS_MON_FIRST, todayTourDateISO } from '../../lib/tourDate'

const views: { id: SharedCalendarView; label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
  { id: 'day', label: 'Day' },
]

const boards: { id: SharedBoard; label: string }[] = [
  { id: 'shared_bus', label: 'Shared Bus' },
  { id: 'my_tours', label: 'My Tours' },
]

function DepartureCard({
  row,
  href,
  addHref,
  compact = false,
}: {
  row: SharedDepartureSummary
  href: string
  addHref?: string
  compact?: boolean
}) {
  const tone = occupancyTone(row.confirmed_passengers, row.capacity)
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white transition hover:border-emerald-300 hover:shadow-sm ${
        compact ? 'px-2 py-1.5' : 'p-3'
      } ${row.status === 'cancelled' ? 'opacity-60' : ''}`}
    >
      <Link to={href} className="block">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`truncate font-semibold text-zinc-900 ${compact ? 'text-xs' : 'text-sm'}`}>
              {row.departure_time ? `${row.departure_time} · ` : ''}
              {row.tour_title}
            </p>
            {!compact && row.meeting_point ? (
              <p className="mt-0.5 truncate text-[11px] text-zinc-500">{row.meeting_point}</p>
            ) : null}
          </div>
          <Badge tone={tone === 'amber' ? 'yellow' : tone === 'zinc' ? 'gray' : tone}>
            {compact
              ? `${row.confirmed_passengers}/${row.capacity}`
              : occupancyLabel(row.confirmed_passengers, row.capacity, row.available_seats)}
          </Badge>
        </div>
      </Link>
      {!compact && addHref && row.status !== 'cancelled' ? (
        <div className="mt-2">
          <Link to={addHref} className="text-xs font-medium text-emerald-800 hover:underline">
            Add booking
          </Link>
        </div>
      ) : null}
    </div>
  )
}

export default function SharedBookingsPage() {
  const base = useSharedBookingsBase()
  const paths = sharedBookingsPaths(base)
  const [params, setParams] = useSearchParams()
  const requestedBoard = (params.get('board') as SharedBoard) || 'shared_bus'
  const board: SharedBoard = requestedBoard === 'my_tours' ? 'my_tours' : 'shared_bus'
  const viewParam = params.get('view') as SharedCalendarView | null
  const view: SharedCalendarView =
    viewParam === 'week' || viewParam === 'day' || viewParam === 'month' ? viewParam : 'month'
  const anchor = params.get('date') || todayTourDateISO()

  const [access, setAccess] = useState<SharedBookingsAccess | null>(null)
  const [rows, setRows] = useState<SharedDepartureSummary[]>([])
  const [templates, setTemplates] = useState<SharedTourTemplate[]>([])
  const [suppliers, setSuppliers] = useState<SharedSupplierOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [panel, setPanel] = useState<'none' | 'template' | 'departure'>('none')
  const [saving, setSaving] = useState(false)

  const [tplTitle, setTplTitle] = useState('')
  const [tplCategory, setTplCategory] = useState<SharedBoard>('shared_bus')
  const [tplMeeting, setTplMeeting] = useState('')
  const [tplCapacity, setTplCapacity] = useState('50')
  const [tplTime, setTplTime] = useState('')

  const [depTemplateId, setDepTemplateId] = useState('')
  const [depDate, setDepDate] = useState(anchor)
  const [depTime, setDepTime] = useState('')
  const [depCapacity, setDepCapacity] = useState('50')
  const [depMeeting, setDepMeeting] = useState('')
  const [depTitle, setDepTitle] = useState('')
  const [depSupplierIds, setDepSupplierIds] = useState<string[]>([])

  const range = useMemo(() => calendarRange(view, anchor), [view, anchor])
  const byDate = useMemo(() => groupDeparturesByDate(rows), [rows])
  const monthCells = useMemo(
    () => (view === 'month' ? monthGridWithDepartures(anchor, byDate) : []),
    [view, anchor, byDate],
  )

  const isAdmin = Boolean(access && access.ok && access.access === 'admin')

  const setQuery = (next: { board?: SharedBoard; view?: SharedCalendarView; date?: string }) => {
    setParams((prev) => {
      const n = new URLSearchParams(prev)
      if (next.board) n.set('board', next.board)
      if (next.view) n.set('view', next.view)
      if (next.date) n.set('date', next.date)
      return n
    })
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void fetchSharedBookingsAccess()
      .then(async (a) => {
        if (cancelled) return
        setAccess(a)
        if (!a.ok || a.access === 'none') {
          setRows([])
          setError(a.ok === false ? a.error : 'No Shared Bookings access')
          return
        }
        if (!canAccessBoard(a, board)) {
          setRows([])
          setError('You do not have access to this board')
          return
        }
        const includeCancelled = a.ok && a.access === 'admin'
        const list = await listSharedDepartures(board, range.from, range.to, includeCancelled)
        if (cancelled) return
        if (!list.ok) {
          setError(list.error || 'Could not load departures')
          setRows([])
          return
        }
        setError('')
        setRows(list.departures)

        if (a.access === 'admin') {
          const [tpl, sup] = await Promise.all([
            listSharedTourTemplates(false),
            listSharedSuppliersAdmin(),
          ])
          if (cancelled) return
          if (tpl.ok) setTemplates(tpl.templates)
          if (sup.ok) {
            setSuppliers(sup.suppliers.filter((s) => s.code !== 'royal_nordic' && s.is_active))
          }
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [board, range.from, range.to, refreshKey])

  useEffect(() => {
    setDepDate(anchor)
  }, [anchor])

  const openDeparturePanel = () => {
    const tpl = templates.find((t) => t.id === depTemplateId) || templates[0]
    if (tpl) {
      setDepTemplateId(tpl.id)
      setDepTitle(tpl.title)
      setDepTime(tpl.default_departure_time || '')
      setDepCapacity(String(tpl.default_capacity || 50))
      setDepMeeting(tpl.meeting_point || '')
    } else {
      setDepTemplateId('')
      setDepTitle('')
      setDepTime('')
      setDepCapacity('50')
      setDepMeeting('')
    }
    setDepSupplierIds([])
    setPanel('departure')
  }

  const onTemplateChange = (id: string) => {
    setDepTemplateId(id)
    const tpl = templates.find((t) => t.id === id)
    if (!tpl) return
    setDepTitle(tpl.title)
    setDepTime(tpl.default_departure_time || '')
    setDepCapacity(String(tpl.default_capacity || 50))
    setDepMeeting(tpl.meeting_point || '')
  }

  const saveTemplate = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await upsertSharedTourTemplate({
        title: tplTitle.trim(),
        category: tplCategory,
        meeting_point: tplMeeting.trim(),
        default_capacity: Number(tplCapacity) || 50,
        default_departure_time: tplTime.trim() || undefined,
      })
      if (!res.ok || !res.template) {
        setError(res.error || 'Could not save tour template')
        return
      }
      setTemplates((prev) =>
        [...prev.filter((t) => t.id !== res.template!.id), res.template!].sort((a, b) =>
          a.title.localeCompare(b.title),
        ),
      )
      setTplTitle('')
      setTplMeeting('')
      setTplTime('')
      setTplCapacity('50')
      setPanel('none')
      setDepTemplateId(res.template.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save tour template')
    } finally {
      setSaving(false)
    }
  }

  const saveDeparture = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await createSharedDeparture({
        template_id: depTemplateId || null,
        board: templates.find((t) => t.id === depTemplateId)?.category || board,
        departure_date: depDate,
        departure_time: depTime.trim() || undefined,
        capacity: Number(depCapacity) || undefined,
        meeting_point: depMeeting.trim() || undefined,
        tour_title: depTitle.trim() || undefined,
        supplier_ids: depSupplierIds,
      })
      if (!res.ok) {
        setError(res.error || 'Could not create departure')
        return
      }
      setPanel('none')
      setRefreshKey((n) => n + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create departure')
    } finally {
      setSaving(false)
    }
  }

  if (access && access.ok && access.access === 'none') {
    return (
      <div className="space-y-4">
        <PageHeader title="Shared Bookings" subtitle="Restricted operations board" />
        <ErrorBanner>Your account is not authorized for Shared Bookings.</ErrorBanner>
      </div>
    )
  }

  if (access && access.ok && access.access === 'supplier' && board === 'my_tours') {
    return <Navigate to={`${paths.root}?board=shared_bus`} replace />
  }

  const partnerSuppliers = suppliers

  return (
    <div className="space-y-4">
      <PageHeader
        title="Shared Bookings"
        subtitle={
          access && access.ok && (access.access === 'admin' || access.access === 'supplier')
            ? `${access.supplier_name} · ${syncStatusBanner(false)}`
            : syncStatusBanner(false)
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {isAdmin ? (
              <>
                <SecondaryButton type="button" onClick={() => setPanel('template')}>
                  New tour
                </SecondaryButton>
                <PrimaryButton type="button" onClick={openDeparturePanel}>
                  Add departure
                </PrimaryButton>
              </>
            ) : null}
            <SecondaryButton
              type="button"
              onClick={() => setRefreshKey((n) => n + 1)}
              disabled={loading}
            >
              Refresh
            </SecondaryButton>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-0.5">
          {boards
            .filter((b) => canAccessBoard(access, b.id))
            .map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setQuery({ board: b.id })}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  board === b.id ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {b.label}
              </button>
            ))}
        </div>
        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-0.5">
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setQuery({ view: v.id })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                view === v.id ? 'bg-emerald-700 text-white' : 'text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          onClick={() => setQuery({ date: shiftCalendarAnchor(view, anchor, -1) })}
        >
          ←
        </button>
        <p className="min-w-[10rem] flex-1 text-center text-sm font-semibold text-zinc-900 sm:flex-none">
          {formatCalendarHeading(view, anchor)}
        </p>
        <button
          type="button"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          onClick={() => setQuery({ date: shiftCalendarAnchor(view, anchor, 1) })}
        >
          →
        </button>
        <SecondaryButton type="button" onClick={() => setQuery({ date: todayTourDateISO() })}>
          Today
        </SecondaryButton>
        <input
          type="date"
          className={`${inputClass} w-auto max-w-[11rem]`}
          value={anchor}
          onChange={(e) => e.target.value && setQuery({ date: e.target.value })}
        />
      </div>

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      {panel === 'template' && isAdmin ? (
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">Create tour template</h2>
          <p className="text-xs text-zinc-500">
            Templates are Shared Bookings tours only — existing website tours are never imported.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title">
              <input className={inputClass} value={tplTitle} onChange={(e) => setTplTitle(e.target.value)} />
            </Field>
            <Field label="Category">
              <select
                className={selectClass}
                value={tplCategory}
                onChange={(e) => setTplCategory(e.target.value as SharedBoard)}
              >
                <option value="shared_bus">Shared Bus</option>
                <option value="my_tours">My Tours</option>
              </select>
            </Field>
            <Field label="Meeting point">
              <input
                className={inputClass}
                value={tplMeeting}
                onChange={(e) => setTplMeeting(e.target.value)}
              />
            </Field>
            <Field label="Default capacity">
              <input
                type="number"
                min={1}
                className={inputClass}
                value={tplCapacity}
                onChange={(e) => setTplCapacity(e.target.value)}
              />
            </Field>
            <Field label="Default time">
              <input
                className={inputClass}
                placeholder="09:00"
                value={tplTime}
                onChange={(e) => setTplTime(e.target.value)}
              />
            </Field>
          </div>
          <div className="flex gap-2">
            <PrimaryButton type="button" disabled={saving || !tplTitle.trim()} onClick={() => void saveTemplate()}>
              Save template
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => setPanel('none')}>
              Cancel
            </SecondaryButton>
          </div>
        </Card>
      ) : null}

      {panel === 'departure' && isAdmin ? (
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">Add departure</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tour template">
              <select
                className={selectClass}
                value={depTemplateId}
                onChange={(e) => onTemplateChange(e.target.value)}
              >
                <option value="">Custom / no template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input className={inputClass} value={depTitle} onChange={(e) => setDepTitle(e.target.value)} />
            </Field>
            <Field label="Date">
              <input
                type="date"
                className={inputClass}
                value={depDate}
                onChange={(e) => setDepDate(e.target.value)}
              />
            </Field>
            <Field label="Time">
              <input
                className={inputClass}
                placeholder="09:00"
                value={depTime}
                onChange={(e) => setDepTime(e.target.value)}
              />
            </Field>
            <Field label="Capacity">
              <input
                type="number"
                min={1}
                className={inputClass}
                value={depCapacity}
                onChange={(e) => setDepCapacity(e.target.value)}
              />
            </Field>
            <Field label="Meeting point">
              <input
                className={inputClass}
                value={depMeeting}
                onChange={(e) => setDepMeeting(e.target.value)}
              />
            </Field>
          </div>
          {board === 'shared_bus' ||
          templates.find((t) => t.id === depTemplateId)?.category === 'shared_bus' ? (
            <Field label="Operator access (optional)">
              <div className="flex flex-wrap gap-2">
                {partnerSuppliers.length === 0 ? (
                  <p className="text-xs text-zinc-500">No partner operators yet.</p>
                ) : (
                  partnerSuppliers.map((s) => {
                    const on = depSupplierIds.includes(s.id)
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          setDepSupplierIds((prev) =>
                            on ? prev.filter((id) => id !== s.id) : [...prev, s.id],
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
                  })
                )}
              </div>
            </Field>
          ) : null}
          <div className="flex gap-2">
            <PrimaryButton
              type="button"
              disabled={saving || !depDate || (!depTitle.trim() && !depTemplateId)}
              onClick={() => void saveDeparture()}
            >
              Create departure
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => setPanel('none')}>
              Cancel
            </SecondaryButton>
          </div>
        </Card>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading calendar…</p>
      ) : view === 'month' ? (
        <div className="overflow-x-auto">
          <div className="min-w-[640px] rounded-xl border border-zinc-200 bg-white">
            <div className="grid grid-cols-7 border-b border-zinc-200">
              {WEEKDAY_HEADERS_MON_FIRST.map((d) => (
                <div
                  key={d}
                  className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-400"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthCells.map((cell, idx) => {
                if (!cell) {
                  return <div key={`pad-${idx}`} className="min-h-[96px] border-b border-r border-zinc-100 bg-zinc-50/50" />
                }
                const isToday = cell.date === todayTourDateISO()
                const isSelected = cell.date === anchor
                return (
                  <div
                    key={cell.date}
                    className={`min-h-[96px] border-b border-r border-zinc-100 p-1.5 text-left align-top ${
                      isSelected ? 'bg-emerald-50/60' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setQuery({ date: cell.date, view: 'day' })}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold hover:ring-2 hover:ring-emerald-200 ${
                        isToday ? 'bg-emerald-700 text-white' : 'text-zinc-700'
                      }`}
                    >
                      {cell.day}
                    </button>
                    <div className="mt-1 space-y-1">
                      {cell.departures.slice(0, 3).map((row) => (
                        <DepartureCard
                          key={row.id}
                          row={row}
                          href={paths.departure(row.id)}
                          compact
                        />
                      ))}
                      {cell.departures.length > 3 ? (
                        <button
                          type="button"
                          className="px-1 text-[10px] text-zinc-500"
                          onClick={() => setQuery({ date: cell.date, view: 'day' })}
                        >
                          +{cell.departures.length - 3} more
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {range.days.map((day) => {
            const deps = byDate.get(day) || []
            return (
              <section key={day} className="space-y-2">
                <button
                  type="button"
                  className="text-left"
                  onClick={() => setQuery({ date: day, view: 'day' })}
                >
                  <h2 className="text-sm font-semibold text-zinc-900">
                    {formatCalendarHeading('day', day)}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {deps.length} departure{deps.length === 1 ? '' : 's'}
                  </p>
                </button>
                {deps.length === 0 ? (
                  <Card>
                    <p className="text-sm text-zinc-500">No departures</p>
                  </Card>
                ) : (
                  <ul className="space-y-2">
                    {deps.map((row) => (
                      <li key={row.id}>
                        <DepartureCard
                          row={row}
                          href={paths.departure(row.id)}
                          addHref={`${paths.departure(row.id)}?add=1`}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}

      {!loading && rows.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-600">
            No Shared Bookings departures in this range. Create a tour template, then add a
            departure — website tours are never auto-imported.
          </p>
        </Card>
      ) : null}

      {isAdmin && templates.length > 0 ? (
        <details className="rounded-xl border border-zinc-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-medium text-zinc-800">
            Tour templates ({templates.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {templates.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-zinc-900">{t.title}</span>
                <span className="text-xs text-zinc-500">
                  {t.category === 'shared_bus' ? 'Shared Bus' : 'My Tours'} · capacity{' '}
                  {t.default_capacity}
                  {t.meeting_point ? ` · ${t.meeting_point}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  )
}
