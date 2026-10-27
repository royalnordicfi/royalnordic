import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { TourDate } from '../lib/supabase'
import { isDateInTourSeason } from '../lib/tourBookingRules'
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
}

export function useTourAvailability({
  tourId,
  adultPrice,
  childPrice,
  maxCapacity,
  seasonStart,
  seasonEnd,
}: Options) {
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

      setAvailability(transformed)
    } catch (err) {
      console.error('Availability error:', err)
      setError('We could not load available dates right now. Please refresh and try again.')
      setAvailability([])
    } finally {
      setLoading(false)
    }
  }, [tourId])

  useEffect(() => {
    void loadAvailability()
  }, [loadAvailability])

  const getAvailableSlots = useCallback(
    (date: string) => {
      const dateData = availability.find((d) => d.date === date)
      const remaining = dateData?.remaining_slots || 0
      if (maxCapacity && maxCapacity > 0) return Math.min(remaining, maxCapacity)
      return remaining
    },
    [availability, maxCapacity],
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
      const filteredDates =
        seasonStart && seasonEnd
          ? monthDates.filter((date) => isDateInTourSeason(date.date, seasonStart, seasonEnd))
          : monthDates

      const dateMap = new Map<string, TourDate>()
      filteredDates.forEach((date) => dateMap.set(date.date, date))

      const todayString = todayTourDateISO()
      const base = buildMondayFirstMonthGrid(year, month)

      return base.map((cell) => {
        if (cell === null) return null
        const { day, date: dateString } = cell
        const dateData = dateMap.get(dateString)
        const isPastDate = dateString < todayString
        const inSeason =
          seasonStart && seasonEnd ? isDateInTourSeason(dateString, seasonStart, seasonEnd) : true
        const remaining = dateData?.remaining_slots ?? 0
        const isFullBooked = Boolean(dateData && remaining === 0)
        const isAvailable = !isPastDate && inSeason && Boolean(dateData) && remaining >= partySize

        return {
          day,
          date: dateString,
          available: isAvailable,
          remainingSlots: remaining,
          isPastDate,
          isOutOfSeason: seasonStart && seasonEnd ? !inSeason : false,
          isFullBooked,
        }
      })
    },
    [availability, seasonStart, seasonEnd],
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
