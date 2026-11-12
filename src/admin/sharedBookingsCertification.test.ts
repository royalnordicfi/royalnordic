import { describe, expect, it } from 'vitest'
import {
  assessProductionReadiness,
  runSharedBookingsCertification,
} from './sharedBookingsCertification'
import { gygOpsHealthSummary } from './sharedIntegrations'

describe('Shared Bookings 1.6E certification', () => {
  it('passes all 15 mocked lifecycle steps', () => {
    const result = runSharedBookingsCertification()
    const failed = result.steps.filter((s) => !s.ok)
    expect(failed, JSON.stringify(failed, null, 2)).toEqual([])
    expect(result.ok).toBe(true)
    expect(result.steps).toHaveLength(15)
  })

  it('marks production deployment BLOCKED without approval facts', () => {
    const rows = assessProductionReadiness({
      migrationsPending: [
        '20261112083834',
        '20261112085214',
        '20261112091222',
        '20261112165847',
        '20261112170637',
      ],
      edgeDeployed: false,
      uiDeployed: false,
      gygCredentialsConfigured: false,
      productMappingsConfigured: false,
      notifyCronConfigured: false,
      ingestionEnabled: false,
      notifyEnabled: false,
      certificationLocalOk: true,
    })
    expect(rows.every((r) => r.component !== 'Production deployment' || r.status === 'BLOCKED')).toBe(
      true,
    )
    expect(rows.find((r) => r.component === 'Database')?.status).toBe('BLOCKED')
    expect(rows.find((r) => r.component === 'Cron processor')?.status).toBe('BLOCKED')
  })

  it('surfaces independent ingestion vs notify health', () => {
    const health = gygOpsHealthSummary({
      ingestionEnvEnabled: false,
      notifyEnvEnabled: false,
      mappingCount: 2,
      openInboundEvents: 0,
      outboxProblems: 1,
    })
    expect(health.ingestion).toBe('ready_off')
    expect(health.notify).toBe('ready_off')
    expect(health.blockers.some((b) => /outbox/i.test(b))).toBe(true)
  })
})
