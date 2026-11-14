/**
 * Royal Nordic GYG API gateway path mapping (pure helpers).
 * Public base: /api/gyg/  →  Edge: shared-bookings-external/gyg/...
 * Official Supplier API requires the /1/ version segment.
 */

export const GYG_PUBLIC_BASE_PATH = '/api/gyg'
export const GYG_INTEGRATOR_PATH = '/api/gyg/'
export const GYG_INTEGRATOR_PATH_WITH_VERSION = '/api/gyg/1'

/** Mandatory Supplier API actions (official /1/ prefix). */
export const GYG_SUPPLIER_ACTIONS = [
  'get-availabilities',
  'reserve',
  'cancel-reservation',
  'book',
  'cancel-booking',
]

const ACTION_SET = new Set(GYG_SUPPLIER_ACTIONS)

/**
 * @param {string} pathname e.g. /api/gyg/1/get-availabilities/
 * @returns {{ ok: true, kind: 'status'|'gyg', edgeTail: string, action?: string } | { ok: false, error: string }}
 */
export function mapGygGatewayPath(pathname) {
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
    // Prefer official /1/ on the Edge function for Supplier API compatibility.
    edgeTail: `gyg/1/${actionPath}`,
  }
}

/**
 * @param {string} supabaseUrl
 * @param {string} edgeTail
 * @param {string} [search] including leading ?
 */
export function buildEdgeProxyUrl(supabaseUrl, edgeTail, search = '') {
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

/** Values to enter in GetYourGuide Integrator Portal after verification. */
export function gygIntegratorPortalConfig() {
  return {
    host: 'royalnordic.fi',
    port: 443,
    path: GYG_INTEGRATOR_PATH,
    pathWithVersion: GYG_INTEGRATOR_PATH_WITH_VERSION,
    systemType: 'Custom system built for a single supplier',
    httpsOnly: true,
  }
}
