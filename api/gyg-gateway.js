/**
 * GetYourGuide Supplier API gateway for royalnordic.fi.
 *
 * Public paths (via vercel.json rewrite):
 *   /api/gyg/status
 *   /api/gyg/1/get-availabilities|reserve|cancel-reservation|book|cancel-booking
 *
 * Proxies to Supabase Edge shared-bookings-external.
 * Basic Auth secrets stay in Supabase — never in the browser.
 *
 * Transport: Node (req, res) — matches working /api/admin and avoids Web-Handler
 * detection issues under the Vite framework preset.
 */

const GYG_PUBLIC_BASE_PATH = '/api/gyg'
const GYG_ACTIONS = new Set([
  'get-availabilities',
  'reserve',
  'cancel-reservation',
  'book',
  'cancel-booking',
])

function mapPath(pathname) {
  const normalized = String(pathname || '').split('?')[0].replace(/\/+$/, '') || '/'
  const prefix = GYG_PUBLIC_BASE_PATH
  if (normalized !== prefix && !normalized.startsWith(`${prefix}/`)) {
    return { ok: false, error: 'not_gyg_gateway' }
  }
  const rest = normalized === prefix ? '' : normalized.slice(prefix.length + 1)
  if (!rest || rest === 'status' || rest === 'health') {
    return { ok: true, kind: 'status', edgeTail: 'status' }
  }
  let action = rest.startsWith('1/') ? rest.slice(2) : rest
  action = action.replace(/\/+$/, '')
  if (!GYG_ACTIONS.has(action)) return { ok: false, error: 'unsupported_endpoint' }
  return { ok: true, kind: 'gyg', action, edgeTail: `gyg/1/${action}` }
}

function readHeader(req, name) {
  const v = req.headers[name.toLowerCase()]
  if (Array.isArray(v)) return v[0] || ''
  return v ? String(v) : ''
}

function sendJson(res, status, body, extraHeaders = {}) {
  res.statusCode = status
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('X-RN-GYG-Gateway', 'royalnordic-fi-v1')
  for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v)
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined
  if (Buffer.isBuffer(req.body)) return req.body
  if (typeof req.body === 'string') return Buffer.from(req.body)
  if (req.body && typeof req.body === 'object') return Buffer.from(JSON.stringify(req.body))
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept')
      res.setHeader('Access-Control-Max-Age', '86400')
      res.setHeader('Cache-Control', 'no-store')
      return res.end()
    }

    const host = readHeader(req, 'host') || 'royalnordic.fi'
    const proto = readHeader(req, 'x-forwarded-proto') || 'https'
    const url = new URL(req.url || '/', `${proto}://${host}`)
    const mapped = mapPath(url.pathname)

    if (!mapped.ok) {
      return sendJson(res, 404, {
        errorCode: 'INTERNAL_SYSTEM_FAILURE',
        errorMessage: 'Unsupported GetYourGuide gateway path',
      })
    }

    if (mapped.kind === 'gyg') {
      const authHeader = readHeader(req, 'authorization')
      if (!/^Basic\s+\S+/i.test(authHeader)) {
        return sendJson(
          res,
          401,
          { error: 'Unauthorized' },
          { 'WWW-Authenticate': 'Basic realm="GetYourGuide Supplier API"' },
        )
      }
    }

    const supabaseUrl = (
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      ''
    ).trim().replace(/\/+$/, '')
    const anon = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim()
    if (!supabaseUrl || !anon) {
      return sendJson(res, 503, {
        errorCode: 'INTERNAL_SYSTEM_FAILURE',
        errorMessage: 'GYG gateway misconfigured (Supabase URL/anon key missing)',
      })
    }

    const target = `${supabaseUrl}/functions/v1/shared-bookings-external/${mapped.edgeTail}${url.search || ''}`
    const headers = {
      apikey: anon,
      Accept: 'application/json',
    }
    const auth = readHeader(req, 'authorization')
    if (auth) headers.Authorization = auth
    const contentType = readHeader(req, 'content-type')
    if (contentType) headers['Content-Type'] = contentType

    const init = { method: req.method, headers }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = await readBody(req)
    }

    const upstream = await fetch(target, init)
    const buf = Buffer.from(await upstream.arrayBuffer())
    res.statusCode = upstream.status
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-RN-GYG-Gateway', 'royalnordic-fi-v1')
    const upstreamType = upstream.headers.get('content-type')
    if (upstreamType) res.setHeader('Content-Type', upstreamType)
    const www = upstream.headers.get('www-authenticate')
    if (www) res.setHeader('WWW-Authenticate', www)
    return res.end(buf)
  } catch (err) {
    console.error('gyg-gateway error', err && err.message ? err.message : err)
    return sendJson(res, 500, {
      errorCode: 'INTERNAL_SYSTEM_FAILURE',
      errorMessage: 'GYG gateway failed',
    })
  }
}
