import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { isTourPubliclyActive, TOUR_PUBLIC_PAGES } from '../lib/productVisibility'
import { supabase } from '../lib/supabase'

type Props = {
  tourId: number
  /** Redirect when the product row does not exist yet. Network errors still fail open. */
  missingIsInactive?: boolean
  children: React.ReactNode
}

/**
 * Hides a tour marketing/booking page when the product is deactivated in admin.
 * Fail-open: render immediately; only redirect once we confirm inactive.
 */
export default function ActiveTourGate({ tourId, missingIsInactive = false, children }: Props) {
  const [inactive, setInactive] = useState(false)
  const fallback = TOUR_PUBLIC_PAGES[tourId]?.fallbackPath || '/'

  useEffect(() => {
    let cancelled = false
    const check: Promise<boolean> = missingIsInactive
      ? Promise.resolve(
          supabase
            .from('tours')
            .select('is_active')
            .eq('id', tourId)
            .maybeSingle()
            .then(({ data, error }) => {
              if (error) return true
              if (!data) return false
              return data.is_active !== false
            }),
        )
      : isTourPubliclyActive(tourId)
    check
      .then((active) => {
        if (!cancelled && !active) setInactive(true)
      })
      .catch(() => {
        // Fail open — never blank a money page on network error
      })
    return () => {
      cancelled = true
    }
  }, [tourId, missingIsInactive])

  if (inactive) {
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
