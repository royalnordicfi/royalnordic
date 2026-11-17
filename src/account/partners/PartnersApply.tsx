import { Navigate } from 'react-router-dom'

/** Public apply UI lives on /travel-trade#apply — keep route for bookmarks. */
export default function PartnersApply() {
  return <Navigate to="/travel-trade#apply" replace />
}
