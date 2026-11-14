import { describe, expect, it } from 'vitest'
import {
  buildEdgeProxyUrl,
  gygIntegratorPortalConfig,
  mapGygGatewayPath,
} from './gygGateway'

describe('GYG API gateway mapping', () => {
  it('maps official /api/gyg/1/* actions to Edge gyg/1/*', () => {
    expect(mapGygGatewayPath('/api/gyg/1/get-availabilities')).toEqual({
      ok: true,
      kind: 'gyg',
      action: 'get-availabilities',
      edgeTail: 'gyg/1/get-availabilities',
    })
    expect(mapGygGatewayPath('/api/gyg/1/reserve/').edgeTail).toBe('gyg/1/reserve')
    expect(mapGygGatewayPath('/api/gyg/1/cancel-reservation').action).toBe('cancel-reservation')
    expect(mapGygGatewayPath('/api/gyg/1/book').action).toBe('book')
    expect(mapGygGatewayPath('/api/gyg/1/cancel-booking').action).toBe('cancel-booking')
  })

  it('accepts versionless action paths under /api/gyg/', () => {
    expect(mapGygGatewayPath('/api/gyg/get-availabilities').edgeTail).toBe(
      'gyg/1/get-availabilities',
    )
  })

  it('maps status/health without requiring Basic Auth secrets in the gateway', () => {
    expect(mapGygGatewayPath('/api/gyg').kind).toBe('status')
    expect(mapGygGatewayPath('/api/gyg/status').edgeTail).toBe('status')
  })

  it('rejects unsupported endpoints and non-gateway paths', () => {
    expect(mapGygGatewayPath('/api/gyg/1/unknown').ok).toBe(false)
    expect(mapGygGatewayPath('/api/omega/v1/x').ok).toBe(false)
  })

  it('builds Edge proxy URLs and Integrator Portal config', () => {
    expect(
      buildEdgeProxyUrl(
        'https://itihdgqgvlphtyidnvkt.supabase.co',
        'gyg/1/get-availabilities',
        '?productId=x',
      ),
    ).toBe(
      'https://itihdgqgvlphtyidnvkt.supabase.co/functions/v1/shared-bookings-external/gyg/1/get-availabilities?productId=x',
    )
    const cfg = gygIntegratorPortalConfig()
    expect(cfg.host).toBe('royalnordic.fi')
    expect(cfg.port).toBe(443)
    expect(cfg.path).toBe('/api/gyg/')
  })
})
