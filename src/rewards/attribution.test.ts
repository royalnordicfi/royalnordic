/**
 * Run: npx tsx --test src/rewards/attribution.test.ts
 */
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  REFERRAL_STORAGE_KEY,
  REFERRAL_STORAGE_TS_KEY,
} from '../config/rewardsBooking.ts'

// Minimal in-memory storage for node tests
const mem = new Map<string, string>()
const storage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => {
    mem.set(k, v)
  },
  removeItem: (k: string) => {
    mem.delete(k)
  },
}

beforeEach(() => {
  mem.clear()
  ;(globalThis as { localStorage?: typeof storage }).localStorage = storage
  ;(globalThis as { sessionStorage?: typeof storage }).sessionStorage = storage
})

afterEach(() => {
  mem.clear()
})

describe('referral attribution persistence', () => {
  it('captures ?ref= and normalizes', async () => {
    const { captureReferralFromSearch, readPersistedReferralCode } = await import('./attribution.ts')
    const code = captureReferralFromSearch('?ref=alex-10')
    assert.equal(code, 'ALEX10')
    assert.equal(readPersistedReferralCode(), 'ALEX10')
    assert.equal(mem.get(REFERRAL_STORAGE_KEY), 'ALEX10')
    assert.ok(mem.get(REFERRAL_STORAGE_TS_KEY))
  })

  it('expires after attribution window', async () => {
    const { persistReferralCode, readPersistedReferralCode } = await import('./attribution.ts')
    persistReferralCode('AURORA2026')
    const old = Date.now() - 40 * 24 * 60 * 60 * 1000
    mem.set(REFERRAL_STORAGE_TS_KEY, String(old))
    assert.equal(readPersistedReferralCode(new Date()), null)
  })
})
