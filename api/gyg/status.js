/**
 * Minimal probe — Node-style handler matching working /api/admin routes.
 * Confirms /api/gyg/* is wired before proxy logic is restored.
 */
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('X-RN-GYG-Gateway', 'royalnordic-fi-v1')
  return res.status(200).json({
    ok: true,
    gateway: 'gyg',
    path: '/api/gyg/status',
    note: 'probe',
  })
}
