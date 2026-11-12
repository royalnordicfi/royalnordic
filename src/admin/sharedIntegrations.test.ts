import { describe, expect, it } from 'vitest'
import {
  assessGygActivationReadiness,
  bokunHmacBaseString,
  countGygSeatCategories,
  externalEndpointPaths,
  gygOpsHealthSummary,
  gygSetupErrors,
  parseGygDateTime,
  proposedGygMappingCandidates,
  requiredSecretsFor,
} from './sharedIntegrations'

describe('shared integrations helpers', () => {
  it('counts GYG ADULT/CHILD categories into seats', () => {
    expect(
      countGygSeatCategories([
        { category: 'ADULT', count: 2 },
        { category: 'CHILD', count: 1 },
        { category: 'INFANT', count: 1 },
      ]),
    ).toEqual({ adults: 2, children: 2, total: 4 })
  })

  it('parses official GYG ISO local datetime', () => {
    expect(parseGygDateTime('2020-12-05T14:00:00+02:00')).toEqual({
      date: '2020-12-05',
      time: '14:00',
    })
    expect(parseGygDateTime('2020-12-05T00:00:00+02:00').time).toBeUndefined()
  })

  it('builds Bókun HMAC base string excluding x-bokun-hmac', () => {
    const base = bokunHmacBaseString({
      'X-Bokun-HMAC': 'should-exclude',
      'X-Bokun-Topic': 'bookings/create',
      'X-Bokun-ApiKey': 'abc',
      'X-Bokun-Vendor-Id': 'VmVuZG9yOjQ',
    })
    expect(base).toBe(
      'x-bokun-apikey=abc&x-bokun-topic=bookings/create&x-bokun-vendor-id=VmVuZG9yOjQ',
    )
  })

  it('documents required secrets and endpoint paths without inventing providers', () => {
    expect(requiredSecretsFor('getyourguide')).toContain('SHARED_BOOKINGS_GYG_BASIC_USER')
    expect(requiredSecretsFor('bokun')).toContain('SHARED_BOOKINGS_BOKUN_WEBHOOK_SECRET')
    expect(externalEndpointPaths('bokun')[0]).toContain('/bokun/webhook')
    expect(externalEndpointPaths('getyourguide').some((p) => p.endsWith('/gyg/book'))).toBe(true)
  })

  it('lists actionable setup errors and keeps candidates unverified', () => {
    const errors = gygSetupErrors({
      edgeReachable: true,
      credentialsConfigured: false,
      notifyCredentialsConfigured: false,
      ingestionEnvEnabled: false,
      notifyEnvEnabled: false,
      templateCount: 0,
      mappingCount: 0,
      outboxProblems: 0,
    })
    expect(errors.some((e) => /BASIC_USER/.test(e))).toBe(true)
    expect(errors.some((e) => /template/i.test(e))).toBe(true)
    expect(proposedGygMappingCandidates().every((c) => c.verified === false)).toBe(true)
  })

  it('returns NO-GO until credentials, templates, and mappings are ready', () => {
    const verdict = assessGygActivationReadiness({
      edgeDeployed: true,
      uiDeployed: true,
      certificationOk: true,
      credentialsConfigured: false,
      notifyCredentialsConfigured: false,
      templateCount: 0,
      mappingCount: 0,
      ingestionEnvEnabled: false,
      notifyEnvEnabled: false,
      notifyCronConfigured: true,
      outboxProblems: 0,
    })
    expect(verdict.verdict).toBe('NO-GO')
    expect(verdict.blockers.length).toBeGreaterThan(0)

    const health = gygOpsHealthSummary({
      ingestionEnvEnabled: false,
      notifyEnvEnabled: false,
      mappingCount: 0,
      openInboundEvents: 0,
      outboxProblems: 0,
      credentialsConfigured: false,
      templateCount: 0,
    })
    expect(health.ingestion).toBe('off')
    expect(health.blockers.some((b) => /Basic Auth/i.test(b))).toBe(true)
  })
})
