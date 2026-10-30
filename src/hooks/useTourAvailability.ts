import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { TourDate } from '../lib/supabase'
import { isDateInAbsoluteTourWindow, isDateInTourSeason } from '../lib/tourBookingRules'
import { buildMondayFirstMonthGrid, todayTourDateISO } from '../lib/tourDate'

export type CalendarDayCell = {
  day: number
  date: string
  available: boolean
  remainingSlots: number
  isPastDate: boolean
  isOutOfSeason: boolean
  isFullBooked: boolean
}

type Options = {
  tourId: number
  adultPrice: number
  childPrice: number
  maxCapacity?: number
  seasonStart?: string
  seasonEnd?: string
  /** Inclusive absolute YYYY-MM-DD window (one-season products). */
  absoluteFrom?: string
  absoluteTo?: string
  /** Flat exclusive allocation (private tour / transfer) — inventory is not per guest. */
  pricingModel?: 'per_person' | 'per_vehicle'
}

export function useTourAvailability({
  tourId,
  adultPrice,
  childPrice,
  maxCapacity,
  seasonStart,
  seasonEnd,
  absoluteFrom,
  absoluteTo,
  pricingModel = 'per_person',
}: Options) {
  const exclusiveSlot = pricingModel === 'per_vehicle'
  const [availability, setAvailability] = useState<TourDate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [liveAdultPrice, setLiveAdultPrice] = useState(adultPrice)
  const [liveChildPrice, setLiveChildPrice] = useState(childPrice)

  useEffect(() => {
    setLiveAdultPrice(adultPrice)
    setLiveChildPrice(childPrice)
  }, [adultPrice, childPrice])

  const loadAvailability = useCallback(async () => {
    if (!tourId || tourId <= 0) {
      setAvailability([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError('')
      const cacheBuster = Date.now() + Math.random()
      const { data, error: invokeError } = await supabase.functions.invoke(
        `get-tour-availability?t=${cacheBuster}`,
        {
          body: {
            tourId,
            _cacheBust: cacheBuster,
            _timestamp: new Date().toISOString(),
          },
        },
      )

      if (invokeError) throw new Error(invokeError.message)
      if (!data || !Array.isArray(data.availableDates)) {
        throw new Error('Availability response was incomplete')
      }

      if (typeof data.adultPrice === 'number' && Number.isFinite(data.adultPrice)) {
        setLiveAdultPrice(data.adultPrice)
      }
      if (typeof data.childPrice === 'number' && Number.isFinite(data.childPrice)) {
        setLiveChildPrice(data.childPrice)
      }

      const transformed: TourDate[] = data.availableDates
        .map((date: { id: number; date: string; totalSlots: number; bookedSlots: number; availableSpots: number }) => ({
          id: date.id,
          tour_id: tourId,
          date: date.date,
          available_slots: date.totalSlots,
          total_booked: date.bookedSlots,
          remaining_slots: date.availableSpots,
        }))
        .filter((date: TourDate) => date.id && date.date)
        .filter((date: TourDate) =>
          isDateInAbsoluteTourWindow(date.date, absoluteFrom, absoluteTo),
        )

      setAvailability(transformed)
    } catch (err) {
      console.error('Availability error:', err)
      setError('We could not load available dates right now. Please refresh and try again.')
      setAvailability([])
    } finally {
      setLoading(false)
    }
  }, [tourId, absoluteFrom, absoluteTo])

  useEffect(() => {
    void loadAvailability()
  }, [loadAvailability])

  const getAvailableSlots = useCallback(
    (date: string) => {
      const dateData = availability.find((d) => d.date === date)
      const remaining = dateData?.remaining_slots || 0
      // Per-vehicle / private group: one open allocation unlocks up to maxCapacity guests.
      if (exclusiveSlot) {
        if (remaining < 1) return 0
        return Math.max(1, maxCapacity || 1)
      }
      if (maxCapacity && maxCapacity > 0) return Math.min(remaining, maxCapacity)
      return remaining
    },
    [availability, maxCapacity, exclusiveSlot],
  )

  const findDateRow = useCallback(
    (dateIso: string) => availability.find((d) => d.date === dateIso) || null,
    [availability],
  )

  const hasOpenDates = availability.some((d) => (d.remaining_slots || 0) > 0)

  const getCalendarGrid = useCallback(
    (currentMonth: Date, partySize = 1): Array<CalendarDayCell | null> => {
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()
      const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`
      const monthDates = availability.filter((date) => date.date.startsWith(monthPrefix))
      const filteredDates = monthDates.filter((date) => {
        if (absoluteFrom || absoluteTo) {
          return isDateInAbsoluteTourWindow(date.date, absoluteFrom, absoluteTo)
        }
        if (seasonStart && seasonEnd) {
          return isDateInTourSeason(date.date, seasonStart, seasonEnd)
        }
        return true
      })

      const dateMap = new Map<string, TourDate>()
      filteredDates.forEach((date) => dateMap.set(date.date, date))

      const todayString = todayTourDateISO()
      const base = buildMondayFirstMonthGrid(year, month)

      return base.map((cell) => {
        if (cell === null) return null
        const { day, date: dateString } = cell
        const dateData = dateMap.get(dateString)
        const isPastDate = dateString < todayString
        const inAbsolute =
          absoluteFrom || absoluteTo
            ? isDateInAbsoluteTourWindow(dateString, absoluteFrom, absoluteTo)
            : true
        const inRecurringSeason =
          seasonStart && seasonEnd ? isDateInTourSeason(dateString, seasonStart, seasonEnd) : true
        const inSeason = inAbsolute && inRecurringSeason
        const remaining = dateData?.remaining_slots ?? 0
        const isFullBooked = Boolean(dateData && remaining === 0)
        const inventoryOk = exclusiveSlot ? remaining >= 1 : remaining >= partySize
        const isAvailable = !isPastDate && inSeason && Boolean(dateData) && inventoryOk

        return {
          day,
          date: dateString,
          available: isAvailable,
          remainingSlots: remaining,
          isPastDate,
          isOutOfSeason: !inSeason,
          isFullBooked,
        }
      })
    },
    [availability, seasonStart, seasonEnd, absoluteFrom, absoluteTo, exclusiveSlot],
  )

  return {
    availability,
    loading,
    error,
    liveAdultPrice,
    liveChildPrice,
    hasOpenDates,
    getAvailableSlots,
    findDateRow,
    getCalendarGrid,
    reload: loadAvailability,
  }
}
