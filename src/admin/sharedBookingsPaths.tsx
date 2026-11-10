import { createContext, useContext, type ReactNode } from 'react'
import {
  SHARED_BOOKINGS_ADMIN_BASE,
  SHARED_BOOKINGS_PORTAL_BASE,
} from '../lib/sharedBookingsPortal'
import type { SharedBookingsAccess } from './sharedBookings'

export type SharedBookingsBase = typeof SHARED_BOOKINGS_PORTAL_BASE | typeof SHARED_BOOKINGS_ADMIN_BASE

const SharedBookingsBaseContext = createContext<SharedBookingsBase>(SHARED_BOOKINGS_ADMIN_BASE)

export function SharedBookingsBaseProvider({
  base,
  children,
}: {
  base: SharedBookingsBase
  children: ReactNode
}) {
  return (
    <SharedBookingsBaseContext.Provider value={base}>{children}</SharedBookingsBaseContext.Provider>
  )
}

export function useSharedBookingsBase(): SharedBookingsBase {
  return useContext(SharedBookingsBaseContext)
}

export function sharedBookingsPaths(base: string) {
  return {
    root: base,
    login: `${base}/login`,
    setupPassword: `${base}/setup-password`,
    accessDenied: `${base}/access-denied`,
    operators: `${base}/operators`,
    departure: (id: string) => `${base}/${id}`,
  }
}

export function postLoginSharedPath(
  access: SharedBookingsAccess,
  base: string = SHARED_BOOKINGS_ADMIN_BASE,
): string {
  const paths = sharedBookingsPaths(base)
  if (!access.ok || access.access === 'none') return paths.accessDenied
  if (access.access === 'supplier' && access.must_change_password) return paths.setupPassword
  return paths.root
}

export function isSharedBookingsPublicPath(pathname: string, base: string): boolean {
  const paths = sharedBookingsPaths(base)
  return (
    pathname === paths.login ||
    pathname === paths.setupPassword ||
    pathname === paths.accessDenied
  )
}
