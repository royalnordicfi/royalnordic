import { describe, expect, it } from 'vitest'
import { isExpiredSessionMessage } from './adminAuth'

describe('adminAuth session messaging', () => {
  it('detects expired / missing auth session errors', () => {
    expect(isExpiredSessionMessage('Auth session missing!')).toBe(true)
    expect(isExpiredSessionMessage('Your session expired. Please sign in again.')).toBe(true)
    expect(isExpiredSessionMessage('not_authenticated')).toBe(true)
    expect(isExpiredSessionMessage('Could not update password')).toBe(false)
  })
})
