/** Money helpers for tour prices stored as EUR decimals (2 dp). */

export const MAX_TOUR_PRICE_EUR = 10_000

export function normalizeMoneyEur(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error('Price must be a valid number')
  }
  return Math.round(value * 100) / 100
}

export function validateTourPriceEur(value: number, label: string): number {
  const amount = normalizeMoneyEur(value)
  if (amount < 0) {
    throw new Error(`${label} price cannot be negative`)
  }
  if (amount > MAX_TOUR_PRICE_EUR) {
    throw new Error(`${label} price cannot exceed €${MAX_TOUR_PRICE_EUR}`)
  }
  return amount
}

export function validateTourPrices(adultPrice: number, childPrice: number) {
  return {
    adult_price: validateTourPriceEur(adultPrice, 'Adult'),
    child_price: validateTourPriceEur(childPrice, 'Child'),
  }
}

/** Compact display for calendar cells and summaries (drops trailing .00). */
export function formatEuroAmount(value: number): string {
  const amount = normalizeMoneyEur(value)
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2)
}
