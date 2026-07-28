/**
 * Automated tour-date correctness tests (no Vitest required).
 * Run: node --experimental-strip-types --test src/lib/tourDate.test.ts
 *   or: npx tsx --test src/lib/tourDate.test.ts
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildMondayFirstMonthGrid,
  formatTourDateForDisplay,
  formatTourDateLong,
  formatTourWeekday,
  addTourDays,
  mondayFirstColumn,
  mondayFirstPadding,
  parseTourDateParts,
  toTourDateISO,
  tourDateToLocalDate,
  tourWeekdayIndex,
  WEEKDAY_HEADERS_MON_FIRST,
} from './tourDate.ts'

describe('tourDate canonical helpers', () => {
  it('2027-01-14 is Thursday everywhere (canonical)', () => {
    assert.equal(tourWeekdayIndex('2027-01-14'), 4)
    assert.equal(formatTourWeekday('2027-01-14'), 'Thursday')
    assert.match(formatTourDateLong('2027-01-14'), /^Thursday, January 14, 2027$/)
    assert.equal(WEEKDAY_HEADERS_MON_FIRST[mondayFirstColumn('2027-01-14')], 'Thu')
  })

  it('never shifts ISO date via UTC midnight parse', () => {
    const d = tourDateToLocalDate('2027-01-14')
    assert.equal(d.getFullYear(), 2027)
    assert.equal(d.getMonth(), 0)
    assert.equal(d.getDate(), 14)
  })

  it('January 2027 Mon-first grid places day 1 under Fri and day 14 under Thu', () => {
    const grid = buildMondayFirstMonthGrid(2027, 0)
    const pad = mondayFirstPadding(2027, 0)
    assert.equal(pad, 4)
    assert.equal(WEEKDAY_HEADERS_MON_FIRST[pad], 'Fri')
    const cell14 = grid[pad + 13]
    assert.ok(cell14 && cell14.day === 14)
    assert.equal(cell14.date, '2027-01-14')
    assert.equal(WEEKDAY_HEADERS_MON_FIRST[(pad + 13) % 7], 'Thu')
  })

  it('rejects invalid calendar dates', () => {
    assert.throws(() => parseTourDateParts('2027-02-30'))
    assert.throws(() => parseTourDateParts('14-01-2027'))
  })

  it('covers 2026–2030: every date weekday matches Date local parts', () => {
    let count = 0
    for (let year = 2026; year <= 2030; year++) {
      for (let month = 0; month < 12; month++) {
        const dim = new Date(year, month + 1, 0).getDate()
        const pad = mondayFirstPadding(year, month)
        const grid = buildMondayFirstMonthGrid(year, month)
        for (let day = 1; day <= dim; day++) {
          const iso = toTourDateISO(year, month, day)
          const expectedDow = new Date(year, month, day, 12).getDay()
          assert.equal(tourWeekdayIndex(iso), expectedDow, iso)
          const col = mondayFirstColumn(iso)
          assert.equal((expectedDow + 6) % 7, col, `col ${iso}`)
          const cell = grid[pad + day - 1]
          assert.ok(cell && cell.date === iso)
          count++
        }
      }
    }
    assert.ok(count >= 1000, `expected >=1000 days, got ${count}`)
  })

  it('leap day 2028-02-29 is valid Tuesday', () => {
    assert.equal(formatTourWeekday('2028-02-29'), 'Tuesday')
    assert.equal(tourWeekdayIndex('2028-02-29'), 2)
  })

  it('month boundaries: 2026-12-31 and 2027-01-01', () => {
    assert.equal(formatTourWeekday('2026-12-31'), 'Thursday')
    assert.equal(formatTourWeekday('2027-01-01'), 'Friday')
  })

  it('DST spring/autumn Helsinki-relevant dates keep calendar day', () => {
    // EU DST 2027: last Sunday Mar / last Sunday Oct — date-only must not shift
    assert.equal(tourDateToLocalDate('2027-03-28').getDate(), 28)
    assert.equal(tourDateToLocalDate('2027-10-31').getDate(), 31)
    assert.equal(formatTourWeekday('2027-03-28'), 'Sunday')
    assert.equal(formatTourWeekday('2027-10-31'), 'Sunday')
  })

  it('addTourDays stays on calendar days across month boundaries', () => {
    assert.equal(addTourDays('2027-01-14', 1), '2027-01-15')
    assert.equal(addTourDays('2027-01-31', 1), '2027-02-01')
    assert.equal(addTourDays('2028-02-28', 1), '2028-02-29')
    assert.equal(addTourDays('2027-01-14', -14), '2026-12-31')
  })

  it('formatTourDateForDisplay formats ISO and leaves labels alone', () => {
    assert.equal(formatTourDateForDisplay('2027-01-14'), 'Thursday, January 14, 2027')
    assert.equal(formatTourDateForDisplay('Thursday, January 14, 2027'), 'Thursday, January 14, 2027')
  })
})
