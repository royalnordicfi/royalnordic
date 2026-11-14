/**
 * TypeScript mirror of api/gyg/_map.js for unit tests and admin docs.
 * Keep in sync with the Vercel gateway mapper.
 */

export const GYG_PUBLIC_BASE_PATH = '/api/gyg'
export const GYG_INTEGRATOR_PATH = '/api/gyg/'
export const GYG_INTEGRATOR_PATH_WITH_VERSION = '/api/gyg/1'

export const GYG_SUPPLIER_ACTIONS = [
  'get-availabilities',
  'reserve',
  'cancel-reservation',
  'book',
  'cancel-booking',
] as const

const ACTION_SET = new Set<string>(GYG_SUPPLIER_ACTIONS)

export type GygGatewayMapResult =
  | { ok: true; kind: 'status' | 'gyg'; edgeTail: string; action?: string }
  | { ok: false; error: string }

export function mapGygGatewayPath(pathname: string): GygGatewayMapResult {
  const raw = String(pathname || '')
  const normalized = raw.split('?')[0].replace(/\/+$/, '') || '/'
  const prefix = GYG_PUBLIC_BASE_PATH
  if (normalized !== prefix && !normalized.startsWith(`${prefix}/`)) {
    return { ok: false, error: 'not_gyg_gateway' }
  }

  const rest = normalized === prefix ? '' : normalized.slice(prefix.length + 1)
  if (!rest || rest === 'status' || rest === 'health') {
    return { ok: true, kind: 'status', edgeTail: 'status' }
  }

  let actionPath = rest
  if (actionPath.startsWith('1/')) actionPath = actionPath.slice(2)
  actionPath = actionPath.replace(/\/+$/, '')

  if (!ACTION_SET.has(actionPath)) {
    return { ok: false, error: 'unsupported_endpoint' }
  }

  return {
    ok: true,
    kind: 'gyg',
    action: actionPath,
    edgeTail: `gyg/1/${actionPath}`,
  }
}

export function buildEdgeProxyUrl(supabaseUrl: string, edgeTail: string, search = ''): string {
  const base = String(supabaseUrl || '')
    .trim()
    .replace(/\/+$/, '')
  if (!base) throw new Error('supabase_url_missing')
  const tail = String(edgeTail || '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
  const q = search && search !== '?' ? search : ''
  return `${base}/functions/v1/shared-bookings-external/${tail}${q}`
}

export function gygIntegratorPortalConfig() {
  return {
    host: 'royalnordic.fi',
    port: 443 as const,
    path: GYG_INTEGRATOR_PATH,
    pathWithVersion: GYG_INTEGRATOR_PATH_WITH_VERSION,
    systemType: 'Custom system built for a single supplier',
    httpsOnly: true,
  }
}
