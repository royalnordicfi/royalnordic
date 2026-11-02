import { Navigate, useLocation } from 'react-router-dom'
import { useRewardsAuth } from './RewardsAuthContext'

export default function RewardsProtected({ children }: { children: React.ReactNode }) {
  const { isSignedIn, loading, user } = useRewardsAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="rn-container py-16 sm:py-24" aria-busy="true" aria-label="Loading account">
        <div className="mx-auto max-w-lg space-y-4">
          <div className="rn-rewards-skel h-8 w-48" />
          <div className="rn-rewards-skel h-24 w-full" />
          <div className="rn-rewards-skel h-24 w-full" />
        </div>
      </div>
    )
  }

  if (!isSignedIn || !user) {
    return <Navigate to="/referralprogram/signin" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
