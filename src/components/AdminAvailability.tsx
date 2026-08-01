import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Save } from 'lucide-react'
import { getTourAvailability, updateTourAvailability } from '../lib/api'
import type { TourDate } from '../lib/supabase'
import {
  WEEKDAY_HEADERS_MON_FIRST,
  buildMondayFirstMonthGrid,
  formatTourDateShort,
  todayTourDateISO,
  tourDateToLocalDate,
} from '../lib/tourDate'

interface AdminAvailabilityProps {
  tourId: number
  tourName: string
  maxCapacity: number
  /** When true, omit full-page chrome for embedding in AdminApp */
  embedded?: boolean
}

function inSeasonForTour(tourId: number, dateString: string): boolean {
  if (tourId === 1) {
    const date = tourDateToLocalDate(dateString)
    const m = date.getMonth() + 1
    const dayOfMonth = date.getDate()
    return (
      (m === 9 && dayOfMonth >= 15) ||
      (m >= 10 && m <= 12) ||
      (m >= 1 && m <= 3) ||
      (m === 4 && dayOfMonth <= 15)
    )
  }
  if (tourId === 2) {
    const date = tourDateToLocalDate(dateString)
    const m = date.getMonth() + 1
    const dayOfMonth = date.getDate()
    return (
      (m === 11 && dayOfMonth >= 1) ||
      m === 12 ||
      (m >= 1 && m <= 3) ||
      (m === 4 && dayOfMonth <= 1)
    )
  }
  return true
}

const AdminAvailability: React.FC<AdminAvailabilityProps> = ({
  tourId,
  tourName,
  maxCapacity,
  embedded = false,
}) => {
  const [availability, setAvailability] = useState<TourDate[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingSlots, setEditingSlots] = useState(0)
  const [isEditing, setIsEditing] = useState(false)

  const loadAvailability = useCallback(
    async (mode: 'initial' | 'refresh', month: Date) => {
      try {
        setError('')
        if (mode === 'initial') setInitialLoading(true)
        else setRefreshing(true)

        // Only load a tight window around the visible month (fast path)
        const y = month.getFullYear()
        const m = month.getMonth()
        const start = new Date(y, m - 1, 1)
        const end = new Date(y, m + 2, 0)
        const startISO = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`
        const endISO = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`

        const rows = await getTourAvailability(tourId, startISO, endISO)
        setAvailability((prev) => {
          const map = new Map(prev.map((d) => [d.date, d]))
          for (const row of rows as TourDate[]) map.set(row.date, row)
          return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
        })
      } catch (err) {
        console.error('Availability error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load availability')
      } finally {
        setInitialLoading(false)
        setRefreshing(false)
      }
    },
    [tourId],
  )

  const loadedTourRef = React.useRef<number | null>(null)
  useEffect(() => {
    const firstForTour = loadedTourRef.current !== tourId
    if (firstForTour) {
      loadedTourRef.current = tourId
      setSelectedDate(null)
      setIsEditing(false)
      setAvailability([])
      void loadAvailability('initial', currentMonth)
    } else {
      void loadAvailability('refresh', currentMonth)
    }
  }, [tourId, currentMonth, loadAvailability])

  const dateMap = useMemo(() => new Map(availability.map((d) => [d.date, d])), [availability])
  const todayString = todayTourDateISO()

  const calendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    return buildMondayFirstMonthGrid(year, month).map((cell) => {
      if (cell === null) return null
      const { day, date: dateString } = cell
      const dateData = dateMap.get(dateString)
      const remaining = dateData
        ? dateData.available_slots - (dateData.total_booked || 0)
        : 0
      const booked = dateData?.total_booked || 0
      const inSeason = inSeasonForTour(tourId, dateString)
      return {
        day,
        date: dateString,
        remaining,
        booked,
        capacity: dateData?.available_slots ?? null,
        hasData: !!dateData,
        isPastDate: dateString < todayString,
        inSeason,
        available: !!dateData && remaining > 0,
      }
    })
  }, [currentMonth, dateMap, tourId, todayString])

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  const monthStats = useMemo(() => {
    let open = 0
    let full = 0
    let empty = 0
    let guests = 0
    for (const cell of calendarGrid) {
      if (!cell || cell.isPastDate || !cell.inSeason) continue
      if (!cell.hasData) empty += 1
      else if (cell.remaining <= 0) full += 1
      else open += 1
      guests += cell.booked
    }
    return { open, full, empty, guests }
  }, [calendarGrid])

  const handleDateClick = (date: string, remaining: number, capacity: number | null) => {
    setSelectedDate(date)
    // Edit total capacity; show current capacity or remaining if no row yet
    setEditingSlots(capacity != null ? capacity : remaining || maxCapacity)
    setIsEditing(true)
  }

  const applyLocalUpdate = (date: string, availableSlots: number) => {
    setAvailability((prev) => {
      const idx = prev.findIndex((d) => d.date === date)
      if (idx >= 0) {
        const next = [...prev]
        const booked = next[idx].total_booked || 0
        next[idx] = {
          ...next[idx],
          available_slots: availableSlots,
          remaining_slots: availableSlots - booked,
        }
        return next
      }
      return [
        ...prev,
        {
          id: Date.now(),
          tour_id: tourId,
          date,
          available_slots: availableSlots,
          total_booked: 0,
          remaining_slots: availableSlots,
          created_at: new Date().toISOString(),
        },
      ]
    })
  }

  const persistSlots = async (date: string, availableSlots: number) => {
    setSaving(true)
    setError('')
    try {
      await updateTourAvailability(tourId, date, availableSlots)
      applyLocalUpdate(date, availableSlots)
      setIsEditing(false)
      setSelectedDate(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update availability')
    } finally {
      setSaving(false)
    }
  }

  const fillVisibleMonth = async () => {
    const targets = calendarGrid.filter(
      (c): c is NonNullable<typeof c> =>
        !!c && !c.isPastDate && c.inSeason && (!c.hasData || (c.capacity ?? 0) < maxCapacity),
    )
    if (targets.length === 0) return
    const ok = window.confirm(
      `Set capacity to ${maxCapacity} for ${targets.length} date(s) in ${monthLabel}? Existing bookings are kept.`,
    )
    if (!ok) return
    setSaving(true)
    setError('')
    try {
      for (const cell of targets) {
        await updateTourAvailability(tourId, cell.date, maxCapacity)
        applyLocalUpdate(cell.date, maxCapacity)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk update failed')
    } finally {
      setSaving(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="py-10 flex items-center justify-center gap-2 text-sm text-zinc-500">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Loading calendar…
      </div>
    )
  }

  return (
    <div className={embedded ? 'space-y-3' : 'min-h-screen bg-gray-50 p-4 space-y-3'}>
      {!embedded && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Availability</h1>
            <p className="text-sm text-zinc-600">{tourName}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600">
          <span>
            <strong className="text-zinc-900">{monthStats.open}</strong> open
          </span>
          <span>
            <strong className="text-zinc-900">{monthStats.full}</strong> full
          </span>
          <span>
            <strong className="text-zinc-900">{monthStats.empty}</strong> unset
          </span>
          <span>
            <strong className="text-zinc-900">{monthStats.guests}</strong> booked
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => void fillVisibleMonth()}
            disabled={saving}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
          >
            Fill month @ {maxCapacity}
          </button>
          <button
            type="button"
            onClick={() => void loadAvailability('refresh', currentMonth)}
            disabled={refreshing || saving}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Updating…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
            }
            className="rounded px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            ←
          </button>
          <span className="text-sm font-semibold text-zinc-900">{monthLabel}</span>
          <button
            type="button"
            onClick={() =>
              setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
            }
            className="rounded px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            →
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-0.5">
          {WEEKDAY_HEADERS_MON_FIRST.map((day) => (
            <div key={day} className="py-0.5 text-center text-[10px] font-medium uppercase text-zinc-400">
              {day}
            </div>
          ))}
        </div>

        <div className={`grid grid-cols-7 gap-0.5 ${refreshing ? 'opacity-70' : ''}`}>
          {calendarGrid.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-9 sm:h-10" />
            }

            const { day: calendarDay, date, available, remaining, booked, capacity, hasData, isPastDate, inSeason } =
              day

            return (
              <button
                key={date}
                type="button"
                onClick={() =>
                  !isPastDate && inSeason && handleDateClick(date, remaining, capacity)
                }
                disabled={isPastDate || !inSeason || saving}
                title={
                  hasData
                    ? `${date}: ${booked} booked / ${capacity} capacity (${remaining} left)`
                    : `${date}: no capacity set`
                }
                className={`h-9 sm:h-10 rounded border px-0.5 text-[11px] leading-tight transition-colors ${
                  selectedDate === date
                    ? 'border-emerald-700 bg-emerald-700 text-white'
                    : isPastDate
                      ? 'cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-300'
                      : !inSeason
                        ? 'cursor-not-allowed border-zinc-100 bg-zinc-100 text-zinc-400'
                        : available
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-950 hover:bg-emerald-100'
                          : hasData
                            ? 'border-red-200 bg-red-50 text-red-900 hover:bg-red-100'
                            : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                <div className="font-semibold">{calendarDay}</div>
                <div className="truncate text-[10px] opacity-90">
                  {isPastDate
                    ? '—'
                    : !inSeason
                      ? 'off'
                      : hasData
                        ? `${remaining}/${capacity}`
                        : '·'}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded border border-emerald-200 bg-emerald-50" /> Open
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded border border-red-200 bg-red-50" /> Full
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded border border-zinc-200 bg-white" /> Unset
          </span>
          <span>Cell shows remaining/capacity</span>
        </div>
      </div>

      {isEditing && selectedDate && (
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              {formatTourDateShort(selectedDate)}
            </h3>
            <p className="text-xs text-zinc-500">
              Set total capacity for the day (bookings already made are kept).
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[0, Math.min(4, maxCapacity), Math.min(8, maxCapacity), maxCapacity]
              .filter((v, i, arr) => arr.indexOf(v) === i)
              .map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setEditingSlots(n)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium border ${
                    editingSlots === n
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50'
                  }`}
                >
                  {n === 0 ? 'Close' : `${n} slots`}
                </button>
              ))}
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-zinc-500">Capacity</span>
            <input
              type="number"
              min={0}
              max={Math.max(maxCapacity, 100)}
              value={editingSlots}
              onChange={(e) => setEditingSlots(parseInt(e.target.value, 10) || 0)}
              className="w-full max-w-[12rem] rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void persistSlots(selectedDate, editingSlots)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => void persistSlots(selectedDate, 0)}
              disabled={saving}
              className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-800 disabled:opacity-50"
            >
              Close day
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false)
                setSelectedDate(null)
              }}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminAvailability
