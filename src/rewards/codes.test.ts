/**
 * Referral code validation tests (no Vitest required).
 * Run: npx tsx --test src/rewards/codes.test.ts
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  claimErrorMessage,
  isReservedReferralCode,
  normalizeReferralCode,
  referralLinkForCode,
  validateReferralCodeInput,
} from './codes.ts'

describe('normalizeReferralCode', () => {
  it('uppercases and strips non-alphanumerics', () => {
    assert.equal(normalizeReferralCode('alex-10'), 'ALEX10')
    assert.equal(normalizeReferralCode('  Lapland Mike '), 'LAPLANDMIKE')
  })
})

describe('validateReferralCodeInput', () => {
  it('accepts valid codes', () => {
    const r = validateReferralCodeInput('AURORA2026')
    assert.equal(r.valid, true)
    if (r.valid) assert.equal(r.normalized, 'AURORA2026')
  })

  it('rejects short and reserved codes', () => {
    assert.equal(validateReferralCodeInput('AB').valid, false)
    assert.equal(validateReferralCodeInput('ADMIN').valid, false)
    assert.equal(validateReferralCodeInput('ROYALNORDIC').valid, false)
    assert.equal(validateReferralCodeInput('RNTEST').valid, false)
  })

  it('rejects invalid characters', () => {
    assert.equal(validateReferralCodeInput('ALEX@10').valid, false)
  })
})

describe('isReservedReferralCode', () => {
  it('blocks brand and abuse prefixes', () => {
    assert.equal(isReservedReferralCode('ADMINS'), true)
    assert.equal(isReservedReferralCode('ALEX10'), false)
  })
})

describe('referralLinkForCode', () => {
  it('builds ref query on origin', () => {
    assert.equal(
      referralLinkForCode('alex10', 'https://royalnordic.fi'),
      'https://royalnordic.fi/?ref=ALEX10',
    )
  })
})

describe('claimErrorMessage', () => {
  it('maps known errors', () => {
    assert.match(claimErrorMessage('taken'), /taken/i)
    assert.match(claimErrorMessage('reserved'), /reserved/i)
  })
})
