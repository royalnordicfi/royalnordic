import { describe, expect, it } from 'vitest'
import {
  SHARED_BOOKINGS_FORBIDDEN_KEYS,
  availableSeats,
  bookingErrorMessage,
  canAccessBoard,
  canMutateSharedPassenger,
  canSetCapacity,
  canViewSupplierPassengers,
  channelLabel,
  filterManifestForAccess,
  normalizePassengerCounts,
  normalizeSharedBookingsAccess,
  occupiedSeatsFromBookings,
  occupancyTone,
  payloadHasForbiddenFields,
  resolveSharedAccessDecision,
  supplierBreakdownFromBookings,
  syncStatusBanner,
  type SharedBookingsAccess,
  type SharedPassenger,
} from './sharedBookings'
import {
  calendarRange,
  shiftCalendarAnchor,
  startOfWeekMonday,
} from './sharedCalendar'
import { isSharedBookingsPublicPath, postLoginSharedPath, sharedBookingsPaths } from './sharedBookingsPaths'
import {
  SHARED_BOOKINGS_ADMIN_BASE,
  SHARED_BOOKINGS_PORTAL_BASE,
  isSharedBookingsPortalPath,
} from '../lib/sharedBookingsPortal'

const adminAccess: SharedBookingsAccess = {
  ok: true,
  access: 'admin',
  boards: ['shared_bus', 'my_tours'],
  supplier_code: 'royal_nordic',
  supplier_name: 'Royal Nordic',
  must_change_password: false,
  channels_synced: false,
}

const eliasAccess: SharedBookingsAccess = {
  ok: true,
  access: 'supplier',
  boards: ['shared_bus'],
  supplier_id: 'sup-elias',
  supplier_code: 'elias',
  supplier_name: 'Elias',
  must_change_password: false,
  channels_synced: false,
}

const eliasMustChange: SharedBookingsAccess = {
  ...eliasAccess,
  must_change_password: true,
}

const noneAccess: SharedBookingsAccess = {
  ok: true,
  access: 'none',
  boards: [],
  must_change_password: false,
  channels_synced: false,
}

const inactiveOrUnauthorized: SharedBookingsAccess = {
  ok: true,
  access: 'none',
  boards: [],
  channels_synced: false,
}

function pax(partial: Partial<SharedPassenger> & { id: string; supplier_code: string }): SharedPassenger {
  return {
    booking_ref: 'SB-1',
    guest_name: 'Guest',
    adults: 2,
    children: 0,
    passenger_count: 2,
    pickup_location: 'Hotel',
    status: 'confirmed',
    channel: 'elias',
    sync_status: 'local_only',
    supplier_name: partial.supplier_code === 'elias' ? 'Elias' : 'Royal Nordic',
    ...partial,
  }
}

describe('shared bookings seat math', () => {
  it('counts only confirmed passengers toward occupancy', () => {
    const occupied = occupiedSeatsFromBookings([
      { status: 'confirmed', passenger_count: 4 },
      { status: 'cancelled', passenger_count: 2 },
      { status: 'pending', passenger_count: 3 },
      { status: 'confirmed', passenger_count: 1 },
    ])
    expect(occupied).toBe(5)
    expect(availableSeats(50, occupied)).toBe(45)
  })

  it('blocks capacity below confirmed occupancy', () => {
    expect(canSetCapacity(10, 10)).toBe(true)
    expect(canSetCapacity(9, 10)).toBe(false)
    expect(canSetCapacity(0, 0)).toBe(false)
    expect(occupancyTone(10, 10)).toBe('red')
    expect(occupancyTone(8, 10)).toBe('amber')
    expect(occupancyTone(2, 10)).toBe('green')
  })

  it('normalizes booking passenger counts and mutation permissions', () => {
    expect(normalizePassengerCounts(2, 1)).toEqual({
      adults: 2,
      children: 1,
      passenger_count: 3,
      ok: true,
    })
    expect(normalizePassengerCounts(0, 0).ok).toBe(false)
    expect(canMutateSharedPassenger(adminAccess, { supplier_code: 'elias' })).toBe(true)
    expect(canMutateSharedPassenger(eliasAccess, { supplier_code: 'elias' })).toBe(true)
    expect(canMutateSharedPassenger(eliasAccess, { supplier_code: 'royal_nordic' })).toBe(false)
    expect(bookingErrorMessage('capacity_exceeded', { available_seats: 1 })).toMatch(/1 left/)
    expect(bookingErrorMessage('duplicate_booking_ref')).toMatch(/reference/i)
  })

  it('cancelled passengers do not occupy seats', () => {
    const occupied = occupiedSeatsFromBookings([
      { status: 'confirmed', passenger_count: 4 },
      { status: 'cancelled', passenger_count: 4 },
    ])
    expect(occupied).toBe(4)
    expect(availableSeats(8, occupied)).toBe(4)
  })

  it('builds month/week/day calendar ranges', () => {
    expect(startOfWeekMonday('2026-11-10')).toBe('2026-11-09')
    const week = calendarRange('week', '2026-11-10')
    expect(week.from).toBe('2026-11-09')
    expect(week.to).toBe('2026-11-15')
    expect(week.days).toHaveLength(7)
    const month = calendarRange('month', '2026-11-10')
    expect(month.from).toBe('2026-11-01')
    expect(month.to).toBe('2026-11-30')
    expect(shiftCalendarAnchor('day', '2026-11-10', 1)).toBe('2026-11-11')
    expect(shiftCalendarAnchor('week', '2026-11-10', -1)).toBe('2026-11-03')
    expect(shiftCalendarAnchor('month', '2026-11-10', 1)).toBe('2026-12-10')
  })

  it('builds supplier breakdown from confirmed only', () => {
    const breakdown = supplierBreakdownFromBookings([
      { status: 'confirmed', passenger_count: 2, supplier_code: 'royal_nordic', supplier_name: 'Royal Nordic' },
      { status: 'cancelled', passenger_count: 9, supplier_code: 'royal_nordic', supplier_name: 'Royal Nordic' },
      { status: 'confirmed', passenger_count: 4, supplier_code: 'elias', supplier_name: 'Elias' },
    ])
    expect(breakdown).toEqual([
      { supplier_code: 'elias', supplier_name: 'Elias', confirmed_passengers: 4 },
      { supplier_code: 'royal_nordic', supplier_name: 'Royal Nordic', confirmed_passengers: 2 },
    ])
  })
})

describe('shared bookings authorization helpers', () => {
  it('admin can open both boards; Elias only shared bus', () => {
    expect(canAccessBoard(adminAccess, 'shared_bus')).toBe(true)
    expect(canAccessBoard(adminAccess, 'my_tours')).toBe(true)
    expect(canAccessBoard(eliasAccess, 'shared_bus')).toBe(true)
    expect(canAccessBoard(eliasAccess, 'my_tours')).toBe(false)
    expect(canAccessBoard(noneAccess, 'shared_bus')).toBe(false)
  })

  it('Elias cannot view Royal Nordic passenger rows', () => {
    const rows = [
      pax({ id: '1', supplier_code: 'royal_nordic', guest_name: 'RN Private' }),
      pax({ id: '2', supplier_code: 'elias', guest_name: 'Elias Guest' }),
    ]
    expect(filterManifestForAccess(rows, eliasAccess).map((r) => r.id)).toEqual(['2'])
    expect(filterManifestForAccess(rows, adminAccess)).toHaveLength(2)
    expect(canViewSupplierPassengers(eliasAccess, 'royal_nordic')).toBe(false)
    expect(canViewSupplierPassengers(eliasAccess, 'elias')).toBe(true)
  })

  it('rejects financial and private RN keys in payloads', () => {
    expect(SHARED_BOOKINGS_FORBIDDEN_KEYS).toContain('rn_booking_id')
    expect(SHARED_BOOKINGS_FORBIDDEN_KEYS).toContain('total_price')
    const leaks = payloadHasForbiddenFields({
      departure: { id: 'x' },
      passengers: [{ guest_name: 'A', total_price: 99, customer_email: 'a@b.c' }],
    })
    expect(leaks).toEqual(['customer_email', 'total_price'])
  })
})

describe('shared bookings copy', () => {
  it('labels external channels without inventing connection state', () => {
    expect(channelLabel('getyourguide')).toBe('GetYourGuide')
    expect(channelLabel('bokun')).toBe('Bókun')
    expect(syncStatusBanner(false)).toMatch(/Integrations/i)
  })
})

describe('shared bookings access decisions', () => {
  it('sends newly provisioned operators to first-login password setup', () => {
    expect(resolveSharedAccessDecision(eliasMustChange)).toBe('setup_password')
    expect(postLoginSharedPath(eliasMustChange, SHARED_BOOKINGS_PORTAL_BASE)).toBe(
      `${SHARED_BOOKINGS_PORTAL_BASE}/setup-password`,
    )
  })

  it('lets operators with no assigned departures into the portal (empty state, not denied)', () => {
    // Access is independent of departure assignments — empty calendar is still portal.
    expect(resolveSharedAccessDecision(eliasAccess)).toBe('portal')
    expect(postLoginSharedPath(eliasAccess, SHARED_BOOKINGS_PORTAL_BASE)).toBe(
      SHARED_BOOKINGS_PORTAL_BASE,
    )
  })

  it('treats missing/hydration access as error, not unauthorized', () => {
    // Shell must not map this to Access Denied during auth hydration.
    expect(resolveSharedAccessDecision(null)).toBe('access_error')
    expect(resolveSharedAccessDecision(undefined)).toBe('access_error')
    expect(resolveSharedAccessDecision({ ok: false, error: 'not_authenticated' })).toBe(
      'access_error',
    )
  })

  it('denies inactive operators and unauthorized users only', () => {
    expect(resolveSharedAccessDecision(inactiveOrUnauthorized)).toBe('access_denied')
    expect(resolveSharedAccessDecision(noneAccess)).toBe('access_denied')
    expect(postLoginSharedPath(noneAccess, SHARED_BOOKINGS_PORTAL_BASE)).toBe(
      `${SHARED_BOOKINGS_PORTAL_BASE}/access-denied`,
    )
  })

  it('after successful password change, supplier access reaches portal', () => {
    expect(
      resolveSharedAccessDecision({
        ...eliasMustChange,
        must_change_password: false,
      }),
    ).toBe('portal')
  })

  it('keeps admins on portal management path without password gate', () => {
    expect(resolveSharedAccessDecision(adminAccess)).toBe('portal')
    expect(postLoginSharedPath(adminAccess, SHARED_BOOKINGS_ADMIN_BASE)).toBe(
      SHARED_BOOKINGS_ADMIN_BASE,
    )
  })

  it('normalizes string jsonb payloads and string booleans', () => {
    const normalized = normalizeSharedBookingsAccess(
      JSON.stringify({
        ok: true,
        access: 'supplier',
        boards: ['shared_bus'],
        supplier_id: 'sup-1',
        supplier_code: 'elias',
        supplier_name: 'Elias',
        must_change_password: 'true',
        channels_synced: false,
      }),
    )
    expect(normalized).toMatchObject({
      ok: true,
      access: 'supplier',
      must_change_password: true,
      supplier_code: 'elias',
    })
    expect(resolveSharedAccessDecision(normalized)).toBe('setup_password')
  })
})

describe('shared bookings portal routing', () => {
  it('uses portal base paths for operator post-login redirects', () => {
    const base = SHARED_BOOKINGS_PORTAL_BASE
    expect(postLoginSharedPath(eliasMustChange, base)).toBe(`${base}/setup-password`)
    expect(postLoginSharedPath(eliasAccess, base)).toBe(base)
    expect(postLoginSharedPath(adminAccess, base)).toBe(base)
    expect(postLoginSharedPath(noneAccess, base)).toBe(`${base}/access-denied`)
  })

  it('keeps admin management base on admin host', () => {
    const base = SHARED_BOOKINGS_ADMIN_BASE
    expect(sharedBookingsPaths(base).operators).toBe('/sharedbookings/operators')
    expect(postLoginSharedPath(eliasAccess, base)).toBe('/sharedbookings')
  })

  it('detects public portal paths and public auth pages', () => {
    expect(isSharedBookingsPortalPath('/admin/sharedbookings')).toBe(true)
    expect(isSharedBookingsPortalPath('/admin/sharedbookings/login')).toBe(true)
    expect(isSharedBookingsPortalPath('/sharedbookings')).toBe(false)
    expect(isSharedBookingsPortalPath('/admin')).toBe(false)

    const portal = SHARED_BOOKINGS_PORTAL_BASE
    expect(isSharedBookingsPublicPath(`${portal}/login`, portal)).toBe(true)
    expect(isSharedBookingsPublicPath(`${portal}/setup-password`, portal)).toBe(true)
    expect(isSharedBookingsPublicPath(`${portal}/access-denied`, portal)).toBe(true)
    expect(isSharedBookingsPublicPath(portal, portal)).toBe(false)
  })
})
