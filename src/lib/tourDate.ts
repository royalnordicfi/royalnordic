/**
 * Canonical tour-date helpers for Royal Nordic.
 *
 * Tour dates are date-only ISO strings: YYYY-MM-DD (calendar day in Europe/Helsinki business sense).
 * Never parse those with `new Date('YYYY-MM-DD')` — that is UTC midnight and shifts the
 * local weekday west of UTC (and mis-aligns Monday-first calendars when mixed with getDay()).
 */

export const TOUR_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export type TourDateISO = string

/** Parse YYYY-MM-DD into year/month/day integers. Throws if invalid. */
export function parseTourDateParts(iso: TourDateISO): { year: number; month: number; day: number } {
  if (!TOUR_DATE_RE.test(iso)) {
    throw new Error(`Invalid tour date ISO: ${iso}`)
  }
  const [year, month, day] = iso.split('-').map(Number)
  // Validate real calendar day (rejects 2027-02-30 etc.)
  const probe = new Date(year, month - 1, day)
  if (
    probe.getFullYear() !== year ||
    probe.getMonth() !== month - 1 ||
    probe.getDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${iso}`)
  }
  return { year, month, day }
}

/**
 * Local Date at noon for the given tour day (browser-local calendar components).
 * Noon avoids DST edge cases when formatting weekdays.
 */
export function tourDateToLocalDate(iso: TourDateISO): Date {
  const { year, month, day } = parseTourDateParts(iso)
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

/** Format Date / parts as YYYY-MM-DD using local calendar components (not UTC). */
export function toTourDateISO(year: number, monthIndex0: number, day: number): TourDateISO {
  const y = String(year).padStart(4, '0')
  const m = String(monthIndex0 + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Today as YYYY-MM-DD in Europe/Helsinki (business timezone). */
export function todayTourDateISO(now: Date = new Date()): TourDateISO {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** JS weekday 0=Sun … 6=Sat for a tour ISO date (calendar day, not UTC). */
export function tourWeekdayIndex(iso: TourDateISO): number {
  return tourDateToLocalDate(iso).getDay()
}

/**
 * Empty cells before day 1 for a Monday-first calendar grid.
 * Headers must be Mon…Sun. Do NOT use raw getDay()/getUTCDay() as padding.
 */
export function mondayFirstPadding(year: number, monthIndex0: number): number {
  const weekday = new Date(year, monthIndex0, 1, 12, 0, 0, 0).getDay() // 0=Sun
  return (weekday + 6) % 7
}

export function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate()
}

export type MonthGridCell =
  | null
  | {
      day: number
      date: TourDateISO
    }

/** Build Mon-first month grid: null padding + { day, date } cells. */
export function buildMondayFirstMonthGrid(year: number, monthIndex0: number): MonthGridCell[] {
  const grid: MonthGridCell[] = []
  const pad = mondayFirstPadding(year, monthIndex0)
  const n = daysInMonth(year, monthIndex0)
  for (let i = 0; i < pad; i++) grid.push(null)
  for (let day = 1; day <= n; day++) {
    grid.push({ day, date: toTourDateISO(year, monthIndex0, day) })
  }
  return grid
}

/** Long English label: "Thursday, January 14, 2027" */
export function formatTourDateLong(iso: TourDateISO, locale = 'en-US'): string {
  return tourDateToLocalDate(iso).toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Weekday only: "Thursday" */
export function formatTourWeekday(iso: TourDateISO, locale = 'en-US'): string {
  return tourDateToLocalDate(iso).toLocaleDateString(locale, { weekday: 'long' })
}

/** Short locale date without UTC shift */
export function formatTourDateShort(iso: TourDateISO, locale = 'en-US'): string {
  return tourDateToLocalDate(iso).toLocaleDateString(locale)
}

export const WEEKDAY_HEADERS_MON_FIRST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

/** Column index 0=Mon … 6=Sun for a tour date in a Mon-first grid */
export function mondayFirstColumn(iso: TourDateISO): number {
  return (tourWeekdayIndex(iso) + 6) % 7
}

/**
 * Prefer ISO if present; otherwise accept already-formatted display strings unchanged.
 */
export function formatTourDateForDisplay(
  value: string,
  locale = 'en-US',
  style: 'long' | 'short' = 'long',
): string {
  if (TOUR_DATE_RE.test(value)) {
    return style === 'long' ? formatTourDateLong(value, locale) : formatTourDateShort(value, locale)
  }
  return value
}

/** Add (or subtract) whole calendar days to a tour ISO date. */
export function addTourDays(iso: TourDateISO, n: number): TourDateISO {
  const d = tourDateToLocalDate(iso)
  d.setDate(d.getDate() + n)
  return toTourDateISO(d.getFullYear(), d.getMonth(), d.getDate())
}
