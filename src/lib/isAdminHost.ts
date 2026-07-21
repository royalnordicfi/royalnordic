/** True when this deployment should render the operator admin console. */
export function isAdminHost(): boolean {
  if (typeof window === 'undefined') return false

  const host = window.location.hostname.toLowerCase()

  if (host === 'admin.royalnordic.fi') return true
  if (host === 'admin.localhost' || host.endsWith('.admin.localhost')) return true

  // Local preview: http://localhost:5173/?admin=1
  if (import.meta.env.DEV) {
    return new URLSearchParams(window.location.search).has('admin')
  }

  return false
}
