import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { captureReferralFromSearch } from './attribution'

/** Captures ?ref= on any route into first-party storage for checkout. */
export default function ReferralCapture() {
  const location = useLocation()

  useEffect(() => {
    captureReferralFromSearch(location.search)
  }, [location.search])

  return null
}
