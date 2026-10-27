import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'
import {
  STANDARD_GROUP_CAPACITY,
  STANDARD_GROUP_SEASON_END,
  STANDARD_GROUP_SEASON_START,
  departureSuffixForTour,
  isDateInTourSeason,
  partyFitsCapacity,
  perPersonSubtotal,
} from './tourBookingRules.ts'

describe('standard group season', () => {
  const start = STANDARD_GROUP_SEASON_START
  const end = STANDARD_GROUP_SEASON_END

  it('allows 1 November through 31 March and rejects the rest of the year', () => {
    assert.equal(isDateInTourSeason('2026-10-31', start, end), false)
    assert.equal(isDateInTourSeason('2026-11-01', start, end), true)
    assert.equal(isDateInTourSeason('2026-12-24', start, end), true)
    assert.equal(isDateInTourSeason('2027-01-15', start, end), true)
    assert.equal(isDateInTourSeason('2027-03-31', start, end), true)
    assert.equal(isDateInTourSeason('2027-04-01', start, end), false)
    assert.equal(isDateInTourSeason('2026-08-01', start, end), false)
  })

  it('does not invent a season when none is configured', () => {
    assert.equal(isDateInTourSeason('2026-07-01', null, null), true)
  })
})

describe('standard group inventory and price', () => {
  it('prices adults and children from the configured rates', () => {
    assert.equal(perPersonSubtotal(2, 1, 60, 60), 180)
    assert.equal(perPersonSubtotal(1, 0, 60, 60), 60)
  })

  it('rejects parties above the departure capacity or remaining seats', () => {
    assert.equal(
      partyFitsCapacity({ adults: 50, children: 0, remaining: 50, maxCapacity: STANDARD_GROUP_CAPACITY }),
      true,
    )
    assert.equal(
      partyFitsCapacity({ adults: 49, children: 2, remaining: 50, maxCapacity: STANDARD_GROUP_CAPACITY }),
      false,
    )
    assert.equal(
      partyFitsCapacity({ adults: 10, children: 0, remaining: 4, maxCapacity: STANDARD_GROUP_CAPACITY }),
      false,
    )
  })
})

describe('departure labels', () => {
  it('uses 20:00 for the standard group and keeps other Northern Lights times', () => {
    assert.equal(
      departureSuffixForTour('Northern Lights Standard Group – 100% Guarantee'),
      ' at 20:00',
    )
    assert.equal(departureSuffixForTour('Guaranteed Northern Lights Tour'), ' at 18:30')
    assert.equal(departureSuffixForTour('Family-Friendly Northern Lights Tour'), ' at 21:00')
    assert.equal(
      departureSuffixForTour('Northern Lights Standard Group – 100% Guarantee', '19:30'),
      ' at 19:30',
    )
  })
})

describe('edge function copy', () => {
  it('matches the Deno shared module', () => {
    const root = path.resolve(import.meta.dirname, '../..')
    const a = fs.readFileSync(path.join(root, 'src/lib/tourBookingRules.ts'), 'utf8')
    const b = fs.readFileSync(
      path.join(root, 'supabase/functions/_shared/tourBookingRules.ts'),
      'utf8',
    )
    assert.equal(a, b)
  })
})
