import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { sharedBookingsPortalAbsoluteUrl } from '../lib/sharedBookingsPortal'

/** Hard navigation to the public-site operator portal (separate origin / storage). */
export default function OperatorPortalRedirect({ subpath = '' }: { subpath?: string }) {
  useEffect(() => {
    window.location.replace(sharedBookingsPortalAbsoluteUrl(subpath))
  }, [subpath])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 px-4 text-center">
      <RefreshCw className="h-5 w-5 animate-spin text-emerald-700" />
      <p className="text-sm text-zinc-600">Opening the Shared Bookings operator portal…</p>
    </div>
  )
}
