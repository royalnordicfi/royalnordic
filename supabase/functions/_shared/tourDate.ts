/**
 * Deno-safe copy of src/lib/tourDate.ts (keep in sync).
 * Date-only ISO YYYY-MM-DD — never parse with `new Date('YYYY-MM-DD')`.
 */

export type TourDateISO = string

export function parseTourDateParts(iso: TourDateISO): { year: number; month: number; day: number } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    throw new Error(`Invalid tour date ISO: ${iso}`)
  }
  const [year, month, day] = iso.split('-').map(Number)
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

export function tourDateToLocalDate(iso: TourDateISO): Date {
  const { year, month, day } = parseTourDateParts(iso)
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

export function todayTourDateISO(now: Date = new Date()): TourDateISO {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function formatTourDateLong(iso: TourDateISO, locale = 'en-US'): string {
  return tourDateToLocalDate(iso).toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTourDateShort(iso: TourDateISO, locale = 'en-US'): string {
  return tourDateToLocalDate(iso).toLocaleDateString(locale)
}

/** Prefer ISO if present; otherwise accept already-formatted display strings unchanged. */
export function formatTourDateForDisplay(
  value: string,
  locale = 'en-US',
  style: 'long' | 'short' = 'long',
): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return style === 'long' ? formatTourDateLong(value, locale) : formatTourDateShort(value, locale)
  }
  return value
}
