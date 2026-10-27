import { useEffect, useId, useRef, useState } from 'react'
import { formatEuroAmount } from '../../lib/tourPricing'
import { formatTourDateLong, WEEKDAY_HEADERS_MON_FIRST } from '../../lib/tourDate'
import { initialCalendarMonth } from '../../lib/bookingDraft'
import type { CalendarDayCell } from '../../hooks/useTourAvailability'

type Props = {
  selectedDate: string
  onSelect: (dateIso: string) => void
  loading: boolean
  hasOpenDates: boolean
  error?: string
  seasonStart?: string
  seasonEnd?: string
  departureTime?: string
  meetingPointDeparture?: boolean
  adultPrice: number
  partySize: number
  getCalendarGrid: (month: Date, partySize: number) => Array<CalendarDayCell | null>
}

export default function DatePickerField({
  selectedDate,
  onSelect,
  loading,
  hasOpenDates,
  error,
  seasonStart,
  seasonEnd,
  departureTime,
  meetingPointDeparture,
  adultPrice,
  partySize,
  getCalendarGrid,
}: Props) {
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() =>
    initialCalendarMonth(seasonStart, seasonEnd),
  )

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const monthLabel = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const triggerLabel = selectedDate
    ? formatTourDateLong(selectedDate)
    : loading
      ? 'Loading dates…'
      : 'Select a date'

  return (
    <div className="rn-date-field" ref={rootRef}>
      <label className="rn-book-widget__label" htmlFor={`${panelId}-trigger`}>
        Date
      </label>
      <button
        id={`${panelId}-trigger`}
        type="button"
        className={`rn-date-field__trigger${selectedDate ? ' rn-date-field__trigger--selected' : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="rn-date-field__trigger-main">{triggerLabel}</span>
        {selectedDate && departureTime ? (
          <span className="rn-date-field__trigger-meta">
            {departureTime}
            {meetingPointDeparture ? ' · meeting point' : ''}
          </span>
        ) : null}
        <span className="rn-date-field__chevron" aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>

      {open ? (
        <div id={panelId} className="rn-date-field__panel" role="dialog" aria-label="Choose a date">
          <div className="rn-date-field__month-nav">
            <button
              type="button"
              className="rn-date-field__nav-btn"
              aria-label="Previous month"
              onClick={() =>
                setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
              }
            >
              ‹
            </button>
            <span className="rn-date-field__month">{monthLabel}</span>
            <button
              type="button"
              className="rn-date-field__nav-btn"
              aria-label="Next month"
              onClick={() =>
                setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
              }
            >
              ›
            </button>
          </div>

          <div className="rn-date-field__weekdays">
            {WEEKDAY_HEADERS_MON_FIRST.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="rn-date-field__grid">
            {loading
              ? Array.from({ length: 35 }, (_, i) => (
                  <div key={i} className="rn-date-field__skeleton" />
                ))
              : getCalendarGrid(currentMonth, partySize).map((cell, index) => {
                  if (!cell) return <div key={`e-${index}`} className="rn-date-field__empty" />
                  const selected = selectedDate === cell.date
                  return (
                    <button
                      key={cell.date}
                      type="button"
                      disabled={!cell.available}
                      className={`rn-date-field__day${
                        selected
                          ? ' rn-date-field__day--selected'
                          : cell.available
                            ? ' rn-date-field__day--available'
                            : ' rn-date-field__day--muted'
                      }`}
                      aria-label={
                        cell.available
                          ? `${cell.day}, €${formatEuroAmount(adultPrice)}`
                          : `${cell.day}, unavailable`
                      }
                      onClick={() => {
                        if (!cell.available) return
                        onSelect(cell.date)
                        setOpen(false)
                      }}
                    >
                      <span className="rn-date-field__day-num">{cell.day}</span>
                      {cell.available ? (
                        <span className="rn-date-field__day-price">
                          €{formatEuroAmount(adultPrice)}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
          </div>

          {error ? <p className="rn-date-field__status rn-date-field__status--error">{error}</p> : null}
          {!loading && !hasOpenDates && !error ? (
            <p className="rn-date-field__status" role="status">
              No available dates right now. Please check another month, or contact us.
            </p>
          ) : null}
          {seasonStart && seasonEnd ? (
            <p className="rn-date-field__hint">Grey dates are outside the season or unavailable.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
