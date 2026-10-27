import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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

type PanelPlacement = {
  mode: 'popover' | 'sheet'
  top: number
  left: number
  width: number
  maxHeight: number
  placement: 'below' | 'above'
}

const MOBILE_SHEET_MQ = '(max-width: 639px)'
const GAP = 8
const VIEWPORT_PAD = 12
/** Prefer a bottom sheet when neither side can fit a usable calendar. */
const MIN_COMFORTABLE_POPOVER = 300

function prefersSheet(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(MOBILE_SHEET_MQ).matches
}

function sheetPlacement(panelHeight: number): PanelPlacement {
  return {
    mode: 'sheet',
    top: 0,
    left: 0,
    width: window.innerWidth,
    maxHeight: Math.min(window.innerHeight * 0.82, Math.max(panelHeight || 360, 320)),
    placement: 'below',
  }
}

function computePlacement(trigger: DOMRect, panelHeight: number): PanelPlacement {
  if (prefersSheet()) return sheetPlacement(panelHeight)

  const chrome = getComputedStyle(document.documentElement)
    .getPropertyValue('--rn-chrome-h')
    .trim()
  const chromePx = Number.parseFloat(chrome) || 56
  const topBound = chromePx + VIEWPORT_PAD
  const bottomBound = window.innerHeight - VIEWPORT_PAD
  const spaceBelow = bottomBound - trigger.bottom - GAP
  const spaceAbove = trigger.top - topBound - GAP
  const estimated = panelHeight || 360

  if (Math.max(spaceBelow, spaceAbove) < MIN_COMFORTABLE_POPOVER) {
    return sheetPlacement(estimated)
  }

  const placeBelow = spaceBelow >= estimated || spaceBelow >= spaceAbove
  const width = Math.min(Math.max(trigger.width, 280), window.innerWidth - VIEWPORT_PAD * 2)
  let left = trigger.left
  if (left + width > window.innerWidth - VIEWPORT_PAD) {
    left = Math.max(VIEWPORT_PAD, window.innerWidth - VIEWPORT_PAD - width)
  }
  if (left < VIEWPORT_PAD) left = VIEWPORT_PAD

  if (placeBelow) {
    return {
      mode: 'popover',
      top: trigger.bottom + GAP,
      left,
      width,
      // Cap to free space under the trigger — content can scroll if needed.
      maxHeight: spaceBelow,
      placement: 'below',
    }
  }

  const maxHeight = spaceAbove
  const rendered = Math.min(estimated, maxHeight)
  const top = Math.max(topBound, trigger.top - GAP - rendered)
  return {
    mode: 'popover',
    top,
    left,
    width,
    maxHeight,
    placement: 'above',
  }
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
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<PanelPlacement | null>(null)
  const [currentMonth, setCurrentMonth] = useState(() =>
    initialCalendarMonth(seasonStart, seasonEnd),
  )

  const updatePlacement = () => {
    const trigger = triggerRef.current?.getBoundingClientRect()
    if (!trigger) return
    const measured = panelRef.current?.offsetHeight || 0
    setPlacement(computePlacement(trigger, measured))
  }
  const updatePlacementRef = useRef(updatePlacement)
  updatePlacementRef.current = updatePlacement

  useLayoutEffect(() => {
    if (!open) {
      setPlacement(null)
      return
    }
    updatePlacementRef.current()
    // Second pass after paint so measured panel height informs flip/maxHeight.
    const raf = window.requestAnimationFrame(() => updatePlacementRef.current())
    return () => window.cancelAnimationFrame(raf)
  }, [open, currentMonth, loading, hasOpenDates, error])

  useEffect(() => {
    if (!open) return
    const onReposition = () => updatePlacementRef.current()
    window.addEventListener('resize', onReposition)
    // Capture scroll from any scrollable ancestor (sticky column, window, etc.)
    document.addEventListener('scroll', onReposition, true)
    window.visualViewport?.addEventListener('resize', onReposition)
    window.visualViewport?.addEventListener('scroll', onReposition)
    const mq = window.matchMedia(MOBILE_SHEET_MQ)
    mq.addEventListener?.('change', onReposition)
    return () => {
      window.removeEventListener('resize', onReposition)
      document.removeEventListener('scroll', onReposition, true)
      window.visualViewport?.removeEventListener('resize', onReposition)
      window.visualViewport?.removeEventListener('scroll', onReposition)
      mq.removeEventListener?.('change', onReposition)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
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

  useEffect(() => {
    if (!open || placement?.mode !== 'sheet') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, placement?.mode])

  const monthLabel = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const triggerLabel = selectedDate
    ? formatTourDateLong(selectedDate)
    : loading
      ? 'Loading dates…'
      : 'Select a date'

  const calendarBody = (
    <>
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
    </>
  )

  const portal =
    open && typeof document !== 'undefined'
      ? createPortal(
          <>
            {placement?.mode === 'sheet' ? (
              <button
                type="button"
                className="rn-date-field__backdrop"
                aria-label="Close calendar"
                onClick={() => setOpen(false)}
              />
            ) : null}
            <div
              id={panelId}
              ref={panelRef}
              role="dialog"
              aria-label="Choose a date"
              className={`rn-date-field__panel${
                placement?.mode === 'sheet'
                  ? ' rn-date-field__panel--sheet'
                  : ' rn-date-field__panel--popover'
              }${placement?.placement === 'above' ? ' rn-date-field__panel--above' : ''}`}
              style={
                placement?.mode === 'popover'
                  ? {
                      top: placement.top,
                      left: placement.left,
                      width: placement.width,
                      maxHeight: placement.maxHeight,
                    }
                  : placement?.mode === 'sheet'
                    ? { maxHeight: placement.maxHeight }
                    : { visibility: 'hidden' as const }
              }
            >
              {placement?.mode === 'sheet' ? (
                <div className="rn-date-field__sheet-head">
                  <p className="rn-date-field__sheet-title">Select a date</p>
                  <button
                    type="button"
                    className="rn-date-field__sheet-close"
                    aria-label="Close"
                    onClick={() => setOpen(false)}
                  >
                    ✕
                  </button>
                </div>
              ) : null}
              {calendarBody}
            </div>
          </>,
          document.body,
        )
      : null

  return (
    <div className="rn-date-field" ref={rootRef}>
      <label className="rn-book-widget__label" htmlFor={`${panelId}-trigger`}>
        Date
      </label>
      <button
        id={`${panelId}-trigger`}
        ref={triggerRef}
        type="button"
        className={`rn-date-field__trigger${selectedDate ? ' rn-date-field__trigger--selected' : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
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
      {portal}
    </div>
  )
}
