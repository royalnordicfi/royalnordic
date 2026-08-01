import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  formatEuroAmount,
  normalizeMoneyEur,
  validateTourPrices,
} from './tourPricing.ts'

describe('tourPricing', () => {
  it('normalizes to cents', () => {
    assert.equal(normalizeMoneyEur(149.999), 150)
    assert.equal(normalizeMoneyEur(29.8), 29.8)
  })

  it('formats compact euro amounts', () => {
    assert.equal(formatEuroAmount(149), '149')
    assert.equal(formatEuroAmount(29.8), '29.80')
  })

  it('rejects invalid prices', () => {
    assert.throws(() => validateTourPrices(-1, 10), /negative/i)
    assert.throws(() => validateTourPrices(10, 20_000), /exceed/i)
  })

  it('accepts valid adult/child pair', () => {
    assert.deepEqual(validateTourPrices(149, 129), {
      adult_price: 149,
      child_price: 129,
    })
  })
})
