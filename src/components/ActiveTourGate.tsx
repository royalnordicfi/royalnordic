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

    const timeout = window.setTimeout(() => {
      if (!cancelled) setState('active')
    }, 2500)

    isTourPubliclyActive(tourId)
      .then((active) => {
        if (!cancelled) setState(active ? 'active' : 'inactive')
      })
      .catch(() => {
        // Fail open so a flaky network never blanks a money page
        if (!cancelled) setState('active')
      })
      .finally(() => {
        window.clearTimeout(timeout)
      })

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [tourId])

  if (state === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-snow text-sm text-ink-muted">
        Loading…
      </div>
    )
  }

  if (state === 'inactive') {
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
