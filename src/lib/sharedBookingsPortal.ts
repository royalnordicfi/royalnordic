/** Public-site operator portal (isolated from admin.royalnordic.fi). */

export const SHARED_BOOKINGS_PORTAL_BASE = '/admin/sharedbookings'
export const SHARED_BOOKINGS_ADMIN_BASE = '/sharedbookings'
export const SHARED_BOOKINGS_PORTAL_ORIGIN = 'https://royalnordic.fi'

export function isSharedBookingsPortalPath(pathname = window.location.pathname): boolean {
  return (
    pathname === SHARED_BOOKINGS_PORTAL_BASE ||
    pathname.startsWith(`${SHARED_BOOKINGS_PORTAL_BASE}/`)
  )
}

/** Absolute portal URL. Cross-origin when leaving admin.royalnordic.fi. */
export function sharedBookingsPortalAbsoluteUrl(subpath = ''): string {
  const normalized =
    !subpath || subpath === '/'
      ? ''
      : subpath.startsWith('/')
        ? subpath
        : `/${subpath}`
  const path = `${SHARED_BOOKINGS_PORTAL_BASE}${normalized}`

  if (typeof window === 'undefined') {
    return `${SHARED_BOOKINGS_PORTAL_ORIGIN}${path}`
  }

  const host = window.location.hostname.toLowerCase()
  if (host === 'admin.royalnordic.fi') {
    return `${SHARED_BOOKINGS_PORTAL_ORIGIN}${path}`
  }
  if (host === 'admin.localhost' || host.endsWith('.admin.localhost')) {
    const port = window.location.port || '5173'
    return `http://localhost:${port}${path}`
  }
  return path
}

export function shouldMountSharedBookingsPortal(): boolean {
  if (typeof window === 'undefined') return false
  // Admin host always mounts AdminApp — never the public portal bundle root.
  const host = window.location.hostname.toLowerCase()
  if (host === 'admin.royalnordic.fi') return false
  if (host === 'admin.localhost' || host.endsWith('.admin.localhost')) return false
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('admin')) {
    return false
  }
  return isSharedBookingsPortalPath(window.location.pathname)
}
