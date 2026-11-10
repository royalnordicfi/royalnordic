/** Pure Shared Bookings calendar range helpers (no network). */

import {
  addTourDays,
  buildMondayFirstMonthGrid,
  mondayFirstColumn,
  parseTourDateParts,
  toTourDateISO,
  type TourDateISO,
} from '../lib/tourDate'
import type { SharedCalendarView, SharedDepartureSummary } from './sharedBookings'

export function startOfWeekMonday(iso: TourDateISO): TourDateISO {
  return addTourDays(iso, -mondayFirstColumn(iso))
}

export function addTourMonths(iso: TourDateISO, delta: number): TourDateISO {
  const { year, month, day } = parseTourDateParts(iso)
  const probe = new Date(year, month - 1 + delta, 1, 12, 0, 0, 0)
  const lastDay = new Date(probe.getFullYear(), probe.getMonth() + 1, 0).getDate()
  return toTourDateISO(probe.getFullYear(), probe.getMonth(), Math.min(day, lastDay))
}

export function calendarRange(
  view: SharedCalendarView,
  anchor: TourDateISO,
): { from: TourDateISO; to: TourDateISO; days: TourDateISO[] } {
  if (view === 'day') {
    return { from: anchor, to: anchor, days: [anchor] }
  }
  if (view === 'week') {
    const start = startOfWeekMonday(anchor)
    const days = Array.from({ length: 7 }, (_, i) => addTourDays(start, i))
    return { from: days[0], to: days[6], days }
  }
  const { year, month } = parseTourDateParts(anchor)
  const grid = buildMondayFirstMonthGrid(year, month - 1)
  const days = grid.filter((c): c is NonNullable<typeof c> => Boolean(c)).map((c) => c.date)
  return { from: days[0], to: days[days.length - 1], days }
}

export function shiftCalendarAnchor(
  view: SharedCalendarView,
  anchor: TourDateISO,
  direction: -1 | 1,
): TourDateISO {
  if (view === 'day') return addTourDays(anchor, direction)
  if (view === 'week') return addTourDays(anchor, direction * 7)
  return addTourMonths(anchor, direction)
}

export function groupDeparturesByDate(
  rows: SharedDepartureSummary[],
): Map<string, SharedDepartureSummary[]> {
  const map = new Map<string, SharedDepartureSummary[]>()
  for (const row of rows) {
    const key = row.departure_date || 'unknown'
    const list = map.get(key) || []
    list.push(row)
    map.set(key, list)
  }
  for (const list of map.values()) {
    list.sort((a, b) => {
      const t = (a.departure_time || '').localeCompare(b.departure_time || '')
      if (t !== 0) return t
      return a.tour_title.localeCompare(b.tour_title)
    })
  }
  return map
}

export function monthGridWithDepartures(
  anchor: TourDateISO,
  byDate: Map<string, SharedDepartureSummary[]>,
): Array<null | { day: number; date: string; departures: SharedDepartureSummary[] }> {
  const { year, month } = parseTourDateParts(anchor)
  return buildMondayFirstMonthGrid(year, month - 1).map((cell) => {
    if (!cell) return null
    return {
      ...cell,
      departures: byDate.get(cell.date) || [],
    }
  })
}

export function formatCalendarHeading(view: SharedCalendarView, anchor: TourDateISO): string {
  const d = parseTourDateParts(anchor)
  if (view === 'month') {
    return new Date(d.year, d.month - 1, 1, 12).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    })
  }
  if (view === 'week') {
    const { from, to } = calendarRange('week', anchor)
    return `${from} → ${to}`
  }
  return new Date(d.year, d.month - 1, d.day, 12).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
