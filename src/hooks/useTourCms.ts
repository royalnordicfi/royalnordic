import { useEffect, useState } from 'react'
import {
  fetchTourCms,
  type TourCms,
} from '../lib/tourCms'

/** Load commercial tour CMS for a public page. Falls back silently when offline. */
export function useTourCms(tourId: number) {
  const [tour, setTour] = useState<TourCms | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchTourCms(tourId)
      .then((row) => {
        if (!cancelled) setTour(row)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unable to load tour')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tourId])

  return { tour, loading, error }
}
