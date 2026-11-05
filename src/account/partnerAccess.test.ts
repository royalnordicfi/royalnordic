import { describe, expect, it } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { getPartnerAccess, isApprovedPartner, resolvePostLoginPath } from './partnerAccess'

function user(partial: { app?: Record<string, unknown>; user?: Record<string, unknown> }): User {
  return {
    id: 'u1',
    app_metadata: partial.app || {},
    user_metadata: partial.user || {},
  } as User
}

describe('partnerAccess', () => {
  it('never treats client intent metadata as approval', () => {
    const u = user({ user: { partner_application_submitted: true } })
    expect(getPartnerAccess(u)).toBe('pending')
    expect(isApprovedPartner(u)).toBe(false)
  })

  it('requires app_metadata for approved partner', () => {
    expect(isApprovedPartner(user({ app: { partner_status: 'approved' } }))).toBe(true)
    expect(isApprovedPartner(user({ user: { partner_status: 'approved' } }))).toBe(false)
  })

  it('routes partners intent without granting privileges', () => {
    expect(resolvePostLoginPath(null, 'partners')).toBe('/partners/apply')
    expect(resolvePostLoginPath(user({}), 'partners')).toBe('/partners/apply')
    expect(
      resolvePostLoginPath(user({ user: { partner_application_submitted: true } }), 'partners'),
    ).toBe('/partners/status')
    expect(resolvePostLoginPath(user({ app: { partner_status: 'approved' } }), 'partners')).toBe(
      '/partners/dashboard',
    )
  })

  it('keeps rewards intent on rewards dashboard', () => {
    expect(
      resolvePostLoginPath(user({ app: { partner_status: 'approved' } }), 'rewards'),
    ).toBe('/referralprogram/dashboard')
  })
})
