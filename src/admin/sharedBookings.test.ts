import { describe, expect, it } from 'vitest'
import {
  SHARED_BOOKINGS_FORBIDDEN_KEYS,
  availableSeats,
  canAccessBoard,
  canViewSupplierPassengers,
  channelLabel,
  filterManifestForAccess,
  isSharedBookingsPublicPath,
  occupiedSeatsFromBookings,
  payloadHasForbiddenFields,
  postLoginSharedPath,
  supplierBreakdownFromBookings,
  syncStatusBanner,
  type SharedBookingsAccess,
  type SharedPassenger,
} from './sharedBookings'

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
  it('labels reserved channels as not connected', () => {
    expect(channelLabel('getyourguide')).toMatch(/not connected/i)
    expect(channelLabel('bokun')).toMatch(/not connected/i)
    expect(syncStatusBanner(false)).toMatch(/not connected/i)
  })
})

describe('shared bookings login routing', () => {
  it('sends operators with must_change_password to setup', () => {
    expect(postLoginSharedPath(eliasMustChange)).toBe('/sharedbookings/setup-password')
    expect(postLoginSharedPath(eliasAccess)).toBe('/sharedbookings')
    expect(postLoginSharedPath(adminAccess)).toBe('/sharedbookings')
    expect(postLoginSharedPath(noneAccess)).toBe('/sharedbookings/access-denied')
    expect(postLoginSharedPath({ ok: false, error: 'x' })).toBe('/sharedbookings/access-denied')
  })

  it('treats login/setup/denied as public shared paths', () => {
    expect(isSharedBookingsPublicPath('/sharedbookings/login')).toBe(true)
    expect(isSharedBookingsPublicPath('/sharedbookings/setup-password')).toBe(true)
    expect(isSharedBookingsPublicPath('/sharedbookings/access-denied')).toBe(true)
    expect(isSharedBookingsPublicPath('/sharedbookings')).toBe(false)
    expect(isSharedBookingsPublicPath('/sharedbookings/operators')).toBe(false)
  })
})
