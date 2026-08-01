import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { isTourPubliclyActive, TOUR_PUBLIC_PAGES } from '../lib/productVisibility'

type Props = {
  tourId: number
  children: React.ReactNode
}

/**
 * Hides a tour marketing/booking page when the product is deactivated in admin.
 */
export default function ActiveTourGate({ tourId, children }: Props) {
  const [state, setState] = useState<'loading' | 'active' | 'inactive'>('loading')
  const fallback = TOUR_PUBLIC_PAGES[tourId]?.fallbackPath || '/'

  useEffect(() => {
    let cancelled = false
    setState('loading')
    isTourPubliclyActive(tourId)
      .then((active) => {
        if (!cancelled) setState(active ? 'active' : 'inactive')
      })
      .catch(() => {
        if (!cancelled) setState('inactive')
      })
    return () => {
      cancelled = true
    }
  }, [tourId])

  if (state === 'loading') {
    return (
      <div className="min-h-[40vh] flex items-center justify-center bg-black text-gray-300 text-sm">
        Loading…
      </div>
    )
  }

  if (state === 'inactive') {
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
