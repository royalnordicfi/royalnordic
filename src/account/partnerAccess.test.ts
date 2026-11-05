import { describe, expect, it } from 'vitest'
import type { User } from '@supabase/supabase-js'
import {
  getPartnerAccessFromUser,
  isApprovedPartner,
  resolvePostLoginPath,
} from './partnerAccess'

function user(partial: { app?: Record<string, unknown>; user?: Record<string, unknown> }): User {
  return {
    id: 'u1',
    app_metadata: partial.app || {},
    user_metadata: partial.user || {},
  } as User
}

describe('partnerAccess', () => {
  it('never treats client user_metadata as approval', () => {
    const u = user({ user: { partner_application_submitted: true, partner_status: 'approved' } })
    expect(getPartnerAccessFromUser(u)).toBe('none')
    expect(isApprovedPartner(u)).toBe(false)
  })

  it('requires app_metadata for approved partner hint', () => {
    expect(isApprovedPartner(user({ app: { partner_status: 'approved' } }))).toBe(true)
    expect(isApprovedPartner(user({ user: { partner_status: 'approved' } }))).toBe(false)
  })

  it('routes partners intent using db access when provided', () => {
    expect(resolvePostLoginPath(null, 'partners', 'none')).toBe('/partners/apply')
    expect(resolvePostLoginPath(user({}), 'partners', 'pending')).toBe('/partners/status')
    expect(resolvePostLoginPath(user({}), 'partners', 'approved')).toBe('/partners/dashboard')
    expect(resolvePostLoginPath(user({}), 'partners', 'declined')).toBe('/partners/apply')
  })

  it('keeps rewards intent on rewards dashboard', () => {
    expect(
      resolvePostLoginPath(user({ app: { partner_status: 'approved' } }), 'rewards'),
    ).toBe('/referralprogram/dashboard')
  })
})
