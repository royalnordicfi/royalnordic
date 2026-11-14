import { describe, expect, it } from 'vitest'
import {
  SHARED_BUS_CAPACITY,
  SHARED_BUS_DEPARTURE_TIME,
  SHARED_BUS_TEMPLATE_CODE,
  isSharedBusTourTitle,
  sharedBusMappingDefaults,
} from './sharedBus'

describe('shared bus scope', () => {
  it('locks Standard Group Northern Lights defaults', () => {
    const d = sharedBusMappingDefaults()
    expect(d.templateCode).toBe(SHARED_BUS_TEMPLATE_CODE)
    expect(d.defaultDepartureTime).toBe(SHARED_BUS_DEPARTURE_TIME)
    expect(d.capacity).toBe(SHARED_BUS_CAPACITY)
    expect(d.supplierCode).toBe('royal_nordic')
    expect(d.isActiveDefault).toBe(false)
  })

  it('accepts Standard Group titles and rejects other products', () => {
    expect(isSharedBusTourTitle('Standard Group Northern Lights')).toBe(true)
    expect(isSharedBusTourTitle('Northern Lights Standard Group – 100% Guarantee')).toBe(true)
    expect(isSharedBusTourTitle('Guaranteed Northern Lights & Photography Tour')).toBe(false)
    expect(isSharedBusTourTitle('Korouoma Canyon Winter Adventure')).toBe(false)
    expect(isSharedBusTourTitle('Private Northern Lights Tour')).toBe(false)
  })
})
