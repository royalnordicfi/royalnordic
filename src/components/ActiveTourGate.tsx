import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { isTourPubliclyActive, TOUR_PUBLIC_PAGES } from '../lib/productVisibility'

type Props = {
  tourId: number
  children: React.ReactNode
}

/**
 * Hides a tour marketing/booking page when the product is deactivated in admin.
 * Fail-open: render immediately; only redirect once we confirm inactive.
 */
export default function ActiveTourGate({ tourId, children }: Props) {
  const [inactive, setInactive] = useState(false)
  const fallback = TOUR_PUBLIC_PAGES[tourId]?.fallbackPath || '/'

  useEffect(() => {
    let cancelled = false
    isTourPubliclyActive(tourId)
      .then((active) => {
        if (!cancelled && !active) setInactive(true)
      })
      .catch(() => {
        // Fail open — never blank a money page on network error
      })
    return () => {
      cancelled = true
    }
  }, [tourId])

  if (inactive) {
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
