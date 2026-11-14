/**
 * GYG gateway shared logic for Vercel Functions (Web Handler).
 */

export const GYG_PUBLIC_BASE_PATH = '/api/gyg'

export const GYG_SUPPLIER_ACTIONS = [
  'get-availabilities',
  'reserve',
  'cancel-reservation',
  'book',
  'cancel-booking',
]

const ACTION_SET = new Set(GYG_SUPPLIER_ACTIONS)

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
])

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
    edgeTail: `gyg/1/${actionPath}`,
  }
}

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

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
      'X-RN-GYG-Gateway': 'royalnordic-fi-v1',
    },
  })
}

function supabaseConfig() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim()
  const anon = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim()
  return { url, anon }
}

export async function proxyGygGateway(request, pathnameOverride) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
        'Access-Control-Max-Age': '86400',
        'Cache-Control': 'no-store',
      },
    })
  }

  const url = new URL(request.url)
  const pathname = pathnameOverride || url.pathname
  const mapped = mapGygGatewayPath(pathname)
  if (!mapped.ok) {
    return json(404, {
      errorCode: 'INTERNAL_SYSTEM_FAILURE',
      errorMessage: 'Unsupported GetYourGuide gateway path',
    })
  }

  if (mapped.kind === 'gyg') {
    const authHeader = request.headers.get('authorization') || ''
    if (!/^Basic\s+\S+/i.test(authHeader)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
          'WWW-Authenticate': 'Basic realm="GetYourGuide Supplier API"',
          'X-RN-GYG-Gateway': 'royalnordic-fi-v1',
        },
      })
    }
  }

  const { url: supabaseUrl, anon } = supabaseConfig()
  if (!supabaseUrl || !anon) {
    return json(503, {
      errorCode: 'INTERNAL_SYSTEM_FAILURE',
      errorMessage: 'GYG gateway misconfigured (Supabase URL/anon key missing)',
    })
  }

  let target
  try {
    target = buildEdgeProxyUrl(supabaseUrl, mapped.edgeTail, url.search)
  } catch {
    return json(503, {
      errorCode: 'INTERNAL_SYSTEM_FAILURE',
      errorMessage: 'GYG gateway misconfigured',
    })
  }

  const headers = new Headers()
  headers.set('apikey', anon)
  headers.set('Accept', 'application/json')
  const auth = request.headers.get('authorization')
  if (auth) headers.set('Authorization', auth)
  const contentType = request.headers.get('content-type')
  if (contentType) headers.set('Content-Type', contentType)

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer()
  }

  let upstream
  try {
    upstream = await fetch(target, init)
  } catch {
    return json(502, {
      errorCode: 'INTERNAL_SYSTEM_FAILURE',
      errorMessage: 'Upstream Shared Bookings endpoint unreachable',
    })
  }

  const outHeaders = new Headers()
  upstream.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return
    outHeaders.set(key, value)
  })
  outHeaders.set('Cache-Control', 'no-store')
  outHeaders.set('X-RN-GYG-Gateway', 'royalnordic-fi-v1')

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  })
}

export function gygHandler(pathname) {
  return async function handler(request) {
    return proxyGygGateway(request, pathname)
  }
}
