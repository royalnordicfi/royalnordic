import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const RETURN_KEY = 'checkoutReturnPath'

/** Stripe cancel_url fallback — send guests back to the tour they left. */
export default function PaymentCancelled() {
  const navigate = useNavigate()

  useEffect(() => {
    const stored = sessionStorage.getItem(RETURN_KEY)
    sessionStorage.removeItem(RETURN_KEY)
    const target =
      stored && stored.startsWith('/') && !stored.startsWith('//') ? stored : '/'
    navigate(target, { replace: true })
  }, [navigate])

  return (
    <div className="rn-page flex min-h-[40vh] items-center justify-center px-4">
      <p className="text-sm text-text-muted">Returning to your tour…</p>
    </div>
  )
}

export { RETURN_KEY as CHECKOUT_RETURN_PATH_KEY }
