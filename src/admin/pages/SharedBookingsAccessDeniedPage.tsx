import { useNavigate } from 'react-router-dom'
import { signOutAdmin } from '../../lib/adminAuth'
import { sharedBookingsPaths, useSharedBookingsBase } from '../sharedBookingsPaths'

export default function SharedBookingsAccessDeniedPage() {
  const navigate = useNavigate()
  const base = useSharedBookingsBase()
  const paths = sharedBookingsPaths(base)

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          Shared Bookings
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Access denied</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          This account is signed in but is not authorized for Shared Bookings. Only Royal Nordic
          admins and provisioned operators can continue.
        </p>
        <button
          type="button"
          className="mt-6 w-full min-h-[44px] rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
          onClick={async () => {
            await signOutAdmin()
            navigate(paths.login, { replace: true })
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
